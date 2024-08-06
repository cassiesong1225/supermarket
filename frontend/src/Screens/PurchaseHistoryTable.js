import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import "../Styles/PurchaseHistoryTable.css"; // Import the CSS file

const PurchaseHistoryTable = ({ products }) => {
  return (
    <TableContainer component={Paper} className="table-container">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell className="header-cell">Product Name</TableCell>
            <TableCell className="header-cell">Aisle</TableCell>
            <TableCell className="header-cell">Department</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.product_id}>
              <TableCell className="body-cell">
                {product.product_name}
              </TableCell>
              <TableCell className="body-cell">{product.aisle}</TableCell>
              <TableCell className="body-cell">{product.department}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PurchaseHistoryTable;
