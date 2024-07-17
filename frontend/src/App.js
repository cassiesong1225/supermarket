import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./Screens/HomePage";
import FaceRecognitionPage from "./Screens/FaceRecognitionPage";
import RecommendationsPage from "./Screens/RecommendationsPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/face-recognition" element={<FaceRecognitionPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
