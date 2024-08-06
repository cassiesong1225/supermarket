import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../Styles/RecommendationsPage.css";
import { useLocation } from "react-router-dom";
import RecommendedProducts from "./RecommendedProducts";
import PurchaseHistoryTable from "./PurchaseHistoryTable";

function RecommendationsPage() {
  const location = useLocation();
  const userId = location.state?.userId || "";
  const mood = location.state?.mood || "";
  const userName = location.state?.userName || "";
  const [n, setN] = useState(10); // Default value is 10
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      mood: mood,
      N: parseInt(n),
      userId: parseInt(userId),
    };

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
  }, [mood, n, userId]);

  useEffect(() => {
    if (userId) {
      fetchRecommendations();
    }
  }, [userId, fetchRecommendations]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    fetchRecommendations();
  };

  return (
    <div className="RecommendationsPage">
      <h1>Get Recommendations</h1>
      <p>
        Welcome {userName}! You seem to be feeling {mood}.
      </p>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="n">Number of Recommendations:</label>
          <input
            type="number"
            id="n"
            value={n}
            onChange={(e) => setN(e.target.value)}
            required
            min="1" // Ensure the number of recommendations is at least 1
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Get Recommendations"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {recommendations && (
        <div className="recommendations-container">
          <h2>Recommendations</h2>
          <div className="recommendations-section">
            <h3>Initial Recommendations</h3>
            <RecommendedProducts
              recommendations={recommendations.initial_recommendations}
              type="initial"
              showPurchased={true} // Show actual purchased products for this page
            />
          </div>
          <div className="recommendations-section">
            <h3>Mood Related Recommendations</h3>
            <RecommendedProducts
              recommendations={recommendations.mood_related_recommendations}
              type="mood_related"
              showPurchased={true} // Show actual purchased products for this page
            />
          </div>
          <div className="recommendations-section">
            <h3>Close to Expiration Recommendations</h3>
            <RecommendedProducts
              recommendations={recommendations.close_to_exp_recommendations}
              type="close_to_expiration"
              showPurchased={true} // Show actual purchased products for this page
            />
          </div>
          {recommendations.actual_purchased_products && (
            <div className="recommendations-section">
              <h3>Purchase History</h3>
              <PurchaseHistoryTable
                products={recommendations.actual_purchased_products}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RecommendationsPage;
