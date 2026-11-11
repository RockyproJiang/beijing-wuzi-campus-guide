import bpy
from mathutils import Vector

# 湖顶 0.10，草坪 0.08~0.11 → 只差 1cm，且草坪整片盖在湖上。
# 安全做法：把「绿化面」整体抬高，让湖面低于草坪是不可能的（湖要露出），
# 所以改为「降低湖面 + 抬草坪」都不行。正确做法是把湖面抬到草坪之上一点点，
# 同时给水面材质开 polygonOffset，稳定压在草地上面。
lake = bpy.data.objects['湖01']
ws = [lake.matrix_world @ v.co for v in lake.data.vertices]
print('### 湖 before z', sorted({round(p.z, 3) for p in ws}))
# 湖面整体抬高到 0.14（草坪顶 0.11 之上，广场 0.11~0.17 之下）
dz = 0.04
for v in lake.data.vertices:
    v.co.z += dz
lake.data.update()
ws = [lake.matrix_world @ v.co for v in lake.data.vertices]
print('### 湖 after  z', sorted({round(p.z, 3) for p in ws}))
for m in lake.data.materials:
    if m and m.use_nodes:
        m.use_backface_culling = False
print('### mats', [m.name for m in lake.data.materials])
bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')