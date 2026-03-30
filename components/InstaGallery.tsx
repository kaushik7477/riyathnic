import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, ChevronDown } from 'lucide-react';
import { Product } from '../types';
import { getOptimizedUrl, getThumbnailUrl } from '../src/utils/cloudinary';
import SectionHeading from './SectionHeading';

interface InstaItem {
  imageUrl: string;
  views: string;
  sku: string;
}

interface InstaGalleryProps {
  items: InstaItem[];
  products: Product[];
  addToCart: (productId: string, size: string) => void;
}

const InstaGallery: React.FC<InstaGalleryProps> = ({ items, products, addToCart }) => {
  if (!items || items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 pt-4 pb-6 md:pt-6 md:pb-8">
      <div className="text-center mb-6 md:mb-8">
        <SectionHeading title="Instagram Gallery" />
      </div>

      <div className="flex overflow-x-auto pb-8 gap-4 md:gap-6 no-scrollbar">
        {items.map((item, index) => {
          const product = products.find(p => p.sku?.trim().toLowerCase() === item.sku?.trim().toLowerCase());
          if (!product) return null;

          const discount = Math.round(((product.actualPrice - product.offerPrice) / product.actualPrice) * 100);
          const availableSize = Object.entries(product.sizes).find(([_, stock]) => (stock as number) > 0)?.[0] || 'N/A';

          return (
            <div key={index} className="flex-shrink-0 w-[280px] md:w-[320px] group flex flex-col">
              <div className="relative aspect-[2/3] rounded-t-2xl overflow-hidden bg-zinc-100">
                {/* Image */}
                <Link to={`/product/${product.id}`} className="block w-full h-full">
                  <img
                    src={getOptimizedUrl(item.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </Link>

                {/* Top Left: Discount Badge */}
                {discount > 0 && (
                  <div className="absolute top-4 left-0 bg-red-600 text-white text-[10px] font-black px-3 py-1.5 flex items-center shadow-lg">
                    {discount}% OFF
                  </div>
                )}

                {/* Top Right: Views */}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/10 shadow-lg text-white">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black tracking-wider uppercase">{item.views}</span>
                </div>

                {/* Bottom Overlay: Product Info - Transparent Blur */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/30 backdrop-blur-md border-t border-white/10">
                  <div className="flex items-center gap-3">
                    {/* Tiny Thumbnail */}
                    <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-white/20 shadow-lg">
                      <img src={getThumbnailUrl(product.images[0])} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Details */}
                    <div className="flex-grow min-w-0">
                      <h4 className="text-white text-[15px] md:text-[16px] font-bold truncate leading-tight">
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white text-base md:text-lg font-black tracking-tight">₹{product.offerPrice.toLocaleString()}</span>
                        {product.actualPrice > product.offerPrice && (
                          <span className="text-zinc-300 text-[12px] md:text-[13px] line-through decoration-red-600 decoration-2">₹{product.actualPrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* View Product Footer - Red and centered */}
              <Link
                to={`/product/${product.id}`}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-b-2xl text-[11px] font-black uppercase tracking-[2px] transition-all flex items-center justify-center hover:bg-red-700"
              >
                View product
              </Link>
            </div>
          );
        })}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default InstaGallery;
