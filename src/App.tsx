import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AnimatePresence } from 'framer-motion';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { AuthProvider } from '@/context/AuthContext';
import { DeviceProvider } from '@/context/DeviceContext';
import { CartProvider } from '@/context/CartContext';

// Layout & UI
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MainMobileBottomDock } from '@/components/layout/MainMobileBottomDock';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Particles } from '@/components/ui/Particles';
import { GridBackground, GlowBlobs } from '@/components/ui/Backgrounds';
import { ProtectionScreen } from '@/components/ui/ProtectionScreen';

// Pages
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import CategoryPage from '@/pages/CategoryPage';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import Features from '@/pages/Features';
import FAQ from '@/pages/FAQ';
import TOS from '@/pages/TOS';
import Contact from '@/pages/Contact';
import Login from '@/pages/Login';
import Profile from '@/pages/Profile';
import PaymentSuccess from '@/pages/PaymentSuccess';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import BoostApp from '@/boost/App';

const queryClient = new QueryClient();

function SiteLayout({ children }: { children?: React.ReactNode }) {
  const hostname = window.location.hostname;
  const isDashboardSubdomain = hostname === 'dashboard.sessionguardvip.cc' || hostname.startsWith('dashboard.');

  return (
    <>
      <ProtectionScreen />
      <LoadingScreen />
      <GridBackground />
      <GlowBlobs />
      <Particles />
      <div className="relative z-10 flex flex-col min-h-screen selection:bg-white selection:text-black">
        <Navbar />
        <main className="flex-grow">
          <AnimatePresence mode="wait">
            {children || (
              isDashboardSubdomain ? (
                <Switch>
                  <Route path="/" component={Dashboard} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/login" component={Login} />
                  <Route component={Dashboard} />
                </Switch>
              ) : (
                <Switch>
                  <Route path="/" component={Home} />
                  <Route path="/shop" component={Shop} />
                  <Route path="/shop/category/:categoryId" component={CategoryPage} />
                  <Route path="/shop/product/:productId" component={ProductDetail} />
                  <Route path="/checkout" component={Checkout} />
                  <Route path="/features" component={Features} />
                  <Route path="/faq" component={FAQ} />
                  <Route path="/tos" component={TOS} />
                  <Route path="/contact" component={Contact} />
                  <Route path="/login" component={Login} />
                  <Route path="/profile" component={Profile} />
                  <Route path="/payment/success" component={PaymentSuccess} />
                  <Route path="/reset-password" component={ResetPassword} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/boost/:rest*" component={BoostApp} />
                  <Route path="/boost" component={BoostApp} />
                  <Route component={NotFound} />
                </Switch>
              )
            )}
          </AnimatePresence>
        </main>
        <Footer />
        {!isDashboardSubdomain && <MainMobileBottomDock />}
      </div>
    </>
  );
}

function App() {
  const hostname = window.location.hostname;

  // ── Boost Subdomain ──────────────────────────────────────────────
  if (hostname === 'boost.sessionguardvip.cc' || hostname.startsWith('boost.')) {
    return (
      <QueryClientProvider client={queryClient}>
        <DeviceProvider>
          <TooltipProvider>
            <BoostApp />
            <Toaster />
          </TooltipProvider>
        </DeviceProvider>
      </QueryClientProvider>
    );
  }

  // ── Admin Subdomain ──────────────────────────────────────────────
  if (hostname === 'admin.sessionguardvip.cc' || hostname.startsWith('admin.')) {
    return (
      <QueryClientProvider client={queryClient}>
        <DeviceProvider>
          <AuthProvider>
          <CurrencyProvider>
          <TooltipProvider>
            <Admin />
            <Toaster />
          </TooltipProvider>
          </CurrencyProvider>
          </AuthProvider>
        </DeviceProvider>
      </QueryClientProvider>
    );
  }

  // ── Main Domain ───────────────────────────────────
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <AuthProvider>
        <CurrencyProvider>
        <CartProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Switch>
              <Route path="/admin" component={Admin} />
              <Route component={SiteLayout} />
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
        </CartProvider>
        </CurrencyProvider>
        </AuthProvider>
      </DeviceProvider>
    </QueryClientProvider>
  );
}

export default App;
