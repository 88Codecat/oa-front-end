import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { authAPI } from '../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        navigate('/login');
      } else {
        setError(response.message || '注册失败');
      }
    } catch (err) {
      setError(err.message || '注册失败，请重试');
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
            name="username"
            placeholder="账户"
            value={formData.username}
            onChange={handleChange}
            required
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
            placeholder="密码"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="employee">普通员工</option>
            <option value="manager">经理</option>
            <option value="admin">管理员</option>
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