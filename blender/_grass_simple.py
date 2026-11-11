import bpy
import bmesh

# 回到「草坪 = 一整块平面」，只把层级做好：
#   基座 -0.50..0.00
#   校园轮廓 0.02
#   草坪平面 0.06..0.08（一整块，不挖洞、不细分）
#   广场/铺装 0.12..0.18
#   车行道 0.20..0.26
#   人行道 0.28..0.40
#   湖面 0.30..0.34
# 草坪一整块放在所有硬化面之下：硬化面盖住它 → 道路正常；
# 空地上没有硬化面 → 露出草坪。靠真实的高度分层，不用任何魔法参数。

ob = bpy.data.objects['绿化面']

# 用原始 130 面的大片重建（从备份里取，最干净）
import os
backup = os.path.join(os.path.dirname(bpy.data.filepath), '北京物资学院_白膜_备份_抬草前_20261107.blend')
with bpy.data.libraries.load(backup) as (src, dst):
    dst.objects = ['绿化面']
orig = dst.objects[0]
new_me = orig.data.copy()
ob.data = new_me

# 还原成 x -354..355 / y -354..355 / z 单层
me = ob.data
me.transform(orig.matrix_world)
ob.matrix_world.identity()
for v in me.vertices:
    v.co.z = 0.06
me.update()
print('### 绿化面 v=%d p=%d z=%.3f' % (len(me.vertices), len(me.polygons), me.vertices[0].co.z))

def set_z(name, z0, z1):
    o = bpy.data.objects.get(name)
    if not o:
        return
    m = o.data
    ws = [o.matrix_world @ v.co for v in m.vertices]
    lo = min(p.z for p in ws)
    hi = max(p.z for p in ws)
    for v in m.vertices:
        wp = o.matrix_world @ v.co
        t = (wp.z - lo) / (hi - lo) if hi - lo > 1e-6 else 0.0
        v.co.z += (z0 + t * (z1 - z0)) - wp.z
    m.update()
    print('### %s z %.2f..%.2f' % (name, z0, z1))

# 硬化面统一抬到草坪之上
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    n = o.name
    if n.startswith(('广场', '铺装')):
        set_z(n, 0.12, 0.18)
    elif n.startswith('车行道'):
        set_z(n, 0.20, 0.26)
    elif n.startswith('人行道'):
        set_z(n, 0.28, 0.40)
    elif n.startswith('湖'):
        set_z(n, 0.30, 0.34)
    elif n == '校园轮廓':
        set_z(n, 0.02, 0.02)

for n in ('绿化01', '绿化02', '绿化03'):
    set_z(n, 0.07, 0.09)

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')