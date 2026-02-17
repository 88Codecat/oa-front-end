import React from 'react';
import StatCard from './StatCard';
import TaskList from './TaskList';
import RecentDocuments from './RecentDocuments';
import QuickActions from './QuickActions';

const Dashboard = () => {
  const stats = [
    { number: '12', label: '待办任务', change: '+2', positive: false },
    { number: '8', label: '今日完成', change: '+3', positive: true },
    { number: '45', label: '本周任务', change: '+12', positive: true },
    { number: '156', label: '总计完成', change: '+28', positive: true }
  ];

  return (
    <>
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
      
      <div className="dashboard-grid">
        <TaskList />
        <RecentDocuments />
        <QuickActions />
      </div>
    </>
  );
};

export default Dashboard;