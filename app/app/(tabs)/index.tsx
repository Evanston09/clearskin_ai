import { ThemedText } from '@/components/ThemedText';
import PagerView from 'react-native-pager-view';
import { TouchableOpacity, StyleSheet, View, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ScanFace, Droplets, Sun, Clock, Zap, ChevronRight } from 'lucide-react-native';
import { useRef, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';
import { useThemeColor } from '@/hooks/useThemeColor';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = Math.max(20, SCREEN_WIDTH * 0.055);

type Results = {
    id: string;
    date: string;
    detections: Detection[] | null;
    detectorStatus?: 'completed' | 'unavailable';
    quizAnswers?: Record<string, string>;
};

type Detection = {
    box: { x: number; y: number; width: number; height: number };
    class: string;
    confidence: number;
};

const acneTips = [
    {
        id: 1,
        icon: Droplets,
        title: 'Stay Hydrated',
        tip: 'Drink 8+ glasses of water daily to keep skin clear and flush out toxins',
        color: '#4ECDC4',
        bg: '#E8FAF8',
    },
    {
        id: 2,
        icon: Sun,
        title: 'Use Sunscreen',
        tip: 'Apply SPF 30+ daily to prevent sun damage and worsening acne scars',
        color: '#F6A623',
        bg: '#FEF5E7',
    },
    {
        id: 3,
        icon: Clock,
        title: 'Sleep Well',
        tip: 'Get 7-9 hours of sleep to lower stress hormones that trigger breakouts',
        color: '#7ED6A8',
        bg: '#EDFAF4',
    },
    {
        id: 4,
        icon: Zap,
        title: 'Gentle Cleansing',
        tip: 'Wash face twice daily with a gentle cleanser — over-washing irritates skin',
        color: '#FF8B94',
        bg: '#FFF0F1',
    },
];

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
};

