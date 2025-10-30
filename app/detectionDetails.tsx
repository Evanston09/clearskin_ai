import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { ArrowLeft } from 'lucide-react-native';
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

// Helper function to get color for each acne type
function getColorForAcneType(acneType: string): string {
    const colors: Record<string, string> = {
        'Blackhead': '#FFD700',  // Gold
        'Whitehead': '#00CED1',  // Dark Turquoise
        'Papule': '#FF6347',     // Tomato
        'Pustule': '#FF4500',    // Orange Red
        'Nodule': '#DC143C',     // Crimson
        'Cyst': '#8B0000',       // Dark Red
    };
    return colors[acneType] || '#00FF00'; // Default to green if type unknown
}

export default function DetectionDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [result, setResult] = useState<Results | null>(null);

    useEffect(() => {
        async function loadDetection() {
            if (!id) return;

            const rawDetection = await AsyncStorage.getItem(id);
            console.log(rawDetection)
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
                <ThemedText>Loading...</ThemedText>
            </ThemedView>
        );
    }

    if (!result.detections) {
        return (
            <ThemedView style={styles.container}>
                <ThemedText>Processing detections...</ThemedText>
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
            <SafeAreaView>
            <ScrollView style={styles.scrollContainer}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={Colors.primary_900} />
                    <ThemedText type="defaultSemiBold" style={styles.backText}>Back</ThemedText>
                </TouchableOpacity>

                <ThemedText type="title" style={styles.title}>Scan Details</ThemedText>

                <ThemedText type="subtitle" style={styles.date}>
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

                <View style={styles.card}>
                    <ThemedText type="subtitle">Summary</ThemedText>
                    <ThemedText type="defaultSemiBold">
                        {result.detections.length} total spot{result.detections.length !== 1 ? 's' : ''} detected
                    </ThemedText>
                </View>

                <View style={styles.detectionsByType}>
                    <ThemedText type="subtitle" style={styles.sectionTitle}>
                        Breakdown by Type
                    </ThemedText>
                    {Object.entries(detectionsByType).map(([type, detections]) => (
                        <View key={type} style={styles.card}>
                            <View style={styles.typeHeader}>
                                <ThemedText type="defaultSemiBold">
                                    {type}
                                </ThemedText>
                                <View style={styles.countBadge}>
                                    <ThemedText type="subtitle" style={styles.countText}>
                                        {detections.length}
                                    </ThemedText>
                                </View>
                            </View>
                            <ThemedText>
                                Avg. confidence: {(detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length * 100).toFixed(1)}%
                            </ThemedText>
                        </View>
                    ))}
                </View>

                {result.quizAnswers && (
                    <View style={styles.quizSection}>
                        <ThemedText type="subtitle" style={styles.sectionTitle}>
                            Recommendations
                        </ThemedText>
                        {Object.entries(result.quizAnswers).map(([questionId, answer]) => {
                            const question = questionData.find(q => q.id === parseInt(questionId));
                            const recommendation = question?.options[answer];

                            if (!recommendation) return null;

                            return (
                                <View key={questionId} style={styles.card}>
                                    <ThemedText type="subtitle">{question.category}</ThemedText>
                                    <ThemedText type="defaultSemiBold">{recommendation}</ThemedText>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
            </SafeAreaView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingVertical: 16,
    },
    scrollContainer: {
        paddingHorizontal: 20
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    backText: {
        marginLeft: 8,
        color: Colors.primary_900,
    },
    title: {
        marginBottom: 8,
    },
    date: {
        marginBottom: 16,
    },
    imageContainer: {
        width: '100%',
        height: 300,
        marginBottom: 24,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    sectionTitle: {
        marginBottom: 12,
    },
    detectionsByType: {
        marginBottom: 24,
    },
    card: {
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.primary_500,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    typeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    countBadge: {
        backgroundColor: Colors.primary_900,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        color: 'white',
        fontSize: 14
    },
    quizSection: {
        marginBottom: 24,
    },
    quizItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.primary_500,
        gap: 4,
    },
});
