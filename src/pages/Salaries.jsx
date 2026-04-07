import { useState, useEffect, useCallback } from 'react';
import { salaryAPI, employeeAPI } from '../utils/api';
import '../components/BackButton.css';

const Salaries = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({
    employee_id: '',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    basic_salary: '',
    bonus: '0',
    allowance: '0',
    deduction: '0',
    payment_date: '',
    status: 'pending',
    notes: ''
  });

  // 返回工作台
  const handleBack = () => {
    window.location.href = '/home';
  };

  const loadSalaries = useCallback(async () => {
    try {
      setLoading(true);
      const [year, month] = currentMonth.split('-');
      const data = await salaryAPI.getList({ year, month });
      setSalaries(data.data || []);
    } catch (error) {
      console.error('加载工资失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await employeeAPI.getList({ status: 'active' });
      setEmployees(data.data || []);
    } catch (error) {
      console.error('加载员工失败:', error);
    }
  }, []);

  useEffect(() => {
    loadSalaries();
    loadEmployees();
    // 获取当前用户角色
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
    }
  }, [currentMonth, loadSalaries, loadEmployees]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSalary) {
        await salaryAPI.update(editingSalary.id, formData);
      } else {
        await salaryAPI.create(formData);
      }
      setShowModal(false);
      setEditingSalary(null);
      resetForm();
      loadSalaries();
    } catch (error) {
      console.error('保存工资失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (salary) => {
    setEditingSalary(salary);
    setFormData({
      employee_id: salary.employee_id,
      year: salary.year,
      month: salary.month,
      basic_salary: salary.basic_salary,
      bonus: salary.bonus,
      allowance: salary.allowance,
      deduction: salary.deduction,
      payment_date: salary.payment_date || '',
      status: salary.status,
      notes: salary.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条工资记录吗?')) return;
    try {
      await salaryAPI.delete(id);
      loadSalaries();
    } catch (error) {
      console.error('删除工资失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const resetForm = () => {
    const [year, month] = currentMonth.split('-');
    setFormData({
      employee_id: '',
      year: parseInt(year),
      month: parseInt(month),
      basic_salary: '',
      bonus: '0',
      allowance: '0',
      deduction: '0',
      payment_date: '',
      status: 'pending',
      notes: ''
    });
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'pending',
      paid: 'paid'
    };
    return classes[status] || 'pending';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: '未发放',
      paid: '已发放'
    };
    return texts[status] || status;
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id == employeeId);
    return emp ? emp.name : employeeId;
  };

  const calculateTotal = (basic, bonus, allowance, deduction) => {
    return (parseFloat(basic) || 0) + (parseFloat(bonus) || 0) + (parseFloat(allowance) || 0) - (parseFloat(deduction) || 0);
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="salaries-page">
      <div className="page-topbar">
        <button className="back-btn" onClick={handleBack}>
          返回工作台
        </button>
      </div>

      <div className="page-header">
        <h2>工资管理</h2>
        <div className="header-actions">
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="month-picker"
          />
          {userRole === 'manager' && (
            <button className="btn btn-primary" onClick={() => {
              resetForm();
              setEditingSalary(null);
              setShowModal(true);
            }}>
              新建工资
            </button>
          )}
        </div>
      </div>

      <div className="salaries-list">
        {salaries.length === 0 ? (
          <div className="empty-state">暂无工资记录</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>员工</th>
                <th>年月</th>
                <th>基本工资</th>
                <th>奖金</th>
                <th>津贴</th>
                <th>扣除</th>
                <th>实发工资</th>
                <th>发放日期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {salaries.map(salary => (
                <tr key={salary.id}>
                  <td>{getEmployeeName(salary.employee_id)}</td>
                  <td>{salary.year}年{salary.month}月</td>
                  <td>¥{parseFloat(salary.basic_salary).toFixed(2)}</td>
                  <td>¥{parseFloat(salary.bonus).toFixed(2)}</td>
                  <td>¥{parseFloat(salary.allowance).toFixed(2)}</td>
                  <td>¥{parseFloat(salary.deduction).toFixed(2)}</td>
                  <td className="total-salary">
                    ¥{calculateTotal(salary.basic_salary, salary.bonus, salary.allowance, salary.deduction).toFixed(2)}
                  </td>
                  <td>{salary.payment_date || '-'}</td>
                  <td>
                    <span className={`status ${getStatusClass(salary.status)}`}>
                      {getStatusText(salary.status)}
                    </span>
                  </td>
                  <td>
                    {userRole === 'manager' && (
                      <>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(salary)}>编辑</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(salary.id)}>删除</button>
                      </>
                    )}
                    {userRole !== 'manager' && <span className="text-muted">只读</span>}
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
              <h3>{editingSalary ? '编辑工资' : '新建工资'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>员工</label>
                  <select
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    required
                  >
                    <option value="">请选择</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_no})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>年份</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>月份</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={formData.month}
                    onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>基本工资</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basic_salary}
                    onChange={(e) => setFormData({...formData, basic_salary: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>奖金</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.bonus}
                    onChange={(e) => setFormData({...formData, bonus: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>津贴</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.allowance}
                    onChange={(e) => setFormData({...formData, allowance: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>扣除</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.deduction}
                    onChange={(e) => setFormData({...formData, deduction: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>发放日期</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="pending">未发放</option>
                    <option value="paid">已发放</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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

export default Salaries;
