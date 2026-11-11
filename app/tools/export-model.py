"""把北京物资学院白膜 .blend 导出为网页用 GLB。

用法（在项目根目录）：
    & "D:\\Blender\\blender-5.1.2-windows-x64\\blender.exe" -b "..\\北京物资学院_白膜.blend" -P ".\\tools\\export-model.py"

说明：
    - 只导出 MESH 对象，去掉相机/灯光；
    - 贴图转 WebP（体积约为 PNG 的一半），保留对象名；
    - 输出到 public/models/campus.glb。
"""

import os
import bpy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "models", "campus.glb")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# 草坪/球场在原始模型里几乎都在同一高度，网页里会 Z-fighting。
# 导出前按图层抬高 3-12cm，视觉几乎无变化，但深度关系稳定。
# 注意：新建的 车行道/人行道/铺装/广场NN 已在 build-model.py 里设好绝对高度，
# 不要在这里再抬，否则会穿到人行道上面。
OFFSETS = {
    "绿化面": 0.03,
    "绿化01": 0.04,
    "绿化02": 0.04,
    "绿化03": 0.04,
    "湖01": 0.04,
    "篮球场": 0.04,
    "排球场": 0.04,
    "网球场": 0.04,
    "方形灌木": 0.04,
}
SKIP_PREFIX = ("车行道", "人行道", "铺装", "广场", "青蓝广场", "树林", "围栏", "门", "小建筑", "连廊",
               "追加楼", "拱门", "外卖柜", "棒球笼", "环岛景观石", "铺装")
for obj in bpy.data.objects:
    if obj.type != "MESH":
        continue
    if obj.name.startswith(SKIP_PREFIX):
        continue
    for prefix, dz in OFFSETS.items():
        if obj.name.startswith(prefix):
            obj.location.z += dz
            break

bpy.ops.object.select_all(action="DESELECT")
meshes = [obj for obj in bpy.data.objects if obj.type == "MESH"]
for obj in meshes:
    obj.select_set(True)

print("SELECTED", len(meshes))
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_cameras=False,
    export_lights=False,
    export_extras=True,
    export_yup=True,
    export_image_format="WEBP",
    export_image_quality=82,
)
print("EXPORTED", OUT, os.path.getsize(OUT))
