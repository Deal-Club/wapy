"""Base de données de la plateforme Wapy (PostgreSQL en prod, SQLite en test)."""
import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///wapy_platform.db")

Base = declarative_base()


def make_engine(url: str | None = None):
    url = url or DATABASE_URL
    if url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
        # Base en mémoire : StaticPool pour partager la même connexion (tests).
        if url in ("sqlite://", "sqlite:///:memory:"):
            return create_engine(
                url, connect_args=connect_args, poolclass=StaticPool, future=True
            )
        return create_engine(url, connect_args=connect_args, future=True)
    return create_engine(url, pool_pre_ping=True, future=True)


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db(eng=None):
    """Crée les tables si absentes (migrations Alembic à ajouter plus tard)."""
    import saas.models  # noqa: F401  (enregistre les modèles sur Base)
    Base.metadata.create_all(eng or engine)
