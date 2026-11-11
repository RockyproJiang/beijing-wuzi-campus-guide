import bpy
from mathutils import Vector
import bmesh

# 根本方案：草坪三角面与铺装大面积重叠，靠 z 或 renderOrder 都不稳。
# 改成「草坪 = 只在没有硬化面的地方出现」：
#   逐面细分，把每个大三角形按 3m 网格切成小三角，保留「中心不在硬化面上」的部分。
# 这样草地和铺装不再重叠，任何角度都稳定。

ob = bpy.data.objects['绿化面']
me = ob.data
mw = ob.matrix_world

hard = [o for o in bpy.data.objects
        if o.type == 'MESH' and o.name.startswith(('广场', '铺装', '车行道', '人行道'))]
print('### 硬化对象', len(hard))

cache = {}
def covered(x, y):
    key = (round(x / 2.0), round(y / 2.0))
    if key in cache:
        return cache[key]
    res = False
    for o in hard:
        moi = o.matrix_world.inverted()
        loc = moi @ Vector((x, y, 200.0))
        direc = moi.to_3x3() @ Vector((0, 0, -1))
        hit, *_ = o.ray_cast(loc, direc, distance=400.0)
        if hit:
            res = True
            break
    cache[key] = res
    return res

bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()

src_faces = [(f, [mw @ v.co for v in f.verts]) for f in bm.faces]
uv_layer = bm.loops.layers.uv.active.name
src_uvs = []
for f, _ in src_faces:
    src_uvs.append([l[bm.loops.layers.uv[bm.loops.layers.uv.active.name]].uv.copy() for l in f.loops])

# 清空重建
bmesh.ops.delete(bm, geom=list(bm.verts), context='VERTS')

STEP = 10.0
kept = 0
made = 0

def sub_tri(p0, p1, p2, uv0, uv1, uv2, depth):
    """递归细分三角形到边长 < STEP，保留中心不在硬化面上的三角形"""
    global kept, made
    made += 1
    c = (p0 + p1 + p2) / 3
    e = max((p0 - p1).length, (p1 - p2).length, (p2 - p0).length)
    # 先粗判：三个顶点都在硬化面内 → 整块丢弃，不再细分
    if depth > 0 and covered(p0.x, p0.y) and covered(p1.x, p1.y) and covered(p2.x, p2.y):
        return
    # 三个顶点都不在硬化面 → 整块保留，不再细分
    if depth > 0 and not covered(p0.x, p0.y) and not covered(p1.x, p1.y) and not covered(p2.x, p2.y) and e <= 120:
        vs = [bm.verts.new(p) for p in (p0, p1, p2)]
        try:
            nf = bm.faces.new(vs)
        except ValueError:
            return
        for k, uv in enumerate((uv0, uv1, uv2)):
            nf.loops[k][bm.loops.layers.uv[uv_layer]].uv = uv
        global kept
        kept += 1
        return
    if e <= STEP or depth > 5:
        if not covered(c.x, c.y):
            vs = [bm.verts.new(p) for p in (p0, p1, p2)]
            try:
                nf = bm.faces.new(vs)
            except ValueError:
                return
            for k, uv in enumerate((uv0, uv1, uv2)):
                nf.loops[k][bm.loops.layers.uv[uv_layer]].uv = uv
            kept += 1
        return
    m01 = (p0 + p1) / 2; u01 = (uv0 + uv1) / 2
    m12 = (p1 + p2) / 2; u12 = (uv1 + uv2) / 2
    m20 = (p2 + p0) / 2; u20 = (uv2 + uv0) / 2
    sub_tri(p0, m01, m20, uv0, u01, u20, depth + 1)
    sub_tri(m01, p1, m12, u01, uv1, u12, depth + 1)
    sub_tri(m20, m12, p2, u20, u12, uv2, depth + 1)
    sub_tri(m01, m12, m20, u01, u12, u20, depth + 1)

for (f, pts), uvs in zip(src_faces, src_uvs):
    if len(pts) == 3:
        sub_tri(pts[0], pts[1], pts[2], uvs[0], uvs[1], uvs[2], 0)
    else:
        # 扇形拆三角
        for i in range(1, len(pts) - 1):
            sub_tri(pts[0], pts[i], pts[i + 1], uvs[0], uvs[i], uvs[i + 1], 0)

print('### 细分尝试', made, '保留', kept)
bm.to_mesh(me)
me.update()
bm.free()
print('### 绿化面 现在 v=%d p=%d' % (len(me.vertices), len(me.polygons)))
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')