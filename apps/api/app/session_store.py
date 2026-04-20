from __future__ import annotations

from datetime import timedelta
from threading import Lock

from app.config import get_settings
from app.models import InterviewSession, utc_now


class InMemorySessionStore:
    def __init__(self, *, ttl_minutes: int) -> None:
        self._lock = Lock()
        self._sessions: dict[str, InterviewSession] = {}
        self._ttl = timedelta(minutes=ttl_minutes)

    def _is_expired(self, session: InterviewSession) -> bool:
        return utc_now() - session.updated_at > self._ttl

    def _prune_expired_locked(self) -> None:
        expired_session_ids = [
            session_id
            for session_id, session in self._sessions.items()
            if self._is_expired(session)
        ]
        for session_id in expired_session_ids:
            del self._sessions[session_id]

    def create(self, session: InterviewSession) -> InterviewSession:
        with self._lock:
            self._prune_expired_locked()
            self._sessions[session.id] = session
        return session

    def get(self, session_id: str) -> InterviewSession:
        with self._lock:
            self._prune_expired_locked()
            session = self._sessions.get(session_id)
            if session is None:
                raise KeyError(session_id)
            return session

    def save(self, session: InterviewSession) -> InterviewSession:
        session.touch()
        with self._lock:
            self._prune_expired_locked()
            self._sessions[session.id] = session
        return session


session_store = InMemorySessionStore(ttl_minutes=get_settings().session_ttl_minutes)
