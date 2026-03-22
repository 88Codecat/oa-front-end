




import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { messageAPI } from '../utils/api';
import wsClient from '../utils/websocket';

const Header = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    wsClient.disconnect();
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const handleNotificationClick = () => {
    navigate('/messages');
  };

  // WebSocket 实时更新未读数量
  const handleMessageReceive = useCallback(() => {
    setUnreadCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadCount = async () => {
      const result = await messageAPI.getUnreadCount();
      if (mounted) {
        setUnreadCount(result.data?.unread_count || 0);
      }
    };

    loadCount();

    // 注册 WebSocket 事件监听
    wsClient.on('message:receive', handleMessageReceive);

    return () => {
      mounted = false;
      wsClient.off('message:receive', handleMessageReceive);
    };
  }, [handleMessageReceive]);

  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userInitial = user.username ? user.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className="header">
      <div className="logo">
        <div className="logo-icon">OA</div>
        <span>智能办公系统</span>
      </div>

      <div className="user-info">
        <div className="notifications" onClick={handleNotificationClick} style={{ cursor: 'pointer' }}>
          <span>🔔</span>
          {unreadCount > 0 && <div className="badge">{unreadCount}</div>}
        </div>

        <div className="user-avatar">
          <span>{userInitial}</span>
        </div>

        <span className="username">{user.username || '用户'}</span>

        <button
          className="logout-btn"
          onClick={handleLogout}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '5px 10px',
            marginLeft: '10px'
          }}
        >
          退出
        </button>

        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '18px',
            cursor: 'pointer'
          }}
        >
          ☰
        </button>
      </div>
    </div>
  );
};

export default Header;