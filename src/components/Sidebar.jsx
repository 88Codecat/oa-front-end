import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeMenu, onMenuClick, collapsed, visible, onToggleCollapse }) => {
  const navigate = useNavigate();

  const menuItems = [
    { key: 'dashboard', icon: '📊', text: '工作台', path: '/home' },
    { key: 'tasks', icon: '📋', text: '任务管理', path: '/tasks' },
    { key: 'attendance', icon: '⏰', text: '考勤管理', path: '/attendance' },
    { key: 'announcements', icon: '📢', text: '公告管理', path: '/announcements' },
    { key: 'employees', icon: '👥', text: '员工管理', path: '/employees' },
    { key: 'departments', icon: '🏢', text: '部门管理', path: '/departments' },
    { key: 'salaries', icon: '💰', text: '工资管理', path: '/salaries' },
    { key: 'messages', icon: '💬', text: '通讯录', path: '/messages' }
  ];

  const handleMenuClick = (item, e) => {
    e.preventDefault();
    if (onMenuClick) {
      onMenuClick(item.key);
    }
    navigate(item.path);
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${visible ? 'show' : ''}`}>
      <div className="nav-menu">
        {menuItems.map(item => (
          <a
            key={item.key}
            href={item.path}
            className={`menu-item ${activeMenu === item.key ? 'active' : ''}`}
            onClick={(e) => handleMenuClick(item, e)}
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