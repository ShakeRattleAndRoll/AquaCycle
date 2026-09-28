import Entypo from '@expo/vector-icons/Entypo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from './theme';

export default function SignUp() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.containerStyle}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.signupContainer}>
        <View style={styles.titleContainer}>
          <View style={styles.logo}>
            <Entypo name="drop" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join AquaCycle</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Juan Dela Cruz"
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>Username</Text>
          <TextInput
            placeholder="juandc"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            placeholder="09XXXXXXXXX"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            placeholder="Enter your address"
            style={styles.input}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            activeOpacity={0.7}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.loginText}>
              Already have an account? Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...theme.spacing.centerMainContainer,
    paddingVertical: 30,
  },
  containerStyle: {
    ...theme.color.lightBackground,
  },
  signupContainer: {
    ...theme.color.lightBox,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderRadius: 12,
    elevation: 2,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    ...theme.spacing.trueCenter,
    ...theme.color.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    height: 45,
    paddingHorizontal: 12,
    ...theme.color.lightBackground,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  createButton: {
    ...theme.color.primary,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    marginTop: 20,
  },
  buttonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 13,
    color: '#475569',
  },
});
