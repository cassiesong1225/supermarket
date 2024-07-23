import React, { useState, useEffect } from "react";
import { readRemoteFile } from "react-papaparse";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { database } from "../Firebase-files/Firebasesetup";
import "../Styles/PreferenceSurvey.css";
import { useUser } from "../UserContext";

function PreferenceSurvey() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [aisles, setAisles] = useState([]);
  const [selectedAisles, setSelectedAisles] = useState([]);
  const [detectedMood, setDetectedMood] = useState(user.detectedMood || "");
  const [n, setN] = useState(10); // Default to 10 recommendations
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user.isLoggedIn) {
      navigate("/");
      return;
    }

    const fetchDetectedMood = async () => {
      const userId = user.userId; // Get the userId from context
      if (userId) {
        const userDoc = doc(database, "users", String(userId));
        const docSnapshot = await getDoc(userDoc);
        if (docSnapshot.exists()) {
          setDetectedMood(docSnapshot.data().detectedMood);
        } else {
          setError("Failed to fetch detected mood.");
        }
      }
    };

    if (!detectedMood) {
      fetchDetectedMood();
    }

    // Function to fetch and parse CSV file
    const fetchCSV = async () => {
      readRemoteFile("top_50_aisles.csv", {
        header: true,
        complete: (results) => {
          const aislesData = results.data
            .filter((row) => row.aisle && row.aisle.trim() !== "")
            .map((row) => {
              const aisle_id = parseInt(row.aisle_id, 10);
              const total_purchases = parseInt(row.total_purchases, 10);
              return { aisle_id, aisle: row.aisle, total_purchases };
            });
          setAisles(aislesData);
        },
      });
    };
    fetchCSV();
  }, [user.isLoggedIn, detectedMood, user.userId, navigate]);

  const handleAisleClick = (aisle) => {
    if (selectedAisles.includes(aisle)) {
      setSelectedAisles(selectedAisles.filter((a) => a !== aisle));
    } else {
      setSelectedAisles([...selectedAisles, aisle]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedAisles.length === 0) {
      setError("Please select at least one aisle.");
      setLoading(false);
      return;
    }

    console.log("Selected Aisles:", selectedAisles); // Debugging line

    const selectedAisleIds = selectedAisles
      .map((aisle) => {
        const matchedAisle = aisles.find((a) => a.aisle === aisle);
        console.log(
          `Matching aisle: ${aisle}, Matched Aisle Data:`,
          matchedAisle
        ); // Debugging line
        return matchedAisle ? matchedAisle.aisle_id : null;
      })
      .filter((id) => id !== null && !isNaN(id));

    console.log("Selected Aisle IDs:", selectedAisleIds.join(",")); // Debugging line

    if (selectedAisleIds.length === 0) {
      setError("Failed to match selected aisles with IDs.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:5525/predict", null, {
        params: {
          interested_aisles: selectedAisleIds.join(","),
          mood: detectedMood,
          N: parseInt(n),
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
    <div className="survey-container">
      <h2>User Preference Survey</h2>
      <p>Detected Mood: {detectedMood}</p>
      <p>Please select your preferred product aisles:</p>
      <div className="aisle-container">
        {aisles.map((aisle, index) => (
          <button
            key={index}
            type="button"
            className={`aisle-button ${
              selectedAisles.includes(aisle.aisle) ? "selected" : ""
            }`}
            onClick={() => handleAisleClick(aisle.aisle)}
          >
            {aisle.aisle}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="n">Number of Recommendations:</label>
          <input
            type="number"
            id="n"
            value={n}
            onChange={(e) => setN(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="submit-button">
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

export default PreferenceSurvey;
