import bpy
from mathutils import Vector

o = bpy.data.objects.get('楼19')
print('### 楼19', o is not None)
if o:
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print('### x', round(min(p.x for p in ws), 1), round(max(p.x for p in ws), 1),
          'y', round(min(p.y for p in ws), 1), round(max(p.y for p in ws), 1),
          'z', sorted({round(p.z, 2) for p in ws})[:3], 'verts', len(ws), 'polys', len(o.data.polygons))
    print('### mats', [m.name for m in o.data.materials])

# 第二教学楼在数据库里绑定的模型名
import json
print('### 候选对象:', [x.name for x in bpy.data.objects if x.type == 'MESH' and '19' in x.name][:10])