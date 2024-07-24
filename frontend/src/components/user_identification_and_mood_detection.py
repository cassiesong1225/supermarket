from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from werkzeug.utils import secure_filename
import os
import shutil
import cv2
import requests
import firebase_admin
from firebase_admin import credentials, firestore, storage
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Firebase Admin SDK setup
cred = credentials.Certificate({
  "type": os.getenv('FIREBASE_TYPE'),
  "project_id": os.getenv('FIREBASE_PROJECT_ID'),
  "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
  "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
  "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
  "client_id": os.getenv('FIREBASE_CLIENT_ID'),
  "auth_uri": os.getenv('FIREBASE_AUTH_URI'),
  "token_uri": os.getenv('FIREBASE_TOKEN_URI'),
  "auth_provider_x509_cert_url": os.getenv('FIREBASE_AUTH_PROVIDER_X509_CERT_URL'),
  "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
  "universe_domain": os.getenv('FIREBASE_UNIVERSE_DOMAIN')
})
firebase_admin.initialize_app(cred, {'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET')})

# Initialize Firestore DB
db = firestore.client()

# Temp directory for processing images
temp_directory = "./temp"
os.makedirs(temp_directory, exist_ok=True)

def clear_temp_directory():
    if os.path.exists(temp_directory):
        shutil.rmtree(temp_directory)
    os.makedirs(temp_directory, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_photo():
    clear_temp_directory()
    print("Received a request to /upload")
    print(f"Request form: {request.form}")

    user_type = request.form.get('user_type')
    photo_url = request.form.get('photo')
    user_name = request.form.get('user_name') if user_type == 'signup' else None

    print(f"user_type: {user_type}")
    print(f"photo_url: {photo_url}")

    if not user_type or not photo_url or (user_type == 'signup' and not user_name):
        return jsonify({"error": "Missing required parameters"}), 400

    if user_type not in ['signup', 'login']:
        return jsonify({"error": "Invalid user type"}), 400

    # Download the image from Firebase Storage
    response = requests.get(photo_url)
    if response.status_code != 200:
        return jsonify({"error": "Failed to download the photo"}), 500
    
    safe_filename = os.path.basename(photo_url.split('?')[0])
    photo_path = os.path.join(temp_directory, safe_filename)
    with open(photo_path, 'wb') as f:
        f.write(response.content)

    if user_type == 'signup':
        # Save the photo to Firebase Storage
        bucket = storage.bucket()
        blob = bucket.blob(f'source_photos/{user_name.replace(" ", "_")}.jpg')
        blob.upload_from_filename(photo_path)

        # Create a new user in Firestore
        user_ref = db.collection('users').add({
            'userName': user_name,
            'photoURL': blob.public_url
        })
        user_id = user_ref[1].id
        return jsonify({"message": f"Welcome {user_name.split(";")[0]}, your photo has been saved. Please go to log in.", "userId": user_id})

    elif user_type == 'login':
        try:
            # Create a directory to store all downloaded source photos
            source_photos_temp_directory = os.path.join(temp_directory, 'source_photos')
            os.makedirs(source_photos_temp_directory, exist_ok=True)

            # List all photos in source_photos from Firebase Storage
            bucket = storage.bucket()
            blobs = list(bucket.list_blobs(prefix='source_photos/'))

            # Download all photos to the temp directory for face recognition
            for blob in blobs:
                file_name = os.path.basename(blob.name)
                local_path = os.path.join(source_photos_temp_directory, file_name)
                blob.download_to_filename(local_path)

            matched_photo = find_identity(photo_path, source_photos_temp_directory)
            print(f"matched_photo: {matched_photo}")
            if matched_photo is not None and not matched_photo.empty:
                matched_photo_path = matched_photo.iloc[0]['identity']
                user_name = extract_username_from_path(matched_photo_path)
                emotion = analyze_emotion(photo_path)

                # Retrieve the user ID from Firebase Firestore
                users_collection = db.collection('users')
                docs = users_collection.where('userName', '==', user_name).stream()
                user_doc = next(docs, None)
                if not user_doc:
                    return jsonify({"message": "User not found."}), 404

                user_id = user_name.split(";")[1] if user_name.find(";") != -1 else -1
                is_new = False if user_name.find(";") != -1 else True
                return jsonify({
                    "isNew": is_new,
                    "userId": user_id,
                    "userName": user_name.split(";")[0],
                    "mood": emotion
                })
            else:
                return jsonify({"message": "No matching user found. Please ensure your photo is clear or sign up if you haven't yet."})
        except Exception as e:
            return jsonify({"error": str(e)}), 500

def find_identity(photo_path, database_directory):
    """
    Function to find identity using facial recognition.
    """
    try:
        faces = DeepFace.extract_faces(img_path=photo_path, detector_backend='opencv')
        if len(faces) == 0:
            print("No face detected in the uploaded photo.")
            return None

        face = faces[0]['face']
        if face is None or face.size == 0:
            print("Extracted face is empty or invalid.")
            return None
    
        # convert face to a format suitable for saving
        if face.dtype != 'uint8':
            face = (face * 255).astype('uint8')

        # save the extracted face to a temporary file
        temp_face_path = os.path.join(temp_directory, 'temp_face.jpg')
        cv2.imwrite(temp_face_path, face)

        # Use DeepFace to compare with the downloaded database photos in the directory
        df = DeepFace.find(img_path=temp_face_path, db_path=database_directory, model_name='VGG-Face', enforce_detection=False)
        
        if isinstance(df, list) and len(df) > 0 and not df[0].empty:
            return df[0]
        else:
            return None
        
    except Exception as e:
        print(f"Error during facial recognition: {e}")
        return None

def extract_username_from_path(path):
    """
    Function to extract username from the photo's filename.
    """
    filename = os.path.basename(path)
    username = os.path.splitext(filename)[0].replace("_", " ")  # replace underscores with spaces
    return username

def analyze_emotion(photo_path):
    """
    Function to analyze emotion in the photo.
    """
    try:
        predictions = DeepFace.analyze(img_path=photo_path, actions=['emotion'])

        # For debug
        print(f"FOR DEBUG: Full emotion analysis result: {predictions}")

        # Extract and return the dominant emotion
        if isinstance(predictions, list):
            dominant_emotion = predictions[0]['dominant_emotion']
        else:
            dominant_emotion = predictions['dominant_emotion']

        return dominant_emotion

    except Exception as e:
        print(f"Error during emotion analysis: {e}")
        return "unknown"

# Run the Flask application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
