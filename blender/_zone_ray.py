import bpy, bmesh
from mathutils import Vector

# 用射线判断用户圈的区域 (x 262.6..268.7, y 77.4..80.1) 表面到底属于哪一层
X0, X1, Y0, Y1 = 262.6, 268.7, 77.4, 80.1
names = ['绿化面', '广场01', '车行道01', '人行道06', '校园轮廓', '基座']
depsgraph = bpy.context.evaluated_depsgraph_get()
scene = bpy.context.scene

import random
random.seed(0)
hits = {}
for _ in range(120):
    x = random.uniform(X0, X1)
    y = random.uniform(Y0, Y1)
    origin = Vector((x, y, 60.0))
    direction = Vector((0, 0, -1))
    hit, loc, normal, idx, obj, mw = scene.ray_cast(depsgraph, origin, direction)
    if hit:
        key = obj.name
        hits.setdefault(key, []).append(round(loc.z, 3))

for k, v in sorted(hits.items(), key=lambda kv: -len(kv[1])):
    print(f'### {k:<20} hits={len(v):3d} z={sorted(set(v))}')
missing = [n for n in names if n not in hits]
print('### 未被命中:', missing)