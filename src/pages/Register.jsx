import Add from '../assets/addAvatar.png';

const Register = () => {
  return (
  
  <div className="formContainer">
	<div className="formWrapper">
		<span className="logo">企业OA办公系统</span>
		<span className="formTitle">注册</span>
		<form >
			<input type="text"  placeholder="账户"/>
			<input type="email"  placeholder="邮箱"/>
			<input type="password"  placeholder="密码"/>
			<input  style={{display: "none"}}type="file"  id="file"/>
			<label htmlFor="file">
				<img src={Add} alt="" />
				<span>上传头像</span>
			</label>
			<button type="submit">注册</button>
		</form>
		<p>已有账号了吗？<a href="/login">登录</a></p>
	</div>
  </div>

  );
};

export default Register;