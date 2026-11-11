import bpy
o = bpy.data.objects.get('楼31')
if not o:
    print('### 楼31 MISSING')
else:
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    xs = sorted(set(round(p.x, 2) for p in ws))
    ys = sorted(set(round(p.y, 2) for p in ws))
    zs = sorted(set(round(p.z, 2) for p in ws))
    print('### 楼31 x', xs)
    print('### 楼31 y', ys)
    print('### 楼31 z', zs)
    print('### verts', len(o.data.vertices), 'polys', len(o.data.polygons))
    print('### mats', [m.name for m in o.data.materials])