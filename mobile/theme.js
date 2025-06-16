import { DefaultTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  default: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '600' },
    light: { fontFamily: 'System', fontWeight: '300' },
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E88E5',
    accent: '#1E88E5',
    background: '#F2F2F2',
    surface: '#FFFFFF',
    text: '#1F1B10',
    error: '#BA1A1A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1F1B10',
  },
  fonts: configureFonts(fontConfig),
};
