import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const actions = [
    {
      icon: '➕',
      title: '新建任务',
      desc: '创建新的工作任务',
      path: '/tasks'
    },
    {
      icon: '📄',
      title: '查看公告',
      desc: '浏览最新公告',
      path: '/announcements'
    },
    {
      icon: '📅',
      title: '考勤打卡',
      desc: '记录出勤情况',
      path: '/attendance'
    },
    {
      icon: refreshing ? '🔄' : '✅',
      title: refreshing ? '刷新中...' : '刷新数据',
      desc: '更新统计信息',
      action: 'refresh'
    }
  ];

  const handleAction = async (action) => {
    if (action.action === 'refresh' && onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
        // 显示刷新成功提示（可选）
      } catch (error) {
        console.error('刷新失败:', error);
      } finally {
        setRefreshing(false);
      }
    } else if (action.path) {
      navigate(action.path);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">⚡ 快捷操作</h3>
      </div>
      <div className="card-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {actions.map((action, index) => (
            <div
              key={index}
              onClick={() => handleAction(action)}
              style={{
                padding: '16px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.background = '#f8f9ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.background = 'white';
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {action.icon}
              </div>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {action.title}
              </div>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                {action.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;