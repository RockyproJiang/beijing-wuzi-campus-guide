import bpy
import bmesh
from mathutils import Vector

# 第二教学楼 楼31：外框 x[-145.6,-60.45] (85.15) × y[-227.18,-157.62] (69.56)，h 16.5
# 用户 m18487：中庭改成「边长为外边的 1/3 的正方形口」
# 取短边为基准：69.56 / 3 = 23.19 → 中庭 23.2 × 23.2，居中
X0, X1 = -145.60, -60.45
Y0, Y1 = -227.18, -157.62
Z0, Z1 = 0.0, 16.5
CX = (X0 + X1) / 2
CY = (Y0 + Y1) / 2
HALF = 23.2 / 2
IX0, IX1 = CX - HALF, CX + HALF
IY0, IY1 = CY - HALF, CY + HALF

obj = bpy.data.objects['楼31']
me = obj.data
mat_wall = bpy.data.materials.get('白膜_建筑')
mat_face = bpy.data.materials.get('贴图_07_横条窗长楼_5F')
assert mat_wall and mat_face

bm = bmesh.new()

def add_quad(p0, p1, p2, p3, mat_idx, uv='wall'):
    vs = [bm.verts.new(p) for p in (p0, p1, p2, p3)]
    f = bm.faces.new(vs)
    f.material_index = mat_idx
    f.normal_update()
    return f

def add_box(x0, x1, y0, y1, z0, z1):
    """一个实心长方体（顶面/底面用白膜，四面用贴图）"""
    pts = {
        'nw0': (x0, y0, z0), 'ne0': (x1, y0, z0), 'se0': (x1, y1, z0), 'sw0': (x0, y1, z0),
        'nw1': (x0, y0, z1), 'ne1': (x1, y0, z1), 'se1': (x1, y1, z1), 'sw1': (x0, y1, z1),
    }
    # 底（法线 -Z，绕序顺时针）
    add_quad(pts['sw0'], pts['se0'], pts['ne0'], pts['nw0'], 0)
    # 顶（法线 +Z）
    add_quad(pts['nw1'], pts['ne1'], pts['se1'], pts['sw1'], 0)
    # 南墙 y0（法线 -Y）
    add_quad(pts['nw0'], pts['ne0'], pts['ne1'], pts['nw1'], 1)
    # 东墙 x1（法线 +X）
    add_quad(pts['ne0'], pts['se0'], pts['se1'], pts['ne1'], 1)
    # 北墙 y1（法线 +Y）
    add_quad(pts['se0'], pts['sw0'], pts['sw1'], pts['se1'], 1)
    # 西墙 x0（法线 -X）
    add_quad(pts['sw0'], pts['nw0'], pts['nw1'], pts['sw1'], 1)

# 四条边框：南条（全宽）/ 北条（全宽）/ 西条 / 东条
add_box(X0, X1, Y0, IY0, Z0, Z1)   # 南
add_box(X0, X1, IY1, Y1, Z0, Z1)   # 北
add_box(X0, IX0, IY0, IY1, Z0, Z1) # 西
add_box(IX1, X1, IY0, IY1, Z0, Z1) # 东

bm.normal_update()
bm.to_mesh(me)
bm.free()
me.materials.clear()
me.materials.append(mat_wall)
me.materials.append(mat_face)

# UV：立面「水平 0..1 + 竖向 z/H」，负向面 u=1-u；顶/底面保持常数
if not me.uv_layers:
    me.uv_layers.new(name='UVMap')
uv = me.uv_layers.active.data
H = Z1 - Z0
for p in me.polygons:
    nz = abs(p.normal.z)
    pts = [me.vertices[me.loops[li].vertex_index].co for li in p.loop_indices]
    if nz > 0.5:
        for li in p.loop_indices:
            uv[li].uv = (0.985, 0.985)
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
        uv[li].uv = (u, pts[k].z / H)
me.update()

ws = [obj.matrix_world @ v.co for v in me.vertices]
print('### 楼31 现在 v=%d p=%d' % (len(me.vertices), len(me.polygons)))
print('### x %.2f..%.2f  y %.2f..%.2f' % (min(p.x for p in ws), max(p.x for p in ws), min(p.y for p in ws), max(p.y for p in ws)))
print('### 中庭 x %.2f..%.2f  y %.2f..%.2f  边长 %.1f' % (IX0, IX1, IY0, IY1, HALF * 2))

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')