import bpy

# 目标：草坪在所有角度都能看到 → 草坪顶面必须高于所有硬化地面顶面。
# 当前硬化地面最高：人行道06 = 0.34，车行道01 = 0.23，湖01 = 0.24。
# 方案：草坪整体抬到 0.30..0.33，仍低于湖面（湖单独抬到 0.36..0.40）。
GRASS_Z0, GRASS_Z1 = 0.30, 0.33
LAKE_Z0, LAKE_Z1 = 0.36, 0.40

def raise_flat(o, z0, z1):
    """把一个厚板对象的底面/顶面平移到 z0..z1（按对象自身原始高度比例）"""
    me = o.data
    ws = [o.matrix_world @ v.co for v in me.vertices]
    lo = min(p.z for p in ws)
    hi = max(p.z for p in ws)
    if hi - lo < 1e-6:
        # 单层薄面：整体平移
        dz = z0 - lo
        for v in me.vertices:
            v.co.z += dz
    else:
        for v in me.vertices:
            wp = o.matrix_world @ v.co
            t = (wp.z - lo) / (hi - lo)
            v.co.z += (z0 + t * (z1 - z0)) - wp.z
    me.update()

targets = [o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('绿化')]
for o in targets:
    raise_flat(o, GRASS_Z0, GRASS_Z1)
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print(f'### {o.name} z {min(p.z for p in ws):.2f}..{max(p.z for p in ws):.2f}')

for o in bpy.data.objects:
    if o.type == 'MESH' and o.name.startswith('湖'):
        raise_flat(o, LAKE_Z0, LAKE_Z1)
        ws = [o.matrix_world @ v.co for v in o.data.vertices]
        print(f'### {o.name} z {min(p.z for p in ws):.2f}..{max(p.z for p in ws):.2f}')

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')