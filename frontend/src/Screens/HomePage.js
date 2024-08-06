import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../Styles/HomePage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../UserContext";
import { storage } from "../Firebase-files/Firebasesetup";
import { ref, uploadString, getDownloadURL } from "firebase/storage";

function HomePage() {
  const { user, login, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [userType, setUserType] = useState("");
  const [userName, setUserName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [result, setResult] = useState(null);
  const [showLoginButton, setShowLoginButton] = useState(false);

  useEffect(() => {
    if (location.state && location.state.userId) {
      const { userId, userName, detectedMood } = location.state;
      login(userId, userName, detectedMood);
    }
  }, [location.state, login]);

  useEffect(() => {
    return () => {
      if (isCameraOn) {
        stopCamera();
      }
    };
  }, [isCameraOn]);

  const startCamera = async () => {
    try {
      setModalMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } else {
        throw new Error("Video element is not available");
      }
    } catch (err) {
      setModalMessage(
        "Unable to access the camera. Please grant the necessary permissions."
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setIsVideoLoaded(false);
    }
  };

  const capturePhoto = () => {
    if (userType === "signup" && !userName) {
      setModalMessage("Please enter your username.");
      return;
    }

    if (!isVideoLoaded) {
      setModalMessage(
        "Video not loaded yet. Please wait a moment and try again."
      );
      return;
    }

    try {
      setLoading(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg");
      sendPhotoToServer(photo);
    } catch (error) {
      setLoading(false);
      setModalMessage("Failed to capture photo. Please try again.");
    }
  };

  const sendPhotoToServer = async (photo) => {
    try {
      // Upload photo to Firebase
      const photoRef = ref(storage, `photos/${Date.now()}.jpg`);
      await uploadString(photoRef, photo, "data_url");
      const photoURL = await getDownloadURL(photoRef);

      // Log the photo URL for debugging
      console.log("Photo URL:", photoURL);

      // Send photo URL to backend
      const formData = new FormData();
      formData.append("user_type", userType);
      formData.append("photo", photoURL);
      if (userType === "signup") {
        formData.append("user_name", userName);
      }

      const response = await fetch("http://127.0.0.1:5001/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Backend response:", result); // Debug: log the backend response

      if (response.ok) {
        setResult(result);

        if (userType === "signup") {
          setModalMessage(result.message);
          setShowLoginButton(true);
        } else if (userType === "login") {
          const { userId, userName, mood, isNew } = result;
          if (result.message) {
            setModalMessage(result.message);
          } else {
            login(userId, userName, mood);
            if (isNew === true) {
              navigate("/preference-survey");
            } else {
              navigate("/recommendations", {
                state: { userId: userId, mood: mood, userName: userName },
              });
            }
          }
        }
      } else {
        setModalMessage(
          result.message || "Failed to process the photo. Please try again."
        );
        setShowLoginButton(false); // Ensure the button doesn't show up on login failure
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      setModalMessage("Failed to process the photo. Please try again.");
    } finally {
      setLoading(false); // Set loading state to false when the process is complete
    }
  };

  const handleSubmit = async (photoDataUrl) => {
    setLoading(true);
    try {
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

      if (response.data) {
        const { userId, userName, mood, isNew, message } = response.data;
        if (message) {
          setModalMessage(message);
          setShowLoginButton(true);
        } else {
          login(userId, userName, mood);
          if (isNew === true) {
            navigate("/preference-survey");
          } else {
            navigate("/recommendations", {
              state: { userId: userId, mood: mood, userName: userName },
            });
          }
        }
      } else {
        setModalMessage("Failed to process the photo. Please try again.");
        setShowLoginButton(false); // Ensure the button doesn't show up on login failure
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setModalMessage(
        `An error occurred: ${error.response?.data?.error || error.message}`
      );
      setShowLoginButton(false); // Ensure the button doesn't show up on login failure
    } finally {
      setLoading(false);
      stopCamera();
    }
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleFileSubmit = async (e) => {
    e.preventDefault();
    if (userType === "signup" && !userName) {
      setModalMessage("Please enter your username.");
      return;
    }
    if (!photo) {
      setModalMessage("Please select a photo.");
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(photo);
    reader.onloadend = () => handleSubmit(reader.result);
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setUserName("");
    setPhoto(null);
    setModalMessage("");
    setShowModal(true);
    setShowLoginButton(false); // Reset the login button visibility
  };

  const closeModal = () => {
    setShowModal(false);
    stopCamera();
  };

  const handleLogout = () => {
    logout();
    setMessage(""); // Clear the message on logout
    navigate("/");
  };

  return (
    <div className="HomePage">
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
                <>
                  {userType === "signup" && !result && (
                    <input
                      type="text"
                      placeholder="Enter your username"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      required
                    />
                  )}
                  <div className="photo-options">
                    <input type="file" onChange={handlePhotoChange} />
                    {modalMessage && (
                      <p className="modal-message">{modalMessage}</p>
                    )}
                    <div className="photo-buttons">
                      {isCameraOn ? (
                        <>
                          <button
                            className="capture-photo-btn"
                            onClick={capturePhoto}
                            disabled={loading}
                          >
                            {loading ? (
                              <div className="loading-spinner"></div>
                            ) : (
                              "Capture and Identify"
                            )}
                          </button>
                          <button
                            className="stop-camera-btn"
                            onClick={stopCamera}
                            disabled={loading}
                          >
                            Stop Camera
                          </button>
                        </>
                      ) : (
                        <button
                          className="start-camera-btn"
                          onClick={startCamera}
                        >
                          Start Camera
                        </button>
                      )}
                      <button
                        className="upload-photo-btn"
                        onClick={handleFileSubmit}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="loading-spinner"></div>
                        ) : (
                          "Upload Photo"
                        )}
                      </button>
                      {showLoginButton && userType === "signup" && (
                        <button
                          className="go-to-login-btn"
                          onClick={() => {
                            handleUserTypeChange("login");
                          }}
                        >
                          Go to Login
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  display: isCameraOn ? "block" : "none",
                  height: "100%",
                  width: "100%",
                }}
                onLoadedMetadata={() => setIsVideoLoaded(true)}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default HomePage;
