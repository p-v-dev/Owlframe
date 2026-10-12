# MVP Completo do Owlframe

## Escopo

Concluir as pendências das Fases 2, 4 e 5 do roadmap. As Fases 6 e posteriores não fazem parte deste trabalho.

## Arquitetura

- `src/core/` continua sendo a única fonte do documento persistível.
- O documento contém vistas, grupos, nós, arestas e viewport sem depender de React Flow, Electron ou exportadores.
- O Zustand mantém o documento e o estado efêmero da interface, incluindo a vista ativa e a seleção.
- A conversão entre o documento e React Flow fica no renderer; não haverá um segundo formato persistível.

## Vistas e Canvas

- A régua vertical de altitude alterna entre vistas nomeadas: `Contexto`, `Sistema`, `Serviços` e `Fluxo`.
- Cada vista mantém os seus próprios nós, arestas e viewport.
- A régua é distinta da paleta de componentes e mostra um contorno apropriado para a altitude ativa.
- O zoom semântico altera somente a apresentação: oculta primeiro ícones e detalhes secundários, preservando grupos, nomes e conexões principais.

## Edição e Grupos

- A edição permite selecionar, mover, renomear e remover nós, além de criar e remover conexões.
- Operações inválidas exibem feedback e não modificam o documento.
- Grupos são criados explicitamente, têm título editável e contêm nós por `groupId`.
- Ao remover um grupo, seus nós permanecem no diagrama sem associação ao grupo.

## Identidade Visual

- O tema Atlas Operacional aplica Survey ao canvas, Graphite à moldura, Harbor à estrutura, Moss aos grupos, Cloud às superfícies e Signal Copper a foco, alerta e ação primária.
- Instrument Sans e IBM Plex Mono são ativos locais.
- A interface mantém foco visível, contraste adequado e respeita `prefers-reduced-motion`.

## Exportação

- O editor exporta SVG com texto, conexões e ícones preservados e PNG com resolução configurável.
- A exportação oferece fundo transparente ou Survey e enquadra todo o conteúdo do diagrama.
- Controles e painéis do editor não entram no arquivo exportado.

## Validação

- Testes de domínio cobrem integridade de vistas e grupos.
- Testes de renderer e store cobrem edição, troca de vistas e exportação.
- Dois documentos de exemplo validam uma arquitetura web simples e uma arquitetura de microsserviços.
