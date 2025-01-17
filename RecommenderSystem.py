from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import os
import requests


app = Flask(__name__)
CORS(app)

#load trained collaborative model
CF_model = joblib.load('trained_model/cf_model.pkl')
#matrix factorization from collaborative model
user_product_matrix = joblib.load('trained_model/user_product_matrix.pkl')
#product embeddings from content-based model
product_embeddings = joblib.load('trained_model/product_embeddings.pkl')
#user embeddings from content-based model
user_embeddings = joblib.load('trained_model/user_embeddings.pkl')

emotion_dict = {
        "happy": "positive",
        "angry": "negative",
        "fear": "negative",
        "sad": "negative",
        "disgust": "negative",
        "suprise": "unclassified",
        "neutral": "unclassified"
    }

products_df = pd.read_csv('capstone-dataset/products.csv')
aisles_df = pd.read_csv('capstone-dataset/aisles.csv')
departments_df = pd.read_csv('capstone-dataset/departments.csv')
products_with_expiration_df = pd.read_csv('capstone-dataset/products_with_expiration.csv')
user_features_df =  pd.read_csv('capstone-dataset/user_features_headers.csv')
purchase_count_train_df =  pd.read_csv('capstone-dataset/purchase_count_train_df.csv')

products_df = pd.merge(products_df, aisles_df, on="aisle_id")
products_df = pd.merge(products_df, departments_df, on="department_id")

mood_food_df = pd.read_csv('capstone-dataset/mood_categorized_aisles.csv')
mood_food_df = mood_food_df.drop(columns=['aisle'])
#products with mood categories
products_mood_df = pd.merge(products_df, mood_food_df, on="aisle_id")

#products with expiration dates
products_expiration_df = pd.merge(products_df, products_with_expiration_df, on="product_id")


def product_neighbors(recommended_id, given_products_df, threshold=0.0001):
    """
    The rule is that calculate the similarity of recommendations and products in given products dataframe.
    Get the most similar products with the similarities greater than the threshold.
    Args:
        recommended_id: the product id of a recommendation
        current_emotion_related_pros: the dataframe of the current emotion-related products
        threshold: the threshold of similarity; 0.0001 by default
    """
    input_embedding = product_embeddings[recommended_id]
    product_ids = given_products_df["product_id"].values
    current_mood_related_product_embeddings = product_embeddings[product_ids]
    squared_distances = np.sum((current_mood_related_product_embeddings - input_embedding)**2, axis=1)
    
    given_products_df.loc[:, 'similarity'] = squared_distances
    filtered_pros = given_products_df[(given_products_df['similarity'] > 0) & (given_products_df['similarity'] <= threshold)]
    return filtered_pros

def recommended_current_emotion_related_items(recommended_items, current_emotion_related_pros, N=3):
    """
    Return the most similar items of the entire recommendation list and the entire current emotion-related product list.
    """
    dataframes_list = []
    for item in recommended_items:
        union_df = product_neighbors(item, current_emotion_related_pros)
        dataframes_list.append(union_df)
    final_union_df = pd.concat(dataframes_list, ignore_index=True)
    final_union_df = final_union_df.sort_values(by="similarity")
    return final_union_df.head(N)

def get_close_to_expiration_pros(days=15):
    """
    Returns all items that are close to expiration within N days.
    """
    current_date = pd.to_datetime(datetime.now())
    products_expiration_df['expiration_date'] = pd.to_datetime(products_expiration_df['expiration_date'])
    products_expiration_df['days_until_expiration'] = (products_expiration_df['expiration_date'] - current_date).dt.days
    result_df = products_expiration_df[(products_expiration_df["days_until_expiration"] > 0)  & (products_expiration_df["days_until_expiration"] <= days)]
    return result_df

def recommended_close_to_expiration_items(recommended_items, N=3):
    """
    Return recommend close-to-expiration items
    """
    close_to_expiration_products_df = get_close_to_expiration_pros()
    dataframes_list = []
    for item in recommended_items:
        union_df = product_neighbors(item, close_to_expiration_products_df)
        dataframes_list.append(union_df)
    final_union_df = pd.concat(dataframes_list, ignore_index=True)
    final_union_df = final_union_df.sort_values(by="similarity")
    return final_union_df.head(N)


def get_products_df(product_ids):
    return products_df[products_df["product_id"].isin(product_ids)]


