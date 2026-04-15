#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow"]
# ///
"""
Resize drink icon PNGs to 256×256 (sharp for DrinkBro h-24 grid @ 2× DPR).
- Preserves transparency
- Scales to fit within 256×256, maintaining aspect ratio
- Centers on a 256×256 transparent canvas
- Output goes to <input>/resized/

Usage:
  uv run resize_icons.py -d <folder>   # all PNGs in folder
  uv run resize_icons.py -f <file>     # single PNG
"""

import argparse
from pathlib import Path
from PIL import Image


SIZE = 256


def resize_icon(src: Path, dst: Path) -> None:
    with Image.open(src) as img:
        img = img.convert("RGBA")

        # Crop out transparent border so artwork fills the canvas
        bbox = img.getbbox()
        if bbox:
            img = img.crop(bbox)

        img.thumbnail((SIZE, SIZE), Image.LANCZOS)

        canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        x = (SIZE - img.width) // 2
        y = (SIZE - img.height) // 2
        canvas.paste(img, (x, y), img)
        canvas.save(dst, "PNG", optimize=True)

    print(f"  {src.name} → {dst.name} → {SIZE}×{SIZE}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Batch-resize drink icon PNGs to 256×256.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("-d", "--dir", metavar="DIR", help="Directory of PNGs to resize")
    group.add_argument("-f", "--file", metavar="FILE", help="Single PNG to resize")
    args = parser.parse_args()

    if args.file:
        src = Path(args.file).resolve()
        if not src.is_file():
            print(f"Not a file: {src}")
            raise SystemExit(1)
        out_dir = src.parent / "resized"
        out_dir.mkdir(exist_ok=True)
        resize_icon(src, out_dir / src.name)
        print(f"\nDone. 1 file written to {out_dir}")
    else:
        folder = Path(args.dir).resolve()
        if not folder.is_dir():
            print(f"Not a directory: {folder}")
            raise SystemExit(1)
        pngs = sorted(folder.glob("*.png"))
        if not pngs:
            print(f"No PNG files found in {folder}")
            raise SystemExit(1)
        out_dir = folder / "resized"
        out_dir.mkdir(exist_ok=True)
        print(f"Resizing {len(pngs)} PNG(s) → {out_dir}")
        for src in pngs:
            resize_icon(src, out_dir / src.name)
        print(f"\nDone. {len(pngs)} file(s) written to {out_dir}")


if __name__ == "__main__":
    main()
