
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from "react-native";
import { useEffect, useState, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { questionData } from '@/assets/questions'
import { CircleCheck, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { classifyImage, detectSpots, type ClassificationResult } from '@/services/skinAnalysis';

// TODO Actually test this error system
// Look at the image size thing
export default function Quiz() {
    const { imageUri, detectionId } = useLocalSearchParams();
    const [questionNumber, setQuestionNumber] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null)
    const [answers, setAnswer] = useState<Record<string, string>>({})
    const [apiStatus, setApiStatus] = useState<'pending' | 'completed' | 'error'>('pending')
    const [isWaitingForApi, setIsWaitingForApi] = useState(false)
    const [apiResults, setApiResults] = useState<(ClassificationResult & { detections?: any[]; counts?: Record<string, number>; detectorStatus?: 'completed' | 'unavailable'; detectorError?: string }) | null>(null)
    const hasSaved = useRef(false);

    const currentQuestion = questionData[questionNumber];
    const options = Object.keys(currentQuestion.options);
    const progress = (questionNumber + 1) / questionData.length;

    useEffect(() => {
        const abortController = new AbortController();

        async function runAnalysis() {
            if (!imageUri || !detectionId) {
                setApiStatus('error');
                return;
            }

            try {
                const [classification, detection] = await Promise.all([
                    classifyImage(imageUri as string, detectionId as string, abortController.signal),
                    detectSpots(imageUri as string, detectionId as string, abortController.signal),
                ]);

                if (!abortController.signal.aborted) {
                    setApiResults({
                        ...classification,
                        detections: detection.detections,
                        counts: detection.counts,
                        detectorStatus: detection.status,
                        detectorError: detection.error,
                    });
                    setApiStatus('completed');
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    setApiStatus('error');
                }
            }
        }

        runAnalysis();
        return () => abortController.abort();
    }, [imageUri, detectionId]);

    useEffect(() => {
        if (isWaitingForApi && apiStatus !== 'pending' && !hasSaved.current) {
            saveQuizResults(answers);
        }
    }, [apiStatus, isWaitingForApi, answers]);

    const nextQuestion = async function() {
        if (selectedAnswer === null) {
            setError("Please select an answer to continue");
            return;
        }

        const newAnswers = {
            ...answers,
            [currentQuestion.id]: Object.keys(currentQuestion.options)[selectedAnswer]
        };

        setAnswer(newAnswers);
        setError(null);
        setSelectedAnswer(null);

        if (questionNumber + 1 === questionData.length) {
            if (apiStatus === 'pending') {
                setIsWaitingForApi(true);
                return;
            }

            await saveQuizResults(newAnswers);
            return;
        }
        setQuestionNumber(questionNumber + 1)
    }

    const skipQuiz = async () => {
        setError(null);
        setAnswer({});

        if (apiStatus === 'pending') {
            setIsWaitingForApi(true);
            return;
        }

        await saveQuizResults({});
    }

    const saveQuizResults = async (finalAnswers: Record<string, string>) => {
        if (!imageUri || !detectionId || hasSaved.current) {
            return;
        }
        hasSaved.current = true;

        const detectionObject = {
            id: detectionId as string,
            date: new Date(),
            imageUri: imageUri as string,
            detections: apiResults?.detections ?? null,
            counts: apiResults?.counts ?? null,
            prediction: apiResults?.prediction ?? null,
            confidence: apiResults?.confidence ?? null,
            probabilities: apiResults?.probabilities ?? null,
            apiStatus: apiStatus,
            imageSize: apiResults?.imageSize,
            detectorStatus: apiResults?.detectorStatus ?? 'unavailable',
            detectorError: apiResults?.detectorError ?? null,
            classificationSource: apiResults?.source ?? 'unavailable',
            classificationError: apiResults?.error ?? null,
            quizAnswers: Object.keys(finalAnswers).length > 0 ? finalAnswers : null
        };

        const rawListIds = await AsyncStorage.getItem('detections');
        const existingIds: string[] = rawListIds ? JSON.parse(rawListIds) : [];
        const compactIds = [...existingIds.filter((id) => id !== detectionId), detectionId as string];

        await AsyncStorage.setItem(detectionId as string, JSON.stringify(detectionObject));
        await AsyncStorage.setItem('detections', JSON.stringify(compactIds));

        setIsWaitingForApi(false);
        router.push('/(tabs)');
    }

    if (isWaitingForApi) {
        if (apiStatus === 'error') {
            return (
                <ThemedView style={styles.fullScreenCenter}>
                    <AlertCircle size={56} color={Colors.error} />
                    <ThemedText style={styles.fullScreenTitle}>Analysis Failed</ThemedText>
                    <ThemedText style={styles.fullScreenSub}>
                        We could not analyze your image. Please try again.
                    </ThemedText>
                    <TouchableOpacity style={styles.actionButton} onPress={() => router.back()}>
                        <ThemedText style={styles.actionButtonText}>Go Back</ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            );
        }
        return (
            <ThemedView style={styles.fullScreenCenter}>
                <ActivityIndicator size="large" color={Colors.primary_700} />
                <ThemedText style={styles.fullScreenTitle}>Analyzing your skin...</ThemedText>
                <ThemedText style={styles.fullScreenSub}>This may take a few moments</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton} activeOpacity={0.75}>
                        <ArrowLeft size={20} color={Colors.primary_900} />
                    </TouchableOpacity>
                    <ThemedText style={styles.stepLabel}>
                        {questionNumber + 1} / {questionData.length}
                    </ThemedText>
                    <TouchableOpacity onPress={skipQuiz} style={styles.skipButton} activeOpacity={0.75}>
                        <ThemedText style={styles.skipText}>Skip</ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>


                {/* Question */}
                <ThemedText style={styles.questionText}>{currentQuestion.text}</ThemedText>

                {/* Options */}
                <View style={styles.optionsList}>
                    {options.map((option, index) => (
                        <TouchableOpacity
                            style={[styles.optionButton, selectedAnswer === index && styles.optionSelected]}
                            key={index}
                            onPress={() => setSelectedAnswer(index)}
                            activeOpacity={0.7}
                        >
                            <ThemedText style={[styles.optionText, selectedAnswer === index && styles.optionTextSelected]}>
                                {option}
                            </ThemedText>
                            {selectedAnswer === index && (
                                <CircleCheck size={20} color={Colors.primary_800} fill={Colors.primary_200} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {error && <ThemedText style={styles.errorText}>{error}</ThemedText>}

                <View style={styles.spacer} />

                <TouchableOpacity style={styles.nextButton} onPress={nextQuestion} activeOpacity={0.85}>
                    <ThemedText style={styles.nextButtonText}>
                        {questionNumber + 1 === questionData.length ? 'Finish' : 'Next'}
                    </ThemedText>
                    <ArrowRight size={18} color="#fff" />
                </TouchableOpacity>
            </SafeAreaView>
        </ThemedView>
    )

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        height: 40,
    },
    iconButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
    },
    stepLabel: {
        fontSize: 15,
        fontWeight: '700',
        opacity: 0.6,
    },
    skipButton: {
        width: 64,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: Colors.primary_100,
    },
    skipText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary_800,
    },
    progressTrack: {
        height: 4,
        backgroundColor: Colors.primary_200,
        borderRadius: 2,
        marginBottom: 24,
        overflow: 'hidden',
    },
    statusRow: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary_100,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        height: 28,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary_700,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary_700,
        borderRadius: 2,
    },
    questionText: {
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 30,
        marginBottom: 24,
    },
    optionsList: {
        gap: 10,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.primary_300,
        backgroundColor: 'transparent',
    },
    optionSelected: {
        borderColor: Colors.primary_700,
        backgroundColor: Colors.primary_100,
    },
    optionText: {
        fontSize: 15,
        fontWeight: '500',
        flex: 1,
    },
    optionTextSelected: {
        color: Colors.primary_900,
        fontWeight: '600',
    },
    errorText: {
        color: Colors.error,
        fontSize: 13,
        marginTop: 10,
    },
    spacer: {
        flexGrow: 1,
    },
    nextButton: {
        backgroundColor: Colors.primary_800,
        paddingVertical: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: Colors.primary_900,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    fullScreenCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12,
    },
    fullScreenTitle: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 8,
    },
    fullScreenSub: {
        fontSize: 14,
        opacity: 0.55,
        textAlign: 'center',
    },
    actionButton: {
        marginTop: 12,
        backgroundColor: Colors.primary_700,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});