export default function Overview() {
    const pagerRef = useRef<PagerView | null>(null);
    const { user } = useSession();
    const [results, setResults] = useState<Results[] | null>(null);
    const [totalScanCount, setTotalScanCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const cardBg = useThemeColor({}, 'cardBackground');

    useFocusEffect(
        useCallback(() => {
            async function getRecentDetections() {
                try {
                    const rawDetectionList = await AsyncStorage.getItem('detections');
                    if (rawDetectionList === null) {
                        setResults([]);
                        setTotalScanCount(0);
                        return;
                    }

                    const detectionList: string[] = JSON.parse(rawDetectionList);
                    const uniqueIds = [...new Set(detectionList)];
                    setTotalScanCount(uniqueIds.length);
                    const recentIds = uniqueIds.slice(-3);

                    const detectionPromises = recentIds.map(async (id) => {
                        const rawDetection = await AsyncStorage.getItem(id);
                        if (!rawDetection) return null;
                        return JSON.parse(rawDetection) as Results;
                    });

                    const detections = await Promise.all(detectionPromises);
                    setResults(detections.filter((result): result is Results => result !== null).reverse());
                } catch {
                    setResults([]);
                    setTotalScanCount(0);
                }
            }
            getRecentDetections();
        }, [])
    );

    useEffect(() => {
        const interval = setInterval(() => {
            const nextPage = (currentPage + 1) % acneTips.length;
            pagerRef.current?.setPage(nextPage);
            setCurrentPage(nextPage);
        }, 3500);
        return () => clearInterval(interval);
    }, [currentPage]);

    const firstName = user?.displayName?.split(' ')[0] ?? 'there';
    const initials = user?.displayName
        ? user.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';
    const totalScans = totalScanCount;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const scansThisWeek = results?.filter((r) => new Date(r.date).getTime() >= oneWeekAgo).length ?? 0;
    const displayedResults = results;

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <ScrollView
                    contentContainerStyle={[styles.scrollContent, { paddingHorizontal: H_PAD }]}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Greeting */}
                    <View style={styles.greetingRow}>
                        <View style={styles.greetingText}>
                            <ThemedText style={styles.greetingLabel} numberOfLines={1}>{getGreeting()}</ThemedText>
                            <ThemedText style={styles.greetingName} numberOfLines={1} adjustsFontSizeToFit>{firstName}</ThemedText>
                        </View>
                        {user?.photoURL ? (
                            <Image
                                source={{ uri: user.photoURL }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        ) : (
                            <View style={styles.avatar}>
                                <ThemedText style={styles.avatarText}>{initials}</ThemedText>
                            </View>
                        )}
                    </View>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                            <ThemedText style={styles.statValue}>{totalScans}</ThemedText>
                            <ThemedText style={styles.statLabel}>
                                Scan{totalScans !== 1 ? 's' : ''}
                            </ThemedText>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                            <ThemedText style={styles.statValue}>{scansThisWeek}</ThemedText>
                            <ThemedText style={styles.statLabel}>This Week</ThemedText>
                        </View>
                    </View>

                    {/* Scan CTA */}
                    <TouchableOpacity
                        style={styles.scanCard}
                        onPress={() => router.push('/(tabs)/acneType')}
                        activeOpacity={0.88}
                    >
                        <View style={styles.scanCardIconWrap}>
                            <ScanFace size={34} color="#fff" />
                        </View>
                        <View style={styles.scanCardTextWrap}>
                            <ThemedText style={styles.scanCardTitle} lightColor="#fff" darkColor="#fff">
                                Scan Your Face
                            </ThemedText>
                            <ThemedText style={styles.scanCardSub} lightColor="rgba(255,255,255,0.65)" darkColor="rgba(255,255,255,0.65)">
                                AI-powered skin analysis
                            </ThemedText>
                        </View>
                        <View style={styles.scanCardArrow}>
                            <ChevronRight size={18} color="rgba(255,255,255,0.85)" />
                        </View>
                    </TouchableOpacity>

                    {/* Recent Scans */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeaderRow}>
                            <ThemedText style={styles.sectionHeading}>Recent Scans</ThemedText>
                            {totalScanCount > 3 && (
                                <TouchableOpacity
                                    onPress={() => router.push('/allScans')}
                                    style={styles.showAllButton}
                                    activeOpacity={0.75}
                                >
                                    <ThemedText style={styles.showAllText}>Show all</ThemedText>
                                    <ChevronRight size={14} color={Colors.primary_800} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {displayedResults && displayedResults.length > 0 ? (
                            <View style={[styles.scansCard, { backgroundColor: cardBg }]}>
                                {displayedResults.map((result, index) => {
                                    const spotCount = result.detections?.length ?? 0;
                                    const detectorUnavailable = result.detectorStatus === 'unavailable' || result.detections === null;
                                    return (
                                        <TouchableOpacity
                                            key={result.id}
                                            style={[
                                                styles.scanItem,
                                                index < displayedResults.length - 1 && styles.scanItemBorder,
                                            ]}
                                            onPress={() => router.push({ pathname: '/detectionDetails', params: { id: result.id } })}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.scanItemLeft}>
                                                <View style={styles.scanDot} />
                                                <View style={styles.scanTextBlock}>
                                                    <ThemedText style={styles.scanDate} numberOfLines={1}>
                                                        {new Date(result.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </ThemedText>
                                                    <ThemedText style={styles.scanTime} numberOfLines={1}>
                                                        {new Date(result.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
                                })}
                            </View>
                        ) : (
                            <View style={[styles.emptyCard, { backgroundColor: cardBg }]}>
                                <ScanFace size={36} color={Colors.primary_400} />
                                <ThemedText style={styles.emptyTitle}>No scans yet</ThemedText>
                                <ThemedText style={styles.emptyText}>
                                    Tap Scan Your Face above to get started
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    {/* Skincare Tips */}
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionHeading}>Skincare Tips</ThemedText>
                        <PagerView
                            scrollEnabled
                            ref={pagerRef}
                            style={styles.tipsPager}
                            initialPage={0}
                            onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
                        >
                            {acneTips.map((tip) => {
                                const IconComponent = tip.icon;
                                return (
                                    <View key={tip.id} style={styles.tipSlide}>
                                        <View style={[styles.tipCard, { backgroundColor: tip.bg }]}>
                                            <View style={[styles.tipIconWrap, { backgroundColor: tip.color }]}>
                                                <IconComponent size={24} color="#fff" />
                                            </View>
                                            <View style={styles.tipBody}>
                                                <ThemedText style={styles.tipTitle} lightColor="#11181C" darkColor="#11181C">{tip.title}</ThemedText>
                                                <ThemedText style={styles.tipText} lightColor="#374151" darkColor="#374151" numberOfLines={2}>{tip.tip}</ThemedText>
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </PagerView>
                        <View style={styles.dotsRow}>
                            {acneTips.map((tip, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        currentPage === i && [styles.activeDot, { backgroundColor: tip.color }],
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 40,
    },

    // Greeting
    greetingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greetingText: {
        flex: 1,
        paddingRight: 12,
    },
    greetingLabel: {
        fontSize: 12,
        opacity: 0.45,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 16,
        includeFontPadding: false,
    },
    greetingName: {
        fontSize: 28,
        fontWeight: '800',
        lineHeight: 34,
        includeFontPadding: false,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary_700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },

    // Stats
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        minHeight: 74,
        paddingHorizontal: 18,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.primary_800,
        lineHeight: 28,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary_500,
        marginTop: 4,
    },

    // Scan CTA
    scanCard: {
        backgroundColor: Colors.primary_800,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        shadowColor: Colors.primary_900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 6,
    },
    scanCardIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    scanCardTextWrap: {
        flex: 1,
    },
    scanCardTitle: {
        fontSize: 19,
        fontWeight: '700',
    },
    scanCardSub: {
        fontSize: 13,
        marginTop: 3,
    },
    scanCardArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Section
    section: {
        marginBottom: 24,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionHeaderRow: {
        minHeight: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    showAllButton: {
        height: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 12,
        paddingRight: 8,
        borderRadius: 16,
        backgroundColor: Colors.primary_100,
        marginBottom: 12,
    },
    showAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary_800,
    },

    // Scans card
    scansCard: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    scanItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 68,
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    scanItemBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: Colors.primary_200,
    },
    scanItemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minWidth: 0,
    },
    scanDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary_600,
        flexShrink: 0,
    },
    scanTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    scanDate: {
        fontSize: 15,
        fontWeight: '600',
    },
    scanTime: {
        fontSize: 12,
        opacity: 0.45,
        marginTop: 2,
    },
    scanItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
    },
    spotsBadge: {
        backgroundColor: Colors.primary_100,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        width: 92,
        alignItems: 'center',
    },
    spotsBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary_800,
    },
    spotsBadgeMuted: {
        backgroundColor: '#F1F5F9',
    },
    spotsBadgeMutedText: {
        color: '#64748B',
    },

    // Empty state
    emptyCard: {
        borderRadius: 16,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 6,
    },
    emptyText: {
        opacity: 0.45,
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 18,
    },

    // Tips
    tipsPager: {
        height: 110,
    },
    tipSlide: {
        flex: 1,
        paddingHorizontal: 2,
    },
    tipCard: {
        flex: 1,
        borderRadius: 16,
        padding: 18,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    tipIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    tipBody: {
        flex: 1,
    },
    tipTitle: {
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 4,
    },
    tipText: {
        opacity: 0.85,
        fontSize: 12,
        lineHeight: 17,
    },
    dotsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary_200,
    },
    activeDot: {
        width: 20,
        borderRadius: 3,
    },
});
