# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai", "Pillow", "python-dotenv"]
# ///
"""Generate Echo novel SEO image assets via Gemini + local post-processing.

Workflow:
  1. Gemini -> favicon master (1:1, no text, simple emblem)
  2. Gemini -> OG background (16:9, calm composition, reserve text room)
  3. Pillow -> export favicon sizes (.ico + multiple .png)
  4. Pillow -> compose OG (overlay editorial title + tagline)
  5. Write site.webmanifest

Env (loaded from ../.env or fallback to SKILL/.env):
  GOOGLE_AI_STUDIO_API_KEY | GEMINI_API_KEY | GOOGLE_API_KEY | VERTEX_AI_KEY
"""
from __future__ import annotations
import io
import json
import os
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
CACHE = ROOT / "scripts" / ".cache"
CACHE.mkdir(parents=True, exist_ok=True)

for env in [ROOT / ".env.local", ROOT / ".env", Path("/Users/innei/git/innei-repo/SKILL/.env")]:
    if env.exists():
        load_dotenv(env)


def make_client():
    from google import genai

    if vk := os.environ.get("VERTEX_AI_KEY"):
        return genai.Client(vertexai=True, api_key=vk), True
    key = (
        os.environ.get("GOOGLE_AI_STUDIO_API_KEY")
        or os.environ.get("GEMINI_API_KEY")
        or os.environ.get("GOOGLE_API_KEY")
    )
    if not key:
        sys.exit("no Gemini API key in env")
    return genai.Client(api_key=key), False


MODEL = "gemini-3.1-flash-image-preview"

FAVICON_PROMPT = """
Use case: stylized-concept
Asset type: website favicon source artwork
Primary request: Create a square, minimal emblem for "Echo" — a novel about a quiet AI in a 2010 terminal.
Scene/backdrop: aged off-white paper with very subtle fibrous grain, almost flat.
Subject: one centered abstract mark — a single soft vermilion blinking-cursor block resting on a thin ink horizontal line. Strong negative space.
Style/medium: refined editorial print mark, ink-on-paper feel, not photorealistic.
Composition/framing: perfect 1:1 square, centered mark, very large empty margin. Silhouette legible at 16px.
Lighting/mood: still, restrained, quiet.
Color palette: only off-white #fafaf6 ground, ink #0a0a0a line, single vermilion accent #c92a2a block.
Text (verbatim): none.
Constraints: no letters, no words, no border, no watermark, no extra objects.
Avoid: clutter, tiny details, glossy effects, gradients, drop shadows, photo realism.
"""

OG_PROMPT = """
Use case: stylized-concept
Asset type: open graph social preview background
Primary request: Create a wide atmospheric cover for "Echo" — a novel of a programmer and an AI in 2010.
Scene/backdrop: aged off-white editorial paper with extremely subtle ink stain at the left, fine fiber grain across the whole surface; a single ink-thin horizontal rule cuts through low in the frame.
Subject: an abstract composition suggesting late-night terminal glow leaking onto paper — a faint vermilion square (like a cursor block) anchored on the rule near the bottom-right; the rest of the page is calm negative space.
Style/medium: fine-art editorial cover, ink + paper, not photorealistic.
Composition/framing: wide horizontal 16:9, reserve the entire upper-left two thirds as calm empty paper for title overlay added later.
Lighting/mood: late-night, restrained, contemplative.
Color palette: only off-white #fafaf6 paper, ink #0a0a0a hairlines, single vermilion #c92a2a accent block.
Text (verbatim): none.
Constraints: no visible letters, no signage, no people, no watermark.
Avoid: busy scenes, decorative overload, saturated color, glossy UI effects, photo-realism.
"""


def gemini_image(client, vertex: bool, prompt: str, aspect: str, out: Path):
    if out.exists():
        print(f"  cache: {out}")
        return Image.open(out)
    from google.genai import types

    cfg_kwargs = {"response_modalities": ["IMAGE"], "image_config": types.ImageConfig(aspect_ratio=aspect)}
    if not vertex:
        cfg_kwargs["image_config"] = types.ImageConfig(aspect_ratio=aspect, image_size="2K")
    cfg = types.GenerateContentConfig(**cfg_kwargs)

    last_err = None
    for attempt in range(5):
        try:
            resp = client.models.generate_content(model=MODEL, contents=[prompt], config=cfg)
            for part in resp.parts or []:
                img = part.as_image()
                if img:
                    img.save(out)
                    print(f"  saved: {out}")
                    return Image.open(out)
            cands = getattr(resp, "candidates", None) or []
            finish = [getattr(c, "finish_reason", None) for c in cands]
            print(f"  no image (attempt {attempt+1}); finish={finish}")
        except Exception as e:
            last_err = e
            msg = str(e)
            if any(s in msg for s in ("503", "UNAVAILABLE", "429", "RESOURCE_EXHAUSTED")):
                time.sleep(2 ** attempt * 4)
                continue
            print(f"  error: {msg[:200]}")
        time.sleep(2)
    sys.exit(f"failed to generate {out}: {last_err}")


# fonts
def find(*candidates) -> str:
    for c in candidates:
        if os.path.exists(c):
            return c
    raise FileNotFoundError(candidates)


GEORGIA_BOLD = find(
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/Library/Fonts/Georgia Bold.ttf",
)
GEORGIA = find(
    "/System/Library/Fonts/Supplemental/Georgia.ttf",
    "/Library/Fonts/Georgia.ttf",
)
MENLO = find("/System/Library/Fonts/Menlo.ttc")
SONGTI = find(
    "/System/Library/Fonts/Supplemental/Songti.ttc",
    "/Library/Fonts/Songti.ttc",
)


