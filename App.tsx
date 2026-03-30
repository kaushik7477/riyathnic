
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import NotFoundPage from './pages/NotFoundPage';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import OrderDetailsPage from './pages/OrderDetailsPage';
import AboutUs from './pages/AboutUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ReturnPolicy from './pages/ReturnPolicy';
import ShippingPolicy from './pages/ShippingPolicy';
import TermsOfService from './pages/TermsOfService';
import ContactHub from './pages/ContactHub';
 import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFinance from './pages/admin/AdminFinance';
import AdminSettings from './pages/admin/AdminSettings';
import AdminWebsite from './pages/admin/AdminWebsite';
import AdminTools from './pages/admin/AdminTools';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminExchanges from './pages/admin/AdminExchanges';
import { Product, User } from './types';
import { DUMMY_PRODUCTS } from './constants';
import { fetchProducts, saveCart, fetchCart, saveWishlist, fetchWishlist, socket } from './src/api';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  
  // Disable browser automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    // Immediate scroll
    window.scrollTo(0, 0);
    
    // Backup scroll for slower loading content
    const timeout = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }, 10);

    return () => clearTimeout(timeout);
  }, [pathname, search]);
  
  return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [cart, setCart] = useState<{ productId: string; quantity: number; size: string; isGift?: boolean }[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts();
        if (data && data.length > 0) {
           setAllProducts(data);
        } else {
           setAllProducts(DUMMY_PRODUCTS);
        }
      } catch (e) {
        setAllProducts(DUMMY_PRODUCTS);
      }
    };
    loadProducts();

    // Socket listeners for real-time updates
    socket.on('product_created', (newProduct: any) => {
      const mapped = { ...newProduct, id: newProduct._id };
      setAllProducts(prev => [mapped, ...prev]);
    });

    socket.on('product_updated', (updatedProduct: any) => {
      const mapped = { ...updatedProduct, id: updatedProduct._id };
      setAllProducts(prev => prev.map(p => (p._id === mapped._id || p.id === mapped.id) ? mapped : p));
    });

    socket.on('product_deleted', (productId: string) => {
      setAllProducts(prev => prev.filter(p => p._id !== productId && p.id !== productId));
    });

    socket.on('stock_updated', ({ productId, size, newStock }: { productId: string, size: string, newStock: number }) => {
      setAllProducts(prev => prev.map(p => {
        if (p._id === productId || p.id === productId) {
          return {
            ...p,
            sizes: {
              ...p.sizes,
              [size]: newStock
            }
          };
        }
        return p;
      }));
    });

    socket.on('order_created', (newOrder: any) => {
      // Logic for orders if needed in App state
    });

    return () => {
      socket.off('product_created');
      socket.off('product_updated');
      socket.off('product_deleted');
      socket.off('stock_updated');
      socket.off('order_created');
    };
  }, []);

  // Persistence (Mock)
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else {
      localStorage.removeItem('user');
      setWishlist([]); // Clear wishlist on logout
      setCart([]); // Clear cart on logout
    }
  }, [user]);

  // Sync cart to backend
  useEffect(() => {
    if (user && user.id) {
      const timer = setTimeout(() => {
        saveCart(user.id, cart).catch(err => console.error("Cart sync failed", err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [cart, user?.id]);

  // Sync wishlist to backend
  useEffect(() => {
    if (user && user.id) {
      const timer = setTimeout(() => {
        saveWishlist(user.id, wishlist).catch(err => console.error("Wishlist sync failed", err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [wishlist, user?.id]);

  // Load cart on login
  useEffect(() => {
    if (user && user.id) {
       fetchCart(user.id).then(remoteCart => {
         if (remoteCart && remoteCart.length > 0) {
            setCart(prev => {
                if (prev.length === 0) return remoteCart;
                return prev; 
            });
         }
       }).catch(e => console.error(e));
    }
  }, [user?.id]);

  // Load wishlist on login
  useEffect(() => {
    if (user && user.id) {
      fetchWishlist(user.id).then(remoteWishlist => {
        if (remoteWishlist && remoteWishlist.length > 0) {
          setWishlist(prev => {
            if (prev.length === 0) return remoteWishlist;
            return prev;
          });
        }
      }).catch(e => console.error(e));
    }
  }, [user?.id]);

  const addToCart = (productId: string, size: string, quantity: number = 1, isGift: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId && item.size === size && !!item.isGift === isGift);
      if (existing) {
        return prev.map(item => (item.productId === productId && item.size === size && !!item.isGift === isGift) ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { productId, size, quantity, isGift }];
    });
  };

  const updateCartItem = (productId: string, size: string, quantity: number, isGift: boolean = false) => {
    setCart(prev => prev.map(item => {
        if (item.productId === productId && item.size === size && !!item.isGift === isGift) {
            return { ...item, quantity };
        }
        return item;
    }));
  };

  const updateCartItemSize = (productId: string, oldSize: string, newSize: string, isGift: boolean = false) => {
    setCart(prev => prev.map(item => {
        if (item.productId === productId && item.size === oldSize && !!item.isGift === isGift) {
            return { ...item, size: newSize };
        }
        return item;
    }));
  };

  const removeFromCart = (productId: string, size: string, isGift: boolean = false) => {
    setCart(prev => prev.filter(item => !(item.productId === productId && item.size === size && !!item.isGift === isGift)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  };

  return (
    <HashRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        {!isAdmin && <Header user={user} cartCount={cart.length} wishlistCount={wishlist.length} products={allProducts} />}
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} user={user} setUser={setUser} />} />
            <Route path="/products" element={<ProductPage products={allProducts} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/product/:id" element={<ProductDetails products={allProducts} cart={cart} addToCart={addToCart} toggleWishlist={toggleWishlist} wishlist={wishlist} />} />
            <Route path="/cart" element={<CartPage cart={cart} addToCart={addToCart} updateCartItem={updateCartItem} updateCartItemSize={updateCartItemSize} removeFromCart={removeFromCart} clearCart={clearCart} user={user} setUser={setUser} products={allProducts} />} />
            <Route path="/wishlist" element={<WishlistPage wishlist={wishlist} toggleWishlist={toggleWishlist} products={allProducts} user={user} />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} setUser={setUser} wishlistCount={wishlist.length} /> : <Navigate to="/auth" />} />
            <Route path="/order/:orderId" element={user ? <OrderDetailsPage user={user} products={allProducts} /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={user ? <Navigate to="/profile" /> : <AuthPage setUser={setUser} />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/contact-hub" element={<ContactHub />} />
             
             {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout isAdmin={isAdmin} setIsAdmin={setIsAdmin} />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts products={allProducts} setProducts={setAllProducts} />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="exchanges" element={<AdminExchanges />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="website" element={<AdminWebsite />} />
              <Route path="tools" element={<AdminTools />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {!isAdmin && <Footer />}

        {/* Floating WhatsApp Button */}
        {!isAdmin && (
          <a
            href="https://wa.me/916289388029"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9999] group"
          >
            <div className="relative">
              <div className="relative p-0 hover:scale-105 transition-transform duration-300">
                <img 
                  src="/assets/whatsapp.png" 
                  alt="WhatsApp Chat" 
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>
              
              {/* Tooltip */}
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-zinc-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-zinc-100">
                Chat with us
              </div>
            </div>
          </a>
        )}
      </div>
    </HashRouter>
  );
};

export default App;
