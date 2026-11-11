import bpy, bmesh
from mathutils import Vector

# 第二教学楼 = 楼31（x -145.6..-60.5, y -227.2..-157.6, h 16.5），当前是实心盒子。
# 目标：中间开一个方形中庭，俯视成「回」字。做法是重建几何——
#   外环边框宽 7.5m，中庭 55.1 × 47.1m，屋顶/地面做成带洞的环形。
NAME = '楼31'
o = bpy.data.objects[NAME]
me = o.data
ws = [o.matrix_world @ v.co for v in me.vertices]
X0, X1 = min(p.x for p in ws), max(p.x for p in ws)
Y0, Y1 = min(p.y for p in ws), max(p.y for p in ws)
Z0, Z1 = min(p.z for p in ws), max(p.z for p in ws)
print(f'### 原 bbox x[{X0},{X1}] y[{Y0},{Y1}] z[{Z0},{Z1}]')
print('### mats', [m.name for m in me.materials])

W = 7.5  # 环形宽度
ix0, ix1 = X0 + W, X1 - W
iy0, iy1 = Y0 + W, Y1 - W

bm = bmesh.new()

def quad(pts):
    vs = [bm.verts.new(p) for p in pts]
    f = bm.faces.new(vs)
    return f

# 八条环带（顶面 & 底面），做成 4 条矩形带避免面重叠
bands = [
    # (x0,x1,y0,y1) 俯视的 4 条边
    (X0, X1, Y0, iy0),   # 南
    (X0, X1, iy1, Y1),   # 北
    (X0, ix0, iy0, iy1), # 西
    (ix1, X1, iy0, iy1), # 东
]
for z in (Z0, Z1):
    for (a, b, c, d) in bands:
        quad([(a, c, z), (b, c, z), (b, d, z), (a, d, z)])

# 外墙（周长 4 面）
outer = [(X0, Y0), (X1, Y0), (X1, Y1), (X0, Y1)]
for i in range(4):
    (ax, ay), (bx, by) = outer[i], outer[(i + 1) % 4]
    quad([(ax, ay, Z0), (bx, by, Z0), (bx, by, Z1), (ax, ay, Z1)])

# 内墙（中庭 4 面，法线朝内 → 顶点顺序反过来）
inner = [(ix0, iy0), (ix0, iy1), (ix1, iy1), (ix1, iy0)]
for i in range(4):
    (ax, ay), (bx, by) = inner[i], inner[(i + 1) % 4]
    quad([(ax, ay, Z0), (ax, ay, Z1), (bx, by, Z1), (bx, by, Z0)])

bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
bm.to_mesh(me)
bm.free()
if not me.uv_layers:
    me.uv_layers.new(name='UVMap')

# 材质：顶/底用白膜，立面用贴图
FACE = 1 if len(me.materials) > 1 else 0
for p in me.polygons:
    p.material_index = 0 if abs(p.normal.z) > 0.5 else FACE

# UV：立面按面内水平 0..1 + 竖向 z/H；顶底按世界 xy 平铺
uvl = me.uv_layers.active
H = Z1 - Z0
for p in me.polygons:
    pts = [me.vertices[me.loops[li].vertex_index].co for li in p.loop_indices]
    if abs(p.normal.z) > 0.5:
        for k, li in enumerate(p.loop_indices):
            uvl.data[li].uv = (pts[k].x / 6.0, pts[k].y / 6.0)
        continue
    horiz = abs(p.normal.x) > 0.5
    vals = [(v.y if horiz else v.x) for v in pts]
    lo, hi = min(vals), max(vals)
    span = (hi - lo) or 1.0
    flip = p.normal.x < -0.5 or p.normal.y < -0.5
    for k, li in enumerate(p.loop_indices):
        u = (vals[k] - lo) / span
        if flip:
            u = 1.0 - u
        uvl.data[li].uv = (u, (pts[k].z - Z0) / H)

me.update()
print('### after verts', len(me.vertices), 'polys', len(me.polygons),
      'inner x', ix0, ix1, 'y', iy0, iy1)
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')