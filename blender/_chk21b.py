import bpy
o = bpy.data.objects['楼21_餐厅']
me = o.data
print('### verts', len(me.vertices), 'polys', len(me.polygons), 'mats', [m.name for m in me.materials])
for p in me.polygons:
    n = p.normal
    c = p.center
    print('### poly', p.index, 'mat', p.material_index, 'n', [round(x, 2) for x in n], 'center', [round(x, 1) for x in c])
# 切线 Y=-21（北侧）的封口面是否切好
zs = sorted({round(v.co.z, 2) for v in me.vertices})
print('### z-levels', zs)