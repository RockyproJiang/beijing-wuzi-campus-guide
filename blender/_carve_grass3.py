import bpy
from mathutils import Vector
import bmesh

# 把「草坪与铺装重叠」的残留面再切细：凡是面中心落在硬化面上的，继续细分剔除。
ob = bpy.data.objects['绿化面']
me = ob.data
mw = ob.matrix_world

hard = [o for o in bpy.data.objects
        if o.type == 'MESH' and o.name.startswith(('广场', '铺装', '车行道', '人行道'))]

cache = {}
def covered(x, y):
    key = (round(x / 1.5), round(y / 1.5))
    if key in cache:
        return cache[key]
    res = False
    for o in hard:
        moi = o.matrix_world.inverted()
        loc = moi @ Vector((x, y, 200.0))
        d = moi.to_3x3() @ Vector((0, 0, -1))
        h, *_ = o.ray_cast(loc, d, distance=400.0)
        if h:
            res = True
            break
    cache[key] = res
    return res

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

STEP = 6.0
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
    c = (p0 + p1 + p2) / 3
    e = max((p0 - p1).length, (p1 - p2).length, (p2 - p0).length)
    if covered(c.x, c.y):
        if e <= 1.2 or depth > 9:
            return
    else:
        if e <= STEP or depth > 9 or not (covered(p0.x, p0.y) or covered(p1.x, p1.y) or covered(p2.x, p2.y)):
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