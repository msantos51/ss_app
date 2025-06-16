import { DefaultTheme, configureFonts } from 'react-native-paper';

const fontConfig = {
  default: {
    regular: { fontFamily: 'Roboto', fontWeight: '400' },
    medium: { fontFamily: 'Roboto', fontWeight: '600' },
    light: { fontFamily: 'Roboto', fontWeight: '300' },
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3E87D1',
    accent: '#3E87D1',
    background: '#FBBD09',
    surface: '#FFFFFF',
    text: '#1F1B10',
    error: '#BA1A1A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onSurface: '#1F1B10',
  },
  fonts: configureFonts(fontConfig),
};
