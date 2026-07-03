from pathlib import Path
import base64
import re


ROOT = Path("HospitalManagement/HighFidelityUserPlugin")
CODE = ROOT / "code.js"
HERO = ROOT / "assets" / "hero-section.png"

code = CODE.read_text(encoding="utf-8")
hero_b64 = base64.b64encode(HERO.read_bytes()).decode("ascii")

code = re.sub(
    r'const HERO_PHOTO_BASE64 = ".*?";',
    f'const HERO_PHOTO_BASE64 = "{hero_b64}";',
    code,
    count=1,
)

code = code.replace(
    '  buildingScene(page, 24, 80, 976, 356);\n'
    '  imageRect(page, "Hero hospital photo crop", HERO_PHOTO_BASE64, 300, 80, 700, 356, 11);\n'
    '  rect(page, "Hero left readability wash", 24, 80, 390, 356, gradient(rgb("#edf8f2"), rgb("#ffffff")), 11, null).opacity = 0.84;\n',
    '  imageRect(page, "Hero section exact soft-fade crop", HERO_PHOTO_BASE64, 24, 80, 976, 356, 11);\n',
)

CODE.write_text(code, encoding="utf-8")
print(CODE)
