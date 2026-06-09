import React from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';

export default function App() {
  return (
    <ScrollView style={styles.container}>

      {/* NEW SECTION */}
      <View style={styles.newSection}>
        <Text style={styles.newSectionTitle}>Subscription Plans</Text>
      
      </View>

      {/* SECTION 1 */}
      
      <View style={styles.heroBox}>

           {/* LEFT SIDE */}
        <View style={styles.left}>
          <Text style={styles.blackText}>
            <Text style={{ color: '#0a58ca', fontSize: 26 }}>Why pay extra</Text>
            <Text style={{ color: '#111111', fontSize: 22 }}> for shopping?</Text>
          </Text>
          <Text style={styles.orangeText}>Save more every day</Text>
          <Text style={styles.thirdLineText}>With INtown, you enjoy exclusive discounts at trusted local stores while avoiding hidden costs of modern retail.</Text>

          
          
        </View>

        {/* RIGHT SIDE */}
         <Image
          source={{
            uri: 'https://static.vecteezy.com/system/resources/previews/001/825/524/non_2x/support-local-business-shop-small-market-eco-and-paper-bag-with-food-free-vector.jpg',
          }}
          style={styles.rightImage}
        />
        

      </View>

      {/* SECTION 2 */}

<View style={styles.section2}>

  <View style={styles.section2Row}>

    {/* CARD 1 - WHAT YOU SAVE */}
    <View style={[styles.cardRow, styles.section2Card]}>

      {/* LEFT SIDE */}
      <View style={styles.leftContent}>

        {/* HEADING */}
        <View style={styles.headingRow}>
          <Icon name="savings" size={22} color="#ff0000" style={{ marginRight: 10 }} />
          <Text style={styles.titleRed}>What You Save</Text>
        </View>

        {/* LIST */}
        {[
          'No Delivery Charges',
          'No Convenience Fees',
          'No Packaging Charges',
          'No Small Order Fees',
          'No Peak-Time Charges',
        ].map((item, index) => (
          <View style={styles.listRow} key={index}>
            <View style={styles.iconBadge}>
              <Icon name="close" size={16} color="#ef1d12" />
            </View>
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}

      </View>

      {/* RIGHT SIDE IMAGE */}
      <Image
        source={{
          uri: 'https://png.pngtree.com/recommend-works/png-clipart/20250425/ourmid/pngtree-little-piggy-saving-money-png-image_16108958.png',
        }}
        style={styles.sideImage}
      />

    </View>

    {/* CARD 2 - WHAT YOU GET */}
    <View style={[styles.cardRow, styles.section2Card]}>

      {/* LEFT SIDE */}
      <View style={styles.leftContent}>

        {/* HEADING */}
        <View style={styles.headingRow}>
          <Icon name="card-giftcard" size={22} color="green" style={{ marginRight: 10 }} />
          <Text style={styles.titleGreen}>What You Get</Text>
        </View>

        {/* LIST */}
        {[
          'Instant Discounts at Local Stores',
          'Order Now, Pick Up Later',
          'Book service slots in advance',
          'Discover Best Local Deals',
          'Shop with Friends through Circles',
        ].map((item, index) => (
          <View style={styles.listRow} key={index}>
            <Icon name="check-circle" size={18} color="green" style={{ marginRight: 10 }} />
            <Text style={styles.listText}>{item}</Text>
          </View>
        ))}

      </View>

      {/* RIGHT SIDE IMAGE */}
      <Image
        source={{
          uri: 'https://static.vecteezy.com/system/resources/thumbnails/016/327/439/small/shopping-bag-gift-box-3d-icon-render-illustration-png.png',
        }}
        style={styles.sideImage}
      />

    </View>

  </View>

  {/* SECTION 3 */}
  <View style={[styles.cardRow, styles.infoCard]}>

    {/* RIGHT FULL LINE CONTENT */}
    <View style={styles.rightInline}>

      <View style={styles.inlineRow}>

        <Icon name="info" size={20} color="#1e90ff" />

        <Text style={styles.inlineText}>
          <Text style={styles.titleBlue}>Why It Matters :- </Text>

          INtown → Instant savings, faster shopping, better local experiences
        </Text>

      </View>

    </View>

  </View>

</View>

{/* SECTION 4 */}

<View style={styles.cardRow}>

  {/* LEFT SIDE IMAGE */}
  <Image
    source={{
      uri: 'https://plus.unsplash.com/premium_photo-1661425505025-238c888750f7?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvbWlzZXxlbnwwfHwwfHx8MA%3D%3D',
    }}
    style={styles.fourthSectionImage}
  />

  {/* RIGHT SIDE CONTENT */}
  <View style={[styles.leftContent, styles.centerContent, styles.fourthSectionContent]}>

    {/* HEADING */}
    <View style={styles.headingRow}>
      <Icon name="verified" size={24} color="#ff9800" />
      <Text style={styles.titleOrange}>The INtown Promise</Text>
    </View>

    {/* PARAGRAPH 1 */}
    <Text style={styles.paragraph}>
      Save More Than Your subscription fee - GUARANTEED. If not, we'll refund your subscription fee.
    </Text>

    {/* PARAGRAPH 2 */}
    <Text style={styles.paragraph}>
      For less than the cost of a few deliveries each month, INtown helps you unlock year-round savings and convenience at the stores you already trust.
    </Text>

    {/* QUOTE */}
    <View style={styles.quoteBox}>
      <Text style={styles.quoteText}>
        "You Deserve More. Pay Less. Shop Local."
      </Text>
    </View>

  </View>

</View>

{/* SECTION 5 */}

<View style={styles.cardRow}>

  {/* LEFT SIDE IMAGE */}
  <Image
    source={{
      uri: 'https://media.istockphoto.com/id/1461094373/vector/zero-percent-and-open-hand-icon-commission-0-vector.jpg?s=612x612&w=0&k=20&c=OStLQcGhHHvyrZcwBiyj7eTpIc_sugtTV2vP86MNHZY=',
    }}
    style={styles.fifthSectionImage}
  />

  {/* RIGHT SIDE CONTENT */}
  <View style={[styles.leftContent, styles.centerContent, styles.fourthSectionContent]}>

    {/* HEADING */}
    <View style={styles.headingRow}>
      <Icon name="handshake" size={28} color="#4caf50" />
      <Text style={styles.titleGreen}>Zero Transaction Fees. Maximum Customer Value.</Text>
    </View>

    {/* PARAGRAPH */}
    <View style={styles.listRow}>
      <Icon name="check-circle" size={18} color="#4caf50" style={{ marginRight: 10 }} />
      <Text style={styles.listText}>
        Intown does not charge merchants any transaction commissions or per-order fees. Instead, we encourage our merchant partners to pass those savings directly to customers through better prices, exclusive offers, rewards, and cashback. This creates a win-win ecosystem where businesses grow, customers save more, and local commerce thrives.
      </Text>
    </View>

  </View>

</View>


{/* SECTION 6,7,8 */}

<View style={styles.planSection}>

  {/* TITLE */}
  <Text style={styles.planMainTitle}>
    Your Neighborhood Has Better Deals Than You Think
  </Text>

  {/* SCROLL CARDS */}
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.cardScrollContent}
  >

    {/* CARD 1 - GO */}
    <View style={[styles.planCard, styles.planCardBorder]}>

      <Text style={styles.planTitle}>INtown GO</Text>
      <Text style={styles.planSubtitle}>Explore Local Like Never Before</Text>
      <Text style={styles.planDesc}>
        Start unlocking the hidden value in your neighborhood.
      </Text>
      <Text style={styles.planText}>Silver</Text>

      <Text style={styles.price}>₹399 + GST | 3 Months</Text>

      {[
        'Exclusive prices at partner stores',
        'Discover Hidden Gem Offers nearby',
        'Reserve products before visiting stores',
        'Save time, money, and effort',
        'Access trusted local businesses',
      ].map((item, i) => (
        <View style={[styles.listRow, styles.planListRow]} key={i}>
          <Icon name="check-circle" size={16} color="#4caf50" style={{ marginRight: 8 }} />
          <Text style={[styles.listText, styles.planListText]}>{item}</Text>
        </View>
      ))}

      <View style={styles.button}>
        <Text style={styles.buttonText}>Get GO</Text>
      </View>

    </View>

    {/* CARD 2 - PLUS */}
    <View style={[styles.planCard, styles.planCardBlue]}>

      <Text style={styles.planTitle}>INtown Plus</Text>
      <Text style={styles.planSubtitle}>Together We Save More</Text>
      <Text style={styles.planDesc}>
        Experience the next level of local shopping.
      </Text>
      <Text style={styles.planText}>Gold</Text>

      <Text style={styles.price}>₹599 + GST | 6 Months</Text>

      {[
        'Everything in GO',
        'Join INtown Circles™ for group savings',
        'Access premium merchant offers',
        'Faster savings across categories',
        'Early access to campaigns',
      ].map((item, i) => (
        <View style={styles.listRow} key={i}>
          <Icon name="check-circle" size={16} color="#4caf50" style={{ marginRight: 8 }} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}

      <View style={styles.buttonBlue}>
        <Text style={styles.buttonText}>Get PLUS</Text>
      </View>

    </View>

    {/* CARD 3 - MAX */}
    <View style={[styles.planCard, styles.planCardHighlight]}>

      <Text style={styles.popularTag}>MOST POPULAR • BEST VALUE</Text>

      <Text style={styles.planTitle}>INtown Max</Text>
      <Text style={styles.planSubtitle}>The VIP Pass to Your City's Best Secrets</Text>
      <Text style={styles.planDesc}>
        The ultimate plan for smart local shoppers.
      </Text>
      <Text style={styles.planText}>Platinum</Text>

      <Text style={styles.price}>₹999 + GST | 12 Months</Text>

      {[
        'Everything in Plus',
        'Unlimited Hidden Gems™ offers',
        'Smart Slots™ bookings',
        'Quick Reserve™ pickup',
        'Priority merchant access',
        'Maximum savings potential',
      ].map((item, i) => (
        <View style={styles.listRow} key={i}>
          <Icon name="check-circle" size={16} color="#4caf50" style={{ marginRight: 8 }} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}

      <View style={styles.buttonDark}>
        <Text style={styles.buttonText}>Get Max</Text>
      </View>

    </View>

  </ScrollView>

  

</View>

{/* SECTION 9 */}



<View style={[styles.securitySection, styles.centerSectionContent]}>

  {/* ICON + HEADING */}
  <View style={[styles.headingRow, styles.centerSectionContent]}>
    <Icon name="security" size={22} color="#4caf50" />
    <Text style={styles.securityTitle}>Safe & Secure</Text>
  </View>

  {/* DESCRIPTION */}
  <View style={[styles.listRow, styles.centerSectionContent]}>
    <Icon name="check-circle" size={18} color="#4caf50" style={{ marginRight: 10 }} />
    <Text style={styles.listText}>
      All transactions are encrypted with bank-grade security protocols.
    </Text>
  </View>

</View>

{/* SECTION 10 */}

<View style={styles.supportSection}>

  {/* ICON */}
  <Icon name="support-agent" size={40} color="#ff9800" style={{ marginBottom: 10 }} />

  {/* HEADING */}
  <Text style={styles.supportTitle}>
    Still have questions?
  </Text>

  {/* DESCRIPTION */}
  <Text style={styles.supportText}>
    Our dedicated community success team is here to help you choose the right path for your business.
  </Text>

  {/* BUTTON */}
  <View style={styles.supportButton}>
    <Text style={styles.supportButtonText}>Contact Support</Text>
  </View>

</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f6f8',
    paddingBottom: 8,
  },

  newSection: {
    backgroundColor: '#f8fbff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
    shadowColor: '#1e40af',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },

  newSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff8c42',
    marginBottom: 6,
    textAlign: 'center',
  },

  newSectionSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },

  heroBox: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 16,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  left: {
    flex: 1,
  },

  blackText: {
    color: '#111111',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  thirdLineText: {
    color: '#111111',
    fontSize: 15,
    fontWeight: 'normal',
    marginTop: 2,
  },

  orangeText: {
    color: '#ff8c42',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  desc: {
    marginTop: 8,
    fontSize: 13,
    color: '#4a5568',
  },

  rightImage: {
    width: 400,
    height: 200,
    borderRadius: 20,
    marginLeft: 0,
  },

  section2: {
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  section2Row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },

  section2Card: {
    flex: 1,
    marginBottom: 0,
  },

  infoCard: {
    marginBottom: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

cardRow: {
  flexDirection: 'row',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 14,
  alignItems: 'center',
  elevation: 4,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 6,
  marginBottom: 16,
},

leftContent: {
  flex: 1,
  paddingRight: 12,
},

centerContent: {
  justifyContent: 'center',
},

fourthSectionContent: {
  marginLeft: 16,
},

fourthSectionImage: {
  width: 220,
  height: 150,
  borderRadius: 12,
  resizeMode: 'cover',
}, 

headingRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 8,
},

headingIcon: {
  width: 22,
  height: 22,
  marginRight: 6,
},

titleRed: {
  fontSize: 19,
  fontWeight: '800',
  color: '#d11a2a',
  letterSpacing: 0.2,
},

titleGreen: {
  fontSize: 20,
  fontWeight: 'bold',
  color: 'green',
},

listText: {
  fontSize: 13,
  color: '#333',
  marginBottom: 4,
  fontWeight: '500',
  textAlign:'center'
},

iconBadge: {
  width: 26,
  height: 26,
  borderRadius: 13,
  backgroundColor: '#ffe5e5',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 10,
},


sideImage: {
  width: 200,
  height: 150,
  borderRadius: 6,
},

fifthSectionImage: {
  width: 380,
  height: 200,
  borderRadius: 8,
},

listRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: 6,
},

titleBlue: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1e90ff',
},

titleOrange: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#ff9800',
},

quoteBox: {
  marginTop: 8,
  padding: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#ff9800',
  backgroundColor: '#fff8e1',
  borderRadius: 6,
},

quoteText: {
  fontStyle: 'italic',
  color: '#444',
  fontSize: 13,
},
planSection: {
  padding: 16,
  alignItems: 'center',
  marginTop: 8,
  marginBottom: 16,
},

planMainTitle: {
  fontSize: 26,
  fontWeight: '800',
  marginBottom: 30,
  color: '#282828',
  textAlign: 'center',
  lineHeight: 32,
  textDecorationLine: 'underline',
  textDecorationColor: '#2e7d32',
},

cardScrollContent: {
  alignItems: 'center',
  paddingHorizontal: 4,
  paddingBottom: 4,
},

planCard: {
  width: 310,
  minHeight: 450,
  backgroundColor: '#fff',
  borderRadius: 14,
  padding: 14,
  marginRight: 14,
  elevation: 3,
  shadowColor: '#000',
  shadowOpacity: 0.08,
  shadowRadius: 6,
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#e5e7eb',
},

planCardHighlight: {
  borderWidth: 2,
  borderColor: '#ff9800',
},

planCardBlue: {
  borderWidth: 2,
  borderColor: '#1e90ff',
},

planCardBorder: {
  borderWidth: 1,
  borderColor: '#d0d7de',
},

planTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#0a58ca',
},

planSubtitle: {
  fontSize: 13,
  color: '#555',
  marginBottom: 5,
},

planListRow: {
  alignItems: 'flex-start',
  marginVertical: 3,
},

planListText: {
  flex: 1,
  marginLeft: 6,
  marginBottom: 0,
},

planDesc: {
  fontSize: 11,
  color: '#777',
  marginBottom: 5,
},

price: {
  fontSize: 15,
  fontWeight: 'bold',
  marginVertical: 5,
  color: '#ff9800',
},

popularTag: {
  fontSize: 10,
  color: '#ff9800',
  fontWeight: 'bold',
  marginBottom: 5,
},

button: {
  marginTop: 10,
  backgroundColor: '#4caf50',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
  minWidth: 120,
},

buttonDark: {
  marginTop: 10,
  backgroundColor: '#ff9800',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
  minWidth: 120,
},

buttonBlue: {
  marginTop: 10,
  backgroundColor: '#1e90ff',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  alignItems: 'center',
  minWidth: 120,
},

buttonText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 14,
},

securityBox: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 15,
  padding: 10,
},

