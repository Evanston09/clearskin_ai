import { ThemedText } from '@/components/ThemedText';
import { Asset } from 'expo-asset'
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  useObjectDetection,
  SSDLITE_320_MOBILENET_V3_LARGE,
} from 'react-native-executorch';



export default function Scan() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
    const [image, setImage] = useState<string | null>(null);
    const ssdlite = useObjectDetection({ model: SSDLITE_320_MOBILENET_V3_LARGE });
      // const [session, setSession] = useState<ort.InferenceSession | null>(null);
    //

    const pickImage = async () => {
        console.log("Hello hwo");
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        console.log(result)


        if (!result.canceled) {
            setImage(result.assets[0].uri);

            for (const detection of await ssdlite.forward(result.assets[0].uri)) {
                console.log('Bounding box: ', detection.bbox);
                console.log('Bounding label: ', detection.label);
                console.log('Bounding score: ', detection.score);
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

