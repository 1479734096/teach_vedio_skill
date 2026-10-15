"""通用理科教学动画工程初始化脚本。
支持任意数理课题、支持工作区内自由目录路径，可从已有范例参考初始化或生成全新工程脚手架。
"""
from pathlib import Path
import argparse
import json
import shutil
import sys

SKILL = Path(__file__).resolve().parents[1]

def init_project(target_dir, topic=None, title=None, from_example=False):
    topic = topic or "generic_stem"
    target = Path(target_dir).resolve()
    target.mkdir(parents=True, exist_ok=True)
    
    # 检查是否匹配内置参考范例
    example = SKILL / "examples" / topic
    use_example = from_example or (example.is_dir() and topic not in ("generic", "generic_stem"))
    
    scripts_dest = target / "scripts"
    scripts_dest.mkdir(exist_ok=True)
    
    # 复制通用构建与质检助手
    for name in ("build_video.py", "qa_gate.py", "verify_physics.py", "extract_keyframes.py", "components.py", "qa_evidence.py", "qa_plot.py", "qa_runtime.py"):
        src = SKILL / "scripts" / name
        if src.is_file():
            shutil.copy2(src, scripts_dest / name)
            
    src_dir = target / "src"
    src_dir.mkdir(exist_ok=True)
    
    if use_example and example.is_dir():
        print(f"正在基于参考范例 [{topic}] 初始化工程...")
        # 复制示例内容
        for item in example.iterdir():
            if item.is_dir():
                shutil.copytree(item, target / item.name, dirs_exist_ok=True)
            elif item.is_file():
                shutil.copy2(item, target / item.name)
    else:
        print(f"正在初始化全新理科教学工程: [{topic}]...")
        # 复制脚手架模板
        templates = SKILL / "templates"
        
        # 1. 样式与组件
        if (templates / "style.template.py").is_file():
            shutil.copy2(templates / "style.template.py", src_dir / "style.py")
        if (SKILL / "scripts" / "components.py").is_file():
            shutil.copy2(SKILL / "scripts" / "components.py", src_dir / "components.py")
        if (SKILL / "scripts" / "qa_runtime.py").is_file():
            shutil.copy2(SKILL / "scripts" / "qa_runtime.py", src_dir / "qa_runtime.py")
        if (SKILL / "scripts" / "qa_plot.py").is_file():
            shutil.copy2(SKILL / "scripts" / "qa_plot.py", src_dir / "qa_plot.py")
            
        # 2. 初始场景 Scene1
        scene_tmpl = templates / "scene.template.py"
        scene_dest = src_dir / "scene1_intro.py"
        if scene_tmpl.is_file() and not scene_dest.exists():
            code = scene_tmpl.read_text(encoding="utf-8")
            display_title = title or topic
            code = code.replace("教学场景标题", display_title)
            scene_dest.write_text(code, encoding="utf-8")
            
        # 3. 数理配置文件
        cfg = {
            "project_name": topic,
            "topic": topic,
            "title": title or topic,
            "parameters": {
                "amplitude": 1.0,
                "frequency": 1.0,
                "time_scale": 1.0
            },
            "equations": [
                {
                    "name": "governing_equation",
                    "expr": "y = amplitude * sin(2 * pi * frequency * t)"
                }
            ],
            "checkpoints": []
        }
        cfg_path = target / "physics_config.json"
        if not cfg_path.exists():
            cfg_path.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), encoding="utf-8")
            
        # 4. 教学分镜 Specification
        spec_path = target / "lesson_spec.md"
        if not spec_path.exists():
            spec_path.write_text(f"""# 课程设计规范: {title or topic}

## 1. 教学目标与核心顿悟 (Aha! Moment)
- **主题**：{title or topic}
- **受众定位**：大学理工科 / 高中数理先修
- **核心顿悟**：通过动态几何直觉呈现抽象代数背后的物理本质。

## 2. 分镜头规划 (Storyboard)

| 幕次 | 时长 | 景别构图 | 视觉主体与动态事件 | 屏幕公式与说明 | 教学目标 |
|---|---|---|---|---|---|
| Scene 1 | 8~12s | 全景固定 | 坐标系入场，物理参数激发演化 | 核心课题引入 | 提出悬念与几何直觉 |
| Scene 2 | 12~18s | 分区对比 | 动态曲线推演、ValueTracker 联动 | 代数公式逐步推导 | 严密数学描述 |
| Scene 3 | 8~10s | 结构卡片 | 关键特征量分析，总结卡片定格 | 核心定理卡片 | 结构化沉淀与复盘 |
""", encoding="utf-8")
            
    # 补充必要辅助文件
    (target / "qa").mkdir(exist_ok=True)
    readme = target / "README.md"
    if not readme.exists():
        readme.write_text(f"""# 理科教学动画工程: {title or topic}

## 快速渲染与质检
```bash
# 1. 渲染视频 (高清 1080p30)
python scripts/build_video.py --project-dir . --quality high

# 2. 自动化三层通用质检
python scripts/qa_gate.py --project-dir .

# 3. 提取代表性关键帧预览
python scripts/extract_keyframes.py --video final.mp4 --out qa/keyframes_preview.jpg
```
""", encoding="utf-8")
        
    print(f"已就绪理科教学动画工程: {target}")
    return 0

def main():
    p = argparse.ArgumentParser(description="通用理科教学动画工程初始化")
    p.add_argument("--target", required=True, help="目标工程目录路径")
    p.add_argument("--topic", default=None, help="课题名称（如 damped_oscillation，或示例名称）")
    p.add_argument("--title", default=None, help="展示用课程标题")
    p.add_argument("--from-example", action="store_true", help="强制从同名范例初始化")
    args = p.parse_args()
    return init_project(args.target, args.topic, args.title, args.from_example)

if __name__ == "__main__":
    raise SystemExit(main())
