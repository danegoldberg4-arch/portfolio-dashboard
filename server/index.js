const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const { shouldFetchMarket, getMarketStatus } = require('./marketHours');

const app = express();
const PORT = process.env.PORT || 3001;

// API Keys
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || 'd9ffb52101194c49afb2a7dba3b691b3';
const FMP_API_KEY = process.env.FMP_API_KEY || 'YOUR_FMP_API_KEY_HERE'; // Get free key from https://financialmodelingprep.com/developer/docs/

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// ============================================================
// PORTFOLIO CONFIGURATION
// ============================================================
const PORTFOLIO = {
  equities: [
    // Stake (ASX) - FMP API
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 7.0831, broker: 'Stake', sector: 'Healthcare', region: 'Australia', type: 'Stock', market: 'ASX', fmpSymbol: 'CSL.AX' },
    { symbol: 'G200.AX', name: 'Betashares Geared ASX 200', shares: 41.0752, broker: 'Stake', sector: 'Diversified', region: 'Australia', type: 'ETF', market: 'ASX', fmpSymbol: 'G200.AX' },
    { symbol: 'GGBL.AX', name: 'Betashares Geared Global', shares: 167.9303, broker: 'Stake', sector: 'Diversified', region: 'Global', type: 'ETF', market: 'ASX', fmpSymbol: 'GGBL.AX' },
    { symbol: 'GNDQ.AX', name: 'Betashares Geared NASDAQ', shares: 111.9889, broker: 'Stake', sector: 'Technology', region: 'USA', type: 'ETF', market: 'ASX', fmpSymbol: 'GNDQ.AX' },
    { symbol: 'IAA.AX', name: 'iShares Asia 50', shares: 14.0183, broker: 'Stake', sector: 'Diversified', region: 'Asia', type: 'ETF', market: 'ASX', fmpSymbol: 'IAA.AX' },
    { symbol: 'NDIA.AX', name: 'Global X India Nifty 50', shares: 13.2013, broker: 'Stake', sector: 'Diversified', region: 'India', type: 'ETF', market: 'ASX', fmpSymbol: 'NDIA.AX' },
    { symbol: 'VEU.AX', name: 'Vanguard All-World ex-US', shares: 17.9115, broker: 'Stake', sector: 'Diversified', region: 'Global ex-US', type: 'ETF', market: 'ASX', fmpSymbol: 'VEU.AX' },
    { symbol: 'VTS.AX', name: 'Vanguard US Total Market', shares: 2.1512, broker: 'Stake', sector: 'Diversified', region: 'USA', type: 'ETF', market: 'ASX', fmpSymbol: 'VTS.AX' },
    
    // Webull (US stocks) - Twelve Data
    { symbol: 'TSLA', name: 'Tesla Inc', shares: 8.72, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'UNH', name: 'UnitedHealth Group', shares: 4.2, broker: 'Webull', sector: 'Healthcare', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'SSYS', name: 'Stratasys Ltd', shares: 122, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'GOOG', name: 'Alphabet Inc', shares: 1.85, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'AAPL', name: 'Apple Inc', shares: 1.08, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'AMZN', name: 'Amazon.com', shares: 0.76, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock', market: 'US' },
    
    // CommSec (ASX) - FMP API
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 5, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock', market: 'ASX', fmpSymbol: 'CSL.AX' },
    { symbol: 'PBH.AX', name: 'Pointsbet Holdings', shares: 88, broker: 'CommSec', sector: 'Consumer Discretionary', region: 'Australia', type: 'Stock', market: 'ASX', fmpSymbol: 'PBH.AX' },
    { symbol: 'PER.AX', name: 'Percheron Therapeutics', shares: 277222, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock', market: 'ASX', fmpSymbol: 'PER.AX' },
    { symbol: 'RZI.AX', name: 'Raiz Invest Ltd', shares: 1305, broker: 'CommSec', sector: 'Financials', region: 'Australia', type: 'Stock', market: 'ASX', fmpSymbol: 'RZI.AX' },
    
    // IBKR (Multi-market)
    { symbol: 'NVO', name: 'Novo Nordisk', shares: 30, broker: 'IBKR', sector: 'Healthcare', region: 'Europe', type: 'Stock', market: 'US' },
    { symbol: 'BMNR', name: 'Bitdeer Technologies', shares: 57, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'VSNT', name: 'Verisant Inc', shares: 27, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: '9618.HK', name: 'JD.com', shares: 50, broker: 'IBKR', sector: 'Consumer Discretionary', region: 'China', type: 'Stock', market: 'HK', fmpSymbol: '9618.HK' },
    { symbol: 'BBAI', name: 'BigBear.ai', shares: 300, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'SOFI', name: 'SoFi Technologies', shares: 50, broker: 'IBKR', sector: 'Financials', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'ADBE', name: 'Adobe Inc', shares: 3.5196, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'CBE.AX', name: 'Cobre Ltd', shares: 16200, broker: 'IBKR', sector: 'Materials', region: 'Australia', type: 'Stock', market: 'ASX', fmpSymbol: 'CBE.AX' },
  ],
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.04012328, broker: 'CoinJar' },
    { symbol: 'ETH', name: 'Ethereum', amount: 0.333179644, broker: 'CoinJar' },
    { symbol: 'HYPE', name: 'Hyperliquid', amount: 33.4543, broker: 'Swyftx' },
    { symbol: 'ENA', name: 'Ethena', amount: 1970, broker: 'Swyftx' },
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.00013964, broker: 'Swyftx' },
    { symbol: 'ETH', name: 'Ethereum', amount: 1.17749667, broker: 'Binance' },
    { symbol: 'SOL', name: 'Solana', amount: 3.7019398, broker: 'Binance' },
    { symbol: 'DGC', name: 'DecentralGPT', amount: 20111144.9557, broker: 'Binance' },
  ],
  cash: { amount: 89.33, currency: 'AUD', broker: 'IBKR' }
};

