import React from 'react';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import '../Styles/RecommenderSystem.css';

const ProductCard = ({product_name, aisle_name, department_name, image_url}) => {
  return (
    <Card sx={{ width: '100%', boxShadow: 3, borderRadius: 2, padding: 2 }}>
      <CardActionArea sx={{ height: '100%' }}>
        <CardMedia
          component="img"
          alt="Product Image"
          height="240"
          image={image_url} // Ensure the path to the image is correct
          title="Product Image"
        />
        <CardContent>
          <Typography
            variant="h5"
            component="div"
            className="product-name"
            data-full-name={product_name}
          >
            {product_name.length >= 25 ? `${product_name.substring(0, 25)}...` : product_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            aisle: {aisle_name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            department: {department_name}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ProductCard;
