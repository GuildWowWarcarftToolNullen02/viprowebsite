import { PageWrapper } from '@/components/layout/PageWrapper';
import { motion } from 'framer-motion';
import { useRoute, Link } from 'wouter';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/shop/ProductCard';
import { productsApi, type ExudosProduct, type ProductsResponse } from '@/lib/api/store';
import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';

// Category definitions - Matching Exudos color scheme exactly
const categoryData: Record<string, { name: string; description: string; apiCategory: string; bgColor: string; borderColor: string }> = {
  'accounts': { 
    name: 'Accounts', 
    description: 'Premium gaming and social media accounts', 
    apiCategory: 'Accounts',
    bgColor: 'bg-[#1e3a5f]',
    borderColor: 'border-[#2a4670]'
  },
  'streaming': { 
    name: 'Streaming Services', 
    description: 'Netflix, Disney+, HBO and more', 
    apiCategory: 'Streaming',
    bgColor: 'bg-[#4a1f1f]',
    borderColor: 'border-[#5a2a2a]'
  },
  'music': { 
    name: 'Music Services', 
    description: 'Premium music streaming services', 
    apiCategory: 'Music',
    bgColor: 'bg-[#1f4a2f]',
    borderColor: 'border-[#2a5a3f]'
  },
  'ai': { 
    name: 'AI Tools', 
    description: 'ChatGPT, Midjourney and AI services', 
    apiCategory: 'AI',
    bgColor: 'bg-[#3a2f5f]',
    borderColor: 'border-[#4a3f6f]'
  },
  'software-tools': { 
    name: 'Software & Tools', 
    description: 'Professional software licenses', 
    apiCategory: 'Software & Tools',
    bgColor: 'bg-[#4a3a1f]',
    borderColor: 'border-[#5a4a2f]'
  },
  'vpn-privacy': { 
    name: 'VPN & Privacy', 
    description: 'Secure VPN and privacy tools', 
    apiCategory: 'VPN & Privacy',
    bgColor: 'bg-[#1f3a4a]',
    borderColor: 'border-[#2a4a5a]'
  },
  'social-boosts': { 
    name: 'Social Boosts', 
    description: 'Grow your social media presence', 
    apiCategory: 'Social Boost',
    bgColor: 'bg-[#4a1f3a]',
    borderColor: 'border-[#5a2a4a]'
  },
  'discord-services': { 
    name: 'Discord Services', 
    description: 'Discord Nitro, boosts and more', 
    apiCategory: 'Discord Services',
    bgColor: 'bg-[#2f1f4a]',
    borderColor: 'border-[#3f2f5a]'
  },
};

export default function CategoryPage() {
  const [match, params] = useRoute('/shop/category/:categoryId');
  const categoryId = params?.categoryId || '';
  const category = categoryData[categoryId];

  const [products, setProducts] = useState<ExudosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Fetch products for this category
  useEffect(() => {
    if (category?.apiCategory) {
      fetchCategoryProducts();
    }
  }, [category?.apiCategory]);

  async function fetchCategoryProducts() {
    try {
      setLoading(true);
      setError(null);
      const data = await productsApi.getAll();
      const categoryProducts = data.categories[category.apiCategory] || [];
      setProducts(categoryProducts);
    } catch (err) {
      console.error('Failed to fetch category products:', err);
      setError('Unable to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
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

  if (!match || !category) {
    return (
      <PageWrapper>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h1 className="text-3xl font-black text-white mb-4">Category Not Found</h1>
          <Link href="/shop" className="btn-primary inline-block">
            Back to Shop
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Breadcrumb */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft size={16} />
          Back to Shop
        </Link>

        {/* Category Header - Exudos Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-16 rounded-2xl border ${category.borderColor} ${category.bgColor} backdrop-blur-sm p-10 shadow-lg`}
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
              <Package size={40} className="text-white/70" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
                {category.name}
              </h1>
              <p className="text-lg text-white/60 mb-2">
                {category.description}
              </p>
              {!loading && !error && (
                <p className="text-sm text-white/50">
                  {products.length} {products.length === 1 ? 'product' : 'products'} available
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={48} className="text-accent animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="glass-card p-8 text-center">
            <Package size={48} className="text-red-400/50 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Products</h3>
            <p className="text-white/60 mb-4">{error}</p>
            <button onClick={fetchCategoryProducts} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Products Grid - Larger cards with better spacing */}
        {!loading && !error && products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                productId={product.id}
                name={product.name}
                price={product.variants[0]?.price || 0}
                category={category.name}
                inStock={product.variants[0]?.inStock || false}
                delay={idx * 0.05}
                onAddToCart={() => handleAddToCart(product)}
              />
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-12 text-center"
          >
            <Package size={64} className="text-white/20 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">
              No Products Available
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              We're currently restocking products in this category. Check back soon!
            </p>
            <Link href="/shop" className="btn-primary inline-block">
              Browse All Categories
            </Link>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
