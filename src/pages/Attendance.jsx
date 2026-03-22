import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI, getCurrentEmployee } from '../utils/api';
import './Attendance.css';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [employeeId, setEmployeeId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [viewMode, setViewMode] = useState('personal'); // 'personal' or 'department'

  const loadEmployeeInfo = useCallback(async () => {
    try {
      console.log('开始获取员工信息...');
      const employee = await getCurrentEmployee();
      console.log('获取到的员工信息:', employee);
      if (employee && employee.id) {
        setEmployeeId(employee.id);
        console.log('设置员工ID:', employee.id);
      } else {
        console.error('员工信息无效:', employee);
        setEmployeeId(null);
      }
    } catch (error) {
      console.error('获取员工信息失败:', error);
      setEmployeeId(null);
    }

    try {
      const user = JSON.parse(sessionStorage.getItem('user'));
      if (user) {
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('获取用户角色失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAttendance = useCallback(async () => {
    try {
      const [year, month] = currentMonth.split('-');
      const params = {
        start_date: `${year}-${month}-01`,
        end_date: `${year}-${month}-31`
      };

      // 根据视图模式和角色决定是否传递 employee_id
      if (viewMode === 'personal' && employeeId) {
        params.employee_id = employeeId;
      }

      const data = await attendanceAPI.getList(params);
      setAttendance(data.data || []);
    } catch (error) {
      console.error('加载考勤记录失败:', error);
    }
  }, [currentMonth, employeeId, viewMode]);

  const loadTodayAttendance = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('加载今日考勤，employeeId:', employeeId, 'today:', today);
      const data = await attendanceAPI.getList({ employee_id: employeeId, start_date: today, end_date: today });
      console.log('今日考勤数据:', data);
      setTodayAttendance(data.data?.[0] || null);
    } catch (error) {
      console.error('加载今日考勤失败:', error);
    }
  }, [employeeId]);

  const loadStats = useCallback(async () => {
    try {
      if (viewMode !== 'personal' || !employeeId) {
        setStats(null);
        return;
      }
      const [year, month] = currentMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];
      console.log('加载考勤统计，employeeId:', employeeId, '日期范围:', startDate, '-', endDate);
      const data = await attendanceAPI.getStatistics({ employee_id: employeeId, start_date: startDate, end_date: endDate });
      console.log('考勤统计数据:', data);
      setStats(data);
    } catch (error) {
      console.error('加载统计信息失败:', error);
    }
  }, [currentMonth, employeeId, viewMode]);

  useEffect(() => {
    // 获取当前用户对应的员工ID
    loadEmployeeInfo();
  }, [loadEmployeeInfo]);

  useEffect(() => {
    if (employeeId) {
      loadAttendance();
      loadTodayAttendance();
      loadStats();
    }
  }, [currentMonth, employeeId, loadAttendance, loadTodayAttendance, loadStats]);

  const handleClockIn = async () => {
    if (!employeeId) {
      alert('未找到员工信息');
      return;
    }
    console.log('开始打卡，employeeId:', employeeId);
    try {
      console.log('调用打卡API...');
      const response = await attendanceAPI.clockIn({ employee_id: employeeId });
      console.log('打卡API响应:', response);
      await loadTodayAttendance();
      await loadAttendance();
      await loadStats();
      alert('打卡成功!');
    } catch (error) {
      console.error('打卡失败:', error);
      alert('打卡失败: ' + (error.message || '未知错误'));
    }
  };

  const handleClockOut = async () => {
    if (!employeeId) {
      alert('未找到员工信息');
      return;
    }
    console.log('开始签退，employeeId:', employeeId);
    try {
      console.log('调用签退API...');
      const response = await attendanceAPI.clockOut({ employee_id: employeeId });
      console.log('签退API响应:', response);
      await loadTodayAttendance();
      await loadAttendance();
      await loadStats();
      alert('签退成功!');
    } catch (error) {
      console.error('签退失败:', error);
      alert('签退失败: ' + (error.message || '未知错误'));
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      present: '正常',
      late: '迟到',
      absent: '缺勤',
      leave: '请假'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      present: 'present',
      late: 'late',
      absent: 'absent',
      leave: 'leave'
    };
    return classMap[status] || 'present';
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!employeeId) {
    return (
      <div className="attendance-page">
        <div className="empty-state">
          <h3>未找到员工信息</h3>
          <p>请联系管理员为您创建员工档案</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h2>考勤管理</h2>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => setCurrentMonth(e.target.value)}
          className="month-picker"
        />
        {(userRole === 'admin' || userRole === 'manager') && (
          <div className="view-toggle">
            <button
              className={`btn ${viewMode === 'personal' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('personal')}
            >
              个人考勤
            </button>
            <button
              className={`btn ${viewMode === 'department' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('department')}
            >
              {userRole === 'admin' ? '全体考勤' : '部门考勤'}
            </button>
          </div>
        )}
      </div>

      {/* 今日打卡卡片 - 仅个人模式显示 */}
      {viewMode === 'personal' && (
        <div className="today-card">
          <h3>今日打卡</h3>
          <div className="clock-buttons">
            <button
              className="btn btn-success btn-large"
              onClick={handleClockIn}
              disabled={todayAttendance?.check_in}
            >
              {todayAttendance?.check_in ? '已签到' : '上班打卡'}
            </button>
            <button
              className="btn btn-warning btn-large"
              onClick={handleClockOut}
              disabled={!todayAttendance?.check_in || todayAttendance?.check_out}
            >
              {todayAttendance?.check_out ? '已签退' : '下班签退'}
            </button>
          </div>
          {todayAttendance && (
            <div className="today-times">
              <div>签到时间: {todayAttendance.check_in || '--:--:--'}</div>
              <div>签退时间: {todayAttendance.check_out || '--:--:--'}</div>
              <div>状态: <span className={`status ${getStatusClass(todayAttendance.status)}`}>
                {getStatusText(todayAttendance.status)}
              </span></div>
            </div>
          )}
        </div>
      )}

      {/* 统计卡片 */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card present">
            <div className="stat-number">{stats.present_days || 0}</div>
            <div className="stat-label">正常天数</div>
          </div>
          <div className="stat-card late">
            <div className="stat-number">{stats.late_days || 0}</div>
            <div className="stat-label">迟到天数</div>
          </div>
          <div className="stat-card absent">
            <div className="stat-number">{stats.absent_days || 0}</div>
            <div className="stat-label">缺勤天数</div>
          </div>
          <div className="stat-card leave">
            <div className="stat-number">{stats.leave_days || 0}</div>
            <div className="stat-label">请假天数</div>
          </div>
        </div>
      )}

      {/* 考勤记录列表 */}
      <div className="attendance-list">
        <h3>
          {viewMode === 'personal' ? '个人考勤记录' :
           userRole === 'admin' ? '全体考勤记录' : '部门考勤记录'}
        </h3>
        {attendance.length === 0 ? (
          <div className="empty-state">暂无考勤记录</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {viewMode !== 'personal' && (
                  <>
                    <th>员工姓名</th>
                    <th>工号</th>
                  </>
                )}
                <th>日期</th>
                <th>签到时间</th>
                <th>签退时间</th>
                <th>状态</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map(record => (
                <tr key={record.id}>
                  {viewMode !== 'personal' && (
                    <>
                      <td>{record.employee_name || '-'}</td>
                      <td>{record.employee_no || '-'}</td>
                    </>
                  )}
                  <td>{record.date}</td>
                  <td>{record.check_in || '--:--:--'}</td>
                  <td>{record.check_out || '--:--:--'}</td>
                  <td>
                    <span className={`status ${getStatusClass(record.status)}`}>
                      {getStatusText(record.status)}
                    </span>
                  </td>
                  <td>{record.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Attendance;
