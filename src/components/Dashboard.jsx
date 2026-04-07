import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import StatCard from './StatCard';
import TaskList from './TaskList';
import RecentDocuments from './RecentDocuments';
import QuickActions from './QuickActions';
import AnnouncementTicker from './AnnouncementTicker';
import { taskAPI, leaveAPI, attendanceAPI, getCurrentEmployee } from '../utils/api';

const Dashboard = forwardRef((_props, ref) => {
  const [stats, setStats] = useState([
    { number: '0', label: '待办任务', change: '+0', positive: false },
    { number: '0', label: '今日完成', change: '+0', positive: true },
    { number: '0', label: '本周任务', change: '+0', positive: true },
    { number: '0', label: '出勤天数', change: '+0', positive: true }
  ]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const taskListRef = useRef(null);
  const recentDocsRef = useRef(null);

  // 获取当前用户信息
  const getCurrentUser = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return { id: user.id, role: user.role };
    }
    return { id: null, role: null };
  };

  // 获取日期范围
  const getToday = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  const getWeekRange = () => {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    };
  };

  // 加载Dashboard统计数据
  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const currentUser = getCurrentUser();
      
      if (!currentUser.id) {
        setStats([
          { number: '0', label: '待办任务', change: '+0', positive: false },
          { number: '0', label: '今日完成', change: '+0', positive: true },
          { number: '0', label: '本周任务', change: '+0', positive: true },
          { number: '0', label: '出勤天数', change: '+0', positive: true }
        ]);
        return;
      }

      // 获取当前用户的员工信息
      const employee = await getCurrentEmployee();
      const employeeId = employee?.id;
      console.log('Dashboard - 当前员工ID:', employeeId, '用户信息:', currentUser);
      
      // 获取日期范围
      const today = getToday();
      const weekRange = getWeekRange();
      console.log('Dashboard - 日期范围:', { today, weekRange });

      // 并行获取任务统计、请假统计、考勤统计
      const [taskStats, leaveData, attendanceStats] = await Promise.all([
        taskAPI.getStatistics({ 
          completed_start: today,
          completed_end: today,
          start_date: weekRange.start,
          end_date: weekRange.end,
          _t: Date.now()  // 防止缓存
        }),
        leaveAPI.getList({ status: 'pending', limit: 100, _t: Date.now() }),
        employeeId ? attendanceAPI.getStatistics({ 
          employee_id: employeeId,
          start_date: weekRange.start,
          end_date: weekRange.end,
          _t: Date.now()  // 防止缓存
        }) : Promise.resolve({ data: { present_days: 0 } })
      ]);

      console.log('Dashboard - 任务统计返回:', taskStats);
      console.log('Dashboard - 请假列表返回:', leaveData);
      console.log('Dashboard - 考勤统计返回:', attendanceStats);

      // 计算待办任务数（pending + in_progress）
      const taskData = taskStats.data || taskStats || {};
      const pendingTasks = parseInt(taskData.pending_tasks || 0) + parseInt(taskData.in_progress_tasks || 0);
      const todayCompleted = parseInt(taskData.completed_in_period || 0);
      const weekTasks = parseInt(taskData.week_tasks || 0);

      console.log('Dashboard - 解析后数据:', { pendingTasks, todayCompleted, weekTasks });

      // 计算待审批请假数量（管理员/经理看到待审批的，普通员工看到自己的）
      const leaves = leaveData.data || [];
      const pendingLeaves = leaves.length;

      // 待办任务：任务+需要审批的请假（管理员/经理）
      let totalPending = pendingTasks;
      if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        totalPending += pendingLeaves;
      }

      // 出勤天数
      const attendanceData = attendanceStats.data || attendanceStats || {};
      const presentDays = parseInt(attendanceData.present_days || 0);

      console.log('Dashboard - 最终统计数据:', { totalPending, todayCompleted, weekTasks, presentDays });

      // 更新统计数据
      setStats([
        {
          number: String(totalPending),
          label: '待办任务',
          change: '+0',
          positive: false
        },
        {
          number: String(todayCompleted),
          label: '今日完成',
          change: todayCompleted > 0 ? `+${todayCompleted}` : '+0',
          positive: todayCompleted > 0
        },
        {
          number: String(weekTasks),
          label: '本周任务',
          change: weekTasks > 0 ? `+${weekTasks}` : '+0',
          positive: weekTasks > 0
        },
        {
          number: String(presentDays),
          label: '出勤天数',
          change: presentDays > 0 ? `+${presentDays}` : '+0',
          positive: presentDays > 0
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

  // 处理公告点击
  const handleAnnouncementClick = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowAnnouncementModal(true);
  };

  return (
    <>
      {/* 公告滚动通知 */}
      <AnnouncementTicker onItemClick={handleAnnouncementClick} />

      {/* 统计卡片 */}
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

      {/* 公告详情弹窗 */}
      {showAnnouncementModal && selectedAnnouncement && (
        <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
          <div className="modal-content announcement-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedAnnouncement.title}</h3>
              <button className="modal-close" onClick={() => setShowAnnouncementModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="announcement-meta">
                <span className={`priority-tag ${selectedAnnouncement.priority}`}>
                  {selectedAnnouncement.priority === 'high' ? '重要' : 
                   selectedAnnouncement.priority === 'medium' ? '一般' : '普通'}
                </span>
                <span className="announcement-date">
                  发布时间: {new Date(selectedAnnouncement.publish_date || selectedAnnouncement.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="announcement-content">
                {selectedAnnouncement.content}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Dashboard;
