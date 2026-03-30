
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Truck, RefreshCcw, CreditCard, Clock, Upload, X, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import TextRotatorSection from '../components/TextRotatorSection';
import { Product, User as UserType } from '../types';
import { fetchHeroImages, fetchCategories, fetchReviews, fetchTags, fetchWebsiteConfig, uploadImage, createReview } from '../src/api';
import { DUMMY_HERO_IMAGES, DUMMY_CATEGORIES_DATA, DUMMY_TAGS, DUMMY_REVIEWS } from '../constants';
import { getOptimizedUrl, getThumbnailUrl } from '../src/utils/cloudinary';

interface HomePageProps {
  products: Product[];
  addToCart: (productId: string, size: string) => void;
  toggleWishlist: (productId: string) => void;
  wishlist: string[];
  user: UserType | null;
  setUser: (user: UserType | null) => void;
}

const HomePage: React.FC<HomePageProps> = ({ products, addToCart, toggleWishlist, wishlist, user, setUser }) => {
  const navigate = useNavigate();
  const [heroIndex, setHeroIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [heroImages, setHeroImages] = useState<{imageUrl: string, sku: string}[]>([]);
  const [categories, setCategories] = useState<{name: string, imageUrl: string}[]>([]);
  const [reviews, setReviews] = useState<{imageUrl: string}[]>([]);
  const [tags, setTags] = useState<{name: string}[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [freshConfig, setFreshConfig] = useState<{tags: string[], productSkus: string[]}>({ tags: [], productSkus: [] });
  const [couponConfig, setCouponConfig] = useState({
    coupon1Code: 'SOUL10',
    coupon1Text: 'Flat 10% OFF on all premium puff prints',
    coupon2Code: 'FIRST50',
    coupon2Text: 'Claim your first discount - ₹50 OFF'
  });
  const [collectionsConfig, setCollectionsConfig] = useState<{tag: string, imageUrl: string}[]>([]);
  const [bestSellersConfig, setBestSellersConfig] = useState<{productSkus: string[]}>({ productSkus: [] });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingReview, setUploadingReview] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  
  // Login & Review State
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });

  const handleVibeClick = () => {
    if (!user) {
      setShowLoginPrompt(true);
    } else {
      setReviewForm({ rating: 0, comment: '' }); // Reset on open
      setIsUploadModalOpen(true);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleCustomerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    
    if (reviewForm.rating === 0) {
        alert("Please select a star rating.");
        return;
    }

    if (!reviewForm.comment.trim()) {
        alert("Please tell us about your experience.");
        return;
    }

    setUploadingReview(true);
    try {
        const imageUrl = await uploadImage(e.target.files[0]);
        
        await createReview({
            customerName: user.name,
            userPhone: user.phone || '',
            imageUrl: imageUrl,
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            isApproved: false
        });
        
        alert("Thanks for your vibe! Your photo is under review.");
        setIsUploadModalOpen(false);
        setReviewForm({ rating: 5, comment: '' });
    } catch (error) {
        // console.error("Upload failed", error);
        alert("Upload failed. Please try again.");
    } finally {
        setUploadingReview(false);
    }
  };


  useEffect(() => {
    // Fetch dynamic content
    const loadData = async () => {
      try {
        const [heroData, catData, reviewData, tagData, fConfig, cConfig, colConfig, bsConfig] = await Promise.all([
          fetchHeroImages(),
          fetchCategories(),
          fetchReviews(),
          fetchTags(),
          fetchWebsiteConfig('fresh_arrivals'),
          fetchWebsiteConfig('coupons_section'),
          fetchWebsiteConfig('collections_section'),
          fetchWebsiteConfig('best_sellers')
        ]);
        if (heroData.length > 0) {
            // Filter to only show images with valid positions (1-9) managed by Admin
            const validHeroData = heroData.filter((img: any) => img.position >= 1 && img.position <= 9);
            
            if (validHeroData.length > 0) {
                // Sort by position
                let sortedHero = validHeroData.sort((a: any, b: any) => (a.position || 99) - (b.position || 99));
                
                // Duplicate images if too few to ensure carousel looks full/works on desktop
                if (sortedHero.length < 3) {
                     sortedHero = [...sortedHero, ...sortedHero, ...sortedHero];
                }
                
                setHeroImages(sortedHero);
            } else {
                setHeroImages([]); // No valid images, show nothing/dark
            }
        } else {
             // Fallback if no hero images
             setHeroImages(Array.from({ length: 9 }, (_, i) => ({
                 imageUrl: ``,
                 sku: ''
             })));
        }
        setCategories(catData);
        setReviews(reviewData.reverse());
        setTags([{name: 'All'}, ...tagData]);
        if (fConfig) setFreshConfig(fConfig);
        if (cConfig) setCouponConfig(cConfig);
        if (colConfig) setCollectionsConfig(colConfig);
        if (bsConfig) setBestSellersConfig(bsConfig);
      } catch (e) {
        // console.warn("Failed to load homepage data, using fallback data", e);
        // Fallback to dummy data
        setHeroImages(DUMMY_HERO_IMAGES);
        setCategories(DUMMY_CATEGORIES_DATA);
        setReviews(DUMMY_REVIEWS);
        setTags([{name: 'All'}, ...DUMMY_TAGS]);
      }
    };
    loadData();
  }, []);

  // Hero Carousel Logic
  useEffect(() => {
    if (heroImages.length === 0) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => prev + 1);
      setIsTransitioning(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    if (heroIndex === heroImages.length && heroImages.length > 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setHeroIndex(0);
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [heroIndex, heroImages.length]);

  const bestSellers = React.useMemo(() => {
    if (bestSellersConfig.productSkus && bestSellersConfig.productSkus.length > 0) {
        // Map SKUs to products, maintaining order and filtering out invalid SKUs
        return bestSellersConfig.productSkus
            .map(sku => products.find(p => p.sku === sku))
            .filter((p): p is Product => p !== undefined);
    }
    // Fallback to default behavior
    return products.filter(p => p.isBestSelling).slice(0, 4);
  }, [products, bestSellersConfig]);
  
  // Fresh Arrivals Logic - Automatic Newest First
  const freshProducts = Array.isArray(products) ? products.slice(0, 12) : [];

  const freshTags = freshConfig.tags.length > 0
    ? tags.filter(t => t.name === 'All' || freshConfig.tags.includes(t.name))
    : tags;

  const filteredProducts = activeFilter === 'All' 
    ? freshProducts 
    : freshProducts.filter(p => p.category.includes(activeFilter) || (p.tags && p.tags.includes(activeFilter)));

  // Collections Logic
  const collections = collectionsConfig.length > 0 ? collectionsConfig : [
    { tag: 'Puff Print', imageUrl: 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/Forest_Green__Oversized_T_shirt_240GSM__IKK0LKV35S_2026-01-13_1.png' },
    { tag: 'DTF', imageUrl: 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/Brown_Oversized_T_shirt__Bengali_Edtions__WRHNNRY2NU_2025-12-30_1.png' },
    { tag: 'Screen Print', imageUrl: 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/OFF_White_Horus_Oversized_Tee__Mythology_Edition__200GSM_EU5KVRYHGT_2025-11-19_1.png' },
    { tag: 'Hybrid', imageUrl: 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/Rg59u53D_9KACD2GFU4_2025-11-08_3.jpg' }
  ];



  return (
    <div className="bg-black space-y-0 pb-20 overflow-hidden">
      
      {/* Hero Banner Section */}
      <section className="relative h-[80vh] md:h-[80vh] overflow-hidden">
        <div 
          className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
          style={{ transform: `translateX(-${heroIndex * (100 / (window.innerWidth >= 768 ? 3 : 1))}%)` }}
        >
          {[...heroImages, ...heroImages.slice(0, 3)].map((img, i) => {
            const linkedProduct = products.find(p => p.sku?.trim().toLowerCase() === img.sku?.trim().toLowerCase());
            return (
              <Link key={i} to={linkedProduct ? `/product/${linkedProduct.id}` : '#'} className="min-w-full md:min-w-[33.33%] h-full relative block">
                <img 
                  src={getOptimizedUrl(img.imageUrl)} 
                  alt="Hero" 
                  loading="eager"
                  className="w-full h-full object-cover object-top" 
                  onError={(e) => { e.currentTarget.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221200%22%20height%3D%22600%22%20viewBox%3D%220%200%201200%20600%22%3E%3Crect%20fill%3D%22%23333%22%20width%3D%221200%22%20height%3D%22600%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2260%22%20dy%3D%2220%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3EHero%20Image%3C%2Ftext%3E%3C%2Fsvg%3E'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Infinite Scroll Marketing Banner */}
      <div className="bg-white py-4 overflow-hidden whitespace-nowrap border-y border-white/10 z-20 relative">
        <div className="inline-block animate-marquee-text">
          {[1,2,3].map(i => (
            <span key={i} className="text-black font-black uppercase text-xs md:text-sm tracking-widest px-10">
               delivery included on order above 999 •          • cash on delivery •          • new collection drop on every month •           • Be a part of trend
            </span>
          ))}
        </div>
        <div className="inline-block animate-marquee-text" aria-hidden="true">
          {[1,2,3].map(i => (
            <span key={i + 'copy'} className="text-black font-black uppercase text-xs md:text-sm tracking-widest px-10">
               delivery included on order above 999 •          • cash on delivery •          • new collection drop on every month •           • Be a part of trend
            </span>
          ))}
        </div>
      
      </div>

      <div className="h-4 md:h-8"></div>

      {/* Offer Section */}
      <section className="container mx-auto px-4 my-10 md:my-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <div className="ticket-border bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-zinc-800 transition-colors group">
            <span className="bg-green-500 text-black px-12 py-3 text-3xl font-black rounded-sm group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)]">{couponConfig.coupon1Code}</span>
            <p className="text-sm tracking-widest text-zinc-400 uppercase font-bold">{couponConfig.coupon1Text}</p>
          </div>
          <div className="ticket-border bg-zinc-900/50 p-8 flex flex-col items-center justify-center text-center space-y-4 hover:bg-zinc-800 transition-colors group">
            <span className="bg-green-500 text-black px-12 py-3 text-3xl font-black rounded-sm group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(34,197,94,0.3)]">{couponConfig.coupon2Code}</span>
            <p className="text-sm tracking-widest text-zinc-400 uppercase font-bold">{couponConfig.coupon2Text}</p>
          </div>
        </div>
      </section>

      <div className="h-4 md:h-8"></div>

      {/* Best Sellers */}
      <section className="container mx-auto px-4 mt-10 md:mt-16">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Best Selling</h2>
            <div className="w-20 h-1 bg-green-500 mt-2"></div>
          </div>
          <Link to="/products" className="text-sm font-bold tracking-widest uppercase flex items-center space-x-2 text-zinc-400 hover:text-white transition-all">
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {bestSellers.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              addToCart={addToCart} 
              toggleWishlist={toggleWishlist} 
              isWishlisted={wishlist.includes(product.id)} 
            />
          ))}
        </div>
      </section>

      <TextRotatorSection />

      {/* Shop By Collection */}
      <section className="bg-black py-20 border-y border-white/5">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-3xl font-black uppercase tracking-widest mb-16">Shop by Collection</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {collections.map(col => (
              <Link key={col.tag} to={`/products?tag=${col.tag}`} className="group relative overflow-hidden aspect-square border border-white/5">
                <img src={getOptimizedUrl(col.imageUrl)} alt={col.tag} loading="lazy" className="w-full h-full object-cover opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-transparent transition-all">
                  <h3 className="text-xl font-bold uppercase tracking-tighter border-b-2 border-green-500 pb-1">{col.tag}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* Find Your Vibe (Dynamic Categories) */}
      <section className="container mx-auto px-4 mt-10">
        <h2 className="text-center text-3xl font-black uppercase tracking-widest mb-8">Find Your Vibe</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {['Men', 'Women', 'Unisex', 'Couple'].map(gender => {
            const cat = categories.find(c => c.name === gender);
            
            let fallbackImage = '';
            switch(gender) {
                case 'Men': fallbackImage = 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/Forest_Green__Oversized_T_shirt_240GSM__IKK0LKV35S_2026-01-13_1.png'; break;
                case 'Women': fallbackImage = 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/Brown_Oversized_T_shirt__Bengali_Edtions__WRHNNRY2NU_2025-12-30_1.png'; break;
                case 'Unisex': fallbackImage = 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/OFF_White_Horus_Oversized_Tee__Mythology_Edition__200GSM_EU5KVRYHGT_2025-11-19_1.png'; break;
                case 'Couple': fallbackImage = 'https://d1311wbk6unapo.cloudfront.net/NushopCatalogue/tr:f-webp,w-1200,fo-auto/68ee6834b30a802f2be99c65/cat_img/Rg59u53D_9KACD2GFU4_2025-11-08_3.jpg'; break;
                default: fallbackImage = 'https://via.placeholder.com/400';
            }

            const imageUrl = cat?.imageUrl || fallbackImage;
            
            return (
              <Link key={gender} to={`/products?gender=${gender}`} className="flex flex-col items-center space-y-4 group">
                <div className="w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-green-500 transition-all">
                  <img src={getOptimizedUrl(imageUrl)} className="w-full h-full object-cover" alt={gender} loading="lazy" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest group-hover:text-green-500 transition-colors">{gender}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Fresh Arrivals with Filter & Animation */}
      <section className="container mx-auto px-4 pt-20 border-t border-white/5 mt-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Fresh Arrivals</h2>
          <div className="flex overflow-x-auto pb-2 space-x-2 no-scrollbar">
            {freshTags.map(tag => (
              <button 
                key={tag.name} 
                onClick={() => setActiveFilter(tag.name)}
                className={`relative px-6 py-2 border border-white/5 text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap z-10 ${activeFilter === tag.name ? 'text-black' : 'bg-zinc-900 hover:text-white'}`}
              >
                {activeFilter === tag.name && (
                  <motion.div 
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-green-500 -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tag.name}
              </button>
            ))}
          </div>
        </div>
        <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          <AnimatePresence>
            {filteredProducts.slice(0, 12).map(product => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <ProductCard 
                  product={product} 
                  addToCart={addToCart} 
                  toggleWishlist={toggleWishlist} 
                  isWishlisted={wishlist.includes(product.id)} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        <div className="flex justify-center mt-12">
          <Link to="/products" className="bg-white text-black px-12 py-4 text-xs font-black uppercase tracking-widest hover:bg-green-500 transition-all">
            View All Collection
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="p-8 bg-zinc-900 rounded-full text-green-500"><Truck className="w-12 h-12 md:w-12 md:h-12" /></div>
            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-green-500">Fast Delivery</h4>
          </div>
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="p-8 bg-zinc-900 rounded-full text-green-500"><RefreshCcw className="w-12 h-12 md:w-12 md:h-12" /></div>
            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-green-500">Easy Exchange</h4>
          </div>
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="p-8 bg-zinc-900 rounded-full text-green-500"><CreditCard className="w-12 h-12 md:w-12 md:h-12" /></div>
            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-green-500">COD Available</h4>
          </div>
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="p-8 bg-zinc-900 rounded-full text-green-500"><Clock className="w-12 h-12 md:w-12 md:h-12" /></div>
            <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-green-500">Next Day Dispatch</h4>
          </div>
        </div>
      </section>

      {/* Review Marquee - Loved By Customers */}
      <section className="bg-zinc-950 py-10 mt-10 relative">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-widest mb-4">Loved By Customers</h2>
            <button 
                onClick={handleVibeClick}
                className="bg-white text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-green-500 transition-all flex items-center gap-2 mx-auto"
            >
                <Upload className="w-4 h-4" />
                Show us your Vibe
            </button>
        </div>

        <div className="flex flex-col space-y-6">
          <div className="flex overflow-hidden group">
            <div className="flex animate-marquee hover:pause-marquee space-x-4">
              {/* Row 1: 10 images repeated */}
              {(() => {
                 const defaultImages = [
                    
                 ];
                 const rowReviews = [...reviews, ...defaultImages.map(url => ({ imageUrl: url }))].slice(0, 10);
                 return rowReviews.map((r: any, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedReview(r)}
                      className="w-60 h-80 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden flex-shrink-0 relative group cursor-pointer"
                    >
                      <img src={getOptimizedUrl(r.imageUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Review" loading="lazy" />
                      
                      {/* Star Rating Overlay */}
                      {r.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md flex items-center shadow-lg border border-white/10">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  viewBox="0 0 24 24" 
                                  className={`w-3 h-3 ${star <= r.rating ? 'text-amber-400' : 'text-zinc-600'}`}
                                  fill="currentColor"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Comment Preview */}
                      {r.comment && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                          <p className="text-sm text-zinc-200 line-clamp-2 italic font-medium leading-relaxed">
                            "{r.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                 ));
              })()}
              
              {/* Duplicate for smooth marquee */}
              {(() => {
                 const defaultImages = [
                    
                 ];
                 const rowReviews = [...reviews, ...defaultImages.map(url => ({ imageUrl: url }))].slice(0, 10);
                 return rowReviews.map((r: any, i) => (
                    <div 
                      key={i + 'dup'} 
                      onClick={() => setSelectedReview(r)}
                      className="w-60 h-80 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden flex-shrink-0 relative group cursor-pointer"
                    >
                      <img src={getOptimizedUrl(r.imageUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Review" loading="lazy" />
                      
                      {/* Star Rating Overlay */}
                      {r.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md flex items-center shadow-lg border border-white/10">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  viewBox="0 0 24 24" 
                                  className={`w-3 h-3 ${star <= r.rating ? 'text-amber-400' : 'text-zinc-600'}`}
                                  fill="currentColor"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Comment Preview */}
                      {r.comment && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                          <p className="text-sm text-zinc-200 line-clamp-2 italic font-medium leading-relaxed">
                            "{r.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                 ));
              })()}
            </div>
          </div>
          <div className="flex overflow-hidden group">
            <div className="flex animate-marquee-reverse hover:pause-marquee space-x-4">
               {/* Row 2: Next 10 images */}
              {(() => {
                 const defaultImages = [
                    
                 ];
                 // Use next 10 reviews (10-20) if available
                 const nextReviews = reviews.slice(10);
                 const rowReviews = [...nextReviews, ...defaultImages.map(url => ({ imageUrl: url }))].slice(0, 10);
                 return rowReviews.map((r: any, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedReview(r)}
                      className="w-60 h-80 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden flex-shrink-0 relative group cursor-pointer"
                    >
                      <img src={getOptimizedUrl(r.imageUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Review" loading="lazy" />
                      
                      {/* Star Rating Overlay */}
                      {r.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md flex items-center shadow-lg border border-white/10">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  viewBox="0 0 24 24" 
                                  className={`w-3 h-3 ${star <= r.rating ? 'text-amber-400' : 'text-zinc-600'}`}
                                  fill="currentColor"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Comment Preview */}
                      {r.comment && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                          <p className="text-sm text-zinc-200 line-clamp-2 italic font-medium leading-relaxed">
                            "{r.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                 ));
              })()}
               {/* Duplicate */}
              {(() => {
                 const defaultImages = [
                    
                 ];
                 const nextReviews = reviews.slice(10);
                 const rowReviews = [...nextReviews, ...defaultImages.map(url => ({ imageUrl: url }))].slice(0, 10);
                 return rowReviews.map((r: any, i) => (
                    <div 
                      key={i + 'dup'} 
                      onClick={() => setSelectedReview(r)}
                      className="w-60 h-80 bg-zinc-900 border border-white/5 rounded-xl overflow-hidden flex-shrink-0 relative group cursor-pointer"
                    >
                      <img src={getOptimizedUrl(r.imageUrl)} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Review" loading="lazy" />
                      
                      {/* Star Rating Overlay */}
                      {r.rating && (
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md flex items-center shadow-lg border border-white/10">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  viewBox="0 0 24 24" 
                                  className={`w-3 h-3 ${star <= r.rating ? 'text-amber-400' : 'text-zinc-600'}`}
                                  fill="currentColor"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                           </div>
                        </div>
                      )}

                      {/* Comment Preview */}
                      {r.comment && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                          <p className="text-sm text-zinc-200 line-clamp-2 italic font-medium leading-relaxed">
                            "{r.comment}"
                          </p>
                        </div>
                      )}
                    </div>
                 ));
              })()}
            </div>
          </div>
        </div>
      </section>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        @keyframes marquee-text {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 30s linear infinite;
        }
        .animate-marquee-text {
          animation: marquee-text 40s linear infinite;
        }
        .pause-marquee {
          animation-play-state: paused;
        }
        /* Hide scrollbar */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Login Prompt Modal */}
      <AnimatePresence>
        {showLoginPrompt && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 border border-white/10 p-8 max-w-sm w-full relative text-center"
                >
                    <button 
                        onClick={() => setShowLoginPrompt(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Join the Cult</h3>
                    <p className="text-zinc-500 text-sm mb-8">You need to be logged in to share your vibe with us.</p>
                    
                    <button 
                        onClick={handleLogin}
                        className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-green-500 transition-colors"
                    >
                        Login / Sign Up
                    </button>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 border border-white/10 p-6 max-w-[400px] w-full relative max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl"
                >
                    <button 
                        onClick={() => setIsUploadModalOpen(false)}
                        className="absolute top-4 right-4 text-zinc-500 hover:text-white z-20"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    
                    <h3 className="text-xl font-black uppercase tracking-tighter mb-1">Upload Your Vibe</h3>
                    <p className="text-zinc-500 text-xs mb-6">Show us how you style it. Your photo might be featured on our wall.</p>
                    
                    <div className="space-y-6">
                        {/* Star Rating */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">How would you rate it?</label>
                            <div className="flex items-center justify-center gap-4 p-4 bg-zinc-800/50 border border-white/5 rounded-2xl">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                        className="relative transition-all active:scale-90"
                                    >
                                        <svg 
                                            viewBox="0 0 24 24" 
                                            className={`w-8 h-8 transition-colors ${star <= reviewForm.rating ? 'text-green-500' : 'text-zinc-600'}`}
                                            fill="currentColor"
                                        >
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Comment Input */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">Share your experience</label>
                            <textarea 
                                placeholder="Product quality is very good etc."
                                value={reviewForm.comment}
                                onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                                rows={3}
                                className="w-full bg-zinc-800 border border-white/5 p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 rounded-xl resize-none"
                            />
                        </div>

                        {/* Image Upload */}
                        <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-green-500 transition-colors cursor-pointer relative group">
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleCustomerUpload}
                                disabled={uploadingReview}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center space-y-2 pointer-events-none">
                                <Upload className="w-8 h-8 text-zinc-500 group-hover:text-green-500 transition-colors" />
                                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 group-hover:text-white">
                                    {uploadingReview ? 'Uploading...' : 'Click to Upload'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Review Detail Popup */}
      <AnimatePresence>
        {selectedReview && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 border border-white/10 max-w-2xl w-[90%] md:w-full relative rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
                >
                    <button 
                        onClick={() => setSelectedReview(null)}
                        className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative min-h-[300px]">
                        <img src={getOptimizedUrl(selectedReview.imageUrl)} className="w-full h-full object-cover" alt="Review" loading="eager" />
                        
                        {/* Star Rating Overlay in Popup */}
                        <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded-md flex items-center shadow-2xl border border-white/10">
                           <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <svg 
                                  key={star}
                                  viewBox="0 0 24 24" 
                                  className={`w-3 h-3 ${star <= (selectedReview.rating || 5) ? 'text-amber-400' : 'text-zinc-600'}`}
                                  fill="currentColor"
                                >
                                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                </svg>
                              ))}
                           </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-6 bg-zinc-900">
                        <div className="space-y-4">
                            <p className="text-xl md:text-2xl font-medium text-white italic leading-relaxed">
                                "{selectedReview.comment || 'Amazing product!'}"
                            </p>
                            <div className="pt-4 border-t border-white/5">
                                <p className="text-sm font-black uppercase tracking-widest text-green-500">
                                    {selectedReview.customerName || 'Anonymous User'}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                                    Verified Soul Customer
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
