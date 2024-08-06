// src/Components/ProductCard.js
import React from "react";
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import "../Styles/ProductCard.css";

const ProductCard = ({
  product_name,
  aisle_name,
  department_name,
  image_url,
  price,
  discount_price,
  isCloseToExpiration,
}) => {
  return (
    <Card className="card">
      <CardActionArea className="card-action-area">
        <CardMedia
          component="img"
          alt="Product Image"
          className="card-media"
          image={image_url || "default-image-url"} // Default image URL if none provided
          title="Product Image"
        />
        <CardContent className="card-content">
          <Typography
            variant="h5"
            component="div"
            className="product-name"
            data-full-name={product_name}
          >
            {product_name}
          </Typography>
          <Typography variant="body2" className="aisle-name">
            Aisle: {aisle_name}
          </Typography>
          <Typography variant="body2" className="department-name">
            Department: {department_name}
          </Typography>
          <div className="price-section">
            {isCloseToExpiration && discount_price < price ? (
              <>
                <Typography variant="body2" className="original-price">
                  {price}
                </Typography>
                <Typography variant="body2" className="discount-price">
                  {discount_price}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" className="price">
                {price}
              </Typography>
            )}
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProductCard;
