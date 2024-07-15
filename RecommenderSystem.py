from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd



app = Flask(__name__)

CF_model = joblib.load('trained_model/cf_model.pkl')
user_product_matrix = joblib.load('trained_model/user_product_matrix.pkl')
product_embeddings = joblib.load('trained_model/product_embeddings.pkl')
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

products_df = pd.merge(products_df, aisles_df, on="aisle_id")
products_df = pd.merge(products_df, departments_df, on="department_id")

mood_food_df = pd.read_csv('capstone-dataset/mood_categorized_aisles.csv')
mood_food_df = mood_food_df.drop(columns=['aisle'])
products_mood_df = pd.merge(products_df, mood_food_df, on="aisle_id")

def product_neighbors(recommended_id, current_emotion_related_pros, threshold=0.0001):
    input_embedding = product_embeddings[recommended_id]
    product_ids = current_emotion_related_pros["product_id"].values
    current_mood_related_product_embeddings = product_embeddings[product_ids]
    squared_distances = np.sum((current_mood_related_product_embeddings - input_embedding)**2, axis=1)
    
    current_emotion_related_pros.loc[:, 'similarity'] = squared_distances
    filtered_pros = current_emotion_related_pros[(current_emotion_related_pros['similarity'] > 0) & (current_emotion_related_pros['similarity'] <= threshold)]
    return filtered_pros

def recommended_current_emotion_related_intersection(recommended_items, current_emotion_related_pros, N=3):
    dataframes_list = []
    for item in recommended_items:
        union_df = product_neighbors(item, current_emotion_related_pros)
        dataframes_list.append(union_df)
    final_union_df = pd.concat(dataframes_list, ignore_index=True)
    final_union_df = final_union_df.sort_values(by="similarity")
    return final_union_df.head(N)

def get_products_df(product_ids):
    return products_df[products_df["product_id"].isin(product_ids)]
    
@app.route('/predict', methods=['POST'])
def predict():
    user_id = request.args.get('userId', type=int)
    current_mood = request.args.get('mood')
    N = request.args.get('N', 10, type=int)

    #generate initial recommendations
    initial_recommendations, scores = CF_model.recommend(user_id, user_product_matrix[user_id], N=N)
    #get current emotion related product list
    current_emotion_related_pros = products_mood_df[products_mood_df["mood"]==emotion_dict[current_mood]]
    #get the intersection of initial recommendations and current emotion related products
    cur_mood_relate_recommendations_df = recommended_current_emotion_related_intersection(initial_recommendations, current_emotion_related_pros)
    initial_recommendations_df = get_products_df(initial_recommendations)
    #format the recommendations
    initial_result = initial_recommendations_df[['product_id', 'product_name', 'aisle', 'department']]
    initial_result_json = initial_result.to_dict(orient='records')

    mood_result = cur_mood_relate_recommendations_df[['product_id', 'product_name', 'aisle', 'department']]
    mood_result_json = mood_result.to_dict(orient='records')


    return jsonify({'initial_recommendations': initial_result_json, "mood_related_recommendations": mood_result_json})

if __name__ == '__main__':
    app.run(port=5525, debug=True)
