import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';

const Home = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dashboardRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const handleRefresh = async () => {
    if (dashboardRef.current && dashboardRef.current.handleGlobalRefresh) {
      setRefreshing(true);
      try {
        await dashboardRef.current.handleGlobalRefresh();
      } catch (error) {
        console.error('刷新失败:', error);
        // 如果失败，回退到重新加载页面
        window.location.reload();
      } finally {
        setRefreshing(false);
      }
    } else {
      // 如果没有刷新方法，重新加载页面
      window.location.reload();
    }
  };

  return (
    <div className="home">
      <div className="container">
        <Header
          onToggleSidebar={toggleMobileSidebar}
        />

        <div className="main-content">
          <Sidebar
            activeMenu="dashboard"
            onMenuClick={() => {}}
            collapsed={sidebarCollapsed}
            visible={sidebarVisible}
            onToggleCollapse={toggleSidebar}
          />

          <div className="content-area">
            <div className="content-header page-header">
              <div className="breadcrumb">
                <span className="breadcrumb-item">首页</span>
                <span className="breadcrumb-item active">工作台</span>
              </div>
              <div className="content-actions">
                <button
                  className="action-btn"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? '刷新中...' : '刷新'}
                </button>
              </div>
            </div>

            <div className="content-body page-content">
              <Dashboard ref={dashboardRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;