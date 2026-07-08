from pathlib import Path
import base64


ROOT = Path("HospitalManagement/HighFidelityUserPlugin")
CODE = ROOT / "code.js"
IMAGE = ROOT / "assets" / "AdminLogin.png"

code = CODE.read_text(encoding="utf-8")
admin_b64 = base64.b64encode(IMAGE.read_bytes()).decode("ascii")

if "const ADMIN_LOGIN_BASE64" not in code:
    code = code.replace(
        "const H = 1536;\n",
        f'const H = 1536;\nconst ADMIN_LOGIN_WIDTH = 1536;\nconst ADMIN_LOGIN_HEIGHT = 1024;\nconst ADMIN_LOGIN_BASE64 = "{admin_b64}";\n',
        1,
    )

admin_fn = '''
function adminLoginExactFrame() {
  const existing = figma.currentPage.findOne(function(node) {
    return node.type === "FRAME" && node.name === "MedTrack Administrator Login - Exact Client Reference";
  });
  if (existing) existing.remove();

  const f = frame("MedTrack Administrator Login - Exact Client Reference", 0, 1660, ADMIN_LOGIN_WIDTH, ADMIN_LOGIN_HEIGHT, C.white);
  f.cornerRadius = 8;
  f.strokes = paint(C.line);
  f.strokeWeight = 1;
  const imageLayer = imageRect(f, "AdminLogin.png - exact client view", ADMIN_LOGIN_BASE64, 0, 0, ADMIN_LOGIN_WIDTH, ADMIN_LOGIN_HEIGHT, 8);
  imageLayer.locked = true;
  return f;
}
'''

if "function adminLoginExactFrame()" not in code:
    code = code.replace("async function main() {", admin_fn + "\nasync function main() {", 1)

if "  const adminLoginPage = adminLoginExactFrame();" not in code:
    code = code.replace(
        "  const exactPage = exactReferenceFrame();\n",
        "  const exactPage = exactReferenceFrame();\n  const adminLoginPage = adminLoginExactFrame();\n",
        1,
    )

code = code.replace(
    "  figma.viewport.scrollAndZoomIntoView([exactPage, page]);\n",
    "  figma.viewport.scrollAndZoomIntoView([exactPage, page, adminLoginPage]);\n",
    1,
)

CODE.write_text(code, encoding="utf-8")
print(CODE)
