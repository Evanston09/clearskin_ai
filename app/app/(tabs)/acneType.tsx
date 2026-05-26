import { ThemedText } from '@/components/ThemedText';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { File, Paths } from 'expo-file-system';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Button, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Image as ImageIcon, RefreshCw } from 'lucide-react-native';

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
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

    useEffect(() => {
        async function isFirstTime() {
            const isFirstTime = await AsyncStorage.getItem('first-time');
            if (isFirstTime === null || isFirstTime === 'true') {
                Alert.alert("First Time", "Seems like its your first time using ClearSkinAI! Take a picture or upload a photo to get started. Disclaimer: This is not professional medical advice.")
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
            tempFile.copy(permanentFile);

            await AsyncStorage.setItem('first-time', 'false');

            setIsProcessing(false);
            // Pass image URI and ID to quiz screen
            router.push({
                pathname: '/quiz',
                params: { imageUri: permanentFile.uri, detectionId: id }
            });
        } catch (error) {
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

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <ThemedView style={styles.container}>
            <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
            <TouchableOpacity
                style={[styles.flipButton, { top: insets.top + 16 }]}
                onPress={toggleCameraFacing}
                accessibilityLabel="Flip camera"
            >
                <RefreshCw size={22} color="#fff" />
            </TouchableOpacity>
            <View style={[styles.controls, { bottom: insets.bottom + 32 }]}>
                <TouchableOpacity
                    style={styles.galleryButton}
                    onPress={pickImage}
                    accessibilityLabel="Choose from gallery"
                >
                    <ImageIcon size={26} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.shutterOuter}
                    onPress={takePicture}
                    accessibilityLabel="Take picture"
                >
                    <View style={styles.shutterInner} />
                </TouchableOpacity>
                <View style={styles.spacer} />
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
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
  flipButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  galleryButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
  spacer: {
    width: 52,
    height: 52,
  },
});

