

const Header = ({ onToggleSidebar }) => {
  return (
    <div className="header">
      <div className="logo">
        <div className="logo-icon">OA</div>
        <span>智能办公系统</span>
      </div>
      
      <div className="user-info">
        <div className="notifications">
          <span>🔔</span>
          <div className="badge">3</div>
        </div>
        
        <div className="user-avatar">
          <span>张</span>
        </div>
        
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