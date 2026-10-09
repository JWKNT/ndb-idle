WRENFOLD TEXT / WRENFOLD DISPLAY

Two custom Regular typefaces in a Baskerville anatomical direction.
These are OFL-licensed derivatives of Noto Serif and Noto Serif Display,
not copies of a proprietary Baskerville font or independent historical revivals.

INSTALL
Double-click either *-Regular.ttf and choose Install in your system's font
manager. For web use, use the matching WOFF2 with a standard @font-face rule.
Use Wrenfold Text for reading sizes; Wrenfold Display is intended for headings
and larger typesetting where its delicate strokes can resolve cleanly.

WHAT CHANGED
Q has a newly drawn lifting, calligraphic tail. R has a newly constructed round
bowl, flexible shoulder and curved running leg. J has a new baseline hook and
ball terminal. A/e crossbars, a/r terminals, g ear, t apex and numeral 7 are
reshaped individually. All remaining outlines receive non-affine optical
reshaping: the x-height is reduced, bowl waists are gently contracted and
serif-zone thickness is adjusted. These are outline changes, not renamed files.

COVERAGE / LIMITS
Both fonts retain 2,840 Unicode mappings and 3,256 glyphs, including full
printable ASCII and inherited Noto Latin, Greek and Cyrillic. Only Regular
is provided. Hinting is removed after outline edits; inherited GPOS/GSUB is
retained. Specialist-script shaping and application-specific spacing should
be checked in context. No independent exhaustive professional QA is claimed.

BUILD
Python 3.10+ with fonttools and Pillow. Install optional brotli for WOFF2.
Run: python build.py
Sources are local; no network access is needed to rebuild the outlines.
The proof images use DejaVu Sans for their small utility labels; this does
not affect the generated typefaces. On another system, change the utility
font path in proof() or skip proof() to build the fonts alone.

LICENSE
Both original sources and modified fonts are distributed under SIL OFL 1.1.
Keep sources/OFL-1.1.txt and the original notices with redistribution.
Do not sell the font software by itself. Documents made with the fonts are
not subject to OFL. See the full license for all conditions.
