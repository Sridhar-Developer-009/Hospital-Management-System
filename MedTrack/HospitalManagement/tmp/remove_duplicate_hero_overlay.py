from pathlib import Path


CODE = Path("HospitalManagement/HighFidelityUserPlugin/code.js")
code = CODE.read_text(encoding="utf-8")

start = '  pill(page, "All-in-One Hospital Management System", 50, 120, 216);\n'
end = '  text(page, "Reliable", 246, 391, 10, C.green, "Medium");\n\n'

if start in code and end in code:
    s = code.index(start)
    e = code.index(end, s) + len(end)
    code = code[:s] + code[e:]

CODE.write_text(code, encoding="utf-8")
print(CODE)
