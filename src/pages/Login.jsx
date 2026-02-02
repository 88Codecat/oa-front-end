import React from 'react';
import Register from './Register';

const Login = () => {
  return (
  
  <div className="formContainer">
	<div className="formWrapper">
		<span className="logo">企业OA办公系统</span>
		<span className="formTitle">登录</span>
		<form >
			<input type="text"  placeholder="账户"/>
			
			<input type="password"  placeholder="密码"/>
		  
			<button type="submit">登录</button>
		</form>
		<p>还没有有账号是吗？<a href="/login">注册</a></p>
	</div>
  </div>

  );
};

export default Login;