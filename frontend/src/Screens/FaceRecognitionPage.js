// FaceRecognitionPage.js
import React, { useRef, useState, useEffect } from "react";
import { storage, database } from "../Firebase-files/Firebasesetup";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import "../Styles/FaceRecognitionPage.css";
import { useNavigate } from "react-router-dom";
import { useUser } from "../UserContext";

function FaceRecognitionPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState("login"); // "login" or "signup"
  const [userName, setUserName] = useState(""); // only for signup
  const { login } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (isCameraOn) {
        stopCamera();
      }
    };
  }, [isCameraOn]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } else {
        throw new Error("Video element is not available");
      }
    } catch (err) {
      setError(
        "Unable to access the camera. Please make sure you have granted the necessary permissions."
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
    if (!isVideoLoaded) {
      setError("Video not loaded yet. Please wait a moment and try again.");
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL("image/jpeg");
      sendPhotoToServer(photo);
    } catch (error) {
      setError("Failed to capture photo. Please try again.");
    }
  };

  const generateUserId = async () => {
    const usersCollection = collection(database, "users");
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.size + 1; // Generate userId based on the number of users
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
          const newUserId = await generateUserId();
          await setDoc(doc(database, "users", String(newUserId)), {
            userId: newUserId,
            userName: userName,
          });
          login(newUserId, userName, result.mood);
        } else if (userType === "login") {
          const { userId, userName, mood } = result;
          login(userId, userName, mood);
        }
      } else {
        setError(
          result.error || "Failed to process the photo. Please try again."
        );
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError("Failed to process the photo. Please try again.");
    }
  };

  const handleGoToLogin = () => {
    setResult(null);
    setUserName("");
    setUserType("login");
  };

  const handleTryAgain = () => {
    setResult(null);
    startCamera();
  };

  return (
    <div className="FaceRecognitionPage">
      <h1>Face Recognition and Emotion Detection</h1>

      {!result && (
        <>
          <div className="user-type-selection">
            <label>
              <input
                type="radio"
                value="login"
                checked={userType === "login"}
                onChange={() => setUserType("login")}
              />
              Login
            </label>
            <label>
              <input
                type="radio"
                value="signup"
                checked={userType === "signup"}
                onChange={() => setUserType("signup")}
              />
              Signup
            </label>
          </div>

          {userType === "signup" && (
            <div className="signup-input">
              <label>
                Username:
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </label>
            </div>
          )}
        </>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: isCameraOn ? "block" : "none" }}
        onLoadedMetadata={() => setIsVideoLoaded(true)}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {error && <p className="error-message">{error}</p>}

      {!result && (
        <div className="button-group">
          {!isCameraOn ? (
            <button onClick={startCamera}>Start Camera</button>
          ) : (
            <>
              <button onClick={capturePhoto}>Capture and Identify</button>
              <button onClick={stopCamera}>Stop Camera</button>
            </>
          )}
        </div>
      )}

      {result && (
        <div className="result">
          {userType === "signup" ? (
            <p>{result.message}</p>
          ) : result.message ===
            "No matching user found. Please ensure your photo is clear or sign up if you haven't yet." ? (
            <p>{result.message}</p>
          ) : (
            <p>{result.message}</p>
          )}
          {userType === "signup" ? (
            <button onClick={handleGoToLogin}>Go to Login</button>
          ) : result.message ===
            "No matching user found. Please ensure your photo is clear or sign up if you haven't yet." ? (
            <button onClick={handleTryAgain}>Try Again</button>
          ) : (
            <button onClick={() => navigate("/")}>Go Back</button>
          )}
        </div>
      )}
    </div>
  );
}

export default FaceRecognitionPage;
