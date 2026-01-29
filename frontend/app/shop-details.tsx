import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatDistance } from '../utils/formatDistance';
import { useLocationStore } from '../store/locationStore';

interface Shop {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
  price: number;
  savings: number;
  address: string;
}

export default function ShopDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { location } = useLocationStore();
  const isUserFlow = params.source === 'user' || params.from === 'user';
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  const shop: Shop = JSON.parse(params.shopData as string);

  const handlePayNow = () => {
    if (isUserFlow) {
      setShowRegistrationModal(true);
      return;
    }
    router.push({
      pathname: '/payment',
      params: {
        shopId: shop.id,
        amount: shop.price,
        savings: shop.savings,
        type: 'shop',
      },
    });
  };

  const handleOpenInMaps = () => {
    if (isUserFlow) {
      setShowRegistrationModal(true);
      return;
    }
    if (location) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${location.latitude},${location.longitude}&destination=${shop.lat},${shop.lng}`;
      Linking.openURL(url);
    }
  };

  const handleUserTap = () => {
    if (isUserFlow) {
      setShowRegistrationModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shop Details</Text>
        <View style={styles.placeholder} />
      </View>

      {isUserFlow ? (
        <Pressable style={styles.userFlowPressable} onPress={handleUserTap}>
          <ScrollView>
            {/* Shop Header */}
            <View style={styles.shopHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="storefront" size={48} color="#FF6600" />
              </View>
              <View style={styles.nameSection}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{shop.category}</Text>
                </View>
              </View>
            </View>

            {/* Shop Information */}
            <View style={styles.infoContainer}>
              <View style={styles.detailsSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="location" size={20} color="#666666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Distance</Text>
                    <Text style={styles.detailValue}>
                      {formatDistance(shop.distance)} away
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="home" size={20} color="#666666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{shop.address}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="cash" size={20} color="#666666" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Avg. Price</Text>
                    <Text style={styles.detailValue}>₹{shop.price}</Text>
                  </View>
                </View>
              </View>

              {/* Navigation Button */}
              <TouchableOpacity style={styles.navigationButton} onPress={handleOpenInMaps}>
                <Ionicons name="navigate" size={24} color="#FFFFFF" />
                <Text style={styles.navigationText}>Open in Google Maps</Text>
              </TouchableOpacity>

              {/* Savings Card */}
              <View style={styles.savingsCard}>
                <View style={styles.savingsHeader}>
                  <Ionicons name="pricetag" size={32} color="#4CAF50" />
                  <View style={styles.savingsContent}>
                    <Text style={styles.savingsTitle}>Merchant Savings</Text>
                    <Text style={styles.savingsAmount}>₹{shop.savings}</Text>
                  </View>
                </View>
                <Text style={styles.savingsDescription}>
                  Save ₹{shop.savings} on your purchases at this merchant. This is an exclusive IntownLocal offer!
                </Text>
              </View>

              {/* Features */}
              <View style={styles.featuresSection}>
                <Text style={styles.sectionTitle}>Why Shop Here?</Text>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Verified IntownLocal partner</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Instant savings on payment</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.featureText}>Easy and secure transactions</Text>
                </View>
              </View>

              {/* Pay Now Button */}
              <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
                <Ionicons name="card" size={24} color="#FFFFFF" />
                <Text style={styles.payButtonText}>Pay Now & Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      ) : (
        <ScrollView>
          {/* Shop Header */}
          <View style={styles.shopHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="storefront" size={48} color="#FF6600" />
            </View>
            <View style={styles.nameSection}>
              <Text style={styles.shopName}>{shop.name}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{shop.category}</Text>
              </View>
            </View>
          </View>

          {/* Shop Information */}
          <View style={styles.infoContainer}>
            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Ionicons name="location" size={20} color="#666666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Distance</Text>
                  <Text style={styles.detailValue}>
                    {formatDistance(shop.distance)} away
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="home" size={20} color="#666666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{shop.address}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons name="cash" size={20} color="#666666" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Avg. Price</Text>
                  <Text style={styles.detailValue}>₹{shop.price}</Text>
                </View>
              </View>
            </View>

            {/* Navigation Button */}
            <TouchableOpacity style={styles.navigationButton} onPress={handleOpenInMaps}>
              <Ionicons name="navigate" size={24} color="#FFFFFF" />
              <Text style={styles.navigationText}>Open in Google Maps</Text>
            </TouchableOpacity>

            {/* Savings Card */}
            <View style={styles.savingsCard}>
              <View style={styles.savingsHeader}>
                <Ionicons name="pricetag" size={32} color="#4CAF50" />
                <View style={styles.savingsContent}>
                  <Text style={styles.savingsTitle}>Merchant Savings</Text>
                  <Text style={styles.savingsAmount}>₹{shop.savings}</Text>
                </View>
              </View>
              <Text style={styles.savingsDescription}>
                Save ₹{shop.savings} on your purchases at this merchant. This is an exclusive IntownLocal offer!
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Why Shop Here?</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Verified IntownLocal partner</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Instant savings on payment</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>Easy and secure transactions</Text>
              </View>
            </View>

            {/* Pay Now Button */}
            <TouchableOpacity style={styles.payButton} onPress={handlePayNow}>
              <Ionicons name="card" size={24} color="#FFFFFF" />
              <Text style={styles.payButtonText}>Pay Now & Save</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showRegistrationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRegistrationModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Registration Type</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRegistrationModal(false);
                router.push('/register-member');
              }}
            >
              <Ionicons name="person" size={24} color="#FF6600" />
              <Text style={styles.modalButtonText}>Register as Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowRegistrationModal(false);
                router.push('/register-merchant');
              }}
            >
              <Ionicons name="storefront" size={24} color="#FF6600" />
              <Text style={styles.modalButtonText}>Register as Merchant</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowRegistrationModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 40,
  },
  shopHeader: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nameSection: {
    alignItems: 'center',
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  categoryBadge: {
    backgroundColor: '#FF6600',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  userFlowPressable: { flex: 1 },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  navigationButton: {
    flexDirection: 'row',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  navigationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  savingsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  savingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  savingsContent: {
    marginLeft: 12,
  },
  savingsTitle: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  savingsAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  savingsDescription: {
    fontSize: 14,
    color: '#2E7D32',
    lineHeight: 20,
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
  },
  payButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
    modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6600',
    marginLeft: 12,
  },
  modalCancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666666',
  },
});