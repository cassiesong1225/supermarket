// src/Components/RecommendedProducts.js
import React from "react";
import { Grid } from "@mui/material";
import ProductCard from "./ProductCard";

const RecommendedProducts = ({ recommendations, type }) => {
  return (
    <div className="recommended-products-container">
      <Grid container spacing={2} justifyContent="center">
        {recommendations.map((product, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
            <ProductCard
              product_name={product.product_name}
              aisle_name={product.aisle}
              department_name={product.department}
              image_url={product.image_url}
              price={product.price}
              discount_price={product.discount_price}
              isCloseToExpiration={type === "close_to_expiration"}
            />
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

export default RecommendedProducts;
