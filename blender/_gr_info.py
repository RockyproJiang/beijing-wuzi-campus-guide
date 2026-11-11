import bpy
from mathutils import Vector
import bmesh

ob = bpy.data.objects['绿化面']
me = ob.data
mw = ob.matrix_world
bm = bmesh.new()
bm.from_mesh(me)
bm.faces.ensure_lookup_table()

# 看看每个面的面积与中心，面是否「跨」在硬化面上
inv = mw.inverted()
def hit_any(x, y):
    for o in bpy.data.objects:
        if o.type != 'MESH' or not o.name.startswith(('广场', '铺装', '车行道', '人行道')):
            continue
        moi = o.matrix_world.inverted()
        loc = moi @ Vector((x, y, 200.0))
        direc = moi.to_3x3() @ Vector((0, 0, -1))
        h, _, _, _ = o.ray_cast(loc, direc, distance=400.0)
        if h:
            return o.name
    return None

areas = sorted(((f.calc_area(), f.index) for f in bm.faces), reverse=True)[:12]
for a, idx in areas:
    f = bm.faces[idx]
    pts = [mw @ v.co for v in f.verts]
    c = sum(pts, Vector()) / len(pts)
    hit = hit_any(c.x, c.y)
    print(f'### face {idx} area={a:.0f} n={len(f.verts)} center=({c.x:.1f},{c.y:.1f}) hit={hit}')
bm.free()