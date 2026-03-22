import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import StatCard from './StatCard';
import TaskList from './TaskList';
import RecentDocuments from './RecentDocuments';
import QuickActions from './QuickActions';
import { taskAPI } from '../utils/api';

const Dashboard = forwardRef((_props, ref) => {
  const [stats, setStats] = useState([
    { number: '0', label: '待办任务', change: '+0', positive: false },
    { number: '0', label: '今日完成', change: '+0', positive: true },
    { number: '0', label: '本周任务', change: '+0', positive: true },
    { number: '0', label: '出勤天数', change: '+0', positive: true }
  ]);
  const [loading, setLoading] = useState(true);
  const taskListRef = useRef(null);
  const recentDocsRef = useRef(null);

  // 获取当前用户ID
  const getCurrentUserId = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  };

  // 加载Dashboard统计数据
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('未找到用户ID，无法加载统计数据');
        setStats([
          { number: '0', label: '待办任务', change: '+0', positive: false },
          { number: '0', label: '今日完成', change: '+0', positive: true },
          { number: '0', label: '本周任务', change: '+0', positive: true },
          { number: '0', label: '出勤天数', change: '+0', positive: true }
        ]);
        return;
      }

      // 获取任务统计（使用用户ID作为assignee_id）
      const taskStats = await taskAPI.getStatistics({
        assignee_id: userId
      });

      console.log('Dashboard - 任务统计数据:', taskStats);

      // 计算待办任务数（pending + in_progress），确保转换为数字
      const pendingTasks = parseInt(taskStats.pending_tasks || 0) + parseInt(taskStats.in_progress_tasks || 0);
      const completedTasks = parseInt(taskStats.completed_tasks || 0);
      const totalTasks = parseInt(taskStats.total_tasks || 0);

      // 计算变化值（基于完成任务数量）
      const completedChange = completedTasks > 0 ? `+${completedTasks}` : '+0';

      // 更新统计数据
      setStats([
        {
          number: String(pendingTasks),
          label: '待办任务',
          change: '+0',
          positive: false
        },
        {
          number: String(completedTasks),
          label: '今日完成',
          change: completedChange,
          positive: completedTasks > 0
        },
        {
          number: String(totalTasks),
          label: '本周任务',
          change: `+${totalTasks}`,
          positive: totalTasks > 0
        },
        {
          number: '0',
          label: '出勤天数',
          change: '+0',
          positive: true
        }
      ]);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      console.error('错误详情:', error.response?.data || error.message);
      // 失败时显示默认值
      setStats([
        { number: '0', label: '待办任务', change: '+0', positive: false },
        { number: '0', label: '今日完成', change: '+0', positive: true },
        { number: '0', label: '本周任务', change: '+0', positive: true },
        { number: '0', label: '出勤天数', change: '+0', positive: true }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 全局刷新方法
  const handleGlobalRefresh = async () => {
    // 刷新统计数据
    await loadDashboardStats();

    // 刷新任务列表
    if (taskListRef.current && taskListRef.current.loadTasks) {
      taskListRef.current.loadTasks();
    }

    // 刷新公告列表
    if (recentDocsRef.current && recentDocsRef.current.loadAnnouncements) {
      recentDocsRef.current.loadAnnouncements();
    }
  };

  useEffect(() => {
    loadDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 暴露全局刷新方法
  useImperativeHandle(ref, () => ({
    handleGlobalRefresh
  }));

  return (
    <>
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} loading={loading} />
        ))}
      </div>

      <div className="dashboard-grid">
        <TaskList ref={taskListRef} onRefresh={loadDashboardStats} />
        <RecentDocuments ref={recentDocsRef} onRefresh={loadDashboardStats} />
        <QuickActions onRefresh={handleGlobalRefresh} />
      </div>
    </>
  );
});

export default Dashboard;