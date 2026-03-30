import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, ShieldCheck, Truck, RefreshCw, ChevronLeft, ChevronRight, Share2, Info, X, ChevronDown, ChevronUp, Check, Banknote, Lock, Gift } from 'lucide-react';
import { Product, FreeGift } from '../types';
import ProductCard from '../components/ProductCard';
import { fetchFreeGifts } from '../src/api';
import { getLargeUrl, getThumbnailUrl } from '../src/utils/cloudinary';
import SectionHeading from '../components/SectionHeading';

interface ProductDetailsProps {
  products: Product[];
  cart: { productId: string; quantity: number; size: string; isGift?: boolean }[];
  addToCart: (productId: string, size: string, quantity?: number, isGift?: boolean) => void;
  toggleWishlist: (productId: string) => void;
  wishlist: string[];
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ products, cart, addToCart, toggleWishlist, wishlist }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeImage, setActiveImage] = useState(0);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  
  const [freeGifts, setFreeGifts] = useState<FreeGift[]>([]);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleNextImage = () => {
    if (product && product.images) {
      setActiveImage((prev) => (prev + 1) % product.images.length);
    }
  };

  const handlePrevImage = () => {
    if (product && product.images) {
      setActiveImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      handleNextImage();
    }
    if (isRightSwipe) {
      handlePrevImage();
    }
  };

  useEffect(() => {
    if (thumbnailRefs.current[activeImage]) {
      thumbnailRefs.current[activeImage]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeImage]);

  const scrollThumbnails = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      if (direction === 'up') scrollRef.current.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
      else if (direction === 'down') scrollRef.current.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      else if (direction === 'left') scrollRef.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      else if (direction === 'right') scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const loadGifts = async () => {
        try {
            const data = await fetchFreeGifts();
            setFreeGifts(data.filter((g: FreeGift) => g.isActive));
        } catch (e) {
            // console.error("Failed to load gifts", e);
        }
    };
    loadGifts();
  }, []);

  useEffect(() => {
    const found = products.find(p => p.id === id);
    if (found) {
      setProduct(found);
      const firstAvailable = Object.entries(found.sizes).find(([_, stock]) => (stock as number) > 0)?.[0];
      if (firstAvailable) setSelectedSize(firstAvailable);
      setIsAddedToCart(false); 
      window.scrollTo(0, 0); // Scroll to top when product changes
    }
  }, [id, products]);

  const handleAddToCart = () => {
    if (product && selectedSize) {
        addToCart(product.id, selectedSize, quantity, false);
        setIsAddedToCart(true);
    }
  };

  const handleClaimGift = () => {
    if (product && selectedSize) {
        addToCart(product.id, selectedSize, 1, true);
        setIsAddedToCart(true);
        navigate('/cart');
    } else if (product) {
        if (!selectedSize) {
            const firstAvailable = Object.entries(product.sizes).find(([_, stock]) => (stock as number) > 0)?.[0];
            if (firstAvailable) {
                 addToCart(product.id, firstAvailable, 1, true);
                 setIsAddedToCart(true);
                 navigate('/cart');
            }
        } else {
             addToCart(product.id, selectedSize, 1, true);
             setIsAddedToCart(true);
             navigate('/cart');
        }
    }
  };

  const toggleAccordion = (section: string) => {
    setActiveAccordion(activeAccordion === section ? null : section);
  };

  if (!product) return <div className="h-screen bg-zinc-50 flex items-center justify-center text-zinc-500 font-heading">Loading Artifact Details...</div>;

  const currentStock = product.sizes && selectedSize ? product.sizes[selectedSize] : 0;
  const discount = Math.round(((product.actualPrice - product.offerPrice) / product.actualPrice) * 100);

  const cartSubtotal = cart.reduce((acc, item) => {
    if (item.isGift) return acc;
    const p = products.find(prod => prod.id === item.productId);
    return acc + (p ? p.offerPrice * item.quantity : 0);
  }, 0);

  const matchedGift = freeGifts.find(g => g.sku === product.sku);
  const isEligibleForFree = matchedGift && cartSubtotal >= matchedGift.minBilling;
  const isGiftInCart = cart.some(item => item.productId === product.id && item.isGift);

  return (
    <div className="bg-white min-h-screen text-[#03401b] pt-6 pb-24 md:pt-8 font-heading overflow-x-hidden">
      <div className="container mx-auto px-4 max-w-[1400px]">
        
        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-[10px] uppercase tracking-widest text-zinc-500 mb-6 max-w-7xl mx-auto">
          <Link to="/" className="hover:text-[#03401b] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/products" className="hover:text-[#03401b] transition-colors">Collection</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#03401b] font-bold">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start relative max-w-7xl mx-auto">
          
          {/* Left Column Wrapper */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            {/* Left: Immersive Image Gallery */}
            <div className="flex flex-col md:flex-row gap-4 h-full w-full max-w-full">
              {/* Vertical thumbnails on desktop, horizontal on mobile */}
              <div className="order-2 md:order-1 flex flex-col items-center justify-center md:sticky md:top-24 gap-2 w-full md:w-20 lg:w-24 flex-shrink-0 relative group">
                
                {/* Mobile Left Arrow */}
                <button 
                  onClick={() => scrollThumbnails('left')}
                  className="md:hidden absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1.5 rounded-full shadow-md text-[#03401b] transition-opacity border border-zinc-100/50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                {/* Desktop Up Arrow */}
                <button 
                  onClick={() => scrollThumbnails('up')}
                  className="hidden md:flex bg-white shadow-sm hover:shadow text-[#03401b] p-1.5 rounded-full transition-all border border-zinc-100"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>

                {/* Thumbnails Scroll Container */}
                <div 
                  ref={scrollRef}
                  className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto no-scrollbar w-full h-auto md:max-h-[30rem] scroll-smooth snap-x md:snap-y snap-mandatory px-1 md:px-0 py-1"
                >
                  {product.images.map((img, i) => (
                    <button 
                      key={i} 
                      ref={el => { thumbnailRefs.current[i] = el; }}
                      onClick={() => setActiveImage(i)}
                      className={`w-20 md:w-full aspect-[3/4] rounded-lg overflow-hidden transition-all shadow-sm flex-shrink-0 snap-center md:snap-center ${activeImage === i ? 'ring-2 ring-offset-2 ring-[#03401b] opacity-100' : 'opacity-60 hover:opacity-100 ring-1 ring-zinc-200'}`}
                    >
                      <img src={getThumbnailUrl(img)} alt="" loading="lazy" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                {/* Desktop Down Arrow */}
                <button 
                  onClick={() => scrollThumbnails('down')}
                  className="hidden md:flex bg-white shadow-sm hover:shadow text-[#03401b] p-1.5 rounded-full transition-all border border-zinc-100"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>

                {/* Mobile Right Arrow */}
                <button 
                  onClick={() => scrollThumbnails('right')}
                  className="md:hidden absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-1.5 rounded-full shadow-md text-[#03401b] transition-opacity border border-zinc-100/50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Massive Main Image */}
              <div className="order-1 md:order-2 w-full flex flex-col gap-4 relative group">
                <div 
                  className="bg-white rounded-2xl overflow-hidden shadow-sm aspect-[4/5] w-full relative"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                >
                   <img src={getLargeUrl(product.images[activeImage])} alt={product.name} loading="eager" className="w-full h-full object-cover md:object-contain bg-white" />
                   
                   {/* Desktop Navigation Arrows */}
                   <button 
                     onClick={handlePrevImage}
                     className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 focus:outline-none shadow-md hover:scale-110 hover:shadow-lg text-[#03401b] p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-zinc-100"
                   >
                     <ChevronLeft className="w-6 h-6" />
                   </button>
                   <button 
                     onClick={handleNextImage}
                     className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 focus:outline-none shadow-md hover:scale-110 hover:shadow-lg text-[#03401b] p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all border border-zinc-100"
                   >
                     <ChevronRight className="w-6 h-6" />
                   </button>
                </div>
              </div>
            </div>

            {/* Trust Badges (Desktop Only - Left Side) */}
            <div className="hidden lg:grid grid-cols-3 gap-4 w-full mt-8 lg:mt-16">
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                <ShieldCheck className="w-8 h-8 text-[#03401b]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">100% Genuine</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                <Truck className="w-8 h-8 text-[#03401b]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Secure Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                <Lock className="w-8 h-8 text-[#03401b]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Encrypted Payment</span>
              </div>
            </div>
          </div>

          {/* Right: Sticky Product Info */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-24">
            
            {/* Header Titles */}
            <div className="space-y-3 border-b border-[#03401b]/10 pb-6">
              <h1 className="text-3xl md:text-5xl font-bold text-[#03401b] uppercase tracking-tighter leading-none">{product.name}</h1>
              <p className="text-xs tracking-[0.2em] text-zinc-500 font-bold uppercase">{product.category.join(' • ')}</p>
            </div>

            {/* Pricing */}
            <div className="space-y-1">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-black text-[#03401b]">₹{product.offerPrice}</span>
                <span className="text-xl text-zinc-400 line-through">₹{product.actualPrice}</span>
                <span className="bg-red-500 text-white px-3 py-1 text-xs font-black rounded-full shadow-sm">{discount}% OFF</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-[#468057] font-bold">Inclusive of all taxes</p>
            </div>

            {/* Gift Unlocking UI */}
            {matchedGift && (
                <div className={`p-5 rounded-2xl border shadow-sm transition-all ${isEligibleForFree ? 'bg-white border-pink' : 'bg-white border-zinc-200'}`}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                            {isEligibleForFree ? (
                                <Gift className="w-5 h-5 text-pink" />
                            ) : (
                                <Lock className="w-5 h-5 text-zinc-400" />
                            )}
                            <div>
                                <h4 className={`text-sm font-black uppercase tracking-wider ${isEligibleForFree ? 'text-[#03401b]' : 'text-zinc-500'}`}>
                                    {isEligibleForFree ? 'Gift Unlocked!' : 'Gift Locked'}
                                </h4>
                                <p className="text-xs text-zinc-500 mt-1 font-sans">
                                    {isEligibleForFree 
                                        ? `You've unlocked this gift! Add it to your cart${matchedGift.price ? ` for ₹${matchedGift.price}` : ''}.` 
                                        : `Shop for ₹${Math.max(0, matchedGift.minBilling - cartSubtotal)} more to unlock this gift.`
                                    }
                                </p>
                            </div>
                        </div>
                        
                        {isGiftInCart ? (
                             <button 
                                disabled
                                className="bg-zinc-100 text-zinc-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center space-x-2"
                            >
                                <Check className="w-3 h-3" />
                                <span>Claimed</span>
                            </button>
                        ) : isEligibleForFree ? (
                            <button 
                                onClick={handleClaimGift}
                                className="bg-[#03401b] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors flex items-center space-x-2 shadow-md"
                            >
                                <Gift className="w-3 h-3" />
                                <span>Claim Gift</span>
                            </button>
                        ) : (
                            <button 
                                disabled
                                className="bg-zinc-100 text-zinc-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center space-x-2"
                            >
                                <Lock className="w-3 h-3" />
                                <span>Locked</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Quality Summary */}
            <div className="p-4 bg-white rounded-xl border-l-[6px] border-[#468057]">
              <p className="text-xs text-zinc-600 leading-relaxed font-sans"><span className="text-[#03401b] font-bold uppercase mr-2 tracking-wider">The Quality:</span>{product.quality}</p>
            </div>

            {/* Size Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#03401b]">Select Size</h3>
                <button onClick={() => setShowSizeGuide(true)} className="text-[10px] text-zinc-500 underline flex items-center space-x-1 hover:text-[#03401b] font-bold">
                  <Info className="w-3 h-3" />
                  <span>Size Guide</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {Object.entries(product.sizes).map(([size, stock]) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3.5rem] px-4 py-3 text-sm font-black rounded-xl border transition-all ${
                      selectedSize === size ? 'bg-[#03401b] text-white border-[#03401b] shadow-md -translate-y-[1px]' : 'bg-white border-zinc-200 text-zinc-600 hover:border-[#03401b]/50 shadow-sm hover:shadow'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {selectedSize && currentStock > 0 && currentStock <= 10 && (
                <p className="text-xs text-[#943131] font-bold italic">Hurry! Only {currentStock} left in stock</p>
              )}
              {selectedSize && currentStock === 0 && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex flex-col space-y-2">
                  <p className="text-sm text-red-600 font-bold">This size is currently sold out.</p>
                  <button 
                    onClick={() => setShowNotifyModal(true)}
                    className="text-xs text-[#03401b] font-black uppercase tracking-widest hover:underline text-left inline-block"
                  >
                    Notify me when available
                  </button>
                </div>
              )}
            </div>

            {/* Color Selector */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest">
                  Colour: <span className="text-zinc-500 ml-1">{product.color?.name || 'Standard'}</span>
                </h3>
              </div>
              <div className="flex flex-wrap gap-4 items-center">
                {/* Current Product Color */}
                <div className="flex flex-col items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full ring-2 ring-offset-2 ring-[#03401b] cursor-default shadow-md"
                    title={product.color?.name || 'Current'}
                  >
                    <div 
                      className="w-full h-full rounded-full border border-black/10" 
                      style={{ backgroundColor: product.color?.hex || '#333' }}
                    />
                  </div>
                </div>

                {/* Linked Product Colors */}
                {product.linkedProducts && product.linkedProducts.length > 0 && product.linkedProducts.map(linkedSku => {
                  const linkedProd = products.find(p => p.sku === linkedSku);
                  if (!linkedProd) return null;
                  
                  return (
                    <Link 
                      key={linkedSku}
                      to={`/product/${linkedProd.id}`}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div 
                        className="w-10 h-10 rounded-full border border-zinc-200 group-hover:ring-2 group-hover:ring-offset-2 group-hover:ring-zinc-300 transition-all shadow-sm"
                        title={linkedProd.color?.name || linkedSku}
                      >
                        <div 
                          className="w-full h-full rounded-full border border-black/10" 
                          style={{ backgroundColor: linkedProd.color?.hex || '#333' }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-4 pt-4">
              <button 
                onClick={() => isAddedToCart ? navigate('/cart') : handleAddToCart()}
                disabled={!selectedSize || currentStock === 0}
                className={`flex-grow py-5 rounded-full text-sm font-black uppercase tracking-[0.2em] transition-all disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none flex items-center justify-center space-x-3 shadow-lg hover:-translate-y-1 hover:shadow-xl ${isAddedToCart ? 'bg-zinc-900 border border-zinc-200 text-white' : 'bg-[#03401b] text-white'}`}
              >
                {isAddedToCart ? (
                    <><Check className="w-5 h-5" /> <span>Go for Checkout</span></>
                ) : (
                    <><ShoppingBag className="w-5 h-5" /> <span>{currentStock === 0 ? 'Sold Out' : 'Add to Bag'}</span></>
                )}
              </button>
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`p-5 rounded-full border transition-all hover:bg-zinc-100 ${wishlist.includes(product.id) ? 'bg-pink border-pink text-white shadow-md' : 'border-zinc-300 text-zinc-400 bg-white'}`}
              >
                <Heart className={`w-6 h-6 ${wishlist.includes(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Key Highlights */}
            <div className="pt-8 border-t border-[#03401b]/10 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#03401b]">Key Highlights</h3>
              <div className="grid grid-cols-2 gap-y-6 text-xs tracking-wider">
                <div>
                  <p className="text-zinc-500 mb-1">SKU Number</p>
                  <p className="font-bold uppercase text-[#03401b]">{product.sku}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Country of Origin</p>
                  <p className="font-bold uppercase text-[#03401b]">{product.countryOfOrigin || 'India'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Mfg Date</p>
                  <p className="font-bold uppercase text-[#03401b]">{product.manufactureDate ? new Date(product.manufactureDate).toLocaleDateString('en-GB').replace(/\//g, '-') : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-zinc-500 mb-1">Category</p>
                  <p className="font-bold uppercase text-[#03401b]">{product.category.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Product Details Accordion */}
            <div className="border-t border-b border-[#03401b]/10 mt-8">
                {/* Description */}
                <div className="border-b border-[#03401b]/10">
                    <button onClick={() => toggleAccordion('description')} className="w-full py-6 flex items-center justify-between text-left group">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-[#03401b] group-hover:text-white transition-colors text-zinc-600">
                                <Share2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Product Description</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Manufacture, Care and Fit</p>
                            </div>
                        </div>
                        {activeAccordion === 'description' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === 'description' ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm text-zinc-600 font-sans leading-relaxed pl-[3.5rem] pr-4 whitespace-pre-line">
                            {product.description || "No description available."}
                        </p>
                    </div>
                </div>

                {/* Cash on Delivery */}
                <div className="border-b border-[#03401b]/10 py-6 flex items-center space-x-4">
                     <div className="p-2 bg-green-50 rounded-lg text-[#468057] shadow-sm">
                        <Banknote className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Cash on Delivery</h4>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Available on all orders</p>
                     </div>
                </div>

                {/* Returns & Exchange */}
                <div className="">
                    <button onClick={() => toggleAccordion('returns')} className="w-full py-6 flex items-center justify-between text-left group">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-zinc-100 rounded-lg group-hover:bg-[#03401b] group-hover:text-white transition-colors text-zinc-600">
                                <RefreshCw className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-[#03401b]">Returns & Exchange</h4>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">Know about return & exchange policy</p>
                            </div>
                        </div>
                        {activeAccordion === 'returns' ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${activeAccordion === 'returns' ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}>
                        <div className="text-sm text-zinc-600 font-sans leading-relaxed pl-[3.5rem] pr-4 space-y-2">
                             <p><span className="text-[#03401b] font-bold uppercase text-xs">Exchange Policy:</span> {product.exchangePolicy?.type === 'no-exchange' ? 'No Exchange' : `${product.exchangePolicy?.days || 7} Days Exchange Policy`}</p>
                             <p><span className="text-[#03401b] font-bold uppercase text-xs">Cancellation Policy:</span> {product.cancelPolicy || 'Orders can be cancelled before shipping.'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Badges (Mobile Only) */}
            <div className="grid lg:hidden grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                <ShieldCheck className="w-8 h-8 text-[#03401b]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">100% Genuine</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                <Truck className="w-8 h-8 text-[#03401b]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Secure Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100">
                <Lock className="w-8 h-8 text-[#03401b]" />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Encrypted Payment</span>
              </div>
            </div>

          </div>
        </div>

        {/* You May Like - Bottom Full Width Section */}
        <div className="mt-32 pt-16 border-t border-[#03401b]/10 max-w-7xl mx-auto">
          <SectionHeading title="You May Also Like" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12">
            {products
                .filter(p => p.id !== product.id && p.category.some(c => product.category.includes(c)))
                .slice(0, 4)
                .map(p => (
              <ProductCard 
                key={p.id} 
                product={p} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                isWishlisted={wishlist.includes(p.id)} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowSizeGuide(false)}></div>
            <div className="relative bg-white rounded-2xl border border-zinc-200 p-2 max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={() => setShowSizeGuide(false)}
                    className="absolute top-4 right-4 z-10 bg-white shadow-lg hover:bg-zinc-100 text-[#03401b] p-2 rounded-full transition-all"
                >
                    <X className="w-6 h-6" />
                </button>
                <img 
                    src="/assets/size-chart.avif" 
                    alt="Size Guide" 
                    className="w-full h-auto rounded-xl"
                    onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/800x600?text=Size+Guide+Image+Not+Found';
                    }}
                />
            </div>
        </div>
      )}

      {/* Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowNotifyModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-8 md:p-10 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#03401b]">Waitlist: {product.name}</h2>
            <p className="text-zinc-500 font-sans text-sm mb-8">We'll notify you as soon as size <span className="text-[#03401b] font-black">{selectedSize}</span> drops back in stock.</p>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Email Address</label>
                <input type="email" placeholder="you@example.com" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#03401b] focus:ring-1 focus:ring-[#03401b] transition-all font-sans" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-black">Phone Number</label>
                <input type="tel" placeholder="+91 XXXXX XXXXX" className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#03401b] focus:ring-1 focus:ring-[#03401b] transition-all font-sans" />
              </div>
              <button 
                onClick={() => setShowNotifyModal(false)}
                className="w-full bg-[#03401b] text-white rounded-full py-4 text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all mt-6 shadow-lg shadow-[#03401b]/20 hover:-translate-y-1"
              >
                Join the Drop
              </button>
            </div>
            
            <button 
                onClick={() => setShowNotifyModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 p-2"
            >
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
