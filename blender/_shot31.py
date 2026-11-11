import bpy, math, mathutils

scn = bpy.context.scene
for o in list(bpy.data.objects):
    if o.type == 'CAMERA':
        bpy.data.objects.remove(o, do_unlink=True)

keep = ('楼31', '人行道', '车行道', '广场', '绿化面')
for o in list(bpy.data.objects):
    if o.type == 'MESH' and not o.name.startswith(keep):
        o.hide_render = True

cam_data = bpy.data.cameras.new('cam')
cam_data.type = 'PERSP'
cam_data.lens = 35
cam = bpy.data.objects.new('cam', cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (-102, -60, 140)
look = mathutils.Vector((-102, -192, 8))
d = look - cam.location
cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
scn.camera = cam

scn.render.resolution_x = 1100
scn.render.resolution_y = 800
scn.render.engine = 'BLENDER_EEVEE'
scn.render.filepath = r"C:\Users\rocky\Documents\computing_files\projects\practice_files\my_3d_school_app\My_3d_school_v1.5\app\docs\reference\_r31.png"
bpy.ops.render.render(write_still=True)
print("### RENDERED")