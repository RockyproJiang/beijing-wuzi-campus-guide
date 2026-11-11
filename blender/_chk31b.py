import bpy
o = bpy.data.objects['楼31']
me = o.data
print('### mats', [m.name if m else None for m in me.materials])
for m in me.materials:
    if not m:
        continue
    print('###  ', m.name, 'nodes', m.use_nodes)
    if m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE':
                print('###    tex', n.image.name if n.image else None)
for i, p in enumerate(me.polygons[:26]):
    print(f'### poly {i} mi={p.material_index} n=({p.normal.x:.1f},{p.normal.y:.1f},{p.normal.z:.1f})'
          f' uv={[tuple(round(c,2) for c in me.uv_layers.active.data[li].uv) for li in p.loop_indices][:2]}')