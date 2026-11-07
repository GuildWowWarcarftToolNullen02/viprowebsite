import { Switch, Route } from 'wouter';
import { AnimatePresence } from 'framer-motion';
import { DeviceProvider }  from '@/boost/context/DeviceContext';
import { Navbar }          from '@/boost/components/layout/Navbar';
import { Footer }          from '@/boost/components/layout/Footer';
import { LoadingScreen }   from '@/boost/components/ui/LoadingScreen';
import { Backgrounds }     from '@/boost/components/ui/Backgrounds';
import { Particles }       from '@/boost/components/ui/Particles';
import Home           from '@/boost/pages/Home';
import PaymentSuccess from '@/boost/pages/PaymentSuccess';
import TOS            from '@/boost/pages/TOS';
import Privacy        from '@/boost/pages/Privacy';
import Refund         from '@/boost/pages/Refund';
import NotFound       from '@/boost/pages/NotFound';
import './index.css';

export default function App() {
  return (
    <DeviceProvider>
      <div className="boost-site-root">
        <LoadingScreen />
        <Backgrounds />
        <Particles />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Switch>
                <Route path="/"                component={Home} />
                <Route path="/payment/success" component={PaymentSuccess} />
                <Route path="/tos"             component={TOS} />
                <Route path="/privacy"         component={Privacy} />
                <Route path="/refund"          component={Refund} />
                <Route                         component={NotFound} />
              </Switch>
            </AnimatePresence>
          </main>
          <Footer />
        </div>
      </div>
    </DeviceProvider>
  );
}
