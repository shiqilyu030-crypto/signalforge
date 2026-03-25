"""FastAPI backend for price data, indicators, and backtest results."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backtest import backtest_moving_average_crossover, summarize_backtest
from historical_prices import fetch_historical_prices
from indicators import add_macd, add_moving_averages, add_rsi

app = FastAPI(
    title="SignalForge API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://signalforge.vercel.app",
        "https://signalforge-git-main-shiqilyu030-cryptos-projects.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def normalize_value(value: Any) -> Any:
    """Convert pandas, decimal, and NumPy values into JSON-friendly primitives."""
    if pd.isna(value):
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "item"):
        return value.item()
    return value


def dataframe_to_records(dataframe: pd.DataFrame) -> list[dict[str, Any]]:
    """Convert a DataFrame into JSON-serializable records."""
    return [
        {key: normalize_value(value) for key, value in row.items()}
        for row in dataframe.to_dict(orient="records")
    ]


def parse_date(value: Optional[str], field_name: str) -> Optional[date]:
    """Parse an ISO date string into a date object."""
    if value is None:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid {field_name}. Expected YYYY-MM-DD.",
        ) from exc


def resolve_date_range(
    start: Optional[str],
    end: Optional[str],
    period: str,
) -> Tuple[Optional[date], Optional[date]]:
    """Resolve start and end dates using explicit dates or a Yahoo-style period."""
    start_date = parse_date(start, "start")
    end_date = parse_date(end, "end")

    if start_date or end_date:
        return start_date, end_date

    if period == "max":
        return None, None

    today = pd.Timestamp.utcnow().normalize().date()
    offsets: Dict[str, pd.DateOffset] = {
        "5d": pd.DateOffset(days=5),
        "1mo": pd.DateOffset(months=1),
        "3mo": pd.DateOffset(months=3),
        "6mo": pd.DateOffset(months=6),
        "1y": pd.DateOffset(years=1),
        "2y": pd.DateOffset(years=2),
        "5y": pd.DateOffset(years=5),
        "10y": pd.DateOffset(years=10),
    }
    offset = offsets.get(period)
    if offset is None:
        raise HTTPException(status_code=400, detail=f"Unsupported period '{period}'.")

    resolved_start = (pd.Timestamp(today) - offset).date()
    return resolved_start, today


def validate_interval(interval: str) -> None:
    """Ensure requests use the daily granularity supported by the API."""
    if interval != "1d":
        raise HTTPException(
            status_code=400,
            detail="Only interval=1d is currently supported.",
        )


def ensure_price_data(
    symbol: str,
    start: Optional[str],
    end: Optional[str],
    period: str,
    interval: str,
) -> Tuple[pd.DataFrame, str]:
    """Fetch price data directly from Yahoo Finance."""
    validate_interval(interval)
    normalized_symbol = symbol.upper()

    try:
        dataframe = fetch_historical_prices(
            symbol=normalized_symbol,
            start=start,
            end=end,
            period=period,
            interval=interval,
            save_to_csv=False,
        )
    except ValueError as exc:
        detail = f"SignalForge could not find price data for {normalized_symbol}. {exc}"
        raise HTTPException(status_code=404, detail=detail) from exc
    except Exception as exc:  # pragma: no cover
        detail = (
            f"SignalForge could not load data for {normalized_symbol} from Yahoo Finance. "
            f"Original error: {exc}"
        )
        raise HTTPException(status_code=500, detail=detail) from exc

    if dataframe.empty:
        raise HTTPException(status_code=404, detail=f"No price data is available for {normalized_symbol}.")

    start_date, end_date = resolve_date_range(start=start, end=end, period=period)
    if start_date is not None:
        dataframe = dataframe[dataframe["Date"].dt.date >= start_date]
    if end_date is not None:
        dataframe = dataframe[dataframe["Date"].dt.date <= end_date]
    dataframe = dataframe.sort_values("Date").reset_index(drop=True)
    return dataframe, "yahoo_finance"


def calculate_indicator_dataframe(
    dataframe: pd.DataFrame,
    short_window: int,
    long_window: int,
) -> pd.DataFrame:
    """Apply technical indicators to an in-memory price DataFrame."""
    result = add_moving_averages(
        dataframe=dataframe,
        price_column="Close",
        short_window=short_window,
        long_window=long_window,
    )
    result = add_rsi(result, price_column="Close")
    result = add_macd(result, price_column="Close")
    return result


def build_strategy_summary(
    symbol: str,
    indicators_df: pd.DataFrame,
    backtest_df: pd.DataFrame,
) -> Dict[str, Any]:
    """Build a scored, rule-based summary from indicator and backtest data."""
    latest = indicators_df.iloc[-1]
    previous = indicators_df.iloc[-2] if len(indicators_df) > 1 else latest
    latest_backtest = backtest_df.iloc[-1]

    close_price = float(latest["Close"])
    ma5 = latest.get("MA5")
    ma20 = latest.get("MA20")
    rsi = latest.get("RSI")
    macd = latest.get("MACD")
    macd_signal = latest.get("MACDSignal")
    cumulative_strategy = latest_backtest.get("CumulativeStrategyReturn")
    cumulative_curve = backtest_df.get("CumulativeStrategyReturn")
    previous_macd = previous.get("MACD")

    score = 50.0
    trend_points = 0
    momentum_points = 0
    drawdown_points = 0

    if pd.notna(ma5):
        if close_price > ma5:
            score += 8
            trend_points += 1
        else:
            score -= 8
            trend_points -= 1

    if pd.notna(ma20):
        if close_price > ma20:
            score += 14
            trend_points += 2
        else:
            score -= 14
            trend_points -= 2

    if pd.notna(ma5) and pd.notna(ma20):
        if ma5 > ma20:
            score += 16
            trend_points += 2
        else:
            score -= 16
            trend_points -= 2

    if pd.notna(rsi):
        if rsi >= 68:
            score += 8
            momentum_points += 2
        elif rsi >= 58:
            score += 6
            momentum_points += 1
        elif rsi >= 48:
            score += 1
        elif rsi >= 38:
            score -= 6
            momentum_points -= 1
        else:
            score -= 9
            momentum_points -= 2

    if pd.notna(macd):
        if macd > 0:
            score += 8
            momentum_points += 1
        else:
            score -= 8
            momentum_points -= 1

    if pd.notna(macd) and pd.notna(macd_signal):
        if macd > macd_signal:
            score += 8
            momentum_points += 1
        else:
            score -= 8
            momentum_points -= 1

    if pd.notna(macd) and pd.notna(previous_macd):
        macd_slope = macd - previous_macd
        if macd_slope > 0:
            score += 6
            momentum_points += 1
        elif macd_slope < 0:
            score -= 6
            momentum_points -= 1

    if pd.notna(cumulative_strategy):
        if cumulative_strategy >= 1.18:
            score += 10
        elif cumulative_strategy >= 1.08:
            score += 6
        elif cumulative_strategy >= 1.0:
            score += 2
        elif cumulative_strategy >= 0.92:
            score -= 4
        else:
            score -= 8

    if cumulative_curve is not None and not cumulative_curve.dropna().empty:
        running_peak = cumulative_curve.cummax()
        current_drawdown = float((cumulative_curve.iloc[-1] / running_peak.iloc[-1]) - 1)
        if current_drawdown >= -0.03:
            score += 6
            drawdown_points += 2
        elif current_drawdown >= -0.08:
            score += 2
            drawdown_points += 1
        elif current_drawdown >= -0.15:
            score -= 4
            drawdown_points -= 1
        else:
            score -= 8
            drawdown_points -= 2

    score = max(0, min(100, round(score)))

    trend_score = trend_points
    if trend_score >= 4:
        trend = "Bullish"
    elif trend_score >= 2:
        trend = "Positive"
    elif trend_score <= -4:
        trend = "Bearish"
    elif trend_score <= -2:
        trend = "Soft"
    else:
        trend = "Neutral"

    momentum_score = momentum_points + drawdown_points
    if momentum_score >= 4:
        momentum = "Strong"
    elif momentum_score >= 2:
        momentum = "Improving"
    elif momentum_score <= -4:
        momentum = "Weak"
    elif momentum_score <= -2:
        momentum = "Fading"
    else:
        momentum = "Balanced"

    if score >= 80:
        signal = "High Conviction"
    elif score >= 65:
        signal = "Constructive"
    elif score >= 50:
        signal = "Watch"
    elif score >= 35:
        signal = "Cautious"
    else:
        signal = "Defensive"

    confidence_distance = abs(score - 50)
    if confidence_distance >= 28:
        confidence = "High"
    elif confidence_distance >= 14:
        confidence = "Medium"
    else:
        confidence = "Low"

    trend_phrase = {
        "Bullish": "trading above both its short- and longer-term averages",
        "Positive": "showing a modest positive trend",
        "Neutral": "moving without a strong directional edge",
        "Soft": "leaning below its stronger trend levels",
        "Bearish": "trading below key moving averages",
    }[trend]
    momentum_phrase = {
        "Strong": "Momentum is pushing in the same direction.",
        "Improving": "Momentum is improving.",
        "Balanced": "Momentum is mixed.",
        "Fading": "Momentum is fading.",
        "Weak": "Momentum remains weak.",
    }[momentum]
    signal_phrase = {
        "High Conviction": "This looks like one of the stronger rule-based setups in the group.",
        "Constructive": "The setup looks constructive right now.",
        "Watch": "This looks more like a watchlist name than a decisive setup.",
        "Cautious": "The setup calls for caution right now.",
        "Defensive": "The rule-based model is clearly defensive on this name right now.",
    }[signal]

    summary = (
        f"{symbol.upper()} is {trend_phrase}. {momentum_phrase} "
        f"{signal_phrase} Confidence is {confidence.lower()} and this is not investment advice."
    )

    return {
        "trend": trend,
        "momentum": momentum,
        "signal": signal,
        "confidence": confidence,
        "score": score,
        "summary": summary,
    }


@app.get("/")
def root() -> Dict[str, str]:
    """Basic API info endpoint."""
    return {"message": "SignalForge API is running."}


@app.get("/health")
def health() -> Dict[str, Any]:
    """Return API status and the current timestamp."""
    timestamp = datetime.now(timezone.utc).isoformat()

    return {
        "api_status": "ok",
        "database_status": "disabled",
        "timestamp": timestamp,
    }


@app.get("/prices/{symbol}")
def get_prices(
    symbol: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    period: str = "1y",
    interval: str = "1d",
) -> Dict[str, Any]:
    """Return price data fetched directly from Yahoo Finance."""
    dataframe, source = ensure_price_data(symbol, start, end, period, interval)
    return {
        "symbol": symbol.upper(),
        "source": source,
        "rows": len(dataframe),
        "prices": dataframe_to_records(dataframe),
    }


@app.get("/indicators/{symbol}")
def get_indicators(
    symbol: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    period: str = "1y",
    interval: str = "1d",
    short_window: int = Query(5, ge=1),
    long_window: int = Query(20, ge=1),
) -> Dict[str, Any]:
    """Return technical indicators based on Yahoo Finance price data."""
    if long_window <= short_window:
        raise HTTPException(status_code=400, detail="long_window must be greater than short_window.")

    dataframe, source = ensure_price_data(symbol, start, end, period, interval)
    indicators_df = calculate_indicator_dataframe(
        dataframe=dataframe,
        short_window=short_window,
        long_window=long_window,
    )
    return {
        "symbol": symbol.upper(),
        "source": source,
        "rows": len(indicators_df),
        "indicators": dataframe_to_records(indicators_df),
    }


@app.get("/backtest/{symbol}")
def get_backtest(
    symbol: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    period: str = "1y",
    interval: str = "1d",
    short_window: int = Query(5, ge=1),
    long_window: int = Query(20, ge=1),
) -> Dict[str, Any]:
    """Return moving-average crossover backtest results from Yahoo Finance price data."""
    if long_window <= short_window:
        raise HTTPException(status_code=400, detail="long_window must be greater than short_window.")

    dataframe, source = ensure_price_data(symbol, start, end, period, interval)
    indicators_df = calculate_indicator_dataframe(
        dataframe=dataframe,
        short_window=short_window,
        long_window=long_window,
    )
    backtest_df = backtest_moving_average_crossover(
        dataframe=indicators_df,
        price_column="Close",
        short_ma_column=f"MA{short_window}",
        long_ma_column=f"MA{long_window}",
    )
    metrics = summarize_backtest(backtest_df)

    return {
        "symbol": symbol.upper(),
        "source": source,
        "metrics": metrics,
        "rows": len(backtest_df),
        "data": dataframe_to_records(backtest_df),
    }


@app.get("/strategy/{symbol}")
def get_strategy(
    symbol: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    period: str = "1y",
    interval: str = "1d",
    short_window: int = Query(5, ge=1),
    long_window: int = Query(20, ge=1),
) -> Dict[str, Any]:
    """Return a simple rule-based summary for non-technical users."""
    if long_window <= short_window:
        raise HTTPException(status_code=400, detail="long_window must be greater than short_window.")

    dataframe, source = ensure_price_data(symbol, start, end, period, interval)
    indicators_df = calculate_indicator_dataframe(
        dataframe=dataframe,
        short_window=short_window,
        long_window=long_window,
    )
    backtest_df = backtest_moving_average_crossover(
        dataframe=indicators_df,
        price_column="Close",
        short_ma_column=f"MA{short_window}",
        long_ma_column=f"MA{long_window}",
    )

    return {
        "symbol": symbol.upper(),
        "source": source,
        **build_strategy_summary(symbol=symbol, indicators_df=indicators_df, backtest_df=backtest_df),
    }
