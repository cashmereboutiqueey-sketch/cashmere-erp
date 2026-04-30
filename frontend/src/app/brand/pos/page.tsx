"use client";


import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, Search, ScanBarcode, MapPin, UserPlus, X, Box, Factory, ImageIcon, Printer } from 'lucide-react'; // Added Printer
import Dialog from '@/components/Dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import Receipt from '@/components/Receipt';
import { useAuth } from '@/contexts/AuthContext';

interface InventoryItem {
    location: number;
    quantity: number;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    barcode?: string; // Added barcode
    description: string;
    price: number;
    inventory: InventoryItem[];
    image?: string;
    image_url?: string;
    category?: number;
    category_name?: string;
}

interface Category {
    id: number;
    name: string;
}

interface CartItem extends Product {
    quantity: number;
    discount?: number;
}

interface Location {
    id: number;
    name: string;
    type: string;
}


export default function POSPage() {
    const { t, dir } = useLanguage();
    const { token } = useAuth();

    // Core Data State
    const [products, setProducts] = useState<Product[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedLocation, setSelectedLocation] = useState<string>('');

    // Customer State
    const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerSearch, setShowCustomerSearch] = useState(false);
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '' });

    // Product Search State
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [showInStockOnly, setShowInStockOnly] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Payment State
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amountPaid, setAmountPaid] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [orderDiscount, setOrderDiscount] = useState(0);
    const [isMadeToOrder, setIsMadeToOrder] = useState(false);

    // Production Request State
    const [isRequestProductionOpen, setIsRequestProductionOpen] = useState(false);
    const [productionRequestData, setProductionRequestData] = useState<{ product: Product | null, quantity: string }>({ product: null, quantity: '10' });

    // Returns State
    const [isReturnsOpen, setIsReturnsOpen] = useState(false);

    // Model Selection State
    const [selectedModel, setSelectedModel] = useState<{ name: string, variants: Product[] } | null>(null);

    // Receipt State
    const [lastOrder, setLastOrder] = useState<any | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Mobile cart toggle
    const [showMobileCart, setShowMobileCart] = useState(false);

    const fetchProductData = React.useCallback(() => {
        if (!token) return;

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/products/?page_size=500`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(async res => {
                if (!res.ok) {
                    console.error('Products API error:', res.status, await res.text());
                    setLoading(false);
                    return;
                }
                const data = await res.json();
                const list = Array.isArray(data) ? data : (data.results || []);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setProducts(list.map((p: any) => ({
                    ...p,
                    price: parseFloat(p.retail_price) || 0,
                    inventory: p.inventory || []
                })));
                setLoading(false);
            })
            .catch(err => {
                console.error('Products fetch failed:', err);
                setLoading(false);
            });
    }, [token]);

    useEffect(() => {
        if (!token) return;

        fetchProductData();

        // Fetch Customers
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/customers/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setCustomers(Array.isArray(data) ? data : (data.results || []));
            })
            .catch(err => console.error(err));

        // Fetch Locations
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/locations/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const locs = Array.isArray(data) ? data : (data.results || []);
                setLocations(locs);
                // Restore last-used location from localStorage, fall back to first showroom/store
                const saved = typeof window !== 'undefined' && localStorage.getItem('pos_location');
                const savedLoc = saved && locs.find((l: Location) => l.id.toString() === saved);
                if (savedLoc) {
                    setSelectedLocation(savedLoc.id.toString());
                } else {
                    const preferred =
                        locs.find((l: Location) => l.type === 'SHOWROOM') ||
                        locs.find((l: Location) => l.type === 'STORE') ||
                        locs.find((l: Location) => l.type === 'WAREHOUSE') ||
                        locs[0];
                    if (preferred) setSelectedLocation(preferred.id.toString());
                }
            })
            .catch(err => console.error(err));

        // Fetch Categories
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/categories/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                setCategories(Array.isArray(data) ? data : (data.results || []));
            })
            .catch(err => console.error(err));
    }, [fetchProductData, token]);

    // Barcode Scanner Logic
    useEffect(() => {
        let buffer = "";
        let lastKeyTime = Date.now();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT' && document.activeElement !== searchInputRef.current) return;

            const char = e.key;
            const currentTime = Date.now();

            if (currentTime - lastKeyTime > 50) {
                buffer = "";
            }
            lastKeyTime = currentTime;

            if (char === "Enter") {
                if (buffer.length > 2) { // Allow shorter barcodes
                    const product = products.find(p =>
                        p.sku.toUpperCase() === buffer.toUpperCase() ||
                        (p.barcode && p.barcode === buffer)
                    );
                    if (product) {
                        addToCart(product);
                        if (document.activeElement === searchInputRef.current) {
                            setProductSearch("");
                        }
                    }
                }
                buffer = "";
            } else if (char.length === 1) {
                buffer += char;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [products]);

    const getStockForLocation = (product: Product) => {
        if (!selectedLocation || !product.inventory) return 0;
        const item = product.inventory.find(i => i.location.toString() === selectedLocation.toString());
        return item ? item.quantity : 0;
    };

    // Total stock across ALL locations — used for "show in-stock only" filter
    const getTotalStock = (product: Product) => {
        if (!product.inventory) return 0;
        return product.inventory.reduce((sum: number, i: InventoryItem) => sum + (i.quantity || 0), 0);
    };

    const addToCart = (product: Product) => {
        // Optional: Check stock before adding? The user might want to oversell/backorder.
        // For now, allow it but maybe warn visually. 
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1, discount: 0 }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const updateItemDiscount = (productId: number, discount: number) => {
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, discount: Math.min(100, Math.max(0, discount)) } : item
        ));
    };

    const handleCreateCustomer = async () => {
        if (!newCustomerData.name || !newCustomerData.phone) return alert(t('pos.alerts.nameRequired'));

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/customers/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newCustomerData)
            });

            if (res.ok) {
                const createdCustomer = await res.json();
                setCustomers(prev => [...prev, createdCustomer]);
                setSelectedCustomer(createdCustomer);
                setIsAddCustomerOpen(false);
                setNewCustomerData({ name: '', phone: '', email: '' });
            } else {
                alert(t('pos.alerts.createFailed'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRequestProduction = async () => {
        if (!productionRequestData.product) return;

        try {
            // Create a Production Job
            const jobName = `REQ-${Date.now()}`;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: jobName,
                    product: productionRequestData.product.id,
                    quantity: parseInt(productionRequestData.quantity),
                    status: 'PENDING',
                    // source_order: null // Independent request
                    notes: `Requested from POS. Location: ${locations.find(l => l.id.toString() === selectedLocation)?.name}`
                })
            });

            if (res.ok) {
                alert(`${t('pos.alerts.reqSent')}${jobName}`);
                setIsRequestProductionOpen(false);
            } else {
                const err = await res.json();
                alert(`${t('pos.alerts.reqFailed')}${JSON.stringify(err)}`);
            }
        } catch (e) {
            console.error(e);
            alert(t('pos.alerts.reqError'));
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty!");
        if (!selectedLocation) return alert("Please select a location");
        if (!paymentMethod) return alert("Please select a payment method");

        const paid = parseFloat(amountPaid) || 0;
        const remaining = cartTotal - paid;

        if (remaining > 0 && !selectedCustomer) {
            return alert("Customer required for partial payment/debt");
        }

        try {
            const orderPayload = {
                customer: selectedCustomer?.id || null,
                location: parseInt(selectedLocation),
                items: cart.map(item => ({
                    product: item.id,
                    quantity: item.quantity,
                    unit_price: item.price * (1 - (item.discount || 0) / 100)
                })),
                payment_method: paymentMethod,
                amount_paid: paid,
                discount: orderDiscount,
                status: paid >= cartTotal ? 'PAID' : 'PENDING',
                notes: orderNotes || ""
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/orders/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(orderPayload)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(JSON.stringify(error));
            }

            const createdOrder = await res.json();

            // Create Production Jobs if Made-to-Order
            if (isMadeToOrder) {
                const jobPromises = cart.map(item =>
                    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/factory/jobs/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            name: `MTO-${createdOrder.order_number}-${item.sku}`,
                            product: item.id,
                            quantity: item.quantity,
                            source_order: createdOrder.id,
                            status: 'PENDING',
                            notes: `Made-to-Order for ${createdOrder.order_number}${selectedCustomer ? ` | Customer: ${selectedCustomer.name}` : ''}`
                        })
                    })
                );
                const jobResults = await Promise.allSettled(jobPromises);
                const failedJobs = jobResults.filter((r: PromiseSettledResult<Response>) => r.status === 'rejected').length;
                if (failedJobs > 0) console.warn(`${failedJobs} production job(s) failed to create for order ${createdOrder.order_number}`);
            }

            // Prepare order data for receipt
            const receiptOrder = {
                order_number: createdOrder.order_number,
                customer_name: selectedCustomer?.name,
                customer_phone: selectedCustomer?.phone,
                total_amount: cartTotal,
                payment_method: paymentMethod,
                created_at: createdOrder.created_at || new Date().toISOString()
            };

            const receiptItems = cart.map(item => ({
                product_name: item.name,
                product_sku: item.sku,
                product_barcode: item.barcode,
                quantity: item.quantity,
                unit_price: item.price * (1 - (item.discount || 0) / 100)
            }));

            setLastOrder({ ...receiptOrder, items: receiptItems });

            // Success notification
            alert(`${t('pos.alerts.orderSuccess')} ${createdOrder.order_number}!${isMadeToOrder ? '\nProduction jobs created.' : ''}`);

            // Print receipt at 80mm (override the 58mm label default)
            setTimeout(() => {
                const receiptStyle = document.createElement('style');
                receiptStyle.id = 'receipt-page-size';
                receiptStyle.textContent = '@page { size: 80mm auto; margin: 0; }';
                document.head.appendChild(receiptStyle);
                window.addEventListener('afterprint', () => {
                    document.getElementById('receipt-page-size')?.remove();
                    setLastOrder(null);
                }, { once: true });
                window.print();
            }, 500);

            // Reset
            setCart([]);
            setIsPaymentOpen(false);
            setOrderDiscount(0);
            setAmountPaid('');
            setPaymentMethod('');
            setOrderNotes('');
            setIsMadeToOrder(false);
            setSelectedCustomer(null);
            fetchProductData(); // Refresh inventory

        } catch (error) {
            console.error(error);
            alert(`${t('pos.alerts.checkoutFailed')}: ${error}`);
        }
    };

    // discount is stored as a percentage (0-100); apply it as a fraction of price
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * (1 - (item.discount || 0) / 100) * item.quantity), 0) - orderDiscount;
    const grossTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone.includes(customerSearch)
    );

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
            (p.barcode && p.barcode.includes(productSearch)); // Added barcode search

        if (showInStockOnly && getTotalStock(p) <= 0) {
            return false;
        }

        if (selectedCategory !== 'ALL') {
            return matchesSearch && p.category?.toString() === selectedCategory;
        }

        return matchesSearch;
    });

    const handleSearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && productSearch.trim()) {
            // Priority 1: Exact SKU or Barcode Match
            const exactMatch = products.find(p =>
                p.sku.toLowerCase() === productSearch.toLowerCase() ||
                (p.barcode && p.barcode === productSearch)
            );

            if (exactMatch) {
                addToCart(exactMatch);
                setProductSearch(''); // Clear for next scan
                return;
            }

            // Priority 2: Exact Name Match (only if unique)
            const exactNameMatches = products.filter(p => p.name.toLowerCase() === productSearch.toLowerCase());
            if (exactNameMatches.length === 1) {
                addToCart(exactNameMatches[0]);
                setProductSearch('');
                return;
            }

            // If no exact match, just leave the filter applied (standard search behavior)
        }
    };

    return (
        <div className="flex h-screen bg-stone-50 overflow-hidden">

            {/* Mobile Cart Button */}
            <button
                onClick={() => setShowMobileCart(true)}
                className="lg:hidden fixed bottom-6 right-6 z-40 bg-cashmere-maroon text-white rounded-full px-5 py-4 shadow-xl flex items-center gap-2 font-bold"
            >
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                    <span className="bg-white text-cashmere-maroon rounded-full w-5 h-5 flex items-center justify-center text-xs font-black">
                        {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                )}
                <span className="text-sm">{Math.max(0, cartTotal).toLocaleString()} LE</span>
            </button>

            {/* Left: Product Grid */}
            <div className="flex-1 p-4 lg:p-6 overflow-y-auto pb-24 lg:pb-6">
                <header className="mb-6 space-y-4">
                    {/* ... Header contents (Title, Store Selector) - Same as before */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-cashmere-black">{t('pos.title')}</h1>
                            <p className="text-sm text-stone-500">{t('pos.subtitle')}</p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsReturnsOpen(true)}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-red-50 text-stone-600 hover:text-red-600 font-bold text-sm rounded-lg border border-stone-200 transition-colors flex items-center gap-2"
                            >
                                <div className="rotate-180"><ShoppingBag size={14} /></div>
                                {t('common.returns') || 'Returns'}
                            </button>

                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200">
                                <MapPin size={16} className="text-cashmere-gold" />
                                <select
                                    className="border-none text-sm font-bold text-stone-700 focus:ring-0 cursor-pointer bg-transparent"
                                    value={selectedLocation}
                                    onChange={(e) => {
                                        setSelectedLocation(e.target.value);
                                        if (typeof window !== 'undefined') localStorage.setItem('pos_location', e.target.value);
                                    }}
                                >
                                    {locations.map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name} ({loc.type})</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        {/* Product Search */}
                        <div className="flex-1 relative">
                            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-stone-200 shadow-sm focus-within:ring-2 ring-cashmere-gold/20">
                                <Search size={18} className="text-stone-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t('pos.search')}
                                    className="flex-1 outline-none text-sm bg-transparent"
                                    value={productSearch}
                                    onChange={e => setProductSearch(e.target.value)}
                                    onKeyDown={handleSearchEnter}
                                    autoFocus
                                    dir={dir}
                                />
                                <ScanBarcode size={18} className="text-stone-300" />
                            </div>
                        </div>
                        <button
                            onClick={() => setShowInStockOnly(!showInStockOnly)}
                            className={`px-4 rounded-lg border flex items-center gap-2 font-bold text-xs transition-colors ${showInStockOnly
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                                }`}
                            title="Toggle In-Stock Only"
                        >
                            <Box size={16} />
                            {showInStockOnly ? 'Stock Only' : 'All Items'}
                        </button>

                        {/* Customer Search (with Quick Add) */}
                        <div className="flex gap-2 w-96 relative">
                            <div className="flex-1 flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-stone-200 shadow-sm focus-within:ring-2 ring-cashmere-gold/20">
                                <span className="text-stone-400">👤</span>
                                {selectedCustomer ? (
                                    <div className="flex-1 flex justify-between items-center">
                                        <span className="font-bold text-sm text-stone-800">{selectedCustomer.name}</span>
                                        <button onClick={() => setSelectedCustomer(null)} className="text-xs text-red-500 hover:underline">{t('common.delete') || 'Remove'}</button>
                                    </div>
                                ) : (
                                    <input
                                        type="text"
                                        placeholder={t('pos.findCustomer')}
                                        className="flex-1 outline-none text-sm bg-transparent"
                                        value={customerSearch}
                                        onChange={e => {
                                            setCustomerSearch(e.target.value);
                                            setShowCustomerSearch(true);
                                        }}
                                        onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                                    />
                                )}
                            </div>

                            <button
                                onClick={() => setIsAddCustomerOpen(true)}
                                className="bg-cashmere-black text-white p-3 rounded-lg hover:bg-stone-800 transition-colors shadow-sm"
                                title={t('pos.quickAdd')}
                            >
                                <UserPlus size={20} />
                            </button>

                            {/* Dropdown Results (Same) */}
                            {showCustomerSearch && customerSearch && !selectedCustomer && (
                                <div className="absolute top-14 left-0 w-[calc(100%-3rem)] bg-white rounded-lg shadow-xl border border-stone-100 max-h-60 overflow-y-auto z-20">
                                    {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-50 last:border-0"
                                            onMouseDown={() => {
                                                setSelectedCustomer(c);
                                                setCustomerSearch('');
                                                setShowCustomerSearch(false);
                                            }}
                                        >
                                            <div className="font-bold text-sm">{c.name}</div>
                                            <div className="text-xs text-stone-500">{c.phone}</div>
                                        </button>
                                    )) : (
                                        <div className="p-4 text-center text-sm text-stone-400">{t('common.noRecords')}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Categories Toolbar */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === 'ALL'
                            ? 'bg-cashmere-black text-white shadow-md'
                            : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400'
                            }`}
                    >
                        All Items
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id.toString())}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat.id.toString()
                                ? 'bg-cashmere-black text-white shadow-md'
                                : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-center py-12 text-stone-400">{t('common.loading')}</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.entries(
                            filteredProducts.reduce((acc, product) => {
                                // Group by Name (Model)
                                // Clean name to remove variant info if present (e.g. "Shirt (Red)" -> "Shirt")
                                // Assumption: 'name' might contain variant info, but ideally we use a base name.
                                // For now, we'll assume exact name match = same model.
                                // Or better, we can strip (...) if standard naming used.
                                // Let's try exact name usage first as requested.
                                const name = product.name.split('(')[0].trim();
                                if (!acc[name]) acc[name] = [];
                                acc[name].push(product);
                                return acc;
                            }, {} as Record<string, Product[]>)
                        ).map(([modelName, variants]) => {
                            // Calculate aggregate stock
                            const totalStock = variants.reduce((sum, p) => sum + getStockForLocation(p), 0);
                            const priceRange = variants.length > 1
                                ? `${Math.min(...variants.map(v => v.price))} - ${Math.max(...variants.map(v => v.price))}`
                                : variants[0].price.toLocaleString();

                            const isOutOfStock = totalStock <= 0;
                            const mainImage = ""; // Placeholder for future

                            return (
                                <div
                                    key={modelName}
                                    className={`bg-white p-4 rounded-xl shadow-sm border ${isOutOfStock ? 'border-red-100 bg-red-50/10' : 'border-stone-200'} relative group hover:shadow-md transition-all`}
                                >
                                    <button
                                        onClick={() => {
                                            // Open Variant Modal
                                            setSelectedModel({ name: modelName, variants });
                                        }}
                                        className="w-full text-left"
                                    >
                                        <div className="aspect-square bg-stone-100 rounded-lg mb-3 flex items-center justify-center text-stone-300 relative overflow-hidden">
                                            {variants[0].image || variants[0].image_url ? (
                                                <img
                                                    src={variants[0].image_url || variants[0].image}
                                                    alt={modelName}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <ShoppingBag size={32} />
                                            )}

                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                                                    <span className="text-red-500 font-bold text-xs uppercase border border-red-200 bg-red-50 px-2 py-1 rounded">{t('pos.outOfStock')}</span>
                                                </div>
                                            )}
                                            {/* Variant Badge */}
                                            <span className="absolute top-2 right-2 bg-stone-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                {variants.length} Vars
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-stone-800 truncate">{modelName}</h3>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-stone-500 font-mono mb-1">{variants.length} Variants</p>
                                                <p className={`text-xs font-bold flex items-center gap-1 ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
                                                    <Box size={10} />
                                                    {totalStock > 0 ? `${totalStock} ${t('pos.inStock')}` : `0 ${t('pos.inStock')}`}
                                                </p>
                                            </div>
                                            <p className="text-cashmere-maroon font-serif font-bold">
                                                {priceRange}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Variant Selection Modal */}
            <Dialog
                isOpen={!!selectedModel}
                onClose={() => setSelectedModel(null)}
                title={selectedModel?.name || 'Select Variant'}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {[...(selectedModel?.variants || [])].sort((a, b) => getTotalStock(b) - getTotalStock(a)).map(variant => {
                        const stockHere = getStockForLocation(variant);
                        const stockTotal = getTotalStock(variant);
                        const isOOS = stockTotal <= 0;
                        const hasStockElsewhere = stockTotal > 0 && stockHere <= 0;

                        const variantLabel = variant.sku;

                        return (
                            <div key={variant.id} className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${isOOS ? 'border-stone-100 bg-stone-50 opacity-60' : hasStockElsewhere ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-stone-200 rounded-md overflow-hidden flex-shrink-0">
                                        {variant.image || variant.image_url ? (
                                            <img src={variant.image_url || variant.image} alt={variant.sku} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-400"><ShoppingBag size={16} /></div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-stone-800">{variantLabel}</h4>
                                        <div className={`text-xs font-bold mt-1 ${isOOS ? 'text-red-500' : hasStockElsewhere ? 'text-amber-600' : 'text-green-600'}`}>
                                            {isOOS ? 'Out of Stock' : hasStockElsewhere ? `${stockTotal} pcs (other warehouse)` : `${stockHere} pcs here`}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-3">
                                        <p className="font-bold text-cashmere-maroon">{variant.price.toLocaleString()}</p>
                                    </div>

                                    {isOOS ? (
                                        <button
                                            onClick={() => { setProductionRequestData({ product: variant, quantity: '10' }); setIsRequestProductionOpen(true); }}
                                            className="bg-stone-800 text-white p-2 rounded-lg hover:bg-stone-700 shadow-sm flex items-center gap-1 text-xs font-bold"
                                            title="Request Production"
                                        >
                                            <Factory size={14} /> Request
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => addToCart(variant)}
                                            className="bg-cashmere-gold text-white p-2 rounded-lg hover:bg-yellow-600 shadow-sm transition-colors"
                                            title="Add to Cart"
                                        >
                                            <Plus size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}

                    {selectedModel?.variants.length === 0 && (
                        <p className="text-center text-stone-400 py-4">No variants found.</p>
                    )}
                </div>
                <div className="pt-4 border-t border-stone-100 flex justify-end">
                    <button
                        onClick={() => setSelectedModel(null)}
                        className="text-stone-500 font-bold text-sm hover:underline"
                    >
                        Close
                    </button>
                </div>
            </Dialog>

            {/* Right: Cart Panel — hidden on mobile, shown as overlay when toggled */}
            {showMobileCart && (
                <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileCart(false)} />
            )}
            <div className={`
                lg:w-96 lg:relative lg:flex lg:flex-col
                fixed inset-y-0 right-0 z-50 w-full max-w-sm
                bg-white border-l border-stone-200 flex flex-col shadow-xl
                transform transition-transform duration-200
                ${showMobileCart ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                {/* ... Cart contents ... */}
                <div className="p-6 border-b border-stone-100 bg-stone-50/50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-serif font-bold text-cashmere-black flex items-center gap-2">
                            <ShoppingBag size={20} /> {t('pos.cartTitle')}
                        </h2>
                        <button onClick={() => setShowMobileCart(false)} className="lg:hidden p-1 text-stone-400 hover:text-stone-700">
                            <X size={20} />
                        </button>
                    </div>
                    {selectedLocation && locations.find(l => l.id.toString() === selectedLocation) && (
                        <div className="mt-2 text-xs text-stone-500 flex items-center gap-1">
                            <MapPin size={12} />
                            {t('pos.fulfillingFrom')}: <span className="font-bold">{locations.find(l => l.id.toString() === selectedLocation)?.name}</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* ... Cart Items Loop ... */}
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-stone-400 italic">
                            {t('pos.emptyCart')}
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 p-3 bg-stone-50 rounded-lg border border-stone-100">
                                <div className="w-12 h-12 bg-white rounded border border-stone-200 flex items-center justify-center text-stone-300">
                                    <Tags size={16} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm text-stone-800 line-clamp-1">{item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-stone-500">{item.price} LE</p>
                                        {/* Item Discount Input */}
                                        <div className="flex items-center gap-1 bg-white rounded border border-stone-200 px-1">
                                            <span className="text-[9px] text-stone-400 font-bold">%</span>
                                            <input
                                                type="number"
                                                className="w-12 text-xs border-none p-0 focus:ring-0 text-center font-bold text-red-500"
                                                placeholder="Disc."
                                                value={item.discount || ''}
                                                onChange={e => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-white rounded-md border border-stone-200 px-1">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-red-600"><Minus size={12} /></button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-green-600"><Plus size={12} /></button>
                                    </div>
                                    <button onClick={() => removeFromCart(item.id)} className="text-stone-400 hover:text-red-500">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* ... Cart Footer ... */}
                <div className="p-6 border-t border-stone-100 bg-stone-50">
                    <div className="flex justify-between items-center mb-1 text-xs text-stone-400">
                        <span>{t('pos.subtotal')} (Gross)</span>
                        <span>{grossTotal.toLocaleString()} LE</span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-stone-500">
                        <span>Global Discount</span>
                        <div className="flex items-center gap-1 bg-white rounded border border-stone-200 px-2 py-1 w-24">
                            <span className="text-xs font-bold text-stone-400">-</span>
                            <input
                                type="number"
                                className="w-full text-right text-sm font-bold bg-transparent outline-none text-red-600"
                                placeholder="0"
                                value={orderDiscount || ''}
                                onChange={e => setOrderDiscount(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 text-xl font-bold text-cashmere-maroon pt-4 border-t border-stone-100">
                        <span>{t('pos.payment.total')}</span>
                        <span>{Math.max(0, cartTotal).toLocaleString()} LE</span>
                    </div>
                    <button
                        className="w-full btn-primary py-4 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                        disabled={cart.length === 0}
                        onClick={() => {
                            setAmountPaid(Math.max(0, cartTotal).toString());
                            setIsMadeToOrder(false);
                            setIsPaymentOpen(true);
                        }}
                    >
                        {t('pos.checkout')}
                    </button>
                </div>
            </div>

            {/* Quick Add Customer Dialog (Same) */}
            <Dialog isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title={t('pos.addCustomer.title')}>
                {/* ... New Customer contents ... */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('pos.addCustomer.name')} *</label>
                        <input type="text" className="w-full border-stone-200 rounded-lg text-sm" placeholder="e.g. Ahmed Ali"
                            value={newCustomerData.name} onChange={e => setNewCustomerData({ ...newCustomerData, name: e.target.value })} autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('pos.addCustomer.phone')} *</label>
                        <input type="tel" className="w-full border-stone-200 rounded-lg text-sm font-mono" placeholder="01xxxxxxxxx"
                            value={newCustomerData.phone} onChange={e => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsAddCustomerOpen(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 font-medium">{t('common.cancel')}</button>
                        <button onClick={handleCreateCustomer} className="btn-primary text-sm px-6">{t('pos.addCustomer.save')}</button>
                    </div>
                </div>
            </Dialog>

            {/* Request Production Dialog */}
            <Dialog isOpen={isRequestProductionOpen} onClose={() => setIsRequestProductionOpen(false)} title={`${t('pos.reqStock.title')}: ${productionRequestData.product?.sku}`}>
                <div className="space-y-4">
                    <p className="text-sm text-stone-500">
                        Initiate a production job for <strong>{productionRequestData.product?.name}</strong>.
                        This will be sent to the Factory Manager for approval.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">{t('pos.reqStock.qty')}</label>
                        <input
                            type="number"
                            className="w-full border-stone-200 rounded-lg text-sm font-mono"
                            value={productionRequestData.quantity}
                            onChange={e => setProductionRequestData({ ...productionRequestData, quantity: e.target.value })}
                        />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button onClick={() => setIsRequestProductionOpen(false)} className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 font-medium">{t('common.cancel')}</button>
                        <button onClick={handleRequestProduction} className="btn-primary text-sm px-6">{t('pos.reqStock.submit')}</button>
                    </div>
                </div>
            </Dialog>

            {/* Payment Modal (Same) */}
            {isPaymentOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px]">
                        <h2 className="text-2xl font-serif font-bold text-cashmere-maroon mb-6">{t('pos.payment.title')}</h2>

                        <div className="space-y-6">
                            <div className="bg-stone-50 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-stone-600 font-medium">{t('pos.payment.total')}</span>
                                <span className="text-2xl font-bold text-cashmere-black">{cartTotal.toLocaleString()} LE</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-stone-500">{t('orders.customer')}</span>
                                <span className="font-bold">{selectedCustomer ? selectedCustomer.name : 'Guest Customer'}</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-2">{t('pos.payment.method')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['CASH', 'VISA', 'INSTAPAY', 'DEPOSIT'].map(method => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`py-3 rounded-lg text-sm font-bold transition-colors ${paymentMethod === method
                                                ? 'bg-cashmere-gold text-white shadow-md'
                                                : 'bg-white border border-stone-200 text-stone-600 hover:border-cashmere-gold'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">{t('pos.payment.paid')}</label>
                                <input
                                    type="number"
                                    className="w-full text-lg font-mono font-bold border-stone-300 rounded-lg focus:ring-cashmere-gold focus:border-cashmere-gold"
                                    value={amountPaid}
                                    onChange={e => setAmountPaid(e.target.value)}
                                />
                                {parseFloat(amountPaid) < cartTotal && (
                                    <div className="mt-2 text-red-600 text-sm font-bold flex items-center gap-1">
                                        ⚠️ {t('pos.payment.remaining')}: {(cartTotal - (parseFloat(amountPaid) || 0)).toLocaleString()} LE
                                        {selectedCustomer ? ` (${t('pos.payment.debtWarning')})` : ' (Requires Customer for Debt)'}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white p-3 rounded-lg border border-stone-200">
                                <label className="block text-xs font-bold text-stone-500 mb-1">{t('common.notes')}</label>
                                <textarea
                                    className="w-full text-sm border-none p-0 focus:ring-0 resize-none bg-transparent"
                                    placeholder={t('pos.payment.notesPlaceholder') || "Add order notes..."}
                                    rows={2}
                                    value={orderNotes}
                                    onChange={e => setOrderNotes(e.target.value)}
                                />
                            </div>

                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                                        <Factory size={14} /> {t('pos.payment.mto')}
                                    </h4>
                                    <p className="text-xs text-amber-700">Auto-create production jobs for these items.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isMadeToOrder}
                                        onChange={e => setIsMadeToOrder(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                        </div>

                        <div className="pt-6 flex justify-between items-center gap-4">
                            <button
                                onClick={() => setIsPaymentOpen(false)}
                                className="flex-1 py-3 bg-stone-100 text-stone-600 font-bold rounded-lg hover:bg-stone-200 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleCheckout}
                                className="flex-[2] py-3 bg-cashmere-maroon text-white font-bold rounded-lg hover:bg-red-900 transition-colors shadow-lg"
                            >
                                {isMadeToOrder ? t('pos.submitProduction') : t('pos.checkout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Returns Modal */}
            <ReturnsModal isOpen={isReturnsOpen} onClose={() => setIsReturnsOpen(false)} t={t} />

            {/* Receipt Component (Hidden unless printing) */}
            {lastOrder && (
                <Receipt
                    ref={receiptRef}
                    order={lastOrder}
                    items={lastOrder.items || []}
                />
            )}
        </div>
    );
}

// Sub-component for Returns
function ReturnsModal({ isOpen, onClose, t }: { isOpen: boolean, onClose: () => void, t: any }) {
    const { token } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundOrder, setFoundOrder] = useState<any>(null);
    const [returnItems, setReturnItems] = useState<{ [key: number]: number }>({}); // itemId -> qty
    const [restock, setRestock] = useState(true);

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/orders/?search=${searchQuery}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();

            const list = Array.isArray(data) ? data : (data.results || []);
            if (list.length > 0) {
                setFoundOrder(list[0]);
                setReturnItems({});
            } else {
                alert("Order not found");
                setFoundOrder(null);
            }
        } catch (e) {
            console.error(e);
            alert("Error searching order");
        }
    };

    const handleSubmitReturn = async () => {
        if (!foundOrder) return;

        const itemsPayload = Object.entries(returnItems)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({ id: parseInt(id), quantity: qty }));

        if (itemsPayload.length === 0) return alert("Select items to return");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/brand/orders/${foundOrder.id}/return_items/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ items: itemsPayload, restock })
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Return Processed!\nRefund Amount: ${result.refund_amount} EGP`);
                onClose();
                setFoundOrder(null);
                setReturnItems({});
                setSearchQuery('');
            } else {
                const err = await res.json();
                alert(`Failed: ${JSON.stringify(err)}`);
            }
        } catch (e) {
            console.error(e);
            alert("Network Error");
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Returns & Exchanges">
            <div className="space-y-4 min-h-[400px]">
                {/* Search Bar */}
                <div className="flex gap-2">
                    <input
                        className="flex-1 border-stone-200 rounded-lg"
                        placeholder="Search by Order #, Phone, or Name"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch} className="btn-primary px-4"><Search size={18} /></button>
                </div>

                {foundOrder && (
                    <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-stone-800">Order #{foundOrder.order_number}</h3>
                                <p className="text-xs text-stone-500">{new Date(foundOrder.created_at).toLocaleDateString()} • {foundOrder.customer_name || 'Guest'}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${foundOrder.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-stone-200'}`}>
                                {foundOrder.status}
                            </span>
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {foundOrder.items.map((item: any) => {
                                const remaining = item.quantity - (item.returned_quantity || 0);
                                if (remaining <= 0) return null; // Fully returned

                                return (
                                    <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-stone-200">
                                        <div className="text-sm">
                                            <div className="font-bold">{item.product_sku || item.product.sku}</div>
                                            <div className="text-stone-500 text-xs">Prod ID: {item.product}</div>
                                            <div className="text-green-600 font-bold text-xs">{item.unit_price} EGP</div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-stone-400">Max: {remaining}</span>
                                            <select
                                                className="border-stone-200 rounded text-sm py-1"
                                                value={returnItems[item.id] || 0}
                                                onChange={e => setReturnItems({ ...returnItems, [item.id]: parseInt(e.target.value) })}
                                            >
                                                <option value={0}>0</option>
                                                {Array.from({ length: remaining }, (_, i) => i + 1).map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-4 pt-4 border-t border-stone-200">
                            <label className="flex items-center gap-2 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={restock}
                                    onChange={e => setRestock(e.target.checked)}
                                    className="rounded border-stone-300 text-cashmere-gold focus:ring-cashmere-gold"
                                />
                                <span className="text-sm font-medium text-stone-700">Restock Returned Items (Good Condition)</span>
                            </label>

                            <button onClick={handleSubmitReturn} className="w-full btn-primary bg-red-600 hover:bg-red-700">
                                Process Refund
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
}

// Helper Icon
function Tags({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" /><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.56 3.56l5.72-5.72" /><circle cx="6.5" cy="9.5" r=".5" fill="currentColor" /></svg>
    )
}

