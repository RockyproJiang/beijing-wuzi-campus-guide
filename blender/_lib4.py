import bpy
from mathutils import Vector

# 用户第二张图：两个并排的浅绿矩形 + 上面散布着绿色多面体（树）。
# 在截图里它们挨着一条灰色路面。找所有「浅绿平面 + 上面有树」的组合。
# 先找出所有可能的草地点（非绿化命名），用材质名筛「绿」
for ob in bpy.data.objects:
    if ob.type != 'MESH':
        continue
    mats = [m.name if m else '' for m in ob.data.materials]
    if not any('绿' in m or '草' in m for m in mats):
        continue
    ws = [ob.matrix_world @ v.co for v in ob.data.vertices]
    x0, x1 = min(p.x for p in ws), max(p.x for p in ws)
    y0, y1 = min(p.y for p in ws), max(p.y for p in ws)
    z0, z1 = min(p.z for p in ws), max(p.z for p in ws)
    print(f'### {ob.name:<14} mats={mats[:3]} x[{x0:.1f},{x1:.1f}] y[{y0:.1f},{y1:.1f}] z[{z0:.2f},{z1:.2f}] v={len(ws)}')