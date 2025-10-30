import { ThemedText } from '@/components/ThemedText';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { File, Paths } from 'expo-file-system';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

export type Detections = {
    id: string,
    date: Date,
    imageUri: string,
    detections: Detection[] | null,
    apiStatus: 'pending' | 'completed' | 'error',
    imageSize?: {
        width: number,
        height: number
    }
}

export type Detection = {
    box: {
        x: number,
        y: number,
        width: number,
        height: number
    },
    class: string,
    confidence: number
}
export default function Scan() {
  console.log("Scan component rendering");
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

    useEffect(() => {
        async function isFirstTime() {
            await AsyncStorage.removeItem('quiz-answers');
            const isFirstTime = await AsyncStorage.getItem('first-time');
            console.log(isFirstTime);
            if (isFirstTime === null || isFirstTime === 'true') {
                Alert.alert("First Time", "Seems like its your first time using Clearskin AI! Take a picture or upload a photo to get started. Disclaimer: This is not professional medical advice.")
            }
        }

        isFirstTime();
    }, [])

    const processImageUri = async (imageUri: string) => {
        setIsProcessing(true);

        try {
            const id = Crypto.randomUUID();

            // Copy image to permanent storage
            const tempFile = new File(imageUri);
            const permanentFile = new File(Paths.document, `${id}.jpg`);
            await tempFile.copy(permanentFile);

            await AsyncStorage.setItem('first-time', 'false');

            setIsProcessing(false);
            // Pass image URI and ID to quiz screen
            router.push({
                pathname: '/quiz',
                params: { imageUri: permanentFile.uri, detectionId: id }
            });
        } catch (error) {
            console.error('Error processing image:', error);
            Alert.alert('Error', 'Failed to process image. Please try again.');
            setIsProcessing(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            await processImageUri(result.assets[0].uri);
        }
    };

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync();
            if (photo) {
                await processImageUri(photo.uri);
            }
        }
    };

    if (isProcessing) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <ThemedText style={styles.message}>Processing image...</ThemedText>
            </ThemedView>
        );
    }

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.message}>We need your permission to show the camera</ThemedText>
                <Button onPress={requestPermission} title="grant permission" />
            </ThemedView>
        );
    }

    // Readd later
    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <ThemedView style={styles.container}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={takePicture}>
                    <ThemedText type="defaultSemiBold">Take Picture</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={pickImage}>
                    <ThemedText type="defaultSemiBold">Select Image</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
  },
  button: {
    flex: 1,
    backgroundColor: Colors.primary_600,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

