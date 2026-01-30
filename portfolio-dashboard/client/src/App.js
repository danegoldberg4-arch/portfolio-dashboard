import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Globe, PieChart as PieIcon, BarChart3, Layers, RefreshCw, Wifi, WifiOff, Clock, ChevronDown, ChevronUp, Menu, X } from 'lucide-react';

// API Base URL - change this when deploying
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `$${value.toLocaleString('en-AU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const formatCompact = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

// ============================================================
// THEME & COLORS
// ============================================================

const COLORS = {
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#22d3ee',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  crypto: '#f7931a',
  ethereum: '#627eea',
  chart: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6']
};

// ============================================================
// COMPONENTS
// ============================================================

const StatCard = ({ title, value, change, icon: Icon, color, subtitle, loading, compact }) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 ${compact ? 'p-4' : 'p-5'} backdrop-blur-xl`}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-12 translate-x-12" />
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-xs font-medium tracking-wide uppercase truncate">{title}</p>
        {loading ? (
          <div className="h-7 w-28 bg-slate-700/50 rounded animate-pulse mt-1" />
        ) : (
          <p className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-white mt-1 tracking-tight truncate`}>{value}</p>
        )}
        {subtitle && <p className="text-slate-500 text-xs mt-1 truncate">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} flex-shrink-0 ml-2`}>
        <Icon size={compact ? 18 : 20} className="text-white" />
      </div>
    </div>
    {change !== undefined && !loading && (
      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
        {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        <span>{formatPercent(change)}</span>
        <span className="text-slate-500 font-normal text-xs">24h</span>
      </div>
    )}
  </div>
);

const TimeRangeSelector = ({ selected, onChange }) => {
  const ranges = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
  return (
    <div className="flex gap-0.5 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-x-auto">
      {ranges.map(range => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
            selected === range 
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
};

const ConnectionStatus = ({ isConnected, lastUpdate, onRefresh, isRefreshing }) => (
  <div className="flex items-center gap-2">
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
    }`}>
      {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
      <span className="hidden sm:inline">{isConnected ? 'Live' : 'Offline'}</span>
    </div>
    {lastUpdate && (
      <span className="text-slate-500 text-xs items-center gap-1 hidden sm:flex">
        <Clock size={10} />
        {lastUpdate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
      </span>
    )}
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className="p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-50"
    >
      <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
    </button>
  </div>
);

const HoldingRow = ({ holding, totalValue, expanded, onToggle }) => {
  const percentage = totalValue > 0 ? (holding.value / totalValue * 100) : 0;
  
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-all duration-200 cursor-pointer active:bg-slate-800/70"
      onClick={onToggle}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
        holding.isCrypto 
          ? holding.symbol === 'BTC' ? 'bg-orange-500/20 text-orange-400' 
          : holding.symbol === 'ETH' ? 'bg-indigo-500/20 text-indigo-400'
          : 'bg-purple-500/20 text-purple-400'
          : holding.type === 'Leveraged ETF' ? 'bg-amber-500/20 text-amber-400'
          : 'bg-slate-700/50 text-slate-300'
      }`}>
        {holding.displaySymbol.slice(0, 3)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{holding.displaySymbol}</p>
        <p className="text-slate-500 text-xs truncate">{holding.name}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-white font-medium text-sm">{formatCompact(holding.value)}</p>
        <p className={`text-xs font-medium ${
          holding.change24h === undefined ? 'text-slate-500' :
          holding.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          {holding.change24h !== undefined ? formatPercent(holding.change24h) : '—'}
        </p>
      </div>
      <div className="w-12 hidden sm:block flex-shrink-0">
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              holding.isCrypto ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
              holding.type === 'Leveraged ETF' ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
              'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${Math.min(percentage * 3, 100)}%` }}
          />
        </div>
        <p className="text-slate-500 text-xs mt-0.5 text-right">{percentage.toFixed(1)}%</p>
      </div>
    </div>
  );
};

const AllocationChart = ({ title, icon: Icon, color, data, totalValue }) => {
  const [expanded, setExpanded] = useState(false);
  const displayData = expanded ? data : data.slice(0, 4);
  
  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-4 backdrop-blur-xl">
      <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
        <Icon size={18} className={color} />
        {title}
      </h3>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [formatCurrency(value), 'Value']}
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 mt-2">
        {displayData.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-400 truncate">{item.name}</span>
            </div>
            <span className="text-white font-medium flex-shrink-0 ml-2">
              {totalValue > 0 ? (item.value / totalValue * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
        {data.length > 4 && (
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-1 w-full text-xs text-slate-500 hover:text-slate-300 pt-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Show less' : `+${data.length - 4} more`}
          </button>
        )}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-xl">
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ============================================================
// MAIN DASHBOARD COMPONENT
// ============================================================

export default function PortfolioDashboard() {
  const [timeRange, setTimeRange] = useState('1M');
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllHoldings, setShowAllHoldings] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`${API_BASE}/all`);
      if (!response.ok) throw new Error('API error');
      const result = await response.json();
      setData(result);
      setIsConnected(true);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
      setIsConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Process holdings with current prices
  const holdings = useMemo(() => {
    if (!data) return [];
    
    const { portfolio, cryptoPrices, stockPrices, exchangeRates } = data;
    
    const equityHoldings = portfolio.equities.map(equity => {
      const priceData = stockPrices[equity.symbol];
      let priceAUD = priceData?.price || 0;
      
      if (priceData?.currency === 'USD') {
        priceAUD = priceData.price * (exchangeRates.USDAUD || 1.55);
      } else if (priceData?.currency === 'HKD') {
        priceAUD = priceData.price * (exchangeRates.HKDAUD || 0.20);
      }
      
      return {
        ...equity,
        displaySymbol: equity.symbol.replace('.AX', '').replace('.HK', ''),
        price: priceAUD,
        value: priceAUD * equity.shares,
        change24h: priceData?.change24h,
        isCrypto: false
      };
    });

    const cryptoHoldings = portfolio.crypto.map(crypto => {
      const priceData = cryptoPrices[crypto.symbol];
      return {
        ...crypto,
        displaySymbol: crypto.symbol,
        price: priceData?.price || 0,
        value: (priceData?.price || 0) * crypto.amount,
        change24h: priceData?.change24h,
        isCrypto: true,
        sector: 'Cryptocurrency',
        region: 'Decentralized',
        type: ['BTC', 'ETH', 'SOL'].includes(crypto.symbol) ? 'Large Cap' : 'Altcoin'
      };
    });

    return [...equityHoldings, ...cryptoHoldings].sort((a, b) => b.value - a.value);
  }, [data]);

  // Consolidate holdings by symbol
  const consolidatedHoldings = useMemo(() => {
    const grouped = {};
    holdings.forEach(h => {
      const key = h.displaySymbol;
      if (!grouped[key]) {
        grouped[key] = { ...h };
      } else {
        grouped[key].value += h.value;
      }
    });
    return Object.values(grouped).sort((a, b) => b.value - a.value);
  }, [holdings]);

  // Calculate totals
  const totals = useMemo(() => {
    const equities = holdings.filter(h => !h.isCrypto).reduce((sum, h) => sum + h.value, 0);
    const crypto = holdings.filter(h => h.isCrypto).reduce((sum, h) => sum + h.value, 0);
    const leveraged = holdings.filter(h => h.type === 'Leveraged ETF').reduce((sum, h) => sum + h.value, 0);
    const cash = data?.portfolio?.cash?.amount || 0;
    const total = equities + crypto + cash;
    
    const totalChange = holdings.reduce((sum, h) => {
      if (h.change24h !== undefined && h.value > 0) {
        return sum + (h.change24h * h.value);
      }
      return sum;
    }, 0) / (total || 1);

    return { equities, crypto, leveraged, cash, total, change24h: totalChange };
  }, [holdings, data]);

  // Allocation data
  const assetAllocation = useMemo(() => [
    { name: 'Equities', value: totals.equities - totals.leveraged, color: COLORS.primary },
    { name: 'Leveraged', value: totals.leveraged, color: COLORS.warning },
    { name: 'Crypto', value: totals.crypto, color: COLORS.crypto },
    { name: 'Cash', value: totals.cash, color: COLORS.success },
  ].filter(a => a.value > 0), [totals]);

  const regionAllocation = useMemo(() => {
    const regions = {};
    consolidatedHoldings.forEach(h => {
      const region = h.region || 'Other';
      regions[region] = (regions[region] || 0) + h.value;
    });
    return Object.entries(regions)
      .map(([name, value], i) => ({ name, value, color: COLORS.chart[i % COLORS.chart.length] }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedHoldings]);

  const sectorAllocation = useMemo(() => {
    const sectors = {};
    consolidatedHoldings.forEach(h => {
      const sector = h.sector || 'Other';
      sectors[sector] = (sectors[sector] || 0) + h.value;
    });
    return Object.entries(sectors)
      .map(([name, value], i) => ({ name, value, color: COLORS.chart[i % COLORS.chart.length] }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedHoldings]);

  // Simulated historical data
  const historicalData = useMemo(() => {
    if (totals.total === 0) return [];
    const days = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, 'ALL': 730 }[timeRange];
    const data = [];
    let value = totals.total * (0.75 + Math.random() * 0.15);
    const dailyReturn = Math.pow(totals.total / value, 1 / days) - 1;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      value = value * (1 + dailyReturn + (Math.random() - 0.5) * 0.015);
      data.push({
        date: days <= 7 
          ? date.toLocaleDateString('en-AU', { weekday: 'short' })
          : date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
        value: Math.max(0, value)
      });
    }
    return data;
  }, [totals.total, timeRange]);

  const periodReturn = historicalData.length > 1 
    ? ((historicalData[historicalData.length - 1]?.value - historicalData[0]?.value) / historicalData[0]?.value * 100) 
    : 0;

  // Platform breakdown
  const platformData = useMemo(() => {
    const platforms = {};
    holdings.forEach(h => {
      platforms[h.broker] = (platforms[h.broker] || 0) + h.value;
    });
    if (data?.portfolio?.cash) {
      platforms[data.portfolio.cash.broker] = (platforms[data.portfolio.cash.broker] || 0) + data.portfolio.cash.amount;
    }
    return Object.entries(platforms)
      .map(([name, value]) => ({ 
        name, 
        value, 
        type: ['CoinJar', 'Swyftx', 'Binance'].includes(name) ? 'crypto' : 'broker' 
      }))
      .sort((a, b) => b.value - a.value);
  }, [holdings, data]);

  const displayedHoldings = showAllHoldings ? consolidatedHoldings : consolidatedHoldings.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-950 text-white" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent truncate">
              Portfolio
            </h1>
            <ConnectionStatus 
              isConnected={isConnected} 
              lastUpdate={lastUpdate} 
              onRefresh={fetchData}
              isRefreshing={isRefreshing}
            />
          </div>
          <TimeRangeSelector selected={timeRange} onChange={setTimeRange} />
        </div>
        
        {/* Main Value Card */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 p-5 backdrop-blur-xl">
          <p className="text-indigo-300 text-sm font-medium">Total Value</p>
          {isRefreshing && totals.total === 0 ? (
            <div className="h-10 w-48 bg-slate-700/50 rounded animate-pulse mt-1" />
          ) : (
            <p className="text-3xl sm:text-4xl font-bold text-white mt-1">{formatCurrency(totals.total)}</p>
          )}
          <div className={`flex items-center gap-2 mt-2 ${totals.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.change24h >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            <span className="font-semibold">{formatPercent(totals.change24h)}</span>
            <span className="text-slate-400 text-sm">today</span>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Equities"
            value={formatCompact(totals.equities)}
            icon={BarChart3}
            color="from-blue-500 to-cyan-600"
            subtitle={`${(totals.equities/totals.total*100 || 0).toFixed(0)}%`}
            loading={isRefreshing && totals.equities === 0}
            compact
          />
          <StatCard
            title="Crypto"
            value={formatCompact(totals.crypto)}
            icon={Layers}
            color="from-orange-500 to-amber-600"
            subtitle={`${(totals.crypto/totals.total*100 || 0).toFixed(0)}%`}
            loading={isRefreshing && totals.crypto === 0}
            compact
          />
          <StatCard
            title="Leveraged"
            value={formatCompact(totals.leveraged)}
            icon={TrendingUp}
            color="from-rose-500 to-pink-600"
            subtitle={`~${formatCompact(totals.leveraged * 1.55)} eff.`}
            compact
          />
          <StatCard
            title="Cash"
            value={formatCurrency(totals.cash)}
            icon={Wallet}
            color="from-emerald-500 to-teal-600"
            subtitle="AUD"
            compact
          />
        </div>
        
        {/* Performance Chart */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-white">Performance</h2>
              <p className="text-slate-400 text-xs">
                {timeRange}: <span className={periodReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {formatPercent(periodReturn)}
                </span>
              </p>
            </div>
          </div>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`}
                  domain={['dataMin - 2000', 'dataMax + 2000']}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Allocation Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AllocationChart title="Assets" icon={PieIcon} color="text-indigo-400" data={assetAllocation} totalValue={totals.total} />
          <AllocationChart title="Regions" icon={Globe} color="text-cyan-400" data={regionAllocation} totalValue={totals.total} />
          <AllocationChart title="Sectors" icon={BarChart3} color="text-purple-400" data={sectorAllocation} totalValue={totals.total} />
        </div>
        
        {/* Holdings */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-white">Holdings</h3>
            <span className="text-slate-400 text-xs">{consolidatedHoldings.length} positions</span>
          </div>
          <div className="space-y-0.5">
            {displayedHoldings.map((holding, i) => (
              <HoldingRow key={i} holding={holding} totalValue={totals.total} />
            ))}
          </div>
          {consolidatedHoldings.length > 10 && (
            <button 
              onClick={() => setShowAllHoldings(!showAllHoldings)}
              className="flex items-center justify-center gap-1 w-full text-sm text-slate-400 hover:text-white mt-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all"
            >
              {showAllHoldings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showAllHoldings ? 'Show less' : `Show all ${consolidatedHoldings.length} holdings`}
            </button>
          )}
        </div>
        
        {/* Platforms */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 p-4 backdrop-blur-xl">
          <h3 className="text-base font-semibold text-white mb-3">Platforms</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {platformData.map((platform, i) => (
              <div key={i} className={`p-3 rounded-xl border transition-all ${
                platform.type === 'crypto' 
                  ? 'bg-orange-500/10 border-orange-500/20' 
                  : 'bg-slate-800/50 border-slate-700/30'
              }`}>
                <p className="text-slate-400 text-xs font-medium truncate">{platform.name}</p>
                <p className="text-white font-semibold text-sm mt-0.5">{formatCompact(platform.value)}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center text-slate-600 text-xs py-4">
          <p>Live prices via CoinGecko & Yahoo Finance</p>
        </div>
      </div>
    </div>
  );
}
