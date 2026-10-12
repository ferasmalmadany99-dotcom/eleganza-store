import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
import { useSignUp } from '@clerk/react/legacy';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import Storefront from './Storefront';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminInventory from './pages/admin/Inventory';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';
import AdminExpenses from './pages/admin/Expenses';
import AdminTeam from './pages/admin/Team';
import AdminAudit from './pages/admin/Audit';
import AdminDemo from './pages/AdminDemo';
import AdminDemoAccounting from './pages/AdminDemoAccounting';
import AdminAccounting from './pages/admin/Accounting';
import AdminSystemSettings from './pages/admin/SystemSettings';
import AdminLayout from './components/admin/AdminLayout';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(15, 50%, 48%)",
    colorForeground: "hsl(31, 21%, 19%)",
    colorMutedForeground: "hsl(30, 10%, 43%)",
    colorDanger: "hsl(2, 54%, 45%)",
    colorBackground: "hsl(39, 36%, 97%)",
    colorInput: "transparent",
    colorInputForeground: "hsl(31, 21%, 19%)",
    colorNeutral: "hsl(35, 18%, 83%)",
    fontFamily: "var(--app-font-sans)",
    borderRadius: "0.18rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden shadow-sm border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-2xl font-display text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    formFieldSuccessText: "text-primary",
    alertText: "text-destructive",
    logoBox: "mb-6 flex justify-center",
    logoImage: "h-8",
    socialButtonsBlockButton: "border-border hover:bg-muted/50 transition-colors",
    formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm",
    formFieldInput: "border-input bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-ring",
    footerAction: "border-t border-border pt-4 mt-4",
    dividerLine: "bg-border",
    alert: "bg-destructive/10 border-destructive/20",
    otpCodeFieldInput: "border-input text-foreground focus:ring-ring",
    formFieldRow: "mb-4",
    main: "w-full",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/admin`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/admin`} />
    </div>
  );
}

