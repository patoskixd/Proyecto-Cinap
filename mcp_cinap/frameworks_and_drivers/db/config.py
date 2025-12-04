import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/cinap")

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5, max_overflow=10)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class SAUnitOfWork:
    def __init__(self, session_factory=SessionLocal):
        self._sf = session_factory
        self.session: AsyncSession | None = None
        self._slots = None
        self._appts = None

    async def __aenter__(self):
        self.session = self._sf()
        try:
            from frameworks_and_drivers.db.sa_repos import (
                SASlotRepository, SAApptRepository,
                SAAdvisorRepository, SAServiceRepository,
            )
            self._slots = SASlotRepository(self.session)
            self._appts = SAApptRepository(self.session)
            self._advisors = SAAdvisorRepository(self.session)
            self._services = SAServiceRepository(self.session)
            return self
        except Exception:
            if self.session:
                try:
                    await self.session.close()
                finally:
                    self.session = None
            raise

    async def __aexit__(self, exc_type, exc, tb):
        session = self.session
        self.session = None
        try:
            if not session:
                return
            try:
                if exc_type:
                    await session.rollback()
                else:
                    await session.commit()
            finally:
                try:
                    await session.close()
                except Exception:
                    pass
        finally:
            self._slots = None
            self._appts = None
            self._advisors = None
            self._services = None

    @property
    def slots(self): return self._slots
    @property
    def appointments(self): return self._appts
    @property
    def advisors(self): return self._advisors
    @property
    def services(self): return self._services
