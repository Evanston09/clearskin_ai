import { ThemedText } from '@/components/ThemedText';
import { Asset } from 'expo-asset'
import * as ort from "onnxruntime-react-native";
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Scan() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
    const [image, setImage] = useState<string | null>(null);

      // const [session, setSession] = useState<ort.InferenceSession | null>(null);
  useEffect(() => {
        async function loadModel() {
            try {
                // Note: `.onnx` model files can be viewed in Netron (https://github.com/lutzroeder/netron) to see
                // model inputs/outputs detail and data types, shapes of those, etc.
                const assets = await Asset.loadAsync(require('@/assets/model/best.onnx'));
                const modelUri = assets[0].localUri;
                console.log(modelUri)
                if (!modelUri) {
                    Alert.alert('failed to get model URI', `${assets[0]}`);
                } else {
                    // load model from model url path
                    let myModel = await ort.InferenceSession.create(modelUri);
                    Alert.alert(
                        'model loaded successfully',
                        `input names: ${myModel.inputNames}, output names: ${myModel.outputNames}`);

                    // loading model from bytes
                    // const base64Str = await RNFS.readFile(modelUri, 'base64');
                    // const uint8Array = base64.toByteArray(base64Str);
                    // myModel = await ort.InferenceSession.create(uint8Array);
                }
            } catch (e) {
                Alert.alert('failed to load model', `${e}`);
                throw e;
            }
        }


    loadModel();
  }, []);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        console.log(result);

        if (!result.canceled) {
            setImage(result.assets[0].uri);
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

