import { Colors } from '@/constants/Colors';
import { Tabs } from 'expo-router';
import { Home, Camera, Sparkles, Settings as SettingsIcon } from 'lucide-react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.primary_700,
                tabBarInactiveTintColor: Colors.primary_600,
                tabBarStyle: { paddingTop: 6, height: 86 },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Overview',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="acneType"
                options={{
                    title: 'Scan',
                    tabBarIcon: ({ color, size }) => <Camera size={size} color={color} />,
                    headerTransparent: true,
                    headerTitle: '',
                    headerTintColor: '#fff',
                    tabBarStyle: { backgroundColor: '#000', borderTopColor: '#222', paddingTop: 6, height: 86 },
                    tabBarActiveTintColor: '#fff',
                    tabBarInactiveTintColor: '#888',
                }}
            />
            <Tabs.Screen
                name="findProducts"
                options={{
                    title: 'Products',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => <Sparkles size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => <SettingsIcon size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
