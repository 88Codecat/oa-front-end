import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI } from '../utils/api';

const TaskList = forwardRef((_props, ref) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 获取当前用户ID
  const getCurrentUserId = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return null;
  };

  // 加载任务列表
  const loadTasks = async () => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('未找到用户ID，无法加载待办任务');
        setTasks([]);
        return;
      }

      // 获取待办任务（pending + in_progress）
      const data = await taskAPI.getList({ assignee_id: userId, limit: 5 });
      const tasks = data.data || data || [];
      // 过滤出待办任务：pending 或 in_progress 状态
      const pendingTasks = tasks.filter(t =>
        t.status === 'pending' || t.status === 'in_progress'
      );
      setTasks(pendingTasks);
    } catch (error) {
      console.error('加载任务失败:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 暴露刷新方法
  useImperativeHandle(ref, () => ({
    loadTasks
  }));

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return '紧急';
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '未知';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">📋 待办任务</h3>
        </div>
        <div className="card-content">
          <div className="loading">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📋 待办任务</h3>
        <span
          className="card-action"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/tasks')}
        >
          查看全部
        </span>
      </div>
      <div className="card-content">
        {tasks.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px', fontSize: '14px' }}>
            暂无待办任务
          </div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>任务</th>
                  <th>优先级</th>
                  <th>截止时间</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>
                      <span
                        style={{
                          color: getPriorityColor(task.priority),
                          fontWeight: '500'
                        }}
                      >
                        {getPriorityText(task.priority)}
                      </span>
                    </td>
                    <td>{task.due_date || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

export default TaskList;