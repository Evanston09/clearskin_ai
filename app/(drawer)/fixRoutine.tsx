import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, TextInput, Alert, Dimensions, View, ScrollView } from "react-native";
import { auth } from '@/firebaseConfig'
import { useCallback, useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { useThemeColor } from '@/hooks/useThemeColor';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { questionData } from '@/assets/questions'

export default function FixRoutine() {
    const [quizResults, setQuizResults] = useState<Record<string, string> | null>(null);
    const cardBackgroundColor = useThemeColor({}, 'background');
    
    const getQuizData = useCallback(async () => {
        const value = await AsyncStorage.getItem('quiz-answers');
        if (value === null) {
            setQuizResults(null);
            return;
        }
        const parsed: Record<string, string> = JSON.parse(value);
        const feedback: Record<string, string> = {}
        Object.entries(parsed).forEach(([key, value]) => {
            const question = questionData.find(item => item.id === Number(key));
            if (!question?.options) {
                return
            }
            const answer = question.options[value]
            feedback[question.category] = answer;
        });
        
        console.log(feedback);
        setQuizResults(feedback);
    }, []);

    useFocusEffect(
        useCallback(() => {
            getQuizData();
        }, [getQuizData])
    );

    const handleTakeQuiz = () => {
        router.push('/quiz');
    };

    return (
        <ThemedView style={styles.container}>
            {quizResults ? (
                <ScrollView style={styles.resultsContainer}>
                    {Object.entries(quizResults).map(([category, feedback], index) => (
                        <View key={category} style={styles.resultCard}>
                            <ThemedText type="title" style={styles.categoryTitle}>
                                {category}
                            </ThemedText>
                            <ThemedText type="subtitle" style={styles.categoryContent}>
                                {feedback}
                            </ThemedText>
                        </View>
                    ))}
                    <View style={styles.bottomSpacing} />
                </ScrollView>
            ) : (
                <View style={styles.noQuizContainer}>
                    <ThemedText type="title" style={styles.title}>
                        Take Your Quiz
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.subtitle}> 
                        Complete our quick quiz to get personalized routine recommendations
                    </ThemedText>
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={handleTakeQuiz}
                    >
                        <ThemedText type="defaultSemiBold">
                            Start Quiz
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    resultsContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    resultCard: {
        borderRadius: 12,
        padding: 16,
    },
    categoryTitle: {
        fontSize: 24
    },
    categoryContent: {
        fontSize: 16
    },
    bottomSpacing: {
        height: 20,
    },

    noQuizContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    title: {
        textAlign: 'center',
        marginBottom: 16,
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
    },
    button: {
        backgroundColor: Colors.primary_900,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
    },
});
