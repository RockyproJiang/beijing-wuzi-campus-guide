import bpy
from mathutils import Vector
import bmesh

# 问题：绿化面 是一张 130 面的大片，和广场/铺装只差 5cm，任何角度都可能被盖住或盖住别人。
# 方案：把「有硬化面」的地方从绿化面里挖掉 → 草坪变成「无洞不成面」的真实形状，
# 于是不再和铺装争夺深度（两者完全不重叠），任何角度都稳定。

ob = bpy.data.objects['绿化面']
me = ob.data
mw = ob.matrix_world
mwi = mw.inverted()

# 收集所有硬化面的世界 XY 三角形（广场/铺装/车行道/人行道），用射线法判断点在不在铺装里
hard = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    if not o.name.startswith(('广场', '铺装', '车行道', '人行道')):
        continue
    hard.append(o)

print('### 硬化对象', len(hard))

def inside_hard(x, y):
    """点 (x,y) 是否落在任意硬化面的水平投影内"""
    for o in hard:
        moi = o.matrix_world.inverted()
        loc = moi @ Vector((x, y, 200.0))
        direc = (moi.to_3x3() @ Vector((0, 0, -1)))
        hit, hloc, nor, idx = o.ray_cast(loc, direc, distance=400.0)
        if hit:
            return True
    return False

# 对每个面细分采样，判断整面是否全在铺装里 → 全在就删
bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()

delete_faces = []
for f in bm.faces:
    pts = [mw @ v.co for v in f.verts]
    c = sum(pts, Vector()) / len(pts)
    # 中心 + 四角采样
    samples = [c] + pts
    if all(inside_hard(p.x, p.y) for p in samples):
        delete_faces.append(f)

print('### 待删除面', len(delete_faces), '/', len(bm.faces))
if delete_faces:
    bmesh.ops.delete(bm, geom=delete_faces, context='FACES')
    bm.to_mesh(me)
    me.update()
    print('### 剩余面', len(me.polygons), '顶点', len(me.vertices))
bm.free()
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')