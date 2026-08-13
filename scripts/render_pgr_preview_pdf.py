from pathlib import Path
from weasyprint import HTML

source = Path('/home/ubuntu/Downloads/PGR-Atlas-Metalurgica-homologacao.html')
target = Path('/home/ubuntu/Downloads/PGR-Atlas-Metalurgica-homologacao.pdf')

if not source.exists():
    raise SystemExit(f'Arquivo de origem não encontrado: {source}')

html = HTML(filename=str(source), base_url=str(source.parent))
html.write_pdf(str(target))
print(f'PDF gerado: {target} ({target.stat().st_size} bytes)')
