import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import './PageLayout.css';

const PageLayout = ({ title, icon, children, activeMenu, onMenuClick, actions }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="home">
      <div className="container">
        <Header onToggleSidebar={toggleMobileSidebar} />

        <div className="main-content">
          <Sidebar
            activeMenu={activeMenu}
            onMenuClick={onMenuClick}
            collapsed={sidebarCollapsed}
            visible={sidebarVisible}
            onToggleCollapse={toggleSidebar}
          />

          <div className="content-area">
            <div className="page-header">
              <h1>{icon} {title}</h1>
              {actions && <div className="page-actions">{actions}</div>}
            </div>

            <div className="page-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
