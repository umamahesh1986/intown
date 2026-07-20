import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Dimensions,
   Modal,
} from 'react-native';





import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { getPlans, getCategories, getShops } from '../utils/api';
import { FontStylesWithFallback } from '../utils/fonts';
import Footer from '@/components/Footer';

interface Plan {
  id: string;
  name: string;
  pricePerMonth: number;
  benefits: string[];
  savings: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}


const { width, height } = Dimensions.get("window");



export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { location } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);


 const [visible, setVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);



  const images = [
    require("../assets/images/intown1.jpeg"),
    require("../assets/images/intown2.jpeg"),
    require("../assets/images/intown3.jpeg"),
  ];



 
  useEffect(() => {

    setVisible(true);

  }, []);




  
  useEffect(() => {

    const timer = setInterval(() => {

      setCurrentImage((prev) => {

        if (prev === images.length - 1) {
          return 0;
        }

        return prev + 1;

      });


    }, 2000);



    return () => clearInterval(timer);


  }, []);






  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, categoriesData] = await Promise.all([
        getPlans(),
        getCategories(false),
      ]);
      setPlans(plansData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search', 'Please enter a search term');
      return;
    }
    router.push({ pathname: '/map', params: { category: searchQuery } });
  };

  const handleFindShops = () => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location to find nearby shops');
      return;
    }
    router.push('/map');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (

    
    <SafeAreaView style={styles.container}>

     <View style={styles.dashboardWrapper}>

          <Modal
           visible={visible}
          transparent
          animationType="slide">


                <View style={styles.popupOverlay}>
               <View style={styles.popupModal}>

           <TouchableOpacity

              style={styles.closeBtn}

              onPress={() => setVisible(false)}

            >

              <Text style={styles.closeText}>
                ✖
              </Text>


            </TouchableOpacity>


             <Image

              source={images[currentImage]}

              style={styles.popupImage}

              resizeMode="contain"

            />


                 <View style={styles.carouselDots}>


              {
                images.map((_, index) => (

                  <View

                    key={index}

                    style={[

                      styles.dot,

                      currentImage === index && styles.activeDot

                    ]}
                    />
                    ))
              }
            </View>
          </View>
            </View>
        </Modal>
    </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image 
              source={{uri:'https://intown-dev.s3.ap-south-1.amazonaws.com/app_logo/intown-logo.jpg'}} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone}</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Ionicons name="person" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={24} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for categories or shops..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholderTextColor="#999999"
            />
          </View>
        </View>

        {/* Popular Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Categories</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => router.push({ pathname: '/map', params: { category: category.name } })}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon as any} size={32} color="#FF8A00" />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Plans</Text>
          {plans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>₹{plan.pricePerMonth}/mo</Text>
              </View>
              <View style={styles.planBenefits}>
                {plan.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.savingsBox}>
                <Text style={styles.savingsText}>
                  Estimated Savings: ₹{plan.savings}/month
                </Text>
              </View>
              <TouchableOpacity
                style={styles.planButton}
                onPress={() =>
                  router.push({
                    pathname: '/payment',
                    params: { planId: plan.id, amount: plan.pricePerMonth, type: 'plan' },
                  })
                }
              >
                <Text style={styles.planButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Find Nearby Shops Button */}
        <TouchableOpacity style={styles.findShopsButton} onPress={handleFindShops}>
          <Ionicons name="location" size={24} color="#FFFFFF" />
          <Text style={styles.findShopsText}>Find Nearby Shops</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
        <Footer dashboardType="user"/>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerLeft: {},
  logo: {
    width: 120,
    height: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  userName: {
    ...FontStylesWithFallback.h6,
    color: '#1A1A1A',
  },
  userPhone: {
    ...FontStylesWithFallback.caption,
    color: '#666666',
  },
  logoutButton: {
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...FontStylesWithFallback.body,
    color: '#1A1A1A',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    ...FontStylesWithFallback.h4,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: '33.33%',
    padding: 8,
  },
  categoryIcon: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    ...FontStylesWithFallback.caption,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    ...FontStylesWithFallback.h4,
    color: '#FF8A00',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  planBenefits: {
    marginBottom: 16,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
    flex: 1,
  },
  savingsBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  savingsText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  planButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  findShopsButton: {
    flexDirection: 'row',
    backgroundColor: '#FF8A00',
    margin: 16,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findShopsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 32,
  },



  dashboardWrapper: {
       flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f2f2f2"
     },

    popupOverlay: {
       flex: 1,
       backgroundColor: "#000",
       justifyContent: "flex-start",
        alignItems: "center"
          },

         popupModal: {
          width: "100%",
           height: height * 0.75,
          maxHeight: 700,
           backgroundColor: "#fff",
            borderBottomLeftRadius: 25,
           borderBottomRightRadius: 25,
           justifyContent: "center",
           alignItems: "center",
           overflow: "hidden"
             },

    closeBtn: {
       position: "absolute",
      top: 15,
       right: 20,
      zIndex: 10
        },

          closeText: {
           fontSize: 25,
          color: "#ff6600",
          fontWeight: "bold"
          },


     popupImage: {
      width: width * 0.92,
      height: height * 0.55,
      alignSelf: "center"
       },

      carouselDots: {
           position: "absolute",
         bottom: 25,
         flexDirection: "row"
          },

          dot: {
           width: 8,
          height: 8,
          borderRadius: 10,
         backgroundColor: "#ccc",
         marginHorizontal: 5
           },

        activeDot: {
           width: 15,
          backgroundColor: "#ff6600"
         }

});






