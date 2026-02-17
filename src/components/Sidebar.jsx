import React from 'react';

const Sidebar = ({ activeMenu, onMenuClick, collapsed, visible, onToggleCollapse }) => {
  const menuItems = [
    { key: 'dashboard', icon: '📊', text: '工作台' },
    { key: 'tasks', icon: '📋', text: '任务管理' },
    { key: 'calendar', icon: '📅', text: '日程安排' },
    { key: 'documents', icon: '📄', text: '文档中心' },
    { key: 'approval', icon: '✅', text: '审批流程' },
    { key: 'contacts', icon: '👥', text: '通讯录' },
    { key: 'reports', icon: '📈', text: '报表统计' },
    { key: 'settings', icon: '⚙️', text: '系统设置' }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${visible ? 'show' : ''}`}>
      <div className="nav-menu">
        {menuItems.map(item => (
          <a
            key={item.key}
            href="#"
            className={`menu-item ${activeMenu === item.key ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onMenuClick(item.key);
            }}
          >
            <div className="menu-icon">{item.icon}</div>
            {!collapsed && <span className="menu-text">{item.text}</span>}
          </a>
        ))}
      </div>
      
      <div className="collapse-btn" onClick={onToggleCollapse}>
        {collapsed ? '展开' : '收起'}
      </div>
    </div>
  );
};

export default Sidebar;