const COINGECKO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'HYPE': 'hyperliquid',
  'ENA': 'ethena',
  'DGC': 'decentralgpt'
};

let priceCache = { 
  crypto: { data: null, timestamp: 0 }, 
  usStocks: { data: {}, timestamp: 0 },
  intlStocks: { data: {}, timestamp: 0 },
  exchangeRates: { data: null, timestamp: 0 } 
};

const CACHE_DURATION = 1800000; // 30 minutes

// ========================================
// TWELVE DATA - US STOCKS
// ========================================
async function fetchTwelveDataSingle(symbol) {
  try {
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Twelve Data] HTTP ${response.status} for ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.close) {
      const currentPrice = parseFloat(data.close);
      const previousClose = parseFloat(data.previous_close);
      const result = {
        price: currentPrice,
        previousClose: previousClose,
        change24h: parseFloat(data.percent_change) || 0,
        changeValue: parseFloat(data.change) || 0,
        currency: 'USD'
      };
      console.log(`  ✓ ${symbol}: $${currentPrice.toFixed(2)} (${data.percent_change}%)`);
      return result;
    } else {
      console.log(`  ✗ ${symbol}: No data returned`);
      return null;
    }
  } catch (error) {
    console.error(`[Twelve Data] Error fetching ${symbol}:`, error.message);
    return null;
  }
}

// ========================================
// FINANCIAL MODELING PREP - ASX & HK STOCKS
// ========================================
async function fetchFMPQuote(symbol) {
  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbol)}?apikey=${FMP_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[FMP] HTTP ${response.status} for ${symbol}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0 && data[0].price) {
      const quote = data[0];
      const currentPrice = parseFloat(quote.price);
      const previousClose = parseFloat(quote.previousClose || quote.price);
      const changePercent = parseFloat(quote.changesPercentage || 0);
      const changeValue = currentPrice - previousClose;
      
      const result = {
        price: currentPrice,
        previousClose: previousClose,
        change24h: changePercent,
        changeValue: changeValue,
        currency: 'AUD' // FMP returns ASX prices in AUD
      };
      
      console.log(`  ✓ ${symbol}: $${currentPrice.toFixed(2)} (${changePercent.toFixed(2)}%)`);
      return result;
    } else {
      console.log(`  ✗ ${symbol}: No data returned`);
      return null;
    }
  } catch (error) {
    console.error(`[FMP] Error fetching ${symbol}:`, error.message);
    return null;
  }
}

// ========================================
// API ENDPOINTS
// ========================================

app.get('/api/portfolio', (req, res) => res.json(PORTFOLIO));

