import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, ExternalLink, Heart } from 'lucide-react-native';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';

export default function About() {
    const version = Constants.expoConfig?.version ?? '1.0.0';

    const openLink = (url: string) => Linking.openURL(url).catch(() => {});

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} activeOpacity={0.75}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>About</ThemedText>
                    <View style={styles.iconButton} />
                </View>

                <View style={styles.brandWrap}>
                    <View style={styles.logoCircle}>
                        <Heart size={28} color="#fff" />
                    </View>
                    <ThemedText style={styles.brandName}>ClearSkinAI</ThemedText>
                    <ThemedText style={styles.versionText}>Version {version}</ThemedText>
                </View>

                <View style={styles.section}>
                    <TouchableOpacity style={styles.row} onPress={() => openLink('https://example.com/privacy')} activeOpacity={0.7}>
                        <ThemedText style={styles.rowLabel}>Privacy Policy</ThemedText>
                        <ExternalLink size={16} color={Colors.primary_700} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.row} onPress={() => openLink('https://example.com/terms')} activeOpacity={0.7}>
                        <ThemedText style={styles.rowLabel}>Terms of Service</ThemedText>
                        <ExternalLink size={16} color={Colors.primary_700} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.row} onPress={() => openLink('mailto:support@clearskinai.app')} activeOpacity={0.7}>
                        <ThemedText style={styles.rowLabel}>Contact Support</ThemedText>
                        <ExternalLink size={16} color={Colors.primary_700} />
                    </TouchableOpacity>
                </View>

                <ThemedText style={styles.footer}>
                    Made with care. Not a medical device — consult a dermatologist for diagnosis.
                </ThemedText>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1, paddingHorizontal: 20 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 48,
        marginBottom: 8,
    },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
    title: { fontSize: 18, fontWeight: '700' },
    brandWrap: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    logoCircle: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: Colors.primary_700,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    brandName: { fontSize: 22, fontWeight: '700' },
    versionText: { fontSize: 13, opacity: 0.55 },
    section: { gap: 8, marginTop: 8 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        backgroundColor: Colors.primary_100,
    },
    rowLabel: { fontSize: 15, fontWeight: '600' },
    footer: {
        fontSize: 12,
        opacity: 0.5,
        textAlign: 'center',
        marginTop: 'auto',
        paddingVertical: 24,
        lineHeight: 18,
    },
});
