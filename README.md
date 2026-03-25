# SignalForge

SignalForge is a full-stack quantitative signal platform that scans a universe of US equities, computes technical indicators, and ranks trading setups using a transparent multi-factor scoring model.

The system integrates market data ingestion, indicator computation, signal ranking, and interactive visualization into a single web platform.

**Live Demo**  
https://signalforge-rose.vercel.app/

---

# Overview

SignalForge scans a broad universe of liquid US equities and identifies potential trading opportunities using a multi-factor signal model.

The platform:

- retrieves market data from Yahoo Finance  
- computes technical indicators such as RSI, MACD, and moving averages  
- generates ranked signals based on a scoring engine  
- visualizes results through an interactive dashboard  

The application is designed as a full-stack analytics product combining data engineering, backend APIs, and modern frontend visualization.

---

# Features

## Market Signal Scanner

Scans a broad universe of US equities and ranks the strongest setups based on technical signals.

Features include:

- signal leaderboard across ~100 liquid US equities  
- multi-factor signal scoring model  
- real-time signal ranking table  
- sparkline trend visualization for each asset  

---

## Signal Dashboard

Interactive dashboard for deeper signal inspection.

Metrics include:

- latest price  
- signal score  
- RSI  
- MACD  
- trend classification  
- strategy performance metrics such as CAGR, Sharpe ratio, and max drawdown  

Users can navigate from the signal leaderboard directly to the dashboard for a selected symbol.

---

## Strategy Transparency

The platform exposes the signal model components so users can understand how signals are generated.

Scoring factors include:

- trend strength  
- RSI positioning  
- MACD confirmation  
- momentum context  

This design emphasizes interpretability rather than black-box predictions.

---

## Lightweight Data Pipeline

SignalForge implements a lightweight signal pipeline:


Yahoo Finance
→ price normalization
→ indicator engine
→ signal scoring
→ cached scanner results
→ FastAPI endpoints
→ frontend visualization


To improve stability and performance, signal scans are cached and reused across requests instead of recomputing the full universe each time.

---

## Signal Filtering

The signal leaderboard supports lightweight filtering similar to a market screener.

Users can filter signals by:

- score thresholds  
- RSI conditions  
- trend direction  

This enables quick exploration of potential setups.

---

# Architecture

SignalForge follows a simple full-stack architecture.

## Frontend

- Next.js  
- React  
- TypeScript  
- Tailwind CSS  

## Backend

- FastAPI  
- Python  
- Pandas  
- NumPy  

## Data

- Yahoo Finance market data  
- technical indicator computation  
- signal scoring engine  

## Deployment

- Vercel — frontend hosting  
- Railway — backend API deployment  

---

# API Endpoints

## Signals


GET /signals


Returns ranked signal results across the equity universe.

Response includes:

- ticker  
- price  
- signal score  
- RSI  
- MACD  
- trend  
- sparkline price series  

Signals are served from a cached scan to avoid recomputing the entire universe on every request.

---

## Price History


GET /prices/{symbol}


Returns historical OHLC data for the requested symbol.

Used by the dashboard to render charts and performance metrics.

---

## Strategy Analysis


GET /strategy/{symbol}


Returns indicator data and signal explanation for a selected asset.

---

## Backtest


GET /backtest/{symbol}


Returns strategy performance metrics and comparison with buy-and-hold.

---

# Local Development

Clone the repository


git clone https://github.com/shiqilyu030-crypto/signalforge.git

cd signalforge


Start backend


pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8000


Start frontend


cd frontend
npm install
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
 npm run dev


Open in browser


http://localhost:3000


---

# Project Motivation

SignalForge was built as a full-stack data analytics project combining financial data engineering, backend API design, and interactive frontend visualization.

The goal was to create a transparent signal discovery platform that demonstrates:

- data ingestion and processing pipelines  
- technical indicator modeling  
- signal ranking logic  
- production-style API design  
- modern web data visualization  

---

# Future Improvements

Potential future enhancements include:

- scheduled daily data pipelines  
- persistent signal storage  
- expanded equity universe (S&P 500)  
- advanced factor models  
- portfolio backtesting tools  
