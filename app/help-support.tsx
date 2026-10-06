import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AppText from '@/components/ui/app-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/app-theme';

const HELP_ITEMS = [
  {
    title: 'Order status',
    text: 'Check the Orders tab to view the current status of your laundry.',
    icon: 'clock',
  },
  {
    title: 'Payment',
    text: 'AquaCycle records cash and GCash payments associated with your laundry order.',
    icon: 'credit-card',
  },
  {
    title: 'Laundry claim',
    text: 'When your laundry is ready, check your order information and follow the staff instructions for claiming it.',
    icon: 'package',
  },
  {
    title: 'Account',
    text: 'You can update your name and phone number through Personal Information.',
    icon: 'user',
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f0f0" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Feather
              name="arrow-left"
              size={20}
              color="#0f172a"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <AppText style={styles.eyebrow}>SUPPORT</AppText>

            <AppText style={styles.title}>
              Help & Support
            </AppText>

            <AppText style={styles.subtitle}>
              Get assistance with AquaCycle.
            </AppText>
          </View>
        </View>

        <View style={styles.card}>
          {HELP_ITEMS.map((item, index) => (
            <View key={item.title}>
              <View style={styles.helpRow}>
                <View style={styles.icon}>
                  <Feather
                    name={item.icon as any}
                    size={19}
                    color={theme.color.secondary}
                  />
                </View>

                <View style={styles.helpText}>
                  <AppText style={styles.helpTitle}>
                    {item.title}
                  </AppText>

                  <AppText style={styles.helpDescription}>
                    {item.text}
                  </AppText>
                </View>
              </View>

              {index < HELP_ITEMS.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.contactCard}>
          <Feather
            name="message-circle"
            size={22}
            color={theme.color.secondary}
          />

          <AppText style={styles.contactTitle}>
            Need more assistance?
          </AppText>

          <AppText style={styles.contactText}>
            Please approach or contact the AquaCycle laundry staff
            for assistance with your order, payment, or laundry
            concerns.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eaf1ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 17,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f0f4fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    flex: 1,
    marginLeft: 14,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  helpDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  contactCard: {
    backgroundColor: '#eaf1ff',
    borderRadius: 18,
    padding: 18,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
  },
  contactText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    marginTop: 5,
  },
});
