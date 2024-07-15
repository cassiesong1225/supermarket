import React, { useState, useEffect } from "react";
import { readRemoteFile } from "react-papaparse";
import "../Styles/PreferenceSurvey.css";

function PreferenceSurvey({ closeSurvey }) {
  const [aisles, setAisles] = useState([]);
  const [selectedAisles, setSelectedAisles] = useState([]);

  useEffect(() => {
    // Function to fetch and parse CSV file
    const fetchCSV = async () => {
      readRemoteFile("top_50_aisles.csv", {
        header: true,
        complete: (results) => {
          const aislesData = results.data
            .map((row) => row.aisle)
            .filter((aisle) => aisle && aisle.trim() !== ""); // Filter out empty aisles
          setAisles(aislesData);
        },
      });
    };
    fetchCSV();
  }, []);

  const handleAisleClick = (aisle) => {
    if (selectedAisles.includes(aisle)) {
      setSelectedAisles(selectedAisles.filter((a) => a !== aisle));
    } else {
      setSelectedAisles([...selectedAisles, aisle]);
    }
  };

  const handleSubmit = () => {
    // Implement your submit functionality here
    console.log("Selected aisles: ", selectedAisles);
    closeSurvey();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeSurvey}>
          &times;
        </span>
        <h2>User Preference Survey</h2>
        <p>Please select your preferred product aisles:</p>{" "}
        {/* Added descriptive text */}
        <div className="aisle-container">
          {aisles.map((aisle, index) => (
            <button
              key={index}
              className={`aisle-button ${
                selectedAisles.includes(aisle) ? "selected" : ""
              }`}
              onClick={() => handleAisleClick(aisle)}
            >
              {aisle}
            </button>
          ))}
        </div>
        <button className="submit-button" onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
}

export default PreferenceSurvey;
