import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, ExternalLink, X, Upload, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';
import { createProduct, updateProduct, deleteProduct, fetchTags, createTag, deleteTag, uploadImage, fetchCategories, deleteCategory } from '../../src/api';

interface AdminProductsProps {
    products: Product[];
    setProducts: (products: Product[]) => void;
}

const AdminProducts: React.FC<AdminProductsProps> = ({ products, setProducts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const [newTagName, setNewTagName] = useState('');
    const [showTagInput, setShowTagInput] = useState(false);
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Dropdown Options State (Dynamic + Defaults)
    const defaultQualities = ['100% Cotton', 'Silk', 'Polyester', 'Blend', '240GSM French Terry'];
    const defaultPickupPoints = ['Warehouse A', 'Store Front', 'Dispatch Center'];
    const defaultCancelPolicies = ['Anytime', 'Under 24 Hours', 'Under 6 Hours', 'Before Dispatch', 'No Cancellation'];
    const defaultColors = [
        { name: 'Red', hex: '#FF0000' },
        { name: 'White', hex: '#FFFFFF' },
        { name: 'Blue', hex: '#0000FF' },
        { name: 'Black', hex: '#000000' }
    ];

    const [customOptions, setCustomOptions] = useState({
        quality: '',
        pickupPoint: '',
        exchangePolicy: '',
        cancelPolicy: '',
        color: { name: '', hex: '#000000' }
    });

    const [addingOption, setAddingOption] = useState<string | null>(null); // 'quality', 'pickup', etc.
    const formRef = useRef<HTMLDivElement | null>(null);

    // Form State
    const initialFormState = {
        name: '',
        sku: '',
        actualPrice: '',
        offerPrice: '',
        description: '',
        isBestSelling: false,
        sizes: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } as { [key: string]: number },
        category: [] as string[], // Used for Gender/Type
        tags: [] as string[],
        quality: '',
        pickupPoint: '',
        exchangePolicy: { type: 'days', days: 7 } as Product['exchangePolicy'],
        cancelPolicy: '',
        color: { name: 'Black', hex: '#000000' },
        linkedProducts: [] as string[],
        countryOfOrigin: 'India',
        manufactureDate: new Date().toISOString().split('T')[0],
        productionCost: ''
    };

    const [formData, setFormData] = useState({
        ...initialFormState
    });
    const [productImages, setProductImages] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [skuError, setSkuError] = useState<string | null>(null);

    useEffect(() => {
        loadTags();
        loadCategories();
    }, []);

    useEffect(() => {
        if (isAdding && isEditing && formRef.current) {
            formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isAdding, isEditing]);

    const loadCategories = async () => {
        try {
            const cats = await fetchCategories();
            // Only keep the main structural categories as defaults if DB is empty, or just rely on DB
            // We will render availableCategories
            setAvailableCategories(cats);
        } catch (e) {
            // console.error("Failed to load categories", e);
        }
    };

    const loadTags = async () => {
        try {
            const tags = await fetchTags();
            setAvailableTags(tags);
        } catch (e) {
            console.error("Failed to load tags", e);
        }
    };

    // Derived Options from existing products
    const derivedOptions = useMemo(() => {
        const qualities = new Set(defaultQualities);
        const pickups = new Set(defaultPickupPoints);
        const cancels = new Set(defaultCancelPolicies);

        products.forEach(p => {
            if (p.quality) qualities.add(p.quality);
            if (p.pickupPoint) pickups.add(p.pickupPoint);
            if (p.cancelPolicy) cancels.add(p.cancelPolicy);
        });

        return {
            qualities: Array.from(qualities),
            pickups: Array.from(pickups),
            cancels: Array.from(cancels)
        };
    }, [products]);

    const handleAddNewTag = async () => {
        if (!newTagName.trim()) return;
        try {
            await createTag({ name: newTagName });
            setAvailableTags([...availableTags, { name: newTagName }]);
            setNewTagName('');
            setShowTagInput(false);
        } catch (e) {
            // console.error("Failed to add tag", e);
        }
    };

    const handleDeleteTag = async (id: string) => {
        if (window.confirm("Delete this tag globally?")) {
            await deleteTag(id);
            loadTags();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if (window.confirm("Delete this category globally?")) {
            await deleteCategory(id);
            loadCategories();
        }
    };

    const handleSkuChange = (sku: string) => {
        setFormData(prev => ({ ...prev, sku }));

        // Check if SKU exists (excluding current product if editing)
        const exists = products.find(p => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== isEditing);
        if (exists) {
            setSkuError(`SKU "${sku}" already exists! Click to load existing product.`);
        } else {
            setSkuError(null);
        }
    };

    const loadExistingProductBySku = () => {
        const exists = products.find(p => p.sku.toLowerCase() === formData.sku.toLowerCase());
        if (exists) {
            handleEdit(exists);
            setSkuError(null);
        }
    };

    const handleEdit = (product: Product) => {
        setIsEditing(product.id);
        setIsAdding(true);
        setFormData({
            name: product.name,
            sku: product.sku,
            actualPrice: product.actualPrice.toString(),
            offerPrice: product.offerPrice.toString(),
            description: product.description,
            isBestSelling: product.isBestSelling || false,
            sizes: product.sizes || { S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
            category: product.category || [],
            tags: product.tags || [],
            quality: product.quality || '',
            pickupPoint: product.pickupPoint || '',
            exchangePolicy: product.exchangePolicy || { type: 'days', days: 7 },
            cancelPolicy: product.cancelPolicy || '',
            color: product.color || { name: 'Black', hex: '#000000' },
            linkedProducts: product.linkedProducts || [],
            countryOfOrigin: product.countryOfOrigin || 'India',
            manufactureDate: product.manufactureDate ? new Date(product.manufactureDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            productionCost: product.productionCost?.toString() || ''
        });
        setExistingImages(product.images || []);
        setProductImages([]);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteProduct(deleteId);
            // Removed manual setProducts, let WebSocket handle it
            setDeleteId(null);
        } catch (e) {
            console.error("Failed to delete", e);
            alert("Failed to delete product");
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.sku) {
            alert("Name and SKU are required");
            return;
        }
        if (productImages.length + existingImages.length < 1) {
            alert("At least 1 image is mandatory");
            return;
        }
        if (productImages.length + existingImages.length > 10) {
            alert("Maximum 10 images allowed");
            return;
        }

        try {
            // Upload new images
            const newImageUrls = await Promise.all(productImages.map(file => uploadImage(file)));
            const allImages = [...existingImages, ...newImageUrls];

            const payload = {
                ...formData,
                actualPrice: Number(formData.actualPrice),
                offerPrice: Number(formData.offerPrice),
                productionCost: Number(formData.productionCost) || 0,
                images: allImages,
                manufactureDate: new Date(formData.manufactureDate)
            };

            if (isEditing) {
                await updateProduct(isEditing, payload);
                // Removed manual setProducts, let WebSocket handle it
                alert("Artifact Updated Successfully");
            } else {
                await createProduct(payload);
                // Removed manual setProducts, let WebSocket handle it
                alert("Artifact Created Successfully");
            }

            setIsAdding(false);
            setIsEditing(null);
            setFormData(initialFormState);
            setProductImages([]);
            setExistingImages([]);
        } catch (e: any) {
            // console.error("Operation failed", e);
            alert("Operation Failed: " + (e.response?.data?.error || e.message));
        }
    };

    const toggleListSelection = (list: string[], item: string, field: 'tags' | 'category') => {
        setFormData(prev => ({
            ...prev,
            [field]: list.includes(item) ? list.filter(i => i !== item) : [...list, item]
        }));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full space-y-6 shadow-2xl shadow-red-900/20">
                        <div className="flex items-center gap-4 text-red-500">
                            <AlertTriangle className="w-8 h-8" />
                            <h3 className="text-xl font-black uppercase tracking-tight text-white">Delete Artifact?</h3>
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                            Are you sure you want to delete this product? This action cannot be undone and will remove the product from the store immediately.
                        </p>
                        <div className="flex justify-end gap-4 pt-2">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="bg-red-500 text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter">Inventory Lab</h1>
                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Manage your artifacts</p>
                </div>
                <button
                    onClick={() => {
                        setIsAdding(!isAdding);
                        setIsEditing(null);
                        setFormData(initialFormState);
                        setExistingImages([]);
                        setProductImages([]);
                    }}
                    className="bg-green-500 text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-white transition-all"
                >
                    {isAdding ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    <span>{isAdding ? 'Cancel' : 'Upload Drop'}</span>
                </button>
            </div>

            {isAdding && (
                <div ref={formRef} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 space-y-8">
                    <h2 className="text-xl font-bold uppercase text-white mb-6 border-b border-white/10 pb-4">
                        {isEditing ? 'Edit Artifact' : 'New Artifact'}
                    </h2>

                    {/* 1. Tag Selection */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-bold uppercase text-zinc-500">Tags & Categories</label>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                                    className={`flex items-center gap-2 text-[10px] font-bold uppercase transition-colors ${isDeleteMode ? 'text-red-500' : 'text-zinc-500 hover:text-white'}`}
                                >
                                    <Trash2 className="w-3 h-3" />
                                    {isDeleteMode ? 'Done Deleting' : 'Delete Tags'}
                                </button>
                                <button onClick={() => setShowTagInput(!showTagInput)} className="text-[10px] text-green-500 uppercase font-bold hover:underline">+ Add Tag</button>
                            </div>
                        </div>
                        {showTagInput && (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTagName}
                                    onChange={(e) => setNewTagName(e.target.value)}
                                    placeholder="New Tag Name"
                                    className="bg-zinc-800 border border-white/10 px-3 py-1 rounded text-xs text-white"
                                />
                                <button onClick={handleAddNewTag} className="bg-green-500 text-black px-3 py-1 rounded text-xs font-bold">Add</button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {availableTags.map((tag, index) => (
                                <div key={tag._id || tag.name || index} className={`flex items-center rounded-full border transition-all ${formData.tags.includes(tag.name) ? 'bg-green-500 text-black border-green-500' : 'bg-zinc-800 text-zinc-400 border-white/10'}`}>
                                    <button
                                        onClick={() => toggleListSelection(formData.tags, tag.name, 'tags')}
                                        className="px-3 py-1 text-[10px] font-bold uppercase"
                                    >
                                        {tag.name}
                                    </button>
                                    {isDeleteMode && tag._id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteTag(tag._id); }}
                                            className="pr-2 pl-1 hover:text-red-500"
                                            title="Delete Tag"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}

                            {/* Render Fetched Categories or Defaults if Empty */}
                            {(availableCategories.length > 0 ? availableCategories : [
                                { name: 'Men' }, { name: 'Women' }, { name: 'Couple' }, { name: 'Unisex' }
                            ]).map((cat, index) => (
                                <div key={cat._id || cat.name || index} className={`flex items-center rounded-full border transition-all ${formData.category.includes(cat.name) ? 'bg-blue-500 text-white border-blue-500' : 'bg-zinc-800 text-zinc-400 border-white/10'}`}>
                                    <button
                                        onClick={() => toggleListSelection(formData.category, cat.name, 'category')}
                                        className="px-3 py-1 text-[10px] font-bold uppercase"
                                    >
                                        {cat.name}
                                    </button>
                                    {isDeleteMode && cat._id && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat._id); }}
                                            className="pr-2 pl-1 hover:text-red-500"
                                            title="Delete Category"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Name & SKU */}
                            <div className="space-y-4">
                                <input
                                    type="text" placeholder="Product Name *"
                                    className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-white placeholder-zinc-500"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <div className="relative">
                                    <input
                                        type="text" placeholder="SKU / Unique ID *"
                                        className={`w-full bg-zinc-900 border px-4 py-3 rounded-lg text-white placeholder-zinc-500 ${skuError ? 'border-red-500' : 'border-white/10'}`}
                                        value={formData.sku} onChange={e => handleSkuChange(e.target.value)}
                                        disabled={!!isEditing} // Lock SKU when editing
                                    />
                                    {skuError && (
                                        <div
                                            onClick={loadExistingProductBySku}
                                            className="absolute right-2 top-2 bg-red-500/20 text-red-500 text-[10px] px-2 py-1 rounded cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
                                        >
                                            Exists! Load?
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex gap-4">
                                <input
                                    type="number" placeholder="Actual Price"
                                    className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-white"
                                    value={formData.actualPrice} onChange={e => setFormData({ ...formData, actualPrice: e.target.value })}
                                />
                                <input
                                    type="number" placeholder="Offer Price"
                                    className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-white"
                                    value={formData.offerPrice} onChange={e => setFormData({ ...formData, offerPrice: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <textarea
                                placeholder="Description"
                                className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg h-32 text-white"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />

                            {/* Quality & Origin */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Quality</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
                                        value={formData.quality}
                                        onChange={(e) => {
                                            if (e.target.value === 'NEW') {
                                                const val = prompt("Enter new quality:");
                                                if (val) setFormData({ ...formData, quality: val });
                                            } else {
                                                setFormData({ ...formData, quality: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">Select Quality</option>
                                        {derivedOptions.qualities.map(q => <option key={q} value={q}>{q}</option>)}
                                        {formData.quality && !derivedOptions.qualities.includes(formData.quality) && (
                                            <option value={formData.quality}>{formData.quality}</option>
                                        )}
                                        <option value="NEW" className="text-green-500 font-bold">+ Create New</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Country of Origin</label>
                                    <input
                                        type="text"
                                        className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
                                        value={formData.countryOfOrigin}
                                        onChange={e => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Exchange Policy & Cancellation */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Exchange Policy</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-white text-xs"
                                        value={formData.exchangePolicy.type}
                                        onChange={e => setFormData({
                                            ...formData,
                                            exchangePolicy: {
                                                ...formData.exchangePolicy,
                                                type: e.target.value as 'days' | 'no-exchange'
                                            }
                                        })}
                                    >
                                        <option value="days">Days After Delivery</option>
                                        <option value="no-exchange">No Exchange</option>
                                    </select>
                                    {formData.exchangePolicy.type === 'days' && (
                                        <input
                                            type="number"
                                            placeholder="Days (e.g. 7)"
                                            className="w-full mt-2 bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg text-white text-xs"
                                            value={formData.exchangePolicy.days || ''}
                                            onChange={e => setFormData({
                                                ...formData,
                                                exchangePolicy: {
                                                    ...formData.exchangePolicy,
                                                    days: Number(e.target.value)
                                                }
                                            })}
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Cancellation Policy</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-white/10 px-4 py-3 rounded-lg text-white text-xs"
                                        value={formData.cancelPolicy}
                                        onChange={e => setFormData({ ...formData, cancelPolicy: e.target.value })}
                                    >
                                        <option value="">Select Policy</option>
                                        {derivedOptions.cancels.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Pickup Point & Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Pickup Point</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
                                        value={formData.pickupPoint}
                                        onChange={(e) => {
                                            if (e.target.value === 'NEW') {
                                                const val = prompt("Enter new pickup point:");
                                                if (val) setFormData({ ...formData, pickupPoint: val });
                                            } else {
                                                setFormData({ ...formData, pickupPoint: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">Select Point</option>
                                        {derivedOptions.pickups.map(q => <option key={q} value={q}>{q}</option>)}
                                        {formData.pickupPoint && !derivedOptions.pickups.includes(formData.pickupPoint) && (
                                            <option value={formData.pickupPoint}>{formData.pickupPoint}</option>
                                        )}
                                        <option value="NEW" className="text-green-500 font-bold">+ Create New</option>
                                    </select>

                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Manufacture Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
                                        value={formData.manufactureDate}
                                        onChange={e => setFormData({ ...formData, manufactureDate: e.target.value })}
                                    />
                                </div>

                            </div>
                            <p className="mt-1 text-[10px] font-bold italic" style={{ color: '#612225' }}>
                                * mask the best seller from left Manu ( website -{">"} Best Sellers )
                            </p>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Images */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Images (Min 1, Max 10)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {existingImages.map((img, i) => (
                                        <div key={i} className="relative w-16 h-16 rounded overflow-hidden group">
                                            <img src={img} className="w-full h-full object-cover" alt="" />
                                            <button
                                                onClick={() => setExistingImages(existingImages.filter((_, idx) => idx !== i))}
                                                className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <input
                                    type="file" multiple accept="image/*"
                                    onChange={e => {
                                        const files = Array.from(e.target.files || []);
                                        if (files.length + existingImages.length > 10) {
                                            alert("Max 10 images total");
                                            return;
                                        }
                                        setProductImages([...productImages, ...files]);
                                    }}
                                    className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-500 file:text-black hover:file:bg-white"
                                />
                                <div className="text-[10px] text-zinc-500 mt-1">
                                    {productImages.length > 0 && `${productImages.length} new files selected`}
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Color</label>
                                <div className="flex gap-4 items-end">
                                    <div className="flex-grow">
                                        <label className="text-[10px] text-zinc-600 block mb-1">Color Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-sm text-white"
                                            value={formData.color.name}
                                            onChange={e => setFormData({ ...formData, color: { ...formData.color, name: e.target.value } })}
                                            list="color-names"
                                        />
                                        <datalist id="color-names">
                                            {defaultColors.map(c => <option key={c.name} value={c.name} />)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-600 block mb-1">Picker</label>
                                        <input
                                            type="color"
                                            className="h-10 w-10 bg-transparent border-0 rounded cursor-pointer"
                                            value={formData.color.hex}
                                            onChange={e => setFormData({ ...formData, color: { ...formData.color, hex: e.target.value } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sizes & Stock */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Stock by Size</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.keys(formData.sizes).map(size => (
                                        <div key={size}>
                                            <span className="block text-[10px] text-center mb-1 text-zinc-500">{size}</span>
                                            <input
                                                type="number" min="0"
                                                className={`w-full bg-zinc-900 border px-2 py-1 rounded text-center text-xs text-white ${formData.sizes[size] > 0 ? 'border-green-500' : 'border-white/10'}`}
                                                value={formData.sizes[size]}
                                                onChange={e => setFormData({
                                                    ...formData,
                                                    sizes: { ...formData.sizes, [size]: Math.max(0, Number(e.target.value)) }
                                                })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Linked Products (Other Colors) */}
                            <div>
                                <label className="block text-xs font-bold uppercase text-zinc-500 mb-2">Other Color Options (Link Products)</label>
                                <div className="bg-zinc-900/50 p-4 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex gap-2">
                                        <select
                                            className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-xs text-white"
                                            onChange={(e) => {
                                                const sku = e.target.value;
                                                if (sku && !formData.linkedProducts.includes(sku)) {
                                                    setFormData(prev => ({ ...prev, linkedProducts: [...prev.linkedProducts, sku] }));
                                                }
                                                e.target.value = '';
                                            }}
                                        >
                                            <option value="">+ Add Linked Product (Select SKU)</option>
                                            {products.filter(p => p.sku !== formData.sku).map(p => (
                                                <option key={p.sku} value={p.sku}>
                                                    {p.sku} - {p.name} ({p.color?.name || 'No Color'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.linkedProducts.map(sku => {
                                            const p = products.find(prod => prod.sku === sku);
                                            return (
                                                <div key={sku} className="bg-zinc-800 px-3 py-1 rounded-full flex items-center gap-2 border border-white/10">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p?.color?.hex || '#333' }}></div>
                                                    <span className="text-[10px] text-white">{sku}</span>
                                                    <button
                                                        onClick={() => setFormData(prev => ({ ...prev, linkedProducts: prev.linkedProducts.filter(s => s !== sku) }))}
                                                        className="text-red-500 hover:text-white"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Profit Calculator Section */}
                                    <div className="pt-4 border-t border-white/10 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Profit Calculator</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-zinc-500">Production Cost (₹)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Enter cost"
                                                    className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-lg text-xs text-white"
                                                    value={formData.productionCost}
                                                    onChange={e => setFormData({ ...formData, productionCost: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black uppercase text-zinc-500">Net Profit (Est.)</label>
                                                <div className="w-full bg-black/40 border border-white/5 px-3 py-2 rounded-lg text-xs font-black text-green-500">
                                                    {(() => {
                                                        const price = Number(formData.offerPrice) || 0;
                                                        const cost = Number(formData.productionCost) || 0;

                                                        // Load config from localStorage or use defaults (matching AdminFinance)
                                                        const savedConfig = localStorage.getItem('finance_config');
                                                        const config = savedConfig ? JSON.parse(savedConfig) : {
                                                            razorpayFeeType: 'percentage',
                                                            razorpayFeeValue: 0.02,
                                                            productGstPercentage: 12,
                                                            packagingCosts: { small: 45 },
                                                            shippingBaseRate: 40
                                                        };

                                                        // Simplified estimation (using small package + 1kg shipping)
                                                        const pkg = config.packagingCosts?.small || 0;
                                                        const ship = config.shippingBaseRate || 0;
                                                        const gstRate = (config.productGstPercentage || 0) / 100;
                                                        const gstAmount = price - (price / (1 + gstRate));

                                                        let rzp = 0;
                                                        if (config.razorpayFeeType === 'percentage') {
                                                            rzp = price * (config.razorpayFeeValue || 0);
                                                        } else {
                                                            rzp = config.razorpayFeeValue || 0;
                                                        }
                                                        const rzpGst = rzp * 0.18; // 18% GST on fees

                                                        const profit = price - (cost + pkg + ship + gstAmount + rzp + rzpGst);
                                                        return `₹${profit.toFixed(2)}`;
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[8px] font-bold text-zinc-600 uppercase">
                                            * Calculation: Offer Price - (Prod Cost + Small Pkg + 1kg Ship + GST + Razorpay Fees)
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* this is the best seller section that are deactivate now  */}

                            {/* <div className="flex items-center space-x-2 pt-4">
                        <input 
                            type="checkbox" 
                            checked={formData.isBestSelling}
                            onChange={e => setFormData({...formData, isBestSelling: e.target.checked})}
                            className="w-4 h-4 accent-green-500"
                        />
                        <span className="text-xs font-bold uppercase text-zinc-400">Mark as Best Seller</span>
                    </div> */}

                        </div>
                    </div>

                    <div className="flex justify-end gap-4 border-t border-white/10 pt-6">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="bg-white text-black px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-lg shadow-green-500/20"
                        >
                            {isEditing ? 'Update Artifact' : 'Publish Artifact'}
                        </button>
                    </div>
                </div>
            )}

            {/* Product List */}
            <div className="flex gap-4">
                <div className="flex-grow relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Scan by Name or SKU..."
                        className="w-full bg-zinc-900 border border-white/5 px-12 py-4 rounded-xl focus:border-green-500 transition-all text-sm text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                            <th className="p-6">Product</th>
                            <th className="p-6">SKU</th>
                            <th className="p-6">Category</th>
                            <th className="p-6">Price</th>
                            <th className="p-6">Stock</th>
                            <th className="p-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredProducts.map(p => (
                            <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-16 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                                            <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                                        </div>
                                        <div>
                                            <span className="font-bold uppercase tracking-tight text-sm text-white block">{p.name}</span>
                                            <div className="flex items-center gap-1 mt-1">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color?.hex || '#333' }}></div>
                                                <span className="text-[10px] text-zinc-500">{p.color?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6 font-mono text-xs text-zinc-400">{p.sku}</td>
                                <td className="p-6">
                                    <div className="flex flex-wrap gap-1">
                                        {p.tags?.slice(0, 3).map(c => (
                                            <span key={c} className="bg-zinc-800 text-[8px] font-black px-2 py-1 rounded-sm text-zinc-400 uppercase">{c}</span>
                                        ))}
                                        {p.category?.map(c => (
                                            <span key={c} className="bg-zinc-800 text-[8px] font-black px-2 py-1 rounded-sm text-blue-400 uppercase">{c}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-green-500">₹{p.offerPrice}</span>
                                        <span className="text-[10px] text-zinc-600 line-through">₹{p.actualPrice}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${(Object.values(p.sizes || {}) as number[]).reduce((a, b) => a + b, 0) > 10 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-xs font-bold text-zinc-400">{(Object.values(p.sizes || {}) as number[]).reduce((a, b) => a + b, 0)} Units</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center space-x-3 text-zinc-500">
                                        <button onClick={() => handleEdit(p)} className="hover:text-white transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteId(p.id)} className="hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                        <a href={`#/product/${p.id}`} target="_blank" rel="noreferrer" className="hover:text-green-500 transition-colors" title="View"><ExternalLink className="w-4 h-4" /></a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminProducts;
