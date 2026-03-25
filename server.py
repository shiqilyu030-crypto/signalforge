"""FastAPI backend for price data, indicators, and backtest results."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from backtest import backtest_moving_average_crossover, summarize_backtest
from historical_prices import fetch_historical_prices
from indicators import add_macd, add_moving_averages, add_named_moving_averages, add_rsi
from universe import MIN_HISTORY_ROWS, SCANNER_MAX_WORKERS, SCANNER_TIMEOUT_SECONDS, TOP_SIGNAL_LIMIT, UNIVERSE

app = FastAPI(
    title="SignalForge API",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://signalforge-rose.vercel.app",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
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
    timeout_seconds: int = SCANNER_TIMEOUT_SECONDS,
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
            timeout_seconds=timeout_seconds,
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
    result = add_named_moving_averages(
        dataframe=result,
        windows=[50],
        price_column="Close",
    )
    result = add_rsi(result, price_column="Close")
    result = add_macd(result, price_column="Close")
    return result


def build_signal_payload(
    symbol: str,
    indicators_df: pd.DataFrame,
    backtest_df: pd.DataFrame,
) -> Dict[str, Any]:
    """Build a transparent, rule-based signal payload from indicator and backtest data."""
    latest = indicators_df.iloc[-1]
    previous = indicators_df.iloc[-2] if len(indicators_df) > 1 else latest

    close_price = float(latest["Close"])
    ma50 = latest.get("MA50")
    rsi = latest.get("RSI")
    macd = latest.get("MACD")
    macd_signal = latest.get("MACDSignal")
    previous_macd = previous.get("MACD")
    previous_signal = previous.get("MACDSignal")
    latest_backtest = backtest_df.iloc[-1] if not backtest_df.empty else None

    trend_points = 30 if pd.notna(ma50) and close_price > float(ma50) else 0

    if pd.isna(rsi):
        rsi_points = 0
        rsi_state = "RSI is not available yet."
    elif float(rsi) < 35:
        rsi_points = 30
        rsi_state = "RSI suggests oversold recovery."
    elif float(rsi) <= 50:
        rsi_points = 15
        rsi_state = "RSI is improving from a softer range."
    elif float(rsi) <= 70:
        rsi_points = 10
        rsi_state = "RSI is supportive but not deeply oversold."
    else:
        rsi_points = 0
        rsi_state = "RSI is elevated, which limits the momentum score."

    bullish_crossover = (
        pd.notna(macd)
        and pd.notna(macd_signal)
        and pd.notna(previous_macd)
        and pd.notna(previous_signal)
        and float(macd) > float(macd_signal)
        and float(previous_macd) <= float(previous_signal)
    )

    if bullish_crossover:
        macd_points = 40
        macd_state = "MACD just flashed a bullish crossover."
    elif pd.notna(macd) and pd.notna(macd_signal) and float(macd) > float(macd_signal):
        macd_points = 25
        macd_state = "MACD is above its signal line, which supports the setup."
    elif pd.notna(macd) and pd.notna(previous_macd) and float(macd) > float(previous_macd):
        macd_points = 10
        macd_state = "MACD is improving, but confirmation is still limited."
    else:
        macd_points = 0
        macd_state = "MACD confirmation is currently weak."

    raw_score = trend_points + rsi_points + macd_points
    score = max(0, min(100, raw_score))

    if score >= 80:
        label = "Strong Buy"
    elif score >= 65:
        label = "Buy"
    elif score >= 45:
        label = "Neutral"
    elif score >= 25:
        label = "Weak"
    else:
        label = "Bearish"

    trend = "Bullish" if trend_points == 30 else "Bearish"
    if macd_points >= 25 or rsi_points >= 15:
        momentum = "Improving"
    elif macd_points == 0 and rsi_points == 0:
        momentum = "Weak"
    else:
        momentum = "Balanced"

    if score >= 75:
        confidence = "High"
    elif score >= 45:
        confidence = "Medium"
    else:
        confidence = "Low"

    explanation_parts: List[str] = []
    if trend_points == 30:
        explanation_parts.append("Price is above the 50-day moving average")
    else:
        explanation_parts.append("Price is below the 50-day moving average")
    explanation_parts.append(rsi_state.replace("RSI ", "RSI "))
    explanation_parts.append(macd_state)
    explanation = ", ".join(explanation_parts[:-1]) + f", and {explanation_parts[-1].rstrip('.') }."

    summary = f"{explanation} This signal is informational only and not investment advice."

    cumulative_strategy = (
        latest_backtest.get("CumulativeStrategyReturn")
        if latest_backtest is not None
        else None
    )
    buy_and_hold = (
        latest_backtest.get("CumulativeMarketReturn")
        if latest_backtest is not None
        else None
    )
    cumulative_return = float(cumulative_strategy) - 1 if pd.notna(cumulative_strategy) else None
    buy_and_hold_return = float(buy_and_hold) - 1 if pd.notna(buy_and_hold) else None

    return {
        "ticker": symbol.upper(),
        "price": close_price,
        "score": score,
        "label": label,
        "breakdown": {
            "trend": trend_points,
            "rsi": rsi_points,
            "macd": macd_points,
        },
        "trend": trend,
        "momentum": momentum,
        "signal": label,
        "confidence": confidence,
        "rsi": normalize_value(rsi),
        "macd": normalize_value(macd),
        "ma50": normalize_value(ma50),
        "cumulative_return": normalize_value(cumulative_return),
        "buy_and_hold_return": normalize_value(buy_and_hold_return),
        "explanation_points": explanation_parts,
        "explanation": explanation,
        "summary": summary,
    }


def build_backtest_for_symbol(
    symbol: str,
    start: Optional[str],
    end: Optional[str],
    period: str,
    interval: str,
    short_window: int,
    long_window: int,
    timeout_seconds: int = SCANNER_TIMEOUT_SECONDS,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, float], str]:
    """Build the price, indicator, and backtest views for a single symbol."""
    dataframe, source = ensure_price_data(
        symbol=symbol,
        start=start,
        end=end,
        period=period,
        interval=interval,
        timeout_seconds=timeout_seconds,
    )
    if len(dataframe) < MIN_HISTORY_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"SignalForge needs at least {MIN_HISTORY_ROWS} daily bars for {symbol.upper()}.",
        )
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
    return dataframe, indicators_df, backtest_df, metrics, source


def build_signal_snapshot(
    symbol: str,
    period: str = "1y",
    interval: str = "1d",
    short_window: int = 5,
    long_window: int = 20,
    timeout_seconds: int = SCANNER_TIMEOUT_SECONDS,
) -> Dict[str, Any]:
    """Return one ticker's signal payload for strategy and leaderboard endpoints."""
    dataframe, indicators_df, backtest_df, metrics, source = build_backtest_for_symbol(
        symbol=symbol,
        start=None,
        end=None,
        period=period,
        interval=interval,
        short_window=short_window,
        long_window=long_window,
        timeout_seconds=timeout_seconds,
    )
    signal_payload = build_signal_payload(
        symbol=symbol,
        indicators_df=indicators_df,
        backtest_df=backtest_df,
    )
    latest_indicator = indicators_df.iloc[-1]
    return {
        "symbol": symbol.upper(),
        "source": source,
        "price": normalize_value(latest_indicator.get("Close")),
        "trend_value": normalize_value(latest_indicator.get("MA50")),
        **signal_payload,
        "metrics": metrics,
    }


