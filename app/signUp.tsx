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

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [error, setError] = useState<String | null>(null)
    const textColor = useThemeColor({}, 'text');
    
    const handleAccountCreation = async () => {
        setError(null)

        if (!email.trim() || !password.trim()) {
            setError('Fill Out All Fields')
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                updateProfile(userCredential.user, {displayName: username})
            })
            .catch((error) => {
                setError(error.message);
            });
    }

    return (
        <ThemedView style={styles.container}>
            <Image
                source={require('@/assets/images/clearskin_logo.jpg')}
                style={styles.logo}
            />
                <ThemedText type="title">Welcome to Clearskin</ThemedText>
                <ThemedText style={styles.subtitle} type="subtitle">Create new account</ThemedText>
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholderTextColor={textColor}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                    />
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholderTextColor={textColor}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                    />
                
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholderTextColor={textColor}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    {error &&
                        <ThemedText style={styles.error}>
                            {error}
                        </ThemedText>
                    }
                
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleAccountCreation}
                    activeOpacity={0.8}
                >
                    <ThemedText type="defaultSemiBold">Create Account</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => router.replace('/')}
                >
                    <ThemedText type="defaultSemiBold" style={styles.extraText}>Sign In</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity>
                    <ThemedText type="defaultSemiBold" style={styles.extraText}>
                        Forgot Password?
                    </ThemedText>
                </TouchableOpacity>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    error: {
        color: Colors.error,
        marginBottom: 12
    },
    subtitle: {
        marginBottom: 24
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: Colors.primary_700,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        width: '100%', 
        marginBottom: 16,
    },
    button: {
        height: 52,
        marginBottom: 16,
        width: '100%', 
        backgroundColor: Colors.primary_700,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    extraText: {
        color: Colors.primary_700,
        marginBottom: 2,
        fontSize: 14,
    },
    extraTextContainer: {
        color: Colors.primary_700,
        margin: 16,
        fontSize: 14,
    },
    logo: {
        width: 250, 
        height: 250, 
        borderRadius: 125,
        marginBottom: 12
    }
});
