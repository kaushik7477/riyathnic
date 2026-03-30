import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload, Link as LinkIcon, Save, Search, Check, AlertTriangle, Eye } from 'lucide-react';
import {
  fetchHeroImages, createHeroImage, deleteHeroImage,
  fetchTags, createTag, deleteTag,
  fetchCategories, updateCategory,
  fetchReviews, createReview, deleteReview,
  uploadImage, fetchProducts,
  fetchWebsiteConfig, updateWebsiteConfig
} from '../../src/api';
import { Product } from '../../types';

const AdminWebsite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hero' | 'tags' | 'web_image' | 'fresh' | 'reviews' | 'coupons' | 'collections' | 'best_sellers' | 'insta_gallery'>('hero');
  const [heroImages, setHeroImages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Best Sellers Config
  const [bestSellersConfig, setBestSellersConfig] = useState<{ productSkus: string[] }>({ productSkus: [] });
  const [bestSellersCount, setBestSellersCount] = useState(4);

  // Fresh Arrivals Config
  const [freshConfig, setFreshConfig] = useState<{ tags: string[], productSkus: string[] }>({ tags: [], productSkus: [] });

  // Collections Config
  const [collectionsConfig, setCollectionsConfig] = useState<{ tag: string, imageUrl: string }[]>([]);

  // Coupons Config
  const [couponConfig, setCouponConfig] = useState({
    coupon1Code: 'SOUL10',
    coupon1Text: 'Flat 10% OFF on all premium puff prints',
    coupon2Code: 'FIRST50',
    coupon2Text: 'Claim your first discount - ₹50 OFF'
  });

  // Forms
  const [newHeroSku, setNewHeroSku] = useState('');
  const [newHeroFile, setNewHeroFile] = useState<File | null>(null);
  const [newHeroPosition, setNewHeroPosition] = useState<number>(1);
  const [showReplaceWarning, setShowReplaceWarning] = useState(false);

  const [newTagName, setNewTagName] = useState('');

  const [newCollectionTag, setNewCollectionTag] = useState('');
  const [newCollectionFile, setNewCollectionFile] = useState<File | null>(null);

  // Web Image Banner Config
  const [webImageConfig, setWebImageConfig] = useState<{ desktopImage: string, mobileImage: string } | null>(null);
  const [desktopBannerFile, setDesktopBannerFile] = useState<File | null>(null);
  const [mobileBannerFile, setMobileBannerFile] = useState<File | null>(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Autoplay Video Config
  const [autoplayVideoConfig, setAutoplayVideoConfig] = useState<{ url: string } | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Double Promotional Banner Config
  const [doublePromoConfig, setDoublePromoConfig] = useState<{ image1: string, image2: string } | null>(null);
  const [promoFile1, setPromoFile1] = useState<File | null>(null);
  const [promoFile2, setPromoFile2] = useState<File | null>(null);
  const [isUploadingPromo, setIsUploadingPromo] = useState(false);

  // Insta-Gallery Config
  const [instaGalleryConfig, setInstaGalleryConfig] = useState<{ imageUrl: string, views: string, sku: string }[]>([]);
  const [newInstaFile, setNewInstaFile] = useState<File | null>(null);
  const [newInstaUrl, setNewInstaUrl] = useState('');
  const [newInstaViews, setNewInstaViews] = useState('');
  const [newInstaSku, setNewInstaSku] = useState('');
  const [isUploadingInsta, setIsUploadingInsta] = useState(false);

  const [newReviewFile, setNewReviewFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // 1. Fetch Products (Critical for Dropdown)
    try {
      const p = await fetchProducts();
      setProducts(p || []);
    } catch (e) {
      // console.error("Failed to load products", e);
      setProducts([]);
    }

    // 2. Fetch Website Content
    try {
      const [h, t, c, r, fConfig, cConfig, colConfig, bsConfig, webImgConfig, autoVidConfig, doublePromo, instaGallery] = await Promise.all([
        fetchHeroImages(),
        fetchTags(),
        fetchCategories(),
        fetchReviews(),
        fetchWebsiteConfig('fresh_arrivals'),
        fetchWebsiteConfig('coupons_section'),
        fetchWebsiteConfig('collections_section'),
        fetchWebsiteConfig('best_sellers'),
        fetchWebsiteConfig('web_image'),
        fetchWebsiteConfig('autoplay_video'),
        fetchWebsiteConfig('double_promo_banner'),
        fetchWebsiteConfig('insta_gallery')
      ]);
      setHeroImages(h);
      setTags(t);
      setCategories(c);
      setReviews(r);
      if (fConfig) setFreshConfig(fConfig);
      if (cConfig) setCouponConfig(cConfig);
      if (colConfig) setCollectionsConfig(colConfig);
      if (bsConfig) {
        setBestSellersConfig(bsConfig);
        setBestSellersCount(bsConfig.productSkus.length || 4);
      }
      if (webImgConfig) setWebImageConfig(webImgConfig);
      if (autoVidConfig) setAutoplayVideoConfig(autoVidConfig);
      if (doublePromo) setDoublePromoConfig(doublePromo);
      if (instaGallery) setInstaGalleryConfig(instaGallery);
    } catch (e) {
      // console.error("Failed to load website configuration data", e);
    }
  };

  const handlePreUploadHero = () => {
    if (!newHeroFile || !newHeroSku) return;

    const existing = heroImages.find(h => h.position === newHeroPosition);
    if (existing) {
      setShowReplaceWarning(true);
    } else {
      handleUploadHero();
    }
  };

  const handleUploadHero = async () => {
    if (!newHeroFile || !newHeroSku) return;
    try {
      const url = await uploadImage(newHeroFile);
      await createHeroImage({ imageUrl: url, sku: newHeroSku, position: newHeroPosition });
      setNewHeroFile(null);
      setNewHeroSku('');
      setShowReplaceWarning(false);
      await loadData();
      alert("Hero image uploaded successfully!");
    } catch (e) {
      // console.error(e);
      alert("Failed to upload hero image.");
    }
  };

  const handleDeleteHero = async (id: string) => {
    await deleteHeroImage(id);
    loadData();
  };

  const handleAddTag = async () => {
    if (!newTagName) return;
    await createTag({ name: newTagName });
    setNewTagName('');
    loadData();
  };

  const handleDeleteTag = async (id: string) => {
    if (window.confirm("Are you sure? This will remove the tag from filter lists but won't affect existing products.")) {
      await deleteTag(id);
      loadData();
    }
  };

  const handleAddCollection = async () => {
    if (!newCollectionTag || !newCollectionFile) return;
    try {
      const url = await uploadImage(newCollectionFile);
      const newCollection = { tag: newCollectionTag, imageUrl: url };
      const updatedCollections = [...collectionsConfig, newCollection];

      await updateWebsiteConfig('collections_section', updatedCollections);
      setCollectionsConfig(updatedCollections);
      setNewCollectionTag('');
      setNewCollectionFile(null);
      alert('Collection added successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to add collection.');
    }
  };

  const handleDeleteCollection = async (tagToRemove: string) => {
    if (window.confirm("Are you sure you want to remove this collection?")) {
      const updatedCollections = collectionsConfig.filter(c => c.tag !== tagToRemove);
      await updateWebsiteConfig('collections_section', updatedCollections);
      setCollectionsConfig(updatedCollections);
    }
  };

  const handleUploadWebImage = async () => {
    if (!desktopBannerFile || !mobileBannerFile) {
      alert("Both desktop and mobile images are mandatory.");
      return;
    }
    setIsUploadingBanner(true);
    try {
      const desktopUrl = await uploadImage(desktopBannerFile);
      const mobileUrl = await uploadImage(mobileBannerFile);

      const newConfig = { desktopImage: desktopUrl, mobileImage: mobileUrl };
      await updateWebsiteConfig('web_image', newConfig);
      setWebImageConfig(newConfig);

      setDesktopBannerFile(null);
      setMobileBannerFile(null);
      alert("Promotional banner updated successfully!");
    } catch (e) {
      alert("Failed to upload promotional banner.");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleDeleteWebImage = async (bannerType: 'desktop' | 'mobile') => {
    if (!webImageConfig) return;
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    const newConfig = { ...webImageConfig };
    if (bannerType === 'desktop') newConfig.desktopImage = '';
    if (bannerType === 'mobile') newConfig.mobileImage = '';

    try {
      await updateWebsiteConfig('web_image', newConfig);
      setWebImageConfig(newConfig);
    } catch (e) {
      alert("Failed to delete banner image.");
    }
  };

  const handleUploadVideo = async () => {
    if (!videoFile) return;
    setIsUploadingVideo(true);
    try {
      const url = await uploadImage(videoFile);
      const newConfig = { url };
      await updateWebsiteConfig('autoplay_video', newConfig);
      setAutoplayVideoConfig(newConfig);
      setVideoFile(null);
      alert("Autoplay video updated successfully!");
    } catch (e) {
      alert("Failed to upload video.");
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm("Are you sure you want to delete the autoplay video?")) return;
    try {
      await updateWebsiteConfig('autoplay_video', { url: '' });
      setAutoplayVideoConfig(null);
    } catch (e) {
      alert("Failed to delete video.");
    }
  };

  const handleUploadDoublePromo = async () => {
    if (!promoFile1 && !promoFile2) {
      alert("Please select at least one image to update.");
      return;
    }
    setIsUploadingPromo(true);
    try {
      let url1 = doublePromoConfig?.image1 || '';
      let url2 = doublePromoConfig?.image2 || '';
      if (promoFile1) url1 = await uploadImage(promoFile1);
      if (promoFile2) url2 = await uploadImage(promoFile2);

      const newConfig = { image1: url1, image2: url2 };
      await updateWebsiteConfig('double_promo_banner', newConfig);
      setDoublePromoConfig(newConfig);
      setPromoFile1(null);
      setPromoFile2(null);
      alert("Double promotional banners updated successfully!");
    } catch (e) {
      alert("Failed to upload promotional banners.");
    } finally {
      setIsUploadingPromo(false);
    }
  };

  const handleDeleteDoublePromo = async (index: 1 | 2) => {
    if (!doublePromoConfig) return;
    if (!window.confirm("Are you sure you want to delete this banner?")) return;
    const newConfig = { ...doublePromoConfig };
    if (index === 1) newConfig.image1 = '';
    else newConfig.image2 = '';

    try {
      await updateWebsiteConfig('double_promo_banner', newConfig);
      setDoublePromoConfig(newConfig);
    } catch (e) {
      alert("Failed to delete banner.");
    }
  };

  const handleUploadReview = async () => {
    if (!newReviewFile) return;
    try {
      const url = await uploadImage(newReviewFile);
      await createReview({ imageUrl: url, isApproved: true });
      setNewReviewFile(null);
      await loadData();
      alert('Review uploaded and approved successfully!');
    } catch (e) {
      alert('Failed to upload review.');
    }
  };

  const handleDeleteReview = async (id: string) => {
    await deleteReview(id);
    loadData();
  };

  const handleUpdateFreshConfig = async () => {
    await updateWebsiteConfig('fresh_arrivals', freshConfig);
    alert('Fresh Arrivals configuration saved!');
  };

  const handleUploadInsta = async () => {
    if ((!newInstaFile && !newInstaUrl) || !newInstaViews || !newInstaSku) {
      alert("Please provide an image (or link), views count, and select a product.");
      return;
    }

    setIsUploadingInsta(true);
    try {
      let imageUrl = newInstaUrl;
      if (newInstaFile) {
        imageUrl = await uploadImage(newInstaFile);
      }

      const newItem = { imageUrl, views: newInstaViews, sku: newInstaSku };
      const updatedConfig = [...instaGalleryConfig, newItem];

      await updateWebsiteConfig('insta_gallery', updatedConfig);
      setInstaGalleryConfig(updatedConfig);

      // Reset form
      setNewInstaFile(null);
      setNewInstaUrl('');
      setNewInstaViews('');
      setNewInstaSku('');
      alert("Insta-Gallery item added successfully!");
    } catch (e) {
      alert("Failed to add Insta-Gallery item.");
    } finally {
      setIsUploadingInsta(false);
    }
  };

  const handleDeleteInsta = async (index: number) => {
    if (!window.confirm("Are you sure you want to delete this gallery item?")) return;

    const updatedConfig = instaGalleryConfig.filter((_, i) => i !== index);
    try {
      await updateWebsiteConfig('insta_gallery', updatedConfig);
      setInstaGalleryConfig(updatedConfig);
    } catch (e) {
      alert("Failed to delete gallery item.");
    }
  };

  const handleSaveCoupons = async () => {
    await updateWebsiteConfig('coupons_section', couponConfig);
    alert('Coupons configuration saved!');
  };

  const handleSaveBestSellers = async () => {
    // Ensure array size matches count
    const skus = bestSellersConfig.productSkus.slice(0, bestSellersCount);
    // Fill remaining with empty strings if needed (though UI handles this)
    while (skus.length < bestSellersCount) {
      skus.push('');
    }
    const finalConfig = { productSkus: skus };
    setBestSellersConfig(finalConfig);
    await updateWebsiteConfig('best_sellers', finalConfig);
    alert('Best Sellers configuration saved!');
  };

  const updateBestSellerSlot = (index: number, sku: string) => {
    const newSkus = [...bestSellersConfig.productSkus];
    // Ensure array is long enough
    while (newSkus.length <= index) newSkus.push('');
    newSkus[index] = sku;
    setBestSellersConfig({ ...bestSellersConfig, productSkus: newSkus });
  };

  const toggleFreshTag = (tagName: string) => {
    setFreshConfig(prev => {
      const newTags = prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName];
      return { ...prev, tags: newTags };
    });
  };

  const toggleFreshProduct = (sku: string) => {
    setFreshConfig(prev => {
      if (prev.productSkus.includes(sku)) {
        return { ...prev, productSkus: prev.productSkus.filter(s => s !== sku) };
      }
      if (prev.productSkus.length >= 12) {
        alert("You can only select up to 12 products.");
        return prev;
      }
      return { ...prev, productSkus: [...prev.productSkus, sku] };
    });
  };

  const isSkuValid = products.some(p => p.sku === newHeroSku);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex space-x-4 border-b border-white/5 pb-4 overflow-x-auto">
        <button onClick={() => setActiveTab('hero')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'hero' ? 'text-green-500' : 'text-zinc-500'}`}>Auto Scroll (Hero)</button>
        <button onClick={() => setActiveTab('fresh')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'fresh' ? 'text-green-500' : 'text-zinc-500'}`}>Fresh Arrivals</button>
        <button onClick={() => setActiveTab('best_sellers')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'best_sellers' ? 'text-green-500' : 'text-zinc-500'}`}>Best Sellers</button>
        <button onClick={() => setActiveTab('tags')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'tags' ? 'text-green-500' : 'text-zinc-500'}`}>Tags</button>
        <button onClick={() => setActiveTab('web_image')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'web_image' ? 'text-green-500' : 'text-zinc-500'}`}>Promotional Banner</button>
        <button onClick={() => setActiveTab('reviews')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'reviews' ? 'text-green-500' : 'text-zinc-500'}`}>Reviews</button>
        <button onClick={() => setActiveTab('coupons')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'coupons' ? 'text-green-500' : 'text-zinc-500'}`}>Coupons</button>
        <button onClick={() => setActiveTab('collections')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'collections' ? 'text-green-500' : 'text-zinc-500'}`}>Collection-Tag</button>
        <button onClick={() => setActiveTab('insta_gallery')} className={`whitespace-nowrap text-sm font-bold uppercase tracking-widest ${activeTab === 'insta_gallery' ? 'text-green-500' : 'text-zinc-500'}`}>Insta-Gallery</button>
      </div>

      {activeTab === 'best_sellers' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold uppercase">Best Sellers Configuration</h3>
            <button onClick={handleSaveBestSellers} className="bg-green-500 text-black px-6 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Save Config</button>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Number of Products to Show</label>
              <input
                type="number" min="1" max="20"
                value={bestSellersCount}
                onChange={(e) => setBestSellersCount(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-sm text-white w-32 text-center font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: bestSellersCount }).map((_, index) => (
                <div key={index} className="bg-zinc-900 border border-white/10 p-4 rounded-lg flex items-center gap-4">
                  <span className="text-2xl font-black text-zinc-700 w-8">{index + 1}</span>
                  <div className="flex-grow">
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Select Product</label>
                    <select
                      className="w-full bg-zinc-800 border border-white/5 px-3 py-2 rounded-lg text-xs text-white"
                      value={bestSellersConfig.productSkus[index] || ''}
                      onChange={(e) => updateBestSellerSlot(index, e.target.value)}
                    >
                      <option value="">-- Select SKU --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.sku}>
                          {p.sku} - {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold uppercase">Coupons Configuration</h3>
            <button onClick={handleSaveCoupons} className="bg-green-500 text-black px-6 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Save Config</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coupon 1 */}
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-lg font-bold uppercase text-green-500">Coupon 1</h4>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Coupon Code</label>
                <input
                  type="text"
                  value={couponConfig.coupon1Code}
                  onChange={(e) => setCouponConfig({ ...couponConfig, coupon1Code: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-sm font-bold focus:outline-none focus:border-green-500"
                  placeholder="e.g. SOUL10"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Description Text</label>
                <input
                  type="text"
                  value={couponConfig.coupon1Text}
                  onChange={(e) => setCouponConfig({ ...couponConfig, coupon1Text: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  placeholder="e.g. Flat 10% OFF..."
                />
              </div>
            </div>

            {/* Coupon 2 */}
            <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
              <h4 className="text-lg font-bold uppercase text-green-500">Coupon 2</h4>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Coupon Code</label>
                <input
                  type="text"
                  value={couponConfig.coupon2Code}
                  onChange={(e) => setCouponConfig({ ...couponConfig, coupon2Code: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-sm font-bold focus:outline-none focus:border-green-500"
                  placeholder="e.g. FIRST50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Description Text</label>
                <input
                  type="text"
                  value={couponConfig.coupon2Text}
                  onChange={(e) => setCouponConfig({ ...couponConfig, coupon2Text: e.target.value })}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  placeholder="e.g. Claim your first..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hero' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-xl font-bold uppercase">Add New Auto-Scroll Image</h3>
            <div className="flex gap-4 items-end flex-wrap">

              {/* Image Upload */}
              <div className="flex-grow min-w-[200px]">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Upload Image</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={e => setNewHeroFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-dashed transition-all ${newHeroFile ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{newHeroFile ? newHeroFile.name : 'Choose File'}</span>
                  </div>
                </div>
              </div>

              {/* Position Selector */}
              <div className="min-w-[100px]">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Position (1-9)</label>
                <select
                  value={newHeroPosition}
                  onChange={e => setNewHeroPosition(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-green-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    const isTaken = heroImages.some(h => Number(h.position) === num);
                    return (
                      <option key={num} value={num}>
                        {num} {isTaken ? '(Occupied)' : '(Empty)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* SKU Link */}
              <div className="flex-grow min-w-[200px]">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Link SKU</label>
                <select
                  value={newHeroSku}
                  onChange={e => setNewHeroSku(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">Select Product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.sku}>
                      {p.name} (SKU: {p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handlePreUploadHero}
                disabled={!newHeroFile || !newHeroSku || !isSkuValid}
                className="bg-green-500 text-black px-6 py-2.5 rounded-lg font-bold uppercase text-xs hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload
              </button>
            </div>

            {/* Replacement Warning */}
            {showReplaceWarning && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm text-yellow-500 font-bold uppercase">Position {newHeroPosition} is already occupied. Replace it?</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowReplaceWarning(false)} className="px-4 py-2 text-xs font-bold uppercase hover:text-white">Cancel</button>
                  <button onClick={handleUploadHero} className="bg-yellow-500 text-black px-4 py-2 rounded text-xs font-bold uppercase hover:bg-yellow-400">Yes, Replace</button>
                </div>
              </div>
            )}
          </div>

          {/* Existing Images Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(pos => {
              const img = heroImages.find(h => Number(h.position) === pos);
              return (
                <div key={pos} className={`relative aspect-video rounded-lg overflow-hidden border ${img ? 'border-white/20 bg-zinc-900' : 'border-white/5 bg-black border-dashed flex items-center justify-center'}`}>
                  <div className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 z-10">
                    #{pos}
                  </div>
                  {img ? (
                    <>
                      <img src={img.imageUrl} className="w-full h-full object-cover" alt={`Hero ${pos}`} />
                      <div className="absolute inset-0 bg-black/80 opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3">
                        <div className="text-center">
                          <p className="text-xs font-bold text-zinc-400 uppercase">Linked SKU</p>
                          <p className="text-sm font-black text-white uppercase">{img.sku}</p>
                        </div>
                        <button onClick={() => handleDeleteHero(img._id)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-zinc-600 text-xs font-bold uppercase">Empty Slot</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'fresh' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold uppercase">Fresh Arrivals Configuration</h3>
            <button onClick={handleUpdateFreshConfig} className="bg-green-500 text-black px-6 py-2 rounded-lg font-bold uppercase text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Save Config</button>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
            <h4 className="text-sm font-bold uppercase text-zinc-400">Select Filter Tags</h4>
            <div className="flex flex-wrap gap-3">
              {tags.map(tag => (
                <button
                  key={tag._id}
                  onClick={() => toggleFreshTag(tag.name)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase border ${freshConfig.tags.includes(tag.name) ? 'bg-green-500 text-black border-green-500' : 'bg-zinc-800 text-zinc-300 border-white/5'}`}
                >
                  {tag.name} {freshConfig.tags.includes(tag.name) && <Check className="w-3 h-3 inline ml-1" />}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
            <h4 className="text-sm font-bold uppercase text-zinc-400">Select Products (Max 12)</h4>
            <p className="text-xs text-zinc-500">Selected: {freshConfig.productSkus.length} / 12</p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 h-96 overflow-y-auto pr-2">
              {products.map(product => {
                const isSelected = freshConfig.productSkus.includes(product.sku);
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleFreshProduct(product.sku)}
                    className={`cursor-pointer border rounded-lg p-2 relative ${isSelected ? 'border-green-500 bg-green-500/10' : 'border-white/5 bg-zinc-900'}`}
                  >
                    <img src={product.images[0]} alt={product.name} className="w-full aspect-square object-cover rounded mb-2" />
                    <p className="text-[10px] font-bold uppercase truncate">{product.name}</p>
                    <p className="text-[10px] text-zinc-400">{product.sku}</p>
                    {isSelected && <div className="absolute top-2 right-2 bg-green-500 text-black p-1 rounded-full"><Check className="w-3 h-3" /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'collections' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-xl font-bold uppercase">Add New Collection Tag</h3>
            <div className="flex gap-4 items-end flex-wrap">
              <div className="min-w-[200px]">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Select Tag</label>
                <select
                  value={newCollectionTag}
                  onChange={e => setNewCollectionTag(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">Choose a Tag</option>
                  {tags.map(tag => (
                    <option key={tag._id} value={tag.name} disabled={collectionsConfig.some(c => c.tag === tag.name)}>
                      {tag.name} {collectionsConfig.some(c => c.tag === tag.name) ? '(Already Added)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-grow min-w-[200px]">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Collection Image</label>
                <input type="file" onChange={e => setNewCollectionFile(e.target.files?.[0] || null)} className="text-xs text-zinc-400 w-full border border-white/10 p-2 rounded-lg" />
              </div>

              <button
                onClick={handleAddCollection}
                disabled={!newCollectionTag || !newCollectionFile}
                className="bg-green-500 text-black px-6 py-2.5 rounded-lg font-bold uppercase text-xs disabled:opacity-50"
              >
                Add Collection
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {collectionsConfig.map((col, i) => (
              <div key={i} className="relative aspect-[4/5] bg-zinc-900 border border-white/5 rounded-lg overflow-hidden">
                <img src={col.imageUrl} className="w-full h-full object-cover" alt={col.tag} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2">
                  <p className="text-center text-xs font-bold uppercase text-white">{col.tag}</p>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDeleteCollection(col.tag)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-xl font-bold uppercase">Add New Filter Tag</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-grow">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg"
                  placeholder="e.g. Oversized, Winter, Limited"
                />
              </div>
              <button onClick={handleAddTag} className="bg-green-500 text-black px-6 py-2 rounded-lg font-bold uppercase text-xs">Add Tag</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag._id} className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-full text-xs font-bold uppercase border border-white/5 flex items-center gap-2 transition-colors">
                {tag.name}
                <button onClick={() => handleDeleteTag(tag._id)} className="opacity-100 transition-opacity text-red-500 hover:text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'web_image' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-6">
            <h3 className="text-xl font-bold uppercase">Update Promotional Banner</h3>
            <p className="text-zinc-400 text-sm">Upload a desktop and a mobile banner. This will replace the full-width image shown on the homepage.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Desktop Upload */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-zinc-500">Desktop Banner (Required)</label>
                <div className="relative">
                  <input type="file" onChange={e => setDesktopBannerFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`flex items-center justify-center gap-2 w-full px-4 py-8 rounded-lg border border-dashed transition-all ${desktopBannerFile ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase">{desktopBannerFile ? desktopBannerFile.name : 'Choose Desktop File'}</span>
                  </div>
                </div>
              </div>
              {/* Mobile Upload */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-zinc-500">Mobile Banner (Required)</label>
                <div className="relative">
                  <input type="file" onChange={e => setMobileBannerFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`flex items-center justify-center gap-2 w-full px-4 py-8 rounded-lg border border-dashed transition-all ${mobileBannerFile ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase">{mobileBannerFile ? mobileBannerFile.name : 'Choose Mobile File'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleUploadWebImage}
                disabled={!desktopBannerFile || !mobileBannerFile || isUploadingBanner}
                className="bg-green-500 text-black px-8 py-3 rounded-lg font-bold uppercase text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingBanner ? 'Uploading...' : 'Save Banner Images'}
              </button>
            </div>
          </div>

          {/* Current Banners */}
          {webImageConfig && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase text-zinc-500">Current Desktop Banner</h4>
                {webImageConfig.desktopImage ? (
                  <div className="relative group rounded-lg overflow-hidden border border-white/5 aspect-[3/1] bg-zinc-900 flex items-center justify-center">
                    <img src={webImageConfig.desktopImage} className="w-full h-full object-cover" alt="Desktop Banner" />
                    <div className="absolute inset-0 bg-black/60 opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 pb-2">
                      <button onClick={() => handleDeleteWebImage('desktop')} className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/1] bg-zinc-900 border border-white/5 border-dashed rounded-lg flex items-center justify-center text-zinc-600 text-xs font-bold uppercase">Empty</div>
                )}
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold uppercase text-zinc-500">Current Mobile Banner</h4>
                {webImageConfig.mobileImage ? (
                  <div className="relative group w-1/2 mx-auto lg:mx-auto rounded-lg overflow-hidden border border-white/5 aspect-[9/16] bg-zinc-900 flex items-center justify-center">
                    <img src={webImageConfig.mobileImage} className="w-full h-full object-cover" alt="Mobile Banner" />
                    <div className="absolute inset-0 bg-black/60 opacity-100 transition-opacity flex flex-col items-center justify-center space-y-3 pb-2">
                      <button onClick={() => handleDeleteWebImage('mobile')} className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-1/2 mx-auto aspect-[9/16] bg-zinc-900 border border-white/5 border-dashed rounded-lg flex items-center justify-center text-zinc-600 text-xs font-bold uppercase">Empty</div>
                )}
              </div>
            </div>
          )}

          {/* Double Promotional Banners (Side-by-Side) */}
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-6 mt-8">
            <h3 className="text-xl font-bold uppercase">Double Promotional Banners</h3>
            <p className="text-zinc-400 text-sm">Upload two promotional images to be shown side-by-side on desktop and stacked on mobile under the "Loved By Customers" section.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image 1 Upload */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-zinc-500">Banner 1</label>
                <div className="relative">
                  <input type="file" onChange={e => setPromoFile1(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`flex items-center justify-center gap-2 w-full px-4 py-8 rounded-lg border border-dashed transition-all ${promoFile1 ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase">{promoFile1 ? promoFile1.name : 'Choose Image 1'}</span>
                  </div>
                </div>
              </div>
              {/* Image 2 Upload */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-zinc-500">Banner 2</label>
                <div className="relative">
                  <input type="file" onChange={e => setPromoFile2(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className={`flex items-center justify-center gap-2 w-full px-4 py-8 rounded-lg border border-dashed transition-all ${promoFile2 ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                    <Upload className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase">{promoFile2 ? promoFile2.name : 'Choose Image 2'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleUploadDoublePromo}
                disabled={(!promoFile1 && !promoFile2) || isUploadingPromo}
                className="bg-green-500 text-black px-8 py-3 rounded-lg font-bold uppercase text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingPromo ? 'Uploading...' : 'Save Double Banners'}
              </button>
            </div>

            {/* Current Double Banners */}
            {doublePromoConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                {doublePromoConfig.image1 && (
                  <div className="relative group rounded-lg overflow-hidden border border-white/5 aspect-square bg-zinc-900 flex items-center justify-center">
                    <img src={doublePromoConfig.image1} className="w-full h-full object-cover" alt="Banner 1" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => handleDeleteDoublePromo(1)} className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                {doublePromoConfig.image2 && (
                  <div className="relative group rounded-lg overflow-hidden border border-white/5 aspect-square bg-zinc-900 flex items-center justify-center">
                    <img src={doublePromoConfig.image2} className="w-full h-full object-cover" alt="Banner 2" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => handleDeleteDoublePromo(2)} className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Autoplay Video Sub-Section */}
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-6 mt-8">
            <h3 className="text-xl font-bold uppercase">Autoplay Background Video</h3>
            <p className="text-zinc-400 text-sm">Upload a looping video (MP4, MOV, WebM) to be displayed on the homepage between Categories and Fresh Arrivals. No audio or controls will be shown.</p>

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase text-zinc-500">Video File</label>
              <div className="relative">
                <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={e => setVideoFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className={`flex items-center justify-center gap-2 w-full px-4 py-8 rounded-lg border border-dashed transition-all ${videoFile ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                  <Upload className="w-6 h-6" />
                  <span className="text-sm font-bold uppercase">{videoFile ? videoFile.name : 'Choose Video File'}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleUploadVideo}
                disabled={!videoFile || isUploadingVideo}
                className="bg-green-500 text-black px-8 py-3 rounded-lg font-bold uppercase text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingVideo ? 'Uploading...' : 'Save Video'}
              </button>
            </div>

            {/* Current Video */}
            {autoplayVideoConfig && autoplayVideoConfig.url && (
              <div className="mt-8 space-y-2">
                <h4 className="text-sm font-bold uppercase text-zinc-500">Current Video</h4>
                <div className="relative group rounded-lg overflow-hidden border border-white/5 aspect-video bg-black flex items-center justify-center w-full max-w-md">
                  <video src={autoplayVideoConfig.url} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={handleDeleteVideo} className="bg-red-500 p-3 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'insta_gallery' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-6">
            <h3 className="text-xl font-bold uppercase">Add New Insta-Gallery Post</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Upload / Link */}
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-zinc-500">Image Source (Upload or Link)</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={e => {
                      setNewInstaFile(e.target.files?.[0] || null);
                      if (e.target.files?.[0]) setNewInstaUrl('');
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-dashed transition-all ${newInstaFile ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-zinc-700 hover:border-white text-zinc-400'}`}>
                    <Upload className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{newInstaFile ? newInstaFile.name : 'Choose Image File'}</span>
                  </div>
                </div>
                {/* <div className="flex items-center gap-2">
                  <div className="h-px bg-white/10 flex-grow"></div>
                  <span className="text-[10px] font-bold uppercase text-zinc-600">OR</span>
                  <div className="h-px bg-white/10 flex-grow"></div>
                </div> */}
                {/* <input
                  type="text"
                  placeholder="Paste Instagram Image/Post Link"
                  value={newInstaUrl}
                  onChange={e => {
                    setNewInstaUrl(e.target.value);
                    if (e.target.value) setNewInstaFile(null);
                  }}
                  className="w-full bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-green-500"
                /> */}
              </div>

              {/* Views and SKU */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Display Views (e.g., 2.7K, 74)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Eye className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 2.7K"
                      value={newInstaViews}
                      onChange={e => setNewInstaViews(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 pl-11 pr-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Linked Product SKU</label>
                  <select
                    value={newInstaSku}
                    onChange={e => setNewInstaSku(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  >
                    <option value="">-- Select Product SKU --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.sku}>
                        {p.sku} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={handleUploadInsta}
                disabled={(!newInstaFile && !newInstaUrl) || !newInstaViews || !newInstaSku || isUploadingInsta}
                className="bg-green-500 text-black px-8 py-3 rounded-lg font-bold uppercase text-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isUploadingInsta ? 'Adding...' : 'Add Gallery Item'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {instaGalleryConfig.map((item, index) => {
              const product = products.find(p => p.sku === item.sku);
              return (
                <div key={index} className="bg-zinc-900 border border-white/5 rounded-xl overflow-hidden relative group aspect-[3/4]">
                  <img src={item.imageUrl} className="w-full h-full object-cover" alt="Gallery" />

                  {/* Overlay for Info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-between items-start">
                      <span className="bg-green-500 text-black text-[10px] font-black px-2 py-1 rounded">
                        {item.views} VIEWS
                      </span>
                      <button onClick={() => handleDeleteInsta(index)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="bg-black/80 p-2 rounded-lg border border-white/10">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">Linked SKU</p>
                      <p className="text-xs font-black text-white truncate">{item.sku}</p>
                      {product && <p className="text-[10px] text-green-500 truncate">{product.name}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-xl font-bold uppercase">Add New Review</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-grow">
                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Upload Image</label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={e => setNewReviewFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-white/70 hover:text-white transition-all text-xs font-bold uppercase">
                    <Upload className="w-4 h-4" />
                    <span>{newReviewFile ? newReviewFile.name : 'Choose Image'}</span>
                  </div>
                </div>
              </div>
              <button onClick={handleUploadReview} className="bg-green-500 text-black px-6 py-2 rounded-lg font-bold uppercase text-xs">Upload</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reviews.map(review => (
              <div key={review._id} className="relative aspect-[3/4] bg-zinc-900 border border-white/5 rounded-lg overflow-hidden">
                <img src={review.imageUrl} className="w-full h-full object-cover" alt="Review" />
                <div className="absolute inset-0 bg-black/50 opacity-100 transition-opacity flex items-center justify-center">
                  <button onClick={() => handleDeleteReview(review._id)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWebsite;
