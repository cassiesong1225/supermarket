import React, { useState } from "react";
import axios from "axios";
import "../Styles/HomePage.css";
import { Link } from "react-router-dom";
import PreferenceSurvey from "./PreferenceSurvey";
import { database } from "../Firebase-files/Firebasesetup";

function HomePage() {
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [recognitionPhoto, setRecognitionPhoto] = useState(null);
  const [recognitionMessage, setRecognitionMessage] = useState("");
  const [recognizedUserId, setRecognizedUserId] = useState(null);
  const [recognizedMood, setRecognizedMood] = useState(null);

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleRecognitionPhotoChange = (e) => {
    setRecognitionPhoto(e.target.files[0]);
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
        "https://c698-34-23-46-179.ngrok-free.app/upload",
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
      setMessage(
        `An error occurred: ${error.response?.data?.error || error.message}`
      );
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

  const recognizeFace = async () => {
    if (!recognitionPhoto) {
      setRecognitionMessage("Please select a photo for recognition.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("user_type", "login");
    formData.append("photo", recognitionPhoto);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5001/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setRecognitionMessage(response.data.message);
      // 解析返回的消息,提取用户名和情绪
      const match = response.data.message.match(/welcome back (.*?)! You seem to be feeling (.*?)\./);
      if (match) {
        const [, username, mood] = match;
        // 假设用户名为jt对应userId为1
        const userId = username === 'jt' ? 1 : null; 
        setRecognizedUserId(userId);
        setRecognizedMood(mood);
      }
    } catch (error) {
      console.error("Error details:", error);
      setRecognitionMessage(
        `An error occurred: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  console.log("database", database);

  return (
    <div className="HomePage">
      <header className="HomePage-header">
        <nav>
          <div className="nav-links">
            {!isLoggedIn && (
              <>
                <button
                  onClick={() => handleUserTypeChange("login")}
                  className="login-btn"
                >
                  Log in
                </button>
                <button
                  onClick={() => handleUserTypeChange("signup")}
                  className="signup-btn"
                >
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
          
          {/* 新增人脸识别部分 */}
          <div className="face-recognition-section">
            <h2>Face Recognition</h2>
            <input 
              type="file" 
              onChange={handleRecognitionPhotoChange} 
              accept="image/*" 
            />
            <button onClick={recognizeFace} disabled={loading}>
              {loading ? "Processing..." : "Recognize Face"}
            </button>
            {recognitionMessage && <p>{recognitionMessage}</p>}
          </div>
        </div>
        <div className="bottom-content">
          <div className="features">
            <div className="feature">
              <Link to="/face-recognition" className="feature-link">
                <h3>
                  Face Recognition <br /> Emotion Detection
                </h3>
              </Link>
            </div>
            <div className="feature">
              <h3 onClick={() => setShowSurvey(true)}>
                User Preference <br />
                Product Feature Analysis
              </h3>
            </div>
            <div className="feature">
              <Link 
                to="/recommendations" 
                state={{ userId: recognizedUserId, mood: recognizedMood }}
                className="feature-link"
                >
              <h3>
                Give <br />
                Recommendations
              </h3>
            </Link>
          </div>
          </div>
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <span className="close" onClick={closeModal}>
                &times;
              </span>
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
                  <input type="file" onChange={handlePhotoChange} required />
                  <button type="submit">
                    {userType === "login" ? "Log in" : "Sign up"}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
        {showSurvey && (
          <PreferenceSurvey closeSurvey={() => setShowSurvey(false)} />
        )}
      </main>
    </div>
  );
}

export default HomePage;
