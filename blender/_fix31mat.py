import bpy

o = bpy.data.objects['楼31']
me = o.data
for p in me.polygons:
    if abs(p.normal.z) > 0.5:
        p.material_index = 0          # 顶/底：白膜
    else:
        p.material_index = 1          # 立面：贴图
me.update()
print('### 立面 mi=1 的面数', sum(1 for p in me.polygons if p.material_index == 1))
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')