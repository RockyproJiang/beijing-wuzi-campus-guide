import bpy
from mathutils import Vector

# 用射线逐点扫描：在若干采样点上，从高空向下打，看谁在最上面（排除楼体）
# 目的：确认草坪（绿化面）在道路/广场上是否「突出来」
import bpy

# 采样网格：整个校区范围
XS = [-240, -180, -120, -60, 0, 60, 120, 200, 260]
YS = [240, 180, 120, 60, 0, -60, -120, -180, -240, -300]

deps = bpy.context.evaluated_depsgraph_get()
scene = bpy.context.scene

def top_at(x, y):
    best = None
    origin = Vector((x, y, 60))
    direction = Vector((0, 0, -1))
    for o in bpy.data.objects:
        if o.type != 'MESH':
            continue
        n = o.name
        if not (n.startswith(('绿化', '广场', '铺装', '车行道', '人行道', '湖', '校园轮廓'))):
            continue
        hit, loc, nor, idx = o.ray_cast(o.matrix_world.inverted() @ origin, o.matrix_world.inverted().to_3x3() @ direction)
        if hit:
            wz = (o.matrix_world @ loc).z
            if best is None or wz > best[1]:
                best = (n, wz)
    return best

print('### 采样点「最上层」统计')
grass_over_road = 0
total = 0
samples = []
for x in XS:
    for y in YS:
        t = top_at(x, y)
        total += 1
        if not t:
            continue
        samples.append((x, y, t[0], round(t[1], 3)))
        if t[0].startswith(('绿化', '广场')) and t[0].startswith('绿化'):
            grass_over_road += 1
from collections import Counter
c = Counter(s[2] for s in samples)
for k, v in c.most_common():
    print(f'###  {k}: {v}')
print('### 总采样', total, '命中', len(samples))
# 打印几处绿化在最上的点
g = [s for s in samples if s[2].startswith('绿化')]
print('### 绿化在最上的点', len(g), g[:12])