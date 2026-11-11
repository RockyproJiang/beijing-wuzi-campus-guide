import bpy
from mathutils import Vector

# 采样验证：草坪被挖掉后，硬化面上方不应该再有草坪；空地上方应该只有草坪
hard = [o for o in bpy.data.objects
        if o.type == 'MESH' and o.name.startswith(('广场', '铺装', '车行道', '人行道'))]
grass = bpy.data.objects['绿化面']

XS = [-240, -180, -120, -60, 0, 60, 120, 200, 260]
YS = [240, 180, 120, 60, 0, -60, -120, -180, -240, -300]

def hit(o, x, y):
    moi = o.matrix_world.inverted()
    loc = moi @ Vector((x, y, 200.0))
    d = moi.to_3x3() @ Vector((0, 0, -1))
    h, *_ = o.ray_cast(loc, d, distance=400.0)
    return h

both = 0
grass_only = 0
hard_only = 0
none = 0
for x in XS:
    for y in YS:
        gh = bool(hit(grass, x, y))
        hh = any(hit(o, x, y) for o in hard)
        if gh and hh:
            both += 1
        elif gh:
            grass_only += 1
        elif hh:
            hard_only += 1
        else:
            none += 1
print('### 草地与铺装重叠', both)
print('### 只有草地', grass_only)
print('### 只有铺装', hard_only)
print('### 都没命中', none)