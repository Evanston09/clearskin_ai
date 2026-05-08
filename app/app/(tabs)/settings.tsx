import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/contexts/AuthContext';
import { useTheme, type ThemePref } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronRight,
    Info,
    LogOut,
    Monitor,
    Moon,
    Sun,
    Trash2,
    User,
} from 'lucide-react-native';

export default function Settings() {
    const { signOut, user } = useSession();
    const { pref, setPref, scheme } = useTheme();
    const cardBg = useThemeColor({}, 'cardBackground');

    const handleSignOut = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await signOut();
                    } catch {
                        Alert.alert('Error', 'Failed to sign out. Please try again.');
                    }
                },
            },
        ]);
    };

    const handleClearHistory = () => {
        Alert.alert(
            'Clear Scan History',
            'Permanently delete all saved scans? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const raw = await AsyncStorage.getItem('detections');
                            const ids: string[] = raw ? JSON.parse(raw) : [];
                            await Promise.all(ids.map((id) => AsyncStorage.removeItem(id)));
                            await AsyncStorage.removeItem('detections');
                            Alert.alert('Done', 'All scans cleared.');
                        } catch {
                            Alert.alert('Error', 'Failed to clear history.');
                        }
                    },
                },
            ]
        );
    };

    const themeOptions: { key: ThemePref; label: string; Icon: typeof Sun }[] = [
        { key: 'light', label: 'Light', Icon: Sun },
        { key: 'dark', label: 'Dark', Icon: Moon },
        { key: 'system', label: 'Auto', Icon: Monitor },
    ];

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <ThemedText style={styles.screenTitle}>Settings</ThemedText>

                    {/* Profile */}
                    <View style={[styles.profileCard, { backgroundColor: cardBg }]}>
                        <View style={styles.avatar}>
                            <User size={28} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <ThemedText type="defaultSemiBold" style={styles.name}>
                                {user?.displayName || user?.email || 'Account'}
                            </ThemedText>
                            {!!user?.email && (
                                <ThemedText style={styles.email}>{user.email}</ThemedText>
                            )}
                        </View>
                    </View>

                    {/* Appearance */}
                    <ThemedText style={styles.sectionLabel}>Appearance</ThemedText>
                    <View style={[styles.segmentWrap, { backgroundColor: cardBg }]}>
                        {themeOptions.map(({ key, label, Icon }) => {
                            const active = pref === key;
                            return (
                                <TouchableOpacity
                                    key={key}
                                    onPress={() => setPref(key)}
                                    style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                                    activeOpacity={0.75}
                                >
                                    <Icon size={16} color={active ? '#fff' : Colors.primary_800} />
                                    <ThemedText style={[styles.segmentText, active && styles.segmentTextActive]}>
                                        {label}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <ThemedText style={styles.hint}>
                        {pref === 'system' ? `Following system (${scheme})` : `Always ${pref}`}
                    </ThemedText>

                    {/* Data */}
                    <ThemedText style={styles.sectionLabel}>Data</ThemedText>
                    <TouchableOpacity
                        style={[styles.row, { backgroundColor: cardBg }]}
                        onPress={handleClearHistory}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
                            <Trash2 size={18} color="#DC2626" />
                        </View>
                        <ThemedText style={[styles.rowLabel, { color: '#DC2626' }]}>Clear scan history</ThemedText>
                        <ChevronRight size={16} color="#DC2626" />
                    </TouchableOpacity>

                    {/* About */}
                    <ThemedText style={styles.sectionLabel}>About</ThemedText>
                    <TouchableOpacity
                        style={[styles.row, { backgroundColor: cardBg }]}
                        onPress={() => router.push('/about')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.rowIcon, { backgroundColor: Colors.primary_200 }]}>
                            <Info size={18} color={Colors.primary_800} />
                        </View>
                        <ThemedText style={styles.rowLabel}>About ClearSkinAI</ThemedText>
                        <ChevronRight size={16} color={Colors.primary_700} />
                    </TouchableOpacity>

                    {/* Sign out */}
                    <TouchableOpacity
                        style={[styles.row, styles.signOutRow, { backgroundColor: cardBg }]}
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.rowIcon, { backgroundColor: '#FEE2E2' }]}>
                            <LogOut size={18} color="#DC2626" />
                        </View>
                        <ThemedText style={[styles.rowLabel, { color: '#DC2626' }]}>Sign out</ThemedText>
                        <ChevronRight size={16} color="#DC2626" />
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    scroll: { padding: 20, paddingBottom: 40 },
    screenTitle: { fontSize: 26, fontWeight: '700', marginBottom: 16 },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary_700,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: { fontSize: 17 },
    email: { fontSize: 13, opacity: 0.55, marginTop: 2 },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        opacity: 0.5,
        marginTop: 22,
        marginBottom: 8,
    },
    segmentWrap: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        gap: 4,
    },
    segmentBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 9,
    },
    segmentBtnActive: {
        backgroundColor: Colors.primary_800,
    },
    segmentText: { fontSize: 14, fontWeight: '600', color: Colors.primary_900 },
    segmentTextActive: { color: '#fff' },
    hint: { fontSize: 12, opacity: 0.5, marginTop: 8, marginLeft: 4 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        marginBottom: 8,
    },
    rowIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
    rowSub: { fontSize: 12, opacity: 0.55, marginTop: 2 },
    signOutRow: { marginTop: 24 },
});
