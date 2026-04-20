from __future__ import annotations

from datetime import timedelta

import pytest

from app.models import InterviewSession, utc_now
from app.session_store import InMemorySessionStore


def test_session_store_prunes_expired_sessions() -> None:
    store = InMemorySessionStore(ttl_minutes=1)
    session = InterviewSession(problem_id="two-pointer-window")
    store.create(session)
    session.updated_at = utc_now() - timedelta(minutes=2)

    with pytest.raises(KeyError):
        store.get(session.id)

    assert session.id not in store._sessions
