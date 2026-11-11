import bpy

for n in ['楼21', '小建筑04']:
    o = bpy.data.objects.get(n)
    if not o:
        print('###', n, 'MISSING')
        continue
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    xs = [p.x for p in ws]; ys = [p.y for p in ws]; zs = [p.z for p in ws]
    print('###', n, 'x', round(min(xs), 2), round(max(xs), 2), 'y', round(min(ys), 2), round(max(ys), 2), 'z', round(min(zs), 2), round(max(zs), 2), 'verts', len(o.data.vertices))
    # 顶面轮廓
    zt = max(zs)
    top = sorted({(round(p.x, 1), round(p.y, 1)) for p in ws if abs(p.z - zt) < 1e-3})
    print('    top pts', top[:14])