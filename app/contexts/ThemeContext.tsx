import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

export type ThemePref = 'light' | 'dark' | 'system';
type Scheme = 'light' | 'dark';

type ThemeContextValue = {
    pref: ThemePref;
    scheme: Scheme;
    setPref: (p: ThemePref) => void;
};

const STORAGE_KEY = 'theme_pref';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [pref, setPrefState] = useState<ThemePref>('system');
    const [systemScheme, setSystemScheme] = useState<Scheme>(
        (Appearance.getColorScheme() as Scheme) || 'light'
    );

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then((v) => {
            if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
        });
        const sub = Appearance.addChangeListener(({ colorScheme }) => {
            setSystemScheme((colorScheme as Scheme) || 'light');
        });
        return () => sub.remove();
    }, []);

    const setPref = (p: ThemePref) => {
        setPrefState(p);
        AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {});
    };

    const scheme: Scheme = pref === 'system' ? systemScheme : pref;

    return (
        <ThemeContext.Provider value={{ pref, scheme, setPref }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
