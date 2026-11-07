import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { Check, ExternalLink, ChevronRight, Package, Grid3x3, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrency, convertPrice } from '@/context/CurrencyContext';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { ProductCard } from '@/components/shop/ProductCard';
import { productsApi, type ExudosProduct, type ProductsResponse } from '@/lib/api/store';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

const base = import.meta.env.BASE_URL;

const ToolLogo = () => (
  <img src={`${base}msk-logo.png`} alt="MSK Hub" className="w-9 h-9 object-contain" />
);

// Categories configuration - Matching Exudos color scheme exactly
const categories = [
  { 
    id: 'accounts', 
    name: 'Accounts', 
    description: 'Premium gaming and social accounts', 
    apiCategory: 'Accounts',
    bgColor: 'bg-[#1e3a5f]',
    hoverBg: 'hover:bg-[#2a4670]',
    borderColor: 'border-[#2a4670]',
    brands: [
      { name: 'Epic', color: '#0078F2' },
      { name: 'Steam', color: '#1B2838' },
      { name: 'Xbox', color: '#107C10' }
    ]
  },
  { 
    id: 'streaming', 
    name: 'Streaming', 
    description: 'Netflix, Disney+, HBO and more', 
    apiCategory: 'Streaming',
    bgColor: 'bg-[#4a1f1f]',
    hoverBg: 'hover:bg-[#5a2a2a]',
    borderColor: 'border-[#5a2a2a]',
    brands: [
      { name: 'Netflix', color: '#E50914' },
      { name: 'Disney+', color: '#0063E5' },
      { name: 'HBO', color: '#000000' }
    ]
  },
  { 
    id: 'music', 
    name: 'Music', 
    description: 'Premium music streaming services', 
    apiCategory: 'Music',
    bgColor: 'bg-[#1f4a2f]',
    hoverBg: 'hover:bg-[#2a5a3f]',
    borderColor: 'border-[#2a5a3f]',
    brands: [
      { name: 'Spotify', color: '#1DB954' },
      { name: 'Apple', color: '#FA243C' },
      { name: 'Tidal', color: '#000000' }
    ]
  },
  { 
    id: 'ai', 
    name: 'AI Tools', 
    description: 'ChatGPT, Midjourney and more', 
    apiCategory: 'AI',
    bgColor: 'bg-[#3a2f5f]',
    hoverBg: 'hover:bg-[#4a3f6f]',
    borderColor: 'border-[#4a3f6f]',
    brands: [
      { name: 'ChatGPT', color: '#10A37F' },
      { name: 'MJ', color: '#FF6FFF' },
      { name: 'Claude', color: '#D97757' }
    ]
  },
  { 
    id: 'software-tools', 
    name: 'Software', 
    description: 'Professional software licenses', 
    apiCategory: 'Software & Tools',
    bgColor: 'bg-[#4a3a1f]',
    hoverBg: 'hover:bg-[#5a4a2f]',
    borderColor: 'border-[#5a4a2f]',
    brands: [
      { name: 'Adobe', color: '#FF0000' },
      { name: 'Office', color: '#D83B01' },
      { name: 'Canva', color: '#00C4CC' }
    ]
  },
  { 
    id: 'vpn-privacy', 
    name: 'VPN & Privacy', 
    description: 'Secure VPN and privacy tools', 
    apiCategory: 'VPN & Privacy',
    bgColor: 'bg-[#1f3a4a]',
    hoverBg: 'hover:bg-[#2a4a5a]',
    borderColor: 'border-[#2a4a5a]',
    brands: [
      { name: 'Nord', color: '#4687FF' },
      { name: 'Express', color: '#DA3846' },
      { name: 'Surf', color: '#00B8D4' }
    ]
  },
  { 
    id: 'social-boosts', 
    name: 'Social Boosts', 
    description: 'Grow your social presence', 
    apiCategory: 'Social Boost',
    bgColor: 'bg-[#4a1f3a]',
    hoverBg: 'hover:bg-[#5a2a4a]',
    borderColor: 'border-[#5a2a4a]',
    brands: [
      { name: 'IG', color: '#E4405F' },
      { name: 'X', color: '#000000' },
      { name: 'TikTok', color: '#FE2C55' }
    ]
  },
  { 
    id: 'discord-services', 
    name: 'Discord', 
    description: 'Nitro, boosts and more', 
    apiCategory: 'Discord Services',
    bgColor: 'bg-[#2f1f4a]',
    hoverBg: 'hover:bg-[#3f2f5a]',
    borderColor: 'border-[#3f2f5a]',
    brands: [
      { name: 'Nitro', color: '#5865F2' },
      { name: 'Boost', color: '#FF73FA' },
      { name: 'Emote', color: '#FEE75C' }
    ]
  },
];

