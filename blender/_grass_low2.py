import bpy

def set_z(o, z0, z1):
    me = o.data
    ws = [o.matrix_world @ v.co for v in me.vertices]
    lo = min(p.z for p in ws)
    hi = max(p.z for p in ws)
    for v in me.vertices:
        wp = o.matrix_world @ v.co
        t = (wp.z - lo) / (hi - lo) if hi - lo > 1e-6 else 0.0
        v.co.z += (z0 + t * (z1 - z0)) - wp.z
    me.update()

for n in ('绿化面', '绿化01', '绿化02', '绿化03'):
    o = bpy.data.objects.get(n)
    if not o:
        continue
    set_z(o, 0.02, 0.03)
    ws = [o.matrix_world @ v.co for v in o.data.vertices]
    print('### %s z %.2f..%.2f v=%d' % (n, min(p.z for p in ws), max(p.z for p in ws), len(o.data.vertices)))

bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
print('### SAVED')