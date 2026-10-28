from pathlib import Path
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'artifacts' / 'crm-whatsapp-ana-completo.zip'
output.parent.mkdir(exist_ok=True)
required = ['dist/index.html', 'dist/panel.html', 'dist/version.json', 'extension-dist/manifest.json', 'extension-dist/shell.js', 'extension-dist/icons/icon-128.png', 'package-lock.json', 'README.md', 'public/powerbi/CRM_ANA_PowerBI.pbip.zip', 'public/docs/revision-15-funciones.html', 'store/FICHA_TIENDA.md']
for name in required:
    if not (root / name).is_file():
        raise SystemExit('Falta ' + name + '. Ejecuta npm ci y npm run build antes de empaquetar.')
inputs = ['src','shared','extension','public','server','functions','migrations','package.json','package-lock.json','index.html','panel.html','vite.config.js','scripts/build-extension.mjs','scripts/build-fingerprint.mjs']
sources = []
for name in inputs:
    path = root / name
    sources.extend(path.rglob('*') if path.is_dir() else [path])
fingerprint = hashlib.sha256()
for path in sorted((p for p in sources if p.is_file()), key=lambda p: p.relative_to(root).as_posix()):
    fingerprint.update((path.relative_to(root).as_posix() + '\0' + hashlib.sha256(path.read_bytes()).hexdigest() + '\n').encode())
if json.loads((root / 'dist/version.json').read_text()).get('sourceHash') != fingerprint.hexdigest():
    raise SystemExit('La compilación no corresponde al código actual. Ejecuta npm run build correctamente antes de empaquetar.')
template = root / 'powerbi' / 'CRM_ANA.SemanticModel' / 'definition' / 'expressions.tmdl'
if not re.search(r'^expression pTeamToken = "" meta', template.read_text(), re.M):
    raise SystemExit('El proyecto Power BI tiene parámetros privados modificados. Restaura la plantilla sin token antes de empaquetar.')
with zipfile.ZipFile(root / 'public/powerbi/CRM_ANA_PowerBI.pbip.zip') as project:
    expressions = project.read('CRM_ANA_PowerBI/CRM_ANA.SemanticModel/definition/expressions.tmdl').decode()
    if not re.search(r'^expression pTeamToken = "" meta', expressions, re.M):
        raise SystemExit('El ZIP Power BI debe contener la plantilla sin token.')
excluded = {'.git', 'node_modules', '.wrangler', 'artifacts', '__pycache__', '.npm-cache', '.pbi'}
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if any(part in excluded for part in relative.parts):
            continue
        if not path.is_file() or path.is_symlink():
            continue
        if path.name in {'.dev.vars', 'wrangler.local.toml'} or path.name.startswith('.env') or path.suffix.lower() in {'.log', '.sqlite', '.db', '.pbix'}:
            continue
        archive.write(path, 'crm-whatsapp-ana/' + relative.as_posix())
with zipfile.ZipFile(output) as archive:
    bad = archive.testzip()
    if bad:
        raise SystemExit('Archivo corrupto: ' + bad)
digest = hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.zip.sha256').write_text(digest + '  ' + output.name + '\n')
print(str(output))
print('Bytes: ' + str(output.stat().st_size))
print('SHA-256: ' + digest)

extension_output = output.parent / 'crm-ana-extension.zip'
with zipfile.ZipFile(extension_output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted((root / 'extension-dist').rglob('*')):
        if path.is_file() and not path.is_symlink():
            archive.write(path, path.relative_to(root / 'extension-dist').as_posix())
with zipfile.ZipFile(extension_output) as archive:
    assert archive.testzip() is None
    assert 'manifest.json' in archive.namelist()
extension_digest = hashlib.sha256(extension_output.read_bytes()).hexdigest()
extension_output.with_suffix('.zip.sha256').write_text(extension_digest + '  ' + extension_output.name + '\n')
print(str(extension_output))
print('Bytes: ' + str(extension_output.stat().st_size))
print('SHA-256: ' + extension_digest)
