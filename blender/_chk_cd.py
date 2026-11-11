import bpy
from mathutils import Vector

# 崇德楼 = 楼20？先确认它和法学院（楼28_法学院）的位置
names = ['楼20', '楼28_法学院', '楼28_实验教学中心']
for n in names:
    o = bpy.data.objects.get(n)
    if not o:
        print('###', n, 'MISSING'); continue
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print(f'### {n} x[{min(p.x for p in ws):.1f},{max(p.x for p in ws):.1f}] y[{min(p.y for p in ws):.1f},{max(p.y for p in ws):.1f}] h={max(p.z for p in ws):.1f}')