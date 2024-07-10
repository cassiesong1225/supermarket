import React, { useRef, useState, useEffect } from 'react';
import '../Styles/FaceRecognitionPage.css';

function FaceRecognitionPage() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (isCameraOn) {
        stopCamera();
      }
    };
  }, [isCameraOn]);

  const startCamera = async () => {
    try {
      setError(null);
      console.log("Attempting to access camera...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log("Camera access granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } else {
        throw new Error("Video element is not available");
      }
    } catch (err) {
      console.error("Error accessing the camera", err);
      setError("Unable to access the camera. Please make sure you have granted the necessary permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setIsVideoLoaded(false);
    }
  };

  const capturePhoto = () => {
    if (!isVideoLoaded) {
      setError('Video not loaded yet. Please wait a moment and try again.');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const photo = canvas.toDataURL('image/jpeg');
      console.log('Photo captured:', photo.substring(0, 50) + '...');
      sendPhotoToServer(photo);
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Failed to capture photo. Please try again.');
    }
  };

  const sendPhotoToServer = async (photo) => {
    try {
        // This should be the code that sends the photo to the server.
        // Replace it with simulated data for now
      setResult({ username: "John Doe", emotion: "happy" });
    } catch (err) {
      console.error("Error sending photo to server", err);
      setError('Failed to process the photo. Please try again.');
    }
  };

  return (
    <div className="FaceRecognitionPage">
      <h1>Face Recognition and Emotion Detection</h1>
      
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline
        style={{ display: isCameraOn ? 'block' : 'none' }}
        onLoadedMetadata={() => setIsVideoLoaded(true)}
      />
      <canvas ref={canvasRef} style={{display: 'none'}} />
      
      {error && <p className="error-message">{error}</p>}
      
      <div className="button-group">
        {!isCameraOn ? (
          <button onClick={startCamera}>Start Camera</button>
        ) : (
          <>
            <button onClick={capturePhoto}>Capture and Identify</button>
            <button onClick={stopCamera}>Stop Camera</button>
          </>
        )}
      </div>
      
      {result && (
        <div className="result">
          <p>Welcome back, {result.username}!</p>
          <p>You seem to be feeling {result.emotion}.</p>
        </div>
      )}
    </div>
  );
}

export default FaceRecognitionPage;