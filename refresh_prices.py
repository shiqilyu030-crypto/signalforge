"""Scheduled refresh script for fetching Yahoo Finance price data to CSV files."""

from __future__ import annotations

from pathlib import Path

from historical_prices import fetch_historical_prices
from watchlist import DEFAULT_WATCHLIST


def refresh_ticker_prices(ticker: str) -> None:
    """Fetch daily historical prices for a ticker and save them to CSV."""
    output_path = Path("data") / f"{ticker.lower()}_prices.csv"
    dataframe = fetch_historical_prices(
        symbol=ticker,
        output_path=output_path,
        period="max",
        interval="1d",
        save_to_csv=True,
    )

    first_date = dataframe["Date"].min()
    last_date = dataframe["Date"].max()
    first_label = first_date.date().isoformat() if hasattr(first_date, "date") else str(first_date)
    last_label = last_date.date().isoformat() if hasattr(last_date, "date") else str(last_date)

    print(f"{ticker}: fetched {len(dataframe)} rows ({first_label} to {last_label})")


def main() -> None:
    """Run the ETL job for the default ticker list."""
    for ticker in DEFAULT_WATCHLIST:
        try:
            refresh_ticker_prices(ticker)
        except Exception as exc:
            print(f"{ticker}: failed - {exc}")


if __name__ == "__main__":
    main()
