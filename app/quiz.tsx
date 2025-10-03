
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, StyleSheet, TextInput, Alert, Dimensions, View } from "react-native";
import { auth } from '@/firebaseConfig'
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { questionData }from '@/assets/questions'
import { Circle, CircleCheck } from 'lucide-react-native';
import { router } from 'expo-router';

export default function Quiz() {
    let [questionNumber, setQuestionNumber] = useState(0);
    let [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    let [error, setError] = useState<string | null>(null)
    let [answers, setAnswer] = useState<Record<string, string>>({})

    
    const currentQuestion = questionData[questionNumber];
    const options = Object.keys(currentQuestion.options);

    const nextQuestion = async function() {
        console.log(selectedAnswer)
        if (!selectedAnswer) {
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
            await AsyncStorage.setItem('quiz-answers', JSON.stringify(newAnswers));
            router.back();
            return;
        }
        setQuestionNumber(questionNumber + 1)
    }

    return (
        <ThemedView style={styles.container} >
        <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
            <ThemedText style={styles.questionText}>
                Question {questionNumber + 1} of {questionData.length}
            </ThemedText>
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

            <TouchableOpacity>
                    <ThemedText onPress={nextQuestion} type="defaultSemiBold" style={styles.nextButton}>
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
}
});
