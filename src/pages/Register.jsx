import { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { authAPI, departmentAPI } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const data = await departmentAPI.getPublicList();
      setDepartments(data.data || data || []);
    } catch (err) {
      console.error('加载部门失败:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register(formData);
      if (response.success) {
        alert('注册成功！请登录');
        navigate('/login');
      } else {
        setError(response.message || '注册失败');
      }
    } catch (err) {
      // 处理验证错误
      if (err.message && err.message.includes('验证失败')) {
        setError(err.message);
      } else {
        setError(err.message || '注册失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">企业OA办公系统</span>
        <span className="formTitle">注册</span>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="姓名"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={2}
          />
          <input
            type="email"
            name="email"
            placeholder="邮箱"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="密码（至少6个字符）"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            required
          >
            <option value="">请选择部门</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p>已有账号了吗？<NavLink to="/login">登录</NavLink></p>
      </div>
    </div>
  );
};

export default Register;
