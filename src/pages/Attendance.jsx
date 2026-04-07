import { useState, useEffect, useCallback } from 'react';
import { attendanceAPI, leaveAPI, getCurrentEmployee } from '../utils/api';
import './Attendance.css';
import '../components/BackButton.css';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [employeeId, setEmployeeId] = useState(null);
  const [employeeName, setEmployeeName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [viewMode, setViewMode] = useState('personal');

  // 备注编辑弹窗状态
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [notesText, setNotesText] = useState('');

  // 请假申请弹窗状态
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    start_date: '',
    end_date: '',
    leave_type: '事假',
    reason: ''
  });

  // 分页状态
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const attendancePageSize = 15;

  // 返回工作台
  const handleBack = () => {
    window.location.href = '/home';
  };

  const loadEmployeeInfo = useCallback(async () => {
    try {
      const employee = await getCurrentEmployee();
      if (employee && employee.id) {
        setEmployeeId(employee.id);
        setEmployeeName(employee.name || '');
      } else {
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
      const [year, month] = currentMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      const params = { start_date: startDate, end_date: endDate };

      if (viewMode === 'personal' && employeeId) {
        params.employee_id = employeeId;
      } else if (viewMode === 'department') {
        params.page = attendancePage;
        params.limit = attendancePageSize;
      }

      const data = await attendanceAPI.getList(params);
      setAttendance(data.data || []);
      if (data.pagination) {
        setAttendanceTotal(data.pagination.total || 0);
      }
    } catch (error) {
      console.error('加载考勤记录失败:', error);
    }
  }, [currentMonth, employeeId, viewMode, attendancePage]);

  const loadLeaves = useCallback(async () => {
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      const params = { start_date: startDate, end_date: endDate };

      if (viewMode === 'personal' && employeeId) {
        params.employee_id = employeeId;
      }

      const data = await leaveAPI.getList(params);
      setLeaves(data.data || []);
    } catch (error) {
      console.error('加载请假记录失败:', error);
    }
  }, [currentMonth, employeeId, viewMode]);

  const loadTodayAttendance = useCallback(async () => {
    if (!employeeId) return;
    try {
      const now = new Date();
      const today = now.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }).replace(/\//g, '-');
      const data = await attendanceAPI.getList({ employee_id: employeeId, start_date: today, end_date: today });
      setTodayAttendance(data.data?.[0] || null);
    } catch (error) {
      console.error('加载今日考勤失败:', error);
    }
  }, [employeeId]);

  const loadStats = useCallback(async () => {
    if (!employeeId) {
      setStats(null);
      return;
    }
    try {
      const [year, month] = currentMonth.split('-').map(Number);
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const lastDay = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
      
      // 并行获取考勤统计和请假统计
      const [attendanceStats, leaveStats] = await Promise.all([
        attendanceAPI.getStatistics({ employee_id: employeeId, start_date: startDate, end_date: endDate }),
        leaveAPI.getStatistics({ employee_id: employeeId, year, month })
      ]);
      
      // 合并统计结果（注意：API返回的是 { success, data } 格式）
      const attData = attendanceStats?.data || attendanceStats || {};
      const leaveData = leaveStats?.data || leaveStats || {};
      
      setStats({
        present_days: attData.present_days || 0,
        late_days: attData.late_days || 0,
        absent_days: attData.absent_days || 0,
        leave_days: leaveData.total_leave_days || attData.leave_days || 0,
        annual_leave: leaveData.annual_leave || 0,
        sick_leave: leaveData.sick_leave || 0,
        personal_leave: leaveData.personal_leave || 0,
        other_leave: leaveData.other_leave || 0
      });
    } catch (error) {
      console.error('加载统计信息失败:', error);
      setStats(null);
    }
  }, [currentMonth, employeeId]);

  useEffect(() => {
    loadEmployeeInfo();
  }, [loadEmployeeInfo]);

  // 切换月份时重置页码
  useEffect(() => {
    setAttendancePage(1);
  }, [currentMonth]);

  useEffect(() => {
    if (employeeId) {
      loadAttendance();
      loadLeaves();
      loadTodayAttendance();
      loadStats();
    }
  }, [currentMonth, employeeId, loadAttendance, loadLeaves, loadTodayAttendance, loadStats]);

  const handleClockIn = async () => {
    if (!employeeId) {
      alert('未找到员工信息');
      return;
    }
    try {
      await attendanceAPI.clockIn({ employee_id: employeeId });
      await loadTodayAttendance();
      await loadAttendance();
      await loadStats();
      alert('签到成功!');
    } catch (error) {
      alert('签到失败: ' + (error.message || '未知错误'));
    }
  };

  const handleClockOut = async () => {
    if (!employeeId) {
      alert('未找到员工信息');
      return;
    }
    try {
      await attendanceAPI.clockOut({ employee_id: employeeId });
      await loadTodayAttendance();
      await loadAttendance();
      await loadStats();
      alert('签退成功!');
    } catch (error) {
      alert('签退失败: ' + (error.message || '未知错误'));
    }
  };

  // 打开备注编辑弹窗（仅管理员/经理可编辑，或员工编辑自己的记录）
  const handleEditNotes = (record) => {
    setEditingRecord(record);
    setNotesText(record.notes || '');
    setShowNotesModal(true);
  };

  // 保存备注
  const handleSaveNotes = async () => {
    if (!editingRecord) return;
    try {
      await attendanceAPI.updateNotes(editingRecord.id, notesText);
      alert('备注保存成功');
      setShowNotesModal(false);
      await loadAttendance();
    } catch (error) {
      alert('保存失败: ' + (error.message || '未知错误'));
    }
  };

  // 提交请假申请
  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date) {
      alert('请选择请假日期');
      return;
    }
    if (new Date(leaveForm.start_date) > new Date(leaveForm.end_date)) {
      alert('结束日期不能早于开始日期');
      return;
    }
    try {
      await leaveAPI.create(leaveForm);
      alert('请假申请已提交');
      setShowLeaveModal(false);
      setLeaveForm({ start_date: '', end_date: '', leave_type: '事假', reason: '' });
      await loadLeaves();
      await loadStats();
    } catch (error) {
      alert('提交失败: ' + (error.message || '未知错误'));
    }
  };

  // 取消请假申请
  const handleCancelLeave = async (id) => {
    if (!window.confirm('确定要取消这个请假申请吗?')) return;
    try {
      await leaveAPI.delete(id);
      alert('请假申请已取消');
      await loadLeaves();
      await loadStats();
    } catch (error) {
      alert('取消失败: ' + (error.message || '未知错误'));
    }
  };

  // 审批请假
  const handleApproveLeave = async (id, approved) => {
    try {
      await leaveAPI.approve(id, { approved });
      alert(approved ? '请假已批准' : '请假已拒绝');
      await loadLeaves();
      await loadAttendance();
      await loadStats();
    } catch (error) {
      alert('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      present: '正常',
      late: '迟到',
      absent: '缺勤',
      leave: '请假',
      pending: '待审批',
      approved: '已批准',
      rejected: '已拒绝'
    };
    return statusMap[status] || status;
  };

  const getLeaveTypeText = (type) => {
    const typeMap = {
      '年假': '年假',
      '病假': '病假',
      '事假': '事假',
      '其他': '其他'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    if (dateStr.includes('T') && dateStr.endsWith('Z')) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' });
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      return dateStr.slice(0, 10);
    }
    return dateStr;
  };

  const getStatusClass = (status) => {
    const classMap = {
      present: 'present',
      late: 'late',
      absent: 'absent',
      leave: 'leave',
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected'
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
      <div className="page-topbar">
        <button className="back-btn" onClick={handleBack}>
          返回工作台
        </button>
      </div>

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

      {/* 今日打卡卡片 */}
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
            <button
              className="btn btn-info btn-large"
              onClick={() => setShowLeaveModal(true)}
            >
              申请请假
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
      {stats && viewMode === 'personal' && (
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

      {/* 请假申请列表 */}
      {viewMode === 'personal' && (
        <div className="leave-list">
          <h3>请假申请</h3>
          {leaves.length === 0 ? (
            <div className="empty-state">暂无请假记录</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>请假类型</th>
                  <th>开始日期</th>
                  <th>结束日期</th>
                  <th>天数</th>
                  <th>原因</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id}>
                    <td>{getLeaveTypeText(leave.leave_type)}</td>
                    <td>{formatDate(leave.start_date)}</td>
                    <td>{formatDate(leave.end_date)}</td>
                    <td>{leave.days}天</td>
                    <td>{leave.reason || '-'}</td>
                    <td>
                      <span className={`status ${getStatusClass(leave.status)}`}>
                        {getStatusText(leave.status)}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'pending' && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancelLeave(leave.id)}
                        >
                          取消
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 考勤记录列表（管理员/经理视图） */}
      {viewMode === 'department' && (userRole === 'admin' || userRole === 'manager') && (
        <div className="attendance-list">
          {/* 请假审批列表 */}
          <h3>请假审批</h3>
          {leaves.length === 0 ? (
            <div className="empty-state">暂无请假申请</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>员工姓名</th>
                  <th>请假类型</th>
                  <th>开始日期</th>
                  <th>结束日期</th>
                  <th>天数</th>
                  <th>原因</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(leave => (
                  <tr key={leave.id}>
                    <td>{leave.employee_name || '-'}</td>
                    <td>{getLeaveTypeText(leave.leave_type)}</td>
                    <td>{formatDate(leave.start_date)}</td>
                    <td>{formatDate(leave.end_date)}</td>
                    <td>{leave.days}天</td>
                    <td>{leave.reason || '-'}</td>
                    <td>
                      <span className={`status ${getStatusClass(leave.status)}`}>
                        {getStatusText(leave.status)}
                      </span>
                    </td>
                    <td>
                      {leave.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-sm btn-success"
                            onClick={() => handleApproveLeave(leave.id, true)}
                            style={{ marginRight: '5px' }}
                          >
                            批准
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleApproveLeave(leave.id, false)}
                          >
                            拒绝
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 打卡记录列表 */}
          <h3 style={{ marginTop: '30px' }}>
            {userRole === 'admin' ? '全体考勤记录' : '部门考勤记录'}
          </h3>
          {attendance.length === 0 ? (
            <div className="empty-state">暂无考勤记录</div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>员工姓名</th>
                    <th>工号</th>
                    <th>日期</th>
                    <th>签到时间</th>
                    <th>签退时间</th>
                    <th>状态</th>
                    <th>备注</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(record => (
                    <tr key={record.id}>
                      <td>{record.employee_name || '-'}</td>
                      <td>{record.employee_no || '-'}</td>
                      <td>{formatDate(record.date)}</td>
                      <td>{record.check_in || '--:--:--'}</td>
                      <td>{record.check_out || '--:--:--'}</td>
                      <td>
                        <span className={`status ${getStatusClass(record.status)}`}>
                          {getStatusText(record.status)}
                        </span>
                      </td>
                      <td>{record.notes || '-'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditNotes(record)}
                        >
                          编辑备注
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* 分页控件 */}
              {attendanceTotal > attendancePageSize && (
                <div className="pagination">
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setAttendancePage(p => Math.max(1, p - 1))}
                    disabled={attendancePage === 1}
                  >
                    上一页
                  </button>
                  <span className="page-info">
                    第 {attendancePage} / {Math.ceil(attendanceTotal / attendancePageSize)} 页 
                    (共 {attendanceTotal} 条)
                  </span>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => setAttendancePage(p => p + 1)}
                    disabled={attendancePage >= Math.ceil(attendanceTotal / attendancePageSize)}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 备注编辑弹窗 */}
      {showNotesModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>编辑备注</h3>
            <div className="form-group">
              <label>日期: {formatDate(editingRecord.date)}</label>
            </div>
            <div className="form-group">
              <label>员工: {editingRecord.employee_name || employeeName}</label>
            </div>
            <div className="form-group">
              <label>备注内容</label>
              <textarea 
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="请输入备注..."
                rows={4}
              />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowNotesModal(false)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveNotes}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 请假申请弹窗 */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>申请请假</h3>
            <form onSubmit={handleSubmitLeave}>
              <div className="form-group">
                <label>请假类型</label>
                <select
                  value={leaveForm.leave_type}
                  onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})}
                >
                  <option value="年假">年假</option>
                  <option value="病假">病假</option>
                  <option value="事假">事假</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>开始日期</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({...leaveForm, start_date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>结束日期</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({...leaveForm, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>请假原因</label>
                <textarea
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                  placeholder="请输入请假原因..."
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowLeaveModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  提交申请
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
