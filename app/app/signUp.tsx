import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useState } from 'react';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [username, setUsername] = useState('')
    const [error, setError] = useState<string | null>(null)
    const textColor = useThemeColor({}, 'text');
    const inputBg = useThemeColor({}, 'cardBackground');
    const { signUp, signInWithGoogle } = useSession();

    const handleAccountCreation = async () => {
        setError(null);
        if (!email.trim() || !password.trim() || !username.trim()) {
            setError('Please fill out all fields');
            return;
        }
        try {
            await signUp(email, password, username);
        } catch (error: any) {
            setError(error?.message ?? 'Something went wrong. Please try again.');
        }
    }

    return (
        <ThemedView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.inner}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.logoSection}>
                        <Image
                            source={require('@/assets/images/clearskin_logo.jpg')}
                            style={styles.logo}
                        />
                        <ThemedText style={styles.appName} numberOfLines={1} adjustsFontSizeToFit>ClearSkinAI</ThemedText>
                        <ThemedText style={styles.tagline}>Create your account to get started</ThemedText>
                    </View>

                    <View style={styles.form}>
                        <ThemedText style={styles.formTitle}>Create account</ThemedText>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Username</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textColor, backgroundColor: inputBg }]}
                                placeholderTextColor={textColor + '70'}
                                placeholder="Choose a username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Email</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textColor, backgroundColor: inputBg }]}
                                placeholderTextColor={textColor + '70'}
                                placeholder="you@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <ThemedText style={styles.label}>Password</ThemedText>
                            <TextInput
                                style={[styles.input, { color: textColor, backgroundColor: inputBg }]}
                                placeholderTextColor={textColor + '70'}
                                placeholder="••••••••"
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>

                        {error && (
                            <View style={styles.errorBox}>
                                <ThemedText style={styles.errorText}>{error}</ThemedText>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleAccountCreation}
                            activeOpacity={0.85}
                        >
                            <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                                Create Account
                            </ThemedText>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <ThemedText style={styles.dividerText}>or</ThemedText>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={async () => {
                                setError(null);
                                try {
                                    await signInWithGoogle();
                                } catch (e: any) {
                                    if (e?.code !== 'SIGN_IN_CANCELLED') {
                                        setError(e?.message ?? 'Google Sign-In failed');
                                    }
                                }
                            }}
                            activeOpacity={0.85}
                        >
                            <Image
                                source={require('@/assets/images/google-logo.png')}
                                style={styles.googleIcon}
                            />
                            <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.replace('/login')}>
                            <ThemedText style={styles.secondaryButtonText}>Sign In Instead</ThemedText>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ThemedView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginBottom: 14,
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: Colors.primary_900,
        letterSpacing: -0.5,
        marginTop: 6,
        lineHeight: 44,
        includeFontPadding: false,
    },
    tagline: {
        fontSize: 14,
        opacity: 0.55,
        marginTop: 4,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    formTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 14,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        opacity: 0.7,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        width: '100%',
    },
    errorBox: {
        backgroundColor: '#FEE2E2',
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
    },
    button: {
        height: 52,
        backgroundColor: Colors.primary_800,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 4,
        shadowColor: Colors.primary_900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        gap: 10,
    },
    dividerLine: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: Colors.primary_300,
    },
    dividerText: {
        fontSize: 13,
        opacity: 0.5,
    },
    googleButton: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#ddd',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    secondaryButton: {
        height: 52,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.primary_600,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary_800,
    },
});
