import bpy
for n in ['湖', '湖面', '水面']:
    o = bpy.data.objects.get(n)
    if not o:
        continue
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print('###', n, 'x', round(min(p.x for p in ws), 1), round(max(p.x for p in ws), 1),
          'y', round(min(p.y for p in ws), 1), round(max(p.y for p in ws), 1),
          'z', sorted({round(p.z, 3) for p in ws}), 'verts', len(ws))
# 列出所有带「湖/水」的对象
print('### 候选:', [(o.name, o.type) for o in bpy.data.objects if '湖' in o.name or '水' in o.name])