import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#ff8c1a',
    secondary: '#ff8c1a',
    background: '#0d0f14',
  },
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#ff8c1a',
    secondary: '#ff8c1a',
  },
};

export type AppTheme = typeof darkTheme;
