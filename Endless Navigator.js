// Endless Navigator - 主AI助手界面
import React, { useState, useEffect, useRef } from 'react';
import { useWallet, WalletSelector } from "@endless-wallet/wallet-adapter-react";
import { EndlessClient } from '@endless/sdk';
import { marked } from 'marked';
import './EndlessNavigator.css';

const EndlessNavigator = () => {
  const { connected, account } = useWallet();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentContext, setCurrentContext] = useState('general');
  const [learningPath, setLearningPath] = useState(null);
  const [quickActions, setQuickActions] = useState([]);
  const [userLevel, setUserLevel] = useState(1);
  const messagesEndRef = useRef(null);
  
  const endlessClient = new EndlessClient({
    network: 'mainnet',
    nodeUrl: 'https://mainnet.endless.link'
  });

  // 初始化问候消息
  const initialGreeting = {
    id: 1,
    text: `👋 你好！我是Endless Navigator，你的智能生态向导！

我会帮助你：
1. 📚 **了解Endless** - 解释Endless是什么，解决了Web3什么核心问题
2. 🚀 **参与社区** - 指导你如何参与Endless生态建设
3. 🛠 **使用产品** - 一步步教你使用钱包、Luffa、DEX等所有生态产品
4. 🔄 **跨链操作** - 指导你将资产跨链到Endless链

你现在想了解什么？或者可以直接问我具体问题！`,
    sender: 'assistant',
    timestamp: new Date(),
    quickReplies: [
      { text: 'Endless是做什么的？', action: 'explain_endless' },
      { text: '如何将ETH跨链到Endless？', action: 'cross_chain_tutorial' },
      { text: '教我使用Endless钱包', action: 'wallet_tutorial' },
      { text: '我想参与社区治理', action: 'governance_guide' }
    ]
  };

  useEffect(() => {
    // 加载初始问候
    setMessages([initialGreeting]);
    
    // 如果用户已连接钱包，加载个性化数据
    if (connected && account?.address) {
      loadUserLearningPath(account.address);
      loadContextualQuickActions(account.address);
    }
  }, [connected, account?.address]);

  // 加载用户学习路径
  const loadUserLearningPath = async (userAddress) => {
    try {
      const path = await endlessClient.view({
        moduleAddress: '0x...navigator_contract...',
        moduleName: 'knowledge_base',
        functionName: 'get_personalized_learning_path',
        typeArguments: [],
        arguments: [userAddress]
      });
      setLearningPath(path);
      
      // 根据学习路径计算用户等级
      const level = calculateUserLevel(path);
      setUserLevel(level);
    } catch (error) {
      console.log('未找到用户学习路径，将使用默认路径');
    }
  };

  // 根据上下文加载快速操作
  const loadContextualQuickActions = (userAddress) => {
    // 模拟数据，实际中会从智能合约获取
    const actions = [
      { icon: '🔗', text: '跨链资产到Endless', action: 'cross_chain_start' },
      { icon: '💬', text: '设置Luffa个人资料', action: 'luffa_profile_setup' },
      { icon: '🏦', text: '参与DeFi流动性挖矿', action: 'defi_liquidity_mining' },
      { icon: '🖼', text: '浏览Endless NFT市场', action: 'nft_marketplace_tour' },
      { icon: '📊', text: '使用Endless浏览器', action: 'explorer_tutorial' },
      { icon: '🎮', text: '体验Endless小游戏', action: 'minigame_experience' }
    ];
    setQuickActions(actions);
  };

  // 发送消息给AI助手
  const sendMessage = async (text, isQuickReply = false) => {
    if (!text.trim()) return;
    
    // 添加用户消息
    const userMessage = {
      id: messages.length + 1,
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    // 显示AI正在输入
    setIsTyping(true);
    
    try {
      // 获取智能回答
      const response = await getAIResponse(text, currentContext);
      
      // 添加AI回复
      const aiMessage = {
        id: messages.length + 2,
        text: response.answer,
        sender: 'assistant',
        timestamp: new Date(),
        quickReplies: response.quickReplies,
        suggestedActions: response.suggestedActions,
        isInteractive: response.isInteractive
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // 如果有上下文更新
      if (response.newContext) {
        setCurrentContext(response.newContext);
        loadContextualQuickActions(account?.address);
      }
      
      // 如果AI建议了具体操作，显示操作面板
      if (response.actionType) {
        showActionPanel(response.actionType, response.actionParams);
      }
    } catch (error) {
      console.error('获取AI回复失败:', error);
      
      // 显示错误消息
      const errorMessage = {
        id: messages.length + 2,
        text: '抱歉，我暂时无法回答这个问题。你可以尝试重新提问，或者从下面的快速选项中选择一个常见问题。',
        sender: 'assistant',
        timestamp: new Date(),
        quickReplies: initialGreeting.quickReplies
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // 获取AI回复（模拟）
  const getAIResponse = async (question, context) => {
    // 在实际实现中，这里会调用后端AI服务
    // 现在我们先模拟一些常见问题的回答
    
    const responses = {
      // Endless是什么
      'Endless是做什么的': {
        answer: `**Endless Web3 Genesis Cloud** 是全球首个分布式云智能组件协议，它解决了Web3生态的三大核心问题：

**🔧 技术门槛高**
- 传统Web3开发需要学习Solidity等新语言
- Endless提供多语言SDK，让Web2开发者无缝迁移
- 模块化组件，像搭积木一样构建DApp

**🛡 安全与隐私缺失**
- 传统Web3应用常忽视用户隐私
- Endless采用零知识证明、端到端加密
- 用户完全掌控自己的数据和资产

**🌉 用户体验割裂**
- 钱包、DApp、跨链操作复杂
- Endless提供无缝的统一体验
- 支持无密钥登录、赞助交易等

**简单来说，Endless让Web3变得像Web2一样简单易用，同时保持了去中心化和安全的优势！**`,
        quickReplies: [
          { text: '听起来很棒！怎么开始使用？', action: 'get_started' },
          { text: '能举个例子说明吗？', action: 'example_use_case' },
          { text: 'Endless和其他公链有什么不同？', action: 'comparison' }
        ],
        newContext: 'understanding_endless'
      },
      
      // 如何跨链
      '如何将ETH跨链到Endless': {
        answer: `**将ETH跨链到Endless链的完整教程**：

**步骤1: 准备工作**
1. 安装并设置好Endless钱包
2. 确保你的以太坊钱包有少量ETH作为Gas费
3. 准备好要跨链的ETH

**步骤2: 访问跨链桥**
1. 打开 [Endless Bridge](https://bridge.endless.link)
2. 连接你的以太坊钱包和Endless钱包
3. 选择"从以太坊到Endless"的方向

**步骤3: 执行跨链**
1. 输入要跨链的ETH数量
2. 确认跨链费用（通常0.1-0.3%）
3. 在以太坊钱包中确认交易
4. 等待约5-15分钟确认时间

**步骤4: 验证到账**
1. 交易确认后，ETH会自动转换为WETH（Endless链上的包装ETH）
2. 在Endless钱包中查看WETH余额
3. 可以立即在Endless DEX中交易或使用

💡 **小贴士**：
- 首次跨链建议先小额测试
- 跨链期间不要关闭页面
- 有问题可以随时联系社区支持

**需要我一步步指导你操作吗？**`,
        quickReplies: [
          { text: '是的，请指导我操作', action: 'guided_cross_chain' },
          { text: '跨链费用是多少？', action: 'bridge_fees' },
          { text: '什么是WETH？', action: 'explain_weth' }
        ],
        newContext: 'cross_chain_tutorial',
        isInteractive: true
      },
      
      // 钱包使用教程
      '教我使用Endless钱包': {
        answer: `**Endless钱包使用全指南** 📱

**✨ 主要功能**：
1. **资产管理** - 查看余额、发送接收代币
2. **DeFi集成** - 直接在钱包中参与流动性挖矿
3. **NFT管理** - 查看、发送、展示你的NFT
4. **DApp连接** - 一键连接Endless生态所有应用
5. **社交恢复** - 通过好友网络恢复账户（可选）

**📝 基础操作**：

**1. 发送代币**
1. 点击"发送"按钮
2. 输入接收地址或扫描二维码
3. 输入金额，选择代币类型
4. 确认Gas费并发送

**2. 接收代币**
1. 点击"接收"按钮
2. 分享你的地址或二维码
3. 也可以直接复制地址发给对方

**3. 连接DApp**
1. 访问任意Endless生态DApp
2. 点击"连接钱包"
3. 选择Endless钱包并授权
4. 完成！现在可以在DApp中操作了

**4. 查看交易记录**
1. 进入"交易历史"标签
2. 查看所有进出记录
3. 点击任意交易查看详情

**🎯 高级功能**（等你熟悉基础后再探索）：
- 多签钱包设置
- 自动化投资策略
- 跨链资产管理

**需要我演示具体操作吗？**`,
        quickReplies: [
          { text: '演示发送代币', action: 'demo_send_token' },
          { text: '如何连接Luffa？', action: 'connect_luffa' },
          { text: '钱包安全设置', action: 'wallet_security' }
        ],
        newContext: 'wallet_tutorial',
        isInteractive: true
      }
    };
    
    // 简单的问题匹配（实际中会用更复杂的NLP）
    for (const [key, response] of Object.entries(responses)) {
      if (question.includes(key) || key.includes(question)) {
        return response;
      }
    }
    
    // 默认回答
    return {
      answer: `我理解你想了解"${question}"，但我需要更多信息来提供准确回答。

你可以：
1. 重新表述你的问题
2. 从下面的快速选项中选择
3. 告诉我你想完成什么具体任务

我会尽我所能帮助你！`,
      quickReplies: initialGreeting.quickReplies
    };
  };

  // 执行交互式操作
  const executeInteractiveAction = async (actionType, params = {}) => {
    switch (actionType) {
      case 'demo_send_token':
        return await startSendTokenDemo();
      case 'guided_cross_chain':
        return await startCrossChainGuide();
      case 'luffa_profile_setup':
        return await startLuffaProfileSetup();
      default:
        console.log(`执行操作: ${actionType}`, params);
    }
  };

  // 开始发送代币演示
  const startSendTokenDemo = async () => {
    const demoSteps = [
      {
        title: '步骤1: 打开发送界面',
        instruction: '在Endless钱包中，点击底部导航栏的"发送"按钮',
        image: '/demo/wallet-send-button.png',
        action: 'open_wallet_send'
      },
      {
        title: '步骤2: 输入接收地址',
        instruction: '输入测试地址：0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        image: '/demo/wallet-address-input.png',
        action: 'input_demo_address'
      },
      {
        title: '步骤3: 输入金额',
        instruction: '输入0.001 EDS作为测试金额',
        image: '/demo/wallet-amount-input.png',
        action: 'input_demo_amount'
      },
      {
        title: '步骤4: 确认发送',
        instruction: '点击"确认发送"，查看交易详情',
        image: '/demo/wallet-confirm-send.png',
        action: 'confirm_send'
      }
    ];
    
    // 显示交互式教程
    showInteractiveTutorial('发送代币演示', demoSteps);
  };

  // 显示交互式教程
  const showInteractiveTutorial = (title, steps) => {
    const tutorialMessage = {
      id: messages.length + 1,
      text: `**${title}**\n\n让我们一步步学习：`,
      sender: 'assistant',
      timestamp: new Date(),
      isTutorial: true,
      tutorialSteps: steps,
      currentStep: 0
    };
    
    setMessages(prev => [...prev, tutorialMessage]);
  };

  // 渲染消息内容
  const renderMessageContent = (message) => {
    if (message.isTutorial) {
      return (
        <div className="tutorial-container">
          <div dangerouslySetInnerHTML={{ __html: marked(message.text) }} />
          {message.tutorialSteps && (
            <div className="tutorial-steps">
              {message.tutorialSteps.map((step, index) => (
                <div key={index} className={`tutorial-step ${index === message.currentStep ? 'active' : ''}`}>
                  <h4>{step.title}</h4>
                  <p>{step.instruction}</p>
                  {step.image && <img src={step.image} alt={step.title} />}
                  {index === message.currentStep && (
                    <button onClick={() => executeTutorialStep(step.action)}>
                      执行此步骤
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    return <div dangerouslySetInnerHTML={{ __html: marked(message.text) }} />;
  };

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="endless-navigator">
      {/* 头部 */}
      <header className="navigator-header">
        <div className="header-left">
          <div className="navigator-avatar">🤖</div>
          <div className="header-info">
            <h1>Endless Navigator</h1>
            <p>你的智能生态向导 · 用户等级: {userLevel}/10</p>
          </div>
        </div>
        <div className="header-right">
          <WalletSelector />
          <button className="context-switcher">
            当前: {getContextLabel(currentContext)} ▼
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* 左侧：聊天主界面 */}
        <div className="chat-container">
          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-header">
                  <span className="message-sender">
                    {message.sender === 'user' ? '你' : 'Endless Navigator'}
                  </span>
                  <span className="message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="message-content">
                  {renderMessageContent(message)}
                </div>
                
                {/* 快速回复按钮 */}
                {message.quickReplies && (
                  <div className="quick-replies">
                    {message.quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        className="quick-reply-btn"
                        onClick={() => sendMessage(reply.text, true)}
                      >
                        {reply.text}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* 建议操作 */}
                {message.suggestedActions && (
                  <div className="suggested-actions">
                    <h4>建议操作:</h4>
                    {message.suggestedActions.map((action, index) => (
                      <button
                        key={index}
                        className="action-btn"
                        onClick={() => executeInteractiveAction(action.type, action.params)}
                      >
                        {action.icon} {action.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="typing-indicator">
                <span>Endless Navigator正在思考</span>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* 输入区域 */}
          <div className="input-container">
            <div className="quick-actions-bar">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  className="quick-action"
                  onClick={() => executeInteractiveAction(action.action)}
                >
                  <span className="action-icon">{action.icon}</span>
                  <span className="action-text">{action.text}</span>
                </button>
              ))}
            </div>
            
            <div className="input-wrapper">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputText)}
                placeholder="输入你的问题... (例如：如何参与流动性挖矿？)"
              />
              <button 
                className="send-btn"
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                发送
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：学习面板和工具 */}
        <div className="side-panel">
          {/* 学习进度 */}
          <div className="learning-progress">
            <h3>🎯 学习进度</h3>
            {learningPath ? (
              <div className="progress-details">
                <div className="level-indicator">
                  <div className="level-bar">
                    <div 
                      className="level-fill" 
                      style={{ width: `${userLevel * 10}%` }}
                    />
                  </div>
                  <span className="level-text">等级 {userLevel}/10</span>
                </div>
                
                <div className="pending-tasks">
                  <h4>待完成任务:</h4>
                  {learningPath.slice(0, 3).map((task, index) => (
                    <div key={index} className="task-item">
                      <span className="task-name">{task.description}</span>
                      <span className="task-app">{task.related_app}</span>
                    </div>
                  ))}
                  {learningPath.length > 3 && (
                    <button className="view-all-tasks">查看全部 ({learningPath.length})</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-progress">
                <p>开始与Navigator对话，开启你的学习之旅！</p>
                <button onClick={() => sendMessage('我想学习Endless生态', true)}>
                  开始学习
                </button>
              </div>
            )}
          </div>
          
          {/* 生态应用快速入口 */}
          <div className="ecosystem-quick-access">
            <h3>🚀 快速访问</h3>
            <div className="app-grid">
              <button className="app-card" onClick={() => window.open('https://wallet.endless.link', '_blank')}>
                <div className="app-icon">👛</div>
                <div className="app-name">钱包</div>
              </button>
              <button className="app-card" onClick={() => window.open('https://scan.endless.link', '_blank')}>
                <div className="app-icon">🔍</div>
                <div className="app-name">浏览器</div>
              </button>
              <button className="app-card" onClick={() => window.open('https://luffa.im', '_blank')}>
                <div className="app-icon">💬</div>
                <div className="app-name">Luffa</div>
              </button>
              <button className="app-card" onClick={() => window.open('https://bridge.endless.link', '_blank')}>
                <div className="app-icon">🔗</div>
                <div className="app-name">跨链桥</div>
              </button>
              <button className="app-card" onClick={() => window.open('https://dex.endless.link', '_blank')}>
                <div className="app-icon">🔄</div>
                <div className="app-name">DEX</div>
              </button>
              <button className="app-card" onClick={() => window.open('https://nft.endless.link', '_blank')}>
                <div className="app-icon">🖼</div>
                <div className="app-name">NFT市场</div>
              </button>
            </div>
          </div>
          
          {/* 常见问题 */}
          <div className="faq-section">
            <h3>❓ 常见问题</h3>
            <div className="faq-list">
              <button onClick={() => sendMessage('Endless是做什么的？', true)}>
                Endless解决了Web3的什么问题？
              </button>
              <button onClick={() => sendMessage('如何免费获得EDS代币？', true)}>
                如何免费获得EDS代币？
              </button>
              <button onClick={() => sendMessage('Luffa和微信有什么不同？', true)}>
                Luffa和微信有什么不同？
              </button>
              <button onClick={() => sendMessage('Endless钱包安全吗？', true)}>
                Endless钱包安全吗？
              </button>
              <button onClick={() => sendMessage('如何参与社区治理？', true)}>
                如何参与社区治理？
              </button>
              <button onClick={() => sendMessage('Endless有手机App吗？', true)}>
                Endless有手机App吗？
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部：跨平台入口 */}
      <div className="platform-footer">
        <h4>📱 在其他平台使用Endless Navigator:</h4>
        <div className="platform-links">
          <button className="platform-btn">
            <span>Discord</span>
            <small>机器人已就绪</small>
          </button>
          <button className="platform-btn">
            <span>Luffa</span>
            <small>内置助手</small>
          </button>
          <button className="platform-btn">
            <span>Endless钱包</span>
            <small>集成中</small>
          </button>
          <button className="platform-btn">
            <span>Telegram</span>
            <small>即将推出</small>
          </button>
        </div>
      </div>
    </div>
  );
};

// 辅助函数
const getContextLabel = (context) => {
  const labels = {
    'general': '通用',
    'understanding_endless': '了解Endless',
    'cross_chain_tutorial': '跨链教程',
    'wallet_tutorial': '钱包教程',
    'defi_learning': 'DeFi学习',
    'nft_exploration': 'NFT探索',
    'social_engagement': '社交参与'
  };
  return labels[context] || context;
};

const calculateUserLevel = (learningPath) => {
  if (!learningPath || learningPath.length === 0) return 1;
  
  const completedTasks = learningPath.filter(task => task.status === 2).length;
  const totalTasks = learningPath.length;
  
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
  
  // 1-10等级，基于完成率
  return Math.max(1, Math.min(10, Math.floor(completionRate * 10) + 1));
};

export default EndlessNavigator;
