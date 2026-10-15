"""沿用既有 A 风格的公共字阶、底色、标题与安全区组件。"""
COLOR_BG='#0c0d11'
COLOR_LINE='#E0E0E0'
COLOR_AXIS='#707070'
FS_TITLE=34
FS_SUBTITLE=22
FS_FORMULA_HERO=36
FS_FORMULA_MAIN=30
FS_FORMULA_SEC=24
FS_BODY_LARGE=22
FS_BODY_NORMAL=20
FS_TAG=18
SAFE_BOTTOM_UNITS=3.3
FONT='Microsoft YaHei'

def title_label(text,**kwargs):
    from manim import Text
    return Text(text,**{'font':FONT,'font_size':FS_TITLE,**kwargs})

def formula_panel(tex,**kwargs):
    from manim import MathTex,SurroundingRectangle,VGroup
    formula=MathTex(tex,**{'font_size':FS_FORMULA_MAIN,**kwargs})
    return VGroup(formula,SurroundingRectangle(formula,buff=.18))
