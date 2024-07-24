import React, { useState } from "react";
import axios from "axios";
import "../Styles/RecommendationsPage.css";
import Recommendations from "./ Recommendations";

function RecommendationsPage() {
  const [userId, setUserId] = useState("");
  const [mood, setMood] = useState("");
  const [n, setN] = useState("");
  const [data, setData] = useState({
    purchaseHistory: [],
    initial_recommendations: [],
    mood_related_recommendations: [],
    close_to_exp_recommendations: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  return (
    <div className="RecommendationsPage">
      <h1>Get Recommendations</h1>
      <form>
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
        {/* <button type="submit" disabled={loading} >
          {loading ? "Loading..." : "Get Recommendations"}
        </button> */}
      </form>

      {error && <p className="error">{error}</p>}
      
      {userId && mood && n && 
      (
        <Recommendations userId={userId} mood={mood} n={n}/>
      )
      }
    
    </div>
  );
}

export default RecommendationsPage;
