from pathlib import Path
import hashlib
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'artifacts' / 'crm-whatsapp-ana-completo.zip'
output.parent.mkdir(exist_ok=True)
required = ['dist/index.html', 'extension-dist/manifest.json', 'package-lock.json', 'README.md']
for name in required:
    if not (root / name).is_file():
        raise SystemExit('Falta ' + name + '. Ejecuta npm ci y npm run build antes de empaquetar.')
excluded = {'.git', 'node_modules', '.wrangler', 'artifacts', '__pycache__', '.npm-cache'}
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(root.rglob('*')):
        relative = path.relative_to(root)
        if any(part in excluded for part in relative.parts):
            continue
        if not path.is_file() or path.is_symlink():
            continue
        if path.name in {'.dev.vars', 'wrangler.local.toml'} or path.name.startswith('.env') or path.suffix in {'.log', '.sqlite', '.db'}:
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
