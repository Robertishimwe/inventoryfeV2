import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Printer,
  Edit2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { getUser, getSettings } from '../services/db';
import { getProducts, getCategories, completeSale, Product, Category, SaleItem, SystemSettings } from '../services/api';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&q=80&w=150&h=150';
const ITEMS_PER_PAGE = 12;

interface CartItem extends Product {
  quantity: number;
  originalPrice: string;
}

interface SuccessModalProps {
  onClose: () => void;
  onPrint: () => void;
  onEmail: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ onClose, onPrint, onEmail }) => (
  <div className="success-popup">
    <div className="success-popup-content">
      <CheckCircle2 className="success-icon" />
      <h3 className="text-xl font-bold text-white mb-2">Sale Completed Successfully!</h3>
      <p className="text-gray-400 mb-6">The transaction has been processed and recorded.</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={onPrint}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Receipt
        </button>
        <button
          onClick={onEmail}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
        >
          <Mail className="w-4 h-4" />
          Email Receipt
        </button>
      </div>
      <button
        onClick={onClose}
        className="w-full bg-[#1E2438] hover:bg-[#252D44] text-gray-400 hover:text-white font-medium py-2 rounded-lg transition-colors"
      >
        Done
      </button>
    </div>
  </div>
);

function POS() {
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '' });
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CartItem | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingSale, setCompletingSale] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [cartStep, setCartStep] = useState<'items' | 'payment'>('items');

  const loadProducts = async () => {
    try {
      const productsData = await getProducts();
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to reload products:', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [user, settings] = await Promise.all([
          getUser(),
          getSettings()
        ]);

        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);
        setSystemSettings(settings);

        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (err) {
        setError('Failed to load products and categories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (!categoriesRef.current) return;
    const scrollAmount = 200;
    categoriesRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
  };

  const filteredProducts = products.filter(
    (product) =>
      (!selectedCategory || product.Category === selectedCategory) &&
      (!searchQuery ||
        product.ProductName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const addToCart = (product: Product) => {
    const currentStock = parseInt(product.Quantity);
    if (currentStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + 1;
        if (newQuantity > currentStock) return prev;
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, originalPrice: product.selling_price }];
    });
  };

  const updateQuantity = (id: number, change: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentStock = parseInt(item.Quantity);
        const newQuantity = Math.max(0, item.quantity + change);
        if (newQuantity > currentStock) return item;
        return { ...item, quantity: newQuantity };
      }).filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + parseFloat(item.selling_price) * item.quantity, 0);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-RW', {
      style: 'currency',
      currency: systemSettings?.currency || 'RWF',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatPriceCompact = (price: string | number) => {
    const currency = systemSettings?.currency || 'RWF';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${currency} ${numPrice.toLocaleString()}`;
  };

  const handlePriceUpdate = () => {
    if (selectedItem && newPrice) {
      setCart((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, selling_price: newPrice }
            : item
        )
      );
      setShowPriceModal(false);
      setSelectedItem(null);
      setNewPrice('');
    }
  };

  const openPriceModal = (item: CartItem) => {
    setSelectedItem(item);
    setNewPrice(item.selling_price);
    setShowPriceModal(true);
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0 || completingSale) return;

    try {
      setCompletingSale(true);
      setError(null);
      
      const saleItems: SaleItem[] = cart.map(item => ({
        productId: item.id,
        amount: item.quantity,
        final_price: item.selling_price
      }));

      await completeSale(saleItems);
      await loadProducts(); // Reload products to get updated stock levels
      setShowSuccessModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete sale. Please try again.');
    } finally {
      setCompletingSale(false);
    }
  };

  const handleSaleSuccess = () => {
    setShowSuccessModal(false);
    setCart([]);
    setCustomerInfo({ name: '', email: '' });
    setCartStep('items');
  };

  const printReceipt = () => {
    const receiptContent = receiptRef.current;
    if (!receiptContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleString();
    const processedBy = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unknown';
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { margin: 10px 0; }
            .total { margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.9em; }
            .processed-by { margin-top: 20px; font-style: italic; }
            .org-info { margin: 5px 0; font-size: 0.9em; }
          </style>
        </head>
        <body>
          <div class="header">
            ${systemSettings?.organization_name ? 
              `<h2>${systemSettings.organization_name}</h2>` : 
              '<h2>Hardware Store</h2>'
            }
            ${systemSettings?.location ? 
              `<p class="org-info">${systemSettings.location}</p>` : 
              ''
            }
            ${systemSettings?.organization_phone ? 
              `<p class="org-info">Tel: ${systemSettings.organization_phone}</p>` : 
              ''
            }
            ${systemSettings?.organization_email ? 
              `<p class="org-info">Email: ${systemSettings.organization_email}</p>` : 
              ''
            }
            ${systemSettings?.TIN ? 
              `<p class="org-info">TIN: ${systemSettings.TIN}</p>` : 
              ''
            }
            <p>${currentDate}</p>
            ${customerInfo.name ? `<p>Customer: ${customerInfo.name}</p>` : ''}
          </div>
          ${cart.map(item => `
            <div class="item">
              <div>${item.ProductName} x ${item.quantity}</div>
              <div>${formatPrice(item.selling_price)} each</div>
              <div>Total: ${formatPrice(parseFloat(item.selling_price) * item.quantity)}</div>
            </div>
          `).join('')}
          <div class="total">
            <h3>Total: ${formatPrice(calculateTotal())}</h3>
            <p>Payment Method: ${paymentMethod.toUpperCase()}</p>
          </div>
          <div class="processed-by">
            <p>Processed by: ${processedBy}</p>
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const handleEmailReceipt = () => {
    // Implement email receipt functionality
    console.log('Email receipt');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="text-rose-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14]">
      {/* Header */}
      <div className="glass-card border-b border-[#2A3041] p-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1E2438] text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <div className="text-sm text-gray-400">
            Logged in as: <span className="text-white font-medium">{currentUser?.firstName} {currentUser?.lastName}</span>
          </div>
        </div>
      </div>

      <div className="pos-container">
        <div className="pos-grid">
          {/* Product Catalog */}
          <div className="products-section">
            <div className="mb-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input w-full"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => scrollCategories('left')}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-[#1E2438] text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="categories-slider mx-8" ref={categoriesRef}>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`category-button ${!selectedCategory ? 'active' : ''}`}
                  >
                    All Products
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`category-button ${selectedCategory === category.name ? 'active' : ''}`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => scrollCategories('right')}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full bg-[#1E2438] text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="products-grid">
              {paginatedProducts.map((product) => {
                const stock = parseInt(product.Quantity);
                const isOutOfStock = stock <= 0;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    className={`product-card relative ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isOutOfStock}
                  >
                    <img
                      src={DEFAULT_PRODUCT_IMAGE}
                      alt={product.ProductName}
                      className="w-full h-20 object-cover rounded-md mb-2"
                    />
                    <h3 className="text-white text-sm font-medium mb-1 truncate">{product.ProductName}</h3>
                    <p className="text-blue-400 font-mono text-sm">
                      {formatPriceCompact(product.selling_price)}
                    </p>
                    <p className={`text-xs ${isOutOfStock ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[#2A3041]">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md hover:bg-[#1E2438] text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md hover:bg-[#1E2438] text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Cart & Checkout */}
          <div className="glass-card cart-wrapper">
            <div className="cart-header">
              <h2 className="text-xl font-bold text-white">Current Sale</h2>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1E2438] text-gray-400 hover:text-white transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm">Add Customer</span>
              </button>
            </div>

            {cartStep === 'items' ? (
              <>
                <div className="flex-1 overflow-y-auto cart-items" ref={receiptRef}>
                  {cart.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <p>No items in cart</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="glass-card p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-white text-sm font-medium mb-1">{item.ProductName}</h4>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="p-1 rounded-md hover:bg-[#1E2438] text-gray-400 hover:text-white transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="font-mono text-white min-w-[2ch] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="p-1 rounded-md hover:bg-[#1E2438] text-gray-400 hover:text-white transition-colors"
                                    disabled={item.quantity >= parseInt(item.Quantity)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                                <span className="font-mono text-blue-400 text-sm">
                                  {formatPriceCompact(parseFloat(item.selling_price) * item.quantity)}
                                </span>
                              </div>
                              {item.selling_price !== item.originalPrice && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Original price: {formatPriceCompact(item.originalPrice)}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => openPriceModal(item)}
                                className="p-1.5 rounded-md hover:bg-[#1E2438] text-gray-400 hover:text-blue-500 transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 rounded-md hover:bg-[#1E2438] text-gray-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="cart-footer">
                  <div className="flex justify-between items-center text-lg mb-4">
                    <span className="text-gray-400">Total</span>
                    <span className="font-mono font-bold text-white">
                      {formatPriceCompact(calculateTotal())}
                    </span>
                  </div>

                  <button
                    onClick={() => cart.length > 0 && setCartStep('payment')}
                    disabled={cart.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    Proceed to Payment
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 p-6">
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-white mb-4">Select Payment Method</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { method: 'cash', icon: Wallet, label: 'Cash' },
                        { method: 'card', icon: CreditCard, label: 'Card' },
                        { method: 'mobile', icon: Smartphone, label: 'Mobile' },
                      ].map(({ method, icon: Icon, label }) => (
                        <button
                          key={method}
                          onClick={() => setPaymentMethod(method as any)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
                            paymentMethod === method
                              ? 'bg-blue-600 text-white'
                              : 'glass-card text-gray-400 hover:text-white'
                          }`}
                        >
                          <Icon className="w-6 h-6" />
                          <span className="text-sm font-medium">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Order Summary</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Items ({cart.length})</span>
                        <span className="text-white font-mono">{formatPriceCompact(calculateTotal())}</span>
                      </div>
                      {customerInfo.name && (
                        <div className="text-sm text-gray-400">
                          Customer: <span className="text-white">{customerInfo.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="cart-footer p-6">
                  <div className="flex justify-between items-center text-lg mb-4">
                    <span className="text-gray-400">Total</span>
                    <span className="font-mono font-bold text-white">
                      {formatPriceCompact(calculateTotal())}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setCartStep('items')}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg glass-card text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={handleCompleteSale}
                      disabled={completingSale}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {completingSale ? (
                        <>
                          <span className="animate-spin">⌛</span>
                          Processing...
                        </>
                      ) : (
                        'Complete Sale'
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Customer Information</h3>
              <button
                onClick={() => setShowCustomerModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-400 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  id="customerName"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="search-input w-full"
                  placeholder="Enter customer name"
                />
              </div>

              <div>
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  value={customerInfo.email}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="search-input w-full"
                  placeholder="Enter email address"
                />
              </div>

              <button
                onClick={() => setShowCustomerModal(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Save Customer Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Adjustment Modal */}
      {showPriceModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Adjust Price</h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  {selectedItem.ProductName}
                </label>
                <div className="text-sm text-gray-500 mb-3">
                  Original price: {formatPrice(selectedItem.originalPrice)}
                </div>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="search-input w-full"
                  placeholder="Enter new price"
                />
              </div>

              <button
                onClick={handlePriceUpdate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Update Price
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModal
          onClose={handleSaleSuccess}
          onPrint={printReceipt}
          onEmail={handleEmailReceipt}
        />
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <p className="text-rose-500">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default POS;