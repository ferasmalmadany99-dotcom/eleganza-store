import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const colors = useColors(); const { isSignedIn } = useAuth(); const { signOut } = useClerk(); const { user } = useUser();
  const insets = useSafeAreaInsets();
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || '';
  return <View style={[styles.page, { backgroundColor: colors.background }]}>
    <View style={[styles.pageInner, { paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: Math.max(insets.bottom, 16) + 20 }]}>
      <View style={styles.heading}>
        <Text style={[styles.overline, { color: colors.accent }]}>حساب إليغانزا</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>حسابي</Text>
      </View>
      {isSignedIn ? <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Feather name="user" size={27} color={colors.accent} />
        </View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{displayName}</Text>
        {user?.primaryEmailAddress?.emailAddress ? <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.primaryEmailAddress.emailAddress}</Text> : null}
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
        <Text style={[styles.profileNote, { color: colors.mutedForeground }]}>حسابك يجمع اختياراتك وطلباتك في مكان واحد.</Text>
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={[styles.button, { backgroundColor: colors.secondary }]}>
          <Feather name="log-out" size={16} color={colors.foreground} /><Text style={{ color: colors.foreground }}>تسجيل الخروج</Text>
        </Pressable>
      </View> : <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}><Feather name="user" size={27} color={colors.accent} /></View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>مساحتك الخاصة</Text>
        <Text style={[styles.profileNote, { color: colors.mutedForeground }]}>أنشئي حسابًا لحفظ المفضلة وإتمام الطلبات.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-up')} style={[styles.button, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.primaryForeground }}>إنشاء حساب</Text><Feather name="arrow-left" size={16} color={colors.primaryForeground} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-in')} style={styles.signInLink}>
          <Text style={{ color: colors.primary }}>لديك حساب؟ سجّلي الدخول</Text>
        </Pressable>
      </View>}
      <Text style={[styles.footerMark, { color: colors.mutedForeground }]}>ELEGANZA · BEAUTY / 01</Text>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  page: { flex: 1 },
  pageInner: { flex: 1, alignItems: 'center', paddingHorizontal: 22 },
  heading: { width: '100%', alignItems: 'flex-end', marginBottom: 26 },
  overline: { fontSize: 9, letterSpacing: 1.4 },
  title: { fontFamily: 'serif', fontSize: 32, lineHeight: 41, writingDirection: 'rtl' },
  profileCard: { width: '100%', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', paddingHorizontal: 19, paddingTop: 26, paddingBottom: 20 },
  avatar: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center', borderRadius: 35, marginBottom: 15 },
  profileName: { fontFamily: 'serif', fontSize: 22, textAlign: 'center', writingDirection: 'rtl' },
  email: { marginTop: 4, fontSize: 13, textAlign: 'center' },
  separator: { width: '100%', height: StyleSheet.hairlineWidth, marginVertical: 18 },
  profileNote: { textAlign: 'center', lineHeight: 23, fontSize: 14, marginBottom: 18, writingDirection: 'rtl' },
  button: { width: '100%', minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 },
  signInLink: { minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12 },
  footerMark: { marginTop: 'auto', paddingTop: 28, fontSize: 9, letterSpacing: 1.5 },
});
