import React, { useState, useEffect } from "react";
import axios from "axios";
import "../Styles/HomePage.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../UserContext";
import { storage } from "../Firebase-files/Firebasesetup";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

function HomePage() {
  const { user, login, logout } = useUser();
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.userId) {
      const { userId, userName, detectedMood } = location.state;
      login(userId, userName, detectedMood);
    }
  }, [location.state, login]);

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userType || !photo || (userType === "signup" && !userName)) {
      setMessage("Please fill all fields and select a photo.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(photo);
    reader.onloadend = async () => {
      try {
        const photoDataUrl = reader.result;
        const photoRef = ref(storage, `photos/${Date.now()}.jpg`);
        await uploadString(photoRef, photoDataUrl, "data_url");
        const photoURL = await getDownloadURL(photoRef);

        const formData = new FormData();
        formData.append("user_type", userType);
        formData.append("photo", photoURL);
        if (userType === "signup") {
          formData.append("user_name", userName);
        }

        const response = await axios.post(
          "http://127.0.0.1:5001/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Response data:", response.data); // Debugging line
        setShowModal(false);
        if (userType === "login") {
          const { userId, userName, mood } = response.data;
          login(userId, userName, mood);
        } else {
          setMessage(response.data.message);
        }
      } catch (error) {
        console.error("Error details:", error);
        setMessage(
          `An error occurred: ${error.response?.data?.error || error.message}`
        );
      } finally {
        setLoading(false);
      }
    };
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setUserName("");
    setPhoto(null);
    setMessage("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSurveyClick = () => {
    if (user.isLoggedIn) {
      navigate("/preference-survey", {
        state: {
          userId: user.userId,
          userName: user.userName,
          detectedMood: user.detectedMood,
        },
      });
    } else {
      setMessage("Please log in to access the survey.");
    }
  };

  const handleFaceRecognitionClick = (e) => {
    if (user.isLoggedIn) {
      e.preventDefault();
      setMessage(
        "You are already logged in. Please log out first to use Face Recognition."
      );
    } else {
      navigate("/face-recognition");
    }
  };

  const handleLogout = () => {
    logout();
    setMessage(""); // Clear the message on logout
    navigate("/");
  };

  return (
    <div className="HomePage">
      <header className="HomePage-header">
        <nav>
          <div className="nav-links">
            {!user.isLoggedIn ? (
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
            ) : (
              <button onClick={handleLogout} className="logout-btn">
                Log out
              </button>
            )}
          </div>
        </nav>
      </header>
      <main className="main-content">
        <div className="centered-container">
          <div className="top-content">
            <h1>Smart Supermarket Recommender System</h1>
            {user.isLoggedIn && (
              <p>
                Welcome {user.userName}! You seem to be feeling{" "}
                {user.detectedMood}.
              </p>
            )}
          </div>
          {message && <p>{message}</p>}
        </div>
        <div className="bottom-content">
          <div className="features">
            <div className="feature">
              <Link
                to="/face-recognition"
                className="feature-link"
                onClick={handleFaceRecognitionClick}
              >
                <h3>
                  Face Recognition <br /> Emotion Detection
                </h3>
              </Link>
            </div>
            <div className="feature">
              <h3 onClick={handleSurveyClick}>
                User Preference <br />
                Product Feature Analysis
              </h3>
            </div>
            <div className="feature">
              <Link to="/recommendations" className="feature-link">
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
                  {userType === "signup" && (
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  )}
                  <input type="file" onChange={handlePhotoChange} required />
                  <button type="submit">
                    {userType === "login" ? "Log in" : "Sign up"}
                  </button>
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
