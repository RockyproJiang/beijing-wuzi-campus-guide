import bpy
from mathutils import Vector

# 逐层列出所有「扁平地面」的 z 和世界 bbox，找重叠
FLAT = ('绿化', '广场', '铺装', '车行道', '人行道', '湖', '校园轮廓', '基座')
rows = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    if not o.name.startswith(FLAT):
        continue
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    if not ws:
        continue
    zmin = min(p.z for p in ws)
    zmax = max(p.z for p in ws)
    rows.append((o.name, zmin, zmax, len(ws)))
rows.sort(key=lambda r: (r[1], r[2]))
for n, z0, z1, vc in rows:
    print(f'### {n:14s} z {z0:6.3f}..{z1:6.3f}  v={vc}')