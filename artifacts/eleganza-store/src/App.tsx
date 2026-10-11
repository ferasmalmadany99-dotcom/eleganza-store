import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from '@clerk/react';
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
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Eleganza Operations",
            subtitle: "Sign in to access your workspace",
          },
        },
        signUp: {
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
