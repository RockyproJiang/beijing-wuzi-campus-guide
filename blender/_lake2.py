import bpy
from mathutils import Vector
import random
from collections import defaultdict

o = bpy.data.objects['湖01']
ws = [o.matrix_world @ v.co for v in o.data.vertices]
x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
print('### 湖01 x', round(x0, 1), round(x1, 1), 'y', round(y0, 1), round(y1, 1),
      'z', sorted({round(p.z, 3) for p in ws}), 'verts', len(ws))
print('### mats', [m.name for m in o.data.materials])

depsgraph = bpy.context.evaluated_depsgraph_get()
scene = bpy.context.scene
random.seed(1)
cnt = defaultdict(int)
total = 0
for _ in range(300):
    x = random.uniform(x0 + 1, x1 - 1)
    y = random.uniform(y0 + 1, y1 - 1)
    origin = Vector((x, y, 60.0))
    d = Vector((0, 0, -1))
    r = scene.ray_cast(depsgraph, origin, d)
    if r[0]:
        total += 1
        cnt[(r[4].name, round(r[1].z, 3))] += 1
print('### 命中', total, '/ 300')
for k, v in sorted(cnt.items(), key=lambda kv: -kv[1]):
    print(f'    {k[0]:<16} z={k[1]:<6} {v}')