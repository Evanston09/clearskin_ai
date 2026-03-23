
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, ActivityIndicator, View, Alert } from "react-native";
import { useEffect, useState, useRef } from 'react';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { questionData } from '@/assets/questions'
import { Circle, CircleCheck, AlertCircle } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Detection } from './(drawer)/acneType';


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
    const [apiResults, setApiResults] = useState<{detections: Detection[], imageSize: {width: number, height: number}} | null>(null)
    const hasSaved = useRef(false);

    const currentQuestion = questionData[questionNumber];
    const options = Object.keys(currentQuestion.options);

    useEffect(() => {
        const abortController = new AbortController();

        async function callDetectionApi() {
            if (!imageUri || !detectionId) {
                setApiStatus('error');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('file', {
                    uri: imageUri as string,
                    type: 'image/jpeg',
                    name: `${detectionId}.jpg`,
                } as any);

                const csaiBaseUrl = process.env.EXPO_PUBLIC_CSAI_BASE_URL;
                if (!csaiBaseUrl) {
                    throw new Error('EXPO_PUBLIC_CSAI_BASE_URL is not set');
                }
                const response = await fetch(`${csaiBaseUrl}/detect`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }

                const result = await response.json();

                if (!abortController.signal.aborted) {
                    setApiResults({
                        detections: result.detections,
                        imageSize: result.image_size
                    });
                    setApiStatus('completed');
                }
            } catch (error: any) {
                if (error.name !== 'AbortError') {
                    setApiStatus('error');
                }
            }
        }

        callDetectionApi();
        return () => abortController.abort();
    }, [imageUri, detectionId]);

    useEffect(() => {
        if (isWaitingForApi && apiStatus !== 'pending' && !hasSaved.current) {
            hasSaved.current = true;
            saveQuizResults(answers);
        }
    }, [apiStatus, isWaitingForApi, answers]);

    const nextQuestion = async function() {
        if (selectedAnswer === null) {
            setError("No answer selected");
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
            // Check if API call is still pending
            if (apiStatus === 'pending') {
                setIsWaitingForApi(true);
                return; // Exit early, useEffect will handle saving
            }

            await saveQuizResults(newAnswers);
            return;
        }
        setQuestionNumber(questionNumber + 1)
    }

    const saveQuizResults = async (finalAnswers: Record<string, string>) => {
        if (!imageUri || !detectionId || hasSaved.current) {
            return;
        }
        hasSaved.current = true;

        // Create the complete detection object
        const detectionObject = {
            id: detectionId as string,
            date: new Date(),
            imageUri: imageUri as string,
            detections: apiResults?.detections || null,
            apiStatus: apiStatus,
            imageSize: apiResults?.imageSize,
            quizAnswers: finalAnswers
        };

        // Store detection ID in the list
        const rawListIds = await AsyncStorage.getItem('detections');

        if (rawListIds === null) {
            await AsyncStorage.setItem('detections', JSON.stringify([detectionId]))
        }
        else {
            let listIds: string[] = JSON.parse(rawListIds);
            listIds.push(detectionId as string)
            await AsyncStorage.setItem('detections', JSON.stringify(listIds))
        }

        // Save complete detection object
        await AsyncStorage.setItem(detectionId as string, JSON.stringify(detectionObject));

        setIsWaitingForApi(false);
        router.push('/(drawer)');
    }

    // Show full-screen loading when waiting for API on quiz completion
    if (isWaitingForApi) {
        if (apiStatus === 'error') {
            return (
                <ThemedView style={styles.loadingContainer}>
                    <AlertCircle size={64} color={Colors.error} />
                    <ThemedText style={styles.loadingMessage}>
                        Analysis Failed
                    </ThemedText>
                    <ThemedText style={styles.loadingSubtext}>
                        We couldn't analyze your image. Please try again.
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.errorButton}
                        onPress={() => router.back()}
                    >
                        <ThemedText type="defaultSemiBold" lightColor="#fff" darkColor="#fff">
                            Go Back
                        </ThemedText>
                    </TouchableOpacity>
                </ThemedView>
            );
        }
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary_600} />
                <ThemedText style={styles.loadingMessage}>
                    Analyzing your skin...
                </ThemedText>
                <ThemedText style={styles.loadingSubtext}>
                    This may take a few moments
                </ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container} >
        <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ThemedText style={styles.questionText}>← Back</ThemedText>
                        </TouchableOpacity>
                        <ThemedText style={styles.questionText}>
                            Question {questionNumber + 1} of {questionData.length}
                        </ThemedText>
                        {apiStatus === 'pending' && (
                            <View style={styles.loadingIndicator}>
                                <ActivityIndicator size="small" color={Colors.primary_600} />
                                <ThemedText style={styles.loadingText}>Processing...</ThemedText>
                            </View>
                        )}
                        {apiStatus === 'error' && (
                            <View style={styles.loadingIndicator}>
                                <AlertCircle size={16} color={Colors.error} />
                                <ThemedText style={[styles.loadingText, { color: Colors.error }]}>
                                    Analysis failed
                                </ThemedText>
                            </View>
                        )}
                    </View>
                    <ThemedText type="title">
                        {currentQuestion.text}
                    </ThemedText>
                </View>
                {options.map((option, index) => (
                    <TouchableOpacity
                        style={styles.optionButton}
                        key={index}
                        onPress={() => setSelectedAnswer(index)}
                    >
                        <ThemedText>
                            {option}
                        </ThemedText>
                        {selectedAnswer === index ? <CircleCheck fill={Colors.primary_900} />: <Circle color={Colors.primary_500}/>}
                    </TouchableOpacity>
                ))}

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <View style={styles.spacer}/>

            <TouchableOpacity onPress={nextQuestion}>
                    <ThemedText type="defaultSemiBold" style={styles.nextButton}>
                        Next
                    </ThemedText>
            </TouchableOpacity>
        </SafeAreaView>
        </ThemedView>
    )

}

const styles = StyleSheet.create({
    error: {
        color: Colors.error
    },
    container: {
        flex: 1,
        padding: 20
    },
    safeArea: {
        flex: 1
    },

    spacer: {
        flexGrow: 1
    },

    optionButton: {
        padding: 15,
        marginVertical: 8,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary_900,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    nextButton: {
        padding: 15,
        borderRadius: 12,
        backgroundColor: Colors.primary_900,
        textAlign: 'center'
    },

    selectedOption: {
        backgroundColor: Colors.primary_200
    },

    questionText: {
        color: Colors.primary_600,
    },
    header: {
        marginBottom: 16
    },
    backButton: {
        marginRight: 8,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    loadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    loadingText: {
        fontSize: 12,
        color: Colors.primary_600
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingMessage: {
        fontSize: 18,
        marginTop: 16,
        textAlign: 'center'
    },
    loadingSubtext: {
        fontSize: 14,
        marginTop: 8,
        color: Colors.primary_600,
        textAlign: 'center'
    },
    errorButton: {
        marginTop: 24,
        paddingVertical: 16,
        paddingHorizontal: 32,
        backgroundColor: Colors.primary_700,
        borderRadius: 12,
    }
});
