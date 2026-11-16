import React from 'react';
import { View, Text, TouchableOpacity, Share, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { DOCUMENTED_REFERRAL_REWARDS, referralShareMessage } from '../../utils/incoins';
import { GradientSectionHeading } from '../GradientSectionHeading';
import { walletStyles as s } from './walletStyles';

export function ReferralRewardsCard() {
  const { user, isAuthenticated, isGuest } = useAuthStore();
  const share = async () => {
    try { if (!isAuthenticated || isGuest || !user?.phone) return; await Share.share({ message: referralShareMessage(user.phone) }); }
    catch { Alert.alert('Unable to share', 'Please try sharing your referral number again.'); }
  };
  return <View style={s.section} testID="referral-rewards-card">
    <GradientSectionHeading>Refer & Earn INCoins</GradientSectionHeading>
    <Text style={s.copy}>Invite Customers and Merchants to INtown and earn INCoins when they successfully register through your referral.</Text>
    {DOCUMENTED_REFERRAL_REWARDS.map(reward => <View style={s.row} key={reward.label}><Text style={s.copy}>Refer {reward.label}</Text><Text style={s.reward}>{reward.coins.toLocaleString()} INCoins</Text></View>)}
    <Text style={s.caption}>Documented rewards for each eligible party. Current backend settings and eligibility apply; rewards are confirmed after registration. Organic registrations and unregistered referrer numbers earn no referral rewards.</Text>
    <TouchableOpacity accessibilityRole="button" style={s.button} disabled={!isAuthenticated || isGuest || !user?.phone} onPress={share} testID="share-referral-number"><Text style={s.buttonText}>Share Referral Number</Text></TouchableOpacity>
  </View>;
}
