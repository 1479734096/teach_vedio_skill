"""AM 统一字阶，只对 AM 生效；当前 A 字阶各加 2pt。"""
import json
from pathlib import Path
PRESENTATION=json.loads((Path(__file__).resolve().parents[1]/"physics_config.json").read_text(encoding="utf-8"))["presentation"]
def F(role):
    return PRESENTATION["font_pt"][role]
