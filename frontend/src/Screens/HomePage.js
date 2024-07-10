import React, { useState } from "react";
import axios from "axios";
import "../Styles/HomePage.css";
import { Link } from 'react-router-dom';

function HomePage() {
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userType || !userName || !password || !photo) {
      setMessage("Please fill all fields and select a photo.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("user_type", userType);
    formData.append("user_name", userName);
    formData.append("password", password);
    formData.append("photo", photo);

    try {
      const response = await axios.post(
        "https://3310-35-201-149-81.ngrok-free.app/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage(response.data.message);
      setShowModal(false);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error details:", error);
      setMessage(`An error occurred: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setUserName("");
    setPassword("");
    setPhoto(null);
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="HomePage">
      <header className="HomePage-header">
        <nav>
          <div className="nav-links">
            {!isLoggedIn && (
              <>
                <button onClick={() => handleUserTypeChange("login")} className="login-btn">
                  Log in
                </button>
                <button onClick={() => handleUserTypeChange("signup")} className="signup-btn">
                  Sign up
                </button>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="main-content">
        <div className="centered-container">
          <div className="top-content">
            <h1>Smart Supermarket Recommender System</h1>
          </div>
          {message && <p>{message}</p>}
        </div>
        <div className="bottom-content">
          <div className="features">
            <div className="feature">
              <Link to="/face-recognition" className="feature-link">
                <h3>Face Recognition <br /> Emotion Detection</h3>
              </Link>
            </div>
            <div className="feature">
              <h3>User Preference <br />Product Feature Analysis</h3>
            </div>
            <div className="feature">
              <h3>Give <br />Recommendations</h3>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeModal}>&times;</span>
              <h2>{userType === "login" ? "Log in" : "Sign up"}</h2>
              {loading ? (
                <div className="loader"></div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <input
                    type="text"
                    placeholder="Enter your username"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <input 
                    type="file" 
                    onChange={handlePhotoChange} 
                    required
                  />
                  <button type="submit">{userType === "login" ? "Log in" : "Sign up"}</button>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;