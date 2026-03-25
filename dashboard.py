"""Streamlit dashboard backed by the FastAPI service."""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

import pandas as pd
import plotly.graph_objects as go
import requests
import streamlit as st

API_TIMEOUT_SECONDS = 30
DEFAULT_API_BASE_URL = os.getenv("FASTAPI_BASE_URL", "http://127.0.0.1:8000")


def build_price_chart(dataframe: pd.DataFrame, short_window: int, long_window: int) -> go.Figure:
    """Create a price chart with moving averages."""
    figure = go.Figure()
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe["Close"],
            mode="lines",
            name="Close",
            line={"color": "#0f766e", "width": 2},
        )
    )
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe[f"MA{short_window}"],
            mode="lines",
            name=f"MA{short_window}",
            line={"color": "#f59e0b", "width": 1.5},
        )
    )
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe[f"MA{long_window}"],
            mode="lines",
            name=f"MA{long_window}",
            line={"color": "#7c3aed", "width": 1.5},
        )
    )
    figure.update_layout(
        title="Price and Moving Averages",
        xaxis_title="Date",
        yaxis_title="Price",
        template="plotly_white",
        legend_title="Series",
        margin={"l": 20, "r": 20, "t": 50, "b": 20},
    )
    return figure


def build_rsi_chart(dataframe: pd.DataFrame) -> go.Figure:
    """Create an RSI chart with common threshold levels."""
    figure = go.Figure()
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe["RSI"],
            mode="lines",
            name="RSI",
            line={"color": "#dc2626", "width": 2},
        )
    )
    for level, color in ((70, "#ef4444"), (30, "#3b82f6")):
        figure.add_hline(y=level, line_dash="dash", line_color=color, opacity=0.7)
    figure.update_layout(
        title="RSI",
        xaxis_title="Date",
        yaxis_title="RSI",
        template="plotly_white",
        margin={"l": 20, "r": 20, "t": 50, "b": 20},
    )
    return figure


def build_macd_chart(dataframe: pd.DataFrame) -> go.Figure:
    """Create a MACD chart with signal line and histogram."""
    figure = go.Figure()
    figure.add_trace(
        go.Bar(
            x=dataframe["Date"],
            y=dataframe["MACDHistogram"],
            name="MACD Histogram",
            marker_color="#94a3b8",
            opacity=0.6,
        )
    )
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe["MACD"],
            mode="lines",
            name="MACD",
            line={"color": "#2563eb", "width": 2},
        )
    )
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe["MACDSignal"],
            mode="lines",
            name="Signal",
            line={"color": "#ea580c", "width": 2},
        )
    )
    figure.update_layout(
        title="MACD",
        xaxis_title="Date",
        yaxis_title="Value",
        template="plotly_white",
        barmode="relative",
        margin={"l": 20, "r": 20, "t": 50, "b": 20},
    )
    return figure


def build_backtest_chart(dataframe: pd.DataFrame) -> go.Figure:
    """Create a chart comparing market and strategy cumulative returns."""
    figure = go.Figure()
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe["CumulativeMarketReturn"],
            mode="lines",
            name="Buy and Hold",
            line={"color": "#64748b", "width": 2},
        )
    )
    figure.add_trace(
        go.Scatter(
            x=dataframe["Date"],
            y=dataframe["CumulativeStrategyReturn"],
            mode="lines",
            name="MA Crossover",
            line={"color": "#16a34a", "width": 2},
        )
    )
    figure.update_layout(
        title="Cumulative Returns",
        xaxis_title="Date",
        yaxis_title="Growth of $1",
        template="plotly_white",
        margin={"l": 20, "r": 20, "t": 50, "b": 20},
    )
    return figure


def build_query_params(
    start: Optional[str],
    end: Optional[str],
    period: str,
    interval: str,
    short_window: Optional[int] = None,
    long_window: Optional[int] = None,
) -> Dict[str, Any]:
    """Build backend query parameters while omitting empty values."""
    params: Dict[str, Any] = {"interval": interval}
    if start or end:
        if start:
            params["start"] = start
        if end:
            params["end"] = end
    else:
        params["period"] = period
    if short_window is not None:
        params["short_window"] = short_window
    if long_window is not None:
        params["long_window"] = long_window
    return params


