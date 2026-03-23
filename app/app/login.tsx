import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const textColor = useThemeColor({}, 'text');
    const { signIn } = useSession();

    const handleSignIn = async () => {
        setError(null);

        if (!email.trim() || !password.trim()) {
            setError('Fill Out All Fields');
            return;
        }

        try {
            await signIn(email, password);
            // Auto-navigation via _layout.tsx when user state changes
        } catch (error: any) {
            setError(error?.message ?? 'Something went wrong. Please try again.');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <Image
                source={require('@/assets/images/clearskin_logo.jpg')}
                style={styles.logo}
            />
                <ThemedText type="title">Welcome to DermaSnap</ThemedText>
                <ThemedText style={styles.subtitle} type="subtitle">Sign in to your account</ThemedText>
                    <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholderTextColor={textColor}
                        placeholder="Email or Username"
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
                    onPress={handleSignIn}
                    activeOpacity={0.8}
                >
                    <ThemedText type="defaultSemiBold" lightColor="#fff" darkColor="#fff">Sign In</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.replace('/signUp')}
                >
                    <ThemedText type="defaultSemiBold" style={styles.extraText}>Create Account</ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => Alert.alert('Forgot Password', 'Please contact support to reset your password.')}>
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
    logo: {
        width: 250, 
        height: 250, 
        borderRadius: 125,
        marginBottom: 12
    }
});
