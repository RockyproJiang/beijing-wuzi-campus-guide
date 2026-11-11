import bpy
# 基座是简单盒子（8 顶点，一个顶面在 z=0，一个底面 z=-0.5）。
# 校园轮廓/绿化面已经统一在 0.06 以上，基座顶 0.0 不影响。这里只确认绿化面与校园轮廓的间距。
for n in ['绿化面', '校园轮廓']:
    o = bpy.data.objects[n]
    zs = sorted({round((o.matrix_world @ v.co).z, 3) for v in o.data.vertices})
    print('###', n, zs)
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### OK')