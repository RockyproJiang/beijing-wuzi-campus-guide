import bpy
from mathutils import Vector

# 截图里图书馆右侧有一块绿色草地（带多面体树）。它在 three 坐标约 x 1000..1100 px
# 换算回世界坐标，对应「绿化面」上的树。找该区域的树对象。
# 图书馆在 x -136.5..-57.2 / y -114.7..-45.2，「右侧」= x 更大一侧，即 x > -57
# 从截图看那片草在北侧（y 更小，因为俯视图里 y 向下 = -z）
TREES = []
for ob in bpy.data.objects:
    if ob.type != 'MESH':
        continue
    if '树' not in ob.name:
        continue
    ws = [ob.matrix_world @ v.co for v in ob.data.vertices]
    x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
    y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
    TREES.append((ob.name, (x0 + x1) / 2, (y0 + y1) / 2, len(ws)))
print('### 树对象数', len(TREES))
big = sorted(TREES, key=lambda t: -t[3])[:6]
for t in big:
    print(f'### {t[0]:<14} center=({t[1]:.1f},{t[2]:.1f}) v={t[3]}')