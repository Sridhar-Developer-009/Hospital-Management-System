from pathlib import Path
import base64
import json


ROOT = Path("HospitalManagement/HighFidelityUserPlugin")
IMAGE = ROOT / "assets" / "LandingPage.png"


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    b64 = base64.b64encode(IMAGE.read_bytes()).decode("ascii")

    manifest = {
        "name": "HighFidelityUserPlugin",
        "id": "high-fidelity-user-plugin-medtrack-landing-page",
        "api": "1.0.0",
        "main": "code.js",
        "editorType": ["figma"],
    }

    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    code = f"""const IMAGE_WIDTH = 1024;
const IMAGE_HEIGHT = 1536;
const IMAGE_BASE64 = "{b64}";

function base64ToUint8Array(base64) {{
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {{
    bytes[i] = binary.charCodeAt(i);
  }}
  return bytes;
}}

function solid(hex) {{
  const value = hex.replace("#", "");
  return {{
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255
  }};
}}

async function main() {{
  const existing = figma.currentPage.findOne((node) => node.type === "FRAME" && node.name === "MedTrack Landing Page - High Fidelity");
  if (existing) existing.remove();

  const bytes = base64ToUint8Array(IMAGE_BASE64);
  const image = figma.createImage(bytes);

  const frame = figma.createFrame();
  frame.name = "MedTrack Landing Page - High Fidelity";
  frame.resize(IMAGE_WIDTH, IMAGE_HEIGHT);
  frame.x = 0;
  frame.y = 0;
  frame.clipsContent = true;
  frame.fills = [{{ type: "SOLID", color: solid("#ffffff") }}];
  frame.cornerRadius = 8;
  frame.strokes = [{{ type: "SOLID", color: solid("#d6e3dc") }}];
  frame.strokeWeight = 1;

  const landingImage = figma.createRectangle();
  landingImage.name = "LandingPage.png - exact visual reference";
  landingImage.resize(IMAGE_WIDTH, IMAGE_HEIGHT);
  landingImage.x = 0;
  landingImage.y = 0;
  landingImage.fills = [{{
    type: "IMAGE",
    scaleMode: "FILL",
    imageHash: image.hash
  }}];
  landingImage.locked = true;
  frame.appendChild(landingImage);

  figma.currentPage.appendChild(frame);
  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.closePlugin("Created exact MedTrack high-fidelity landing page frame.");
}}

main().catch((error) => {{
  figma.closePlugin(`HighFidelityUserPlugin failed: ${{error.message}}`);
}});
"""
    (ROOT / "code.js").write_text(code, encoding="utf-8")

    readme = """# HighFidelityUserPlugin

Figma plugin that creates an exact 1024 x 1536 high-fidelity MedTrack landing page frame from `assets/LandingPage.png`.

## Import in Figma

1. Open Figma Desktop.
2. Go to Plugins -> Development -> Import plugin from manifest.
3. Select `manifest.json` from this folder.
4. Run `HighFidelityUserPlugin`.

The plugin creates a locked full-frame image layer named `LandingPage.png - exact visual reference` inside `MedTrack Landing Page - High Fidelity`.
"""
    (ROOT / "README.md").write_text(readme, encoding="utf-8")

    print(ROOT.resolve())
    print(f"base64 chars {len(b64)}")


if __name__ == "__main__":
    main()
