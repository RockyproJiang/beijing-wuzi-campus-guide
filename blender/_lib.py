import bpy
from mathutils import Vector

# 图书馆 = 楼25；先找它的 bbox
o = bpy.data.objects.get('楼25')
ws = [o.matrix_world @ v.co for v in o.data.vertices]
LX0, LX1 = min(p.x for p in ws), max(p.x for p in ws)
LY0, LY1 = min(p.y for p in ws), max(p.y for p in ws)
print(f'### 图书馆 bbox x[{LX0:.1f},{LX1:.1f}] y[{LY0:.1f},{LY1:.1f}]')

# 找图书馆右侧（x > LX1）的两个绿化块
for ob in bpy.data.objects:
    if ob.type != 'MESH' or not ob.name.startswith('绿化'):
        continue
    ws2 = [ob.matrix_world @ v.co for v in ob.data.vertices]
    x0, x1 = min(p.x for p in ws2), max(p.x for p in ws2)
    y0, y1 = min(p.y for p in ws2), max(p.y for p in ws2)
    if x0 > LX1 - 40 and abs(y0 - (LY0 + LY1) / 2) < 120:
        print(f'### 绿化候选 {ob.name} x[{x0:.1f},{x1:.1f}] y[{y0:.1f},{y1:.1f}]')