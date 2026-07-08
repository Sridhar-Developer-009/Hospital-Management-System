from pathlib import Path
import base64


ROOT = Path("HospitalManagement/HighFidelityUserPlugin")
ASSETS = ROOT / "assets"
CODE = ROOT / "code.js"


def b64(name: str) -> str:
    return base64.b64encode((ASSETS / name).read_bytes()).decode("ascii")


code = CODE.read_text(encoding="utf-8")

consts = f'''
const HERO_PHOTO_BASE64 = "{b64("hero-photo.png")}";
const DASHBOARD_PHOTO_BASE64 = "{b64("dashboard-photo.png")}";
const CTA_PEOPLE_BASE64 = "{b64("cta-people.png")}";
'''

if "const HERO_PHOTO_BASE64" not in code:
    code = code.replace("const H = 1536;\n", "const H = 1536;\n" + consts)

helper = '''
function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function imageRect(parent, name, base64, x, y, w, h, radius = 8) {
  const image = figma.createImage(base64ToUint8Array(base64));
  const n = figma.createRectangle();
  n.name = name;
  n.x = x;
  n.y = y;
  n.resize(w, h);
  n.cornerRadius = radius;
  n.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
  n.strokes = [];
  parent.appendChild(n);
  return n;
}
'''

if "function base64ToUint8Array" not in code:
    code = code.replace("function rgb(hex) {", helper + "\nfunction rgb(hex) {")

code = code.replace(
    "  buildingScene(page, 24, 80, 976, 356);\n",
    '  buildingScene(page, 24, 80, 976, 356);\n'
    '  imageRect(page, "Hero hospital photo crop", HERO_PHOTO_BASE64, 300, 80, 700, 356, 11);\n'
    '  rect(page, "Hero left readability wash", 24, 80, 390, 356, gradient(rgb("#edf8f2"), rgb("#ffffff")), 11, null).opacity = 0.84;\n',
)

code = code.replace(
    "  dashboardMock(page, 350, 1018);\n",
    '  imageRect(page, "Dashboard laptop photo crop", DASHBOARD_PHOTO_BASE64, 350, 1005, 624, 310, 8);\n',
)

code = code.replace(
    '  ellipse(page, "Doctor portrait head", 815, 1425, 24, rgb("#9a6a4d"));\n'
    '  rect(page, "Doctor portrait body", 795, 1451, 62, 52, C.white, 16, C.line);\n'
    '  ellipse(page, "Nurse portrait head", 877, 1428, 24, rgb("#8d5f44"));\n'
    '  rect(page, "Nurse portrait body", 858, 1452, 58, 51, rgb("#58b2d8"), 16, null);\n',
    '  imageRect(page, "CTA doctors photo crop", CTA_PEOPLE_BASE64, 780, 1407, 194, 96, 8);\n',
)

CODE.write_text(code, encoding="utf-8")
print(CODE)
