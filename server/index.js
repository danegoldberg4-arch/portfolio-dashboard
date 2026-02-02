const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Twelve Data API Key (FREE TIER: 8 calls/min, 800 calls/day)
const TWELVE_DATA_API_KEY = 'd9ffb52101194c49afb2a7dba3b691b3';

app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// ============================================================
// PORTFOLIO CONFIGURATION - Edit your holdings here
// ============================================================
const PORTFOLIO = {
  equities: [
    // Stake (ASX) - NO TWELVE DATA SUPPORT
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 7.0831, broker: 'Stake', sector: 'Healthcare', region: 'Australia', type: 'Stock', market: 'ASX' },
    { symbol: 'G200.AX', name: 'Betashares Geared ASX 200', shares: 41.0752, broker: 'Stake', sector: 'Diversified', region: 'Australia', type: 'ETF', market: 'ASX' },
    { symbol: 'GGBL.AX', name: 'Betashares Geared Global', shares: 167.9303, broker: 'Stake', sector: 'Diversified', region: 'Global', type: 'ETF', market: 'ASX' },
    { symbol: 'GNDQ.AX', name: 'Betashares Geared NASDAQ', shares: 111.9889, broker: 'Stake', sector: 'Technology', region: 'USA', type: 'ETF', market: 'ASX' },
    { symbol: 'IAA.AX', name: 'iShares Asia 50', shares: 14.0183, broker: 'Stake', sector: 'Diversified', region: 'Asia', type: 'ETF', market: 'ASX' },
    { symbol: 'NDIA.AX', name: 'Global X India Nifty 50', shares: 13.2013, broker: 'Stake', sector: 'Diversified', region: 'India', type: 'ETF', market: 'ASX' },
    { symbol: 'VEU.AX', name: 'Vanguard All-World ex-US', shares: 17.9115, broker: 'Stake', sector: 'Diversified', region: 'Global ex-US', type: 'ETF', market: 'ASX' },
    { symbol: 'VTS.AX', name: 'Vanguard US Total Market', shares: 2.1512, broker: 'Stake', sector: 'Diversified', region: 'USA', type: 'ETF', market: 'ASX' },
    
    // Webull (US stocks) - TWELVE DATA SUPPORTED
    { symbol: 'TSLA', name: 'Tesla Inc', shares: 8.72, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'UNH', name: 'UnitedHealth Group', shares: 4.2, broker: 'Webull', sector: 'Healthcare', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'SSYS', name: 'Stratasys Ltd', shares: 122, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'GOOG', name: 'Alphabet Inc', shares: 1.85, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'AAPL', name: 'Apple Inc', shares: 1.08, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'AMZN', name: 'Amazon.com', shares: 0.76, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock', market: 'US' },
    
    // CommSec (ASX) - NO TWELVE DATA SUPPORT
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 5, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock', market: 'ASX' },
    { symbol: 'PBH.AX', name: 'Pointsbet Holdings', shares: 88, broker: 'CommSec', sector: 'Consumer Discretionary', region: 'Australia', type: 'Stock', market: 'ASX' },
    { symbol: 'PER.AX', name: 'Percheron Therapeutics', shares: 277222, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock', market: 'ASX' },
    { symbol: 'RZI.AX', name: 'Raiz Invest Ltd', shares: 1305, broker: 'CommSec', sector: 'Financials', region: 'Australia', type: 'Stock', market: 'ASX' },
    
    // IBKR (Multi-market)
    { symbol: 'NVO', name: 'Novo Nordisk', shares: 30, broker: 'IBKR', sector: 'Healthcare', region: 'Europe', type: 'Stock', market: 'US' }, // US ADR
    { symbol: 'BMNR', name: 'Bitdeer Technologies', shares: 57, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'VSNT', name: 'Verisant Inc', shares: 27, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: '9618.HK', name: 'JD.com', shares: 50, broker: 'IBKR', sector: 'Consumer Discretionary', region: 'China', type: 'Stock', market: 'HK' }, // NO TWELVE DATA
    { symbol: 'BBAI', name: 'BigBear.ai', shares: 300, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'SOFI', name: 'SoFi Technologies', shares: 50, broker: 'IBKR', sector: 'Financials', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'ADBE', name: 'Adobe Inc', shares: 3.5196, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', market: 'US' },
    { symbol: 'CBE.AX', name: 'Cobre Ltd', shares: 16200, broker: 'IBKR', sector: 'Materials', region: 'Australia', type: 'Stock', market: 'ASX' },
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
  stocks: { data: {}, timestamp: 0 }, 
  exchangeRates: { data: null, timestamp: 0 } 
};

// CACHE DURATION: 5 minutes = 300000ms
// This means API is pinged at most once every 5 minutes
// With 12 US stocks and ~60s fetch time, this keeps us within limits
const CACHE_DURATION = 300000; // 5 minutes

// Fetch individual stock from Twelve Data (more reliable than batch)
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
    
    // Check cache - API IS PINGED AT MOST ONCE EVERY 2 MINUTES
    if (priceCache.stocks.data && 
        Object.keys(priceCache.stocks.data).length > 0 && 
        now - priceCache.stocks.timestamp < CACHE_DURATION) {
      console.log(`[CACHE] Returning cached data (${Math.floor((now - priceCache.stocks.timestamp) / 1000)}s old)`);
      return res.json({
        portfolio: PORTFOLIO,
        cryptoPrices: priceCache.crypto.data || {},
        stockPrices: priceCache.stocks.data,
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

    // Stocks via Twelve Data - ONLY US STOCKS
    const stockPrices = {};
    
    // Start with previous cache data (fallback for failed fetches)
    const previousPrices = priceCache.stocks.data || {};
    
    // Filter to only US market stocks
    const usStocks = PORTFOLIO.equities.filter(e => e.market === 'US');
    const usSymbols = [...new Set(usStocks.map(e => e.symbol))];
    
    console.log(`[Twelve Data] Fetching ${usSymbols.length} US stocks (ignoring ${PORTFOLIO.equities.length - usStocks.length} non-US stocks)`);
    
    // Twelve Data free tier: 8 API calls per minute
    // Strategy: Fetch 8 stocks, wait 1 minute, fetch remaining stocks
    const firstBatch = usSymbols.slice(0, 8);
    const secondBatch = usSymbols.slice(8);
    
    // Fetch first batch (up to 8 stocks)
    if (firstBatch.length > 0) {
      console.log(`[Twelve Data] Fetching first batch: ${firstBatch.length} stocks`);
      for (const symbol of firstBatch) {
        const priceData = await fetchTwelveDataSingle(symbol);
        if (priceData) {
          stockPrices[symbol] = priceData;
        } else if (previousPrices[symbol]) {
          // Fetch failed, use previous cached price
          console.log(`  ⟳ ${symbol}: Using cached price from last successful fetch`);
          stockPrices[symbol] = previousPrices[symbol];
        }
        // Small delay between individual requests to avoid overwhelming API
        await new Promise(r => setTimeout(r, 300)); // 300ms between each
      }
    }
    
    // If there are more stocks, wait 90 seconds before fetching them
    if (secondBatch.length > 0) {
      console.log(`[Twelve Data] Waiting 90s before fetching remaining ${secondBatch.length} stocks...`);
      await new Promise(r => setTimeout(r, 90000)); // Wait 90 seconds
      
      console.log(`[Twelve Data] Fetching second batch: ${secondBatch.length} stocks`);
      for (const symbol of secondBatch) {
        const priceData = await fetchTwelveDataSingle(symbol);
        if (priceData) {
          stockPrices[symbol] = priceData;
        } else if (previousPrices[symbol]) {
          // Fetch failed, use previous cached price
          console.log(`  ⟳ ${symbol}: Using cached price from last successful fetch`);
          stockPrices[symbol] = previousPrices[symbol];
        }
        await new Promise(r => setTimeout(r, 300)); // 300ms between each
      }
    }
    
    // Count fresh vs cached prices
    const freshPrices = Object.keys(stockPrices).filter(s => !previousPrices[s] || 
      JSON.stringify(stockPrices[s]) !== JSON.stringify(previousPrices[s])).length;
    const cachedPrices = Object.keys(stockPrices).length - freshPrices;
    
    priceCache.stocks = { data: stockPrices, timestamp: now };
    console.log(`[Twelve Data] Successfully fetched ${Object.keys(stockPrices).length}/${usSymbols.length} US stocks (${freshPrices} fresh, ${cachedPrices} from previous cache)`);
    console.log(`[CACHE] Data will be cached for ${CACHE_DURATION / 1000}s (${CACHE_DURATION / 60000} minutes)`);

    res.json({ 
      portfolio: PORTFOLIO, 
      cryptoPrices, 
      stockPrices, 
      exchangeRates, 
      timestamp: new Date().toISOString(),
      cached: false,
      stats: {
        totalEquities: PORTFOLIO.equities.length,
        usEquities: usStocks.length,
        nonUsEquities: PORTFOLIO.equities.length - usStocks.length,
        pricesFetched: Object.keys(stockPrices).length
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
    lastStockUpdate: priceCache.stocks.timestamp ? new Date(priceCache.stocks.timestamp).toISOString() : 'never',
    lastCryptoUpdate: priceCache.crypto.timestamp ? new Date(priceCache.crypto.timestamp).toISOString() : 'never'
  },
  apiLimits: {
    twelveData: '8 calls/minute, 800 calls/day (free tier)',
    coinGecko: '50 calls/minute (free tier)'
  }
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
  console.log('  • First 8 stocks: Immediate fetch');
  console.log('  • Remaining stocks: After 90 second delay');
  console.log('  • Cache expires after 5 minutes');
  console.log('  • Failed fetches: Retain last successful price');
  console.log(`Twelve Data: Fetching ${PORTFOLIO.equities.filter(e => e.market === 'US').length} US stocks only`);
  console.log(`Ignoring: ${PORTFOLIO.equities.filter(e => e.market !== 'US').length} non-US stocks`);
  console.log('='.repeat(60));
});
