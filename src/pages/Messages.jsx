import { useState, useEffect, useRef, useCallback } from 'react';
import { messageAPI } from '../utils/api';
import wsClient from '../utils/websocket';
import './Messages.css';

const Messages = () => {
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('conversations'); // 'conversations' 或 'contacts'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // 获取当前用户ID
  const getCurrentUserId = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  };

  // 获取当前用户信息
  const getCurrentUser = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  };

  const currentUserId = getCurrentUserId();
  const currentUser = getCurrentUser();

  // 加载未读消息数量
  const loadUnreadCount = async () => {
    try {
      const result = await messageAPI.getUnreadCount();
      setUnreadCount(result.data?.unread_count || 0);
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  };

  // 加载对话列表
  const loadConversations = async () => {
    try {
      setLoading(true);
      const result = await messageAPI.getConversations();
      setConversations(result.data || []);
    } catch (error) {
      console.error('加载对话列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载通讯录
  const loadContacts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchKeyword) {
        params.search = searchKeyword;
      }
      const result = await messageAPI.getContacts(params);
      setContacts(result.data || []);
    } catch (error) {
      console.error('加载通讯录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载消息记录
  const loadMessages = async (userId) => {
    try {
      setLoading(true);
      const result = await messageAPI.getMessages(userId);
      setMessages(result.data || []);
      // 滚动到底部
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 发送消息
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedContact && !selectedConversation) return;

    try {
      const receiverId = selectedContact?.id || selectedConversation?.other_user_id;
      const content = messageInput.trim();

      // 通过 WebSocket 实时发送（乐观更新）
      wsClient.sendMessage(currentUserId, receiverId, content);

      // 也调用 API 保存到数据库
      await messageAPI.send({
        receiver_id: receiverId,
        content
      });

      setMessageInput('');
      // 重新加载消息和对话列表
      await loadMessages(receiverId);
      await loadConversations();
      await loadUnreadCount();
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送失败');
    }
  };

  // 选择对话
  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setSelectedContact({
      id: conversation.other_user_id,
      username: conversation.other_username,
      email: conversation.other_email,
      employee_name: conversation.other_employee_name
    });
    await loadMessages(conversation.other_user_id);
  };

  // 选择联系人
  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    setSelectedConversation(null);
    await loadMessages(contact.id);
  };

  // 切换标签
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedContact(null);
    setSelectedConversation(null);
    setMessages([]);
    if (tab === 'conversations') {
      loadConversations();
    } else {
      loadContacts();
    }
  };

  // 删除消息
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('确定要删除这条消息吗？')) return;

    try {
      await messageAPI.delete(messageId);
      // 重新加载消息
      const userId = selectedContact?.id || selectedConversation?.other_user_id;
      if (userId) {
        await loadMessages(userId);
      }
      await loadConversations();
    } catch (error) {
      console.error('删除消息失败:', error);
      alert('删除失败');
    }
  };

  // 退出登录
  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  // 返回工作台
  const handleBack = () => {
    window.location.href = '/home';
  };

  // WebSocket 消息接收处理
  const handleReceiveMessage = useCallback((data) => {
    console.log('收到新消息:', data);
    
    // 如果当前正在与发送者聊天，添加消息到列表
    const isCurrentChat = 
      (selectedContact && selectedContact.id === data.sender_id) ||
      (selectedConversation && selectedConversation.other_user_id === data.sender_id);
    
    if (isCurrentChat) {
      setMessages(prev => [...prev, data]);
      // 滚动到底部
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      // 自动标记为已读
      loadMessages(data.sender_id);
    }
    
    // 刷新对话列表和未读数量
    loadConversations();
    loadUnreadCount();
  }, [selectedContact, selectedConversation]);

  // 处理消息已读
  const handleMessageRead = useCallback((data) => {
    console.log('消息已读:', data);
    // 可以更新UI显示对方已读
  }, []);

  // 初始化 WebSocket 连接
  useEffect(() => {
    if (currentUserId && currentUser?.username) {
      const token = sessionStorage.getItem('token');
      if (token) {
        wsClient.connect(token, currentUserId, currentUser.username);
      }
    }

    return () => {
      wsClient.disconnect();
    };
  }, [currentUserId, currentUser]);

  // 注册 WebSocket 事件监听
  useEffect(() => {
    wsClient.on('message:receive', handleReceiveMessage);
    wsClient.on('message:read', handleMessageRead);

    return () => {
      wsClient.off('message:receive', handleReceiveMessage);
      wsClient.off('message:read', handleMessageRead);
    };
  }, [handleReceiveMessage, handleMessageRead]);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    if (activeTab === 'contacts' && searchKeyword) {
      const timer = setTimeout(() => loadContacts(), 300);
      return () => clearTimeout(timer);
    } else if (activeTab === 'contacts') {
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, searchKeyword]);

  // 格式化时间
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 86400000 * 2) {
      return '昨天';
    } else {
      return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    }
  };

  return (
    <div className="messages-page standalone">
      <div className="messages-topbar">
        <div className="topbar-left">
          <button className="back-btn" onClick={handleBack}>
            返回工作台
          </button>
          <h1>💬 消息中心</h1>
        </div>
        <div className="topbar-right">
          <div className="notifications">
            <span>🔔</span>
            {unreadCount > 0 && <div className="badge">{unreadCount}</div>}
          </div>
          <div className="user-info">
            <div className="user-avatar">
              {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="username">{currentUser?.username || '用户'}</span>
            <button className="logout-btn" onClick={handleLogout}>
              退出
            </button>
          </div>
        </div>
      </div>

      <div className="messages-container">
        <div className="messages-sidebar">
          <div className="messages-tabs">
            <button
              className={`tab-btn ${activeTab === 'conversations' ? 'active' : ''}`}
              onClick={() => handleTabChange('conversations')}
            >
              对话列表
              {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
              onClick={() => handleTabChange('contacts')}
            >
              通讯录
            </button>
          </div>

          {activeTab === 'contacts' && (
            <div className="search-box">
              <input
                type="text"
                placeholder="搜索联系人..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
          )}

          <div className="messages-list">
            {loading ? (
              <div className="loading">加载中...</div>
            ) : activeTab === 'conversations' ? (
              conversations.length > 0 ? (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="contact-avatar">
                      {conv.other_employee_name?.charAt(0) || conv.other_username?.charAt(0) || '?'}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">
                        {conv.other_employee_name || conv.other_username}
                      </div>
                      <div className="last-message">
                        {conv.last_message}
                      </div>
                    </div>
                    <div className="contact-meta">
                      <div className="message-time">
                        {conv.last_message_time ? formatTime(conv.last_message_time) : ''}
                      </div>
                      {conv.unread_count > 0 && (
                        <div className="unread-badge">{conv.unread_count}</div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无对话</div>
              )
            ) : (
              contacts.length > 0 ? (
                contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`contact-item ${selectedContact?.id === contact.id ? 'active' : ''}`}
                    onClick={() => handleSelectContact(contact)}
                  >
                    <div className="contact-avatar">
                      {contact.employee_name?.charAt(0) || contact.username?.charAt(0) || '?'}
                    </div>
                    <div className="contact-info">
                      <div className="contact-name">
                        {contact.employee_name || contact.username}
                      </div>
                      <div className="contact-details">
                        {contact.department_name && (
                          <span className="department-tag">{contact.department_name}</span>
                        )}
                        {contact.position_name && (
                          <span className="position-tag">{contact.position_name}</span>
                        )}
                      </div>
                    </div>
                    {contact.unread_count > 0 && (
                      <div className="unread-badge">{contact.unread_count}</div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">暂无联系人</div>
              )
            )}
          </div>
        </div>

        <div className="messages-main">
          {(selectedContact || selectedConversation) ? (
            <>
              <div className="messages-header">
                <div className="chat-info">
                  <div className="chat-avatar">
                    {selectedContact?.employee_name?.charAt(0) ||
                     selectedContact?.username?.charAt(0) ||
                     selectedConversation?.other_employee_name?.charAt(0) ||
                     selectedConversation?.other_username?.charAt(0) || '?'}
                  </div>
                  <div className="chat-details">
                    <div className="chat-name">
                      {selectedContact?.employee_name || selectedContact?.username ||
                       selectedConversation?.other_employee_name || selectedConversation?.other_username}
                    </div>
                    {selectedContact?.department_name && (
                      <div className="chat-department">{selectedContact.department_name}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="messages-content">
                {loading ? (
                  <div className="loading">加载中...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-item ${msg.sender_id === currentUserId ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <div className="message-text">{msg.content}</div>
                        <div className="message-time">
                          {formatTime(msg.created_at)}
                        </div>
                      </div>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteMessage(msg.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="empty-chat">暂无消息</div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form className="message-form" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="输入消息..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  maxLength="1000"
                />
                <button type="submit" disabled={!messageInput.trim()}>
                  发送
                </button>
              </form>
            </>
          ) : (
            <div className="empty-select">
              <div className="empty-icon">💬</div>
              <div className="empty-text">选择一个联系人开始聊天</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
