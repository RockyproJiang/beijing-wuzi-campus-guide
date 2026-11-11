import bpy
from mathutils import Vector

# 用户说「图书馆右侧的两个草丛不要有树」。图书馆 = 楼25 x[-136.5,-57.2] y[-114.7,-45.2]
# 在截图里那两块草是并排的两个小矩形 —— 找图书馆附近、形状像「两块并排小矩形」的绿化块。
LX1 = -57.2
cand = []
for ob in bpy.data.objects:
    if ob.type != 'MESH':
        continue
    if not (ob.name.startswith('绿化') or ob.name.startswith('广场') or ob.name.startswith('铺装')):
        continue
    ws = [ob.matrix_world @ v.co for v in ob.data.vertices]
    x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
    y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
    w, h = x1 - x0, y1 - y0
    # 小矩形：宽 10~40，高 5~25
    if 8 < w < 45 and 4 < h < 30:
        cand.append((abs(ob.matrix_world @ ob.data.vertices[0].co - Vector((LX1, -80, 0))), ob.name,
                     round(x0, 1), round(x1, 1), round(y0, 1), round(y1, 1)))
for c in sorted(cand)[:12]:
    print(f'### {c[1]:<12} x[{c[2]},{c[3]}] y[{c[4]},{c[5]}]')