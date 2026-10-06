import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AppText from '@/components/ui/app-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/app-theme';
import { requireSupabase } from '../utils/supabase';

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const [selected, setSelected] = useState<'Cash' | 'GCash'>('Cash');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPaymentPreference = async () => {
      try {
        const client = requireSupabase();

        const {
          data: { user },
          error: userError,
        } = await client.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          throw new Error('You are not signed in.');
        }

        const { data, error } = await client
          .from('profiles')
          .select('preferred_payment_method')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setSelected(
          data?.preferred_payment_method === 'gcash'
            ? 'GCash'
            : 'Cash',
        );
      } catch (error) {
        Alert.alert(
          'Unable to load payment method',
          error instanceof Error
            ? error.message
            : 'Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPaymentPreference();
  }, []);

  const savePaymentMethod = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const client = requireSupabase();

      const {
        data: { user },
        error: userError,
      } = await client.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('You are not signed in.');
      }

      const paymentValue =
        selected === 'GCash' ? 'gcash' : 'cash';

      const { error } = await client
        .from('profiles')
        .update({
          preferred_payment_method: paymentValue,
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert(
        'Payment Method Saved',
        `${selected} is now your preferred payment method.`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Save Failed',
        error instanceof Error
          ? error.message
          : 'Unable to save your payment method.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f0f0f0"
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather
              name="arrow-left"
              size={20}
              color="#0f172a"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <AppText style={styles.eyebrow}>ACCOUNT</AppText>

            <AppText style={styles.title}>
              Payment Methods
            </AppText>

            <AppText style={styles.subtitle}>
              Choose your preferred payment method.
            </AppText>
          </View>
        </View>

        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>
            Preferred payment method
          </AppText>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={theme.color.secondary}
              style={styles.loader}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.option}
                onPress={() => setSelected('Cash')}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.icon}>
                    <Feather
                      name="dollar-sign"
                      size={20}
                      color={theme.color.secondary}
                    />
                  </View>

                  <View>
                    <AppText style={styles.optionTitle}>
                      Cash
                    </AppText>

                    <AppText style={styles.optionSubtitle}>
                      Pay directly at the laundry shop.
                    </AppText>
                  </View>
                </View>

                <View
                  style={[
                    styles.radio,
                    selected === 'Cash' &&
                      styles.radioSelected,
                  ]}
                >
                  {selected === 'Cash' && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.option}
                onPress={() => setSelected('GCash')}
                activeOpacity={0.7}
              >
                <View style={styles.optionLeft}>
                  <View style={styles.icon}>
                    <Feather
                      name="smartphone"
                      size={20}
                      color={theme.color.secondary}
                    />
                  </View>

                  <View>
                    <AppText style={styles.optionTitle}>
                      GCash
                    </AppText>

                    <AppText style={styles.optionSubtitle}>
                      Record your GCash payment with AquaCycle staff.
                    </AppText>
                  </View>
                </View>

                <View
                  style={[
                    styles.radio,
                    selected === 'GCash' &&
                      styles.radioSelected,
                  ]}
                >
                  {selected === 'GCash' && (
                    <View style={styles.radioDot} />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={() => void savePaymentMethod()}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <AppText style={styles.saveButtonText}>
                    Save Payment Method
                  </AppText>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.note}>
          <Feather
            name="info"
            size={16}
            color={theme.color.secondary}
          />

          <AppText style={styles.noteText}>
            AquaCycle records cash and GCash transactions. Online
            GCash processing is not handled directly by the system.
          </AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...theme.color.lightBackground,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#64748b',
    fontWeight: '800',
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 3,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 3,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    paddingVertical: 18,
  },
  loader: {
    marginVertical: 30,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 17,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#f0f4fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
    maxWidth: 450,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.color.secondary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.color.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  saveButton: {
    backgroundColor: '#4f83df',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 18,
    minHeight: 50,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#eaf1ff',
    borderRadius: 12,
    padding: 13,
    marginTop: 16,
  },
  noteText: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    lineHeight: 17,
  },
});
