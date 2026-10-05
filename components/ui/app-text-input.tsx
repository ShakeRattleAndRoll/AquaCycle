import React, { forwardRef } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

const AppTextInput = forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => (
  <TextInput {...props} ref={ref} style={[style, { fontFamily: 'Roboto_400Regular' }]} />
));

AppTextInput.displayName = 'AppTextInput';

export default AppTextInput;
