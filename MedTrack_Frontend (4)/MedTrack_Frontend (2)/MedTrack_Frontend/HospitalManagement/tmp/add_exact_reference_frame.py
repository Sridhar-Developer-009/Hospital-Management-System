from pathlib import Path
import base64


ROOT = Path("HospitalManagement/HighFidelityUserPlugin")
CODE = ROOT / "code.js"
IMAGE = ROOT / "assets" / "LandingPage.png"

code = CODE.read_text(encoding="utf-8")
landing_b64 = base64.b64encode(IMAGE.read_bytes()).decode("ascii")

if "const LANDING_PAGE_BASE64" not in code:
    code = code.replace(
        "const H = 1536;\n",
        f'const H = 1536;\nconst LANDING_PAGE_BASE64 = "{landing_b64}";\n',
    )

exact_fn = '''
function exactReferenceFrame() {
  const existing = figma.currentPage.findOne(function(node) {
    return node.type === "FRAME" && node.name === "MedTrack Landing Page - Exact Client Reference";
  });
  if (existing) existing.remove();

  const f = frame("MedTrack Landing Page - Exact Client Reference", -1120, 0, W, H, C.white);
  f.cornerRadius = 8;
  f.strokes = paint(C.line);
  f.strokeWeight = 1;
  const imageLayer = imageRect(f, "LandingPage.png - exact client view", LANDING_PAGE_BASE64, 0, 0, W, H, 8);
  imageLayer.locked = true;
  return f;
}
'''

if "function exactReferenceFrame()" not in code:
    code = code.replace("async function main() {", exact_fn + "\nasync function main() {")

if "  const exactPage = exactReferenceFrame();" not in code:
    code = code.replace(
        '  const existing = figma.currentPage.findOne((node) => node.type === "FRAME" && node.name === "MedTrack Landing Page - Fully Editable");\n'
        "  if (existing) existing.remove();\n\n",
        '  const existing = figma.currentPage.findOne(function(node) { return node.type === "FRAME" && node.name === "MedTrack Landing Page - Fully Editable"; });\n'
        "  if (existing) existing.remove();\n\n"
        "  const exactPage = exactReferenceFrame();\n",
    )

code = code.replace(
    "  figma.viewport.scrollAndZoomIntoView([page]);\n",
    "  figma.viewport.scrollAndZoomIntoView([exactPage, page]);\n",
)

CODE.write_text(code, encoding="utf-8")
print(CODE)
