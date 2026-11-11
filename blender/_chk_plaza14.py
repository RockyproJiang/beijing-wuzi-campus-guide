import bpy

# 在 Blender 里查青蓝广场14 / 广场01 / 绿化面 的高度与顶点
for name in ['青蓝广场14', '广场01', '绿化面']:
    o = bpy.data.objects.get(name)
    if not o:
        print('###', name, 'MISSING')
        continue
    zs = sorted({round((o.matrix_world @ v.co).z, 4) for v in o.data.vertices})
    print('###', name, 'z-levels', zs, 'verts', len(o.data.vertices))
    # 顶面 bbox
    top = [(o.matrix_world @ v.co) for v in o.data.vertices if abs((o.matrix_world @ v.co).z - max(zs)) < 1e-4]
    xs = [p.x for p in top]; ys = [p.y for p in top]
    print('    top bbox x', round(min(xs), 2), round(max(xs), 2), 'y', round(min(ys), 2), round(max(ys), 2))