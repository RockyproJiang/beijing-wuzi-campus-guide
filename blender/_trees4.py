import bpy
from mathutils import Vector
import bmesh

# 崇德楼 楼20 y[-56.2, 8.1]，法学院 楼28_法学院 y[-130.0,-113.4]
# 「崇德楼南面（y 更小）= -56 以南，法学院北面（y 更大）= -113 以北」
# 中间草地走廊：y 在 -113 ~ -56 之间，x 大致 -20 ~ 90
obj = bpy.data.objects['树林']
bm = bmesh.new()
bm.from_mesh(obj.data)
seen = set()
clusters = []
for v in bm.verts:
    if v.index in seen:
        continue
    stack = [v]
    comp = []
    seen.add(v.index)
    while stack:
        cur = stack.pop()
        comp.append(cur)
        for e in cur.link_edges:
            o = e.other_vert(cur)
            if o.index not in seen:
                seen.add(o.index)
                stack.append(o)
    clusters.append(comp)

zone = []
for c in clusters:
    pts = [obj.matrix_world @ v.co for v in c]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    if -30 < cx < 100 and -115 < cy < -55:
        zone.append((cx, cy, len(c)))
print('### 走廊里树数', len(zone))
if zone:
    xs = [z[0] for z in zone]; ys = [z[1] for z in zone]
    print(f'### x {min(xs):.1f}..{max(xs):.1f}  y {min(ys):.1f}..{max(ys):.1f}')
    for z in sorted(zone, key=lambda t: -t[1])[:8]:
        print(f'###   tree ({z[0]:.1f},{z[1]:.1f}) v={z[2]}')
bm.free()