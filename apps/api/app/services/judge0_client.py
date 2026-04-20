from __future__ import annotations

import asyncio

import httpx

from app.config import get_settings
from app.models import JudgeResult


PYTHON_LANGUAGE_ID = 71


class Judge0Client:
    def __init__(self) -> None:
        settings = get_settings()
        self.base_url = settings.judge0_base_url.rstrip("/")
        self.api_token = settings.judge0_api_token

    async def execute_python(self, code: str) -> JudgeResult:
        if not self.base_url:
            return JudgeResult(
                status="Demo mode execution",
                passed=True,
                stdout="Demo mode: execution skipped. Treating the submission as runnable.",
                mode="demo",
            )

        headers = {}
        if self.api_token:
            headers["X-Auth-Token"] = self.api_token

        async with httpx.AsyncClient(timeout=15.0) as client:
            create_response = await client.post(
                f"{self.base_url}/submissions",
                headers=headers,
                params={"base64_encoded": "false", "wait": "false"},
                json={
                    "language_id": PYTHON_LANGUAGE_ID,
                    "source_code": code,
                },
            )
            create_response.raise_for_status()
            token = create_response.json()["token"]

            for _ in range(8):
                await asyncio.sleep(1)
                result_response = await client.get(
                    f"{self.base_url}/submissions/{token}",
                    headers=headers,
                    params={"base64_encoded": "false"},
                )
                result_response.raise_for_status()
                payload = result_response.json()
                status_description = payload["status"]["description"]
                if status_description not in {"In Queue", "Processing"}:
                    return JudgeResult(
                        status=status_description,
                        passed=status_description in {"Accepted", "Finished"},
                        stdout=payload.get("stdout") or "",
                        stderr=payload.get("stderr") or "",
                        compile_output=payload.get("compile_output") or "",
                        execution_time_ms=int(float(payload["time"]) * 1000) if payload.get("time") else None,
                        memory_kb=payload.get("memory"),
                        mode="judge0",
                    )

        return JudgeResult(
            status="Timed out while polling Judge0",
            passed=False,
            stderr="Judge0 did not return a terminal state within the polling window.",
            mode="judge0",
        )

