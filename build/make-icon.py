"""生成应用图标：深海色圆角底 + 白色小鲸鱼。输出 build/icon.ico 与 icon.png。"""
from PIL import Image, ImageDraw

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))

top = (52, 128, 148)
bottom = (22, 72, 90)
grad = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(grad)
for y in range(S):
    t = y / (S - 1)
    gd.line(
        [(0, y), (S, y)],
        fill=(
            round(top[0] + (bottom[0] - top[0]) * t),
            round(top[1] + (bottom[1] - top[1]) * t),
            round(top[2] + (bottom[2] - top[2]) * t),
            255,
        ),
    )

mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.23), fill=255)
img.paste(grad, (0, 0), mask)

d = ImageDraw.Draw(img)
WHITE = (247, 250, 250, 255)
BELLY = (215, 234, 237, 255)
INK = (16, 48, 60, 255)
BLUSH = (244, 184, 184, 170)

# 尾巴（先画，身体盖住根部，衔接自然）
d.polygon(
    [
        (620, 600),
        (884, 448),
        (828, 610),
        (896, 782),
        (660, 706),
    ],
    fill=WHITE,
)

# 身体（圆胖）
d.ellipse([128, 442, 700, 806], fill=WHITE)
# 肚子
d.ellipse([196, 640, 616, 812], fill=BELLY)
# 胸鳍
d.polygon([(404, 742), (536, 668), (520, 780)], fill=(224, 238, 240, 255))

# 眼睛
d.ellipse([262, 550, 330, 618], fill=INK)
d.ellipse([286, 566, 306, 586], fill=(255, 255, 255, 255))
# 腮红
d.ellipse([342, 636, 414, 690], fill=BLUSH)
# 微笑
d.arc([288, 628, 392, 714], start=15, end=105, fill=INK, width=9)

# 喷水：从头顶（身体最上方）往左上方散开
for x, y, r in [(300, 300, 15), (366, 336, 19), (428, 342, 14)]:
    d.ellipse([x - r, y - r, x + r, y + r], fill=(210, 234, 238, 235))
d.line([(352, 448), (348, 372)], fill=(210, 234, 238, 225), width=15)
d.line([(352, 384), (296, 322)], fill=(210, 234, 238, 225), width=15)
d.line([(352, 384), (418, 330)], fill=(210, 234, 238, 225), width=15)

img.save("build/icon.png")
sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
img.save("build/icon.ico", sizes=sizes)
print("ok")
