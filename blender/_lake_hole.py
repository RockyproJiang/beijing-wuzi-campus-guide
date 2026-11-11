import bpy
from mathutils import Vector

# 湖01 顶面 0.10，但被「绿化面」(0.08~0.11) 盖住了 —— 湖面顶和草坪顶几乎重合。
# 把绿化面在湖区挖空，湖面才能露出来。
lake = bpy.data.objects['湖01']
grass = bpy.data.objects['绿化面']

import bmesh
lmw = lake.matrix_world
lverts = [lmw @ v.co for v in lake.data.vertices]
x0, x1 = min(p.x for p in lverts), max(p.x for p in lverts)
y0, y1 = min(p.y for p in lverts), max(p.y for p in lverts)
print('### 湖01 bbox x', round(x0, 1), round(x1, 1), 'y', round(y0, 1), round(y1, 1))

# 湖的顶面轮廓（多边形），用于在草地上挖洞
zt = max(p.z for p in lverts)
ring = [p for p in lverts if abs(p.z - zt) < 1e-3]
print('### 湖顶面点数', len(ring))

# 用 bmesh 对绿化面做布尔差
bm = bmesh.new()
bm.from_mesh(grass.data)
# 构造湖的立方体（比湖略大一点，z 从 -1 到 2）
import mathutils
cut = bmesh.new()
bmesh.ops.create_cube(cut, size=1.0)
for v in cut.verts:
    v.co.x = x0 - 0.5 if v.co.x < 0 else x1 + 0.5
    v.co.y = y0 - 0.5 if v.co.y < 0 else y1 + 0.5
    v.co.z = -1.0 if v.co.z < 0 else 2.0
cut.to_mesh(grass.data)
cut.free()

tmp = bpy.data.objects.new('__cut', grass.data.copy())
bpy.context.collection.objects.link(tmp)
mod = grass.modifiers.new('bool', 'BOOLEAN')
mod.operation = 'DIFFERENCE'
mod.object = tmp
mod.solver = 'EXACT'
depsgraph = bpy.context.evaluated_depsgraph_get()
ev = grass.evaluated_get(depsgraph)
new_me = bpy.data.meshes.new_from_object(ev)
grass.modifiers.clear()
grass.data = new_me
bpy.data.objects.remove(tmp, do_unlink=True)

ws = [grass.matrix_world @ v.co for v in grass.data.vertices]
print('### 绿化面 after verts', len(grass.data.vertices), 'polys', len(grass.data.polygons))
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')