import bpy
from mathutils import Vector
import bmesh

# 图书馆（楼25）x[-136.5,-57.2] y[-114.7,-45.2]。
# 截图里那片草在图书馆东侧（x 更大）偏北（y 更大 = 上方？快照里上方是 +y）。
# 先看 x 在 -60..30、y 在 -50..120 这个范围里有多少树。
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

inzone = []
for c in clusters:
    pts = [obj.matrix_world @ v.co for v in c]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    if -60 < cx < 30 and -50 < cy < 130:
        inzone.append((cx, cy, len(c)))
print('### 区域 (-60..30, -50..130) 树数', len(inzone))
xs = [c[0] for c in inzone]; ys = [c[1] for c in inzone]
if inzone:
    print(f'### x {min(xs):.1f}..{max(xs):.1f}  y {min(ys):.1f}..{max(ys):.1f}')
bm.free()