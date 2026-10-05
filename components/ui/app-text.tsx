import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

export default function AppText({ style, ...props }: TextProps) {
  const resolvedStyle = StyleSheet.flatten(style);
  const fontSize = typeof resolvedStyle?.fontSize === 'number' ? resolvedStyle.fontSize : 14;
  const weight = resolvedStyle?.fontWeight;
  const fontFamily = fontSize >= 20
    ? 'Montserrat_700Bold'
    : weight === '500'
      ? 'Roboto_500Medium'
      : weight === '600' || weight === '700' || weight === '800' || weight === '900' || weight === 'bold'
        ? 'Roboto_700Bold'
        : 'Roboto_400Regular';

  return <Text {...props} style={[style, { fontFamily }]} />;
}
