import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ArrowLeft, ChevronRight, ScanFace } from 'lucide-react-native';
import { TouchableOpacity, StyleSheet, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Detection = {
    box: { x: number; y: number; width: number; height: number };
    class: string;
    confidence: number;
};

type Results = {
    id: string;
    date: string;
    detections: Detection[] | null;
    detectorStatus?: 'completed' | 'unavailable';
};

export default function AllScans() {
    const [results, setResults] = useState<Results[]>([]);
    const cardBg = useThemeColor({}, 'cardBackground');

    useFocusEffect(
        useCallback(() => {
            async function load() {
                try {
                    const raw = await AsyncStorage.getItem('detections');
                    if (!raw) {
                        setResults([]);
                        return;
                    }
                    const ids: string[] = JSON.parse(raw);
                    const unique = [...new Set(ids)];
                    const items = await Promise.all(
                        unique.map(async (id) => {
                            const v = await AsyncStorage.getItem(id);
                            return v ? (JSON.parse(v) as Results) : null;
                        })
                    );
                    setResults(items.filter((r): r is Results => r !== null).reverse());
                } catch {
                    setResults([]);
                }
            }
            load();
        }, [])
    );

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} activeOpacity={0.75}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                    </TouchableOpacity>
                    <ThemedText style={styles.title}>All Scans</ThemedText>
                    <View style={styles.iconButton} />
                </View>

                {results.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <ScanFace size={36} color={Colors.primary_400} />
                        <ThemedText style={styles.emptyTitle}>No scans yet</ThemedText>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        renderItem={({ item }) => {
                            const detectorUnavailable = item.detectorStatus === 'unavailable' || item.detections === null;
                            const spotCount = item.detections?.length ?? 0;
                            return (
                                <TouchableOpacity
                                    style={[styles.scanItem, { backgroundColor: cardBg }]}
                                    onPress={() => router.push({ pathname: '/detectionDetails', params: { id: item.id } })}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.scanItemLeft}>
                                        <View style={styles.scanDot} />
                                        <View style={styles.scanTextBlock}>
                                            <ThemedText style={styles.scanDate} numberOfLines={1}>
                                                {new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </ThemedText>
                                            <ThemedText style={styles.scanTime} numberOfLines={1}>
                                                {new Date(item.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </ThemedText>
                                        </View>
                                    </View>
                                    <View style={styles.scanItemRight}>
                                        {!detectorUnavailable && (
                                            <View style={styles.spotsBadge}>
                                                <ThemedText style={styles.spotsBadgeText} numberOfLines={1} adjustsFontSizeToFit>
                                                    {`${spotCount} spot${spotCount !== 1 ? 's' : ''}`}
                                                </ThemedText>
                                            </View>
                                        )}
                                        <ChevronRight size={14} color={Colors.primary_400} />
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                    />
                )}
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
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    listContent: { paddingVertical: 8, paddingBottom: 32 },
    separator: { height: 8 },
    scanItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 68,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 16,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    scanItemLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 0 },
    scanDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary_600, flexShrink: 0 },
    scanTextBlock: { flex: 1, minWidth: 0 },
    scanDate: { fontSize: 15, fontWeight: '600' },
    scanTime: { fontSize: 12, opacity: 0.45, marginTop: 2 },
    scanItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
    spotsBadge: {
        backgroundColor: Colors.primary_100,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        width: 92,
        alignItems: 'center',
    },
    spotsBadgeText: { fontSize: 12, fontWeight: '600', color: Colors.primary_800 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 6 },
});
