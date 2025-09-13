import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, TextInput, Alert, Dimensions, View } from "react-native";
import { auth } from '@/firebaseConfig'
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';

export default function Overview() {
    return (
            <ThemedText>Testing</ThemedText>
    );
}
