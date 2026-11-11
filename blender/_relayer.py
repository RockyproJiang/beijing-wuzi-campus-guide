import bpy
from mathutils import Vector

# 草地现在是 0.08~0.11，被抬到了所有铺装下面 —— 之前为了压 z-fighting 抬草坪，
# 结果草坪底面 0.08 高过校园轮廓 0.06，但顶面 0.11 又低于广场 0.16，逻辑上没错，
# 真正问题是草坪与「校园轮廓 0.06」之间只剩 2cm，且草坪自身有 0.08/0.11 两层。
# 重新定义层级（全部拉开 ≥4cm）：
#   基座 -0.5~0.00
#   校园轮廓 0.06（单层）
#   绿化面 0.20~0.23  （比铺装略高，让草地永远盖住底下的铺装边缘）
#   湖 0.26~0.30
#   广场/铺装 0.16（保持）
# 但草地若高于广场，广场就不显示了。正确顺序应为：
#   校园轮廓 0.06 < 绿化面 0.10~0.13 < 广场/铺装 0.16 < 湖 0.20 < 车行道 0.23 < 人行道 0.28
# 统一重排：

def set_bottom(obj, z_bottom):
    """把对象整体平移，使最低点等于 z_bottom"""
    ws = [obj.matrix_world @ v.co for v in obj.data.vertices]
    cur = min(p.z for p in ws)
    dz = z_bottom - cur
    if abs(dz) < 1e-6:
        return 0.0
    for v in obj.data.vertices:
        v.co.z += dz
    obj.data.update()
    return dz

plan = {
    '校园轮廓': 0.06,
    '绿化面': 0.10,
    '绿化01': 0.10,
    '绿化02': 0.10,
    '绿化03': 0.10,
    '湖01': 0.20,
    '车行道01': 0.23,
}
for n, zb in plan.items():
    o = bpy.data.objects.get(n)
    if not o:
        print('###', n, 'MISSING')
        continue
    dz = set_bottom(o, zb)
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print(f'### {n:<10} dz={dz:+.3f} -> z {min(p.z for p in ws):.3f}~{max(p.z for p in ws):.3f}')

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')