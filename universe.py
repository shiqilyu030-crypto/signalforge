"""Shared stock-universe configuration for the SignalForge scanner."""

from __future__ import annotations

from typing import List


def _dedupe(symbols: List[str]) -> List[str]:
    seen = set()
    deduped: List[str] = []
    for symbol in symbols:
        if symbol not in seen:
            seen.add(symbol)
            deduped.append(symbol)
    return deduped


UNIVERSE = _dedupe(
    [
        "AAPL", "MSFT", "NVDA", "AMZN", "META", "GOOGL", "TSLA", "AMD", "AVGO", "ADBE",
        "COST", "PEP", "TMUS", "CSCO", "INTC", "QCOM", "TXN", "AMAT", "LRCX", "MU",
        "INTU", "PYPL", "BKNG", "NFLX", "ISRG", "GILD", "REGN", "VRTX", "ADP", "ADI",
        "PANW", "SNPS", "CDNS", "MRVL", "KLAC", "CRWD", "FTNT", "TEAM", "SHOP", "UBER",
        "ABNB", "SQ", "COIN", "DOCU", "ZM", "OKTA", "DDOG", "NET", "MDB", "ZS",
        "ROKU", "TWLO", "ETSY", "SBUX", "MELI", "PDD", "JD", "BIDU", "EA", "TTD",
        "WDAY", "ANSS", "ORLY", "MNST", "FAST", "PCAR", "NXPI", "ASML", "KDP", "CHTR",
        "MAR", "CSX", "ADSK", "EXC", "AEP", "XEL", "WBD", "LCID", "RIVN", "PLTR",
        "F", "GM", "BA", "CAT", "GE", "DE", "HON", "UPS", "FDX", "NKE",
        "TGT", "WMT", "HD", "LOW", "CVS", "UNH", "PFE", "MRNA", "LLY", "ABBV",
        "TMO", "DHR", "ABT", "BMY", "MDT", "SYK", "ZTS", "JPM", "BAC", "WFC",
        "GS", "MS", "BLK", "SCHW", "AXP", "V", "MA", "PYPL", "CRM", "NOW",
        "IBM", "ORCL", "ACN", "LIN", "COP", "XOM", "CVX", "SLB", "EOG", "OXY",
        "KO", "MCD", "DIS", "CMCSA", "T", "VZ", "AMGN", "CI", "HUM", "C",
    ]
)

TOP_SIGNAL_LIMIT = 50
MIN_HISTORY_ROWS = 60
SCANNER_TIMEOUT_SECONDS = 8
SCANNER_MAX_WORKERS = 8
SCANNER_REFRESH_INTERVAL_SECONDS = 300
