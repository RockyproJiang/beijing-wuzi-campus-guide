import bpy
from mathutils import Vector

# 绿化01/02/03 底面被压到 0.05（低于校园轮廓 0.06），只改顶面不动底面：
# 直接把底面拉回 0.10。
for n in ['绿化01', '绿化02', '绿化03']:
    o = bpy.data.objects[n]
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    lo = min(p.z for p in ws)
    for v in o.data.vertices:
        wz = (o.matrix_world @ v.co).z
        if wz < lo + 0.02:
            v.co.z += (0.10 - lo)
    o.data.update()
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print(f'### {n} z {min(p.z for p in ws):.3f}~{max(p.z for p in ws):.3f}')

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')