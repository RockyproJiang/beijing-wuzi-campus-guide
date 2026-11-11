import bpy

# 绿化面 是 130 个面拼成的一张大面（365942 m²，覆盖全校）。
# 要恢复成「草坪只在没有硬化的地方」：
#   把绿化面压回硬化层之下（0.02..0.03），这样它只在「没有广场/铺装/道路」的地方露出来；
#   再解决「有些角度看不见」——用渲染层的 polygonOffset 让它稳定赢/输，不靠 z 竞争。
GRASS_Z0, GRASS_Z1 = 0.020, 0.030

def set_z(o, z0, z1):
    me = o.data
    ws = [o.matrix_world @ v.co for v in me.vertices]
    lo = min(p.z for p in ws)
    hi = max(p.z for p in ws)
    if hi - lo < 1e-6:
        for v in me.vertices:
            v.co.z += z0 - lo
    else:
        for v in me.vertices:
            wp = o.matrix_world @ v.co
            t = (wp.z - lo) / (hi - lo)
            v.co.z += (z0 + t * (z1 - z0)) - wp.z
    me.update()

for n in ('绿化面', '绿化01', '绿化02', '绿化03'):
    o = bpy.data.objects.get(n)
    if not o:
        continue
    set_z(o, GRASS_Z0, GRASS_Z1)
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print(f'### {n} z {min(p.z for p in ws):.3f}..{max(p.z for p in ws):.3f}')

# 湖面回到草坪与广场之间的合理位置（略高于地面铺装，但不至于遮挡）
for o in bpy.data.objects:
    if o.type == 'MESH' and o.name.startswith('湖'):
        set_z(o, 0.22, 0.26)
        ws = [o.matrix_world @ v.co for v in o.data.vertices]
        print(f'### {o.name} z {min(p.z for p in ws):.3f}..{max(p.z for p in ws):.3f}')

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')