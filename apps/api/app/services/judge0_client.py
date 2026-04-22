from __future__ import annotations

import asyncio
import logging

import httpx

from app.config import get_settings
from app.models import JudgeResult

PYTHON_LANGUAGE_ID = 71
logger = logging.getLogger(__name__)


class Judge0Client:
    def __init__(self) -> None:
        settings = get_settings()
        self.demo_mode = settings.is_demo_mode
        self.base_url = settings.judge0_base_url.rstrip("/")
        self.api_token = settings.judge0_api_token

    async def execute_python(self, code: str) -> JudgeResult:
        if self.demo_mode or not self.base_url:
            return JudgeResult(
                status="데모 실행 모드" if self.demo_mode else "내장 실행 모드",
                passed=False,
                stdout=(
                    "데모 환경에서는 제출 코드를 실제 실행하지 않고 "
                    "결정론적 시연 흐름만 사용합니다."
                    if self.demo_mode
                    else "이 환경에서는 실행 서버가 연결되어 있지 않아 "
                    "제출 코드를 실제로 실행하지 않았습니다."
                ),
                mode="demo",
            )

        headers = {}
        if self.api_token:
            headers["X-Auth-Token"] = self.api_token

        try:
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
                            execution_time_ms=int(float(payload["time"]) * 1000)
                            if payload.get("time")
                            else None,
                            memory_kb=payload.get("memory"),
                            mode="judge0",
                        )
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            logger.warning("Judge0 execution failed: %s", exc)
            return JudgeResult(
                status="실행 서버 연결 실패",
                passed=False,
                stderr="실행 서버 응답을 확인하지 못해 결과를 검증할 수 없습니다.",
                mode="judge0",
            )

        return JudgeResult(
            status="실행 결과 대기 시간 초과",
            passed=False,
            stderr="실행 서버가 정해진 시간 안에 완료 상태를 돌려주지 않았습니다.",
            mode="judge0",
        )
