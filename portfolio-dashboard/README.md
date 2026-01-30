# 📊 Portfolio Dashboard

A real-time portfolio tracking dashboard for stocks and cryptocurrency. Access from any device with live price updates.

![Dashboard Preview](https://via.placeholder.com/800x400/020617/6366f1?text=Portfolio+Dashboard)

## Features

- **Live Prices**: Real-time stock prices (Yahoo Finance) and crypto prices (CoinGecko)
- **Multi-Platform**: Track holdings across Stake, Webull, IBKR, CommSec, CoinJar, Swyftx, Binance
- **Mobile Optimized**: Responsive design works on phone, tablet, and desktop
- **PWA Support**: Install as an app on your phone's home screen
- **Auto-Refresh**: Prices update every 60 seconds
- **Allocation Charts**: Visualize by asset class, region, and sector
- **Currency Conversion**: Automatic USD/HKD to AUD conversion

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Clone and Install

```bash
# Clone the repo (or download the files)
git clone <your-repo>
cd portfolio-dashboard

# Install dependencies
npm run install:all
```

### 2. Configure Your Holdings

Edit `server/index.js` and update the `PORTFOLIO` object with your actual holdings:

```javascript
const PORTFOLIO = {
  equities: [
    { symbol: 'TSLA', name: 'Tesla', shares: 10, broker: 'Webull', ... },
    // Add your stocks here
  ],
  crypto: [
    { symbol: 'BTC', name: 'Bitcoin', amount: 0.5, broker: 'CoinJar' },
    // Add your crypto here
  ],
  cash: { amount: 100, currency: 'AUD', broker: 'IBKR' }
};
```

### 3. Run Locally

```bash
# Development mode (both server and client)
npm run dev

# Or run separately:
cd server && npm run dev    # Backend on port 3001
cd client && npm start      # Frontend on port 3000
```

Open http://localhost:3000 on your phone (same WiFi network) or computer.

---

## 🚀 Deploy to Cloud (Access Anywhere)

### Option 1: Railway (Recommended - Free Tier)

1. **Create Railway Account**: https://railway.app
2. **Connect GitHub**: Push this code to a GitHub repo
3. **New Project** → **Deploy from GitHub repo**
4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   ```
5. **Deploy**: Railway auto-detects Node.js and deploys

Your app will be live at `https://your-app.railway.app`

### Option 2: Render (Free Tier)

1. **Create Render Account**: https://render.com
2. **New Web Service** → Connect GitHub repo
3. **Settings**:
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm start`
4. **Environment**: Add `NODE_ENV=production`
5. **Deploy**

### Option 3: Vercel + Separate API

**Frontend (Vercel)**:
```bash
cd client
npx vercel
```

**Backend (Railway/Render)**:
Deploy only the `/server` folder, then update `client/src/App.js`:
```javascript
const API_BASE = 'https://your-api-url.railway.app/api';
```

### Option 4: Self-Host (VPS/Raspberry Pi)

```bash
# On your server
git clone <repo>
cd portfolio-dashboard
npm run install:all
npm run build
NODE_ENV=production npm start

# Use PM2 for production
npm install -g pm2
pm2 start server/index.js --name portfolio
pm2 save
pm2 startup
```

---

## 📱 Install as Phone App (PWA)

Once deployed, you can install the dashboard as an app:

**iPhone/iPad**:
1. Open the URL in Safari
2. Tap Share → "Add to Home Screen"
3. Name it and tap Add

**Android**:
1. Open the URL in Chrome
2. Tap menu → "Install app" or "Add to Home screen"

---

## 🔧 Updating Your Holdings

When you buy/sell assets, update the `PORTFOLIO` object in `server/index.js`:

```javascript
// Add a new stock
{ symbol: 'NVDA', name: 'NVIDIA', shares: 5, broker: 'IBKR', sector: 'Technology', region: 'USA', type: 'Stock' },

// Add crypto
{ symbol: 'BTC', name: 'Bitcoin', amount: 0.1, broker: 'Binance' },
```

Then redeploy or restart the server.

---

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/portfolio` | Get portfolio configuration |
| `GET /api/crypto/prices` | Get all crypto prices |
| `GET /api/stocks/prices` | Get all stock prices |
| `GET /api/stock/:symbol` | Get single stock price |
| `GET /api/exchange-rates` | Get currency exchange rates |
| `GET /api/all` | Get everything in one call |
| `GET /api/health` | Health check |

---

## Supported Symbols

### Stocks
- **US**: `TSLA`, `AAPL`, `GOOG`, `AMZN`, etc.
- **ASX**: `CSL.AX`, `BHP.AX`, `CBA.AX`, etc.
- **Hong Kong**: `9618.HK`, `0700.HK`, etc.

### Crypto (via CoinGecko)
- `BTC`, `ETH`, `SOL`, `HYPE`, `ENA`, and more
- Add new coins by updating `COINGECKO_IDS` mapping

---

## Troubleshooting

**Prices not loading?**
- Check if Yahoo Finance/CoinGecko APIs are accessible
- Some stock symbols may need adjustment (e.g., `.AX` suffix for ASX)

**CORS errors?**
- Make sure you're running the backend server
- Check the `proxy` setting in `client/package.json`

**Mobile not connecting?**
- Ensure phone and computer are on same WiFi
- Use your computer's local IP (e.g., `http://192.168.1.x:3000`)

---

## Security Notes

- This dashboard is for personal use
- Don't expose your holdings publicly without authentication
- Consider adding basic auth for cloud deployments:

```javascript
// Add to server/index.js
const basicAuth = require('express-basic-auth');
app.use(basicAuth({
  users: { 'admin': 'your-secure-password' },
  challenge: true
}));
```

---

## License

MIT - Use freely for personal portfolio tracking.

---

## Credits

- Prices: [CoinGecko](https://coingecko.com), [Yahoo Finance](https://finance.yahoo.com)
- Icons: [Lucide](https://lucide.dev)
- Charts: [Recharts](https://recharts.org)
