import bpy
from mathutils import Vector
import random

X0, X1, Y0, Y1 = 262.6, 268.7, 77.4, 80.1
depsgraph = bpy.context.evaluated_depsgraph_get()
scene = bpy.context.scene
random.seed(0)

# 沿每条水平射线，记录所有命中层（不只是第一个），看哪里出现「同一位置两层都露出来」
from collections import defaultdict
layers = defaultdict(set)
for _ in range(200):
    x = random.uniform(X0, X1)
    y = random.uniform(Y0, Y1)
    origin = Vector((x, y, 60.0))
    direction = Vector((0, 0, -1))
    # 手动逐层扫描
    left = scene.ray_cast(depsgraph, origin, direction)
    while left[0]:
        hit, loc, normal, idx, obj, mw = left
        layers[(round(x, 1), round(y, 1))].add((obj.name, round(loc.z, 3)))
        origin = loc + Vector((0, 0, -0.001))
        left = scene.ray_cast(depsgraph, origin, direction)

stacked = {k: v for k, v in layers.items() if len(v) > 1}
print('### 采样点总数', len(layers), '有叠层的点', len(stacked))
for k, v in list(stacked.items())[:8]:
    print('   ', k, sorted(v))
# 统计每层出现在多少点
cnt = defaultdict(int)
for k, v in layers.items():
    for name, z in v:
        if z > 1.5:
            continue
        cnt[(name, z)] += 1
print('### 各层出现次数:')
for (n, z), c in sorted(cnt.items(), key=lambda kv: kv[0][1]):
    print(f'    {n:<20} z={z:<6} {c}')