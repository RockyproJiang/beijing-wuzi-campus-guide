import bpy

o = bpy.data.objects['绿化面']
me = o.data
print('### 绿化面 v=%d p=%d' % (len(me.vertices), len(me.polygons)))
ws = [o.matrix_world @ v.co for v in me.vertices]
print('### bbox x %.1f..%.1f y %.1f..%.1f z %.2f..%.2f' % (
    min(p.x for p in ws), max(p.x for p in ws),
    min(p.y for p in ws), max(p.y for p in ws),
    min(p.z for p in ws), max(p.z for p in ws)))
# 是否单块面
print('### 单面?' , len(me.polygons) == 1)
# 看它的面积
import mathutils
area = sum(p.area for p in me.polygons)
print('### 面积 %.0f m2' % area)
for n in ('绿化01', '绿化02', '绿化03'):
    if n in bpy.data.objects:
        ob = bpy.data.objects[n]
        w2 = [ob.matrix_world @ v.co for v in ob.data.vertices]
        a2 = sum(p.area for p in ob.data.polygons)
        print(f'### {n} v={len(ob.data.vertices)} p={len(ob.data.polygons)} area={a2:.0f} '
              f'x {min(p.x for p in w2):.1f}..{max(p.x for p in w2):.1f} '
              f'y {min(p.y for p in w2):.1f}..{max(p.y for p in w2):.1f}')