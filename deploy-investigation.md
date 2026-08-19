# Diagnóstico de deploy no Render

Em 19 de agosto de 2026, o deploy do commit `d37e9be` falhou durante o bundling do servidor no Render.

O log do Render apontou imports sem export correspondente em `server/db.ts`: `createYouTubeVideo`, `listPublishedYouTubeVideos`, `listYouTubeVideosForAdmin` e `updateYouTubeVideo`, consumidos por `server/routers/videoRouter.ts`. O mesmo deploy também indicou contratos de reuniões CIPA ausentes para `server/routers/cipaRouter.ts`.

A causa é a sincronização de uma versão local de `server/db.ts` que não continha os helpers dos módulos de vídeos e calendário CIPA já existentes na base GitHub `5b2eba1`. A reconciliação deve restaurar esses helpers preservando os aprimoramentos de EPIs adicionados na versão local.

Fonte: logs do serviço `tst-brasil-hub` no Render, deploy `dep-da2ib2tg1s2s73cqi0lg`.
