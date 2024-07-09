import React from 'react';
import '../Styles/RegisterPage.css';

function RegisterPage() {
  return (
    <div className="RegisterPage">
      <h2>Register</h2>
      <form className="register-form">
        <input type="text" placeholder="Username" required />
        <input type="email" placeholder="Email" required />
        <input type="password" placeholder="Password" required />
        <input type="password" placeholder="Confirm Password" required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default RegisterPage;