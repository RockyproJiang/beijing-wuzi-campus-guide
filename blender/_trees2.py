import bpy
from mathutils import Vector

# 所有树都在「树林」这一个对象里（11660 个顶点，多个独立小树）。
# 找出落在图书馆右侧那片草地上的树，然后删掉。
# 图书馆 bbox x[-136.5,-57.2] y[-114.7,-45.2]
# 截图显示那片草在图书馆的东侧偏北；先按 x -60..10, y -140..-40 圈定，再细调

obj = bpy.data.objects['树林']
ws = [(obj.matrix_world @ v.co) for v in obj.data.vertices]
x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
print(f'### 树林 bbox x[{x0:.1f},{x1:.1f}] y[{y0:.1f},{y1:.1f}] z[{min(p.z for p in ws):.2f},{max(p.z for p in ws):.2f}]')

# 按顶点聚成孤立小树
import bmesh
bm = bmesh.new()
bm.from_mesh(obj.data)
# 找连通块
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
print('### 连通块数', len(clusters))
info = []
for c in clusters:
    pts = [obj.matrix_world @ v.co for v in c]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    info.append((len(c), cx, cy))
# 只打印在图书馆附近的
near = [i for i in info if -170 < i[1] < 30 and -160 < i[2] < 20]
print('### 图书馆附近树数', len(near))
for n, cx, cy in sorted(near, key=lambda t: -t[1])[:40]:
    print(f'### tree v={n:<5} center=({cx:.1f},{cy:.1f})')
bm.free()