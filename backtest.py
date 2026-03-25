"""Backtest a moving average crossover strategy and compute summary metrics."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple, Union

import numpy as np
import pandas as pd

from indicators import calculate_indicators


def calculate_cumulative_return(returns: pd.Series) -> float:
    """Return cumulative return from a series of periodic returns."""
    if returns.empty:
        return 0.0
    return float((1 + returns.fillna(0)).cumprod().iloc[-1] - 1)


def calculate_sharpe_ratio(
    returns: pd.Series,
    periods_per_year: int = 252,
    risk_free_rate: float = 0.0,
) -> float:
    """Return the annualized Sharpe ratio for a series of periodic returns."""
    clean_returns = returns.dropna()
    if clean_returns.empty:
        return 0.0

    excess_returns = clean_returns - (risk_free_rate / periods_per_year)
    volatility = excess_returns.std(ddof=0)
    if volatility == 0 or np.isnan(volatility):
        return 0.0

    return float(np.sqrt(periods_per_year) * excess_returns.mean() / volatility)


def calculate_max_drawdown(cumulative_returns: pd.Series) -> float:
    """Return the maximum drawdown from a cumulative return curve."""
    clean_curve = cumulative_returns.dropna()
    if clean_curve.empty:
        return 0.0

    running_peak = clean_curve.cummax()
    drawdown = clean_curve / running_peak - 1
    return float(drawdown.min())


def calculate_cagr(cumulative_curve: pd.Series, periods_per_year: int = 252) -> float:
    """Return CAGR from a cumulative growth curve."""
    clean_curve = cumulative_curve.dropna()
    if clean_curve.empty:
        return 0.0

    total_periods = len(clean_curve) - 1
    if total_periods <= 0:
        return 0.0

    ending_value = float(clean_curve.iloc[-1])
    if ending_value <= 0:
        return 0.0

    years = total_periods / periods_per_year
    if years <= 0:
        return 0.0

    return float(ending_value ** (1 / years) - 1)


def backtest_moving_average_crossover(
    dataframe: pd.DataFrame,
    price_column: str = "Close",
    short_ma_column: str = "MA5",
    long_ma_column: str = "MA20",
) -> pd.DataFrame:
    """Return a DataFrame with signals, strategy returns, and cumulative curves."""
    result = dataframe.copy()

    if short_ma_column not in result.columns or long_ma_column not in result.columns:
        raise ValueError(
            f"DataFrame must include '{short_ma_column}' and '{long_ma_column}' columns.",
        )

    result["MarketReturn"] = result[price_column].pct_change().fillna(0.0)
    result["Signal"] = (result[short_ma_column] > result[long_ma_column]).astype(int)
    result["Position"] = result["Signal"].shift(1).fillna(0).astype(int)
    result["StrategyReturn"] = result["Position"] * result["MarketReturn"]
    result["CumulativeMarketReturn"] = (1 + result["MarketReturn"]).cumprod()
    result["CumulativeStrategyReturn"] = (1 + result["StrategyReturn"]).cumprod()

    return result


def summarize_backtest(
    backtest_results: pd.DataFrame,
    strategy_return_column: str = "StrategyReturn",
    cumulative_strategy_column: str = "CumulativeStrategyReturn",
    market_return_column: str = "MarketReturn",
    cumulative_market_column: str = "CumulativeMarketReturn",
) -> Dict[str, float]:
    """Return core backtest metrics as a dictionary."""
    returns = backtest_results[strategy_return_column]
    cumulative_curve = backtest_results[cumulative_strategy_column]
    market_returns = backtest_results[market_return_column]
    market_curve = backtest_results[cumulative_market_column]

    return {
        "cumulative_return": calculate_cumulative_return(returns),
        "buy_and_hold_return": calculate_cumulative_return(market_returns),
        "cagr": calculate_cagr(cumulative_curve),
        "sharpe_ratio": calculate_sharpe_ratio(returns),
        "max_drawdown": calculate_max_drawdown(cumulative_curve),
        "buy_and_hold_cagr": calculate_cagr(market_curve),
    }


def run_moving_average_crossover_backtest(
    csv_path: Union[str, Path],
    price_column: str = "Close",
    date_column: str = "Date",
    short_window: int = 5,
    long_window: int = 20,
) -> Tuple[pd.DataFrame, Dict[str, float]]:
    """Load CSV data, calculate indicators, run the strategy, and return metrics."""
    dataframe = calculate_indicators(
        csv_path=csv_path,
        price_column=price_column,
        date_column=date_column,
        short_window=short_window,
        long_window=long_window,
    )
    backtest_results = backtest_moving_average_crossover(
        dataframe=dataframe,
        price_column=price_column,
        short_ma_column=f"MA{short_window}",
        long_ma_column=f"MA{long_window}",
    )
    metrics = summarize_backtest(backtest_results)
    return backtest_results, metrics
