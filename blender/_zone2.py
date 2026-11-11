import bpy
from mathutils import Vector

for n in ['人行道06', '广场01', '车行道01']:
    o = bpy.data.objects.get(n)
    if not o:
        print('###', n, 'MISSING'); continue
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    zt = max(p.z for p in ws)
    top = [p for p in ws if abs(p.z - zt) < 1e-3]
    # 顶面在用户区域附近的边
    near = [p for p in top if 250 < p.x < 280 and 55 < p.y < 105]
    print(f'### {n} top z={zt:.3f} verts={len(top)} zs={sorted({round(p.z,3) for p in ws})}')
    print('    near-top:', [(round(p.x, 1), round(p.y, 1)) for p in sorted(near, key=lambda p: (p.x, p.y))])