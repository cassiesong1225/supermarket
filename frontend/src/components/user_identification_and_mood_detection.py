from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from werkzeug.utils import secure_filename
import os
import shutil
import cv2
import matplotlib.pyplot as plt

# initialize the Flask application
app = Flask(__name__)
CORS(app)  # enable CORS for the app to allow cross-origin requests

# set up local directories for storing photos
source_photo_directory = "./source_photos"
login_photo_directory = "./login_photos"
temp_directory = "./temp"

# create new directories if they don't exist
os.makedirs(source_photo_directory, exist_ok=True)
os.makedirs(login_photo_directory, exist_ok=True)
os.makedirs(temp_directory, exist_ok=True)

# endpoint to handle photo uploads
@app.route('/upload', methods=['POST'])
def upload_photo():

    # for debug
    print(f"FOR DEBUG: Received POST request at /upload with parameters: {request.form}")

    # extract data from the POST request
    user_type = request.form.get('user_type')
    #user_name = request.form.get('user_name')
    #user_name = None
    photo = request.files.get('photo')

    # for debug
    #print(f"FOR DEBUG: user_type: {user_type}, user_name: {user_name}, photo: {photo}")
    print(f"FOR DEBUG: user_type: {user_type}, photo: {photo}")

    # check if all required parameters are provided
    #if not user_type or not user_name or not photo:
    if not user_type or not photo:
        return jsonify({"error": "Missing required parameters"}), 400

    # validate user_type
    if user_type not in ['signup', 'login']:
        return jsonify({"error": "Invalid user type"}), 400

    # save the uploaded photo to a temporary location
    photo_path = os.path.join('./temp', photo.filename)
    photo.save(photo_path)

    # handle the signup process
    if user_type == 'signup':
        # extract user_name from the form data
        user_name = request.form.get('user_name')

        # for debug
        print(f"FOR DEBUG: Handling signup for user: {user_name}")

        if not user_name:
            return jsonify({"error": "Missing user_name for signup"}), 400

        # move the photo to the source directory with a filename based on the username
        new_photo_path = os.path.join(source_photo_directory, user_name.replace(" ", "_") + os.path.splitext(photo.filename)[1])
        shutil.move(photo_path, new_photo_path)

        # for debug
        print(f"FOR DEBUG: Moved signup photo to: {new_photo_path}")

        return jsonify({"message": f"Welcome {user_name}, your photo has been saved."})

    # handle the login process
    elif user_type == 'login':
        try:

            # for debug
            #print(f"FOR DEBUG: Received login request for user: {user_name}")

            # move the photo to the login directory with a unique filename
            new_photo_filename = secure_filename(photo.filename)  # ensure secure filename
            new_photo_path = os.path.join(login_photo_directory, new_photo_filename)
            shutil.move(photo_path, new_photo_path)

            # for debug
            print(f"FOR DEBUG: Moved login photo to: {new_photo_path}")

            # perform face recognition to find a matching user in the source directory
            matched_photo = find_identity(new_photo_path, source_photo_directory)

            # for debug
            print(f"FOR DEBUG: matched_photo: {matched_photo}")

            #if matched_photo:
                # if a match is found, extract username and analyze emotion in the uploaded photo
                #user_name = extract_username_from_path(matched_photo)
                # for debug
                #print(f"FOR DEBUG: Login matched user: {user_name}")

            if matched_photo is not None and not matched_photo.empty:
                # extract username from the matched photo path
                matched_photo_path = matched_photo.iloc[0]['identity']
                user_name = extract_username_from_path(matched_photo_path)

                # for debug
                print(f"FOR DEBUG: Login matched user: {user_name}")

                emotion = analyze_emotion(new_photo_path)
                return jsonify({"message": f"Login Successful, welcome back {user_name}! You seem to be feeling {emotion}."})
            else:
                return jsonify({"message": "No matching user found. Please ensure your photo is clear or sign up if you haven't yet."})

        except Exception as e:
            return jsonify({"error": str(e)}), 500

def find_identity(photo_path, database_path):
    """
    Function to find identity using facial recognition.
    """
    try:
        # load the image
        #image = cv2.imread(photo_path)
        
        # extract faces from the image
        faces = DeepFace.extract_faces(img_path=photo_path, detector_backend='opencv')

        # for debug
        print(f"FOR DEBUG: Number of faces detected: {len(faces)}")
        
        if len(faces) == 0:
            print("No face detected in the uploaded photo.")
            return None

        # use the first detected face for recognition
        face = faces[0]['face']
        if face is None or face.size == 0:
            print("Extracted face is empty or invalid.")
            return None
        
        # for debug
        #plt.imshow(face)
        #plt.show()

        # convert face to a format suitable for saving
        if face.dtype != 'uint8':
            face = (face * 255).astype('uint8')
        
        # save the extracted face to a temporary file
        temp_face_path = os.path.join(temp_directory, 'temp_face.jpg')
        cv2.imwrite(temp_face_path, face)

        # use DeepFace to find a match in the specified database using the extracted face
        df = DeepFace.find(img_path=temp_face_path, db_path=database_path, model_name='VGG-Face', enforce_detection=False)
        
        # for debug
        print(f"FOR DEBUG: Type of df: {type(df)}")
        print(f"FOR DEBUG: Contents of df: {df}")
        
        if isinstance(df, list) and len(df) > 0 and not df[0].empty:
            return df[0]  # return the first match as DataFrame
        else:
            return None  # return None if no match is found

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
        # use DeepFace to analyze the dominant emotion in the photo
        predictions = DeepFace.analyze(img_path=photo_path, actions=['emotion'])

        # for debug
        print(f"FOR DEBUG: Full emotion analysis result: {predictions}")

        # extract and return the dominant emotion
        if isinstance(predictions, list):
            dominant_emotion = predictions[0]['dominant_emotion']
        else:
            dominant_emotion = predictions['dominant_emotion']

        return dominant_emotion

    except Exception as e:
        print(f"Error during emotion analysis: {e}")
        return "unknown"

# run the Flask application
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) # my port 5000 was already in use so I changed it to 5001
