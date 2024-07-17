import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ComputerVision() {
  const [userType, setUserType] = useState(""); // can choose 'signup' or 'login'
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate(); // navigate to signup/login page

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!photo || (userType === "signup" && !name)) {
      setMessage("Please fill all required fields.");
      return;
    }

    const formData = new FormData();
    formData.append("user_type", userType);
    formData.append("photo", photo);
    if (userType === "signup") {
      formData.append("user_name", name);
    }
    // somehow my 5000 port is not working, so I changed it to 5001
    fetch(`http://localhost:5001/upload?user_type=${userType}`, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
      .catch((error) => {
        console.error("Error:", error);
        setMessage("Error submitting form.");
      });
  };

  const handleReturn = () => {
    navigate("/"); // back to home page
  };

  return (
    <div>
      <h1>User Sign Up/Log in Page</h1>
      <div>
        <button onClick={() => setUserType("signup")}>Sign Up</button>
        <button onClick={() => setUserType("login")}>Log In</button>
      </div>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {userType === "signup" && (
          <div>
            <h2>Sign Up</h2>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <br />
            <br />
          </div>
        )}
        {userType && (
          <>
            <label>Upload Photo:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              required
            />
            <br />
            <br />
            <button type="submit">
              {userType === "signup" ? "Sign Up" : "Log In"}
            </button>
            <button
              type="button"
              onClick={handleReturn}
              style={{ marginLeft: "10px" }}
            >
              Return to Home
            </button>
          </>
        )}
      </form>
      <p>{message}</p>
    </div>
  );
}

export default ComputerVision;
