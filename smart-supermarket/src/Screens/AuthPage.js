import React from 'react';
import { useLocation } from 'react-router-dom';
import '../Styles/AuthPage.css';  // 重命名CSS文件以反映它现在用于两种用途

function AuthPage() {
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  return (
    <div className="AuthPage">
      <h2>{isRegister ? 'Register' : 'Sign In'}</h2>
      <form className="auth-form">
        {isRegister && <input type="text" placeholder="Username" required />}
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        {isRegister && <input type="password" placeholder="Confirm Password" required />}
        <button type="submit">{isRegister ? 'Register' : 'Sign In'}</button>
      </form>
    </div>
  );
}

export default AuthPage;