import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './Screens/HomePage';
import AuthPage from './Screens/AuthPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/signin" element={<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App;