def request_backend(base_url: str, endpoint: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Request JSON data from the FastAPI backend."""
    url = f"{base_url.rstrip('/')}{endpoint}"
    try:
        response = requests.get(url, params=params, timeout=API_TIMEOUT_SECONDS)
    except requests.RequestException as exc:
        raise RuntimeError(f"Could not reach backend at {url}: {exc}") from exc

    if response.ok:
        return response.json()

    try:
        payload = response.json()
        detail = payload.get("detail", response.text)
    except ValueError:
        detail = response.text
    raise RuntimeError(f"Backend request failed ({response.status_code}): {detail}")


def payload_to_dataframe(payload: Dict[str, Any]) -> pd.DataFrame:
    """Convert backend payload rows into a typed DataFrame."""
    dataframe = pd.DataFrame(payload.get("data", []))
    if "Date" in dataframe.columns:
        dataframe["Date"] = pd.to_datetime(dataframe["Date"])
        dataframe = dataframe.sort_values("Date").reset_index(drop=True)
    return dataframe


def main() -> None:
    """Render the Streamlit dashboard."""
    st.set_page_config(page_title="Quant Data Dashboard", layout="wide")
    st.title("Quant Data Dashboard")
    st.caption("Explore PostgreSQL-backed prices, technical indicators, and moving-average backtests.")

    with st.sidebar:
        st.header("Backend")
        api_base_url = st.text_input("FastAPI Base URL", value=DEFAULT_API_BASE_URL).strip()
        st.caption("Run the API first with `uvicorn server:app --reload`.")

        st.header("Controls")
        symbol = st.text_input("Ticker Symbol", value="AAPL").upper().strip()
        period = st.selectbox(
            "Period",
            options=["1mo", "3mo", "6mo", "1y", "2y", "5y", "10y", "max"],
            index=3,
        )
        interval = st.selectbox("Interval", options=["1d"], index=0)
        use_custom_dates = st.checkbox("Use custom date range", value=False)
        start = st.date_input("Start Date", value=None) if use_custom_dates else None
        end = st.date_input("End Date", value=None) if use_custom_dates else None
        short_window = int(st.number_input("Short MA Window", min_value=1, value=5, step=1))
        long_window = int(st.number_input("Long MA Window", min_value=2, value=20, step=1))
        run_analysis = st.button("Load Dashboard", type="primary")

    if long_window <= short_window:
        st.warning("Choose a long moving-average window greater than the short window.")
        return

    if not run_analysis:
        st.info("Pick a symbol and click 'Load Dashboard' to request data from the FastAPI backend.")
        return

    if not symbol:
        st.error("Enter a ticker symbol to continue.")
        return

    start_str = start.isoformat() if start else None
    end_str = end.isoformat() if end else None
    price_params = build_query_params(start=start_str, end=end_str, period=period, interval=interval)
    analysis_params = build_query_params(
        start=start_str,
        end=end_str,
        period=period,
        interval=interval,
        short_window=short_window,
        long_window=long_window,
    )

    try:
        prices_payload = request_backend(api_base_url, f"/prices/{symbol}", price_params)
        indicators_payload = request_backend(api_base_url, f"/indicators/{symbol}", analysis_params)
        backtest_payload = request_backend(api_base_url, f"/backtest/{symbol}", analysis_params)
    except RuntimeError as exc:
        st.error(str(exc))
        return

    raw_prices = payload_to_dataframe(prices_payload)
    indicators_df = payload_to_dataframe(indicators_payload)
    backtest_df = payload_to_dataframe(backtest_payload)
    metrics = backtest_payload.get("metrics", {})
    source = prices_payload.get("source", "unknown")

    if raw_prices.empty or indicators_df.empty or backtest_df.empty:
        st.error(f"No data was returned for {symbol}.")
        return

    st.success(f"Loaded {len(raw_prices)} rows for {symbol} from backend source: {source}")

    metric_columns = st.columns(4)
    metric_columns[0].metric("Latest Close", f"{raw_prices['Close'].iloc[-1]:.2f}")
    metric_columns[1].metric("Cumulative Return", f"{metrics.get('cumulative_return', 0.0):.2%}")
    metric_columns[2].metric("Sharpe Ratio", f"{metrics.get('sharpe_ratio', 0.0):.2f}")
    metric_columns[3].metric("Max Drawdown", f"{metrics.get('max_drawdown', 0.0):.2%}")

    prices_tab, indicators_tab, backtest_tab, data_tab = st.tabs(
        ["Prices", "Indicators", "Backtest", "Data"]
    )

    with prices_tab:
        st.plotly_chart(
            build_price_chart(indicators_df, short_window, long_window),
            use_container_width=True,
        )

    with indicators_tab:
        left, right = st.columns(2)
        with left:
            st.plotly_chart(build_rsi_chart(indicators_df), use_container_width=True)
        with right:
            st.plotly_chart(build_macd_chart(indicators_df), use_container_width=True)

    with backtest_tab:
        st.plotly_chart(build_backtest_chart(backtest_df), use_container_width=True)
        st.dataframe(
            backtest_df[
                [
                    "Date",
                    "Close",
                    f"MA{short_window}",
                    f"MA{long_window}",
                    "Signal",
                    "Position",
                    "StrategyReturn",
                    "CumulativeStrategyReturn",
                ]
            ].tail(50),
            use_container_width=True,
        )

    with data_tab:
        st.subheader("Price Data")
        st.dataframe(raw_prices.tail(100), use_container_width=True)
        st.subheader("Indicator Data")
        st.dataframe(indicators_df.tail(100), use_container_width=True)


if __name__ == "__main__":
    main()
