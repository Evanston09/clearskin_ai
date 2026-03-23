import { ThemedText } from '@/components/ThemedText';
import PagerView from 'react-native-pager-view';
import { TouchableOpacity, StyleSheet, View, ScrollView } from "react-native";
import { Colors } from '@/constants/Colors';
import { ThemedView } from '@/components/ThemedView';
import { ScanFace, Droplets, Sun, Clock, Zap } from 'lucide-react-native';
import { useRef, useEffect, useState, useCallback} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useSession } from '@/contexts/AuthContext';

type Results = {
    id: string, 
    date: string,
    detections: Detection[]
    quizAnswers?: Record<string, string>
}

type Detection = {
    box: { x: number, y: number, width: number, height: number },
    class: string,
    confidence: number
}

export default function Overview() {
    const pagerRef = useRef<PagerView | null>(null);
    const { user } = useSession();

    const [results, setResults] = useState<Results[] | null>(null);

    useFocusEffect(
        useCallback(() => {
            async function getRecentDetections() {
                try {
                    const rawDetectionList = await AsyncStorage.getItem('detections')
                    if (rawDetectionList === null) return;

                    const detectionList: string[] = JSON.parse(rawDetectionList);
                    const uniqueIds = [...new Set(detectionList)];

                    const detectionPromises = uniqueIds.map(async (id) => {
                        const rawDetection = await AsyncStorage.getItem(id)
                        if (!rawDetection) return []
                        const detection: Results = JSON.parse(rawDetection)
                        return detection
                    })

                    const detections = await Promise.all(detectionPromises);
                    const flatDetections = detections.flat();
                    const recentScans = flatDetections.slice(-3).reverse();
                    setResults(recentScans)
                } catch {
                    setResults([]);
                }
            }

            getRecentDetections()
        }, [])
    )
    const acneTips = [
        {
            id: 1,
            icon: Droplets,
            title: "Stay Hydrated",
            tip: "Drink 8+ glasses of water daily to keep skin hydrated and flush out toxins",
            color: "#4ECDC4"
        },
        {
            id: 2,
            icon: Sun,
            title: "Use Sunscreen",
            tip: "Apply SPF 30+ daily. Sun damage can worsen acne scars and dark spots",
            color: "#FFD93D"
        },
        {
            id: 3,
            icon: Clock,
            title: "Sleep Well",
            tip: "Get 7-9 hours of sleep. Poor sleep increases stress hormones that trigger breakouts",
            color: "#A8E6CF"
        },
        {
            id: 4,
            icon: Zap,
            title: "Gentle Cleansing",
            tip: "Wash face twice daily with a gentle cleanser. Over-washing can irritate skin",
            color: "#FF8B94"
        }
    ];

    const [currentPage, setCurrentPage] = useState(0);
    const totalPages = acneTips.length
    useEffect(() => {
        const interval = setInterval(() => {
            const nextPage = (currentPage + 1) % totalPages;
            if (pagerRef.current !== null) {
                pagerRef.current.setPage(nextPage);
            }
            setCurrentPage(nextPage);
        }, 3000); // Scrolls every 3 seconds

        return () => clearInterval(interval); // Clear interval on unmount
    }, [currentPage, totalPages]);


    return (
        <ThemedView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 40, paddingBottom: 32 }}>
            <View style={styles.upperSection}>
                <ThemedText type='title'>Welcome back {user?.displayName ?? 'there'}!</ThemedText>
                <ThemedText type='subtitle' style={styles.subtitleText}>
                    DermaSnap Is Here To Help!
                </ThemedText>
                
                <TouchableOpacity style={styles.scanButton} onPress={()=>router.push('/(drawer)/acneType')}>
                    <ScanFace size={96} color="#fff" />
                    <ThemedText style={styles.buttonText} lightColor="#fff" darkColor="#fff">
                        Scan Face
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <View style={styles.recentSection}>
                <ThemedText style={styles.sectionHeading}>Recent Scans</ThemedText>
                {results && results.length > 0 ? (
                    <View style={styles.scansList}>
                        {results.map((result) => (
                            <TouchableOpacity
                                key={result.id}
                                style={styles.scanItem}
                                onPress={() => router.push({ pathname: '/detectionDetails', params: { id: result.id } })}
                            >
                                <ThemedText type="defaultSemiBold">
                                    {new Date(result.date).toLocaleDateString()}
                                </ThemedText>
                                <ThemedText type="subtitle" style={styles.scanCount}>
                                    {result.detections ? `${result.detections.length} spot${result.detections.length !== 1 ? 's' : ''} detected` : 'Processing...'}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <ThemedText style={styles.emptyText}>
                        Ready for your first scan?
                    </ThemedText>
                )}
            </View>

            <View style={styles.recentSection}>
                <ThemedText style={styles.sectionHeading}>Acne Tips</ThemedText>
                <PagerView 
                    scrollEnabled={true}
                    ref={pagerRef}
                    style={styles.tipsPager} 
                    initialPage={0}
                >
                    {acneTips.map((tip) => {
                        const IconComponent = tip.icon;
                        return (
                            <View style={styles.tipCard} key={tip.id}>
                                <View style={[styles.tipIconContainer, { backgroundColor: tip.color }]}>
                                    <IconComponent size={32} color="white" />
                                </View>
                                <ThemedText style={styles.tipTitle}>{tip.title}</ThemedText>
                                <ThemedText style={styles.tipText}>{tip.tip}</ThemedText>
                            </View>
                        );
                    })}
                </PagerView>
            </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    tipsPager: {
        height: 180,
    },
    tipCard: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        alignItems: 'center',
    },
    tipIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipTitle: {
        fontWeight: '600',
        fontSize: 18,
        marginBottom: 4
    },
    tipText: {
        textAlign: 'center',
        opacity: .7
    },
    container: {
        flex: 1,
    },
    upperSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    subtitleText: {
        marginBottom: 24,
    },
    scanButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Colors.primary_700,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        marginTop: 8,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    recentSection: {
        marginBottom: 24
    },
    sectionHeading: {
        fontSize: 20,
        fontWeight: '600',
    },
    emptyText: {
        opacity: 0.7,
        fontWeight: '400',
        textAlign: 'center',
        marginTop: 8,
    },
    scansList: {
        marginTop: 8,
    },
    scanItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.primary_500,
    },
    scanCount: {
        fontSize: 14,
        marginTop: 4,
    },
});
