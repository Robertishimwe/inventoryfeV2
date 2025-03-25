import React, { useState, useEffect } from 'react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Users, 
  Tags, 
  Scale, 
  Truck, 
  History,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Bell,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearUser, getUser, getSettings } from '../services/db';
import { getDashboardData, DashboardData } from '../services/api';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [systemSettings, setSystemSettings] = useState<{ currency: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, settings] = await Promise.all([
          getUser(),
          getSettings()
        ]);
        
        if (userData) {
          setUser(userData);
          setSystemSettings(settings);
          const data = await getDashboardData();
          setDashboardData(data);
        } else {
          navigate('/login');
        }
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const handleLogout = async () => {
    sessionStorage.removeItem('token');
    await clearUser();
    navigate('/login');
  };

  const getInitials = () => {
    if (!user) return '';
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  // const formatCurrency = (amount: number | string) => {
  //   const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  //   return num.toLocaleString('en-RW', {
  //     style: 'currency',
  //     currency: systemSettings?.currency || 'RWF',
  //     minimumFractionDigits: 0,
  //   });
  // };
  // const formatPrice = (price: string | number) => {
  //   const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  //   return new Intl.NumberFormat('en-RW', {
  //     style: 'currency',
  //     currency: systemSettings?.currency || 'RWF',
  //     minimumFractionDigits: 0,
  //   }).format(numPrice);
  // };

  const formatPriceCompact = (price: string | number) => {
    const currency = systemSettings?.currency || 'RWF';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `${currency} ${numPrice.toLocaleString()}`;
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
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-screen w-72 glass-card border-r border-[#2A3041] p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-blue-500/10">
            <Boxes className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Inventory MS</h1>
        </div>
        
        <nav className="space-y-1.5 mb-6">
          {[
            { icon: Home, label: 'Dashboard', path: '/dashboard', active: true },
            { icon: ShoppingCart, label: 'Point of Sale (POS)', path: '/pos' },
            { icon: Package, label: 'Products', path: '/products' },
            { icon: Boxes, label: 'Inventory', path: '/inventory' },
            { icon: Users, label: 'Users', path: '/users' },
            { icon: Tags, label: 'Categories', path: '/categories' },
            { icon: Scale, label: 'Units', path: '/units' },
            { icon: Truck, label: 'Suppliers', path: '/suppliers' },
            { icon: History, label: 'Transactions', path: '/transactions' },
          ].map(({ icon: Icon, label, path, active }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="space-y-1.5 pt-4 border-t border-[#2A3041]">
          <button className="nav-item">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button className="nav-item">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help & Support</span>
          </button>
          <button onClick={handleLogout} className="nav-item text-rose-500 hover:text-rose-400">
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-72">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#070B14]/80 backdrop-blur-xl border-b border-[#2A3041] py-4">
          <div className="flex items-center justify-between px-6">
            <div className="flex-1">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text"
                  placeholder="Search anything..."
                  className="search-input w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="btn-icon relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full"></span>
              </button>
              <button className="user-button">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{getInitials()}</span>
                </div>
                <span className="text-sm font-medium text-white">{user?.firstName || 'Loading...'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Analytics Overview</h2>
            <p className="text-gray-400 text-sm">Track your business performance and inventory metrics</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            {[
              {
                title: 'Total Purchases',
                value: dashboardData?.monthlyPurchases || 0,
                icon: DollarSign,
                change: '+12.5%',
                positive: true,
                subtitle: 'Monthly Purchases',
              },
              {
                title: 'Total Sales',
                value: dashboardData?.monthlySales || 0,
                icon: TrendingUp,
                change: '+8.2%',
                positive: true,
                subtitle: 'Monthly Sales Total',
              },
              {
                title: 'Estimated Profit',
                value: dashboardData?.estimatedProfit.estimatedProfit || '0',
                icon: DollarSign,
                change: dashboardData?.estimatedProfit.profitMargin || '0%',
                positive: true,
                subtitle: 'Before Taxes',
              },
              {
                title: 'Daily Sales',
                value: dashboardData?.dailySales || 0,
                icon: TrendingUp,
                change: '+5.8%',
                positive: true,
                subtitle: 'Today\'s Total',
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="glass-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-blue-500/10">
                    <stat.icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    stat.positive ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {stat.positive ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div>
                  <h3 className="text-gray-400 text-sm font-medium mb-1.5">
                    {stat.title}
                  </h3>
                  <p className="text-white text-xl font-bold stat-value mb-1.5">
                    {formatPriceCompact(stat.value)}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {stat.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Low Stock Section */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Low Stock Alert</h3>
                <p className="text-gray-400 text-sm">Items requiring immediate attention</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            {dashboardData?.lowStockItems && dashboardData.lowStockItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2A3041]">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Product Name</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Current Stock</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Minimum Stock</th>
                      <th className="text-right py-3 px-4 text-gray-400 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.lowStockItems.map((item, index) => (
                      <tr key={index} className="border-b border-[#2A3041] last:border-0">
                        <td className="py-3 px-4 text-white">{item.productName}</td>
                        <td className="py-3 px-4 text-right font-mono text-white">{item.currentStock}</td>
                        <td className="py-3 px-4 text-right font-mono text-white">{item.minimumStockLevel}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-500">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center rounded-lg bg-[#151B2C] border border-[#2A3041]">
                <p className="text-gray-400 text-sm">No items currently low in stock</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;