import bpy
from mathutils import Vector
import bmesh

# 用户要的是「图书馆右侧的两个草丛里不要有树」。
# 那两块草 = 绿化面在 x -20.6..24.2 / y 66.9..111.8 附近的绿化区域
# （截图里两片被步道隔开的绿块）。把这些区域里的树删掉。

ob = bpy.data.objects['树林']
me = ob.data
bm = bmesh.new()
bm.from_mesh(me)

# 连通块
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

# 两个草块的大致范围（先粗圈，再按实际分布微调）
ZONES = [
    (-25, 30, 85, 118),   # 北块
    (-25, 30, 60, 85),    # 南块
]
def in_zone(cx, cy):
    for (x0, x1, y0, y1) in ZONES:
        if x0 <= cx <= x1 and y0 <= cy <= y1:
            return True
    return False

to_del = []
for c in clusters:
    pts = [ob.matrix_world @ v.co for v in c]
    cx = sum(p.x for p in pts) / len(pts)
    cy = sum(p.y for p in pts) / len(pts)
    if in_zone(cx, cy):
        to_del.extend(c)

print('### 将删除顶点数', len(to_del))
if to_del:
    bmesh.ops.delete(bm, geom=to_del, context='VERTS')
    bm.to_mesh(me)
    me.update()
    print('### 剩余顶点', len(me.vertices))
bm.free()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')