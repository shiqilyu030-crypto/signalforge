"""Fetch historical stock prices from Yahoo Finance and persist them to CSV or PostgreSQL."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pandas as pd
import yfinance as yf
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from db import Price, init_db, session_scope


def history_to_price_records(symbol: str, history: Any) -> List[Dict[str, Any]]:
    """Convert a Yahoo Finance history DataFrame into PostgreSQL-ready records."""
    dataframe = history.reset_index()
    date_column = "Date" if "Date" in dataframe.columns else dataframe.columns[0]
    records: List[Dict[str, Any]] = []

    for row in dataframe.to_dict(orient="records"):
        trading_date = row[date_column]
        if hasattr(trading_date, "date"):
            trading_date = trading_date.date()
        adj_close = row.get("Adj Close")
        if pd.isna(adj_close):
            adj_close = None

        records.append(
            {
                "ticker": symbol.upper(),
                "date": trading_date,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "adj_close": float(adj_close) if adj_close is not None else None,
                "volume": int(row["Volume"]),
            }
        )

    return records


def save_prices_to_db(symbol: str, history: Any) -> int:
    """Upsert Yahoo Finance history rows into the PostgreSQL prices table."""
    records = history_to_price_records(symbol=symbol, history=history)
    if not records:
        return 0

    init_db()

    with session_scope() as session:
        insert_statement = pg_insert(Price).values(records)
        upsert_statement = insert_statement.on_conflict_do_update(
            index_elements=["ticker", "date"],
            set_={
                "open": insert_statement.excluded.open,
                "high": insert_statement.excluded.high,
                "low": insert_statement.excluded.low,
                "close": insert_statement.excluded.close,
                "adj_close": insert_statement.excluded.adj_close,
                "volume": insert_statement.excluded.volume,
                "created_at": func.now(),
            },
        )
        session.execute(upsert_statement)

    return len(records)


def fetch_historical_prices(
    symbol: str,
    output_path: Optional[Union[str, Path]] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    period: str = "1y",
    interval: str = "1d",
    save_to_csv: bool = True,
    save_to_db: bool = False,
) -> Optional[Path]:
    """Download historical price data for ``symbol`` and save it as CSV and/or PostgreSQL."""
    ticker = yf.Ticker(symbol)
    history = ticker.history(
        start=start,
        end=end,
        period=period if not start and not end else None,
        interval=interval,
        auto_adjust=False,
    )

    if history.empty:
        raise ValueError(f"No price data returned for symbol '{symbol}'.")

    if not save_to_csv and not save_to_db:
        raise ValueError("At least one of save_to_csv or save_to_db must be enabled.")

    destination: Optional[Path] = None
    if save_to_csv:
        if output_path is None:
            raise ValueError("An output_path is required when save_to_csv is enabled.")
        destination = Path(output_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        history.to_csv(destination)

    if save_to_db:
        save_prices_to_db(symbol=symbol, history=history)

    return destination


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
        "--save-to-db",
        action="store_true",
        help="Also save the fetched data into the PostgreSQL prices table",
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

    output = fetch_historical_prices(
        symbol=args.symbol,
        output_path=args.output,
        start=args.start,
        end=args.end,
        period=args.period,
        interval=args.interval,
        save_to_csv=not args.no_csv,
        save_to_db=args.save_to_db,
    )
    if output is not None and args.save_to_db:
        print(f"Saved historical prices for {args.symbol} to {output} and PostgreSQL")
    elif output is not None:
        print(f"Saved historical prices for {args.symbol} to {output}")
    else:
        print(f"Saved historical prices for {args.symbol} to PostgreSQL")


if __name__ == "__main__":
    main()
