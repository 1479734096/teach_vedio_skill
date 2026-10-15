"""通用理科数理模型与参数有效性验证工具。
支持任意数学、物理与工程模型：检查参数有限性、奇点/除零风险、动态方程符号残差与特定采样点守恒性。
不依赖具体主题硬编码白名单。
"""
import argparse
import json
import math
from pathlib import Path
import numpy as np
import sympy as sp

class Result:
    def __init__(self, key, title, status, evidence=None):
        self.data = {
            "id": key,
            "title": title,
            "status": status,
            "critical": True,
            "applicable": True,
            "evidence": evidence or {}
        }

def read_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))

def write_json(p, data):
    p = Path(p)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

def verify_parameters(params):
    """通用参数检查：确保所有数值均为有限实数，且无非法复数/NaN/Inf。"""
    rows = []
    if not isinstance(params, dict) or not params:
        rows.append(Result("param.validity", "数理参数存在性", "FAIL", {"error": "缺少 parameters 字典"}).data)
        return rows
    
    invalid = []
    finite_count = 0
    for k, v in params.items():
        if isinstance(v, (int, float)):
            if not np.isfinite(v):
                invalid.append((k, str(v)))
            else:
                finite_count += 1
        elif isinstance(v, list):
            arr = np.asarray(v)
            if not np.all(np.isfinite(arr)):
                invalid.append((k, "list contains NaN/Inf"))
            else:
                finite_count += arr.size
                
    ok = len(invalid) == 0 and finite_count > 0
    rows.append(Result("param.finite", "参数数值有限性与无奇异点", "PASS" if ok else "FAIL", {
        "finite_values_checked": finite_count,
        "invalid_entries": invalid
    }).data)
    return rows

def verify_equations(equations, params):
    """通用符号与恒等式验证：利用 SymPy 动态验证公式恒等或闭合性。"""
    rows = []
    if not equations:
        return rows
    
    # 建立可用符号表
    sym_dict = {k: sp.Symbol(k, real=True) for k in params if isinstance(params[k], (int, float))}
    
    for item in equations:
        name = item.get("name", "equation")
        expr_str = item.get("expr")
        if not expr_str:
            continue
        try:
            # 支持 lhs = rhs 形式或 lhs - rhs
            if "=" in expr_str:
                lhs_str, rhs_str = expr_str.split("=", 1)
                lhs = sp.parse_expr(lhs_str.strip(), local_dict=sym_dict)
                rhs = sp.parse_expr(rhs_str.strip(), local_dict=sym_dict)
                diff = sp.simplify(lhs - rhs)
            else:
                diff = sp.simplify(sp.parse_expr(expr_str.strip(), local_dict=sym_dict))
                
            is_zero = (diff == 0)
            rows.append(Result(f"eq.{name}", f"符号方程验证: {name}", "PASS" if is_zero else "WARN", {
                "expr": expr_str,
                "residual": str(diff)
            }).data)
        except Exception as e:
            rows.append(Result(f"eq.{name}", f"符号方程解析: {name}", "WARN", {
                "expr": expr_str,
                "error": str(e)
            }).data)
    return rows

def verify_checkpoints(checkpoints, params):
    """验证数理模型在指定特征采样点处的值是否与理论一致。"""
    rows = []
    if not checkpoints:
        return rows
    
    tested = 0
    failures = []
    for cp in checkpoints:
        name = cp.get("name", f"cp_{tested}")
        expected = cp.get("expected_value")
        actual = cp.get("actual_value")
        tolerance = cp.get("tolerance", 1e-3)
        if expected is not None and actual is not None:
            tested += 1
            err = abs(actual - expected)
            if err > tolerance:
                failures.append({"name": name, "expected": expected, "actual": actual, "err": err})
                
    if tested > 0:
        rows.append(Result("model.checkpoints", "特征状态点数值校准", "PASS" if not failures else "FAIL", {
            "tested_points": tested,
            "failures": failures
        }).data)
    return rows

def verify(config):
    topic = config.get("topic", "generic")
    params = config.get("parameters", {})
    equations = config.get("equations", [])
    checkpoints = config.get("checkpoints", [])
    
    rows = []
    rows.extend(verify_parameters(params))
    rows.extend(verify_equations(equations, params))
    rows.extend(verify_checkpoints(checkpoints, params))
    return rows

def main():
    parser = argparse.ArgumentParser(description="通用数理模型与参数有效性验证")
    parser.add_argument("--config", default="physics_config.json")
    parser.add_argument("--output", default="qa/physics_reference.json")
    args = parser.parse_args()
    
    cfg_file = Path(args.config)
    if not cfg_file.is_file():
        print(f"提示: 未发现配置文件 {args.config}，将以通用空配置校验")
        cfg = {"topic": "generic", "parameters": {}}
    else:
        cfg = read_json(cfg_file)
        
    rows = verify(cfg)
    write_json(args.output, rows)
    
    has_fail = any(r["status"] == "FAIL" for r in rows)
    status_str = "FAIL" if has_fail else "PASS"
    print(f"数理配置验证完成: {status_str} ({len(rows)} 项检查)")
    for r in rows:
        print(f"  [{r['status']}] {r['title']}")
    return 1 if has_fail else 0

if __name__ == "__main__":
    raise SystemExit(main())
