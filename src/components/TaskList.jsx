import React from 'react';

const TaskList = () => {
  const tasks = [
    { id: 1, title: '完成月度报告', priority: 'high', deadline: '2024-01-15' },
    { id: 2, title: '参加项目会议', priority: 'medium', deadline: '2024-01-12' },
    { id: 3, title: '审核合同文件', priority: 'high', deadline: '2024-01-18' },
    { id: 4, title: '更新客户资料', priority: 'low', deadline: '2024-01-20' }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          📋 待办任务
        </h3>
        <span className="card-action">查看全部</span>
      </div>
      <div className="card-content">
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
                      {task.priority === 'high' ? '高' : 
                       task.priority === 'medium' ? '中' : '低'}
                    </span>
                  </td>
                  <td>{task.deadline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskList;