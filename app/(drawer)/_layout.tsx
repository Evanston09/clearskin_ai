import { Colors } from '@/constants/Colors';
import { Drawer } from 'expo-router/drawer';

export default function DrawerLayout() {
    return (
        <Drawer
            defaultStatus="open"
            screenOptions={{
                drawerActiveTintColor: Colors.primary_700,
                drawerInactiveTintColor: Colors.primary_100,
                drawerType: "slide",
            }}
        >
            <Drawer.Screen
                name="overview"
                options={{
                    drawerLabel: 'Overview',
                    title: 'Overview',
                }}
            />
            <Drawer.Screen
                name="acneType"
                options={{
                    drawerLabel: 'Analyze Acne Type',
                    title: 'Analyze Acne Type',
                }}
            />
            <Drawer.Screen
                name="causesOfAcne"
                options={{
                    drawerLabel: 'Causes of Acne',
                    title: 'Causes of Acne',
                }}
            />
            <Drawer.Screen
                name="fixRoutine"
                options={{
                    drawerLabel: 'Fix my Routine',
                    title: 'Fix my Routine',
                }}
            />
            <Drawer.Screen
                name="findProducts"
                options={{
                    drawerLabel: 'Find Acne Products',
                    title: 'Find Acne Produtcs',
                }}
            />
        </Drawer>
    );
}
