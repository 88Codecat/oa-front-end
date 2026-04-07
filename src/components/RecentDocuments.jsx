import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementAPI } from '../utils/api';

const RecentDocuments = forwardRef(({ /* eslint-disable no-unused-vars */ onRefresh }, ref) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementAPI.getList({ status: 'published', limit: 5 });
      setAnnouncements(data.data || data || []);
    } catch (error) {
      console.error('加载公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // 暴露刷新方法
  useImperativeHandle(ref, () => ({
    loadAnnouncements
  }));

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📰 最新公告</h3>
        </div>
        <div className="card-content">
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📰 最新公告</h3>
        <span
          className="card-action"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/announcements')}
        >
          查看全部
        </span>
      </div>
      <div className="card-content">
        {announcements.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px', fontSize: '14px' }}>
            暂无公告
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/announcements/${item.id}`)}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f1f3f4',
                  cursor: 'pointer'
                }}
                className="clickable-row"
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '12px' }}>
                    {getPriorityIcon(item.priority)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: '500',
                        marginBottom: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6c757d',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.content}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                      {new Date(item.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default RecentDocuments;