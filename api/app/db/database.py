""" Setup database to perform CRUD transactions
"""
import logging
from typing import Generator
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from .. import config

logger = logging.getLogger(__name__)

write_user = config.get('POSTGRES_WRITE_USER', 'wps')
read_user = config.get('POSTGRES_READ_USER', 'wpsread')
postgres_password = config.get('POSTGRES_PASSWORD', 'wps')
postgres_write_host = config.get('POSTGRES_WRITE_HOST', 'localhost')
postgres_read_host = config.get('POSTGRES_READ_HOST', 'localhost')
postgres_port = config.get('POSTGRES_PORT', '5432')
postgres_database = config.get('POSTGRES_DATABASE', 'wps')

# pylint: disable=line-too-long
DB_WRITE_STRING = f'postgresql://{write_user}:{postgres_password}@{postgres_write_host}:{postgres_port}/{postgres_database}'

# pylint: disable=line-too-long
DB_READ_STRING = f'postgresql://{read_user}:{postgres_password}@{postgres_read_host}:{postgres_port}/{postgres_database}'

# connect to database - defaulting to always use utc timezone
_write_engine = create_engine(DB_WRITE_STRING, connect_args={
                              'options': '-c timezone=utc'})
# use pre-ping on read, as connections are quite often stale due to how few users we have at the moment.
_read_engine = create_engine(
    DB_READ_STRING,
    pool_size=int(config.get('POSTGRES_POOL_SIZE', 5)),
    max_overflow=int(config.get('POSTGRES_MAX_OVERFLOW', 10)),
    pool_pre_ping=True, connect_args={
        'options': '-c timezone=utc'})

# bind session to database
# avoid using these variables anywhere outside of context manager - if
# sessions are not closed, it will result in the api running out of
# connections and becoming non-responsive.
_write_session = sessionmaker(
    autocommit=False, autoflush=False, bind=_write_engine)
_read_session = sessionmaker(
    autocommit=False, autoflush=False, bind=_read_engine)

# constructing a base class for declarative class definitions
Base = declarative_base()


def _get_write_session() -> sessionmaker:
    """ abstraction used for mocking out a write session """
    return _write_session()


def _get_read_session() -> sessionmaker:
    """ abstraction used for mocking out a read session """
    return _read_session()


@ contextmanager
def get_read_session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    session = _get_read_session()
    try:
        yield session
    finally:
        logger.info('session closed by context manager')
        session.close()


@ contextmanager
def get_write_session_scope() -> Generator[Session, None, None]:
    """Provide a transactional scope around a series of operations."""
    session = _get_write_session()
    try:
        yield session
        session.commit()
    except:
        session.rollback()
        raise
    finally:
        session.close()
