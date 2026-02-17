import React, { useState } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';


const Home = () => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const handleMenuClick = (menuKey) => {
    setActiveMenu(menuKey);
    setSidebarVisible(false); // 移动端点击后关闭侧边栏
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="home">
      <div className="container">
        <Header 
          onToggleSidebar={toggleMobileSidebar}
        />
        
        <div className="main-content">
          <Sidebar 
            activeMenu={activeMenu}
            onMenuClick={handleMenuClick}
            collapsed={sidebarCollapsed}
            visible={sidebarVisible}
            onToggleCollapse={toggleSidebar}
          />
          
          <div className="content-area">
            <div className="content-header">
              <div className="breadcrumb">
                <span className="breadcrumb-item">首页</span>
                <span className="breadcrumb-item active">工作台</span>
              </div>
              <div className="content-actions">
                <button className="action-btn">刷新</button>
                <button className="action-btn primary">新建</button>
              </div>
            </div>
            
            <div className="content-body">
              <Dashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;