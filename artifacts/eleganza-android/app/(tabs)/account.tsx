import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';

export default function AccountScreen() {
  const colors = useColors(); const { isSignedIn } = useAuth(); const { signOut } = useClerk(); const { user } = useUser();
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <Text style={[styles.title, { color: colors.foreground }]}>حسابي</Text>
    {isSignedIn ? <><Text style={{ color: colors.foreground, fontSize: 18 }}>{user?.fullName || user?.primaryEmailAddress?.emailAddress}</Text><Text style={{ color: colors.mutedForeground }}>{user?.primaryEmailAddress?.emailAddress}</Text>
      <Pressable onPress={() => void signOut()} style={[styles.button, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.foreground }}>تسجيل الخروج</Text></Pressable></>
    : <><Text style={{ color: colors.mutedForeground, textAlign: 'center' }}>أنشئ حسابًا لحفظ المفضلة وإتمام الطلبات.</Text>
      <Pressable onPress={() => router.push('/(auth)/sign-up')} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground }}>إنشاء حساب</Text></Pressable>
      <Pressable onPress={() => router.push('/(auth)/sign-in')}><Text style={{ color: colors.primary }}>لديك حساب؟ سجّل الدخول</Text></Pressable></>}
  </View>;
}
const styles = StyleSheet.create({ page: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }, title: { fontFamily: 'serif', fontSize: 30 }, button: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center' } });
