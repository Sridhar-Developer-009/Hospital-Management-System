from pathlib import Path
import re


CODE = Path("HospitalManagement/HighFidelityUserPlugin/code.js")
code = CODE.read_text(encoding="utf-8")

# Remove large embedded exact-reference image constants.
code = re.sub(r'const LANDING_PAGE_BASE64 = ".*?";\n', "", code, count=1)
code = re.sub(r'const ADMIN_LOGIN_WIDTH = 1536;\nconst ADMIN_LOGIN_HEIGHT = 1024;\nconst ADMIN_LOGIN_BASE64 = ".*?";\n', "", code, count=1)

# Remove exact reference frame functions.
code = re.sub(
    r'\nfunction exactReferenceFrame\(\) \{.*?\n\}\n\n',
    "\n",
    code,
    count=1,
    flags=re.S,
)
code = re.sub(
    r'\nfunction adminLoginExactFrame\(\) \{.*?\n\}\n\n',
    "\n",
    code,
    count=1,
    flags=re.S,
)

# Remove calls/viewport references for exact frames.
code = code.replace("  const exactPage = exactReferenceFrame();\n", "")
code = code.replace("  const adminLoginPage = adminLoginExactFrame();\n", "")
code = code.replace(
    "  figma.viewport.scrollAndZoomIntoView([exactPage, page, adminLoginPage]);\n",
    "  figma.viewport.scrollAndZoomIntoView([page]);\n",
)
code = code.replace(
    "  figma.viewport.scrollAndZoomIntoView([exactPage, page]);\n",
    "  figma.viewport.scrollAndZoomIntoView([page]);\n",
)

CODE.write_text(code, encoding="utf-8")
print(CODE)
