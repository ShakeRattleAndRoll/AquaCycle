import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { theme } from './theme';

export default function Login() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.containerStyle}>
      <View style={styles.loginContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.logo}><Entypo name="drop" size={24} color="#ffffff" /></View>
          <Text style={styles.title}>AquaCycle</Text>
        </View>
        
        <View style={styles.credentialContainer}>
          <Text>Usename:</Text>
          <TextInput 
            placeholder='Juan Dela Cruz' 
            style={styles.credentialInput} 
            value={username} 
            onChangeText={setUsername}/>
        </View>

        <View style={styles.credentialContainer}>
          <Text>Password:</Text>
          <TextInput 
            placeholder='******' 
            style={styles.credentialInput} 
            value={password} 
            secureTextEntry={true}
            onChangeText={setPassword} />
        </View>

        <View style={styles.credentialContainer}>
          <TouchableOpacity onPress={() => router.replace('/(customer-tabs)')} style={[styles.loginButton]} activeOpacity={0.55}>
            <Text style={styles.buttonText}>Login as customer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(staff-tabs)/staffHome')} style={[styles.loginButton]} activeOpacity={0.55}>
            <Text style={styles.buttonText}>Login as staff</Text>
          </TouchableOpacity>
        </View>
        
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.spacing.centerMainContainer,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },
  loginContainer: {
    ...theme.color.lightBox,
    ...theme.spacing.trueCenter,
    padding: 10,
    width: '100%',
    maxWidth: 300,
    height: '100%',
    maxHeight: 420,
    borderRadius: 2,
    elevation: 2,
  },

  titleContainer: {
    ...theme.spacing.trueCenter,
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  logo: {
    ...theme.spacing.trueCenter,
    ...theme.color.primary,
    width: 50, 
    height: 50, 
    borderRadius: 80, 
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  credentialContainer: {
    padding: 5,
    marginBottom: 6,
    width: '100%',
  },
  credentialInput: {
    height: 45,
    padding: 12,
    ...theme.color.lightBackground,
    borderRadius: 2,
  },

  loginButton: {
    marginBottom: 5,
    ...theme.color.primary,
    alignItems: 'center',
    padding: 15,
    borderRadius: 2,
  },
  buttonText: { 
    fontSize: 14, 
    color: '#ffffff', 
    fontWeight: 'bold' 
  },



});
