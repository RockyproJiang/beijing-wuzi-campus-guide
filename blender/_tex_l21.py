import bpy
from mathutils import Vector

o = bpy.data.objects['楼21_餐厅']
me = o.data
# 材质槽 1 = 贴图_18_深色餐厅_2F，所有立面都用它
FACE_MAT = 1
for p in me.polygons:
    if abs(p.normal.z) < 0.5:  # 立面
        p.material_index = FACE_MAT

# 给所有立面重刷 UV：水平 0..1 + 竖向 z / 楼高
uvl = me.uv_layers.active
H = 9.9
for p in me.polygons:
    if abs(p.normal.z) > 0.5:
        continue
    horiz = abs(p.normal.x) > 0.5
    pts = [o.matrix_world @ me.vertices[me.loops[li].vertex_index].co for li in p.loop_indices]
    vals = [(v.y if horiz else v.x) for v in pts]
    lo, hi = min(vals), max(vals)
    span = (hi - lo) or 1.0
    flip = p.normal.x < -0.5 or p.normal.y < -0.5
    for k, li in enumerate(p.loop_indices):
        u = (vals[k] - lo) / span
        if flip:
            u = 1.0 - u
        uvl.data[li].uv = (u, pts[k].z / H)

me.update()
print('### mats', [m.name for m in me.materials])
for p in me.polygons:
    print('### poly', p.index, 'mat', p.material_index, 'n', [round(x, 1) for x in p.normal])
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')