
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingCart, Heart, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, User as UserType } from '../types';
import { getThumbnailUrl } from '../src/utils/cloudinary';

const announcements = [
  "• For international orders & payments, order on WhatsApp. •",
  "• Free Shipping on orders above ₹3000 •",
  "• Premium Ethnic Wear - Elegance in Every Stitch •",
  "• Secure Payments via UPI, Cards, and Wallets •"
];

const TypewriterPlaceholder = () => {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stored words for typewriter
  const words = ['Product Keyword..', 'Premium Kurtas..', 'Elegant Dresses..', 'Ethnic Wear..'];

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentWord = words[wordIndex];

    if (isDeleting) {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(currentWord.substring(0, text.length - 1)), 50);
      } else {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      }
    } else {
      if (text.length < currentWord.length) {
        timeout = setTimeout(() => setText(currentWord.substring(0, text.length + 1)), 100);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 2000);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex]);

  return (
    <span className="text-[#03401b] font-bold text-sm w-full text-left truncate flex-1 overflow-hidden whitespace-nowrap">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  );
};

interface HeaderProps {
  user: UserType | null;
  cartCount: number;
  wishlistCount: number;
  products: Product[];
}

const Header: React.FC<HeaderProps> = ({ user, cartCount, wishlistCount, products }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [showAnnouncements, setShowAnnouncements] = useState(true);
  const navigate = useNavigate();
  const searchRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lastScroll = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Safe zone at the top - always show announcements
      if (currentScrollY <= 80) {
        setShowAnnouncements(true);
        lastScroll = currentScrollY;
        return;
      }

      // Buffer to prevent jitter/flicker
      const scrollDiff = currentScrollY - lastScroll;
      if (Math.abs(scrollDiff) < 40) {
        return;
      }

      if (scrollDiff > 0) {
        setShowAnnouncements(false); // Scrolling down
      } else {
        setShowAnnouncements(true); // Scrolling up
      }

      lastScroll = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      // Filter from actual products passed via props
      const filtered = products.filter(p =>
        p.sku !== 'DUMMY-ERR' && (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.some(c => c.toLowerCase().includes(q))
        )
      ).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, products]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${searchQuery}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (id: string) => {
    navigate(`/product/${id}`);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-[100] bg-white border-b border-[#FFC0CB]/20 text-[#03401b] font-heading w-full">

      {/* Top Announcement Bar */}
      <motion.div
        initial={false}
        animate={{
          height: showAnnouncements ? 'auto' : 0,
          opacity: showAnnouncements ? 1 : 0,
          marginBottom: showAnnouncements ? 0 : -2 // Micro-adjustment to prevent border overlap
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="bg-gradient-to-r from-[#468057] to-[#03401b] text-gold w-full relative overflow-hidden flex justify-center items-center"
      >
        <div className="h-8 md:h-10 w-full relative flex justify-center items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={announcementIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="absolute text-xs md:text-sm font-bold tracking-widest uppercase text-center w-full px-4"
            >
              {announcements[announcementIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 lg:px-8 h-14 md:h-20 flex items-center justify-between relative">

        {/* Left: Desktop Menu & Mobile Hamburger */}
        <div className="flex items-center">
          <button onClick={() => setIsMenuOpen(true)} className="lg:hidden p-2 mr-2">
            <Menu className="w-6 h-6" />
          </button>
          <nav className="hidden lg:flex items-center space-x-8 text-base font-bold tracking-widest uppercase">
            <Link to="/" className="hover:text-pink transition-colors">Home</Link>
            <a href="index.html/#new-arrivals" className="hover:text-pink transition-colors">New Arrivals</a>
            <a href="/#best-selling" className="hover:text-pink transition-colors">Hot Sellers</a>
          </nav>
        </div>

        {/* Center: Logo - Fixed z-index and spacing for mobile */}
        <Link to="/" className="absolute left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10 hover:opacity-90 transition-opacity">
          <img src="/assets/logo_2.png" alt="Riyathnic Logo" className="h-14 md:h-[4.5rem] w-auto object-contain" />
        </Link>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 md:space-x-4 lg:space-x-6 text-[#03401b]">
          {/* Mobile Search Icon */}
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="md:hidden hover:text-pink transition-colors p-2">
            <Search className="w-5 h-5" />
          </button>

          {/* Desktop Search Bar (Interactive Button) */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="hidden md:flex items-center justify-between w-48 lg:w-64 h-10 border border-[#03401b] rounded-full px-4 hover:border-[#FFC0CB] transition-all bg-white group cursor-text"
            aria-label="Open search"
          >
            <TypewriterPlaceholder />
            <div className="border-l border-[#03401b] pl-3 ml-2 h-6 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-[#03401b] group-hover:text-[#FFC0CB] transition-colors" />
            </div>
          </button>

          <Link to="/profile" className="hover:text-pink transition-colors p-2">
            <User className="w-5 h-5 md:w-6 md:h-6" />
          </Link>
          {/* Wishlist Hidden on Mobile as requested */}
          <Link to="/wishlist" className="hidden md:block hover:text-pink transition-colors p-2 relative">
            <Heart className="w-6 h-6" />
            {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" className="hover:text-pink transition-colors p-2 relative">
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">{cartCount}</span>}
          </Link>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <>
          {/* Backdrop - High z-index to cover everything including header */}
          <div
            className="fixed inset-0 z-[105] bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsSearchOpen(false)}
          />

          <div ref={searchRef} className="absolute top-full left-0 w-full p-4 z-[110] animate-in slide-in-from-top duration-300">
            <div className="container mx-auto max-w-2xl relative">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Type to search (Name, SKU, Category)..."
                  className="w-full bg-white/95 backdrop-blur-md border border-black/10 text-[#03401b] px-6 py-4 rounded-full focus:outline-none focus:border-black/30 transition-all shadow-2xl placeholder:text-zinc-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-[#468057]">
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {suggestions.length > 0 && (
                <div className="mt-2 border border-black/5 rounded-2xl overflow-hidden shadow-2xl divide-y divide-black/5 bg-white/95 backdrop-blur-xl">
                  {suggestions.map(suggestion => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion.id)}
                      className="w-full flex items-center gap-6 p-5 hover:bg-black/5 transition-colors text-left"
                    >
                      <img src={getThumbnailUrl(suggestion.images[0])} alt="" className="w-20 h-20 object-cover rounded-xl" loading="lazy" />
                      <div className="flex flex-col gap-1">
                        <span className="text-base font-bold uppercase tracking-tight text-[#03401b] leading-tight">{suggestion.name}</span>
                        <span className="text-xs text-zinc-500 font-bold tracking-widest uppercase">{suggestion.sku}</span>
                      </div>
                      <span className="ml-auto text-black font-black text-lg">₹{suggestion.offerPrice}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md" onClick={() => setIsMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-4/5 bg-white border-r border-[#468057]/20 p-8 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex justify-between items-center mb-12 text-[#468057]">
              <img src="/assets/logo_2.png" alt="Riyathnic Logo" className="h-18 w-auto object-contain" />
              <button onClick={() => setIsMenuOpen(false)}><X className="w-8 h-8" /></button>
            </div>
            <div className="flex flex-col space-y-8 text-2xl font-bold uppercase tracking-tight text-[#03401b]">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:text-pink">Home</Link>
              <a href="/#new-arrivals" onClick={() => setIsMenuOpen(false)} className="hover:text-pink">New Arrivals</a>
              <a href="/#best-selling" onClick={() => setIsMenuOpen(false)} className="hover:text-pink">Hot Sellers</a>
              {/* <Link to="/products?cat=hoodie" onClick={() => setIsMenuOpen(false)} className="hover:text-pink">Hoodies</Link> */}
            </div>
            <div className="mt-auto pt-10 border-t border-[#468057]/20 flex flex-col space-y-6 text-[#468057] text-sm font-bold uppercase tracking-widest">
              <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2">
                <User className="w-5 h-5" /> <span>My Account</span>
              </Link>
              <Link to="/wishlist" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2">
                <Heart className="w-5 h-5" /> <span>Wishlist</span>
              </Link>
              <Link to="/cart" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" /> <span>Shopping Bag</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
