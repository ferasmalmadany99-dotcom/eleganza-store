import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import * as Location from 'expo-location';
import { useCreateStorefrontOrder } from '@workspace/api-client-react';
import { useStore } from '@/context/StoreContext';
import { useColors } from '@/hooks/useColors';

export default function BagScreen() {
  const colors = useColors(); const { isSignedIn } = useAuth(); const { user } = useUser();
  const { bag, add, remove } = useStore(); const order = useCreateStorefrontOrder();
  const [name, setName] = useState(user?.fullName ?? ''); const [phone, setPhone] = useState(user?.primaryPhoneNumber?.phoneNumber ?? '');
  const [address, setAddress] = useState(''); const [locationUrl, setLocationUrl] = useState(''); const [busy, setBusy] = useState(false);
  const total = bag.reduce((sum, item) => sum + item.product.salePriceMinor * item.quantity, 0) / 100;
  const captureLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('الموقع غير متاح', 'اسمح للتطبيق بالوصول إلى الموقع أو أدخل رابط خرائط Google.'); return; }
      const point = await Location.getCurrentPositionAsync({});
      setLocationUrl(`https://maps.google.com/?q=${point.coords.latitude},${point.coords.longitude}`);
    } catch { Alert.alert('تعذر تحديد الموقع', 'أدخل رابط الموقع يدويًا.'); }
  };
  const submit = async () => {
    if (!isSignedIn) { router.push('/(auth)/sign-in'); return; }
    if (!bag.length || name.trim().length < 2 || phone.trim().length < 5 || address.trim().length < 5 || !locationUrl.startsWith('http')) { Alert.alert('أكمل بيانات التوصيل', 'أدخل الاسم والهاتف والعنوان ورابط الموقع.'); return; }
    setBusy(true);
    try {
      const created = await order.mutateAsync({ data: { customerName: name, customerPhone: phone, customerAddress: address, customerLocationUrl: locationUrl, paymentMethod: 'cod', items: bag.map((item) => ({ productId: item.product.id, quantity: item.quantity })) } });
      for (const item of [...bag]) for (let i = 0; i < item.quantity; i++) remove(item.product.id);
      Alert.alert('تم استلام طلبك', `رقم الطلب: ${created.orderNumber}`);
    } catch (error) { Alert.alert('تعذر إنشاء الطلب', error instanceof Error ? error.message : 'تحقق من البيانات وحاول مرة أخرى.'); }
    finally { setBusy(false); }
  };
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={[styles.title, { color: colors.foreground }]}>حقيبة التسوق</Text>
    {!bag.length ? <Text style={{ color: colors.mutedForeground, textAlign: 'right' }}>حقيبتك فارغة حاليًا.</Text> : bag.map(({ product, quantity }) => <View key={product.id} style={[styles.item, { borderColor: colors.border }]}>
      <View style={styles.counter}><Pressable onPress={() => remove(product.id)}><Text style={{ color: colors.primary, fontSize: 22 }}>−</Text></Pressable><Text>{quantity}</Text><Pressable onPress={() => add(product)}><Text style={{ color: colors.primary, fontSize: 22 }}>＋</Text></Pressable></View>
      <View style={{ flex: 1 }}><Text style={[styles.product, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text><Text style={{ textAlign: 'right', color: colors.primary }}>{(product.salePriceMinor * quantity / 100).toFixed(2)} د.ل</Text></View>
    </View>)}
    {!!bag.length && <><Text style={[styles.total, { color: colors.foreground }]}>المجموع: {total.toFixed(2)} د.ل</Text>
      {!isSignedIn ? <Pressable onPress={() => router.push('/(auth)/sign-in')} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground }}>سجّل الدخول لمتابعة الطلب</Text></Pressable> :
      <><TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
        <TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" keyboardType="phone-pad" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
        <TextInput value={address} onChangeText={setAddress} placeholder="العنوان بالتفصيل" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
        <TextInput value={locationUrl} onChangeText={setLocationUrl} placeholder="رابط موقع Google Maps" autoCapitalize="none" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} />
        <Pressable onPress={captureLocation} style={[styles.button, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.foreground }}>استخدم موقعي الحالي</Text></Pressable>
        <Pressable disabled={busy} onPress={submit} style={[styles.button, { backgroundColor: colors.primary }]}>{busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground }}>تأكيد الطلب — الدفع عند الاستلام</Text>}</Pressable></>}
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({ content: { padding: 20, gap: 14, paddingBottom: 110 }, title: { fontFamily: 'serif', fontSize: 28, textAlign: 'right', marginBottom: 8 }, item: { flexDirection: 'row', gap: 14, alignItems: 'center', borderBottomWidth: 1, paddingVertical: 12 }, counter: { flexDirection: 'row', gap: 12, alignItems: 'center' }, product: { textAlign: 'right', fontFamily: 'serif', fontSize: 18 }, total: { textAlign: 'right', fontSize: 18, marginVertical: 8 }, input: { borderWidth: 1, paddingHorizontal: 14, minHeight: 48, textAlign: 'right' }, button: { minHeight: 48, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 } });
