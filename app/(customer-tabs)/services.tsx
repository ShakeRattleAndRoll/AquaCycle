import AppText from '@/components/ui/app-text';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../constants/app-theme';

const SERVICES = [
  {
    id: '1',
    name: 'Wash & Fold',
    description: 'Professional washing and neatly folded clothes.',
    price: '₱45/kg',
    icon: 'washing-machine',
    library: 'MaterialCommunityIcons',
    bgColor: '#ebf3fe',
    iconColor: '#2162db',
  },
  {
    id: '2',
    name: 'Dry Cleaning',
    description: 'Special care for delicate and special garments.',
    price: '₱120/item',
    icon: 'dry-cleaning',
    library: 'MaterialIcons',
    bgColor: '#ebdfcf',
    iconColor: '#885e03',
  },
  {
    id: '3',
    name: 'Ironing',
    description: 'Neatly pressed clothes ready to wear.',
    price: '₱35 flat',
    icon: 'iron',
    library: 'MaterialCommunityIcons',
    bgColor: '#e6ccee',
    iconColor: '#9105a0',
  },
  {
    id: '4',
    name: 'Self Service',
    description: 'Wash your laundry using our self-service option.',
    price: '₱65/kg',
    icon: 'timer-outline',
    library: 'MaterialCommunityIcons',
    bgColor: '#d1f1c9',
    iconColor: '#279705',
  },
  {
    id: '5',
    name: 'Wash & Iron',
    description: 'Clean clothes professionally washed and ironed.',
    price: '₱65/kg',
    icon: 'tshirt-crew-outline',
    library: 'MaterialCommunityIcons',
    bgColor: '#dceafe',
    iconColor: '#2563eb',
  },
] as const;

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <AppText style={styles.title}>All Services</AppText>
          <AppText style={styles.subtitle}>
            Choose the laundry service you need.
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {SERVICES.map((service) => (
          <TouchableOpacity
            key={service.id}
            style={styles.serviceCard}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Choose ${service.name}, ${service.price}`}
            onPress={() =>
              router.push({
                pathname: '/orders',
                params: { service: service.name },
              })
            }
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: service.bgColor },
              ]}
            >
              {service.library === 'MaterialIcons' ? (
                <MaterialIcons
                  name={service.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                  size={27}
                  color={service.iconColor}
                />
              ) : (
                <MaterialCommunityIcons
                  name={service.icon as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
                  size={27}
                  color={service.iconColor}
                />
              )}
            </View>

            <View style={styles.serviceInfo}>
              <AppText style={styles.serviceName}>
                {service.name}
              </AppText>
              <AppText style={styles.description}>
                {service.description}
              </AppText>
              <AppText style={styles.price}>{service.price}</AppText>
            </View>

            <View style={styles.arrowCircle}>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#64748b"
              />
            </View>
          </TouchableOpacity>
        ))}

        <AppText style={styles.note}>
          Prices are estimates and may vary depending on the final laundry
          weight and service details.
        </AppText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eff6ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#12365a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
    gap: 12,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 14,
    gap: 13,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  description: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 17,
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.color.secondary,
    marginTop: 7,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 12,
  },
});
