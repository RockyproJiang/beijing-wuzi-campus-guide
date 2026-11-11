import bpy, json

out = r"C:\Users\rocky\Documents\computing_files\projects\practice_files\my_3d_school_app\My_3d_school_v1.5\app\docs\reference\_blender_names.txt"
lines = []
for o in sorted(bpy.data.objects, key=lambda x: x.name):
    lines.append(f"{o.type}\t{o.name}\t{o.data.materials[:2] if o.type=='MESH' else ''}")
with open(out, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("### WROTE", len(lines))