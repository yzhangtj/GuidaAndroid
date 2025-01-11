import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Camera } from 'expo-camera'; // or react-native-camera
import * as Speech from 'expo-speech'; // or react-native-tts
import Pocketsphinx from 'react-native-pocketsphinx'; // hypothetical example library

/**
 * Replace with your phone’s server IP + port
 * e.g. "http://192.168.1.12:5000/process-data"
 */
const PHONE_SERVER_URL = 'http://192.168.8.17:5000/process-data';

export default function App() {
  const cameraRef = useRef(null);

  const [hasCamPermission, setHasCamPermission] = useState(false);
  const [hasAudioPermission, setHasAudioPermission] = useState(false);

  // The recognized text
  const [recognizedText, setRecognizedText] = useState(null);

  useEffect(() => {
    (async () => {
      // 1) Request camera permission
      const camPerm = await Camera.requestCameraPermissionsAsync();
      setHasCamPermission(camPerm.status === 'granted');

      // 2) Request audio permission
      // If using react-native-audio, you'd do a similar request
      // for Pocketsphinx usage, ensure RECORD_AUDIO is granted
      // you might have to use react-native-permissions
      // or check AndroidManifest manually.
      // For simplicity, let's assume you have it:
      setHasAudioPermission(true);

      // 3) Initialize pocketsphinx (offline STT)
      // Typically you'd load model assets, etc.
      // This is library-specific; pseudo code:
      try {
        await Pocketsphinx.init({
          model: 'en-us',    // path or asset reference
          dict: 'cmudict-en-us', // path or asset reference
          // etc...
        });
        console.log('Pocketsphinx init success.');
      } catch (e) {
        console.warn('Pocketsphinx init error:', e);
      }

      // 4) Start listening for 5 seconds
      setTimeout(() => {
        // Stop recognition after 5s
        Pocketsphinx.stop()
          .then(() => console.log('Stopped pocketsphinx'))
          .catch(err => console.warn(err));
      }, 5000);

      // Start pocketsphinx listening
      Pocketsphinx.on('partialResult', (text) => {
        // partial results
        console.log('Partial result:', text);
      });
      Pocketsphinx.on('result', (text) => {
        console.log('Final result:', text);
        setRecognizedText(text);
      });

      await Pocketsphinx.start();
      console.log('Started pocketsphinx recognition.');
    })();
  }, []);

  // After pocketsphinx stops (in 5s), we can do camera capture and send data
  useEffect(() => {
    if (recognizedText) {
      // we have recognized text, capture photo next
      captureAndSend();
    }
  }, [recognizedText]);

  const captureAndSend = async () => {
    if (!cameraRef.current) {
      console.log('Camera ref is null');
      return;
    }
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true
      });
      console.log('Photo captured. base64 length:', photo?.base64?.length);

      // send text + image to phone
      const serverResponse = await sendImageAndText(photo.base64, recognizedText);
      console.log('Server response:', serverResponse);

      // speak the feedback
      if (serverResponse) {
        Speech.speak(serverResponse, { rate: 1.0 });
      }
    } catch (err) {
      console.log('Error capturing photo or sending data:', err);
    }
  };

  const sendImageAndText = async (base64Image, text) => {
    try {
      const payload = { image: base64Image, text };
      const response = await fetch(PHONE_SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.feedback) {
        return data.feedback;
      }
      return 'No feedback found in response';
    } catch (error) {
      console.log('Error in sendImageAndText:', error);
      return null;
    }
  };

  if (!hasCamPermission || !hasAudioPermission) {
    return (
      <View style={styles.container}>
        <Text>Permissions not granted</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.cam}
        type={Camera.Constants.Type.back}
      />
      <Text style={styles.infoText}>
        Listening with Pocketsphinx for 5s, then capturing image...
      </Text>
      <Text style={styles.infoText}>
        Recognized Text: {recognizedText || '...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center'
  },
  cam: {
    width: '100%',
    height: '50%'
  },
  infoText: {
    margin: 10, fontSize: 16, color: '#333'
  }
});
