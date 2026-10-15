"""通用 Canvas 黑板教学动画工程初始化脚本。
支持任意理科/工科课题、支持工作区内自由目录路径，可从已有范例参考初始化或生成全新黑板仿真工程。
"""
from pathlib import Path
import argparse
import json
import shutil
import sys

SKILL = Path(__file__).resolve().parents[1]

def init_project(target_dir, topic=None, title=None, from_example=False):
    topic = topic or "generic_canvas"
    target = Path(target_dir).resolve()
    target.mkdir(parents=True, exist_ok=True)
    
    example = SKILL / "examples" / topic
    use_example = from_example or (example.is_dir() and topic not in ("generic", "generic_canvas"))
    
    qa_dir = target / "qa"
    qa_dir.mkdir(exist_ok=True)
    
    # 复制通用质检助手到 qa/
    for name in ("qa_gate.py", "extract_keyframes.py", "qa_evidence.py", "screen_checks.py", "layout_checks.py", "profile_checks.py"):
        src = SKILL / "scripts" / name
        if src.is_file():
            shutil.copy2(src, qa_dir / name)
            
    # 复制核心渲染引擎到 src/
    src_dir = target / "src"
    src_dir.mkdir(exist_ok=True)
    engine_dir = SKILL / "scripts" / "engine"
    if engine_dir.is_dir():
        shutil.copytree(engine_dir, src_dir, dirs_exist_ok=True, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
        
    if use_example and example.is_dir():
        print(f"正在基于参考范例 [{topic}] 初始化 Canvas 工程...")
        for item in example.iterdir():
            if item.is_dir():
                shutil.copytree(item, target / item.name, dirs_exist_ok=True)
            elif item.is_file():
                shutil.copy2(item, target / item.name)
    else:
        print(f"正在初始化全新 Canvas 黑板理科教学工程: [{topic}]...")
        cfg = {
            "project_name": topic,
            "topic": topic,
            "title": title or topic,
            "parameters": {
                "amplitude": 100.0,
                "frequency_hz": 1.0,
                "sim_speed": 1.0
            }
        }
        cfg_str = json.dumps(cfg, ensure_ascii=False, indent=2)
        (target / "physics_config.json").write_text(cfg_str, encoding="utf-8")
        (src_dir / "physics_config.json").write_text(cfg_str, encoding="utf-8")
        (src_dir / "physics_config.js").write_text(f"window.PHYSICS_CONFIG = {cfg_str};\n", encoding="utf-8")
        
        spec = {
            "title": title or topic,
            "physics": cfg,
            "shots": [
                {"id": "intro", "duration_s": 8.0, "label": "概念引入与物理场建立"},
                {"id": "simulation", "duration_s": 15.0, "label": "连续动态仿真与参数响应"},
                {"id": "summary", "duration_s": 7.0, "label": "核心要点定格总结"}
            ]
        }
        (target / "animation_spec.json").write_text(json.dumps(spec, ensure_ascii=False, indent=2), encoding="utf-8")
        
        # 教学分镜说明
        (target / "lesson_spec.md").write_text(f"""# Canvas 课程设计规范: {title or topic}

## 1. 核心教学目标
- **课题**：{title or topic}
- **呈现形式**：Canvas 交互黑板、实时数值仿真与动态波形场。

## 2. 镜头分段 (Shots)
- **Shot 1 (0~8s)**：黑板网格坐标系建立，初始模型激发。
- **Shot 2 (8~23s)**：微分方程/物理规律连续演化，动态参数交互。
- **Shot 3 (23~30s)**：要点沉淀与公式卡片展示。
""", encoding="utf-8")

    readme = target / "README.md"
    if not readme.exists():
        readme.write_text(f"""# Canvas 黑板教学动画工程: {title or topic}

## 快速渲染与质检
```bash
# 1. 运行渲染器导出视频 (1080p30)
python src/render.py --out final.mp4

# 2. 自动化三层通用质检
python qa/qa_gate.py --project-dir .

# 3. 提取关键帧长图画册预览
python qa/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
```
""", encoding="utf-8")
        
    print(f"已就绪 Canvas 教学动画工程: {target}")
    return 0

def main():
    p = argparse.ArgumentParser(description="通用 Canvas 黑板教学工程初始化")
    p.add_argument("--target", required=True, help="目标工程目录")
    p.add_argument("--topic", default=None, help="课题名称（或范例名称）")
    p.add_argument("--title", default=None, help="课程标题")
    p.add_argument("--from-example", action="store_true", help="强制从同名范例复制")
    args = p.parse_args()
    return init_project(args.target, args.topic, args.title, args.from_example)

if __name__ == "__main__":
    raise SystemExit(main())
