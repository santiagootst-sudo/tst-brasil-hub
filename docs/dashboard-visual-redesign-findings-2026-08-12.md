# Revisão visual do dashboard — 12/08/2026

A captura enviada mostra um hero com fundo escuro contínuo, cinco cartões de métricas repetitivos e contraste concentrado em branco sobre teal. A principal causa da fadiga visual é a grande superfície escura somada a cartões translúcidos de baixo contraste interno, sem uma camada clara de descanso visual entre título, descrição e indicadores.

A direção adotada para a correção é um hero claro por contexto: verde-neblina para Prestador de Serviço e azul muito claro para Empresa, com texto azul-petróleo, borda fina, sombra curta e cartões brancos de baixa elevação. Os indicadores continuam sendo os mesmos registros reais; somente a hierarquia, a superfície e os tratamentos de status foram alterados.

A validação com os IDs de ambiente consultados no banco não pôde renderizar o dashboard autenticado no preview porque a sessão atual não possui acesso a esses ambientes e as chamadas tRPC retornaram 403. A compilação TypeScript e a suíte local seguem aprovadas. A validação visual final com dados reais deve ser repetida na sessão do proprietário ou com um ambiente ao qual a sessão esteja vinculada.
