import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../Styles/RecommenderSystem.css';
import ProductCard from './ProductCard';

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
    <div>
      <div className="title"><h2>Recommendations</h2></div>
      <div className='grid-div'>
        <div className="grid-container">
              {data.initial_recommendations && data.initial_recommendations.map((item, index) => (
                <div className="grid-item" key={index}>
                  <ProductCard 
                    product_name={item.product_name} 
                    aisle_name={item.aisle} 
                    department_name={item.department} 
                    image_url={item.image_url}
                  />
                </div>
              ))}
        </div>
      </div>

      <div className="title"><h2> Current Emotion-related Recommendations</h2></div>
      <div className='grid-div'>
        <div className="grid-container">
              {data.mood_related_recommendations && data.mood_related_recommendations.map((item, index) => (
                <div className="grid-item" key={index}>
                  <ProductCard 
                    product_name={item.product_name} 
                    aisle_name={item.aisle} 
                    department_name={item.department} 
                    image_url={item.image_url}
                  />
                </div>
              ))}
        </div>
      </div>

      <div className="title"><h2> Close-to-expiration Recommendations</h2></div>
      <div className='grid-div'>
        <div className="grid-container">
              {data.close_to_exp_recommendations && data.close_to_exp_recommendations.map((item, index) => (
                <div className="grid-item" key={index}>
                  <ProductCard 
                    product_name={item.product_name} 
                    aisle_name={item.aisle} 
                    department_name={item.department} 
                    image_url={item.image_url}
                  />
                </div>
              ))}
        </div>
      </div>


      <div className="title"><h2> Purchase History</h2></div>
      <div className='grid-div'>
        <div className="grid-container">
              {data.actual_purchased_products && data.actual_purchased_products.map((item, index) => (
                <div className="grid-item" key={index}>
                  <ProductCard 
                    product_name={item.product_name} 
                    aisle_name={item.aisle} 
                    department_name={item.department} 
                    image_url={item.image_url}
                  />
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default Recommendations;
