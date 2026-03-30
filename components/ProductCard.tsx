
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { getThumbnailUrl } from '../src/utils/cloudinary';

interface ProductCardProps {
  product: Product;
  addToCart: (productId: string, size: string) => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, addToCart, toggleWishlist, isWishlisted }) => {
  const discount = Math.round(((product.actualPrice - product.offerPrice) / product.actualPrice) * 100);
  
  // Find first available size
  // Added type cast for stock to prevent the error: Operator '>' cannot be applied to types 'unknown' and 'number'.
  const availableSize = Object.entries(product.sizes).find(([_, stock]) => (stock as number) > 0)?.[0] || 'N/A';

  // Sort sizes logically for display
  const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'Free Size'];
  const productSizes = Object.keys(product.sizes).sort((a, b) => {
    const indexA = ALL_SIZES.indexOf(a);
    const indexB = ALL_SIZES.indexOf(b);
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="group relative bg-white transition-all duration-300 flex flex-col pt-2 pb-4">
      
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-xl aspect-[2/3] mb-4 bg-zinc-100">
        {/* Wishlist Button */}
        <button 
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
          className="absolute top-3 right-3 z-20 bg-white p-2 md:p-2.5 rounded-full shadow-md hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 md:w-5 md:h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-zinc-800'}`} />
        </button>

        {/* Image Gallery */}
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img 
            src={getThumbnailUrl(product.images[0])}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {product.images[1] && (
            <img 
              src={getThumbnailUrl(product.images[1])} 
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            />
          )}
        </Link>
        
        {/* Shopping Bag Button (Overlay on bottom right of image) */}
        <button 
          onClick={(e) => { e.preventDefault(); addToCart(product.id, availableSize); }}
          disabled={availableSize === 'N/A'}
          className="absolute bottom-3 right-3 z-20 bg-white p-2 md:p-2.5 rounded-full shadow-md hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed group/btn"
          title={availableSize === 'N/A' ? 'Out of Stock' : 'Add to Bag'}
        >
          <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 text-zinc-800 group-hover/btn:text-pink transition-colors" />
        </button>
      </div>

      {/* Info Container */}
      <div className="flex flex-col space-y-2 px-1">
        <Link to={`/product/${product.id}`} className="text-[15px] md:text-[16px] font-bold text-[#03401b] line-clamp-2 hover:text-pink transition-colors leading-snug">
          {product.name}
        </Link>
        
        <div className="flex items-center space-x-3 pt-1">
          <span className="text-base md:text-lg font-medium text-zinc-900">₹{product.offerPrice}</span>
          {product.actualPrice > product.offerPrice && (
            <>
              <span className="text-sm md:text-base text-zinc-500 line-through">₹{product.actualPrice}</span>
              <span className="text-sm md:text-base font-medium text-red-500">{discount}% off</span>
            </>
          )}
        </div>

        {/* Sizes */}
        {productSizes.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {productSizes.map(size => {
              const stock = product.sizes[size] as number;
              return (
                <span 
                  key={size} 
                  className={`text-[13px] md:text-[14px] uppercase tracking-wide ${stock > 0 ? 'text-zinc-500' : 'text-zinc-300'}`}
                >
                  {size}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
