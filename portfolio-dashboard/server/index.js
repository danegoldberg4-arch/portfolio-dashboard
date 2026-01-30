const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// ============================================================
// PORTFOLIO CONFIGURATION
// Edit your holdings here - this is your source of truth
// ============================================================
const PORTFOLIO = {
  equities: [
    // Stake (ASX)
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 7.0831, broker: 'Stake', sector: 'Healthcare', region: 'Australia', type: 'Stock' },
    { symbol: 'G200.AX', name: 'Betashares Geared ASX 200', shares: 41.0752, broker: 'Stake', sector: 'Diversified', region: 'Australia', type: 'Leveraged ETF' },
    { symbol: 'GGBL.AX', name: 'Betashares Geared Global', shares: 167.9303, broker: 'Stake', sector: 'Diversified', region: 'Global', type: 'Leveraged ETF' },
    { symbol: 'GNDQ.AX', name: 'Betashares Geared NASDAQ', shares: 111.9889, broker: 'Stake', sector: 'Technology', region: 'USA', type: 'Leveraged ETF' },
    { symbol: 'IAA.AX', name: 'iShares Asia 50', shares: 14.0183, broker: 'Stake', sector: 'Diversified', region: 'Asia', type: 'ETF' },
    { symbol: 'NDIA.AX', name: 'Global X India Nifty 50', shares: 13.2013, broker: 'Stake', sector: 'Diversified', region: 'India', type: 'ETF' },
    { symbol: 'VEU.AX', name: 'Vanguard All-World ex-US', shares: 17.9115, broker: 'Stake', sector: 'Diversified', region: 'Global ex-US', type: 'ETF' },
    { symbol: 'VTS.AX', name: 'Vanguard US Total Market', shares: 2.1512, broker: 'Stake', sector: 'Diversified', region: 'USA', type: 'ETF' },
    // Webull (US stocks)
    { symbol: 'TSLA', name: 'Tesla Inc', shares: 8.72, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock' },
    { symbol: 'UNH', name: 'UnitedHealth Group', shares: 4.2, broker: 'Webull', sector: 'Healthcare', region: 'USA', type: 'Stock' },
    { symbol: 'SSYS', name: 'Stratasys Ltd', shares: 122, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: 'GOOG', name: 'Alphabet Inc', shares: 1.85, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: 'AAPL', name: 'Apple Inc', shares: 1.08, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: 'AMZN', name: 'Amazon.com', shares: 0.76, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock' },
    // CommSec (ASX)
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 5, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock' },
    { symbol: 'PBH.AX', name: 'Pointsbet Holdings', shares: 88, broker: 'CommSec', sector: 'Consumer Discretionary', region: 'Australia', type: 'Stock' },
    { symbol: 'PER.AX', name: 'Percheron Therapeutics', shares: 277222, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock' },
    { symbol: 'RZI.AX', name: 'Raiz Invest Ltd', shares: 1305, broker: 'CommSec', sector: 'Financials', region: 'Australia', type: 'Stock' },
    // IBKR (Multi-market)
    { symbol: 'NVO', name: 'Novo Nordisk', shares: 30, broker: 'IBKR', sector: 'Healthcare', region: 'Europe', type: 'Stock' },
    { symbol: 'BMNR', name: 'Bitdeer Technologies', shares: 57, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: 'VSNT', name: 'Verisant Inc', shares: 27, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: '9618.HK', name: 'JD.com', shares: 50, broker: 'IBKR', sector: 'Consumer Discretionary', region: 'China', type: 'Stock' },
    { symbol: 'BBAI', name: 'BigBear.ai', shares: 300, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: 'SOFI', name: 'SoFi Technologies', shares: 50, broker: 'IBKR', sector: 'Financials', region: 'USA', type: 'Stock' },
    { symbol: 'ADBE', name: 'Adobe Inc', shares: 3.5196, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock' },
    { symbol: 'CBE.AX', name: 'Cobre Ltd', shares: 16200, broker: 'IBKR', sector: 'Materials', region: 'Australia', type: 'Stock' },
  ],
  crypto: [
    // CoinJar
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.04012328, broker: 'CoinJar' },
    { symbol: 'ETH', name: 'Ethereum', amount: 0.333179644, broker: 'CoinJar' },
    // Swyftx
    { symbol: 'HYPE', name: 'Hyperliquid', amount: 33.4543, broker: 'Swyftx' },
    { symbol: 'ENA', name: 'Ethena', amount: 1970, broker: 'Swyftx' },
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.00013964, broker: 'Swyftx' },
    // Binance
    { symbol: 'ETH', name: 'Ethereum', amount: 1.17749667, broker: 'Binance' },
    { symbol: 'SOL', name: 'Solana', amount: 3.7019398, broker: 'Binance' },
    { symbol: 'DGC', name: 'DecentralGPT', amount: 20111144.9557, broker: 'Binance' },
  ],
  cash: { amount: 89.33, currency: 'AUD', broker: 'IBKR' }
};

// CoinGecko ID mapping
const COINGECKO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'HYPE': 'hyperliquid',
  'ENA': 'ethena',
  'DGC': 'decentralgpt'
};