// MSK Tools (always featured)
type Tier = { label: string; plan: string; usd: number; period: string; highlight: boolean };

const mskTools = [
  {
    id: 'token-g',
    name: 'MSK Token-G',
    banner: 'banner-token-g.png',
    tagline: 'Professional Discord token generator',
    desc: 'The premier solution for automated account generation. Built to bypass modern restrictions with advanced fingerprinting, smart humanization, and multi-method support.',
    youtubeUrl: 'https://youtu.be/hNJvsbeRi_A?si=8Z19H1b6PTqB1k47',
    tiers: [
      { label: 'Monthly',        plan: 'monthly',  usd: 15,  period: '/mo',       highlight: false },
      { label: 'Lifetime',       plan: 'lifetime', usd: 20,  period: ' one-time', highlight: true  },
      { label: 'Src GUI Rebrand',plan: 'source',   usd: 120, period: ' one-time', highlight: false },
    ] as Tier[],
    features: [
      'Phone Verify Auto (5sim, HeroSMS)', 'Auto Captcha Solver', 'Humanizer',
      'Custom Fingerprint', 'Hotmails Support', 'Mailcow Support',
      'Custom Mails Support', 'Token Manager', 'Smart Thread',
      'Multi-Thread Support', 'Proxy Support', 'Own IP Support',
      'VPN Support', 'Real Usernames', 'Multi-Methods',
      'NopeCHA Support', 'Token Checker', 'Token Splitter',
    ],
  },
  {
    id: 'raider',
    name: 'MSK Raider Tool',
    banner: 'banner-raider-tool.png',
    tagline: 'Mass-action Discord tool for advanced users',
    desc: 'Execute massive operations across thousands of accounts. Unparalleled control over your token infrastructure with 55+ modules and zero-latency execution.',
    youtubeUrl: 'https://youtu.be/oig1X8bB8PA?si=-O1fYUi8X8DW9GE3',
    tiers: [
      { label: 'Monthly',  plan: 'monthly',  usd: 10, period: '/mo',       highlight: false },
      { label: 'Lifetime', plan: 'lifetime', usd: 20, period: ' one-time', highlight: true  },
      { label: 'Src',      plan: 'source',   usd: 60, period: ' one-time', highlight: false },
    ] as Tier[],
    features: [
      'Token Checker', 'Token Onliner', 'Token Joiner', 'Token Leaver', 'Token Sorter', 'Token Info',
      'Token Editor', 'Token Humanizer', 'Token Fake Type', 'Status Rotater', 'ID to Token', 'Proxy Checker',
      'Channel Spammer', 'Reaction Spammer', 'Reply Spammer', 'Forum Spammer', 'Audit Spammer', 'Ghost Spammer',
      'Thread Spammer', 'Poll Spammer', 'Sticker Spammer', 'MultiCh Spammer', 'Ping Spammer', 'DM Spammer',
      'OwnerDM Spammer', 'Mass Send', 'Server Crasher', 'Server Cloner', 'Member Scraper', 'Invite Scraper',
      'Leave All Servers', 'Anti Ban', 'VC Joiner', 'VC Spam Joiner', 'VC Crasher', 'Mass SoundBoard',
      'VC YouTube Audio', 'Mass Friend', 'Mass Report', 'Mass Ticket', 'Giveaway Joiner', 'Spam Call',
      'Reaction Bypass', 'Button Bypass', 'Rule Bypass', 'Onboarding Bypass', 'Vaultcord Bypass', 'Captcha Remover',
      'hCaptcha Solver', 'Browser Solver', 'QR Token Logger', 'Chat Mirror', 'Webhook Spammer', 'Webhook Deleter',
      'Multi Joiner', 'AI Talker', 'Voucher',
    ],
  },
];

