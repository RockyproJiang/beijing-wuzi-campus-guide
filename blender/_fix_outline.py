import bpy

# 校园轮廓：把 0.0 的那一片抬到 0.06，消除同一条边上的双面共面
o = bpy.data.objects.get('校园轮廓')
ws_before = sorted({round((o.matrix_world @ v.co).z, 3) for v in o.data.vertices})
print('### before z-levels', ws_before)

zmin = min((o.matrix_world @ v.co).z for v in o.data.vertices)
for v in o.data.vertices:
    wz = (o.matrix_world @ v.co).z
    if wz < 0.03:  # 贴在 0.0 的那一片
        v.co.z += 0.06
o.data.update()
ws_after = sorted({round((o.matrix_world @ v.co).z, 3) for v in o.data.vertices})
print('### after  z-levels', ws_after)
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')