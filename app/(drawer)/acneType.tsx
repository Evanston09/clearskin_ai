import { ThemedText } from '@/components/ThemedText';
import { Asset } from 'expo-asset'
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ThemedView } from '@/components/ThemedView';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTensorflowModel } from'react-native-fast-tflite';
import { convertToRGB } from 'react-native-image-to-rgb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';

type Detections = {
    id: string,
    date: Date,
    detections:Detection[]
}

type Detection = {
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    // Also provide corner coordinates for drawing
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    // Confidence and class
    confidence: number,
    classIndex: number,
    acneType: string

}
export default function Scan() {
  const [facing, setFacing] = useState<CameraType>('front');
  const [permission, requestPermission] = useCameraPermissions();
    const [image, setImage] = useState<string | null>(null);
    const plugin = useTensorflowModel(require("@/assets/acne.tflite"))

    useEffect(() => {
        async function isFirstTime() {
            await AsyncStorage.removeItem('quiz-answers');
            const isFirstTime = await AsyncStorage.getItem('first-time');
            console.log(isFirstTime);
            if (isFirstTime === null || isFirstTime === 'true') {
                Alert.alert("First Time", "Seems like its your first time using Clearskin AI! Take a picture or upload a photo to get started.")
            }
        }

        isFirstTime();
    }, [])

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            aspect: [4, 3],
            quality: 1,
        });

        if(!result.canceled) {

            const manipContext = ImageManipulator.ImageManipulator.manipulate(result.assets[0].uri);
            manipContext.resize({
                width: 640, 
                height: 640
            })

            const manipRef = await manipContext.renderAsync()
            const manifImg = await manipRef.saveAsync({base64: true});

            const convertedArray = await convertToRGB(manifImg.uri);

            const finalBuf = new Float32Array(convertedArray)

            if (plugin.state === "loaded") {
                // Model expects shape [1,640,640,3] - the library should handle reshaping
                const acneResult = await plugin.model.run([finalBuf]);

                // Output shape is [1,8,8400]
                console.log("Raw output shape:", acneResult);

                // Parse detections (8400 possible detections with 8 features each)
                const outputData = acneResult[0]; // Get first output tensor
                const numDetections = 8400;

                // Transpose: Convert from [feature0_all, feature1_all, ...] to [[det0], [det1], ...]
                const transposed = [];
                for (let i = 0; i < numDetections; i++) {
                    transposed.push([
                        outputData[0 * numDetections + i], // x
                        outputData[1 * numDetections + i], // y
                        outputData[2 * numDetections + i], // w
                        outputData[3 * numDetections + i], // h
                        outputData[4 * numDetections + i], // class0
                        outputData[5 * numDetections + i], // class1
                        outputData[6 * numDetections + i], // class2
                        outputData[7 * numDetections + i], // class3
                    ]);
                }

                const confidenceThreshold = 0.5;

                const id = Crypto.randomUUID();
                const detectionObject = {
                    id,
                    date: new Date(),
                    detections: [] as Detection[]
                }

                const acneTypes = ['Nodules and Cysts', 'Papules', 'Pustules', 'Whitehead and Blackhead'];

                for (let i = 0; i < numDetections; i++) {
                    const [x, y, w, h, class0, class1, class2, class3] = transposed[i];
                    
                    // Find the class with highest confidence
                    const classConfidences = [class0, class1, class2, class3];
                    const maxConfidence = Math.max(...classConfidences);
                    const classIndex = classConfidences.indexOf(maxConfidence);

                    if (maxConfidence > confidenceThreshold) {
                        // Convert normalized coordinates to pixel coordinates
                        const centerX = x * 640;
                        const centerY = y * 640;
                        const width = w * 640;
                        const height = h * 640;

                        const detection = {
                            // Bounding box in pixel coordinates
                            centerX: Math.round(centerX),
                            centerY: Math.round(centerY),
                            width: Math.round(width),
                            height: Math.round(height),
                            // Also provide corner coordinates for drawing
                            x1: Math.round(centerX - width / 2),
                            y1: Math.round(centerY - height / 2),
                            x2: Math.round(centerX + width / 2),
                            y2: Math.round(centerY + height / 2),
                            // Confidence and class
                            confidence: maxConfidence,
                            classIndex: classIndex,
                            acneType: acneTypes[classIndex]
                        };
                        detectionObject.detections.push(detection);
                    }
                }

                console.log(`Found ${detectionObject.detections.length} acne spot(s)`);

                detectionObject.detections.forEach((det, idx) => {
                    console.log(`Spot ${idx + 1}: ${det.acneType} at (${det.centerX}, ${det.centerY}), ${(det.confidence * 100).toFixed(1)}% confidence`);
                });

                const rawListIds = await AsyncStorage.getItem('detections');

                if (rawListIds === null) {
                    await AsyncStorage.setItem('detections', JSON.stringify([id]))
                }
                else {
                    let listIds: string[] = JSON.parse(rawListIds);
                    listIds.push(id)
                    await AsyncStorage.setItem('detections', JSON.stringify(listIds))
                }
                
                await AsyncStorage.setItem(id, JSON.stringify(detectionObject))
                await AsyncStorage.setItem('first-time', 'false');

                router.push('/quiz');
            }
        }
    };


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
      <CameraView style={styles.camera} facing={facing} />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.text}>Select Image</Text>
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
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64,
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});