// Cache for API responses (reduces API calls)
let priceCache = {
  crypto: { data: null, timestamp: 0 },
  stocks: { data: {}, timestamp: 0 },
  exchangeRates: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 60000; // 1 minute cache

// ============================================================
// API ENDPOINTS
// ============================================================

// Get portfolio configuration
app.get('/api/portfolio', (req, res) => {
  res.json(PORTFOLIO);
});

// Fetch crypto prices from CoinGecko
app.get('/api/crypto/prices', async (req, res) => {
  try {
    // Check cache
    if (priceCache.crypto.data && Date.now() - priceCache.crypto.timestamp < CACHE_DURATION) {
      return res.json(priceCache.crypto.data);
    }

    const ids = Object.values(COINGECKO_IDS).join(',');
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=aud,usd&include_24hr_change=true&include_market_cap=true`
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform to symbol-based lookup
    const prices = {};
    for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
      if (data[id]) {
        prices[symbol] = {
          price: data[id].aud,
          priceUSD: data[id].usd,
          change24h: data[id].aud_24h_change || 0,
          marketCap: data[id].aud_market_cap
        };
      }
    }
    
    // Update cache
    priceCache.crypto = { data: prices, timestamp: Date.now() };
    
    res.json(prices);
  } catch (error) {
    console.error('Crypto price fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch stock price from Yahoo Finance
app.get('/api/stock/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Check cache
    if (priceCache.stocks.data[symbol] && Date.now() - priceCache.stocks.timestamp < CACHE_DURATION) {
      return res.json(priceCache.stocks.data[symbol]);
    }

    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }
    
    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result) {
      throw new Error('No data returned for symbol');
    }
    
    const meta = result.meta;
    const previousClose = meta.chartPreviousClose || meta.previousClose;
    const currentPrice = meta.regularMarketPrice;
    const change = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
    
    const priceData = {
      symbol,
      price: currentPrice,
      previousClose,
      change24h: change,
      currency: meta.currency,
      exchange: meta.exchangeName,
      marketState: meta.marketState
    };
    
    // Update cache
    priceCache.stocks.data[symbol] = priceData;
    priceCache.stocks.timestamp = Date.now();
    
    res.json(priceData);
  } catch (error) {
    console.error(`Stock price fetch error for ${req.params.symbol}:`, error);
    res.status(500).json({ error: error.message, symbol: req.params.symbol });
  }
});

// Fetch all stock prices in batch
app.get('/api/stocks/prices', async (req, res) => {
  try {
    const symbols = [...new Set(PORTFOLIO.equities.map(e => e.symbol))];
    const prices = {};
    
    // Fetch in parallel with rate limiting
    const batchSize = 5;
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      const promises = batch.map(async (symbol) => {
        try {
          // Check cache first
          if (priceCache.stocks.data[symbol] && Date.now() - priceCache.stocks.timestamp < CACHE_DURATION) {
            return { symbol, data: priceCache.stocks.data[symbol] };
          }
          
          const response = await fetch(
            `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`,
            {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            }
          );
          
          if (!response.ok) return { symbol, data: null };
          
          const data = await response.json();
          const result = data.chart?.result?.[0];
          if (!result) return { symbol, data: null };
          
          const meta = result.meta;
          const previousClose = meta.chartPreviousClose || meta.previousClose;
          const currentPrice = meta.regularMarketPrice;
          const change = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
          
          return {
            symbol,
            data: {
              price: currentPrice,
              previousClose,
              change24h: change,
              currency: meta.currency,
              exchange: meta.exchangeName
            }
          };
        } catch (err) {
          console.error(`Error fetching ${symbol}:`, err.message);
          return { symbol, data: null };
        }
      });
      
      const results = await Promise.all(promises);
      results.forEach(({ symbol, data }) => {
        if (data) {
          prices[symbol] = data;
          priceCache.stocks.data[symbol] = data;
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    priceCache.stocks.timestamp = Date.now();
    res.json(prices);
  } catch (error) {
    console.error('Batch stock price fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch exchange rates
app.get('/api/exchange-rates', async (req, res) => {
  try {
    // Check cache
    if (priceCache.exchangeRates.data && Date.now() - priceCache.exchangeRates.timestamp < CACHE_DURATION * 5) {
      return res.json(priceCache.exchangeRates.data);
    }

    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    
    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const rates = {
      USDAUD: data.rates.AUD,
      HKDAUD: data.rates.AUD / data.rates.HKD,
      EURAUD: data.rates.AUD / data.rates.EUR,
      GBPAUD: data.rates.AUD / data.rates.GBP,
      timestamp: new Date().toISOString()
    };
    
    // Update cache
    priceCache.exchangeRates = { data: rates, timestamp: Date.now() };
    
    res.json(rates);
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    // Return fallback rates
    res.json({
      USDAUD: 1.55,
      HKDAUD: 0.20,
      EURAUD: 1.65,
      GBPAUD: 1.95,
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// Get all data in one call (for mobile efficiency)
app.get('/api/all', async (req, res) => {
  try {
    // Fetch all data in parallel
    const [cryptoRes, stocksRes, ratesRes] = await Promise.all([
      fetch(`http://localhost:${PORT}/api/crypto/prices`).then(r => r.json()).catch(() => ({})),
      fetch(`http://localhost:${PORT}/api/stocks/prices`).then(r => r.json()).catch(() => ({})),
      fetch(`http://localhost:${PORT}/api/exchange-rates`).then(r => r.json()).catch(() => ({ USDAUD: 1.55, HKDAUD: 0.20 }))
    ]);
    
    res.json({
      portfolio: PORTFOLIO,
      cryptoPrices: cryptoRes,
      stockPrices: stocksRes,
      exchangeRates: ratesRes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching all data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: {
      crypto: priceCache.crypto.timestamp ? new Date(priceCache.crypto.timestamp).toISOString() : null,
      stocks: priceCache.stocks.timestamp ? new Date(priceCache.stocks.timestamp).toISOString() : null,
      exchangeRates: priceCache.exchangeRates.timestamp ? new Date(priceCache.exchangeRates.timestamp).toISOString() : null
    }
  });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Portfolio API server running on port ${PORT}`);
  console.log(`📊 Endpoints:`);
  console.log(`   GET /api/portfolio - Get portfolio configuration`);
  console.log(`   GET /api/crypto/prices - Get crypto prices`);
  console.log(`   GET /api/stocks/prices - Get all stock prices`);
  console.log(`   GET /api/stock/:symbol - Get single stock price`);
  console.log(`   GET /api/exchange-rates - Get exchange rates`);
  console.log(`   GET /api/all - Get all data in one call`);
  console.log(`   GET /api/health - Health check`);
});

module.exports = app;
