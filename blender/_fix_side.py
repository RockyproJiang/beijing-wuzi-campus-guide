import bpy
from mathutils import Vector
import bmesh

# 人行道06 北端与广场01/车行道交叠：把 人行道06 抬高 4cm，彻底离开广场顶面（0.18）
# 同时把 广场01 在用户圈区域附近再压低 2cm，让三层彻底分开
o = bpy.data.objects['人行道06']
for v in o.data.vertices:
    v.co.z += 0.06
o.data.update()
ws = [o.matrix_world @ v.co for v in o.data.vertices]
print('### 人行道06 z', sorted({round(p.z, 3) for p in ws}))

p = bpy.data.objects['广场01']
for v in p.data.vertices:
    v.co.z -= 0.01
p.data.update()
ws = [p.matrix_world @ v.co for v in p.data.vertices]
print('### 广场01  z', sorted({round(x.z, 3) for x in ws}))

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')