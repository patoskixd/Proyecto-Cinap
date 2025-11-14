from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.frameworks_drivers.config.settings import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from app.interface_adapters.orm.base import Base

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(
    DATABASE_URL, 
    pool_pre_ping=True, 
    echo=False,
    pool_size=3,     
    max_overflow=5,     
    pool_timeout=30,
    pool_recycle=300,   
    connect_args={
        "server_settings": {
            "application_name": "fastapi_backend",
        }
    }
)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency que proporciona una sesión de base de datos.
    Maneja automáticamente el cierre de la conexión.
    """
    session: AsyncSession | None = None
    try:
        session = AsyncSessionLocal()
        yield session
    except Exception as e:
        if session:
            await session.rollback()
        raise
    finally:
        if session:
            await session.close()