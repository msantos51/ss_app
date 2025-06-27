import re, sys, pathlib

py_pattern = re.compile(r'^(\s*)(async\s+def|def|class)\s+([A-Za-z0-9_]+)')
js_pattern = re.compile(r'^(\s*)(function|const|class)\s+([A-Za-z0-9_]+)')

for fpath in sys.argv[1:]:
    path = pathlib.Path(fpath)
    text = path.read_text().splitlines()
    out = []
    pattern = py_pattern if path.suffix == '.py' else js_pattern
    for i, line in enumerate(text):
        m = pattern.match(line)
        if m:
            indent = m.group(1)
            name = m.group(3)
            # check previous significant line
            prev = None
            j = len(out) - 1
            while j >= 0:
                if out[j].strip():
                    prev = out[j]
                    break
                j -= 1
            if not (prev and prev.strip().startswith(('#','//'))):
                comment = f"{indent}{'#' if path.suffix=='.py' else '//'} {name}"
                out.append(comment)
        out.append(line)
    path.write_text('\n'.join(out)+('\n' if text and not text[-1].endswith('\n') else ''))
