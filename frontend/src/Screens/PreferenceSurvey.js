// src/Components/PreferenceSurvey.js
import React, { useState, useEffect } from "react";
import { readRemoteFile } from "react-papaparse";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { database } from "../Firebase-files/Firebasesetup";
import "../Styles/PreferenceSurvey.css";
import { useUser } from "../UserContext";
import RecommendedProducts from "./RecommendedProducts";

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
              return {
                aisle_id,
                aisle: row.aisle,
                department: row.department,
                total_purchases,
              };
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

    const selectedAisleIds = selectedAisles
      .map((aisle) => {
        const matchedAisle = aisles.find((a) => a.aisle === aisle);
        return matchedAisle ? matchedAisle.aisle_id : null;
      })
      .filter((id) => id !== null && !isNaN(id));

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

  // Helper function to capitalize the first letter of each word
  const capitalizeFirstLetter = (string) => {
    return string
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Group aisles by department
  const aislesByDepartment = aisles.reduce((acc, aisle) => {
    if (!acc[aisle.department]) {
      acc[aisle.department] = [];
    }
    acc[aisle.department].push(aisle);
    return acc;
  }, {});

  // Sort departments by number of aisles in descending order
  const sortedDepartments = Object.keys(aislesByDepartment).sort(
    (a, b) => aislesByDepartment[b].length - aislesByDepartment[a].length
  );

  return (
    <div className="PreferenceSurvey">
      <div className="survey-container">
        <div className="survey-top">
          <h1>User Preference Survey</h1>
          <p>Detected Mood: {capitalizeFirstLetter(detectedMood)}</p>
          <p>
            Welcome {capitalizeFirstLetter(user.userName)}! Please select your
            preferred product aisles:
          </p>
          <div className="aisle-container">
            {sortedDepartments.map((department) => (
              <div key={department} className="department-section">
                <h3>{capitalizeFirstLetter(department)}</h3>
                <div className="aisles-in-department">
                  {aislesByDepartment[department].map((aisle, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`aisle-button ${
                        selectedAisles.includes(aisle.aisle) ? "selected" : ""
                      }`}
                      onClick={() => handleAisleClick(aisle.aisle)}
                    >
                      {capitalizeFirstLetter(aisle.aisle)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="survey-bottom">
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
              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? "Loading..." : "Get Recommendations"}
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      </div>
      {recommendations && (
        <div className="recommendations-container preference-survey-recommendations">
          <h2>Recommendations</h2>
          <div className="recommendations-section">
            <h3>Initial Recommendations</h3>
            <RecommendedProducts
              recommendations={recommendations.initial_recommendations}
              type="initial"
            />
          </div>
          <div className="recommendations-section">
            <h3>Mood Related Recommendations</h3>
            <RecommendedProducts
              recommendations={recommendations.mood_related_recommendations}
              type="mood_related"
            />
          </div>
          <div className="recommendations-section">
            <h3>Close to Expiration Recommendations</h3>
            <RecommendedProducts
              recommendations={recommendations.close_to_exp_recommendations}
              type="close_to_expiration"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PreferenceSurvey;
