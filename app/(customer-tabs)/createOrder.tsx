import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { theme } from '../theme';

const SERVICES = [
  { id: '1', name: 'Wash & Fold', price: '₱45/kg', icon: 'washing-machine' },
  { id: '2', name: 'Ironing', price: '₱35/kg', icon: 'iron' },
  { id: '3', name: 'Dry Cleaning', price: '₱120/item', icon: 'tshirt-crew-outline' },
  { id: '4', name: 'Wash & Iron', price: '₱65/kg', icon: 'water-outline' },
];

export default function CreateOrderScreen() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('1');
  const [quantity, setQuantity] = useState('1');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [pickup, setPickup] = useState(true);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      style={styles.containerStyle}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>

        <View>
          <Text style={styles.subtitle}>LAUNDRY SERVICE</Text>
          <Text style={styles.title}>Create Order</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Choose a service</Text>

      <View style={styles.servicesContainer}>
        {SERVICES.map((service) => {
          const selected = selectedService === service.id;

          return (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selected && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedService(service.id)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.serviceIcon,
                  selected && styles.serviceIconSelected,
                ]}
              >
                <MaterialCommunityIcons
                  name={service.icon as any}
                  size={24}
                  color={
                    selected ? '#ffffff' : theme.color.secondary
                  }
                />
              </View>

              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.servicePrice}>{service.price}</Text>
              </View>

              <View
                style={[
                  styles.radio,
                  selected && styles.radioSelected,
                ]}
              >
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Order details</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Quantity</Text>

        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              setQuantity(String(Math.max(1, Number(quantity) - 1)))
            }
          >
            <Ionicons name="remove" size={20} color={theme.color.secondary} />
          </TouchableOpacity>

          <Text style={styles.quantityText}>{quantity}</Text>

          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() =>
              setQuantity(String(Number(quantity) + 1))
            }
          >
            <Ionicons name="add" size={20} color={theme.color.secondary} />
          </TouchableOpacity>

          <Text style={styles.quantityUnit}>kg</Text>
        </View>

        <Text style={styles.label}>Pickup / Delivery Address</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your address"
          placeholderTextColor="#94a3b8"
          value={address}
          onChangeText={setAddress}
        />

        <Text style={styles.label}>Additional Notes</Text>

        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Add special instructions"
          placeholderTextColor="#94a3b8"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <Text style={styles.sectionTitle}>Service option</Text>

      <View style={styles.optionContainer}>
        <TouchableOpacity
          style={[
            styles.optionButton,
            pickup && styles.optionButtonSelected,
          ]}
          onPress={() => setPickup(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="bicycle-outline"
            size={22}
            color={pickup ? '#ffffff' : theme.color.secondary}
          />
          <View style={styles.optionTextContainer}>
            <Text
              style={[
                styles.optionTitle,
                pickup && styles.optionTitleSelected,
              ]}
            >
              Pickup & Delivery
            </Text>
            <Text
              style={[
                styles.optionSubtitle,
                pickup && styles.optionSubtitleSelected,
              ]}
            >
              We collect and return your laundry
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            !pickup && styles.optionButtonSelected,
          ]}
          onPress={() => setPickup(false)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="storefront-outline"
            size={22}
            color={!pickup ? '#ffffff' : theme.color.secondary}
          />
          <View style={styles.optionTextContainer}>
            <Text
              style={[
                styles.optionTitle,
                !pickup && styles.optionTitleSelected,
              ]}
            >
              Store Drop-off
            </Text>
            <Text
              style={[
                styles.optionSubtitle,
                !pickup && styles.optionSubtitleSelected,
              ]}
            >
              Bring your laundry to our store
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Estimated total</Text>
          <Text style={styles.summaryPrice}>₱45</Text>
        </View>

        <Text style={styles.summaryNote}>
          Final price may change based on actual laundry weight.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        activeOpacity={0.85}
        onPress={() => router.replace('/(customer-tabs)/orderDetails')}
      >
        <Text style={styles.createButtonText}>Create Order</Text>
        <Ionicons name="arrow-forward" size={18} color="#ffffff" />
      </TouchableOpacity>
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  subtitle: {
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

  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0f172a',
    fontFamily: 'serif',
    marginBottom: 12,
    marginTop: 4,
  },

  servicesContainer: {
    gap: 10,
    marginBottom: 24,
  },

  serviceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  serviceCardSelected: {
    backgroundColor: '#ebf3fe',
    borderColor: '#c9dcfa',
  },

  serviceIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#f0f4fe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  serviceIconSelected: {
    backgroundColor: theme.color.secondary,
  },

  serviceInfo: {
    flex: 1,
    marginLeft: 14,
  },

  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },

  servicePrice: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 3,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  radioSelected: {
    borderColor: theme.color.secondary,
  },

  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.color.secondary,
  },

  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
  },

  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f0f4fe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  quantityText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginHorizontal: 18,
  },

  quantityUnit: {
    fontSize: 13,
    color: '#64748b',
    marginLeft: 10,
  },

  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 16,
  },

  notesInput: {
    height: 80,
    paddingTop: 14,
    textAlignVertical: 'top',
  },

  optionContainer: {
    gap: 10,
    marginBottom: 24,
  },

  optionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionButtonSelected: {
    backgroundColor: theme.color.secondary,
    borderColor: theme.color.secondary,
  },

  optionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },

  optionTitleSelected: {
    color: '#ffffff',
  },

  optionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },

  optionSubtitleSelected: {
    color: 'rgba(255,255,255,0.8)',
  },

  summaryCard: {
    backgroundColor: '#ebf3fe',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },

  summaryPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.color.secondary,
  },

  summaryNote: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 5,
  },

  createButton: {
    backgroundColor: theme.color.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  createButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