function CustomerSignInPage() {
  const isAr = window.localStorage.getItem("eleganza-language") === "ar";
  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/customer-sign-in`} signUpUrl={`${basePath}/customer-sign-up`} forceRedirectUrl={`${basePath}/`} />
    </div>
  );
}

function CustomerSignUpPage() {
  const isAr = window.localStorage.getItem("eleganza-language") === "ar";
  const { isLoaded, signUp, setActive } = useSignUp();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"details" | "verify">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const saveCustomerProfile = async (sessionId: string | null) => {
    if (!isLoaded || !setActive || !sessionId) {
      throw new Error(isAr ? "لم يكتمل إنشاء جلسة الحساب." : "The customer session could not be started.");
    }
    await setActive({ session: sessionId });
    const response = await fetch("/api/storefront/customers/profile", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerName: fullName.trim(), customerPhone: phone.trim() }),
    });
    if (!response.ok) throw new Error(isAr ? "تم إنشاء الحساب لكن تعذر حفظ بيانات الزبون. سجّل الدخول وحاول مرة أخرى." : "Account created, but the customer profile could not be saved. Sign in and try again.");
    setLocation("/");
  };
  const submitDetails = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || !signUp) return;
    setBusy(true);
    setError("");
    try {
      const parts = fullName.trim().split(/\s+/);
      await signUp.create({ emailAddress: email.trim(), password, firstName: parts[0], lastName: parts.slice(1).join(" ") });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep("verify");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isAr ? "تعذر إنشاء الحساب." : "Could not create the account."));
    } finally {
      setBusy(false);
    }
  };
  const submitCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || !signUp) return;
    setBusy(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code: code.trim() });
      if (result.status !== "complete" || !result.createdSessionId) throw new Error(isAr ? "رمز التحقق غير صحيح أو لم يكتمل." : "The verification code is invalid or incomplete.");
      await saveCustomerProfile(result.createdSessionId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isAr ? "تعذر التحقق من البريد." : "Email verification failed."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <section className="w-full max-w-md border border-border bg-card p-7 shadow-xl sm:p-9">
        <p className="font-mono-ui text-xs uppercase tracking-[.2em] text-primary">Eleganza</p>
        <h1 className="mt-3 font-display text-3xl">{step === "verify" ? (isAr ? "تحقق من بريدك الإلكتروني" : "Verify your email") : (isAr ? "إنشاء حساب زبون" : "Create customer account")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{step === "verify" ? (isAr ? `أدخل رمز التأكيد المرسل إلى ${email}` : `Enter the verification code sent to ${email}`) : (isAr ? "أدخل بياناتك لإنشاء حساب للمتجر." : "Enter your details to create a store account.")}</p>
        {step === "details" ? <form className="mt-6 grid gap-4" onSubmit={submitDetails}>
          <input className="h-11 border border-border bg-background px-3 text-sm" required minLength={2} maxLength={120} autoComplete="name" placeholder={isAr ? "الاسم الكامل" : "Full name"} value={fullName} onChange={(event) => setFullName(event.target.value)} />
          <input className="h-11 border border-border bg-background px-3 text-sm" required minLength={5} maxLength={40} type="tel" autoComplete="tel" placeholder={isAr ? "رقم الهاتف" : "Phone number"} value={phone} onChange={(event) => setPhone(event.target.value)} />
          <input className="h-11 border border-border bg-background px-3 text-sm" required type="email" autoComplete="email" placeholder={isAr ? "البريد الإلكتروني" : "Email"} value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="h-11 border border-border bg-background px-3 text-sm" required minLength={8} type="password" autoComplete="new-password" placeholder={isAr ? "كلمة المرور" : "Password"} value={password} onChange={(event) => setPassword(event.target.value)} />
          <button disabled={!isLoaded || busy} className="h-11 bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? (isAr ? "جارٍ الإنشاء…" : "Creating…") : (isAr ? "إنشاء الحساب وإرسال الرمز" : "Create account and send code")}</button>
        </form> : <form className="mt-6 grid gap-4" onSubmit={submitCode}>
          <input className="h-11 border border-border bg-background px-3 text-center text-lg tracking-[.3em]" required inputMode="numeric" autoComplete="one-time-code" placeholder={isAr ? "رمز التأكيد" : "Verification code"} value={code} onChange={(event) => setCode(event.target.value)} />
          <button disabled={busy} className="h-11 bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-60">{busy ? (isAr ? "جارٍ التحقق…" : "Verifying…") : (isAr ? "تأكيد وإنشاء الحساب" : "Verify and create account")}</button>
        </form>}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        <p className="mt-6 text-center text-sm text-muted-foreground">{isAr ? "لديك حساب؟" : "Already registered?"} <a className="font-semibold text-primary underline" href={`${basePath}/customer-sign-in`}>{isAr ? "تسجيل الدخول" : "Sign in"}</a></p>
        <a className="mt-4 block text-center text-sm text-muted-foreground underline" href={`${basePath}/`}>{isAr ? "العودة إلى المتجر" : "Back to store"}</a>
      </section>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

// Ensure the user is fully logged in and ready for the admin route
function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <Component />
    </AdminLayout>
  );
}

function ClerkProviderWithRoutes() {
  const [location, setLocation] = useLocation();
  const isCustomerAuth = location.startsWith("/customer-sign-");
  const isArabic = window.localStorage.getItem("eleganza-language") === "ar";

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: isCustomerAuth
          ? { start: { title: isArabic ? "مرحبًا بعودتك" : "Welcome back", subtitle: isArabic ? "سجّل الدخول لمتابعة التسوق" : "Sign in to continue shopping" } }
          : {
              start: {
                title: "Eleganza Operations",
                subtitle: "Sign in to access your workspace",
              },
          },
        signUp: isCustomerAuth
          ? { start: { title: isArabic ? "حساب زبون جديد" : "Create your customer account", subtitle: isArabic ? "أنشئ حسابًا لمتابعة التسوق" : "Create an account to continue shopping" } }
          : {
              start: {
                title: "Join Eleganza",
                subtitle: "Create your workspace account",
              },
          },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={Storefront} />
          <Route path="/customer-sign-in/*?" component={CustomerSignInPage} />
          <Route path="/customer-sign-up/*?" component={CustomerSignUpPage} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/admin-demo" component={AdminDemo} />
          <Route path="/admin-demo/accounting" component={AdminDemoAccounting} />
          <Route path="/admin">
            {() => <AdminRoute component={AdminDashboard} />}
          </Route>
          <Route path="/admin/products">
            {() => <AdminRoute component={AdminProducts} />}
          </Route>
          <Route path="/admin/inventory">
            {() => <AdminRoute component={AdminInventory} />}
          </Route>
          <Route path="/admin/orders">
            {() => <AdminRoute component={AdminOrders} />}
          </Route>
          <Route path="/admin/customers">
            {() => <AdminRoute component={AdminCustomers} />}
          </Route>
          <Route path="/admin/expenses">
            {() => <AdminRoute component={AdminExpenses} />}
          </Route>
          <Route path="/admin/team">
            {() => <AdminRoute component={AdminTeam} />}
          </Route>
          <Route path="/admin/audit">
            {() => <AdminRoute component={AdminAudit} />}
          </Route>
          <Route path="/admin/system">
            {() => <AdminRoute component={AdminSystemSettings} />}
          </Route>
          <Route path="/admin/accounting">
            {() => <AdminRoute component={AdminAccounting} />}
          </Route>
          {/* Catch-all redirect to / if missing */}
          <Route path="/:rest*">
            <Redirect to="/" />
          </Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
