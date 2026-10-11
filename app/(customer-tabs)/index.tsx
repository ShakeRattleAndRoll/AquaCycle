import OrderTracker from '@/components/customer/order-tracker';
import ServicesList from '@/components/customer/service-list';
import AppText from '@/components/ui/app-text';
import { greetings } from '@/logic/greetings';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../../constants/app-theme';
import { requireSupabase } from '../../utils/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const greet = greetings();

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(true);

  const shortUsername =
    username.length > 8 ? `${username.slice(0, 8)}...` : username;

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const loadCustomerProfile = async () => {
        setAvatarLoading(true);

        try {
          const client = requireSupabase();

          const {
            data: { user },
            error: userError,
          } = await client.auth.getUser();

          if (userError) throw userError;

          if (!user) {
            if (active) {
              setUsername('');
              setAvatarUrl(null);
              setAvatarLoading(false);
            }
            return;
          }

          const { data, error } = await client
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          if (error) throw error;

          if (!active) return;

          setUsername(
            data?.username?.trim() ||
              user.email?.split('@')[0] ||
              'there',
          );

          if (data?.avatar_url) {
            const { data: signedImage, error: imageError } =
              await client.storage
                .from('avatars')
                .createSignedUrl(data.avatar_url, 3600);

            if (!active) return;

            if (!imageError && signedImage?.signedUrl) {
              setAvatarUrl(signedImage.signedUrl);
            } else {
              setAvatarUrl(null);
            }
          } else {
            setAvatarUrl(null);
          }
        } catch (error) {
          if (active) {
            setAvatarUrl(null);
            console.warn('Unable to load home profile picture:', error);
          }
        } finally {
          if (active) {
            setAvatarLoading(false);
          }
        }
      };

      void loadCustomerProfile();

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.containerStyle}
    >
      <View style={styles.headerRow}>
        <View style={styles.greetingBlock}>
          <AppText style={styles.greetSubtitle}>{greet}</AppText>
          <AppText
            style={styles.greetTitle}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Welcome{shortUsername ? `, ${shortUsername}` : ''}!
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.7}
            onPress={() => router.replace('/(customer-tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            {avatarLoading ? (
              <ActivityIndicator color={theme.color.secondary} />
            ) : avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons
                name="person-circle-outline"
                size={50}
                color="#0f172a"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.leftColumn}>
          <View>
            <AppText style={styles.cardSubtitle}>Laundry day</AppText>
            <AppText style={styles.cardTitle}>
              We will handle the dirty work.
            </AppText>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/orders')}
            activeOpacity={0.85}
          >
            <AppText style={styles.buttonText}>Start an order</AppText>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.color.secondary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.sparkleBox}>
            <Entypo name="water" size={20} color="#ffffff" />
          </View>

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="washing-machine"
              size={56}
              color="#ffffff"
            />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <AppText style={styles.sectionTitle}>Choose a service</AppText>

        <TouchableOpacity
          onPress={() => router.push('/(customer-tabs)/services')}
          activeOpacity={0.7}
        >
          <AppText style={styles.seeAllText}>See all</AppText>
        </TouchableOpacity>
      </View>

      <View style={styles.servicesWrapper}>
        <ServicesList />
      </View>

      <OrderTracker />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },

  containerStyle: {
    ...theme.color.lightBackground,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  greetingBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
    overflow: 'hidden',
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },

  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#eaf2ff',
  },

  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },

  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#eaf2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  greetSubtitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },

  greetTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },

  cardContainer: {
    ...theme.color.primary,
    borderRadius: 24,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  leftColumn: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 12,
  },

  cardSubtitle: {
    color: '#e0f2fe',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },

  cardTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    fontFamily: 'serif',
  },

  button: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    gap: 6,
    marginTop: 14,
  },

  buttonText: {
    color: theme.color.secondary,
    fontWeight: '700',
    fontSize: 14,
  },

  rightColumn: {
    width: 90,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  sparkleBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    padding: 8,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },

  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    width: 80,
    height: 80,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: 'serif',
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.color.secondary,
  },

  servicesWrapper: {
    marginHorizontal: -10,
  },
});
