from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.problem_loader import _load_problem_index
from app.session_store import session_store


@pytest.fixture(autouse=True)
def reset_application_state() -> None:
    session_store._sessions.clear()
    _load_problem_index.cache_clear()
    yield
    session_store._sessions.clear()
    _load_problem_index.cache_clear()


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
