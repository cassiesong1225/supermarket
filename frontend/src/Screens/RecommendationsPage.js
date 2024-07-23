import React, { useState } from "react";
import axios from "axios";
import "../Styles/RecommendationsPage.css";

function RecommendationsPage() {
  const [userId, setUserId] = useState("");
  const [mood, setMood] = useState("");
  const [n, setN] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const params = {
      mood: mood,
      N: parseInt(n),
    };

    if (userId) {
      params.userId = parseInt(userId);
    }

    try {
      const response = await axios.post("http://127.0.0.1:5525/predict", null, {
        params: params,
        headers: {
          "Content-Type": "application/json",
        },
      });
      setRecommendations(response.data);
    } catch (err) {
      setError("Failed to fetch recommendations. Please try again.");
      console.error(err);
    }
    setLoading(false);
  };

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
          />
        </div>
        <div>
          <label htmlFor="mood">Mood:</label>
          <select
            id="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            required
          >
            <option value="">Select mood</option>
            <option value="happy">Happy</option>
            <option value="angry">Angry</option>
            <option value="fear">Fear</option>
            <option value="sad">Sad</option>
            <option value="disgust">Disgust</option>
            <option value="suprise">Surprise</option>
            <option value="neutral">Neutral</option>
          </select>
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
