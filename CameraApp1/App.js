import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('external'); // You can use 'front' for the front camera

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) {
          // Handle permission permanently denied case
          console.error('Camera permission was denied');
        }
      }
    } catch (err) {
      console.error('Error requesting camera permission:', err);
    }
  };
  const checkDeviceCompatibility = () => {
  if (device === null) {
    console.error('No camera device found');
    return false;
  }
  return true;
};

  // Show loading view while checking permissions
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
      </View>
    );
  }

  // Show loading view while camera is loading
  if (!device) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Display the camera feed */}
      <Camera
        style={styles.preview}
        device={device}
        isActive={true} // Keep the camera feed active
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
});
