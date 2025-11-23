import { Theme } from '../types';

// 5 theme presets with colors and sound packs
const THEMES: Theme[] = [
    {
        id: 'theme_classic',
        name: 'Cổ điển',
        thumbnailPath: '🎨',
        cost: 0, // Free default theme
        colors: {
            primary: '#0ea5e9', // sky-500
            secondary: '#38bdf8', // sky-400
            background: '#f0f9ff', // sky-50
            buttonPrimary: '#0ea5e9',
            buttonSecondary: '#e0f2fe',
            accent: '#fbbf24', // amber-400
        },
        soundPack: 'default',
    },
    {
        id: 'theme_ocean',
        name: 'Đại dương xanh',
        thumbnailPath: '🌊',
        cost: 100,
        colors: {
            primary: '#0891b2', // cyan-600
            secondary: '#06b6d4', // cyan-500
            background: '#ecfeff', // cyan-50
            buttonPrimary: '#0891b2',
            buttonSecondary: '#cffafe',
            accent: '#f59e0b', // amber-500
        },
        soundPack: 'ocean',
    },
    {
        id: 'theme_forest',
        name: 'Rừng xanh',
        thumbnailPath: '🌲',
        cost: 100,
        colors: {
            primary: '#059669', // emerald-600
            secondary: '#10b981', // emerald-500
            background: '#f0fdf4', // green-50
            buttonPrimary: '#059669',
            buttonSecondary: '#d1fae5',
            accent: '#f59e0b', // amber-500
        },
        soundPack: 'forest',
    },
    {
        id: 'theme_sunset',
        name: 'Hoàng hôn',
        thumbnailPath: '🌅',
        cost: 100,
        colors: {
            primary: '#ea580c', // orange-600
            secondary: '#f97316', // orange-500
            background: '#fff7ed', // orange-50
            buttonPrimary: '#ea580c',
            buttonSecondary: '#fed7aa',
            accent: '#fbbf24', // amber-400
        },
        soundPack: 'sunset',
    },
    {
        id: 'theme_galaxy',
        name: 'Vũ trụ tím',
        thumbnailPath: '🌌',
        cost: 100,
        colors: {
            primary: '#7c3aed', // violet-600
            secondary: '#8b5cf6', // violet-500
            background: '#faf5ff', // violet-50
            buttonPrimary: '#7c3aed',
            buttonSecondary: '#ede9fe',
            accent: '#fbbf24', // amber-400
        },
        soundPack: 'galaxy',
    },
];

export const getAllThemes = (): Theme[] => {
    return THEMES;
};

export const getThemeById = (id: string): Theme | undefined => {
    return THEMES.find(t => t.id === id);
};

export const getDefaultThemeId = (): string => {
    return 'theme_classic';
};

export const getAvailableThemes = (ownedIds: string[]): Theme[] => {
    return THEMES.filter(t => !ownedIds.includes(t.id));
};

export const applyTheme = (themeId: string): void => {
    const theme = getThemeById(themeId);
    if (!theme) return;

    const root = document.documentElement;
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-background', theme.colors.background);
    root.style.setProperty('--color-button-primary', theme.colors.buttonPrimary);
    root.style.setProperty('--color-button-secondary', theme.colors.buttonSecondary);
    root.style.setProperty('--color-accent', theme.colors.accent);

    // Store current theme in localStorage for persistence
    localStorage.setItem('current_theme', themeId);

    // TODO: Load different sound pack based on theme.soundPack
    // For now, we'll use the same sound manager
};

// Initialize theme on app load
export const initializeTheme = (): void => {
    const savedTheme = localStorage.getItem('current_theme');
    if (savedTheme) {
        applyTheme(savedTheme);
    } else {
        applyTheme(getDefaultThemeId());
    }
};
