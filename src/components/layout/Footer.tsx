import { Link, useLocation } from 'wouter';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
  const base = import.meta.env.BASE_URL;
  const [location] = useLocation();

  const handleFaqClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location === '/') {
      document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#faq';
    }
  };

  const hostname = window.location.hostname;
  const isSubdomain = hostname !== 'sessionguardvip.cc' && hostname !== 'www.sessionguardvip.cc' && !hostname.includes('localhost');
  const mainDomainUrl = (path: string) => isSubdomain ? `https://sessionguardvip.cc${path}` : path;

  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-sm relative z-10 pt-20 sm:pt-28 pb-24 md:pb-8 mt-16 sm:mt-24">
      {/* Apex - centered on the section boundary, 50% above / 50% below */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-20">
        <div className="relative flex items-center justify-center">
          {/* glow */}
          <div className="absolute w-36 sm:w-48 h-36 sm:h-48 rounded-full bg-white/5 blur-[50px]" />
          <img
            src={`${base}apex-model.png`}
            alt="Apex"
            className="relative w-28 sm:w-40 h-28 sm:h-40 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.18)] animate-[apexFloat_4s_ease-in-out_infinite]"
          />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            {isSubdomain ? (
              <a href={mainDomainUrl('/')} className="flex items-center gap-2 mb-4 inline-flex">
                <img src={`${import.meta.env.BASE_URL}vippro-logo.png`} alt="VipPro" className="h-9 w-auto object-contain" />
                <span className="text-3xl font-black text-white tracking-tighter">Vip</span>
                <span className="text-xl font-medium text-accent -ml-1">Pro</span>
              </a>
            ) : (
              <Link href="/" className="flex items-center gap-2 mb-4 inline-flex">
                <img src={`${import.meta.env.BASE_URL}vippro-logo.png`} alt="VipPro" className="h-9 w-auto object-contain" />
                <span className="text-3xl font-black text-white tracking-tighter">Vip</span>
                <span className="text-xl font-medium text-accent -ml-1">Pro</span>
              </Link>
            )}
            <p className="text-muted-foreground max-w-sm mb-6">
              Premium Discord tools and software. Technical precision, no compromise, pure power. Built for advanced users.
            </p>
            <a 
              href="https://discord.gg/BcwHsh3zBk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white hover:text-accent transition-colors font-medium"
            >
              Join the Community <ArrowUpRight size={16} />
            </a>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Products</h4>
            <ul className="space-y-3">
              <li>
                {isSubdomain ? <a href={mainDomainUrl('/shop')} className="text-muted-foreground hover:text-white transition-colors">VipPro Token-G</a> : <Link href="/shop" className="text-muted-foreground hover:text-white transition-colors">VipPro Token-G</Link>}
              </li>
              <li>
                {isSubdomain ? <a href={mainDomainUrl('/shop')} className="text-muted-foreground hover:text-white transition-colors">VipPro Raider Tool</a> : <Link href="/shop" className="text-muted-foreground hover:text-white transition-colors">VipPro Raider Tool</Link>}
              </li>
              <li>
                {isSubdomain ? <a href={mainDomainUrl('/features')} className="text-muted-foreground hover:text-white transition-colors">Features Overview</a> : <Link href="/features" className="text-muted-foreground hover:text-white transition-colors">Features Overview</Link>}
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <a href="#faq" onClick={handleFaqClick} className="text-muted-foreground hover:text-white transition-colors cursor-pointer">FAQ</a>
              </li>
              <li>
                {isSubdomain ? <a href={mainDomainUrl('/contact')} className="text-muted-foreground hover:text-white transition-colors">Contact Us</a> : <Link href="/contact" className="text-muted-foreground hover:text-white transition-colors">Contact Us</Link>}
              </li>
              <li>
                {isSubdomain ? <a href={mainDomainUrl('/tos')} className="text-muted-foreground hover:text-white transition-colors">Terms of Service</a> : <Link href="/tos" className="text-muted-foreground hover:text-white transition-colors">Terms of Service</Link>}
              </li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 VipPro. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
