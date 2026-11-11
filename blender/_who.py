import bpy
from mathutils import Vector

# 用户给的开口坐标（blender x/y）
X0, X1, Y0, Y1 = -120.3, -84.0, 177.8, 208.0
print('### 目标开洞 x', X0, X1, 'y', Y0, Y1)

hits = []
for o in bpy.data.objects:
    if o.type != 'MESH':
        continue
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
    y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
    # 与目标区域有交叠
    if x1 <= X0 or x0 >= X1 or y1 <= Y0 or y0 >= Y1:
        continue
    zt = max(p.z for p in ws)
    if zt < 1.0:
        continue
    hits.append((round(zt, 1), o.name, (round(x0, 1), round(x1, 1), round(y0, 1), round(y1, 1)), len(ws)))
for h in sorted(hits):
    print(f'### h={h[0]:<5} {h[1]:<12} bbox x[{h[2][0]},{h[2][1]}] y[{h[2][2]},{h[2][3]}] v={h[3]}')