from pathlib import Path
import secrets
p=Path('.dev.vars')
if not p.exists():
    p.write_text('TEAM_TOKEN="'+secrets.token_urlsafe(36)+'"\n')
    p.chmod(0o600)
    print('Se creó .dev.vars con un token aleatorio local; no se incluye en Git ni en ZIP.')
else:
    print('Se conserva .dev.vars existente.')
