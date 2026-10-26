"""测量完成勾选框中「勾」相对方块的偏移，输出 CSS 像素单位的数值。"""

import sys
from collections import deque
from PIL import Image

path = sys.argv[1] if len(sys.argv) > 1 else r"S:\23_DshMod\whaletodo\build\ui-4x.png"
SCALE = float(sys.argv[2]) if len(sys.argv) > 2 else 4.0

im = Image.open(path).convert("RGB")
w, h = im.size
px = im.load()


def is_green(p):
    r, g, b = p
    return g > r + 8 and g > b + 8 and 60 < g < 210


# 找出所有绿色像素（步长 1，勾选框只有 72x72）
greens = set()
for y in range(0, h):
    for x in range(0, w):
        if is_green(px[x, y]):
            greens.add((x, y))

if not greens:
    print("整张图没有绿色像素")
    raise SystemExit(1)

# 连通域聚类，挑出勾选框那种「接近正方形」的块（排除卡片左侧 2px 绿色竖边）
seen = set()
candidates = []
for start in greens:
    if start in seen:
        continue
    q = deque([start])
    seen.add(start)
    comp = []
    while q:
        cx, cy = q.popleft()
        comp.append((cx, cy))
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                p = (cx + dx, cy + dy)
                if p in greens and p not in seen:
                    seen.add(p)
                    q.append(p)
    xs = [p[0] for p in comp]
    ys = [p[1] for p in comp]
    bbox = (min(xs), min(ys), max(xs), max(ys))
    bw = bbox[2] - bbox[0] + 1
    bh = bbox[3] - bbox[1] + 1
    if 40 <= bw <= 220 and 40 <= bh <= 220 and 0.7 < bw / bh < 1.4:
        candidates.append((bw * bh, bbox))

if not candidates:
    print("没有找到接近正方形的绿色勾选框")
    raise SystemExit(1)

candidates.sort(reverse=True)
area, (box_l, box_t, box_r, box_b) = candidates[0]
print(f"方块 bbox = ({box_l},{box_t})-({box_r},{box_b})  {box_r-box_l+1}x{box_b-box_t+1}")


def is_white(p):
    return min(p) > 215


inset = 10
whites = [
    (x, y)
    for y in range(box_t + inset, box_b - inset)
    for x in range(box_l + inset, box_r - inset)
    if is_white(px[x, y])
]
if not whites:
    print("方块内没有白色勾")
    raise SystemExit(1)
wx = [p[0] for p in whites]
wy = [p[1] for p in whites]

box_cx = (box_l + box_r) / 2
box_cy = (box_t + box_b) / 2
check_cx = (min(wx) + max(wx)) / 2
check_cy = (min(wy) + max(wy)) / 2

print(f"勾 bbox = {max(wx)-min(wx)+1}x{max(wy)-min(wy)+1}")
print(f"水平偏移 {(check_cx - box_cx) / SCALE:+.2f} CSS px  (正=偏右)")
print(f"垂直偏移 {(check_cy - box_cy) / SCALE:+.2f} CSS px  (正=偏下)")

crop = im.crop((box_l - 12, box_t - 12, box_r + 12, box_b + 12))
crop.resize((crop.width * 5, crop.height * 5), Image.NEAREST).save(
    r"S:\23_DshMod\whaletodo\build\check-zoom.png"
)
print("放大图 -> build/check-zoom.png")
