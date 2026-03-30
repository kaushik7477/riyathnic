
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, LayoutGrid, List } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';
import { fetchTags } from '../src/api';

interface ProductPageProps {
  products: Product[];
  addToCart: (productId: string, size: string) => void;
  toggleWishlist: (productId: string) => void;
  wishlist: string[];
}

const ProductPage: React.FC<ProductPageProps> = ({ products, addToCart, toggleWishlist, wishlist }) => {
  const [searchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('relevant');
  const [filterCat, setFilterCat] = useState(searchParams.get('cat') || 'All');
  const [tags, setTags] = useState<{ name: string }[]>([]);

  useEffect(() => {
    const loadTags = async () => {
      try {
        const data = await fetchTags();
        setTags(data);
      } catch (e) {
      }
    };
    loadTags();
  }, []);

  const filterOptions = useMemo(() => {
    const names = tags.map(t => t.name);
    return ['All', ...names];
  }, [tags]);
  
  // Tag filter from URL
  const filterTag = searchParams.get('tag');

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    if (filterCat !== 'All') {
      const f = filterCat.toLowerCase();
      result = result.filter(p =>
        (p.category && p.category.some(c => c.toLowerCase() === f)) ||
        (p.tags && p.tags.some(t => t.toLowerCase() === f))
      );
    }

    if (filterTag) {
      result = result.filter(p => p.tags && p.tags.includes(filterTag));
    }

    const gender = searchParams.get('gender');
    if (gender) {
      result = result.filter(p => 
        (p.category && p.category.some(c => c.toLowerCase() === gender.toLowerCase())) ||
        (p.tags && p.tags.some(t => t.toLowerCase() === gender.toLowerCase()))
      );
    }

    const query = searchParams.get('q');
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) ||
        p.category.some(c => c.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'price-low') result.sort((a, b) => a.offerPrice - b.offerPrice);
    if (sortBy === 'price-high') result.sort((a, b) => b.offerPrice - a.offerPrice);
    if (sortBy === 'discount') result.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));

    return result;
  }, [products, filterCat, sortBy, searchParams]);

  return (
    <div className="bg-white min-h-screen text-[#03401b] pt-10 pb-20 font-heading">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b border-[#03401b]/10 pb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">The Collection</h1>
            <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest">{filteredProducts.length} Artifacts Found</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex bg-white p-1 rounded-lg border border-[#03401b]/10 shadow-sm">
              {filterOptions.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md ${filterCat === cat ? 'bg-[#03401b] text-white shadow-md' : 'text-zinc-500 hover:text-[#03401b]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 bg-white border border-[#03401b]/10 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:border-[#03401b]/30 shadow-sm rounded-lg transition-all">
                <span>Sort: {sortBy.replace('-', ' ')}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#03401b]/10 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 rounded-lg overflow-hidden">
                <button onClick={() => setSortBy('relevant')} className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-[#03401b]">Relevant</button>
                <button onClick={() => setSortBy('price-low')} className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-[#03401b]">Price Low to High</button>
                <button onClick={() => setSortBy('price-high')} className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-[#03401b]">Price High to Low</button>
                <button onClick={() => setSortBy('discount')} className="w-full text-left px-4 py-3 hover:bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-[#03401b]">Most Discounted</button>
              </div>
            </div>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                addToCart={addToCart} 
                toggleWishlist={toggleWishlist} 
                isWishlisted={wishlist.includes(product.id)} 
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 text-zinc-600">
            <Filter className="w-12 h-12 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-sm">No items match your DNA signature</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;
