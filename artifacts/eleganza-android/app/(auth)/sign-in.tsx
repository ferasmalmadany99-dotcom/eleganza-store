import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSignIn } from '@clerk/expo';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

export default function SignInScreen() {
  const colors = useColors(); const { signIn, fetchStatus, errors } = useSignIn();
  const [emailAddress, setEmailAddress] = useState(''); const [password, setPassword] = useState('');
  const submit = async () => {
    const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password });
    if (error) { Alert.alert('تعذر تسجيل الدخول', error.message); return; }
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: () => router.dismissAll() });
    } else if (signIn.status === 'needs_client_trust') {
      Alert.alert('يلزم تأكيد إضافي', 'راجع بريدك الإلكتروني لإكمال تسجيل الدخول.');
    }
  };
  return <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.page} bottomOffset={24} keyboardShouldPersistTaps="handled">
    <Text style={[styles.brand, { color: colors.foreground }]}>Eleganza</Text><Text style={[styles.title, { color: colors.foreground }]}>تسجيل الدخول</Text>
    <TextInput value={emailAddress} onChangeText={setEmailAddress} placeholder="البريد الإلكتروني" keyboardType="email-address" autoCapitalize="none" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card, borderRadius: colors.radius }]} />
    <TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" secureTextEntry style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card, borderRadius: colors.radius }]} />
    {errors.fields.identifier && <Text style={{ color: colors.destructive }}>{errors.fields.identifier.message}</Text>}
    <Pressable disabled={fetchStatus === 'fetching'} onPress={submit} style={[styles.button, { backgroundColor: colors.primary, borderRadius: colors.radius }]}><Text style={{ color: colors.primaryForeground }}>دخول</Text></Pressable>
    <View style={styles.footer}><Text style={{ color: colors.foreground }}>ليس لديك حساب؟ </Text><Pressable onPress={() => router.replace('/(auth)/sign-up')}><Text style={{ color: colors.primary }}>إنشاء حساب</Text></Pressable></View>
  </KeyboardAwareScrollViewCompat>;
}
const styles = StyleSheet.create({ page: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 }, brand: { fontFamily: 'serif', fontSize: 34, textAlign: 'center' }, title: { fontFamily: 'serif', fontSize: 25, textAlign: 'right', marginBottom: 8 }, input: { minHeight: 50, borderWidth: 1, paddingHorizontal: 14, textAlign: 'right' }, button: { minHeight: 50, alignItems: 'center', justifyContent: 'center' }, footer: { flexDirection: 'row-reverse', justifyContent: 'center', paddingTop: 8 } });
