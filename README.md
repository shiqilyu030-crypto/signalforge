# SignalForge

SignalForge is a lightweight quantitative signal platform built with FastAPI and Next.js. It ingests Yahoo Finance market data, normalizes daily OHLC prices, computes technical indicators, ranks a broad US equity universe with a transparent multi-factor score, and exposes the results through a product-style dashboard and leaderboard.

Live demo:
- Frontend: [https://signalforge-rose.vercel.app](https://signalforge-rose.vercel.app)
- Backend API: [https://quant-data-platform-api-production.up.railway.app](https://quant-data-platform-api-production.up.railway.app)

## Overview

SignalForge is designed to feel like a small public SaaS product rather than a notebook demo. The app combines:
- ranked signal scanning across a broad US equity universe
- transparent technical scoring built from trend, RSI, and MACD
- a lightweight cached signal pipeline for expensive scanner requests
- strategy backtesting with performance and risk metrics
- a FastAPI backend and Next.js frontend suitable for portfolio presentation

## Architecture

SignalForge follows a simple analytics pipeline:

Yahoo Finance market data  
-> price normalization  
-> indicator engine  
-> signal scoring  
-> backtest metrics  
-> cached scanner result  
-> FastAPI endpoints  
-> Next.js dashboard and signals leaderboard

Core pieces:
- `historical_prices.py`: market data download and OHLC normalization
- `indicators.py`: moving averages, RSI, and MACD calculations
- `backtest.py`: moving-average crossover backtest and performance metrics
- `server.py`: FastAPI routes for prices, indicators, backtests, signals, and strategy summaries
- `universe.py`: broader liquid US equity universe and scanner settings
- `frontend/`: Next.js product UI

## Features

- Broad market scanner across top liquid US equities
- Transparent signal scoring from 0 to 100
- Signal labels: Strong Buy, Buy, Neutral, Weak, Bearish
- Signal explanations and score breakdowns
- Cached `/signals` scanner with refresh metadata and cooldown-based reuse
- Dashboard with price, MA50, RSI, and backtest views
- Risk and performance metrics:
  - cumulative return
  - buy and hold return
  - CAGR
  - Sharpe ratio
  - max drawdown
- Product-style strategy page explaining the model and pipeline

## API Endpoints

- `GET /health`
- `GET /prices/{symbol}`
- `GET /indicators/{symbol}`
- `GET /backtest/{symbol}`
- `GET /strategy/{symbol}`
- `GET /signals`
- `GET /signals/{ticker}`

Example:

```bash
curl https://quant-data-platform-api-production.up.railway.app/signals
```

## Local Development

Backend:

```bash
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 npm run dev
```

Open:
- `http://localhost:3000`
- `http://localhost:3000/dashboard`
- `http://localhost:3000/signals`
- `http://localhost:3000/strategy`

## Deployment

- Frontend: Vercel
- Backend: Railway

Deployment notes:
- the frontend reads the backend base URL from `NEXT_PUBLIC_API_URL`
- the backend uses FastAPI CORS middleware to allow localhost and Vercel origins
- the backend fetches market data from Yahoo Finance at request time and caches expensive universe scans in memory for a short interval
