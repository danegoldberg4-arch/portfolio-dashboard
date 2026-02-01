const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Twelve Data API Key
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
    // Stake (ASX)
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 7.0831, broker: 'Stake', sector: 'Healthcare', region: 'Australia', type: 'Stock', twelveSymbol: 'CSL:ASX' },
    { symbol: 'G200.AX', name: 'Betashares Geared ASX 200', shares: 41.0752, broker: 'Stake', sector: 'Diversified', region: 'Australia', type: 'ETF', twelveSymbol: 'G200:ASX' },
    { symbol: 'GGBL.AX', name: 'Betashares Geared Global', shares: 167.9303, broker: 'Stake', sector: 'Diversified', region: 'Global', type: 'ETF', twelveSymbol: 'GGBL:ASX' },
    { symbol: 'GNDQ.AX', name: 'Betashares Geared NASDAQ', shares: 111.9889, broker: 'Stake', sector: 'Technology', region: 'USA', type: 'ETF', twelveSymbol: 'GNDQ:ASX' },
    { symbol: 'IAA.AX', name: 'iShares Asia 50', shares: 14.0183, broker: 'Stake', sector: 'Diversified', region: 'Asia', type: 'ETF', twelveSymbol: 'IAA:ASX' },
    { symbol: 'NDIA.AX', name: 'Global X India Nifty 50', shares: 13.2013, broker: 'Stake', sector: 'Diversified', region: 'India', type: 'ETF', twelveSymbol: 'NDIA:ASX' },
    { symbol: 'VEU.AX', name: 'Vanguard All-World ex-US', shares: 17.9115, broker: 'Stake', sector: 'Diversified', region: 'Global ex-US', type: 'ETF', twelveSymbol: 'VEU:ASX' },
    { symbol: 'VTS.AX', name: 'Vanguard US Total Market', shares: 2.1512, broker: 'Stake', sector: 'Diversified', region: 'USA', type: 'ETF', twelveSymbol: 'VTS:ASX' },
    // Webull (US stocks)
    { symbol: 'TSLA', name: 'Tesla Inc', shares: 8.72, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock', twelveSymbol: 'TSLA' },
    { symbol: 'UNH', name: 'UnitedHealth Group', shares: 4.2, broker: 'Webull', sector: 'Healthcare', region: 'USA', type: 'Stock', twelveSymbol: 'UNH' },
    { symbol: 'SSYS', name: 'Stratasys Ltd', shares: 122, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'SSYS' },
    { symbol: 'GOOG', name: 'Alphabet Inc', shares: 1.85, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'GOOG' },
    { symbol: 'AAPL', name: 'Apple Inc', shares: 1.08, broker: 'Webull', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'AAPL' },
    { symbol: 'AMZN', name: 'Amazon.com', shares: 0.76, broker: 'Webull', sector: 'Consumer Discretionary', region: 'USA', type: 'Stock', twelveSymbol: 'AMZN' },
    // CommSec (ASX)
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 5, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock', twelveSymbol: 'CSL:ASX' },
    { symbol: 'PBH.AX', name: 'Pointsbet Holdings', shares: 88, broker: 'CommSec', sector: 'Consumer Discretionary', region: 'Australia', type: 'Stock', twelveSymbol: 'PBH:ASX' },
    { symbol: 'PER.AX', name: 'Percheron Therapeutics', shares: 277222, broker: 'CommSec', sector: 'Healthcare', region: 'Australia', type: 'Stock', twelveSymbol: 'PER:ASX' },
    { symbol: 'RZI.AX', name: 'Raiz Invest Ltd', shares: 1305, broker: 'CommSec', sector: 'Financials', region: 'Australia', type: 'Stock', twelveSymbol: 'RZI:ASX' },
    // IBKR (Multi-market)
    { symbol: 'NVO', name: 'Novo Nordisk', shares: 30, broker: 'IBKR', sector: 'Healthcare', region: 'Europe', type: 'Stock', twelveSymbol: 'NVO' },
    { symbol: 'BMNR', name: 'Bitdeer Technologies', shares: 57, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'BMNR' },
    { symbol: 'VSNT', name: 'Verisant Inc', shares: 27, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'VSNT' },
    { symbol: '9618.HK', name: 'JD.com', shares: 50, broker: 'IBKR', sector: 'Consumer Discretionary', region: 'China', type: 'Stock', twelveSymbol: '9618:HKEX' },
    { symbol: 'BBAI', name: 'BigBear.ai', shares: 300, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'BBAI' },
    { symbol: 'SOFI', name: 'SoFi Technologies', shares: 50, broker: 'IBKR', sector: 'Financials', region: 'USA', type: 'Stock', twelveSymbol: 'SOFI' },
    { symbol: 'ADBE', name: 'Adobe Inc', shares: 3.5196, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock', twelveSymbol: 'ADBE' },
    { symbol: 'CBE.AX', name: 'Cobre Ltd', shares: 16200, broker: 'IBKR', sector: 'Materials', region: 'Australia', type: 'Stock', twelveSymbol: 'CBE:ASX' },
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
const CACHE_DURATION = 120000; // 2 minutes to save API calls

// Batch fetch multiple stocks from Twelve Data
async function fetchTwelveDataBatch(symbols) {
  try {
    const symbolsStr = symbols.join(',');
    const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolsStr)}&apikey=${TWELVE_DATA_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return {};
    
    const data = await response.json();
    const results = {};
    
    // Handle single vs multiple results
    if (symbols.length === 1) {
      if (data.close) {
        const currentPrice = parseFloat(data.close);
        const previousClose = parseFloat(data.previous_close);
        results[symbols[0]] = {
          price: currentPrice,
          previousClose: previousClose,
          change24h: parseFloat(data.percent_change) || 0,
          changeValue: parseFloat(data.change) || 0,
          currency: data.currency || 'USD'
        };
      }
    } else {
      for (const symbol of symbols) {
        const stockData = data[symbol];
        if (stockData && stockData.close) {
          const currentPrice = parseFloat(stockData.close);
          const previousClose = parseFloat(stockData.previous_close);
          results[symbol] = {
            price: currentPrice,
            previousClose: previousClose,
            change24h: parseFloat(stockData.percent_change) || 0,
            changeValue: parseFloat(stockData.change) || 0,
            currency: stockData.currency || 'USD'
          };
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Twelve Data batch error:', error.message);
    return {};
  }
}

app.get('/api/portfolio', (req, res) => res.json(PORTFOLIO));

app.get('/api/crypto/prices', async (req, res) => {
  try {
    if (priceCache.crypto.data && Date.now() - priceCache.crypto.timestamp < CACHE_DURATION) {
      return res.json(priceCache.crypto.data);
    }
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
    if (priceCache.stocks.data && 
        Object.keys(priceCache.stocks.data).length > 0 && 
        now - priceCache.stocks.timestamp < CACHE_DURATION) {
      return res.json({
        portfolio: PORTFOLIO,
        cryptoPrices: priceCache.crypto.data || {},
        stockPrices: priceCache.stocks.data,
        exchangeRates: priceCache.exchangeRates.data || { USDAUD: 1.58, HKDAUD: 0.20 },
        timestamp: new Date().toISOString(),
        cached: true
      });
    }

    // Exchange rates
    let exchangeRates = { USDAUD: 1.58, HKDAUD: 0.20 };
    try {
      const ratesRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (ratesRes.ok) {
        const rd = await ratesRes.json();
        exchangeRates = { USDAUD: rd.rates.AUD, HKDAUD: rd.rates.AUD / rd.rates.HKD };
        priceCache.exchangeRates = { data: exchangeRates, timestamp: now };
      }
    } catch (e) {}

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
      }
    } catch (e) {}

    // Stocks via Twelve Data
    const stockPrices = {};
    const twelveSymbols = [...new Set(PORTFOLIO.equities.map(e => e.twelveSymbol).filter(Boolean))];
    
    console.log(`Fetching ${twelveSymbols.length} stocks from Twelve Data...`);
    
    // Batch into groups of 8
    const batchSize = 8;
    for (let i = 0; i < twelveSymbols.length; i += batchSize) {
      const batch = twelveSymbols.slice(i, i + batchSize);
      const batchResults = await fetchTwelveDataBatch(batch);
      
      for (const [twelveSymbol, priceData] of Object.entries(batchResults)) {
        const equity = PORTFOLIO.equities.find(e => e.twelveSymbol === twelveSymbol);
        if (equity && priceData) {
          stockPrices[equity.symbol] = priceData;
          console.log(`✓ ${equity.symbol}: $${priceData.price} (${priceData.change24h.toFixed(2)}%)`);
        }
      }
      
      if (i + batchSize < twelveSymbols.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    priceCache.stocks = { data: stockPrices, timestamp: now };
    console.log(`Fetched ${Object.keys(stockPrices).length}/${twelveSymbols.length} stocks`);

    res.json({ portfolio: PORTFOLIO, cryptoPrices, stockPrices, exchangeRates, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}

app.listen(PORT, () => console.log(`Portfolio API on port ${PORT}`));