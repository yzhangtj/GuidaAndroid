// App.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const SERVER_URL = 'http://192.168.8.17:5001/process-data';

export default function App() {
  const cameraRef = useRef(null);
  const [hasCamPermission, setHasCamPermission] = useState(null);
  const [hasAudioPermission, setHasAudioPermission] = useState(null);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    (async () => {
      const camPerm = await Camera.requestCameraPermissionsAsync();
      const audPerm = await Audio.requestPermissionsAsync();
      console.log('Camera permission:', camPerm.status);
      console.log('Audio permission:', audPerm.status);

      setHasCamPermission(camPerm.status === 'granted');
      setHasAudioPermission(audPerm.status === 'granted');

      if (camPerm.status === 'granted' && audPerm.status === 'granted') {
        const audioFile = await recordAudioFlow();
        console.log('Audio file:', audioFile);

        const base64Image = await capturePhotoFlow();
        console.log('Captured image base64 length:', base64Image?.length);

        if (audioFile && base64Image) {
          const feedbackText = await sendDataToServer(audioFile, base64Image);
          console.log('Feedback from server:', feedbackText);
          if (feedbackText) {
            Speech.speak(feedbackText, { rate: 1.0 });
          }
        }
      }
    })();
  }, []);

  const recordAudioFlow = async () => {
    try {
      setIsRecording(true); // Indicate that recording is in progress
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started');

      await new Promise(resolve => setTimeout(resolve, 5000));

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      console.log('Recording stopped, file saved at:', uri);
      setIsRecording(false); // Reset recording indicator
      return uri;
    } catch (err) {
      console.log('Error in recording audio:', err);
      setIsRecording(false); // Reset recording indicator on error
      return null;
    }
  };

  const capturePhotoFlow = async () => {
    if (!cameraRef.current) {
      console.log('No camera reference');
      return null;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true,
      });
      console.log('Captured photo base64 length:', photo?.base64?.length);
      return photo.base64;
    } catch (err) {
      console.log('Error capturing photo:', err);
      return null;
    }
  };

  const sendDataToServer = async (audioUri, base64Image) => {
    try {
      const audioFile = await fetch(audioUri);
      const audioBlob = await audioFile.blob();
      const audioBase64 = await audioBlob.text();

      const payload = {
        audio: audioBase64,
        image: base64Image,
      };

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.feedback || 'No valid feedback received';
    } catch (error) {
      console.log('Error sending data to server:', error);
      return null;
    }
  };

  return (
    <View style={styles.container}>
      {(hasCamPermission && hasAudioPermission) ? (
        <Camera ref={cameraRef} style={styles.cameraView} type={Camera.Constants.Type.back} />
      ) : (
        <Text style={styles.infoText}>Waiting for camera/audio permissions...</Text>
      )}
      <Text style={styles.infoText}>
        {isRecording
          ? 'Recording in progress...'
          : 'Recording audio and capturing image automatically...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraView: {
    flex: 1, // Ensures the camera view takes up full available space
    width: '100%',
    height: '50%', // Adjust if needed
  },
  infoText: {
    margin: 10,
    fontSize: 16,
    color: '#333',
  },
});
