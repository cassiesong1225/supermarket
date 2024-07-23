import pandas as pd

# Load CSV files
aisles_df = pd.read_csv('aisles.csv')
departments_df = pd.read_csv('departments.csv')
products_df = pd.read_csv('products.csv')
orders_df = pd.read_csv('orders.csv')
order_products_prior_df = pd.read_csv('order_products__prior.csv')
order_products_train_df = pd.read_csv('order_products__train.csv')

# Merge dataframes to include aisle and department information
products_df = pd.merge(products_df, aisles_df, on="aisle_id")
products_df = pd.merge(products_df, departments_df, on="department_id")

# Merge order products with product details
order_products_prior_df = pd.merge(order_products_prior_df, products_df, on="product_id")
order_products_train_df = pd.merge(order_products_train_df, products_df, on="product_id")

# Filter prior and train orders
order_user_prior_df = orders_df[orders_df["eval_set"] == 'prior']
order_user_train_df = orders_df[orders_df["eval_set"] == 'train']

order_user_product_prior_df = pd.merge(order_user_prior_df, order_products_prior_df, on="order_id")
order_user_product_train_df = pd.merge(order_user_train_df, order_products_train_df, on="order_id")

# Combine prior and train order dataframes
all_orders_df = pd.concat([order_user_product_prior_df, order_user_product_train_df])

# Calculate total purchases for each aisle, retaining aisle_id
aisle_purchase_counts = all_orders_df.groupby(['aisle_id', 'aisle'])['product_id'].count().reset_index(name='total_purchases')

# Get the top 50 aisles by total purchases
top_50_aisles = aisle_purchase_counts.nlargest(50, 'total_purchases')

# Output the result to a new CSV file
top_50_aisles.to_csv('top_50_aisles.csv', index=False)

print("Top 50 aisles with the most purchases have been saved to 'top_50_aisles.csv'.")
