import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Screens/HomePage';
import FaceRecognitionPage from './Screens/FaceRecognitionPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/face-recognition" element={<FaceRecognitionPage />} />
      </Routes>
    </Router>
  );
}

export default App;

