import httpx
import json

circuit = httpx.get('https://api.multiviewer.app/api/v1/circuits/19/2024').json()
xs = circuit['x']
ys = circuit['y']
print(f"Track points: {len(xs)}, X range: [{min(xs)}, {max(xs)}], Y range: [{min(ys)}, {max(ys)}]")
corners = circuit['corners']
for c in corners:
    num = c['number']
    tx = c['trackPosition']['x']
    ty = c['trackPosition']['y']
    print(f"Turn {num}: pos=({tx:.1f}, {ty:.1f})")
