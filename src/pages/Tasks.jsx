import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskAPI, authAPI } from '../utils/api';
import '../components/BackButton.css';

const Tasks = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [detailTask, setDetailTask] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: '',
    priority: 'medium',
    status: 'pending',
    progress: 0,
    start_date: '',
    due_date: ''
  });

  // 返回工作台
  const handleBack = () => {
    window.location.href = '/home';
  };

  useEffect(() => {
    loadTasks();
    loadUsers();
    // 获取当前用户信息
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setCurrentUserId(user.id);
    }
  }, []);

  // 处理URL参数中的任务ID
  useEffect(() => {
    if (id) {
      const task = tasks.find(t => String(t.id) === String(id));
      if (task) {
        setDetailTask(task);
        setShowDetailModal(true);
      }
    }
  }, [id, tasks]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskAPI.getList({});
      setTasks(data.data || []);
    } catch (error) {
      console.error('加载任务失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await authAPI.getUsers();
      setUsers(data.data || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        // 根据权限过滤提交的字段
        let submitData;
        if (userRole === 'employee') {
          // 员工（被指派人）只能修改状态和进度
          submitData = {
            status: formData.status,
            progress: formData.progress
          };
        } else if (isTaskAssigner(editingTask)) {
          // 指派人可以修改大部分字段，但不能修改自己作为指派人
          submitData = {
            title: formData.title,
            description: formData.description,
            assignee_id: formData.assignee_id,
            priority: formData.priority,
            status: formData.status,
            progress: formData.progress,
            start_date: formData.start_date,
            due_date: formData.due_date
          };
        } else {
          // 管理员可以提交所有字段
          submitData = formData;
        }
        await taskAPI.update(editingTask.id, submitData);
      } else {
        await taskAPI.create(formData);
      }
      setShowModal(false);
      setEditingTask(null);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error('保存任务失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignee_id: task.assignee_id,
      priority: task.priority,
      status: task.status,
      progress: task.progress || 0,
      start_date: task.start_date,
      due_date: task.due_date
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个任务吗?')) return;
    try {
      await taskAPI.delete(id);
      loadTasks();
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      assignee_id: '',
      priority: 'medium',
      status: 'pending',
      progress: 0,
      start_date: '',
      due_date: ''
    });
  };

  const isTaskAssignedToUser = (task) => {
    return task.assignee_id === currentUserId;
  };

  const isTaskAssigner = (task) => {
    return task.assigner_id === currentUserId;
  };

  const canEditTask = (task) => {
    // 管理员、被指派人、指派人可以编辑
    return userRole === 'admin' || isTaskAssignedToUser(task) || isTaskAssigner(task);
  };

  const canDeleteTask = (task) => {
    // 管理员、指派人可以删除
    return userRole === 'admin' || isTaskAssigner(task);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'pending',
      in_progress: 'in-progress',
      completed: 'completed',
      cancelled: 'cancelled'
    };
    return colors[status] || 'pending';
  };

  const getStatusText = (status) => {
    const textMap = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return textMap[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      urgent: 'urgent'
    };
    return colors[priority] || 'medium';
  };

  const getPriorityText = (priority) => {
    const textMap = {
      low: '低',
      medium: '中',
      high: '高',
      urgent: '紧急'
    };
    return textMap[priority] || priority;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="tasks-page">
      <div className="page-topbar">
        <button className="back-btn" onClick={handleBack}>
          返回工作台
        </button>
      </div>

      <div className="page-header">
        <h2>任务管理</h2>
        {(userRole === 'admin' || userRole === 'manager') && (
          <button className="btn btn-primary" onClick={() => {
            resetForm();
            setEditingTask(null);
            setShowModal(true);
          }}>
            新建任务
          </button>
        )}
      </div>

      <div className="tasks-list">
        {tasks.length === 0 ? (
          <div className="empty-state">暂无任务</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <div className="task-badges">
                  <span className={`badge status-${getStatusColor(task.status)}`}>
                    {getStatusText(task.status)}
                  </span>
                  <span className={`badge priority-${getPriorityColor(task.priority)}`}>
                    {getPriorityText(task.priority)}
                  </span>
                </div>
              </div>
              {task.description && (
                <p className="task-description">{task.description}</p>
              )}
              <div className="task-info">
                <span>指派人: {task.assigner_name || task.assigner_id}</span>
                <span>被指派人: {task.assignee_name_cn || task.assignee_name || task.assignee_id}</span>
              </div>
              <div className="task-dates">
                {task.start_date && <span>开始: {task.start_date}</span>}
                {task.due_date && <span>截止: {task.due_date}</span>}
              </div>
              <div className="task-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${task.progress || 0}%` }}></div>
                </div>
                <span>{task.progress || 0}%</span>
              </div>
              <div className="task-actions">
                {canEditTask(task) && (
                  <button className="btn btn-secondary" onClick={() => handleEdit(task)}>编辑</button>
                )}
                {canDeleteTask(task) && (
                  <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>删除</button>
                )}
                {!canEditTask(task) && !canDeleteTask(task) && (
                  <span className="text-muted">只读</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 任务详情弹窗 */}
      {showDetailModal && detailTask && (
        <div className="modal" onClick={() => { setShowDetailModal(false); navigate('/tasks'); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>任务详情</h3>
              <button className="close-btn" onClick={() => { setShowDetailModal(false); navigate('/tasks'); }}>&times;</button>
            </div>
            <div className="task-detail-content">
              <div className="detail-row">
                <label>任务标题:</label>
                <span>{detailTask.title}</span>
              </div>
              <div className="detail-row">
                <label>状态:</label>
                <span className={`badge status-${getStatusColor(detailTask.status)}`}>
                  {getStatusText(detailTask.status)}
                </span>
              </div>
              <div className="detail-row">
                <label>优先级:</label>
                <span className={`badge priority-${getPriorityColor(detailTask.priority)}`}>
                  {getPriorityText(detailTask.priority)}
                </span>
              </div>
              {detailTask.description && (
                <div className="detail-row">
                  <label>任务描述:</label>
                  <p>{detailTask.description}</p>
                </div>
              )}
              <div className="detail-row">
                <label>指派人:</label>
                <span>{detailTask.assigner_name || detailTask.assigner_id}</span>
              </div>
              <div className="detail-row">
                <label>被指派人:</label>
                <span>{detailTask.assignee_name_cn || detailTask.assignee_name || detailTask.assignee_id}</span>
              </div>
              <div className="detail-row">
                <label>开始日期:</label>
                <span>{detailTask.start_date || '-'}</span>
              </div>
              <div className="detail-row">
                <label>截止日期:</label>
                <span>{detailTask.due_date || '-'}</span>
              </div>
              <div className="detail-row">
                <label>任务进度:</label>
                <div className="progress-display">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${detailTask.progress || 0}%` }}></div>
                  </div>
                  <span>{detailTask.progress || 0}%</span>
                </div>
              </div>
              <div className="detail-actions">
                {canEditTask(detailTask) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowDetailModal(false);
                      navigate('/tasks');
                      setTimeout(() => {
                        setEditingTask(detailTask);
                        setFormData({
                          title: detailTask.title,
                          description: detailTask.description,
                          assignee_id: detailTask.assignee_id,
                          priority: detailTask.priority,
                          status: detailTask.status,
                          progress: detailTask.progress || 0,
                          start_date: detailTask.start_date,
                          due_date: detailTask.due_date
                        });
                        setShowModal(true);
                      }, 100);
                    }}
                  >
                    编辑任务
                  </button>
                )}
                {canDeleteTask(detailTask) && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleDelete(detailTask.id);
                    }}
                  >
                    删除任务
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setShowDetailModal(false); navigate('/tasks'); }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingTask ? (userRole === 'employee' ? '更新任务进度' : '编辑任务') : '新建任务'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              {(userRole === 'employee' || (editingTask && isTaskAssignedToUser(editingTask))) ? (
                // 被指派人只能编辑状态和进度
                <>
                  <div className="form-group">
                    <label>任务标题</label>
                    <input
                      type="text"
                      value={formData.title}
                      disabled
                      className="disabled-input"
                    />
                    <small className="form-hint">无法修改任务标题</small>
                  </div>
                  {formData.description && (
                  <div className="form-group">
                    <label>任务描述</label>
                    <textarea
                      value={formData.description}
                      disabled
                      rows="3"
                      className="disabled-input"
                    ></textarea>
                    <small className="form-hint">无法修改任务描述</small>
                  </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>优先级</label>
                      <input
                        type="text"
                        value={formData.priority === 'high' ? '高' : formData.priority === 'medium' ? '中' : formData.priority === 'low' ? '低' : '紧急'}
                        disabled
                        className="disabled-input"
                      />
                      <small className="form-hint">无法修改优先级</small>
                    </div>
                    <div className="form-group">
                      <label>状态</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="pending">待处理</option>
                        <option value="in_progress">进行中</option>
                        <option value="completed">已完成</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>任务进度: {formData.progress}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                      className="progress-slider"
                    />
                  </div>
                </>
              ) : (
                // 管理员和超级管理员可以编辑所有字段
                <>
                  <div className="form-group">
                    <label>任务标题</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>任务描述</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="form-group">
                    <label>被指派人</label>
                    <select
                      value={formData.assignee_id}
                      onChange={(e) => setFormData({...formData, assignee_id: e.target.value})}
                      required
                    >
                      <option value="">请选择</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.username}{user.employee_name ? ` (${user.employee_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>优先级</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      >
                        <option value="low">低</option>
                        <option value="medium">中</option>
                        <option value="high">高</option>
                        <option value="urgent">紧急</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>状态</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="pending">待处理</option>
                        <option value="in_progress">进行中</option>
                        <option value="completed">已完成</option>
                        <option value="cancelled">已取消</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>任务进度: {formData.progress}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({...formData, progress: parseInt(e.target.value)})}
                      className="progress-slider"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>开始日期</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>截止日期</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">保存</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
