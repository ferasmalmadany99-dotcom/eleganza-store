import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import * as Location from 'expo-location';
import { createStorefrontCustomerProfile, getGetStorefrontCustomerAccountQueryKey, useCreateStorefrontOrder, useGetStorefrontCustomerAccount } from '@workspace/api-client-react';
import { useStore } from '@/context/StoreContext';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BagScreen() {
  const colors = useColors(); const { isSignedIn } = useAuth(); const { user } = useUser();
  const insets = useSafeAreaInsets();
  const { bag, add, remove } = useStore(); const order = useCreateStorefrontOrder();
  const account = useGetStorefrontCustomerAccount({
    query: { queryKey: getGetStorefrontCustomerAccountQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const profilePrefilled = useRef(false);
  const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const [editingCustomerInfo, setEditingCustomerInfo] = useState(true);
  const [savingCustomerInfo, setSavingCustomerInfo] = useState(false);
  const [address, setAddress] = useState(''); const [locationUrl, setLocationUrl] = useState(''); const [busy, setBusy] = useState(false);
  const total = bag.reduce((sum, item) => sum + item.product.salePriceMinor * item.quantity, 0) / 100;
  useEffect(() => {
    if (!account.data || profilePrefilled.current) return;
    const savedName = account.data.profile.customerName || user?.fullName || '';
    const savedPhone = account.data.profile.customerPhone || user?.primaryPhoneNumber?.phoneNumber || '';
    setName(savedName);
    setPhone(savedPhone);
    setEditingCustomerInfo(!savedName || !savedPhone);
    profilePrefilled.current = true;
  }, [account.data, user?.fullName, user?.primaryPhoneNumber?.phoneNumber]);
  const saveCustomerInfo = async () => {
    if (name.trim().length < 2 || phone.trim().length < 5) {
      Alert.alert('أكمل بيانات الحساب', 'أدخل الاسم الكامل ورقم الهاتف قبل الحفظ.');
      return;
    }
    setSavingCustomerInfo(true);
    try {
      await createStorefrontCustomerProfile({ customerName: name.trim(), customerPhone: phone.trim() });
      await account.refetch();
      setEditingCustomerInfo(false);
      Alert.alert('تم الحفظ', 'تم تحديث بياناتك وستظهر تلقائيًا عند إتمام الطلب.');
    } catch (error) {
      Alert.alert('تعذر حفظ البيانات', error instanceof Error ? error.message : 'تحقق من اتصال الإنترنت وحاول مرة أخرى.');
    } finally {
      setSavingCustomerInfo(false);
    }
  };
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
  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, 12) + 10, paddingBottom: Math.max(insets.bottom, 16) + 96 }]} keyboardShouldPersistTaps="handled">
    <View style={styles.pageHead}>
      <Text style={[styles.overline, { color: colors.accent }]}>حقيبتك</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>حقيبة التسوق</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{bag.length ? 'مراجعة مختاراتك قبل إتمام الطلب' : 'قطعك المختارة تظهر هنا'}</Text>
    </View>
    {!bag.length ? <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Feather name="shopping-bag" size={26} color={colors.accent} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>حقيبتك فارغة حاليًا</Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>ابدئي باكتشاف العطور والجمال المختار بعناية.</Text>
    </View> : bag.map(({ product, quantity }) => <View key={product.id} style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      {product.imageUrls?.[0] ? <Image source={{ uri: product.imageUrls[0] }} style={styles.itemImage} resizeMode="cover" /> : <View style={[styles.itemImage, styles.itemPlaceholder, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.mutedForeground, fontFamily: 'serif' }}>E</Text></View>}
      <View style={styles.itemCopy}>
        <Text numberOfLines={2} style={[styles.product, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text>
        <Text style={[styles.itemPrice, { color: colors.primary }]}>{(product.salePriceMinor * quantity / 100).toFixed(2)} د.ل</Text>
        <View style={[styles.counter, { borderColor: colors.border, borderRadius: colors.radius }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="تقليل الكمية" hitSlop={6} onPress={() => remove(product.id)} style={styles.counterButton}><Text style={{ color: colors.primary, fontSize: 20 }}>−</Text></Pressable>
          <Text style={[styles.counterValue, { color: colors.foreground }]}>{quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="زيادة الكمية" hitSlop={6} onPress={() => add(product)} style={styles.counterButton}><Text style={{ color: colors.primary, fontSize: 20 }}>＋</Text></Pressable>
        </View>
      </View>
    </View>)}
    {!!bag.length && <><View style={[styles.totalPanel, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>الإجمالي</Text>
      <Text style={[styles.total, { color: colors.foreground }]}>{total.toFixed(2)} د.ل</Text>
    </View>
      {!isSignedIn ? <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-in')} style={[styles.button, { backgroundColor: colors.primary, borderRadius: colors.radius }]}><Text style={{ color: colors.primaryForeground }}>سجّل الدخول لمتابعة الطلب</Text></Pressable> :
      <View style={[styles.checkout, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.checkoutTitle, { color: colors.foreground }]}>بيانات التوصيل</Text>
        <View style={[styles.customerInfo, { borderColor: colors.border, borderRadius: colors.radius }]}>
          <View style={styles.customerInfoHeader}>
            <Pressable accessibilityRole="button" onPress={() => {
              if (editingCustomerInfo) {
                setName(account.data?.profile.customerName || user?.fullName || '');
                setPhone(account.data?.profile.customerPhone || user?.primaryPhoneNumber?.phoneNumber || '');
              }
              setEditingCustomerInfo((value) => !value);
            }} style={styles.editInfoButton}>
              <Feather name={editingCustomerInfo ? 'x' : 'edit-2'} size={15} color={colors.primary} />
              <Text style={{ color: colors.primary }}>{editingCustomerInfo ? 'إلغاء التعديل' : 'تعديل البيانات'}</Text>
            </Pressable>
            <Text style={[styles.customerInfoTitle, { color: colors.foreground }]}>بيانات الحساب</Text>
          </View>
          {editingCustomerInfo ? <>
            <TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor={colors.mutedForeground} accessibilityLabel="الاسم الكامل" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius }]} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor={colors.mutedForeground} accessibilityLabel="رقم الهاتف" keyboardType="phone-pad" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius }]} />
            <Pressable accessibilityRole="button" disabled={savingCustomerInfo} onPress={() => void saveCustomerInfo()} style={[styles.saveInfoButton, { borderColor: colors.border, borderRadius: colors.radius, opacity: savingCustomerInfo ? 0.6 : 1 }]}>
              {savingCustomerInfo ? <ActivityIndicator color={colors.primary} /> : <Text style={{ color: colors.primary }}>حفظ بيانات الحساب</Text>}
            </Pressable>
          </> : <>
            <View style={styles.infoRow}><Text style={[styles.infoValue, { color: colors.foreground }]}>{name || 'غير مسجل'}</Text><Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>الاسم</Text></View>
            <View style={styles.infoRow}><Text style={[styles.infoValue, { color: colors.foreground }]}>{phone || 'غير مسجل'}</Text><Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>الهاتف</Text></View>
            {!!account.data?.profile.customerEmail && <View style={styles.infoRow}><Text style={[styles.infoValue, { color: colors.foreground }]}>{account.data.profile.customerEmail}</Text><Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>البريد</Text></View>}
          </>}
        </View>
        <TextInput value={address} onChangeText={setAddress} placeholder="العنوان بالتفصيل" placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius }]} />
        <TextInput value={locationUrl} onChangeText={setLocationUrl} placeholder="رابط موقع Google Maps" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background, borderRadius: colors.radius }]} />
        <Pressable accessibilityRole="button" onPress={captureLocation} style={[styles.locationButton, { borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="map-pin" size={16} color={colors.accent} /><Text style={{ color: colors.foreground }}>استخدم موقعي الحالي</Text>
        </Pressable>
        <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={[styles.button, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: busy ? 0.75 : 1 }]}>{busy ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={{ color: colors.primaryForeground }}>تأكيد الطلب — الدفع عند الاستلام</Text>}</Pressable>
      </View>}
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  content: { paddingHorizontal: 17, gap: 12 },
  pageHead: { alignItems: 'flex-end', marginBottom: 8 },
  overline: { fontSize: 9, letterSpacing: 1.5 },
  title: { fontFamily: 'serif', fontSize: 31, lineHeight: 40, textAlign: 'right', writingDirection: 'rtl' },
  subtitle: { textAlign: 'right', fontSize: 13, writingDirection: 'rtl' },
  emptyState: { minHeight: 190, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  emptyTitle: { fontFamily: 'serif', fontSize: 22, writingDirection: 'rtl' },
  emptyCopy: { textAlign: 'center', lineHeight: 22, writingDirection: 'rtl' },
  item: { flexDirection: 'row', gap: 13, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, padding: 10 },
  itemImage: { width: 86, height: 100 },
  itemPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, alignItems: 'flex-end', gap: 5 },
  counter: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, marginTop: 3 },
  counterButton: { minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  counterValue: { minWidth: 16, textAlign: 'center', fontSize: 14 },
  product: { textAlign: 'right', fontFamily: 'serif', fontSize: 17, lineHeight: 22, writingDirection: 'rtl' },
  itemPrice: { textAlign: 'right', fontSize: 13 },
  totalPanel: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, paddingVertical: 14, marginTop: 3 },
  totalLabel: { fontSize: 13, writingDirection: 'rtl' },
  total: { textAlign: 'right', fontSize: 20, fontFamily: 'serif' },
  checkout: { borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 11, marginTop: 4 },
  checkoutTitle: { fontFamily: 'serif', fontSize: 21, textAlign: 'right', writingDirection: 'rtl', marginBottom: 1 },
  customerInfo: { borderWidth: StyleSheet.hairlineWidth, padding: 11, gap: 9 },
  customerInfoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 5 },
  customerInfoTitle: { fontSize: 14, fontWeight: '600', writingDirection: 'rtl' },
  editInfoButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 7 },
  saveInfoButton: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  infoRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  infoValue: { flex: 1, fontSize: 13, textAlign: 'left' },
  infoLabel: { fontSize: 12, writingDirection: 'rtl' },
  input: { borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 13, minHeight: 50, textAlign: 'right', writingDirection: 'rtl' },
  locationButton: { minHeight: 48, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9, borderWidth: StyleSheet.hairlineWidth },
  button: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
});
