import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Load the datasets
products = pd.read_csv('products.csv')
departments = pd.read_csv('departments.csv')

# Merge the datasets to include department names
products = products.merge(departments, on='department_id')

# Function to assign random expiration dates
def assign_random_expiration_date():
    return (datetime.now() + timedelta(days=np.random.randint(1, 365))).strftime('%Y-%m-%d')

def assign_near_expiration_date(days):
    return (datetime.now() + timedelta(days=np.random.randint(1, days))).strftime('%Y-%m-%d')

# Initialize the expiration_date column with random dates
products['expiration_date'] = products.apply(lambda x: assign_random_expiration_date(), axis=1)

# Assign near expiration dates for specific departments
def set_near_expiration(df, department, probability, days):
    mask = df['department'] == department
    sample_size = int(mask.sum() * probability)
    expiration_indices = np.random.choice(df[mask].index, size=sample_size, replace=False)
    df.loc[expiration_indices, 'expiration_date'] = [assign_near_expiration_date(days) for _ in range(sample_size)]

for dept in ['produce', 'bakery', 'meat seafood']:
    set_near_expiration(products, dept, 0.045, 3)
    set_near_expiration(products, dept, 0.955, 7)  # Ensuring the remaining 95.5% are within 7 days

for dept in products['department'].unique():
    if dept not in ['produce', 'bakery', 'meat seafood']:
        set_near_expiration(products, dept, 0.02, 30)

# Check if expiration_date column has values
print(products.head())

# Save the updated dataset
products.to_csv('products_with_expiration.csv', index=False)