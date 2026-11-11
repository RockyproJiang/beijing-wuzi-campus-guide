import bpy
from mathutils import Vector

# 绿化01/02/03 顶面 0.18 与广场 0.16 只差 2cm，会再次抢深度。压回到 0.10~0.13。
for n in ['绿化01', '绿化02', '绿化03']:
    o = bpy.data.objects[n]
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    cur_top = max(p.z for p in ws)
    dz = 0.13 - cur_top
    for v in o.data.vertices:
        v.co.z += dz
    o.data.update()
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print(f'### {n} z {min(p.z for p in ws):.3f}~{max(p.z for p in ws):.3f}')

# 车行道 0.23~0.29 高于人行道 0.16~0.28 的上沿，改回 0.17~0.23
o = bpy.data.objects['车行道01']
ws = [o.matrix_world @ v.co for v in o.data.vertices]
dz = 0.17 - min(p.z for p in ws)
for v in o.data.vertices:
    v.co.z += dz
o.data.update()
ws = [o.matrix_world @ v.co for v in o.data.vertices]
print(f'### 车行道01 z {min(p.z for p in ws):.3f}~{max(p.z for p in ws):.3f}')
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')