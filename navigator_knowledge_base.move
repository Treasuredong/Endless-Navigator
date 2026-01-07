// navigator_knowledge_base.move - 链上知识库与交互记录合约
module navigator::knowledge_base {
    use std::vector;
    use std::string;
    use std::signer;
    use std::option;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    
    struct UserInteraction has key {
        user_address: address,
        interaction_id: u64,
        question: string::String,
        intent: string::String, // 分类：了解、操作、故障、建议等
        context: string::String, // 上下文：钱包、浏览器、Luffa等
        timestamp: u64,
        response_quality: u8, // 用户反馈的质量评分 1-5
        follow_up_actions: vector<string::String> // 后续建议的操作
    }
    
    struct KnowledgeEntry has key {
        entry_id: u64,
        category: string::String, // onboarding, wallet, defi, nft, social
        subcategory: string::String,
        question_patterns: vector<string::String>, // 匹配的问题模式
        answer: string::String,
        answer_type: string::String, // text, step_by_step, video, interactive
        required_prerequisites: vector<string::String>, // 前置知识
        difficulty_level: u8, // 1-5，难度等级
        last_updated: u64,
        view_count: u64,
        helpful_count: u64,
        tags: vector<string::String>
    }
    
    struct UserLearningPath has key {
        user_address: address,
        current_level: u8, // 用户熟练度等级 1-10
        completed_guides: vector<u64>, // 完成的学习指南ID
        pending_actions: vector<PendingAction>,
        skill_scores: vector<SkillScore>,
        preferred_learning_style: string::String, // visual, text, video, interactive
        last_active: u64
    }
    
    struct PendingAction has store {
        action_id: u64,
        action_type: string::String,
        description: string::String,
        related_app: string::String,
        estimated_time: u64, // 预计完成时间（分钟）
        difficulty: u8,
        prerequisites: vector<string::String>,
        status: u8 // 0=未开始，1=进行中，2=已完成
    }
    
    struct SkillScore has store {
        skill_name: string::String,
        score: u64, // 0-100
        last_practiced: u64,
        confidence_level: u8 // 用户自信度 1-5
    }
    
    struct CrossPlatformSession has key {
        session_id: string::String,
        user_address: address,
        platform: string::String, // wallet, browser, luffa, discord
        current_context: string::String,
        conversation_history: vector<ConversationTurn>,
        started_at: u64,
        last_activity: u64,
        active: bool
    }
    
    struct ConversationTurn has store {
        turn_id: u64,
        user_input: string::String,
        assistant_response: string::String,
        action_taken: bool,
        successful: bool,
        timestamp: u64
    }
    
    // 记录用户交互
    public entry fun record_interaction(
        user: &signer,
        question: string::String,
        intent: string::String,
        context: string::String
    ) acquires UserInteraction, UserLearningPath {
        let user_addr = signer::address_of(user);
        let interaction_id = generate_interaction_id();
        
        let interaction = UserInteraction {
            user_address: user_addr,
            interaction_id,
            question: copy question,
            intent: copy intent,
            context: copy context,
            timestamp: timestamp::now_seconds(),
            response_quality: 0, // 初始为0，用户反馈后更新
            follow_up_actions: vector::empty<string::String>()
        };
        
        move_to(user, interaction);
        
        // 更新用户学习路径
        if (!exists<UserLearningPath>(user_addr)) {
            initialize_learning_path(user_addr);
        }
        
        let learning_path = borrow_global_mut<UserLearningPath>(user_addr);
        learning_path.last_active = timestamp::now_seconds();
        
        // 根据交互内容推荐后续学习
        let recommended_actions = recommend_next_actions(intent, context);
        if (vector::length(&recommended_actions) > 0) {
            add_pending_actions(user_addr, recommended_actions);
        }
        
        emit_event(InteractionRecorded {
            user: user_addr,
            interaction_id,
            intent: copy intent
        });
    }
    
    // 获取智能回答
    public fun get_intelligent_response(
        user_addr: address,
        question: string::String,
        context: string::String
    ): string::String acquires KnowledgeEntry, UserLearningPath {
        // 1. 意图识别
        let intent = classify_intent(question);
        
        // 2. 获取用户学习水平
        let user_level = 1; // 默认
        if (exists<UserLearningPath>(user_addr)) {
            let learning_path = borrow_global<UserLearningPath>(user_addr);
            user_level = learning_path.current_level;
        }
        
        // 3. 搜索知识库
        let best_match = find_best_knowledge_match(question, intent, context, user_level);
        
        // 4. 个性化调整回答
        let personalized_answer = personalize_answer(
            copy best_match.answer,
            user_addr,
            context
        );
        
        // 5. 添加上下文相关建议
        let enhanced_answer = add_contextual_suggestions(
            personalized_answer,
            user_addr,
            context
        );
        
        enhanced_answer
    }
    