def get_initial_recommendations_for_new_users(aisle_ids, N):
    """
    Return initial recommendations for new users.
    """
    aisles = list(map(int, aisle_ids.split(",")))
    purchase_count_df_with_aisles = pd.merge(purchase_count_train_df, products_df[['product_id', 'aisle_id']], on='product_id', how='left')
    filted_df = purchase_count_df_with_aisles[purchase_count_df_with_aisles["aisle_id"].isin(aisles)]
    topN = N // len(aisles)
    topN = 1 if topN == 0 else topN
    recommendations = []
    for aisle_id in aisles:
        items_in_aisle = filted_df[filted_df['aisle_id'] == aisle_id]
        items_in_aisle = items_in_aisle.groupby('product_id')['purchase_count'].sum().reset_index(name='purchase_count')
        items_in_aisle = items_in_aisle.sort_values(by='purchase_count', ascending=False)
        top_items_in_aisle = items_in_aisle.head(topN)["product_id"].values
        recommendations.extend(top_items_in_aisle)
    return recommendations

def get_product_image(product_names):
    urls = []
    api_key = os.getenv('SEARCH_API_KEY')
    search_engine_id = os.getenv('SEARCH_ENGINE_ID')
    for product_name in product_names:
        # search_url = f"https://www.googleapis.com/customsearch/v1?q={product_name}&cx={search_engine_id}&key={api_key}&searchType=image"
        # response = requests.get(search_url)
        # data = response.json()
        # if 'items' in data:
            # urls.append(data['items'][0]['link'])
        urls.append("https://josiesorganics.com/wp-content/uploads/2022/01/Josies-Organics-Baby-Spinach-16oz-Front.png")
    return urls

@app.route('/predict', methods=['GET'])
def predict():
    user_id = request.args.get('userId')
    current_mood = request.args.get('mood')
    N = request.args.get('N', 10, type=int)
    aisle_ids = request.args.get('interested_aisles')
    if not current_mood:
        return jsonify({"error": "Mood parameter is missing"}), 400
    if not user_id and not aisle_ids:
        return jsonify({"error": "user_id and interested_aisles parameters are missing"}), 400
    
    initial_recommendations = None
    if not user_id:
        initial_recommendations = get_initial_recommendations_for_new_users(aisle_ids, N)
    else:
        user_id = int(user_id)
        #generate initial recommendations
        initial_recommendations, scores = CF_model.recommend(user_id, user_product_matrix[user_id], N=N)
    #get current emotion related product list
    current_emotion_related_pros = products_mood_df[products_mood_df["mood"]==emotion_dict[current_mood]]
    #get the intersection of initial recommendations and current emotion related products
    cur_mood_relate_recommendations_df = recommended_current_emotion_related_items(initial_recommendations, current_emotion_related_pros)
    #get the intersection of initial recommendations and close-to-expiration products
    close_to_exp_recommendations_df = recommended_close_to_expiration_items(initial_recommendations)

    initial_recommendations_df = get_products_df(initial_recommendations)
   #format the recommendations
    initial_result = initial_recommendations_df[['product_id', 'product_name', 'aisle', 'department']].head(6)
    image_urls = get_product_image(initial_result["product_name"].values)
    initial_result["image_url"] = image_urls
    initial_result_json = initial_result.to_dict(orient='records')
    
    mood_result = cur_mood_relate_recommendations_df[['product_id', 'product_name', 'aisle', 'department']].head(3)
    image_urls = get_product_image(mood_result["product_name"].values)
    mood_result["image_url"] = image_urls
    mood_result_json = mood_result.to_dict(orient='records')

    close_to_exp_result = close_to_exp_recommendations_df[['product_id', 'product_name', 'aisle', 'department', 'days_until_expiration']].head(3)
    image_urls = get_product_image(close_to_exp_result["product_name"].values)
    close_to_exp_result["image_url"] = image_urls
    close_to_exp_result_json = close_to_exp_result.to_dict(orient='records')

    actual_result_json = None
    #actual purchased products
    if user_id is not None:
        pids = purchase_count_train_df[purchase_count_train_df["user_id"] == user_id]["product_id"].values
        actual_purchased_products = get_products_df(pids)
        actual_result = actual_purchased_products[['product_id', 'product_name', 'aisle', 'department']]
        image_urls = get_product_image(actual_result["product_name"].values)
        actual_result["image_url"] = image_urls
        actual_result_json = actual_result.to_dict(orient='records')

    return jsonify({'initial_recommendations': initial_result_json, 
                    "mood_related_recommendations": mood_result_json,
                    "close_to_exp_recommendations": close_to_exp_result_json,
                    "actual_purchased_products": actual_result_json})



if __name__ == '__main__':
    app.run(port=5525, debug=True)