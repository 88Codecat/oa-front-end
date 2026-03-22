import { useState, useEffect } from 'react';
import { departmentAPI } from '../utils/api';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
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

  useEffect(() => {
    loadDepartments();
    // 获取当前用户角色
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentAPI.getList();
      setDepartments(data.data || []);
    } catch (error) {
      console.error('加载部门失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await departmentAPI.update(editingDepartment.id, formData);
      } else {
        await departmentAPI.create(formData);
      }
      setShowModal(false);
      setEditingDepartment(null);
      resetForm();
      loadDepartments();
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

  const buildDepartmentTree = (parentId = null) => {
    return departments
      .filter(dept => (parentId === null && !dept.parent_id) || dept.parent_id == parentId)
      .map(dept => ({
        ...dept,
        children: buildDepartmentTree(dept.id)
      }));
  };

  const renderDepartmentRow = (dept, level = 0) => {
    const paddingLeft = level * 20;
    return (
      <>
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
      </>
    );
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  const departmentTree = buildDepartmentTree();

  return (
    <div className="departments-page">
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
              {departmentTree.map(dept => renderDepartmentRow(dept))}
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
                <label>上级部门ID</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value})}
                >
                  <option value="">无（顶级部门）</option>
                  {departments
                    .filter(d => !editingDepartment || d.id !== editingDepartment.id)
                    .map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))
                  }
                </select>
              </div>
              <div className="form-group">
                <label>部门经理ID</label>
                <input
                  type="number"
                  value={formData.manager_id}
                  onChange={(e) => setFormData({...formData, manager_id: e.target.value})}
                />
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
