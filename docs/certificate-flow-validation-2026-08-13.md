# Validação do fluxo de emissão de certificado

## Prévia preenchida

A sessão autenticada abriu o ambiente Autônomo `workspace=240001` e o menu exibiu o item **Gerador de certificados NR**. O formulário foi preenchido com participante, CPF, empresa, local, instrutora, registro profissional, telefone, validade de 24 meses, marca d’água e URL de validação para QR Code.

A prévia dinâmica refletiu imediatamente o nome `João da Silva`, o curso `Trabalho em altura`, a conclusão em `13/08/2026`, a validade em `13/08/2028`, a instrutora `Mariana Oliveira`, os oito módulos e a carga de 8h. O acervo ainda indicava 0 registros antes da emissão.

## Geração, download e acervo

Ao acionar **Gerar certificado frente e verso**, o portal exibiu o toast `Documento legal ou certificado registrado. PDF gerado e certificado adicionado ao acervo.` O contador do acervo passou de 0 para 1 e o cartão registrado apresentou `NR-35 · Trabalho em altura`, participante `João da Silva`, validade até `13/08/2028`, URL de evidência e os metadados de empresa, CPF, local, instrutora, registro e carga horária.

A página interna de downloads do navegador confirmou o arquivo `Certificado_NR-35_Jo_o_da_Silva.pdf` baixado a partir da pré-visualização autenticada. O próximo passo é inspecionar tecnicamente o PDF para confirmar as duas páginas e o QR Code incorporado.

## Inspeção técnica do arquivo

O arquivo baixado tem 15.375 bytes, foi produzido pelo jsPDF, possui **2 páginas A4** e não está criptografado. A extração textual confirmou a frente com certificado, participante, CPF, empresa, NR-35, validade, local, conclusão, instrutora e registro; o verso contém os oito itens do conteúdo programático, conteúdo prático integrado, contato, instrução de validação, registro e QR Code.

`pdfimages -list` identificou uma imagem RGB de 240×240 px na página 2, consistente com o QR Code incorporado. A exportação da imagem para PNG também foi concluída sem erro.
