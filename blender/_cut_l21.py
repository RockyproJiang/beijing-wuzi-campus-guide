import bpy, bmesh
from mathutils import Vector

# 餐厅（楼21）x 251.55..280.15 / y -60.78..-5.53 / z 0..9.9
# 洗手间（小建筑04）占 y -20.15..-7.15（北段）→ 切掉餐厅北段，
# 只保留 y <= -20.15 的南段，洗手间完整露出。切线用 y = -21.0 留 0.85m 间隙。

TARGET = '楼21'
NEWNAME = '楼21_餐厅'
YCUT = -21.0
obj = bpy.data.objects[TARGET]
local_cut = obj.matrix_world.inverted() @ Vector((0, YCUT, 0))

bm = bmesh.new()
bm.from_mesh(obj.data)
res = bmesh.ops.bisect_plane(
    bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
    plane_co=local_cut, plane_no=(0, 1, 0),
    clear_inner=False, clear_outer=True,
)
edges = [e for e in res.get('geom_cut', []) if isinstance(e, bmesh.types.BMEdge)]
if edges:
    bmesh.ops.holes_fill(bm, edges=edges, sides=0)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(obj.data)
bm.free()
obj.data.update()

ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
print('### after x', round(min(p.x for p in ws), 2), round(max(p.x for p in ws), 2),
      'y', round(min(p.y for p in ws), 2), round(max(p.y for p in ws), 2),
      'verts', len(obj.data.vertices), 'polys', len(obj.data.polygons),
      'mats', [m.name for m in obj.data.materials])
obj.name = NEWNAME
obj.data.name = NEWNAME
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED', obj.name)