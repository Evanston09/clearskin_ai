// import { Image } from 'expo-image';
// import { View, Text} from 'react-native';
// import { Platform, StyleSheet, Button, TouchableOpacity} from 'react-native';
// import { CameraView, CameraType, useCameraPermissions, Camera } from 'expo-camera';
// import { useEffect, useState, useRef } from 'react';
//
// import { HelloWave } from '@/components/HelloWave';
// import ParallaxScrollView from '@/components/ParallaxScrollView';
// import { ThemedText } from '@/components/ThemedText';
// import { ThemedView } from '@/components/ThemedView';
//
// import * as tf from '@tensorflow/tfjs';
//
//
// export default function ScanScreen() {
//     const [model, setModel] = useState<tf.GraphModel>();
//     const [facing, setFacing] = useState<CameraType>('front');
//     const cameraRef = useRef<CameraView>(null);
//     const [permission, requestPermission] = useCameraPermissions();
//     useEffect(() => {
//         console.log("Starting to load model");
//         const modelFiles = bundleResourceIO(
//             require("../assets/model/model.json"),
//             [
//                 require("../assets/model/group1-shard1of3.bin"),
//                 require("../assets/model/group1-shard2of3.bin"),
//                 require("../assets/model/group1-shard3of3.bin"),
//             ],
//         );
//         const fetchModel = async () => {
//             await tf.ready();
//             setModel(await tf.loadGraphModel(modelFiles));
//             console.log("Model fetched");
//         };
//
//     fetchModel();
//   }, []);
//
//     if (!permission) {
//         // Camera permissions are still loading.
//         return <ThemedView />;
//     }
//
//     if (!permission.granted) {
//         return (
//             <ThemedView style={styles.container}>
//                 <ThemedText>We need your permission to show the camera</ThemedText>
//                 <Button onPress={requestPermission} title="grant permission" />
//             </ThemedView>
//         );
//     }
//     function toggleCameraFacing() {
//         setFacing(current => (current === 'back' ? 'front' : 'back'));
//     }
//     async function takePictureAndProcess() {
//         if (cameraRef.current && model) {
//             console.log("hello");
//
//             const image = await cameraRef.current.takePictureAsync({ base64: true, skipProcessing: true})
//             if (!image.base64){
//                 console.log("here");
//                 return;
//             } 
//             const binaryString = atob(image.base64);
//             var bytes = new Uint8Array(binaryString.length);
//             for (var i = 0; i < binaryString.length; i++) {
//                 bytes[i] = binaryString.charCodeAt(i);
//             }
//             let imageTensor = decodeJpeg(bytes);
//
//             imageTensor = tf.image.resizeBilinear(imageTensor, [1024, 1024]);
//             imageTensor = imageTensor.div(255.0);
//             imageTensor = imageTensor.expandDims(0);
//             console.log('Input tensor shape:', imageTensor.shape);
//             console.log('Expected input shape:', model.inputs[0].shape);
//
//             const result = model.execute(imageTensor) as tf.Tensor
//             result.arraySync().forEach((det) => {
//                     const [_, x0, y0, x1, y1, cls_id, score] = det
//                 console.log("X0" +x0);
//                 console.log("Y0" +y0);
//                 console.log("score" +score);
//             })
//
//         }
//     }
//   return (
//       <ThemedView style={styles.container}>
//       <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
//         <ThemedView style={styles.buttonContainer}>
//           <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
//             <ThemedText type='defaultSemiBold'>Flip Camera</ThemedText>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.button} onPress={takePictureAndProcess}>
//             <ThemedText type='defaultSemiBold'>Take Picture</ThemedText>
//           </TouchableOpacity>
//         </ThemedView>
//       </CameraView>
//     </ThemedView>
//   );
// }
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   camera: {
//     flex: 1,
//   },
//   buttonContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     backgroundColor: 'transparent',
//     margin: 64,
//   },
//   button: {
//     flex: 1,
//     alignSelf: 'flex-end',
//     alignItems: 'center',
//   },
// });
