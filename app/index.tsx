import { auth } from '@/firebaseConfig'
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function Index() {
    const [isNavigating, setIsNavigating] = useState(false);
    
    useEffect(() => {
        const subscriber = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsNavigating(true);
                router.replace('/(drawer)/overview');
            } else {
                setIsNavigating(true);
                router.replace('/login');
            }
        });
        
        return subscriber;
    }, []);

    return (
        <ThemedView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ThemedText>
                {isNavigating ? 'Redirecting...' : 'Checking authentication...'}
            </ThemedText>
        </ThemedView>
    );
}
