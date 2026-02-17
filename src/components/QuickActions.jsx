import React from 'react';

const QuickActions = () => {
  const actions = [
    { icon: '➕', title: '新建任务', desc: '创建新的工作任务' },
    { icon: '📄', title: '上传文档', desc: '上传工作文档' },
    { icon: '📅', title: '安排会议', desc: '创建会议日程' },
    { icon: '✅', title: '发起审批', desc: '提交审批申请' }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          ⚡ 快捷操作
        </h3>
      </div>
      <div className="card-content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {actions.map((action, index) => (
            <div 
              key={index}
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