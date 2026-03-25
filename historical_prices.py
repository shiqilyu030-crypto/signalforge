"""Fetch historical stock prices from Yahoo Finance and optionally save them to CSV."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Optional, Union

import pandas as pd
import yfinance as yf


def fetch_historical_prices(
    symbol: str,
    output_path: Optional[Union[str, Path]] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    period: str = "1y",
    interval: str = "1d",
    save_to_csv: bool = True,
    auto_adjust: bool = False,
    timeout_seconds: int = 8,
) -> pd.DataFrame:
    """Download historical price data for ``symbol`` and return it as a DataFrame."""
    request_kwargs = {
        "tickers": symbol,
        "start": start,
        "end": end,
        "interval": interval,
        "auto_adjust": auto_adjust,
        "progress": False,
        "threads": False,
        "timeout": timeout_seconds,
    }
    if not start and not end:
        request_kwargs["period"] = period

    history = yf.download(
        **request_kwargs,
    )

    if history.empty:
        raise ValueError(f"No price data returned for symbol '{symbol}'.")

    dataframe = history.reset_index()
    if "Date" not in dataframe.columns:
        dataframe = dataframe.rename(columns={dataframe.columns[0]: "Date"})
    dataframe["Date"] = pd.to_datetime(dataframe["Date"])
    dataframe["Ticker"] = symbol.upper()
    dataframe = dataframe.sort_values("Date").reset_index(drop=True)

    if save_to_csv:
        if output_path is None:
            raise ValueError("An output_path is required when save_to_csv is enabled.")
        destination = Path(output_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        dataframe.to_csv(destination, index=False)

    return dataframe


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch historical stock prices from Yahoo Finance and save them to CSV.",
    )
    parser.add_argument("symbol", help="Ticker symbol, for example AAPL")
    parser.add_argument(
        "-o",
        "--output",
        default="data/stock_prices.csv",
        help="Output CSV path. Defaults to data/stock_prices.csv",
    )
    parser.add_argument("--start", help="Start date in YYYY-MM-DD format")
    parser.add_argument("--end", help="End date in YYYY-MM-DD format")
    parser.add_argument(
        "--period",
        default="1y",
        help="Yahoo Finance period such as 1mo, 6mo, 1y, 5y, max",
    )
    parser.add_argument(
        "--interval",
        default="1d",
        help="Yahoo Finance interval such as 1d, 1wk, 1mo, 1h",
    )
    parser.add_argument(
        "--no-csv",
        action="store_true",
        help="Skip writing the fetched data to CSV",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    dataframe = fetch_historical_prices(
        symbol=args.symbol,
        output_path=args.output,
        start=args.start,
        end=args.end,
        period=args.period,
        interval=args.interval,
        save_to_csv=not args.no_csv,
    )
    if args.no_csv:
        print(f"Fetched {len(dataframe)} rows for {args.symbol}")
    else:
        print(f"Saved historical prices for {args.symbol} to {args.output}")


if __name__ == "__main__":
    main()