app.get('/api/crypto/prices', async (req, res) => {
  try {
    if (priceCache.crypto.data && Date.now() - priceCache.crypto.timestamp < CACHE_DURATION) {
      console.log('[CoinGecko] Returning cached data');
      return res.json(priceCache.crypto.data);
    }
    
    console.log('[CoinGecko] Fetching fresh crypto prices...');
    const ids = Object.values(COINGECKO_IDS).join(',');
    const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=aud&include_24hr_change=true`);
    if (!response.ok) throw new Error('CoinGecko error');
    const data = await response.json();
    const prices = {};
    for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
      if (data[id]) {
        prices[symbol] = { price: data[id].aud, change24h: data[id].aud_24h_change || 0 };
      }
    }
    priceCache.crypto = { data: prices, timestamp: Date.now() };
    console.log(`[CoinGecko] Fetched ${Object.keys(prices).length} crypto prices`);
    res.json(prices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/exchange-rates', async (req, res) => {
  try {
    if (priceCache.exchangeRates.data && Date.now() - priceCache.exchangeRates.timestamp < CACHE_DURATION * 5) {
      return res.json(priceCache.exchangeRates.data);
    }
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    const rates = { USDAUD: data.rates.AUD, HKDAUD: data.rates.AUD / data.rates.HKD };
    priceCache.exchangeRates = { data: rates, timestamp: Date.now() };
    res.json(rates);
  } catch (error) {
    res.json({ USDAUD: 1.58, HKDAUD: 0.20 });
  }
});

app.get('/api/all', async (req, res) => {
  try {
    const now = Date.now();
    
    // Check cache
    const cacheValid = priceCache.usStocks.data && 
                       Object.keys(priceCache.usStocks.data).length > 0 &&
                       priceCache.intlStocks.data &&
                       Object.keys(priceCache.intlStocks.data).length > 0 &&
                       now - priceCache.usStocks.timestamp < CACHE_DURATION &&
                       now - priceCache.intlStocks.timestamp < CACHE_DURATION;
    
    if (cacheValid) {
      console.log(`[CACHE] Returning cached data (${Math.floor((now - priceCache.usStocks.timestamp) / 1000)}s old)`);
      return res.json({
        portfolio: PORTFOLIO,
        cryptoPrices: priceCache.crypto.data || {},
        stockPrices: { ...priceCache.usStocks.data, ...priceCache.intlStocks.data },
        exchangeRates: priceCache.exchangeRates.data || { USDAUD: 1.58, HKDAUD: 0.20 },
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    console.log('[API] Cache expired, fetching fresh data...');

    // Exchange rates
    let exchangeRates = { USDAUD: 1.58, HKDAUD: 0.20 };
    try {
      const ratesRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (ratesRes.ok) {
        const rd = await ratesRes.json();
        exchangeRates = { USDAUD: rd.rates.AUD, HKDAUD: rd.rates.AUD / rd.rates.HKD };
        priceCache.exchangeRates = { data: exchangeRates, timestamp: now };
        console.log(`[Exchange] USD→AUD: ${exchangeRates.USDAUD.toFixed(3)}`);
      }
    } catch (e) {
      console.error('[Exchange] Error, using fallback rates');
    }

    // Crypto
    let cryptoPrices = {};
    try {
      const cryptoRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${Object.values(COINGECKO_IDS).join(',')}&vs_currencies=aud&include_24hr_change=true`);
      if (cryptoRes.ok) {
        const cd = await cryptoRes.json();
        for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
          if (cd[id]) cryptoPrices[symbol] = { price: cd[id].aud, change24h: cd[id].aud_24h_change || 0 };
        }
        priceCache.crypto = { data: cryptoPrices, timestamp: now };
        console.log(`[CoinGecko] Fetched ${Object.keys(cryptoPrices).length} crypto prices`);
      }
    } catch (e) {
      console.error('[CoinGecko] Error:', e.message);
    }

    // US Stocks via Twelve Data
    const usStockPrices = {};
    const previousUSPrices = priceCache.usStocks.data || {};
    const usStocks = PORTFOLIO.equities.filter(e => e.market === 'US');
    const usSymbols = [...new Set(usStocks.map(e => e.symbol))];
    
    console.log(`[Twelve Data] Fetching ${usSymbols.length} US stocks`);
    
    const firstBatch = usSymbols.slice(0, 8);
    const secondBatch = usSymbols.slice(8);
    
    // Fetch first batch
    if (firstBatch.length > 0) {
      console.log(`[Twelve Data] Fetching first batch: ${firstBatch.length} stocks`);
      for (const symbol of firstBatch) {
        const priceData = await fetchTwelveDataSingle(symbol);
        if (priceData) {
          usStockPrices[symbol] = priceData;
        } else if (previousUSPrices[symbol]) {
          console.log(`  ⟳ ${symbol}: Using cached price from last successful fetch`);
          usStockPrices[symbol] = previousUSPrices[symbol];
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }
    
    // Wait 2 minutes
    if (secondBatch.length > 0) {
      console.log(`[Twelve Data] Waiting 120s (2 minutes) before fetching remaining ${secondBatch.length} stocks...`);
      await new Promise(r => setTimeout(r, 120000));
      
      console.log(`[Twelve Data] Fetching second batch: ${secondBatch.length} stocks`);
      for (const symbol of secondBatch) {
        const priceData = await fetchTwelveDataSingle(symbol);
        if (priceData) {
          usStockPrices[symbol] = priceData;
        } else if (previousUSPrices[symbol]) {
          console.log(`  ⟳ ${symbol}: Using cached price from last successful fetch`);
          usStockPrices[symbol] = previousUSPrices[symbol];
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }
    
    const freshUS = Object.keys(usStockPrices).filter(s => !previousUSPrices[s] || 
      JSON.stringify(usStockPrices[s]) !== JSON.stringify(previousUSPrices[s])).length;
    const cachedUS = Object.keys(usStockPrices).length - freshUS;
    
    priceCache.usStocks = { data: usStockPrices, timestamp: now };
    console.log(`[Twelve Data] Successfully fetched ${Object.keys(usStockPrices).length}/${usSymbols.length} US stocks (${freshUS} fresh, ${cachedUS} from previous cache)`);

    // International Stocks (ASX + HK) via Financial Modeling Prep
    const intlStockPrices = {};
    const previousIntlPrices = priceCache.intlStocks.data || {};
    const intlStocks = PORTFOLIO.equities.filter(e => e.market === 'ASX' || e.market === 'HK');
    const intlSymbols = [...new Set(intlStocks.map(e => e.fmpSymbol).filter(Boolean))];
    
    console.log(`[FMP] ${intlSymbols.length} international stocks configured (ASX + HK)`);
    
    // Separate ASX and HK stocks
    const asxStocks = intlStocks.filter(e => e.market === 'ASX');
    const hkStocks = intlStocks.filter(e => e.market === 'HK');
    const asxSymbols = [...new Set(asxStocks.map(e => e.fmpSymbol).filter(Boolean))];
    const hkSymbols = [...new Set(hkStocks.map(e => e.fmpSymbol).filter(Boolean))];
    
    // Fetch ASX stocks only if ASX market is open
    if (asxSymbols.length > 0) {
      if (shouldFetchMarket('ASX')) {
        console.log(`[FMP] ASX market is OPEN - fetching ${asxSymbols.length} stocks`);
        for (const fmpSymbol of asxSymbols) {
          const equity = asxStocks.find(e => e.fmpSymbol === fmpSymbol);
          const priceData = await fetchFMPQuote(fmpSymbol);
          
          if (priceData) {
            intlStockPrices[equity.symbol] = priceData;
          } else if (previousIntlPrices[equity.symbol]) {
            console.log(`  ⟳ ${equity.symbol}: Using cached price from last successful fetch`);
            intlStockPrices[equity.symbol] = previousIntlPrices[equity.symbol];
          }
          
          await new Promise(r => setTimeout(r, 300)); // Small delay between requests
        }
      } else {
        console.log(`[FMP] ASX market is CLOSED - using cached prices for ${asxSymbols.length} stocks`);
        // Use cached prices for ASX stocks
        for (const stock of asxStocks) {
          if (previousIntlPrices[stock.symbol]) {
            intlStockPrices[stock.symbol] = previousIntlPrices[stock.symbol];
          }
        }
      }
    }
    
    // Fetch HK stocks only if HK market is open
    if (hkSymbols.length > 0) {
      if (shouldFetchMarket('HK')) {
        console.log(`[FMP] HK market is OPEN - fetching ${hkSymbols.length} stocks`);
        for (const fmpSymbol of hkSymbols) {
          const equity = hkStocks.find(e => e.fmpSymbol === fmpSymbol);
          const priceData = await fetchFMPQuote(fmpSymbol);
          
          if (priceData) {
            intlStockPrices[equity.symbol] = priceData;
          } else if (previousIntlPrices[equity.symbol]) {
            console.log(`  ⟳ ${equity.symbol}: Using cached price from last successful fetch`);
            intlStockPrices[equity.symbol] = previousIntlPrices[equity.symbol];
          }
          
          await new Promise(r => setTimeout(r, 300));
        }
      } else {
        console.log(`[FMP] HK market is CLOSED - using cached prices for ${hkSymbols.length} stocks`);
        // Use cached prices for HK stocks
        for (const stock of hkStocks) {
          if (previousIntlPrices[stock.symbol]) {
            intlStockPrices[stock.symbol] = previousIntlPrices[stock.symbol];
          }
        }
      }
    }
    
    const freshIntl = Object.keys(intlStockPrices).filter(s => !previousIntlPrices[s] || 
      JSON.stringify(intlStockPrices[s]) !== JSON.stringify(previousIntlPrices[s])).length;
    const cachedIntl = Object.keys(intlStockPrices).length - freshIntl;
    
    priceCache.intlStocks = { data: intlStockPrices, timestamp: now };
    console.log(`[FMP] Total: ${Object.keys(intlStockPrices).length}/${intlSymbols.length} international stocks (${freshIntl} fresh, ${cachedIntl} cached)`);
    console.log(`[CACHE] Data will be cached for ${CACHE_DURATION / 1000}s (${CACHE_DURATION / 60000} minutes)`);

    // Combine all stock prices
    const allStockPrices = { ...usStockPrices, ...intlStockPrices };

    res.json({ 
      portfolio: PORTFOLIO, 
      cryptoPrices, 
      stockPrices: allStockPrices, 
      exchangeRates, 
      timestamp: new Date().toISOString(),
      cached: false,
      stats: {
        totalEquities: PORTFOLIO.equities.length,
        usEquities: usStocks.length,
        intlEquities: intlStocks.length,
        pricesFetched: Object.keys(allStockPrices).length
      }
    });
  } catch (error) {
    console.error('[API] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ 
  status: 'ok',
  cacheSettings: {
    duration: `${CACHE_DURATION / 1000}s (${CACHE_DURATION / 60000} minutes)`,
    lastUSStockUpdate: priceCache.usStocks.timestamp ? new Date(priceCache.usStocks.timestamp).toISOString() : 'never',
    lastIntlStockUpdate: priceCache.intlStocks.timestamp ? new Date(priceCache.intlStocks.timestamp).toISOString() : 'never',
    lastCryptoUpdate: priceCache.crypto.timestamp ? new Date(priceCache.crypto.timestamp).toISOString() : 'never'
  },
  apiLimits: {
    twelveData: '8 calls/minute, 800 calls/day (free tier)',
    fmp: '250 calls/day (free tier)',
    coinGecko: '50 calls/minute (free tier)'
  },
  marketStatus: getMarketStatus()
}));

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log(`Portfolio API Server running on port ${PORT}`);
  console.log('='.repeat(60));
  console.log(`Cache Duration: ${CACHE_DURATION / 1000}s (${CACHE_DURATION / 60000} minutes)`);
  console.log('API fetching strategy:');
  console.log('  • US Stocks (Twelve Data): 12 stocks');
  console.log('    - First 8 stocks: Immediate fetch');
  console.log('    - Wait 2 minutes');
  console.log('    - Remaining 4 stocks: Fetch after delay');
  console.log('  • ASX/HK Stocks (FMP): 13 stocks');
  console.log('    - Fetched in parallel with US stocks');
  console.log('  • Hold all prices for 30 minutes (cache)');
  console.log('  • Failed fetches: Retain last successful price');
  const usCount = PORTFOLIO.equities.filter(e => e.market === 'US').length;
  const intlCount = PORTFOLIO.equities.filter(e => e.market === 'ASX' || e.market === 'HK').length;
  console.log(`Total: ${usCount} US + ${intlCount} ASX/HK = ${usCount + intlCount} stocks tracked`);
  console.log('='.repeat(60));
});
