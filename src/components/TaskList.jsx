import { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskAPI, leaveAPI } from '../utils/api';

const TaskList = forwardRef((_props, ref) => {
  const [tasks, setTasks] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();
  
  const BATCH_SIZE = 10;  // 每批次加载数量

  // 获取当前用户ID和角色
  const getCurrentUser = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return { id: user.id, role: user.role };
    }
    return { id: null, role: null };
  };

  // 合并任务和请假列表
  const getAllItems = useCallback(() => {
    const taskItems = tasks.map(t => ({ ...t, itemType: 'task' }));
    const leaveItems = pendingLeaves.map(l => ({ ...l, itemType: 'leave' }));
    return [...taskItems, ...leaveItems];
  }, [tasks, pendingLeaves]);

  // 加载任务列表和请假申请
  const loadTasks = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setVisibleCount(10);
      }
      const currentUser = getCurrentUser();
      
      if (!currentUser.id) {
        setTasks([]);
        setPendingLeaves([]);
        setHasMore(false);
        return;
      }

      // 并行加载任务和请假申请
      const [taskData, leaveData] = await Promise.all([
        taskAPI.getList({ assignee_id: currentUser.id, limit: 50 }),
        leaveAPI.getList({ status: 'pending', limit: 50 })
      ]);
      
      // 处理任务数据
      const allTasks = taskData.data || taskData || [];
      const pendingTasks = allTasks.filter(t =>
        t.status === 'pending' || t.status === 'in_progress'
      );
      
      // 处理请假数据
      // 管理员和经理显示所有待审批请假，普通员工显示自己的请假
      const allLeaves = leaveData.data || [];
      let filteredLeaves = [];
      if (currentUser.role === 'admin' || currentUser.role === 'manager') {
        filteredLeaves = allLeaves;
      } else {
        filteredLeaves = allLeaves.filter(l => 
          l.employee_id && l.status === 'pending'
        );
      }
      
      if (append) {
        setTasks(prev => [...prev, ...pendingTasks]);
        setPendingLeaves(prev => [...prev, ...filteredLeaves]);
      } else {
        setTasks(pendingTasks);
        setPendingLeaves(filteredLeaves);
      }
      
      // 判断是否有更多数据
      setHasMore(pendingTasks.length + filteredLeaves.length > visibleCount);
    } catch (error) {
      console.error('加载任务失败:', error);
      setTasks([]);
      setPendingLeaves([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setVisibleCount(prev => prev + BATCH_SIZE);
      loadTasks(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMore, hasMore, BATCH_SIZE]);

  // 滚动事件处理（懒加载）
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // 当滚动到底部附近时加载更多
    if (scrollHeight - scrollTop - clientHeight < 100 && hasMore && !loadingMore) {
      loadMore();
    }
  }, [hasMore, loadingMore, loadMore]);

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

  const allItems = getAllItems();
  const totalCount = allItems.length;
  const visibleItems = allItems.slice(0, visibleCount);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📋 待办任务 {totalCount > 0 && <span style={{ fontSize: '14px', color: '#dc3545' }}>({totalCount})</span>}</h3>
        <span
          className="card-action"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/tasks')}
        >
          查看全部
        </span>
      </div>
      <div 
        className="card-content" 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          padding: '0'
        }}
      >
        {totalCount === 0 ? (
          <div className="empty-state" style={{ padding: '30px', fontSize: '14px' }}>
            暂无待办任务
          </div>
        ) : (
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>类型</th>
                  <th>内容</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {/* 任务列表 */}
                {visibleItems.map(item => item.itemType === 'task' ? (
                  <tr
                    key={`task-${item.id}`}
                    onClick={() => navigate(`/tasks/${item.id}`)}
                    style={{ cursor: 'pointer' }}
                    className="clickable-row"
                  >
                    <td>
                      <span style={{ 
                        background: '#e3f2fd', 
                        color: '#1976d2',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        任务
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500' }}>{item.title}</span>
                      <span style={{ marginLeft: '8px', color: getPriorityColor(item.priority), fontSize: '12px' }}>
                        [{getPriorityText(item.priority)}]
                      </span>
                    </td>
                    <td>{item.due_date || '-'}</td>
                  </tr>
                ) : (
                  <tr
                    key={`leave-${item.id}`}
                    onClick={() => navigate('/attendance')}
                    style={{ cursor: 'pointer' }}
                    className="clickable-row"
                  >
                    <td>
                      <span style={{ 
                        background: '#fff3e0', 
                        color: '#f57c00',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        请假
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '500' }}>
                        {item.leave_type} - {item.employee_name || '员工'}
                      </span>
                      <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                        {item.days}天
                      </span>
                    </td>
                    <td>{item.start_date} 至 {item.end_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div style={{ 
                textAlign: 'center', 
                padding: '15px',
                borderTop: '1px solid #eee'
              }}>
                {loadingMore ? (
                  <span style={{ color: '#666' }}>加载中...</span>
                ) : (
                  <span 
                    onClick={loadMore}
                    style={{ 
                      color: '#1976d2', 
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    加载更多 ↓
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default TaskList;
