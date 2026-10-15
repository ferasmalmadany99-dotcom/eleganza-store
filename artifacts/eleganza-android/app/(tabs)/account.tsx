import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth, useClerk, useUser } from '@clerk/expo';
import { createStorefrontCustomerProfile, getGetStorefrontCustomerAccountQueryKey, useGetStorefrontCustomerAccount } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const orderStatus: Record<string, string> = {
  pending: 'قيد المراجعة',
  confirmed: 'تم التأكيد',
  processing: 'قيد التجهيز',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  returned: 'مُرجع',
};

export default function AccountScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const account = useGetStorefrontCustomerAccount({
    query: { queryKey: getGetStorefrontCustomerAccountQueryKey(), enabled: Boolean(isSignedIn) },
  });
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(() => new Set());
  const profile = account.data?.profile;
  const displayName = profile?.customerName || user?.fullName || user?.username || 'زبون Eleganza';

  useEffect(() => {
    if (profile?.customerName) setFullName(profile.customerName);
    else if (user?.fullName) setFullName(user.fullName);
    else setFullName('');
    if (profile?.customerPhone) setPhone(profile.customerPhone);
  }, [profile?.customerName, profile?.customerPhone, user?.fullName]);

  const saveProfile = async () => {
    const normalizedName = fullName.trim();
    const normalizedPhone = phone.trim();
    if (normalizedName.length < 2 || normalizedPhone.length < 5) {
      Alert.alert('أكمل بيانات الحساب', 'أدخل اسمك الكامل ورقم هاتف صحيحًا لحفظ بياناتك وربط مشترياتك السابقة.');
      return;
    }
    setSaving(true);
    try {
      await createStorefrontCustomerProfile({
        customerName: normalizedName,
        customerPhone: normalizedPhone,
      });
      await account.refetch();
      Alert.alert('تم حفظ بياناتك', 'تم تحديث رقم الهاتف وربطه بحسابك.');
    } catch (error) {
      Alert.alert('تعذر حفظ البيانات', error instanceof Error ? error.message : 'تحقق من اتصال الإنترنت وحاول مرة أخرى.');
    } finally {
      setSaving(false);
    }
  };

  return <ScrollView
    style={{ flex: 1, backgroundColor: colors.background }}
    contentContainerStyle={[styles.pageInner, { paddingTop: Math.max(insets.top, 12) + 12, paddingBottom: Math.max(insets.bottom, 16) + 100 }]}
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.heading}>
      <Text style={[styles.overline, { color: colors.accent }]}>حساب إليغانزا</Text>
      <Text style={[styles.title, { color: colors.foreground }]}>حسابي</Text>
    </View>

    {isSignedIn ? <>
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          <Feather name="user" size={27} color={colors.accent} />
        </View>
        <Text style={[styles.profileName, { color: colors.foreground }]}>{displayName}</Text>
        <View style={[styles.infoList, { borderColor: colors.border }]}>
          <InfoRow label="الاسم الكامل" value={profile?.customerName || user?.fullName || 'غير مسجل'} colors={colors} />
          <InfoRow label="البريد الإلكتروني" value={profile?.customerEmail || user?.primaryEmailAddress?.emailAddress || 'غير مسجل'} colors={colors} />
          <InfoRow label="رقم الهاتف" value={profile?.customerPhone || 'أضف رقمك لربط مشترياتك'} colors={colors} />
          {profile?.createdAt ? <InfoRow label="تاريخ إنشاء الحساب" value={new Date(profile.createdAt).toLocaleDateString('ar-LY')} colors={colors} /> : null}
        </View>

        {!profile?.customerPhone ? <>
          {!profile?.customerName ? <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="الاسم الكامل"
            accessibilityLabel="الاسم الكامل"
            style={[styles.phoneInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground, borderRadius: colors.radius }]}
          /> : null}
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="رقم الهاتف"
            keyboardType="phone-pad"
            accessibilityLabel="رقم الهاتف"
            style={[styles.phoneInput, { borderColor: colors.border, backgroundColor: colors.background, color: colors.foreground, borderRadius: colors.radius }]}
          />
          <Pressable disabled={saving} onPress={() => void saveProfile()} style={[styles.saveButton, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: saving ? 0.65 : 1 }]}>
            <Text style={{ color: colors.primaryForeground }}>{saving ? 'جارٍ الحفظ…' : 'حفظ بياناتي'}</Text>
          </Pressable>
        </> : null}

        {account.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} /> : null}
        {account.isError ? <View style={styles.queryError}>
          <Text style={{ color: colors.destructive, textAlign: 'right' }}>تعذر تحميل بيانات الحساب والمشتريات.</Text>
          <Pressable onPress={() => void account.refetch()}><Text style={{ color: colors.primary, textAlign: 'right' }}>إعادة المحاولة</Text></Pressable>
        </View> : null}
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={[styles.logoutButton, { backgroundColor: colors.secondary, borderRadius: colors.radius }]}>
          <Feather name="log-out" size={16} color={colors.foreground} />
          <Text style={{ color: colors.foreground }}>تسجيل الخروج</Text>
        </Pressable>
      </View>

      <View style={styles.ordersHeading}>
        <Text style={[styles.overline, { color: colors.accent }]}>سجلّك</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مشترياتي السابقة</Text>
      </View>
      {account.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
      {!account.isLoading && !account.isError && account.data?.orders.length === 0 ? (
        <View style={[styles.emptyOrders, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Feather name="package" size={23} color={colors.accent} />
          <Text style={[styles.orderEmptyTitle, { color: colors.foreground }]}>لا توجد مشتريات سابقة</Text>
          <Text style={[styles.muted, { color: colors.mutedForeground }]}>
            {profile?.customerPhone ? 'ستظهر طلباتك هنا بعد إتمام أول شراء.' : 'احفظ رقم هاتفك لربط الطلبات السابقة بحسابك.'}
          </Text>
        </View>
      ) : null}
      {account.data?.orders.map((order) => {
        const expanded = expandedOrders.has(order.id);
        return <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={`طلب ${order.orderNumber}، ${orderStatus[order.status] || order.status}`}
            onPress={() => {
              if (!expanded) void account.refetch();
              setExpandedOrders((current) => {
                const next = new Set(current);
                if (next.has(order.id)) next.delete(order.id);
                else next.add(order.id);
                return next;
              });
            }}
          >
            <View style={styles.orderHeader}>
              <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
              <Text style={[styles.orderTotal, { color: colors.primary }]}>{formatPrice(order.totalMinor)} د.ل</Text>
              <View style={styles.orderHeadingCopy}>
                <Text style={[styles.orderNumber, { color: colors.foreground }]}>{order.orderNumber}</Text>
                <Text style={[styles.muted, { color: colors.mutedForeground }]}>{new Date(order.createdAt).toLocaleDateString('ar-LY')}</Text>
              </View>
            </View>
            <Text style={[styles.orderStatus, { color: colors.accent }]}>{orderStatus[order.status] || order.status}</Text>
          </Pressable>
          {expanded ? <>
            <View style={[styles.orderItems, { borderTopColor: colors.border }]}>
              {order.items.map((item, index) => (
                <View key={`${order.id}-${index}`} style={styles.orderItem}>
                  <View style={styles.orderItemCopy}>
                    <Text style={[styles.orderItemValue, { color: colors.foreground }]}>{item.quantity} × {item.productName}</Text>
                    <Text style={[styles.muted, { color: colors.mutedForeground }]}>سعر القطعة: {formatPrice(item.unitPriceMinor)} د.ل</Text>
                  </View>
                  <Text style={[styles.orderLineTotal, { color: colors.foreground }]}>{formatPrice(item.quantity * item.unitPriceMinor)} د.ل</Text>
                </View>
              ))}
            </View>
            <View style={[styles.invoiceSummary, { borderTopColor: colors.border }]}>
              <SummaryRow label="مجموع الأصناف" value={order.subtotalMinor} colors={colors} />
              <SummaryRow label="التوصيل" value={order.shippingMinor} colors={colors} />
              <SummaryRow label="الإجمالي" value={order.totalMinor} colors={colors} emphasized />
            </View>
          </> : null}
        </View>;
      })}
    </> : <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
        <Feather name="user" size={27} color={colors.accent} />
      </View>
      <Text style={[styles.profileName, { color: colors.foreground }]}>مساحتك الخاصة</Text>
      <Text style={[styles.muted, { color: colors.mutedForeground, textAlign: 'center' }]}>أنشئ حسابًا لمتابعة بياناتك ومشترياتك.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-up')} style={[styles.saveButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
        <Text style={{ color: colors.primaryForeground }}>إنشاء حساب</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-in')} style={styles.signInLink}>
        <Text style={{ color: colors.primary }}>لديك حساب؟ سجّل الدخول</Text>
      </Pressable>
    </View>}

    <Text style={[styles.footerMark, { color: colors.mutedForeground }]}>ELEGANZA · BEAUTY / 01</Text>
  </ScrollView>;
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={styles.infoRow}>
    <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
  </View>;
}

function SummaryRow({ label, value, colors, emphasized = false }: { label: string; value: number; colors: ReturnType<typeof useColors>; emphasized?: boolean }) {
  return <View style={styles.summaryRow}>
    <Text style={[styles.summaryValue, { color: emphasized ? colors.primary : colors.foreground, fontWeight: emphasized ? '700' : '400' }]}>{formatPrice(value)} د.ل</Text>
    <Text style={[styles.muted, { color: colors.mutedForeground }]}>{label}</Text>
  </View>;
}

function formatPrice(minorUnits: number): string {
  const value = Number(minorUnits) / 100;
  try {
    return new Intl.NumberFormat('ar-LY', { maximumFractionDigits: 2 }).format(value);
  } catch {
    return Number.isFinite(value) ? value.toFixed(2) : '0';
  }
}

const styles = StyleSheet.create({
  pageInner: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 22 },
  heading: { width: '100%', alignItems: 'flex-end', marginBottom: 18 },
  overline: { fontSize: 10, letterSpacing: 1.1, writingDirection: 'rtl' },
  title: { fontFamily: 'serif', fontSize: 32, lineHeight: 41, writingDirection: 'rtl' },
  profileCard: { width: '100%', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', paddingHorizontal: 17, paddingTop: 22, paddingBottom: 18 },
  avatar: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32, marginBottom: 12 },
  profileName: { fontFamily: 'serif', fontSize: 22, textAlign: 'center', writingDirection: 'rtl' },
  infoList: { width: '100%', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingVertical: 4 },
  infoRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 12, writingDirection: 'rtl' },
  infoValue: { flex: 1, textAlign: 'left', fontSize: 13 },
  phoneInput: { width: '100%', minHeight: 48, borderWidth: 1, paddingHorizontal: 12, marginTop: 14, textAlign: 'right' },
  saveButton: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  logoutButton: { width: '100%', minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 12 },
  queryError: { width: '100%', paddingVertical: 12, gap: 8 },
  ordersHeading: { width: '100%', alignItems: 'flex-end', marginTop: 26, marginBottom: 12 },
  sectionTitle: { fontFamily: 'serif', fontSize: 25, lineHeight: 34, writingDirection: 'rtl' },
  emptyOrders: { width: '100%', minHeight: 130, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  orderEmptyTitle: { fontFamily: 'serif', fontSize: 18, writingDirection: 'rtl' },
  muted: { fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
  orderCard: { width: '100%', borderWidth: StyleSheet.hairlineWidth, padding: 14, marginBottom: 12 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  orderHeadingCopy: { alignItems: 'flex-end', gap: 3 },
  orderNumber: { fontSize: 15, fontWeight: '600' },
  orderTotal: { fontSize: 15, fontWeight: '600' },
  orderStatus: { textAlign: 'right', marginTop: 8, fontSize: 13, writingDirection: 'rtl' },
  orderItems: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10, paddingTop: 6 },
  orderItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 5 },
  orderItemCopy: { flex: 1, alignItems: 'flex-end', gap: 3 },
  orderItemValue: { flex: 1, fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
  orderLineTotal: { fontSize: 13, fontWeight: '600' },
  invoiceSummary: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 8, gap: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryValue: { fontSize: 13 },
  signInLink: { minHeight: 46, justifyContent: 'center', alignItems: 'center' },
  footerMark: { marginTop: 28, fontSize: 9, letterSpacing: 1.2 },
});