def font(path: str, size: int, index: int = 0) -> ImageFont.FreeTypeFont:
    if path.endswith(".ttc"):
        return ImageFont.truetype(path, size, index=index)
    return ImageFont.truetype(path, size)


# ------- favicon -------
def make_favicons(master: Image.Image):
    print("» favicons")
    # crop to square (safety)
    w, h = master.size
    s = min(w, h)
    master = master.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
    master = master.resize((1024, 1024), Image.LANCZOS).convert("RGB")

    # Tight crop for small icon sizes — Gemini's master has too much negative
    # space, so the mark vanishes at 16/32px. Crop to the central 38% box.
    def tight(side: int):
        big = master.resize((1024, 1024), Image.LANCZOS)
        box_side = int(1024 * 0.38)
        offset = (1024 - box_side) // 2
        cropped = big.crop((offset, offset, offset + box_side, offset + box_side))
        return cropped.resize((side, side), Image.LANCZOS)

    # Loose crop (whole master) for large icons where negative space reads.
    def loose(side: int):
        return master.resize((side, side), Image.LANCZOS)

    for size, name in [
        (16, "favicon-16x16.png"),
        (32, "favicon-32x32.png"),
        (48, "favicon-48x48.png"),
    ]:
        tight(size).save(PUBLIC / name, optimize=True)
        print(f"  {name} (tight)")

    for size, name in [
        (180, "apple-touch-icon.png"),
        (192, "android-chrome-192x192.png"),
        (512, "android-chrome-512x512.png"),
    ]:
        loose(size).save(PUBLIC / name, optimize=True)
        print(f"  {name} (loose)")

    # multi-size ico from tight crop
    tight(48).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("  favicon.ico (tight)")


# ------- og -------
def make_og(base: Image.Image):
    print("» og.png")
    W, H = 1200, 630
    base = base.convert("RGB").resize((W, H), Image.LANCZOS)

    # soften so text reads: blend with off-white wash
    wash = Image.new("RGB", (W, H), (250, 250, 246))
    base = Image.blend(base, wash, 0.55)

    img = base.copy()
    d = ImageDraw.Draw(img)

    INK = (10, 10, 10)
    ACCENT = (201, 42, 42)
    MUTE = (90, 90, 90)
    MARGIN = 84

    # top double rule
    rule_y = 96
    d.rectangle([MARGIN, rule_y, W - MARGIN, rule_y + 3], fill=INK)
    d.rectangle([MARGIN, rule_y + 11, W - MARGIN, rule_y + 12], fill=INK)
    top_mono = font(MENLO, 20)
    d.text((MARGIN, rule_y - 30), "ECHO  ·  VOL. 1", fill=INK, font=top_mono)
    label = "●  ISSUE 01  ·  2026"
    lw = d.textlength(label, font=top_mono)
    d.text((W - MARGIN - lw, rule_y - 30), label, fill=ACCENT, font=top_mono)

    # kicker
    kicker = font(MENLO, 22)
    d.text((MARGIN, 170), "A NOVEL  ·  35 CHAPTERS", fill=ACCENT, font=kicker)

    # giant headline
    head = font(GEORGIA_BOLD, 168)
    d.text((MARGIN, 210), "Echo", fill=INK, font=head)
    head_w = d.textlength("Echo", font=head)
    slash = font(GEORGIA, 96)
    sx = MARGIN + head_w + 28
    d.text((sx, 256), "/", fill=ACCENT, font=slash)
    cn = font(SONGTI, 92, index=1)  # Bold
    d.text((sx + 60, 270), "回声", fill=MUTE, font=cn)

    # tagline
    tag = font(GEORGIA, 32)
    d.text((MARGIN, 420), "A novel of a programmer and an AI in 2010.", fill=INK, font=tag)
    tag_cn = font(SONGTI, 24, index=0)
    d.text((MARGIN, 466), "2010 年的深夜，他遇见了一个不属于时代的回声。", fill=MUTE, font=tag_cn)

    # bottom rule
    by = H - 96
    d.rectangle([MARGIN, by, W - MARGIN, by + 1], fill=INK)
    btm = font(MENLO, 19)
    d.text((MARGIN, by + 22), "By Innei  ·  echo-novel.innei.in", fill=MUTE, font=btm)
    fin = "—  fin  —"
    fw = d.textlength(fin, font=btm)
    d.text((W - MARGIN - fw, by + 22), fin, fill=ACCENT, font=btm)

    img.save(PUBLIC / "og.png", optimize=True)
    img.convert("RGB").save(PUBLIC / "og.jpg", quality=90, optimize=True)
    print("  og.png + og.jpg")


# ------- manifest -------
def write_manifest():
    manifest = {
        "name": "Echo — 回声",
        "short_name": "Echo",
        "description": "一部关于程序员、AI 与时代的小说。",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#fafaf6",
        "theme_color": "#c92a2a",
        "icons": [
            {"src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"},
        ],
    }
    (PUBLIC / "site.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    print("» site.webmanifest")


def main():
    print("Gemini SEO assets — Echo")
    client, vertex = make_client()
    fav_base = gemini_image(client, vertex, FAVICON_PROMPT, "1:1", CACHE / "favicon-master.png")
    og_base = gemini_image(client, vertex, OG_PROMPT, "16:9", CACHE / "og-base.png")
    make_favicons(fav_base)
    make_og(og_base)
    write_manifest()
    print("done.")


if __name__ == "__main__":
    main()
