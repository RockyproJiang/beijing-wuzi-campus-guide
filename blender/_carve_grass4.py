import bpy
from mathutils import Vector
import bmesh

ob = bpy.data.objects['绿化面']
me = ob.data
mw = ob.matrix_world

hard = [o for o in bpy.data.objects
        if o.type == 'MESH' and o.name.startswith(('广场', '铺装', '车行道', '人行道'))]

# 直接把硬化面三角化后收集为 2D 三角形，做精确点包含判断（比 ray_cast 稳）
tris = []
for o in hard:
    m = o.matrix_world
    o.data.calc_loop_triangles()
    for t in o.data.loop_triangles:
        pts = [m @ o.data.vertices[i].co for i in t.vertices]
        if abs(pts[0].z - pts[2].z) < 20 and abs(pts[1].z - pts[2].z) < 20:
            tris.append(((pts[0].x, pts[0].y), (pts[1].x, pts[1].y), (pts[2].x, pts[2].y)))
print('### 硬化三角形', len(tris))

# 网格加速：按 20m 分桶
from collections import defaultdict
BUCKET = 20.0
buckets = defaultdict(list)
def key(x, y):
    return (int(x // BUCKET), int(y // BUCKET))
for idx, t in enumerate(tris):
    xs = [p[0] for p in t]; ys = [p[1] for p in t]
    for bx in range(int(min(xs) // BUCKET), int(max(xs) // BUCKET) + 1):
        for by in range(int(min(ys) // BUCKET), int(max(ys) // BUCKET) + 1):
            buckets[(bx, by)].append(idx)

def point_in_tri(p, a, b, c):
    def s(pa, pb, pc):
        return (pa[0] - pc[0]) * (pb[1] - pc[1]) - (pb[0] - pc[0]) * (pa[1] - pc[1])
    d1 = s(p, a, b); d2 = s(p, b, c); d3 = s(p, c, a)
    neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (neg and pos)

def covered(x, y):
    for idx in buckets.get(key(x, y), ()):
        t = tris[idx]
        if point_in_tri((x, y), t[0], t[1], t[2]):
            return True
    return False

bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()
uvname = bm.loops.layers.uv.active.name
src = []
for f in bm.faces:
    pts = [mw @ v.co for v in f.verts]
    uvs = [l[bm.loops.layers.uv[uvname]].uv.copy() for l in f.loops]
    src.append((pts, uvs))
bmesh.ops.delete(bm, geom=list(bm.verts), context='VERTS')

STEP = 1.5
kept = 0

def emit(p0, p1, p2, u0, u1, u2):
    global kept
    vs = [bm.verts.new(p) for p in (p0, p1, p2)]
    try:
        nf = bm.faces.new(vs)
    except ValueError:
        return
    for k, uv in enumerate((u0, u1, u2)):
        nf.loops[k][bm.loops.layers.uv[uvname]].uv = uv
    kept += 1

def sub(p0, p1, p2, u0, u1, u2, depth):
    e = max((p0 - p1).length, (p1 - p2).length, (p2 - p0).length)
    c = (p0 + p1 + p2) / 3
    inc = covered(c.x, c.y)
    if not inc and e <= STEP:
        emit(p0, p1, p2, u0, u1, u2)
        return
    if inc and e <= 0.6:
        return
    if depth > 12:
        if not inc:
            emit(p0, p1, p2, u0, u1, u2)
        return
    m01 = (p0 + p1) / 2; a01 = (u0 + u1) / 2
    m12 = (p1 + p2) / 2; a12 = (u1 + u2) / 2
    m20 = (p2 + p0) / 2; a20 = (u2 + u0) / 2
    sub(p0, m01, m20, u0, a01, a20, depth + 1)
    sub(m01, p1, m12, a01, u1, a12, depth + 1)
    sub(m20, m12, p2, a20, a12, u2, depth + 1)
    sub(m01, m12, m20, a01, a12, a20, depth + 1)

for pts, uvs in src:
    if len(pts) == 3:
        sub(pts[0], pts[1], pts[2], uvs[0], uvs[1], uvs[2], 0)
    else:
        for i in range(1, len(pts) - 1):
            sub(pts[0], pts[i], pts[i + 1], uvs[0], uvs[i], uvs[i + 1], 0)

bm.to_mesh(me)
me.update()
bm.free()
print('### 保留面', kept, '顶点', len(me.vertices))
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')