// MSK Tool Card Component
function MSKToolCard({ product, idx, onBuy }: {
  product: typeof mskTools[0];
  idx: number;
  onBuy: (product: typeof mskTools[0], plan: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const { currency } = useCurrency();
  const visibleFeatures = showAll ? product.features : product.features.slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.15, duration: 0.5 }}
      className="glass-card flex flex-col"
    >
      {product.banner && (
        <div className="overflow-hidden rounded-t-xl">
          <img
            src={`${base}${product.banner}`}
            alt={`${product.name} banner`}
            className="w-full h-48 object-cover object-center"
          />
        </div>
      )}

      <div className="p-5 sm:p-8 border-b border-white/10">
        <div className="mb-5">
          <ToolLogo />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-1">{product.name}</h2>
        <p className="text-accent text-xs sm:text-sm font-medium mb-3">{product.tagline}</p>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{product.desc}</p>
      </div>

      <div className="p-5 sm:p-8 border-b border-white/10">
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Pricing</h4>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {product.tiers.map((tier) => (
            <div
              key={tier.label}
              className={`rounded-xl border p-2.5 sm:p-4 text-center transition-colors ${
                tier.highlight ? 'border-white/30 bg-white/8' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <div className="text-[11px] text-muted-foreground mb-1">{tier.label}</div>
              <div className="text-sm sm:text-xl font-black text-white">{convertPrice(tier.usd, currency)}</div>
              <div className="text-[9px] sm:text-[10px] text-white/40">{tier.period}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 sm:p-8 flex-grow flex flex-col">
        <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Features</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {visibleFeatures.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 border border-white/8 rounded-md px-2.5 py-1"
            >
              <Check size={10} className="text-white/50 shrink-0" />
              {f}
            </span>
          ))}
        </div>
        {product.features.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors mt-1 text-left"
          >
            {showAll ? 'Show less' : `+ ${product.features.length - 12} more features`}
          </button>
        )}

        <div className="mt-auto pt-6 flex gap-3">
          <button
            onClick={() => onBuy(product, 'lifetime')}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            style={{ flexBasis: '80%' }}
          >
            Buy Now
          </button>
          <a
            href={product.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary flex items-center justify-center gap-1.5 text-sm"
            style={{ flexBasis: '20%' }}
            title="Watch demo"
          >
            <ExternalLink size={13} />
            View
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// Main Shop Page
export default function Shop() {
  const [_location, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductsResponse | null>(null);
  const [searchResults, setSearchResults] = useState<ExudosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Get search query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get('search');
    if (search) {
      setSearchQuery(search);
      performSearch(search);
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Unable to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  async function performSearch(query: string) {
    try {
      const results = await productsApi.search(query);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  }

  function goToCheckout(product: typeof mskTools[0], plan: string) {
    navigate(`/checkout?product=${product.id}&plan=${plan}`);
  }

  async function handleAddToCart(product: ExudosProduct) {
    const variant = product.variants[0]; // Use first variant
    if (!variant || !variant.inStock) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addToCart({
        type: 'exudos-product',
        exudosProductId: product.id,
        exudosVariantId: variant.id,
        productName: product.name,
        category: product.category,
        quantity: 1,
        unitPrice: variant.price,
      });

      toast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-6"
          >
            THE ARSENAL
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Premium tooling and digital products for those who demand performance.
          </motion.p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={48} className="text-accent animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-8 text-center mb-16">
            <Package size={48} className="text-red-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Products</h3>
            <p className="text-white/60 mb-4">{error}</p>
            <button onClick={fetchProducts} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && products && (
          <>
            {/* EXUDOS CATEGORIES - TEMPORARILY HIDDEN UNTIL BANNERS ARE READY */}
            {/* 
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-8">
                <Grid3x3 size={24} className="text-white/70" />
                <h2 className="text-3xl font-black text-white">Shop by Category</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categories.map((category, idx) => {
                  const productCount = products.categories[category.apiCategory]?.length || 0;
                  
                  // Determine if category has banner
                  const categoryBanners: Record<string, string> = {
                    'accounts': 'accounts-banner.png',
                    'streaming': 'streaming-banner.png',
                    'music': 'music-banner.png',
                    'ai': 'ai-banner.png',
                    'software-tools': 'software-banner.png',
                    'vpn-privacy': 'vpn-banner.png',
                    'social-boost': 'social-boost-banner.png',
                    // 'discord-services': will be added later
                  };
                  
                  const hasBanner = categoryBanners[category.id];
                  
                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      onClick={() => navigate(`/shop/category/${category.id}`)}
                      className={`relative overflow-hidden rounded-2xl ${hasBanner ? '' : 'border ' + category.borderColor} ${hasBanner ? '' : category.bgColor + ' ' + category.hoverBg} p-7 text-left transition-all duration-300 group shadow-lg hover:shadow-xl`}
                      style={hasBanner ? {
                        backgroundImage: `url(${base}${categoryBanners[category.id]})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        aspectRatio: '1.06',
                      } : {}}
                    >
                      {!hasBanner && (
                        <div className="flex items-center gap-2.5 mb-6">
                          {category.brands.map((brand, i) => (
                            <div 
                              key={i}
                              className="w-11 h-11 rounded-lg bg-white/[0.08] backdrop-blur-sm border border-white/10 flex items-center justify-center text-[11px] font-bold text-white text-center leading-none group-hover:bg-white/[0.12] transition-all"
                              style={{ 
                                boxShadow: `0 0 0 1px ${brand.color}15 inset`
                              }}
                            >
                              {brand.name}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {hasBanner && <div className="h-32" />}

                      <div className="space-y-2 mb-4">
                        <h3 className="text-lg font-black text-white leading-tight">
                          {category.name}
                        </h3>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {category.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/[0.08]">
                        {productCount > 0 ? (
                          <span className="text-xs font-bold text-white/70 uppercase tracking-wide">
                            {productCount} {productCount === 1 ? 'item' : 'items'}
                          </span>
                        ) : (
                          <span className="text-xs text-white/40 uppercase tracking-wide">Coming soon</span>
                        )}
                        <ChevronRight size={16} className="text-white/40 group-hover:translate-x-1 group-hover:text-white/70 transition-all" />
                      </div>

                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.03] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
            */}

            {/* Featured MSK Tools */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-16"
            >
              <div className="flex items-center gap-3 mb-6">
                <Package size={20} className="text-accent" />
                <h2 className="text-2xl font-black text-white">Featured Tools</h2>
              </div>
              <div className="grid lg:grid-cols-2 gap-10">
                {mskTools.map((product, idx) => (
                  <MSKToolCard key={product.id} product={product} idx={idx} onBuy={goToCheckout} />
                ))}
              </div>
            </motion.div>

            {/* Search Results */}
            {searchQuery && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-16"
              >
                <h2 className="text-2xl font-black text-white mb-6">
                  Search Results for "{searchQuery}"
                </h2>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {searchResults.map((product, idx) => (
                      <ProductCard
                        key={product.id}
                        productId={product.id}
                        name={product.name}
                        price={product.variants[0]?.price || 0}
                        category={product.category}
                        inStock={product.variants[0]?.inStock || false}
                        delay={idx * 0.1}
                        onAddToCart={() => handleAddToCart(product)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="glass-card p-8 text-center">
                    <Package size={48} className="text-white/20 mx-auto mb-4" />
                    <p className="text-white/60 mb-4">No products found matching "{searchQuery}"</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        navigate('/shop');
                      }}
                      className="btn-secondary"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
