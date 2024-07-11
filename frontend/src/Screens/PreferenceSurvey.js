import React from "react";

function PreferenceSurvey({ closeSurvey }) {
  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={closeSurvey}>
          &times;
        </span>
        <h2>User Preference Survey</h2>
        {/* Add your survey form elements here */}
        <p>This is where the user preference survey will go.</p>
      </div>
    </div>
  );
}

export default PreferenceSurvey;
