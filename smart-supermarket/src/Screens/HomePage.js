import React from 'react';
import { Link } from 'react-router-dom';
import '../Styles/HomePage.css';

function HomePage() {
  return (
    <div className="HomePage">
      <header className="HomePage-header">
        <nav>
          <div className="nav-links">
            <button className="nav-link">Home</button>
            <Link to="/signin" className="nav-link">Signin</Link>
          </div>
        </nav>
      </header>
      <main className="main-content">
        <div className="centered-container">
          <div className="top-content">
            <h1>Smart Supermarket Recommender System</h1>
            <Link to="/register" className="register-btn">Register</Link>
          </div>
        </div>
        <div className="bottom-content"> 
          <div className="features">
            <div className="feature">
              <h3>Face Recognition <br /> Emotion Detection</h3>
            </div>
            <div className="feature">
              <h3>User Preference <br />Product Feature Analysis</h3>
            </div>
            <div className="feature">
              <h3>Give <br />Recommendations</h3>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HomePage;