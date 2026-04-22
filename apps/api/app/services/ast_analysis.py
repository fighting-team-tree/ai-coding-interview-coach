from __future__ import annotations

import ast

from app.models import AstProfile

RISKY_CALLS = {
    "pop": "list.pop(0) 사용으로 O(N) 이동 비용이 생길 수 있습니다.",
    "sorted": "sorted() 호출로 추가 O(N log N) 비용이 생길 수 있습니다.",
}


class _Analyzer(ast.NodeVisitor):
    def __init__(self) -> None:
        self.loop_depth = 0
        self.max_loop_depth = 0
        self.risky_ops: set[str] = set()
        self.function_stack: list[str] = []
        self.recursion_detected = False
        self.branch_points = 1

    def _is_sliding_window_shrink_loop(self, node: ast.While) -> bool:
        if not isinstance(node.test, ast.Compare):
            return False

        has_pointer_increment = False
        has_window_shrink = False

        for child in ast.walk(node):
            if (
                isinstance(child, ast.AugAssign)
                and isinstance(child.target, ast.Name)
                and isinstance(child.op, ast.Add)
                and isinstance(child.value, ast.Constant)
                and child.value.value == 1
            ):
                has_pointer_increment = True
            if (
                isinstance(child, ast.AugAssign)
                and isinstance(child.target, ast.Name)
                and isinstance(child.op, ast.Sub)
            ):
                has_window_shrink = True

        return has_pointer_increment and has_window_shrink

    def visit_For(self, node: ast.For) -> None:  # noqa: N802
        self.loop_depth += 1
        self.max_loop_depth = max(self.max_loop_depth, self.loop_depth)
        self.branch_points += 1
        self.generic_visit(node)
        self.loop_depth -= 1

    def visit_While(self, node: ast.While) -> None:  # noqa: N802
        self.branch_points += 1
        if not self._is_sliding_window_shrink_loop(node):
            self.loop_depth += 1
            self.max_loop_depth = max(self.max_loop_depth, self.loop_depth)
        self.generic_visit(node)
        if not self._is_sliding_window_shrink_loop(node):
            self.loop_depth -= 1

    def visit_If(self, node: ast.If) -> None:  # noqa: N802
        self.branch_points += 1
        self.generic_visit(node)

    def visit_FunctionDef(self, node: ast.FunctionDef) -> None:  # noqa: N802
        self.function_stack.append(node.name)
        self.generic_visit(node)
        self.function_stack.pop()

    def visit_Call(self, node: ast.Call) -> None:  # noqa: N802
        if isinstance(node.func, ast.Attribute) and node.func.attr == "pop":
            if node.args and isinstance(node.args[0], ast.Constant) and node.args[0].value == 0:
                self.risky_ops.add(RISKY_CALLS["pop"])
        if isinstance(node.func, ast.Name) and node.func.id == "sorted":
            self.risky_ops.add(RISKY_CALLS["sorted"])
        if (
            isinstance(node.func, ast.Name)
            and self.function_stack
            and node.func.id == self.function_stack[-1]
        ):
            self.recursion_detected = True
        self.generic_visit(node)


def analyze_code(code: str) -> AstProfile:
    try:
        tree = ast.parse(code)
    except SyntaxError as exc:
        return AstProfile(
            parse_ok=False,
            notes=[f"{exc.lineno}번째 줄 부근 문법 오류: {exc.msg}"],
        )

    analyzer = _Analyzer()
    analyzer.visit(tree)

    notes: list[str] = []
    if analyzer.max_loop_depth >= 2:
        notes.append("중첩 반복문이 감지되어 복잡도 설명이 필요합니다.")
    if analyzer.recursion_detected:
        notes.append("재귀 호출이 감지되어 종료 조건 설명이 필요합니다.")
    if analyzer.risky_ops:
        notes.append("비용이 큰 연산 후보가 감지되었습니다.")

    return AstProfile(
        parse_ok=True,
        nested_loop_depth=analyzer.max_loop_depth,
        has_risky_ops=sorted(analyzer.risky_ops),
        recursion_detected=analyzer.recursion_detected,
        cyclomatic_complexity=analyzer.branch_points,
        notes=notes,
    )
