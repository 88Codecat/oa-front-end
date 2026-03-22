import { useState, useEffect } from 'react';
import { taskAPI } from '../utils/api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
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
      // 使用正确的auth API端点获取所有用户
      const data = await fetch('http://localhost:3000/api/auth/users/all', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }).then(res => res.json());
      setUsers(data.data || data || []);
    } catch (error) {
      console.error('加载用户列表失败:', error);
      setUsers([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        // 根据角色过滤提交的字段
        let submitData;
        if (userRole === 'employee') {
          // 员工只能提交status和progress
          submitData = {
            status: formData.status,
            progress: formData.progress
          };
        } else {
          // 管理员和超级管理员可以提交所有字段
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
                <span>被指派人: {task.assignee_name || task.assignee_id}</span>
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
                {userRole === 'employee' ? (
                  // 员工只能编辑分配给自己的任务
                  isTaskAssignedToUser(task) && (
                    <button className="btn btn-secondary" onClick={() => handleEdit(task)}>更新进度</button>
                  )
                ) : (
                  // 管理员和超级管理员可以编辑所有任务
                  <>
                    <button className="btn btn-secondary" onClick={() => handleEdit(task)}>编辑</button>
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <button className="btn btn-danger" onClick={() => handleDelete(task.id)}>删除</button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingTask ? (userRole === 'employee' ? '更新任务进度' : '编辑任务') : '新建任务'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              {userRole === 'employee' ? (
                // 员工只能编辑状态和进度
                <>
                  <div className="form-group">
                    <label>任务标题</label>
                    <input
                      type="text"
                      value={formData.title}
                      disabled
                      className="disabled-input"
                    />
                    <small className="form-hint">员工无法修改任务标题</small>
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
                      <small className="form-hint">员工无法修改任务描述</small>
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
                      <small className="form-hint">员工无法修改优先级</small>
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
                        <option key={user.id} value={user.id}>{user.username}</option>
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
