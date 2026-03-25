"""Load price data from CSV and compute reusable technical indicators."""

from __future__ import annotations

from pathlib import Path
from typing import Iterable, Optional, Union

import pandas as pd


def load_price_data(csv_path: Union[str, Path], date_column: str = "Date") -> pd.DataFrame:
    """Load historical price data from CSV into a DataFrame."""
    dataframe = pd.read_csv(csv_path)

    if date_column in dataframe.columns:
        dataframe[date_column] = pd.to_datetime(dataframe[date_column])
        dataframe = dataframe.sort_values(date_column).reset_index(drop=True)

    return dataframe


def add_moving_averages(
    dataframe: pd.DataFrame,
    price_column: str = "Close",
    short_window: int = 5,
    long_window: int = 20,
) -> pd.DataFrame:
    """Return a copy of the DataFrame with MA columns added."""
    result = dataframe.copy()
    result[f"MA{short_window}"] = result[price_column].rolling(window=short_window).mean()
    result[f"MA{long_window}"] = result[price_column].rolling(window=long_window).mean()
    return result


def add_named_moving_averages(
    dataframe: pd.DataFrame,
    windows: Iterable[int],
    price_column: str = "Close",
) -> pd.DataFrame:
    """Return a copy of the DataFrame with one or more named moving averages added."""
    result = dataframe.copy()
    for window in windows:
        result[f"MA{window}"] = result[price_column].rolling(window=window).mean()
    return result


def add_rsi(
    dataframe: pd.DataFrame,
    price_column: str = "Close",
    window: int = 14,
) -> pd.DataFrame:
    """Return a copy of the DataFrame with RSI added."""
    result = dataframe.copy()
    delta = result[price_column].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    average_gain = gain.rolling(window=window, min_periods=window).mean()
    average_loss = loss.rolling(window=window, min_periods=window).mean()
    rs = average_gain / average_loss

    result["RSI"] = 100 - (100 / (1 + rs))
    return result


def add_macd(
    dataframe: pd.DataFrame,
    price_column: str = "Close",
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> pd.DataFrame:
    """Return a copy of the DataFrame with MACD columns added."""
    result = dataframe.copy()
    fast_ema = result[price_column].ewm(span=fast_period, adjust=False).mean()
    slow_ema = result[price_column].ewm(span=slow_period, adjust=False).mean()

    result["MACD"] = fast_ema - slow_ema
    result["MACDSignal"] = result["MACD"].ewm(span=signal_period, adjust=False).mean()
    result["MACDHistogram"] = result["MACD"] - result["MACDSignal"]
    return result


def calculate_indicators(
    csv_path: Union[str, Path],
    price_column: str = "Close",
    date_column: str = "Date",
    short_window: int = 5,
    long_window: int = 20,
) -> pd.DataFrame:
    """Load CSV price data and return a DataFrame with all indicators."""
    dataframe = load_price_data(csv_path=csv_path, date_column=date_column)
    dataframe = add_moving_averages(
        dataframe=dataframe,
        price_column=price_column,
        short_window=short_window,
        long_window=long_window,
    )
    dataframe = add_rsi(dataframe=dataframe, price_column=price_column)
    dataframe = add_macd(dataframe=dataframe, price_column=price_column)
    return dataframe
