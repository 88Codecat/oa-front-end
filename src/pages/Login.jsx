import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { authAPI } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
      const response = await authAPI.login(formData);
      if (response.success && response.token) {
        sessionStorage.setItem('token', response.token);
        sessionStorage.setItem('user', JSON.stringify(response.user));
        navigate('/home');
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="formContainer">
      <div className="formWrapper">
        <span className="logo">企业OA办公系统</span>
        <span className="formTitle">登录</span>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="用户名/邮箱"
            value={formData.username}
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
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p>还没有账号吗？<NavLink to="/register">注册</NavLink></p>
      </div>
    </div>
  );
};

export default Login;