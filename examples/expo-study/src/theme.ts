import { Platform, useColorScheme } from 'react-native';

export const serif = Platform.select({ ios: 'Georgia', android: 'serif' });
export function useStudyTheme() {
  return useColorScheme() === 'dark'
    ? { paper: '#181F1D', ink: '#F3EEE3', muted: '#B5C3BB', line: '#52655C', accent: '#A3DBC1', surface: '#26352E', onAccent: '#183C2E' }
    : { paper: '#F5F0E4', ink: '#203D30', muted: '#52685B', line: '#A6B7A9', accent: '#276749', surface: '#E7ECDD', onAccent: '#FFFFFF' };
}
export type StudyTheme = ReturnType<typeof useStudyTheme>;
