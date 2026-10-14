import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyStorefrontAccess } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';

const ACCESS_CODE_KEY = 'eleganza.storefront.access-code';

export function StorefrontAccessGate({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const [status, setStatus] = useState<'checking' | 'locked' | 'unavailable' | 'submitting' | 'unlocked'>('checking');
  const [code, setCode] = useState('');
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const verify = async (value: string) => {
    const response = await verifyStorefrontAccess({ accessCode: value });
    return response?.verified === true;
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(ACCESS_CODE_KEY);
        if (!active) return;
        if (!stored) {
          setStatus('locked');
          return;
        }
        setSavedCode(stored);
        if (await verify(stored)) {
          if (active) setStatus('unlocked');
        } else {
          await SecureStore.deleteItemAsync(ACCESS_CODE_KEY);
          if (active) {
            setSavedCode(null);
            setStatus('locked');
            setMessage('رمز الدخول غير صحيح. أدخل الرمز المشترك من جديد.');
          }
        }
      } catch {
        if (active) {
          setStatus('unavailable');
          setMessage('تعذر الاتصال بخادم المتجر. تحقق من اتصال الإنترنت ثم أعد المحاولة.');
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const submit = async () => {
    const value = code.trim();
    if (!value) {
      setMessage('أدخل رمز الدخول للمتابعة.');
      return;
    }
    setStatus('submitting');
    setMessage('');
    try {
      if (!await verify(value)) {
        setStatus('locked');
        setMessage('رمز الدخول غير صحيح. تحقق منه وحاول مرة أخرى.');
        return;
      }
      await SecureStore.setItemAsync(ACCESS_CODE_KEY, value);
      setSavedCode(value);
      setCode('');
      setStatus('unlocked');
    } catch {
      setStatus('locked');
      setMessage('تعذر التحقق من الرمز. تحقق من الإنترنت وحاول مرة أخرى.');
    }
  };

  const retry = async () => {
    if (!savedCode) {
      setStatus('locked');
      return;
    }
    setStatus('checking');
    setMessage('');
    try {
      if (await verify(savedCode)) {
        setStatus('unlocked');
      } else {
        await SecureStore.deleteItemAsync(ACCESS_CODE_KEY);
        setSavedCode(null);
        setStatus('locked');
        setMessage('رمز الدخول غير صحيح. أدخل الرمز المشترك من جديد.');
      }
    } catch {
      setStatus('unavailable');
      setMessage('تعذر الاتصال بخادم المتجر. تحقق من اتصال الإنترنت ثم أعد المحاولة.');
    }
  };

  if (status === 'unlocked') return <>{children}</>;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.icon, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.brand, { color: colors.foreground }]}>Eleganza</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>رمز الدخول</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          أدخل الرمز المشترك الذي استلمته من صاحب التطبيق.
        </Text>
        {status === 'checking' ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            {status !== 'unavailable' && (
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="رمز الدخول"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="center"
                maxLength={128}
                editable={status !== 'submitting'}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                accessibilityLabel="رمز الدخول المشترك"
                onSubmitEditing={() => void submit()}
                returnKeyType="go"
              />
            )}
            {!!message && <Text accessibilityRole="alert" style={[styles.message, { color: colors.destructive }]}>{message}</Text>}
            <Pressable
              onPress={() => void (status === 'unavailable' ? retry() : submit())}
              disabled={status === 'submitting'}
              style={[styles.button, { backgroundColor: colors.primary, opacity: status === 'submitting' ? 0.7 : 1 }]}
            >
              {status === 'submitting'
                ? <ActivityIndicator color={colors.primaryForeground} />
                : <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{status === 'unavailable' ? 'إعادة المحاولة' : 'دخول'}</Text>}
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, gap: 14 },
  icon: { width: 58, height: 58, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  brand: { fontFamily: 'serif', fontSize: 34 },
  title: { fontFamily: 'serif', fontSize: 26, marginTop: 12 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 23 },
  input: { width: '100%', minHeight: 52, borderWidth: 1, paddingHorizontal: 14, fontSize: 17, marginTop: 14 },
  message: { textAlign: 'center', lineHeight: 21 },
  button: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
