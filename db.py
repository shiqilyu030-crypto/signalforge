"""SQLAlchemy database configuration and price table model."""

from __future__ import annotations

import os
from collections.abc import Generator
from contextlib import contextmanager
from datetime import date, datetime

from sqlalchemy import (
    BigInteger,
    Column,
    Date,
    DateTime,
    Float,
    String,
    UniqueConstraint,
    create_engine,
    func,
)
from sqlalchemy.orm import Session, declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@localhost:5432/quant_data",
)


Base = declarative_base()


class Price(Base):
    """Historical OHLCV price data for a ticker."""

    __tablename__ = "prices"
    __table_args__ = (
        UniqueConstraint("ticker", "date", name="uq_prices_ticker_date"),
    )

    ticker = Column(String(20), primary_key=True, index=True)
    date = Column(Date, primary_key=True, index=True)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    adj_close = Column(Float, nullable=True)
    volume = Column(BigInteger, nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db() -> None:
    """Create all configured tables."""
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    """Yield a SQLAlchemy session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
