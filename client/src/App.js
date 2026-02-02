import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `$${value.toLocaleString('en-AU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
};

const formatCompact = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return formatCurrency(value);
};

const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const formatChange = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return `${value >= 0 ? '+' : ''}$${Math.abs(value).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const COLORS = ['#6366f1', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899', '#f43f5e', '#06b6d4', '#eab308', '#a855f7', '#14b8a6'];

const StatCard = ({ title, value, subtitle, change, changeValue, color }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <div className="stat-icon" style={{ background: color }}></div>
    </div>
    <div className="stat-value">{value}</div>
    {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    {(change !== undefined || changeValue !== undefined) && (
      <div className={`stat-change ${(change || 0) >= 0 ? 'positive' : 'negative'}`}>
        {change !== undefined && <span>{formatPercent(change)}</span>}
        {changeValue !== undefined && <span className="change-value"> ({formatChange(changeValue)})</span>}
      </div>
    )}
  </div>
);

const HoldingRow = ({ holding, totalValue }) => {
  const percentage = totalValue > 0 ? (holding.value / totalValue * 100) : 0;
  const isPositive = (holding.change24h || 0) >= 0;
  const hasPrice = holding.price > 0;
  
  return (
    <div className={`holding-row ${!hasPrice ? 'no-price' : ''}`}>
      <div className={`holding-icon ${holding.isCrypto ? 'crypto' : ''} ${!hasPrice ? 'disabled' : ''}`}>
        {holding.displaySymbol.slice(0, 3)}
      </div>
      <div className="holding-info">
        <div className="holding-symbol">
          {holding.displaySymbol}
          {!hasPrice && (
            <span className="price-warning" title={`Price unavailable (${holding.market || 'Unknown'} market not supported)`}>
              ⚠️
            </span>
          )}
          {holding.market && holding.market !== 'US' && !holding.isCrypto && (
            <span className="market-badge" title={`${holding.market} stocks not supported by Twelve Data`}>
              {holding.market}
            </span>
          )}
        </div>
        <div className="holding-name">{holding.name}</div>
        <div className="holding-details">
          {holding.totalShares !== undefined && (
            <span className="holding-shares">
              {holding.isCrypto 
                ? `${holding.totalShares.toFixed(holding.totalShares < 1 ? 6 : 2)} ${holding.displaySymbol}`
                : `${holding.totalShares.toLocaleString('en-AU', { maximumFractionDigits: 4 })} shares`
              }
            </span>
          )}
          {!holding.isCrypto && holding.broker && (
            <span className="holding-broker"> • {holding.broker}</span>
          )}
        </div>
      </div>
      <div className="holding-values">
        <div className="holding-value">
          {hasPrice ? formatCurrency(holding.value) : (
            <span className="value-unavailable" title="Manual entry required">—</span>
          )}
        </div>
        <div className={`holding-change ${isPositive ? 'positive' : 'negative'}`}>
          {hasPrice ? formatPercent(holding.change24h) : '—'}
        </div>
        <div className={`holding-change-value ${isPositive ? 'positive' : 'negative'}`}>
          {hasPrice ? formatChange(holding.dayChangeValue) : '—'}
        </div>
      </div>
      <div className="holding-bar-container">
        {hasPrice ? (
          <>
            <div className="holding-bar" style={{ width: `${Math.min(percentage * 2.5, 100)}%` }}></div>
            <div className="holding-percent">{percentage.toFixed(1)}%</div>
          </>
        ) : (
          <div className="holding-percent disabled">N/A</div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeRange, setTimeRange] = useState('1M');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/all`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      
      // Log API stats
      if (result.stats) {
        console.log('📊 API Stats:', result.stats);
        console.log(`⏱️  Data ${result.cached ? 'from cache' : 'freshly fetched'}`);
      }
      
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes (300000ms) to match server cache
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const holdings = useMemo(() => {
    if (!data) return [];
    
    const { portfolio, cryptoPrices = {}, stockPrices = {}, exchangeRates = {} } = data;
    
    const equityHoldings = (portfolio.equities || []).map(equity => {
      const priceData = stockPrices[equity.symbol];
      let priceAUD = priceData?.price || 0;
      let changeValueAUD = priceData?.changeValue || 0;
      
      // Only US stocks have prices from Twelve Data
      if (priceData && equity.market === 'US') {
        // Convert USD to AUD
        priceAUD = priceData.price * (exchangeRates.USDAUD || 1.58);
        changeValueAUD = (priceData.changeValue || 0) * (exchangeRates.USDAUD || 1.58);
      }
      
      const value = priceAUD * equity.shares;
      const dayChangeValue = changeValueAUD * equity.shares;
      
      return {
        ...equity,
        displaySymbol: equity.symbol.replace('.AX', '').replace('.HK', ''),
        price: priceAUD,
        value: value,
        change24h: priceData?.change24h || 0,
        dayChangeValue: dayChangeValue,
        totalShares: equity.shares,
        isCrypto: false,
        hasPrice: !!priceData && priceAUD > 0
      };
    });

    const cryptoHoldings = (portfolio.crypto || []).map(crypto => {
      const priceData = cryptoPrices[crypto.symbol];
      const price = priceData?.price || 0;
      const value = price * crypto.amount;
      const change24h = priceData?.change24h || 0;
      const dayChangeValue = value * (change24h / 100);
      
      return {
        ...crypto,
        displaySymbol: crypto.symbol,
        price: price,
        value: value,
        change24h: change24h,
        dayChangeValue: dayChangeValue,
        totalShares: crypto.amount,
        isCrypto: true,
        sector: 'Cryptocurrency',
        region: 'Decentralized',
        type: 'Crypto',
        hasPrice: !!priceData && price > 0
      };
    });

    return [...equityHoldings, ...cryptoHoldings].sort((a, b) => {
      // Sort: items with prices first, then by value
      if (a.hasPrice && !b.hasPrice) return -1;
      if (!a.hasPrice && b.hasPrice) return 1;
      return b.value - a.value;
    });
  }, [data]);

  // Consolidate holdings by symbol (combine same stocks from different brokers)
  const consolidatedHoldings = useMemo(() => {
    const grouped = {};
    holdings.forEach(h => {
      const key = h.displaySymbol;
      if (!grouped[key]) {
        grouped[key] = { ...h, totalShares: h.totalShares || 0, brokers: [h.broker] };
      } else {
        grouped[key].value += h.value;
        grouped[key].totalShares += h.totalShares || 0;
        grouped[key].dayChangeValue = (grouped[key].dayChangeValue || 0) + (h.dayChangeValue || 0);
        if (h.broker && !grouped[key].brokers.includes(h.broker)) {
          grouped[key].brokers.push(h.broker);
        }
      }
    });
    
    // Format broker display
    Object.values(grouped).forEach(h => {
      if (h.brokers && h.brokers.length > 1) {
        h.broker = h.brokers.join(', ');
      }
    });
    
    return Object.values(grouped).sort((a, b) => {
      // Sort: items with prices first, then by value
      if (a.hasPrice && !b.hasPrice) return -1;
      if (!a.hasPrice && b.hasPrice) return 1;
      return b.value - a.value;
    });
  }, [holdings]);

  const totals = useMemo(() => {
    const equities = holdings.filter(h => !h.isCrypto).reduce((sum, h) => sum + h.value, 0);
    const crypto = holdings.filter(h => h.isCrypto).reduce((sum, h) => sum + h.value, 0);
    const cash = data?.portfolio?.cash?.amount || 0;
    const total = equities + crypto + cash;
    
    // Calculate day change (only for holdings with prices)
    const equityDayChange = holdings.filter(h => !h.isCrypto && h.hasPrice).reduce((sum, h) => sum + (h.dayChangeValue || 0), 0);
    const cryptoDayChange = holdings.filter(h => h.isCrypto && h.hasPrice).reduce((sum, h) => sum + (h.dayChangeValue || 0), 0);
    const totalDayChange = equityDayChange + cryptoDayChange;
    
    // Calculate percentage change
    const prevTotal = total - totalDayChange;
    const totalChange24h = prevTotal > 0 ? (totalDayChange / prevTotal) * 100 : 0;
    const equityPrev = equities - equityDayChange;
    const equityChange24h = equityPrev > 0 ? (equityDayChange / equityPrev) * 100 : 0;
    const cryptoPrev = crypto - cryptoDayChange;
    const cryptoChange24h = cryptoPrev > 0 ? (cryptoDayChange / cryptoPrev) * 100 : 0;

    return { 
      equities, crypto, cash, total,
      totalDayChange, equityDayChange, cryptoDayChange,
      totalChange24h, equityChange24h, cryptoChange24h
    };
  }, [holdings, data]);

  const assetAllocation = useMemo(() => [
    { name: 'Equities', value: totals.equities },
    { name: 'Crypto', value: totals.crypto },
    { name: 'Cash', value: totals.cash },
  ].filter(a => a.value > 0), [totals]);

  const regionAllocation = useMemo(() => {
    const regions = {};
    consolidatedHoldings.filter(h => h.hasPrice).forEach(h => {
      const region = h.region || 'Other';
      regions[region] = (regions[region] || 0) + h.value;
    });
    return Object.entries(regions)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedHoldings]);

  const sectorAllocation = useMemo(() => {
    const sectors = {};
    consolidatedHoldings.filter(h => h.hasPrice).forEach(h => {
      const sector = h.sector || 'Other';
      sectors[sector] = (sectors[sector] || 0) + h.value;
    });
    return Object.entries(sectors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [consolidatedHoldings]);

  const historicalData = useMemo(() => {
    if (totals.total === 0) return [];
    const days = { '1D': 1, '1W': 7, '1M': 30, '3M': 90, '1Y': 365 }[timeRange] || 30;
    const data = [];
    let value = totals.total * 0.85;
    const dailyReturn = Math.pow(totals.total / value, 1 / days) - 1;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      value = value * (1 + dailyReturn + (Math.random() - 0.5) * 0.015);
      data.push({
        date: date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
        value: Math.max(0, value)
      });
    }
    return data;
  }, [totals.total, timeRange]);

  // Calculate stats for display
  const stats = useMemo(() => {
    const totalEquities = holdings.filter(h => !h.isCrypto).length;
    const withPrices = holdings.filter(h => h.hasPrice).length;
    const withoutPrices = holdings.filter(h => !h.hasPrice).length;
    const usEquities = holdings.filter(h => !h.isCrypto && h.market === 'US').length;
    const nonUsEquities = holdings.filter(h => !h.isCrypto && h.market !== 'US').length;
    
    return {
      totalHoldings: holdings.length,
      totalEquities,
      usEquities,
      nonUsEquities,
      withPrices,
      withoutPrices,
      priceAvailability: holdings.length > 0 ? (withPrices / holdings.length * 100) : 0
    };
  }, [holdings]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="header">
        <div>
          <h1>Portfolio</h1>
          <div className="status">
            <span className={`status-dot ${refreshing ? 'refreshing' : error ? 'error' : ''}`}></span>
            {error ? (
              <span className="status-error" title={error}>Error</span>
            ) : refreshing ? (
              'Updating...'
            ) : (
              'Live'
            )}
            {lastUpdate && ` • ${lastUpdate.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`}
            <button className="refresh-btn" onClick={fetchData} disabled={refreshing} title="Refresh data (cached for 5 minutes)">
              ↻
            </button>
          </div>
        </div>
        <div className="time-selector">
          {['1D', '1W', '1M', '3M', '1Y'].map(range => (
            <button
              key={range}
              className={timeRange === range ? 'active' : ''}
              onClick={() => setTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ API Error: {error}</span>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {stats.withoutPrices > 0 && (
        <div className="info-banner">
          <div className="banner-content">
            <span className="banner-icon">ℹ️</span>
            <div className="banner-text">
              <strong>Price Data Availability:</strong> {stats.withPrices}/{stats.totalHoldings} holdings have live prices
              <div className="banner-details">
                • {stats.usEquities} US stocks tracked via Twelve Data
                • {stats.nonUsEquities} non-US stocks (ASX, HK) require manual pricing
                • Update frequency: Every 5 minutes • First fetch takes ~60 seconds
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="total-card">
        <div className="total-label">Total Value (Tracked Holdings)</div>
        <div className="total-value">{formatCurrency(totals.total)}</div>
        {totals.total > 0 && (
          <div className={`total-change ${totals.totalChange24h >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(totals.totalChange24h)} ({formatChange(totals.totalDayChange)}) today
          </div>
        )}
        {stats.withoutPrices > 0 && (
          <div className="total-note">
            * Excludes {stats.withoutPrices} holdings without live pricing
          </div>
        )}
      </div>

      <div className="stats-grid">
        <StatCard 
          title="Equities (US Only)" 
          value={formatCompact(totals.equities)} 
          subtitle={totals.total > 0 ? `${(totals.equities/totals.total*100).toFixed(0)}% of tracked` : 'No data'}
          change={totals.equityChange24h}
          changeValue={totals.equityDayChange}
          color="#6366f1" 
        />
        <StatCard 
          title="Crypto" 
          value={formatCompact(totals.crypto)} 
          subtitle={totals.total > 0 ? `${(totals.crypto/totals.total*100).toFixed(0)}% of tracked` : 'No data'}
          change={totals.cryptoChange24h}
          changeValue={totals.cryptoDayChange}
          color="#f59e0b" 
        />
      </div>

      <div className="chart-section">
        <h2>Performance (Simulated)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }} formatter={(v) => [formatCurrency(v), 'Value']} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="allocation-grid">
        <div className="allocation-card">
          <h3>Assets</h3>
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={assetAllocation} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                  {assetAllocation.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {assetAllocation.map((item, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                <span className="legend-name">{item.name}</span>
                <span className="legend-value">{(item.value / totals.total * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="allocation-card">
          <h3>Regions (Tracked)</h3>
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={regionAllocation.slice(0, 6)} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                  {regionAllocation.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {regionAllocation.slice(0, 4).map((item, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                <span className="legend-name">{item.name}</span>
                <span className="legend-value">{(item.value / totals.total * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="allocation-card">
          <h3>Sectors (Tracked)</h3>
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={sectorAllocation.slice(0, 6)} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" paddingAngle={2}>
                  {sectorAllocation.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            {sectorAllocation.slice(0, 4).map((item, i) => (
              <div key={i} className="legend-item">
                <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }}></span>
                <span className="legend-name">{item.name}</span>
                <span className="legend-value">{(item.value / totals.total * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="holdings-section">
        <div className="holdings-header">
          <h2>Holdings</h2>
          <span className="holdings-count">
            {consolidatedHoldings.length} positions 
            <span className="holdings-stats"> • {stats.withPrices} tracked • {stats.withoutPrices} manual</span>
          </span>
        </div>
        <div className="holdings-list">
          {consolidatedHoldings.map((holding, i) => (
            <HoldingRow key={i} holding={holding} totalValue={totals.total} />
          ))}
        </div>
      </div>

      <footer className="footer">
        <p>
          <strong>Live prices:</strong> Twelve Data (US equities) & CoinGecko (crypto) • 
          <strong> Update frequency:</strong> Every 5 minutes (first fetch ~60s)
        </p>
        {data?.timestamp && <p className="timestamp">Last update: {new Date(data.timestamp).toLocaleString('en-AU')}</p>}
        {data?.cached && <p className="cached-indicator">📦 Serving cached data</p>}
        {data?.stats && (
          <p className="api-stats">
            API Stats: {data.stats.usEquities} US stocks tracked | {data.stats.nonUsEquities} non-US stocks (manual pricing required)
          </p>
        )}
      </footer>

      <style jsx>{`
        .error-banner {
          background: #7f1d1d;
          color: #fecaca;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .error-banner button {
          background: #991b1b;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .info-banner {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          color: #dbeafe;
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 16px;
          border-left: 4px solid #3b82f6;
        }
        
        .banner-content {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        
        .banner-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .banner-text strong {
          color: #ffffff;
        }
        
        .banner-details {
          font-size: 13px;
          margin-top: 8px;
          opacity: 0.9;
          line-height: 1.6;
        }
        
        .status-error {
          color: #ef4444;
        }
        
        .status-dot.error {
          background: #ef4444;
        }
        
        .holding-row.no-price {
          opacity: 0.5;
          background: rgba(100, 116, 139, 0.05);
        }
        
        .holding-icon.disabled {
          background: #475569 !important;
          opacity: 0.5;
        }
        
        .price-warning {
          margin-left: 6px;
          font-size: 14px;
        }
        
        .market-badge {
          display: inline-block;
          background: #475569;
          color: #cbd5e1;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 6px;
          font-weight: 600;
        }
        
        .value-unavailable {
          color: #64748b;
          font-style: italic;
        }
        
        .holding-broker {
          color: #64748b;
          font-size: 11px;
        }
        
        .holding-percent.disabled {
          color: #64748b;
          font-style: italic;
        }
        
        .total-note {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 8px;
          font-style: italic;
        }
        
        .holdings-stats {
          font-size: 12px;
          color: #64748b;
          font-weight: normal;
        }
        
        .cached-indicator {
          color: #64748b;
          font-size: 12px;
        }
        
        .api-stats {
          color: #64748b;
          font-size: 11px;
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
