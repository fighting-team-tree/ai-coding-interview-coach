from __future__ import annotations

from fastapi.testclient import TestClient


def test_list_problems_returns_seed_data(client: TestClient) -> None:
    response = client.get("/problems")

    assert response.status_code == 200
    problems = response.json()
    assert len(problems) >= 5
    assert any(problem["id"] == "two-pointer-window" for problem in problems)


def test_read_problem_returns_problem_detail(client: TestClient) -> None:
    response = client.get("/problems/two-pointer-window")

    assert response.status_code == 200
    payload = response.json()
    assert payload["id"] == "two-pointer-window"
    assert payload["starter_code"]
    assert payload["facts"]
    assert payload["demo_variants"][0]["expected_flow"] == "normal"


def test_read_problem_returns_404_for_missing_problem(client: TestClient) -> None:
    response = client.get("/problems/does-not-exist")

    assert response.status_code == 404
