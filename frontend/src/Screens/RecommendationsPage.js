import React, { useState,useCallback } from "react";
import { useLocation } from 'react-router-dom';
import axios from "axios";
import "../Styles/RecommendationsPage.css";

function RecommendationsPage() {
  const location = useLocation();
  const { userId: initialUserId, mood: initialMood } = location.state || {};

  const [userId, setUserId] = useState(initialUserId || "");
  const [mood, setMood] = useState(initialMood || "");
  const [n, setN] = useState("10");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "http://127.0.0.1:5525/predict",
        {
          userId: parseInt(userId),
          mood: mood,
          N: parseInt(n),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setRecommendations(response.data);
    } catch (err) {
      setError("Failed to fetch recommendations. Please try again.");
      console.error(err);
    }
    setLoading(false);
  }, [userId, mood, n]);

  return (
    <div className="RecommendationsPage">
      <h1>Get Recommendations</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="userId">User ID:</label>
          <input
            type="number"
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="n">Number of Recommendations:</label>
          <input
            type="number"
            id="n"
            value={n}
            onChange={(e) => setN(e.target.value)}
            required
          />
        </div>
         <div className="info-display">
        <div>
          <label htmlFor="detectedMood">Detected Mood:</label>
          <input
            type="text"
            id="detectedMood"
            value={mood}
            readOnly
          />
        </div>
      </div>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </form>


      {error && <p className="error">{error}</p>}

      {recommendations && (
        <div className="recommendations">
          <h2>Recommendations</h2>
          <div className="recommendations-section">
            <h3>Initial Recommendations</h3>
            {recommendations.initial_recommendations.map((item, index) => (
              <div key={index} className="recommendation-item">
                <p>{item.product_name}</p>
                <p>Aisle: {item.aisle}</p>
                <p>Department: {item.department}</p>
              </div>
            ))}
          </div>
          <div className="recommendations-section">
            <h3>Mood Related Recommendations</h3>
            {recommendations.mood_related_recommendations.map((item, index) => (
              <div key={index} className="recommendation-item">
                <p>{item.product_name}</p>
                <p>Aisle: {item.aisle}</p>
                <p>Department: {item.department}</p>
              </div>
            ))}
          </div>
          <div className="recommendations-section">
            <h3>Close to Expiration Recommendations</h3>
            {recommendations.close_to_exp_recommendations.map((item, index) => (
              <div key={index} className="recommendation-item">
                <p>{item.product_name}</p>
                <p>Aisle: {item.aisle}</p>
                <p>Department: {item.department}</p>
                <p>Days until expiration: {item.days_until_expiration}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;
