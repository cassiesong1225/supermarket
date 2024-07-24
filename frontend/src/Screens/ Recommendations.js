import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/RecommenderSystem.css';

const Recommendations = ({userId, mood, selectedAisleIds}) => {
  if (!userId) {
    userId = "";
  }
  const [data, setData] = useState({
    actual_purchased_products: [],
    initial_recommendations: [],
    mood_related_recommendations: [],
    close_to_exp_recommendations: []
  });

  useEffect(() => {
    axios.get(`http://127.0.0.1:5525/predict?userId=${userId}&mood=${mood}&interested_aisles=${selectedAisleIds}`)
    .then(response => setData(response.data))
    .catch(error => console.error('Error fetching data:', error));
  }, [userId, mood, selectedAisleIds]);

  return (
    <div className="recommender-system">
      <div className="purchase-history">
        <h2>Purchase History</h2>
        <table>
          <thead>
            <tr>
             {/* <th>Product ID</th>  */}
              <th>Product Name</th>
              <th>Aisle</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {data.actual_purchased_products && data.actual_purchased_products.map((item, index) => (
              <tr key={index}>
                {/* <td>{item.product_id}</td> */}
                <td>{item.product_name}</td>
                <td>{item.aisle}</td>
                <td>{item.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="recommendations">
        <h2>Recommendations</h2>
        
        <h3>Initial Recommendations</h3>
        <table className="initial-recommendations">
          <thead>
            <tr>
              {/* <th>Product ID</th> */}
              <th>Product Name</th>
              <th>Aisle</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {data.initial_recommendations && data.initial_recommendations.map((item, index) => (
              <tr key={index}>
                {/* <td>{item.product_id}</td> */}
                <td>{item.product_name}</td>
                <td>{item.aisle}</td>
                <td>{item.department}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Mood Related Recommendations</h3>
        <table className="mood-related-recommendations">
          <thead>
            <tr>
              {/* <th>Product ID</th> */}
              <th>Product Name</th>
              <th>Aisle</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {data.mood_related_recommendations && data.mood_related_recommendations.map((item, index) => (
              <tr key={index}>
                {/* <td>{item.product_id}</td> */}
                <td>{item.product_name}</td>
                <td>{item.aisle}</td>
                <td>{item.department}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3>Close to Expiration Recommendations</h3>
        <table className="close-to-exp-recommendations">
          <thead>
            <tr>
              {/* <th>Product ID</th> */}
              <th>Product Name</th>
              <th>Aisle</th>
              <th>Department</th>
            </tr>
          </thead>
          <tbody>
            {data.close_to_exp_recommendations && data.close_to_exp_recommendations.map((item, index) => (
              <tr key={index}>
                {/* <td>{item.product_id}</td> */}
                <td>{item.product_name}</td>
                <td>{item.aisle}</td>
                <td>{item.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Recommendations;
