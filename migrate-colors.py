#!/usr/bin/env python3
"""
Migra clases de color de Tailwind (slate/blue/indigo/amber/rose/emerald/purple)
a tokens semánticos. Uso:
    python3 migrate-colors.py [--dry-run] archivo1.tsx [archivo2.tsx ...]
Crea <archivo>.bak antes de escribir. Al final lista cualquier color que quede.
"""
import re, sys, shutil, pathlib

# 0) Reemplazos exactos previos: la tarjeta/tipo "Caja" usa su propio color
#    (si no, rose caería en "danger"). Se avisa si alguno no se encuentra.
PRE = [
    ('badgeClass: "bg-rose-100 text-rose-800 border-rose-200"',
     'badgeClass: "bg-caja-soft text-caja-strong border-caja-line"'),
    ('borderClass: "border-rose-300"', 'borderClass: "border-caja-edge"'),
    ('bgHoverClass: "hover:bg-rose-50/60"', 'bgHoverClass: "hover:bg-caja-subtle/60"'),
    ("border border-rose-200/90 bg-rose-50/20 hover:bg-rose-50/50",
     "border border-caja-line bg-caja-subtle/20 hover:bg-caja-subtle/50"),
    ("p-1.5 rounded-md bg-rose-100 text-rose-700",
     "p-1.5 rounded-md bg-caja-soft text-caja-strong"),
    ("px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-200",
     "px-1.5 py-0.2 text-[10px] font-semibold rounded-full bg-caja-soft text-caja-strong border border-caja-line"),
    ("h-7 text-xs px-2.5 rounded-md border-rose-200 text-rose-700 bg-white hover:bg-rose-50 font-semibold",
     "h-7 text-xs px-2.5 rounded-md border-caja-line text-caja-strong bg-card hover:bg-caja-subtle font-semibold"),
]

HUE = {"blue": "info", "indigo": "seccion", "amber": "reserva",
       "rose": "danger", "red": "danger", "emerald": "success", "purple": "cross"}
NEUTRAL = {"slate", "gray", "zinc", "neutral"}
SHADE = {"50": "subtle", "100": "soft", "200": "line", "300": "edge", "400": "edge",
         "500": "solid", "600": "solid", "800": "strong", "900": "ink", "950": "ink"}
BG, TXT, BRD = {"bg", "from", "via", "to"}, {"text", "decoration", "fill", "stroke", "caret", "accent"}, {"border", "divide", "outline"}

def neutral(kind, shade):
    n = int(shade)
    if kind in BRD: return "border"
    if kind == "ring": return "ring"
    if kind in TXT: return "foreground" if n >= 700 else "muted-foreground"
    # fondos
    if n <= 200: return "muted"
    if n == 300: return "border"
    if n <= 600: return "muted-foreground"
    return "sidebar"

PAT = re.compile(
    r"(?<![\w-])((?:[a-z0-9-]+:)*)(bg|from|via|to|text|decoration|fill|stroke|caret|accent|border|divide|outline|ring)"
    r"-(slate|gray|zinc|neutral|blue|indigo|amber|rose|emerald|purple|red)-(\d{2,3})"
    r"((?:/(?:\d+|\[[^\]]+\]))?)(?![\w-])")
WHITE = re.compile(r"(?<![\w-])((?:[a-z0-9-]+:)*)(bg|text|border)-white((?:/\d+)?)(?![\w-])")
LEFT = re.compile(r"(?<![\w-])(?:[a-z0-9-]+:)*(?:bg|from|via|to|text|border|divide|ring|outline)-(?:slate|gray|zinc|neutral|blue|indigo|amber|rose|emerald|purple|red)-\d{2,3}")

def sub_color(m):
    var, kind, color, shade, op = m.groups()
    if color in NEUTRAL:
        return f"{var}{kind}-{neutral(kind, shade)}{op}"
    token = HUE[color]
    if shade == "700":
        part = "strong" if kind in TXT else "solid-hover"
    else:
        part = SHADE.get(shade, "solid")
    return f"{var}{kind}-{token}-{part}{op}"

def sub_white(m):
    var, kind, op = m.groups()
    return f"{var}{kind}-" + {"bg": "card", "text": "solid-foreground", "border": "card"}[kind] + op

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit(__doc__)
    for f in args:
        p = pathlib.Path(f)
        src = p.read_text(encoding="utf-8")
        out = src
        for old, new in PRE:
            if old in out: out = out.replace(old, new)
            else: print(f"  aviso: no encontrado (revisar a mano): {old[:60]}...")
        out, n1 = PAT.subn(sub_color, out)
        out, n2 = WHITE.subn(sub_white, out)
        left = sorted(set(LEFT.findall(out)))
        print(f"{f}: {n1} colores + {n2} blancos migrados; sin migrar: {len(left)}")
        for l in left: print("   ", l)
        if not dry:
            shutil.copy(p, str(p) + ".bak")
            p.write_text(out, encoding="utf-8")
if __name__ == "__main__":
    main()
