import { useState, useEffect } from 'react';
import React from 'react';
import { departmentAPI, authAPI } from '../utils/api';
import '../components/BackButton.css';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    parent_id: '',
    description: '',
    manager_id: ''
  });

  // 返回工作台
  const handleBack = () => {
    window.location.href = '/home';
  };

  useEffect(() => {
    loadDepartments();
    loadUsers();
    // 获取当前用户角色
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentAPI.getList();
      setDepartments(data.data || data || []);
    } catch (error) {
      console.error('加载部门失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await authAPI.getUsers();
      setUsers(data.data || []);
    } catch (error) {
      console.error('加载用户失败:', error);
    }
  };

  // 获取指定部门的员工列表
  const getEmployeesByDepartment = (deptId) => {
    return users.filter(user => {
      // 查找该用户对应的员工记录
      return user.department_id === parseInt(deptId);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        // 如果设置了新的部门经理
        if (formData.manager_id && formData.manager_id !== editingDepartment.manager_id) {
          // 将该员工设置为经理角色
          await authAPI.updateRole(formData.manager_id, 'manager');
        }
        // 如果移除了部门经理
        if (!formData.manager_id && editingDepartment.manager_id) {
          // 将原经理降为普通员工
          await authAPI.updateRole(editingDepartment.manager_id, 'employee');
        }
        await departmentAPI.update(editingDepartment.id, formData);
      } else {
        // 新建部门
        await departmentAPI.create(formData);
        // 如果设置了经理，同时更新角色
        if (formData.manager_id) {
          await authAPI.updateRole(formData.manager_id, 'manager');
        }
      }
      setShowModal(false);
      setEditingDepartment(null);
      resetForm();
      loadDepartments();
      loadUsers(); // 刷新用户列表
    } catch (error) {
      console.error('保存部门失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      parent_id: department.parent_id || '',
      description: department.description || '',
      manager_id: department.manager_id || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个部门吗?')) return;
    try {
      await departmentAPI.delete(id);
      loadDepartments();
    } catch (error) {
      console.error('删除部门失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      parent_id: '',
      description: '',
      manager_id: ''
    });
  };

  const flattenDepartments = (depts, result = []) => {
    depts.forEach(dept => {
      result.push(dept);
      if (dept.children) {
        flattenDepartments(dept.children, result);
      }
    });
    return result;
  };

  const getAvailableParents = (currentDeptId) => {
    const allDepts = flattenDepartments(departments);
    const getDeptIds = (depts, ids = []) => {
      depts.forEach(dept => {
        ids.push(dept.id);
        if (dept.children) {
          getDeptIds(dept.children, ids);
        }
      });
      return ids;
    };

    const excludeIds = currentDeptId ? getDeptIds(allDepts.filter(d => d.id === currentDeptId), []) : [];
    return allDepts.filter(d => !excludeIds.includes(d.id));
  };

  const renderDepartmentRow = (dept, level = 0) => {
    const paddingLeft = level * 20;
    return (
      <React.Fragment key={dept.id}>
        <tr>
          <td style={{ paddingLeft: `${paddingLeft}px` }}>
            {level > 0 && <span className="tree-indent">└─</span>}
            {dept.name}
          </td>
          <td>{dept.description || '-'}</td>
          <td>{dept.manager_name || dept.manager_id || '-'}</td>
          <td>
            {userRole === 'admin' && (
              <>
                <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(dept)}>编辑</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(dept.id)}>删除</button>
              </>
            )}
            {userRole !== 'admin' && <span className="text-muted">只读</span>}
          </td>
        </tr>
        {dept.children && dept.children.map(child => renderDepartmentRow(child, level + 1))}
      </React.Fragment>
    );
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="departments-page">
      <div className="page-topbar">
        <button className="back-btn" onClick={handleBack}>
          返回工作台
        </button>
      </div>

      <div className="page-header">
        <h2>部门管理</h2>
        {userRole === 'admin' && (
          <button className="btn btn-primary" onClick={() => {
            resetForm();
            setEditingDepartment(null);
            setShowModal(true);
          }}>
            新建部门
          </button>
        )}
      </div>

      <div className="departments-list">
        {departments.length === 0 ? (
          <div className="empty-state">暂无部门</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>部门名称</th>
                <th>描述</th>
                <th>部门经理</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(dept => renderDepartmentRow(dept))}
              {departments.length === 0 && <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>暂无部门</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDepartment ? '编辑部门' : '新建部门'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>部门名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>上级部门</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                >
                  <option value="">无（顶级部门）</option>
                  {getAvailableParents(editingDepartment?.id)
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group">
                <label>部门经理</label>
                <select
                  value={formData.manager_id}
                  onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                >
                  <option value="">无</option>
                  {getEmployeesByDepartment(formData.parent_id || editingDepartment?.id)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}{user.employee_name ? ` (${user.employee_name})` : ''}
                      </option>
                    ))
                  }
                </select>
                <small className="form-hint">选择本部门的员工作为部门经理</small>
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
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

export default Departments;
