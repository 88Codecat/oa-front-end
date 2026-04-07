import { useState, useEffect, useRef } from 'react';
import { announcementAPI } from '../utils/api';
import './AnnouncementTicker.css';

const AnnouncementTicker = ({ onItemClick }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef(null);

  useEffect(() => {
    loadAnnouncements();
    // 每30秒自动刷新
    const interval = setInterval(loadAnnouncements, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await announcementAPI.getList({ 
        status: 'published', 
        limit: 20 
      });
      const list = data.data || [];
      // 按发布日期倒序，取最新的5条
      const latest = list.slice(0, 5);
      setAnnouncements(latest);
    } catch (error) {
      console.error('加载公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  };

  const handleClick = (announcement) => {
    if (onItemClick) {
      onItemClick(announcement);
    }
  };

  if (loading) {
    return (
      <div className="announcement-ticker">
        <div className="ticker-label">
          <span className="ticker-icon">📢</span>
          <span>最新公告</span>
        </div>
        <div className="ticker-content">
          <div className="ticker-loading">加载中...</div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="announcement-ticker">
        <div className="ticker-label">
          <span className="ticker-icon">📢</span>
          <span>最新公告</span>
        </div>
        <div className="ticker-content">
          <div className="ticker-empty">暂无公告通知</div>
        </div>
      </div>
    );
  }

  // 复制公告用于无缝滚动
  const duplicatedAnnouncements = [...announcements, ...announcements];

  return (
    <div className="announcement-ticker" ref={tickerRef}>
      <div className="ticker-label">
        <span className="ticker-icon">📢</span>
        <span>最新公告</span>
      </div>
      <div className="ticker-content">
        <div 
          className="ticker-track"
          style={{ '--item-count': announcements.length }}
        >
          <div className="ticker-items">
            {duplicatedAnnouncements.map((item, index) => (
              <div 
                key={`${item.id}-${index}`} 
                className={`ticker-item ${getPriorityClass(item.priority)}`}
                onClick={() => handleClick(item)}
                title={item.title}
              >
                <span className="ticker-date">{formatDate(item.publish_date || item.created_at)}</span>
                <span className="ticker-title">{item.title}</span>
                {item.priority === 'high' && <span className="ticker-badge">重要</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementTicker;
