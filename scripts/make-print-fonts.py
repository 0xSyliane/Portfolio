#!/usr/bin/env python3
"""Builds the STATIC Bricolage Grotesque instances used only by the CV PDF (print.css).

Why: Chromium embeds a variable font as Type 3 in PDFs, so `pdftotext` loses the spaces
(ATS readability). Static TrueType instances are embedded as CID TrueType instead.

Needs fonttools + brotli (never installed globally):
    python3 -m venv /dev/shm/ftvenv && /dev/shm/ftvenv/bin/pip install fonttools brotli
    /dev/shm/ftvenv/bin/python scripts/make-print-fonts.py
Output (committed): public/fonts/print/bricolage-print-{400,600,800}.woff2 + OFL.txt.
Weights match print.css usage (body 400, titles 600, name/headings 800); opsz is fixed per
instance (about the point size of the text that uses it: 14 for body, 20 for the 800 headings).
"""
from pathlib import Path
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2"
OUT = ROOT / "public/fonts/print"
# (weight, opsz)
INSTANCES = [(400, 14), (600, 14), (800, 20)]
# Latin + French punctuation (same coverage as the web subset).
UNICODES = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x100))
    + [0x131, 0x152, 0x153, 0x2BB, 0x2BC, 0x2C6, 0x2DA, 0x2DC, 0x20AC, 0x2122, 0x2191, 0x2193, 0x2212, 0x2215]
    + list(range(0x2000, 0x2070))
)

OUT.mkdir(parents=True, exist_ok=True)
for weight, opsz in INSTANCES:
    font = instancer.instantiateVariableFont(TTFont(SRC), {"wght": weight, "opsz": opsz}, inplace=False)
    options = Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = Subsetter(options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    # Readable names in the PDF font table.
    ps = f"BricolagePrint-{weight}"
    for rec in font["name"].names:
        if rec.nameID in (1, 16):
            rec.string = "Bricolage Print"
        elif rec.nameID in (2, 17):
            rec.string = str(weight)
        elif rec.nameID == 4:
            rec.string = f"Bricolage Print {weight}"
        elif rec.nameID == 6:
            rec.string = ps
    font.flavor = "woff2"
    target = OUT / f"bricolage-print-{weight}.woff2"
    font.save(target)
    print(f"{target.relative_to(ROOT)}  {target.stat().st_size} bytes  (wght {weight}, opsz {opsz})")
