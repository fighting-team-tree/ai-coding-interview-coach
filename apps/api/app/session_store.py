from __future__ import annotations

from threading import Lock

from app.models import InterviewSession


class InMemorySessionStore:
    def __init__(self) -> None:
        self._lock = Lock()
        self._sessions: dict[str, InterviewSession] = {}

    def create(self, session: InterviewSession) -> InterviewSession:
        with self._lock:
            self._sessions[session.id] = session
        return session

    def get(self, session_id: str) -> InterviewSession:
        session = self._sessions.get(session_id)
        if session is None:
            raise KeyError(session_id)
        return session

    def save(self, session: InterviewSession) -> InterviewSession:
        session.touch()
        with self._lock:
            self._sessions[session.id] = session
        return session


session_store = InMemorySessionStore()
