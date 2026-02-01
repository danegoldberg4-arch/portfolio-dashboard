const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

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
    { symbol: 'CSL.AX', name: 'CSL Ltd', shares: 7.0831, broker: 'Stake', sector: 'Healthcare', region: 'Australia', type: 'Stock' },
    { symbol: 'G200.AX', name: 'Betashares Geared ASX 200', shares: 41.0752, broker: 'Stake', sector: 'Diversified', region: 'Australia', type: 'ETF' },
    { symbol: 'GGBL.AX', name: 'Betashares Geared Global', shares: 167.9303, broker: 'Stake', sector: 'Diversified', region: 'Global', type: 'ETF' },
    { symbol: 'GNDQ.AX', name: 'Betashares Geared NASDAQ', shares: 111.9889, broker: 'Stake', sector: 'Technology', region: 'USA', type: 'ETF' },
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

let priceCache = { crypto: { data: null, timestamp: 0 }, stocks: { data: {}, timestamp: 0 }, exchangeRates: { data: null, timestamp: 0 } };
const CACHE_DURATION = 60000;

// Try multiple Yahoo Finance endpoints
async function fetchYahooStock(symbol) {
  const endpoints = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`
  ];
  
  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': 'https://finance.yahoo.com',
          'Referer': 'https://finance.yahoo.com/'
        }
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        const data = await response.json();
        if (data.chart?.result?.[0]?.meta?.regularMarketPrice) {
          return data.chart.result[0];
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.log(`Yahoo ${symbol}: ${e.message}`);
      }
    }
  }
  return null;
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
    // Exchange rates
    let exchangeRates = { USDAUD: 1.58, HKDAUD: 0.20 };
    try {
      const ratesRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      if (ratesRes.ok) {
        const rd = await ratesRes.json();
        exchangeRates = { USDAUD: rd.rates.AUD, HKDAUD: rd.rates.AUD / rd.rates.HKD };
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
      }
    } catch (e) { console.error('Crypto error:', e.message); }

    // Stocks
    const stockPrices = {};
    const symbols = [...new Set(PORTFOLIO.equities.map(e => e.symbol))];
    
    for (const symbol of symbols) {
      const result = await fetchYahooStock(symbol);
      if (result) {
        const m = result.meta;
        const prev = m.chartPreviousClose || m.previousClose || m.regularMarketPrice;
        const curr = m.regularMarketPrice;
        stockPrices[symbol] = {
          price: curr,
          previousClose: prev,
          change24h: prev ? ((curr - prev) / prev) * 100 : 0,
          changeValue: curr - prev,
          currency: m.currency
        };
      }
      await new Promise(r => setTimeout(r, 100));
    }

    res.json({ portfolio: PORTFOLIO, cryptoPrices, stockPrices, exchangeRates, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/build', 'index.html')));
}

app.listen(PORT, () => console.log(`Portfolio API on port ${PORT}`));
