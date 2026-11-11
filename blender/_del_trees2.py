import bpy
from mathutils import Vector
import bmesh

# 用户 m18487：崇德楼南面、法学院北面之间那块草丛里不要树。
# 崇德楼 楼20 y[-56.2, 8.1]；法学院 楼28_法学院 y[-130.0,-113.4]
# 走廊 y -113..-56，x -30..100 → 124 棵（实测 x -19.3..95.7, y -111.8..-66.3）
obj = bpy.data.objects['树林']
me = obj.data
bm = bmesh.new()
bm.from_mesh(me)

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

to_del = []
for c in clusters:
    pts = [obj.matrix_world @ v.co for v in c]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    if -30 < cx < 100 and -115 < cy < -55:
        to_del.extend(c)

print('### 删除顶点', len(to_del), '棵树 ≈', len(to_del) // 10)
if to_del:
    bmesh.ops.delete(bm, geom=to_del, context='VERTS')
    bm.to_mesh(me)
    me.update()
    print('### 剩余顶点', len(me.vertices))
bm.free()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')