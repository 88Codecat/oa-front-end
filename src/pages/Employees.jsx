import { useState, useEffect } from 'react';
import { employeeAPI, departmentAPI } from '../utils/api';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    user_id: '',
    employee_no: '',
    name: '',
    gender: 'other',
    birth_date: '',
    phone: '',
    address: '',
    department_id: '',
    position_id: '',
    hire_date: '',
    status: 'active'
  });

  useEffect(() => {
    loadEmployees();
    loadDepartments();
    // 获取当前用户角色
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
    }
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeAPI.getList({});
      setEmployees(data.data || []);
    } catch (error) {
      console.error('加载员工失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentAPI.getList();
      setDepartments(data.data || []);
    } catch (error) {
      console.error('加载部门失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await employeeAPI.update(editingEmployee.id, formData);
      } else {
        await employeeAPI.create(formData);
      }
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      loadEmployees();
    } catch (error) {
      console.error('保存员工失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      user_id: employee.user_id,
      employee_no: employee.employee_no,
      name: employee.name,
      gender: employee.gender,
      birth_date: employee.birth_date || '',
      phone: employee.phone || '',
      address: employee.address || '',
      department_id: employee.department_id || '',
      position_id: employee.position_id || '',
      hire_date: employee.hire_date || '',
      status: employee.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个员工吗?')) return;
    try {
      await employeeAPI.delete(id);
      loadEmployees();
    } catch (error) {
      console.error('删除员工失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      employee_no: '',
      name: '',
      gender: 'other',
      birth_date: '',
      phone: '',
      address: '',
      department_id: '',
      position_id: '',
      hire_date: '',
      status: 'active'
    });
  };

  const getStatusClass = (status) => {
    const classes = {
      active: 'active',
      inactive: 'inactive',
      resigned: 'resigned'
    };
    return classes[status] || 'active';
  };

  const getStatusText = (status) => {
    const texts = {
      active: '在职',
      inactive: '停职',
      resigned: '离职'
    };
    return texts[status] || status;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="employees-page">
      <div className="page-header">
        <h2>员工管理</h2>
        {userRole !== 'employee' && (
          <button className="btn btn-primary" onClick={() => {
            resetForm();
            setEditingEmployee(null);
            setShowModal(true);
          }}>
            新建员工
          </button>
        )}
      </div>

      <div className="employees-list">
        {employees.length === 0 ? (
          <div className="empty-state">暂无员工</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>工号</th>
                <th>姓名</th>
                <th>性别</th>
                <th>部门</th>
                <th>电话</th>
                <th>入职日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.employee_no}</td>
                  <td>{employee.name}</td>
                  <td>
                    {employee.gender === 'male' ? '男' : employee.gender === 'female' ? '女' : '其他'}
                  </td>
                  <td>{employee.department_name || employee.department_id || '-'}</td>
                  <td>{employee.phone || '-'}</td>
                  <td>{employee.hire_date || '-'}</td>
                  <td>
                    <span className={`status ${getStatusClass(employee.status)}`}>
                      {getStatusText(employee.status)}
                    </span>
                  </td>
                  <td>
                    {userRole !== 'employee' && (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(employee)}>编辑</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(employee.id)}>删除</button>
                      </>
                    )}
                    {userRole === 'employee' && <span className="text-muted">只读</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content modal-large">
            <div className="modal-header">
              <h3>{editingEmployee ? '编辑员工' : '新建员工'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>用户ID</label>
                  <input
                    type="number"
                    value={formData.user_id}
                    onChange={(e) => setFormData({...formData, user_id: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>工号</label>
                  <input
                    type="text"
                    value={formData.employee_no}
                    onChange={(e) => setFormData({...formData, employee_no: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>姓名</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>性别</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                    <option value="other">其他</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>出生日期</label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>入职日期</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>电话</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>地址</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="2"
                ></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>部门ID</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                  >
                    <option value="">请选择</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>职位ID</label>
                  <input
                    type="number"
                    value={formData.position_id}
                    onChange={(e) => setFormData({...formData, position_id: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">在职</option>
                  <option value="inactive">停职</option>
                  <option value="resigned">离职</option>
                </select>
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

export default Employees;
