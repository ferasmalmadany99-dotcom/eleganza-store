import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useSignUp } from '@clerk/expo';
import { createStorefrontCustomerProfile } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

export default function SignUpScreen() {
  const colors = useColors(); const { signUp, fetchStatus } = useSignUp();
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [code, setCode] = useState(''); const [step, setStep] = useState<'details' | 'verify'>('details');
  const start = async () => {
    if (name.trim().length < 2 || phone.trim().length < 5) { Alert.alert('تحقق من البيانات', 'أدخل الاسم الكامل ورقم الهاتف.'); return; }
    const { error } = await signUp.password({ emailAddress: email.trim(), password });
    if (error) { Alert.alert('تعذر إنشاء الحساب', error.message); return; }
    const sent = await signUp.verifications.sendEmailCode();
    if (sent.error) { Alert.alert('تعذر إرسال الرمز', sent.error.message); return; }
    setStep('verify');
  };
  const verify = async () => {
    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (error) { Alert.alert('رمز غير صحيح', error.message); return; }
    if (signUp.status !== 'complete') { Alert.alert('لم يكتمل التحقق', 'أعد المحاولة أو اطلب رمزًا جديدًا.'); return; }
    try {
      await signUp.finalize();
      await createStorefrontCustomerProfile({ customerName: name.trim(), customerPhone: phone.trim() });
      router.dismissAll();
    } catch (err) { Alert.alert('تم التحقق لكن تعذر حفظ الملف', err instanceof Error ? err.message : 'أعد المحاولة.'); }
  };
  return <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.page} bottomOffset={24} keyboardShouldPersistTaps="handled">
    <Text style={[styles.brand, { color: colors.foreground }]}>Eleganza</Text>
    <Text style={[styles.title, { color: colors.foreground }]}>{step === 'verify' ? 'تأكيد البريد الإلكتروني' : 'إنشاء حساب زبون'}</Text>
    {step === 'details' ? <>
      <TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
      <TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" keyboardType="phone-pad" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
      <TextInput value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" keyboardType="email-address" autoCapitalize="none" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
      <TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" secureTextEntry style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
      <Pressable disabled={fetchStatus === 'fetching'} onPress={start} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground }}>متابعة وإرسال رمز التأكيد</Text></Pressable>
    </> : <>
      <Text style={{ color: colors.mutedForeground, textAlign: 'right' }}>أدخل الرمز الذي أرسلناه إلى {email}.</Text>
      <TextInput value={code} onChangeText={setCode} placeholder="رمز التأكيد" keyboardType="number-pad" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
      <Pressable onPress={verify} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground }}>تأكيد وإنشاء الحساب</Text></Pressable>
      <Pressable onPress={() => void signUp.verifications.sendEmailCode()}><Text style={{ color: colors.primary, textAlign: 'center' }}>إرسال رمز جديد</Text></Pressable>
    </>}
    <Text nativeID="clerk-captcha" />
  </KeyboardAwareScrollViewCompat>;
}
const styles = StyleSheet.create({ page: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 13 }, brand: { fontFamily: 'serif', fontSize: 34, textAlign: 'center' }, title: { fontFamily: 'serif', fontSize: 25, textAlign: 'right', marginBottom: 8 }, input: { minHeight: 50, borderWidth: 1, paddingHorizontal: 14, textAlign: 'right' }, button: { minHeight: 50, alignItems: 'center', justifyContent: 'center' } });
