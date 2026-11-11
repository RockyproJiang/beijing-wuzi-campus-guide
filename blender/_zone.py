import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree
import bmesh

# 用户圈的区域：x 262.6..268.7, y 77.4..80.1（blender 坐标）
X0, X1, Y0, Y1 = 262.6, 268.7, 77.4, 80.1

def top_height(obj):
    ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
    return max(p.z for p in ws)

def bbox2d(obj):
    ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
    return min(p.x for p in ws), max(p.x for p in ws), min(p.y for p in ws), max(p.y for p in ws)

# 找所有落在该区域里的地面/绿化/小物件
cands = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    bx0, bx1, by0, by1 = bbox2d(o)
    if bx1 < X0 or bx0 > X1 or by1 < Y0 or by0 > Y1:
        continue
    cands.append((round(top_height(o), 3), o.name, (round(bx0, 1), round(bx1, 1), round(by0, 1), round(by1, 1))))

for t, n, bb in sorted(cands):
    print(f'### {t:6.3f}  {n:<24} bbox x[{bb[0]},{bb[1]}] y[{bb[2]},{bb[3]}]')