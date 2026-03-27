import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { ArrowLeft, ScanFace, AlertCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { questionData } from '@/assets/questions';

type Results = {
    id: string,
    date: string,
    imageUri: string,
    detections: Detection[] | null
    apiStatus?: 'pending' | 'completed' | 'error'
    quizAnswers?: Record<string, string>
    imageSize?: {
        width: number,
        height: number
    }
}

type Detection = {
    box: {
        x: number,
        y: number,
        width: number,
        height: number
    },
    class: string,
    confidence: number
}

export default function DetectionDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [result, setResult] = useState<Results | null>(null);

    useEffect(() => {
        async function loadDetection() {
            if (!id) return;

            const rawDetection = await AsyncStorage.getItem(id);
            if (rawDetection) {
                const detection: Results = JSON.parse(rawDetection);
                setResult(detection);
            }
        }

        loadDetection();
    }, [id]);

    if (!result) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText style={styles.loadingText}>Loading...</ThemedText>
            </ThemedView>
        );
    }

    if (!result.detections) {
        return (
            <ThemedView style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                        <ThemedText style={styles.backText}>Back</ThemedText>
                    </TouchableOpacity>
                    <View style={styles.errorState}>
                        <AlertCircle size={40} color={Colors.error} />
                        <ThemedText style={styles.errorStateText}>
                            {result.apiStatus === 'error' ? 'Analysis failed. Please try again.' : 'Processing detections...'}
                        </ThemedText>
                    </View>
                </SafeAreaView>
            </ThemedView>
        );
    }

    // Group detections by acne type
    const detectionsByType = result.detections.reduce((acc, detection) => {
        const acneType = detection.class;
        if (!acc[acneType]) {
            acc[acneType] = [];
        }
        acc[acneType].push(detection);
        return acc;
    }, {} as Record<string, Detection[]>);

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                        <ThemedText style={styles.backText}>Back</ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={styles.title}>Scan Details</ThemedText>
                    <ThemedText style={styles.date}>
                        {new Date(result.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </ThemedText>

                    {result.imageUri && (
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: result.imageUri }}
                                style={styles.image}
                                resizeMode="contain"
                            />
                        </View>
                    )}

                    {/* Summary pill */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryPill}>
                            <ScanFace size={18} color={Colors.primary_800} />
                            <ThemedText style={styles.summaryText}>
                                {result.detections.length} spot{result.detections.length !== 1 ? 's' : ''} detected
                            </ThemedText>
                        </View>
                    </View>

                    {/* Breakdown by type */}
                    <ThemedText style={styles.sectionHeading}>Breakdown by Type</ThemedText>
                    {Object.entries(detectionsByType).map(([type, detections]) => (
                        <View key={type} style={styles.typeCard}>
                            <View style={styles.typeCardHeader}>
                                <ThemedText style={styles.typeName}>{type}</ThemedText>
                                <View style={styles.countBadge}>
                                    <ThemedText style={styles.countText}>{detections.length}</ThemedText>
                                </View>
                            </View>
                            <ThemedText style={styles.confidenceText}>
                                Avg. confidence: {(detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length * 100).toFixed(1)}%
                            </ThemedText>
                        </View>
                    ))}

                    {/* Recommendations */}
                    {result.quizAnswers && (
                        <>
                            <ThemedText style={[styles.sectionHeading, { marginTop: 8 }]}>Recommendations</ThemedText>
                            {Object.entries(result.quizAnswers).map(([questionId, answer]) => {
                                const question = questionData.find(q => q.id === parseInt(questionId));
                                const recommendation = question?.options[answer];

                                if (!recommendation || !question) return null;

                                return (
                                    <View key={questionId} style={styles.recCard}>
                                        <ThemedText style={styles.recCategory}>{question.category}</ThemedText>
                                        <ThemedText style={styles.recText}>{recommendation}</ThemedText>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    loadingText: {
        textAlign: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary_900,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        marginBottom: 4,
    },
    date: {
        fontSize: 13,
        opacity: 0.5,
        marginBottom: 20,
    },
    imageContainer: {
        width: '100%',
        height: 280,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: Colors.primary_100,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    summaryRow: {
        marginBottom: 24,
    },
    summaryPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        backgroundColor: Colors.primary_100,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    summaryText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary_900,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    typeCard: {
        backgroundColor: Colors.primary_100,
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        gap: 6,
    },
    typeCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    typeName: {
        fontSize: 15,
        fontWeight: '600',
    },
    countBadge: {
        backgroundColor: Colors.primary_800,
        paddingHorizontal: 12,
        paddingVertical: 3,
        borderRadius: 12,
    },
    countText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    confidenceText: {
        fontSize: 13,
        opacity: 0.55,
    },
    recCard: {
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary_600,
        paddingLeft: 14,
        paddingVertical: 8,
        marginBottom: 12,
    },
    recCategory: {
        fontSize: 12,
        fontWeight: '600',
        opacity: 0.55,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    recText: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 20,
    },
    errorState: {
        alignItems: 'center',
        paddingTop: 60,
        gap: 12,
    },
    errorStateText: {
        opacity: 0.6,
        textAlign: 'center',
    },
});
