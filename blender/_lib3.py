import bpy
from mathutils import Vector

# 列出所有绿化对象及其 bbox，找图书馆附近的
for ob in bpy.data.objects:
    if ob.type != 'MESH' or not ob.name.startswith('绿化'):
        continue
    ws = [ob.matrix_world @ v.co for v in ob.data.vertices]
    x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
    y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
    print(f'### {ob.name:<10} x[{x0:.1f},{x1:.1f}] y[{y0:.1f},{y1:.1f}] v={len(ws)}')