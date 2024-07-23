// App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { UserProvider } from "./UserContext";
import HomePage from "./Screens/HomePage";
import FaceRecognitionPage from "./Screens/FaceRecognitionPage";
import PreferenceSurvey from "./Screens/PreferenceSurvey";
import RecommendationsPage from "./Screens/RecommendationsPage";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/face-recognition" element={<FaceRecognitionPage />} />
          <Route path="/preference-survey" element={<PreferenceSurvey />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
