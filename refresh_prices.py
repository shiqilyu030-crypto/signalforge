"""Scheduled ETL script for refreshing price data in PostgreSQL."""

from __future__ import annotations

import yfinance as yf

from db import init_db
from historical_prices import save_prices_to_db
from watchlist import DEFAULT_WATCHLIST


def refresh_ticker_prices(ticker: str) -> None:
    """Fetch daily historical prices for a ticker and upsert them into PostgreSQL."""
    history = yf.Ticker(ticker).history(period="max", interval="1d", auto_adjust=False)

    if history.empty:
        print(f"{ticker}: no data returned")
        return

    upserted_rows = save_prices_to_db(symbol=ticker, history=history)
    first_date = history.index.min()
    last_date = history.index.max()
    first_label = first_date.date().isoformat() if hasattr(first_date, "date") else str(first_date)
    last_label = last_date.date().isoformat() if hasattr(last_date, "date") else str(last_date)

    print(
        f"{ticker}: upserted {upserted_rows} rows "
        f"({first_label} to {last_label})"
    )


def main() -> None:
    """Run the ETL job for the default ticker list."""
    init_db()
    for ticker in DEFAULT_WATCHLIST:
        try:
            refresh_ticker_prices(ticker)
        except Exception as exc:
            print(f"{ticker}: failed - {exc}")


if __name__ == "__main__":
    main()