def scan_universe_signals(
    period: str,
    interval: str,
    limit: int = TOP_SIGNAL_LIMIT,
) -> Dict[str, Any]:
    """Scan the configured stock universe and return the highest-ranked signals."""
    generated_at = datetime.now(timezone.utc).isoformat()
    ranked: List[Dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=SCANNER_MAX_WORKERS) as executor:
        futures = {
            executor.submit(
                build_signal_snapshot,
                symbol,
                period,
                interval,
                5,
                20,
                SCANNER_TIMEOUT_SECONDS,
            ): symbol
            for symbol in UNIVERSE
        }
        for future in as_completed(futures):
            try:
                ranked.append(future.result())
            except Exception:
                continue

    ranked = sorted(ranked, key=lambda item: item["score"], reverse=True)
    limited = ranked[:limit]
    for index, item in enumerate(limited, start=1):
        item["rank"] = index

    return {
        "last_updated": generated_at,
        "generated_at": generated_at,
        "universe_size": len(UNIVERSE),
        "symbols_scanned": len(ranked),
        "rows": len(limited),
        "signals": limited,
        "data": limited,
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

    _, _, backtest_df, metrics, source = build_backtest_for_symbol(
        symbol=symbol,
        start=start,
        end=end,
        period=period,
        interval=interval,
        short_window=short_window,
        long_window=long_window,
    )

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

    _, indicators_df, backtest_df, metrics, source = build_backtest_for_symbol(
        symbol=symbol,
        start=start,
        end=end,
        period=period,
        interval=interval,
        short_window=short_window,
        long_window=long_window,
    )

    return {
        "symbol": symbol.upper(),
        "source": source,
        "metrics": metrics,
        **build_signal_payload(symbol=symbol, indicators_df=indicators_df, backtest_df=backtest_df),
    }


@app.get("/signals")
def get_signals(
    period: str = "1y",
    interval: str = "1d",
) -> Dict[str, Any]:
    """Return a ranked leaderboard from the broader SignalForge stock universe."""
    return scan_universe_signals(period=period, interval=interval)


@app.get("/signals/{ticker}")
def get_signal(ticker: str, period: str = "1y", interval: str = "1d") -> Dict[str, Any]:
    """Return one ticker's transparent signal breakdown."""
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        **build_signal_snapshot(symbol=ticker, period=period, interval=interval),
    }
