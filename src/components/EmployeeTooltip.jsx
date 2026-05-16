import { useState } from 'react';
import { getCurrentEmployee } from '../utils/api';
import './EmployeeTooltip.css';

const EmployeeTooltip = ({ children }) => {
  const [show, setShow] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipWidth = 300; // 弹窗宽度
    const windowWidth = window.innerWidth;
    
    // 计算位置，确保不超出窗口右边
    let left = rect.left;
    if (left + tooltipWidth > windowWidth - 10) {
      left = windowWidth - tooltipWidth - 10;
    }
    
    // 确保不超出窗口左边
    if (left < 10) {
      left = 10;
    }
    
    setPosition({
      top: rect.bottom + 10,
      left: left
    });
    setShow(true);
    
    if (!employee) {
      loadEmployee();
    }
  };

  const handleMouseLeave = () => {
    setShow(false);
  };

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const data = await getCurrentEmployee();
      setEmployee(data);
    } catch (error) {
      console.error('获取员工信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleText = (role) => {
    const roleMap = {
      admin: '系统管理员',
      manager: '部门经理',
      employee: '普通员工'
    };
    return roleMap[role] || role;
  };

  return (
    <div 
      className="employee-tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {show && (
        <div 
          className="employee-tooltip"
          style={{ top: position.top, left: position.left }}
        >
          {loading ? (
            <div className="tooltip-loading">加载中...</div>
          ) : employee ? (
            <div className="tooltip-content">
              <div className="tooltip-header">
                <div className="tooltip-avatar">
                  {employee.name?.charAt(0) || employee.username?.charAt(0) || 'U'}
                </div>
                <div className="tooltip-user-info">
                  <div className="tooltip-name">{employee.name || employee.username}</div>
                  <div className="tooltip-role">{getRoleText(employee.role || employee.user_role)}</div>
                </div>
              </div>
              
              <div className="tooltip-details">
                {employee.employee_no && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">工号</span>
                    <span className="tooltip-value">{employee.employee_no}</span>
                  </div>
                )}
                {employee.department_name && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">部门</span>
                    <span className="tooltip-value">{employee.department_name}</span>
                  </div>
                )}
                {employee.position_title && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">职位</span>
                    <span className="tooltip-value">{employee.position_title}</span>
                  </div>
                )}
                {employee.phone && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">电话</span>
                    <span className="tooltip-value">{employee.phone}</span>
                  </div>
                )}
                {employee.email && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">邮箱</span>
                    <span className="tooltip-value">{employee.email}</span>
                  </div>
                )}
                {employee.gender && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">性别</span>
                    <span className="tooltip-value">{employee.gender === 'male' ? '男' : employee.gender === 'female' ? '女' : '其他'}</span>
                  </div>
                )}
                {employee.hire_date && (
                  <div className="tooltip-row">
                    <span className="tooltip-label">入职日期</span>
                    <span className="tooltip-value">{new Date(employee.hire_date).toLocaleDateString('zh-CN')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="tooltip-empty">暂无员工信息</div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeTooltip;
