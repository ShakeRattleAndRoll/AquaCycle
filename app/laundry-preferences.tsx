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
import AppTextInput from '@/components/ui/app-text-input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/app-theme';
import { requireSupabase } from '../utils/supabase';

export default function LaundryPreferencesScreen() {
  const router = useRouter();

  const [service, setService] = useState('Wash & Fold');
  const [folding, setFolding] = useState('Fold clothes');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
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
          .select(
            'laundry_service_preference, folding_preference, laundry_special_instructions',
          )
          .eq('id', user.id)
          .single();

        if (error) throw error;

        setService(
          data?.laundry_service_preference ||
            'Wash & Fold',
        );

        setFolding(
          data?.folding_preference ||
            'Fold clothes',
        );

        setNotes(
          data?.laundry_special_instructions ||
            '',
        );
      } catch (error) {
        Alert.alert(
          'Unable to load preferences',
          error instanceof Error
            ? error.message
            : 'Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPreferences();
  }, []);

  const savePreferences = async () => {
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

      const { error } = await client
        .from('profiles')
        .update({
          laundry_service_preference: service,
          folding_preference: folding,
          laundry_special_instructions: notes.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert(
        'Preferences Saved',
        'Your laundry preferences have been saved successfully.',
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
          : 'Unable to save your laundry preferences.',
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
            <AppText style={styles.eyebrow}>
              ACCOUNT
            </AppText>

            <AppText style={styles.title}>
              Laundry Preferences
            </AppText>

            <AppText style={styles.subtitle}>
              Set your preferred laundry options.
            </AppText>
          </View>
        </View>

        <View style={styles.card}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={theme.color.secondary}
              style={styles.loader}
            />
          ) : (
            <>
              <AppText style={styles.label}>
                Preferred service
              </AppText>

              {[
                'Wash & Fold',
                'Wash Only',
                'Dry Only',
                'Ironing',
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.choice}
                  onPress={() => setService(item)}
                  activeOpacity={0.7}
                >
                  <AppText style={styles.choiceText}>
                    {item}
                  </AppText>

                  <View
                    style={[
                      styles.radio,
                      service === item &&
                        styles.radioSelected,
                    ]}
                  >
                    {service === item && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              <AppText style={styles.label}>
                Folding preference
              </AppText>

              {[
                'Fold clothes',
                'Do not fold',
              ].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={styles.choice}
                  onPress={() => setFolding(item)}
                  activeOpacity={0.7}
                >
                  <AppText style={styles.choiceText}>
                    {item}
                  </AppText>

                  <View
                    style={[
                      styles.radio,
                      folding === item &&
                        styles.radioSelected,
                    ]}
                  >
                    {folding === item && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              <AppText style={styles.label}>
                Special instructions
              </AppText>

              <AppTextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Example: Please separate white clothes."
                style={styles.input}
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={() => void savePreferences()}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <AppText style={styles.saveButtonText}>
                    Save preferences
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
            These preferences help AquaCycle staff understand your
            preferred laundry handling instructions.
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
    padding: 18,
  },
  loader: {
    marginVertical: 35,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 5,
  },
  choice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceText: {
    fontSize: 14,
    color: '#334155',
  },
  radio: {
    width: 21,
    height: 21,
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
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: theme.color.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 17,
  },
  input: {
    minHeight: 90,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 12,
    padding: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4f83df',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
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
