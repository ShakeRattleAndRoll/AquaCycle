import OrderTracker from '@/components/order-tracker';
import ServicesList from '@/components/service-list';
import { greetings } from '@/logic/greetings';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

export default function HomeScreen() {
  const router = useRouter();
  const greet = greetings();

  return (
    <ScrollView contentContainerStyle={styles.container} style={styles.containerStyle}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greetSubtitle}>{greet}</Text>
          <Text style={styles.greetTitle}>Welcome User!</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace('/(customer-tabs)/profile')}
        >
          <Ionicons name="person-circle-outline" size={50} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.leftColumn}>
          <View>
            <Text style={styles.cardSubtitle}>Laundry day</Text>
            <Text style={styles.cardTitle}>We'll handle the dirty work.</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => router.push('/(customer-tabs)/orderDetails')}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Start an order</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.color.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.sparkleBox}>
            <Entypo name="water" size={20} color="#ffffff" />
          </View>

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="washing-machine" size={56} color="#ffffff" />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose a service</Text>
        <TouchableOpacity onPress={() => router.replace('/(customer-tabs)/orderDetails')} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See all</Text>
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

  /* Header */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
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

  /* Banner Card */
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

  /* Services Header */
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