    // 创建交互式学习指南
    public entry fun create_interactive_guide(
        creator: &signer,
        title: string::String,
        steps: vector<GuideStep>,
        target_skill: string::String,
        prerequisites: vector<string::String>,
        estimated_time: u64
    ) acquires KnowledgeEntry {
        let creator_addr = signer::address_of(creator);
        
        // 验证创建者权限（可以是核心团队或社区专家）
        assert!(can_create_guide(creator_addr), EUNAUTHORIZED);
        
        let guide_id = generate_guide_id();
        let guide_content = format_interactive_guide(steps);
        
        let entry = KnowledgeEntry {
            entry_id: guide_id,
            category: "interactive_guide",
            subcategory: target_skill,
            question_patterns: vector::empty<string::String>(),
            answer: guide_content,
            answer_type: "interactive",
            required_prerequisites: prerequisites,
            difficulty_level: calculate_difficulty(steps),
            last_updated: timestamp::now_seconds(),
            view_count: 0,
            helpful_count: 0,
            tags: vector::empty<string::String>()
        };
        
        move_to(creator, entry);
        
        emit_event(InteractiveGuideCreated {
            guide_id,
            creator: creator_addr,
            title: copy title,
            skill: copy target_skill
        });
    }
    
    // 完成学习步骤
    public entry fun complete_learning_step(
        user: &signer,
        guide_id: u64,
        step_index: u64,
        success: bool
    ) acquires UserLearningPath, KnowledgeEntry {
        let user_addr = signer::address_of(user);
        
        assert!(exists<UserLearningPath>(user_addr), ENO_LEARNING_PATH);
        let learning_path = borrow_global_mut<UserLearningPath>(user_addr);
        
        // 更新用户技能分数
        if (success) {
            update_skill_score(user_addr, guide_id, step_index);
            
            // 添加到完成列表
            if (!vector::contains(&learning_path.completed_guides, &guide_id)) {
                vector::push_back(&mut learning_path.completed_guides, guide_id);
            }
            
            // 更新用户等级
            let new_level = calculate_user_level(learning_path);
            learning_path.current_level = new_level;
        }
        
        // 更新知识库的统计数据
        if (exists<KnowledgeEntry>(get_knowledge_address(guide_id))) {
            let entry = borrow_global_mut<KnowledgeEntry>(get_knowledge_address(guide_id));
            if (success) {
                entry.helpful_count = entry.helpful_count + 1;
            }
            entry.view_count = entry.view_count + 1;
        }
        
        emit_event(LearningStepCompleted {
            user: user_addr,
            guide_id,
            step_index,
            success
        });
    }
    
    // 跨平台会话同步
    public entry fun sync_cross_platform_session(
        user: &signer,
        session_id: string::String,
        platform: string::String,
        context: string::String
    ) acquires CrossPlatformSession {
        let user_addr = signer::address_of(user);
        
        // 查找现有会话或创建新会话
        if (exists<CrossPlatformSession>(user_addr)) {
            let session = borrow_global_mut<CrossPlatformSession>(user_addr);
            session.platform = platform;
            session.current_context = context;
            session.last_activity = timestamp::now_seconds();
        } else {
            let session = CrossPlatformSession {
                session_id: copy session_id,
                user_address: user_addr,
                platform: copy platform,
                current_context: copy context,
                conversation_history: vector::empty<ConversationTurn>(),
                started_at: timestamp::now_seconds(),
                last_activity: timestamp::now_seconds(),
                active: true
            };
            move_to(user, session);
        }
        
        emit_event(SessionSynced {
            user: user_addr,
            platform: copy platform,
            context: copy context
        });
    }
    
    // 获取个性化学习路径
    public fun get_personalized_learning_path(
        user_addr: address
    ): vector<PendingAction> acquires UserLearningPath {
        if (!exists<UserLearningPath>(user_addr)) {
            return vector::empty<PendingAction>()
        };
        
        let learning_path = borrow_global<UserLearningPath>(user_addr);
        copy learning_path.pending_actions
    }
}
