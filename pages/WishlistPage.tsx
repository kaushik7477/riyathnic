
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product, User } from '../types';
import ProductCard from '../components/ProductCard';

interface WishlistPageProps {
  wishlist: string[];
  products: Product[];
  toggleWishlist: (productId: string) => void;
  user: User | null;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ wishlist, products, toggleWishlist, user }) => {
  const wishlistedItems = products.filter(p => 
    wishlist.some(id => String(id) === String(p.id) || String(id) === String(p._id))
  );

  if (!user) {
    return (
      <div className="h-screen bg-white text-[#03401b] flex flex-col items-center justify-center space-y-8 p-4">
        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center border border-[#03401b]/10">
          <Heart className="w-10 h-10 text-zinc-500" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black uppercase tracking-tighter">Login Required</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Sign in to save your soul-mate apparel</p>
        </div>
        <Link to="/auth" className="bg-zinc-50 border border-[#03401b]/10 text-[#03401b] px-12 py-4 text-xs font-black uppercase tracking-widest hover:bg-[#03401b] hover:text-white transition-all">
          Authorize Identity
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-[#03401b] pt-10 pb-20">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-12 flex items-center space-x-4">
          <span>My Wishlist</span>
          <span className="text-sm text-zinc-500 font-bold bg-zinc-50 border border-[#03401b]/10 px-3 py-1 rounded-full">{wishlistedItems.length}</span>
        </h1>

        {wishlistedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {wishlistedItems.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={() => {}} 
                toggleWishlist={toggleWishlist} 
                isWishlisted={true} 
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 text-zinc-600">
            <Heart className="w-12 h-12 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">Your signal list is clear</p>
            <Link to="/products" className="text-[#03401b] underline text-xs font-black tracking-widest uppercase">Start Scanning</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
