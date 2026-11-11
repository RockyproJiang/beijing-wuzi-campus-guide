import bpy

# 潞河居餐厅 = 哪个对象？先按名字找
names = [o.name for o in bpy.data.objects if o.type == 'MESH' and ('潞河' in o.name or '餐厅' in o.name)]
print('### 候选:', names)
for n in names:
    o = bpy.data.objects[n]
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    xs = [p.x for p in ws]; ys = [p.y for p in ws]; zs = [p.z for p in ws]
    print('###', n, 'x', round(min(xs), 2), round(max(xs), 2), 'y', round(min(ys), 2), round(max(ys), 2), 'z', round(min(zs), 2), round(max(zs), 2), 'verts', len(o.data.vertices))