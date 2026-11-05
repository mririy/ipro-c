"""Портреты педагогов из документа школы (красный занавес, в рост или по пояс) → кадры 4:5 по лицу.
Лицо ищем OpenCV; кадр: лицо по центру по горизонтали, макушка примерно на 18 % от верха, видны плечи.
Запуск: python3 gen/teachers_media.py <папка assets сайта>"""
import os, sys
import cv2
from PIL import Image

SRC = '/home/claude/src/teachers'
OUT = os.path.join(sys.argv[1], 'img')
# номер педагога в документе → файл фото в документе
PHOTOS = {1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11, 13: 12, 14: 13, 15: 14, 16: 15,
          17: 16, 20: 17, 24: 18, 25: 19, 27: 20, 28: 21, 29: 22, 30: 23}
MODEL = '/home/claude/src/models/yunet.onnx'  # YuNet из opencv_zoo
for n, f in PHOTOS.items():
    path = f'{SRC}/image{f}.jpeg'
    im = Image.open(path).convert('RGB'); W, H = im.size
    bgr = cv2.imread(path)
    det = cv2.FaceDetectorYN.create(MODEL, '', (W, H), .6)
    _, res = det.detect(bgr)
    faces = [] if res is None else [tuple(int(v) for v in r[:4]) for r in res]
    if len(faces):
        x, y, w, h = max(faces, key=lambda r: r[2] * r[3])
    else:  # запасной вариант: лицо в верхней трети по центру
        w = h = int(min(W, H) * .18); x, y = W // 2 - w // 2, int(H * .2)
    ch = min(H, int(h * 4.6)); cw = int(ch * .8)
    if cw > W: cw = W; ch = int(cw / .8)
    cx = x + w / 2; top = y - h * .85
    left = int(min(max(0, cx - cw / 2), W - cw)); top = int(min(max(0, top), H - ch))
    crop = im.crop((left, top, left + cw, top + ch))
    big = crop.copy(); big.thumbnail((720, 900), Image.LANCZOS)
    big.save(f'{OUT}/ped-{n:02d}.jpg', quality=82, optimize=True, progressive=True)
    sm = crop.copy(); sm.thumbnail((360, 450), Image.LANCZOS)
    sm.save(f'{OUT}/ped-{n:02d}-sm.jpg', quality=78, optimize=True, progressive=True)
    print(n, f, (W, H), 'face' if len(faces) else 'НЕТ ЛИЦА', (left, top, cw, ch))
