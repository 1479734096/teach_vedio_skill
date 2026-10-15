"""理科教学动画常用视觉布局与排版组件库（适用于 ManimCE）。
提供标准字阶、底色、分屏、看板、公式高亮与推导组件，支持 Agent 灵活微调与自定义。
"""
from manim import *
import numpy as np

# ── 1. 基础视觉常量（3b1b 经典深色主题） ─────────────────────────────────────
COLOR_BG = "#0c0d11"          # 经典深色黑板底色
COLOR_LINE = "#E0E0E0"        # 机械/坐标高亮白
COLOR_AXIS = "#707070"        # 轴线与网格暗灰
COLOR_PRIMARY = "#58C4DD"     # BLUE_C: 主信号/输入量
COLOR_SECONDARY = "#FC6255"   # RED_C: 响应量/次级信号
COLOR_HIGHLIGHT = "#FFFF00"   # PURE_YELLOW: 核心结论/焦点公式
COLOR_ENVELOPE = "#5CD0B3"    # TEAL_C: 几何轮廓/包络线
COLOR_ACCENT_1 = "#83C167"    # GREEN_C: 正向特征/波腹/极值
COLOR_ACCENT_2 = "#FF8C00"    # ORANGE: 负向特征/节点/耗散

# ── 2. 统一字阶规范 ──────────────────────────────────────────────────────────
FS_TITLE = 34
FS_SUBTITLE = 22
FS_FORMULA_HERO = 36
FS_FORMULA_MAIN = 30
FS_FORMULA_SEC = 24
FS_BODY_LARGE = 22
FS_BODY_NORMAL = 20
FS_TAG = 18

FONT_FAMILY = "Microsoft YaHei"
SAFE_BOTTOM_UNITS = 3.3  # Y=-3.3 以下为字幕保留区

# ── 3. 常用教学排版组件 ──────────────────────────────────────────────────────

def create_header(title_text, subtitle_text=None, top_buff=0.35):
    """创建标准课程顶部标题栏，保证安全边距与层级结构。"""
    title = Text(title_text, font=FONT_FAMILY, font_size=FS_TITLE, color=WHITE)
    title.to_edge(UP, buff=top_buff)
    if subtitle_text:
        subtitle = Text(subtitle_text, font=FONT_FAMILY, font_size=FS_SUBTITLE, color=GRAY_B)
        subtitle.next_to(title, DOWN, buff=0.15)
        return VGroup(title, subtitle)
    return title

def formula_card(tex_string, label=None, font_size=FS_FORMULA_MAIN, color=COLOR_HIGHLIGHT, buff=0.2):
    """带圆角背景框与可选标题标签的核心公式展示卡片。"""
    formula = MathTex(tex_string, font_size=font_size, color=color)
    box = RoundedRectangle(corner_radius=0.12, width=formula.width + buff*2,
                           height=formula.height + buff*2,
                           color=COLOR_LINE, stroke_width=1.5,
                           fill_color="#181a20", fill_opacity=0.75)
    box.move_to(formula)
    group = VGroup(box, formula)
    if label:
        lbl = Text(label, font=FONT_FAMILY, font_size=FS_TAG, color=GRAY_B)
        lbl.next_to(box, UP, buff=0.1, aligned_edge=LEFT)
        return VGroup(lbl, group)
    return group

def parameter_hud(param_dict, title="参数看板", font_size=FS_TAG):
    """用于右上角或左下角实时显示物理/数学模型参数的 HUD 面板。"""
    lines = [f"{k}: {v}" for k, v in param_dict.items()]
    content = VGroup(*[Text(line, font="Consolas", font_size=font_size, color=COLOR_LINE) for line in lines])
    content.arrange(DOWN, aligned_edge=LEFT, buff=0.12)
    
    header = Text(title, font=FONT_FAMILY, font_size=font_size + 2, color=COLOR_PRIMARY)
    header.next_to(content, UP, aligned_edge=LEFT, buff=0.15)
    
    body = VGroup(header, content)
    bg = RoundedRectangle(corner_radius=0.1, width=body.width + 0.35,
                          height=body.height + 0.3, color=GRAY_D,
                          stroke_width=1.0, fill_color="#101216", fill_opacity=0.85)
    bg.move_to(body)
    return VGroup(bg, body)

def split_screen_layout(left_mobj, right_mobj, center_x=0.0, buff=1.0):
    """快速实现左右 50/50 分屏对比构图。"""
    left_mobj.to_edge(LEFT, buff=buff)
    right_mobj.to_edge(RIGHT, buff=buff)
    return VGroup(left_mobj, right_mobj)

def callout_pointer(target_point_or_mobj, text, direction=UP, buff=0.3):
    """指向关键数理特征（如极值点、拐点、共振峰）的标注箭头与说明。"""
    label = Text(text, font=FONT_FAMILY, font_size=FS_TAG, color=COLOR_HIGHLIGHT)
    target = target_point_or_mobj.get_center() if isinstance(target_point_or_mobj, Mobject) else target_point_or_mobj
    label.next_to(target, direction, buff=buff + 0.35)
    arrow = Arrow(start=label.get_edge_center(-direction), end=target,
                  buff=0.08, stroke_width=2.5, max_tip_length_to_length_ratio=0.25,
                  color=COLOR_HIGHLIGHT)
    return VGroup(arrow, label)

def takeaway_card(bullet_points, title="核心要点沉淀"):
    """片尾结构化结论沉淀卡片。"""
    title_mob = Text(title, font=FONT_FAMILY, font_size=FS_SUBTITLE, color=COLOR_HIGHLIGHT)
    bullets = []
    for pt in bullet_points:
        t = Text(f"• {pt}", font=FONT_FAMILY, font_size=FS_BODY_NORMAL, color=WHITE)
        bullets.append(t)
    b_group = VGroup(*bullets).arrange(DOWN, aligned_edge=LEFT, buff=0.2)
    b_group.next_to(title_mob, DOWN, aligned_edge=LEFT, buff=0.3)
    
    total = VGroup(title_mob, b_group)
    bg = RoundedRectangle(corner_radius=0.15, width=total.width + 0.6,
                          height=total.height + 0.5, color=COLOR_PRIMARY,
                          stroke_width=2.0, fill_color="#12141a", fill_opacity=0.92)
    bg.move_to(total)
    return VGroup(bg, total)