securityTitle: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#222',
  marginLeft: 8,
},
securityText: {
  marginLeft: 8,
  fontSize: 12,
  color: '#555',
},
securitySection: {
  padding: 16,
  marginTop: 12,
  marginBottom: 16,
  backgroundColor: '#fff',
  borderRadius: 12,
  elevation: 3,
},

centerSectionContent: {
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
},
supportSection: {
  alignItems: 'center',
  padding: 20,
  marginTop: 12,
  marginBottom: 16,
  backgroundColor: '#fff',
  borderRadius: 12,
  elevation: 3,
},

supportTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#222',
  textAlign: 'center',
  marginBottom: 8,
},

supportText: {
  fontSize: 13,
  color: '#666',
  textAlign: 'center',
  marginBottom: 15,
},

supportButton: {
  backgroundColor: '#ff9800',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
},

supportButtonText: {
  color: '#fff',
  fontWeight: 'bold',
},
rightInline: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
},

inlineRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
},

inlineText: {
  fontSize: 15,
  color: '#4caf50',
  flex: 1,
  textAlign: 'center',
},

rightContent: {
  flex: 1,
  paddingLeft: 12,
  justifyContent: 'center',
},

paragraph: {
  fontSize: 14,
  color: '#444',
  lineHeight: 20,
  marginBottom: 8,
},
planText:{
   fontSize: 18,
  color: '#c3d219',
}
});
