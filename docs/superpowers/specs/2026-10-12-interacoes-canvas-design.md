# Interacoes do Canvas

## Objetivo

Dar resposta visual direta e discreta para a manipulacao do diagrama, mantendo o Owlframe como um editor tecnico preciso. O movimento deve ser sutil, profissional e respeitar `prefers-reduced-motion`.

## Resize de Grupos

- Grupos selecionados exibem `NodeResizer`, como os componentes ja exibem.
- O redimensionamento respeita as dimensoes minimas usadas pelo grupo padrao e persiste `width` e `height` no documento ao final da interacao.
- Durante o resize, o grupo exibe contorno e elevacao suaves. Ao soltar, esses estados retornam ao normal sem alterar a posicao ou o conteudo dos componentes.

## Feedback do Canvas

- Arrastar um componente ou grupo ativa um contorno e elevacao discretos no elemento em movimento.
- Selecionar um componente ou grupo torna seu estado de selecao imediatamente identificavel por contorno, sombra e cor, sem depender apenas da cor.
- Handles de conexao mudam de tamanho, cor e sombra em hover e durante uma conexao valida. A linha temporaria de conexao tambem recebe esse tratamento.
- A entrada de novos componentes continua com uma unica animacao curta; nao havera animacoes continuas nem mensagens de confirmacao.
- As transicoes de interacao usam aproximadamente 160 ms e curvas suaves. Movimento real no canvas nao sera animado por CSS para nao introduzir atraso ou imprecisao durante drag/resize.

## Controles e Campos

- Botoes recebem hover, foco visivel e uma pequena resposta de pressao no clique, preservando contraste e acao primaria em Signal Copper.
- Inputs, selects e controles de cor deixam de depender da aparencia padrao do navegador: usam superficie Cloud, borda arredondada, hover discreto e foco Harbor visivel.
- As mesmas regras de raio e transicao sao aplicadas a controles da barra, paleta e painel de propriedades para manter consistencia.

## Acessibilidade e Escopo

- Em `prefers-reduced-motion: reduce`, transicoes e animacoes decorativas sao removidas, sem remover os estados de foco, hover e selecao.
- Nenhuma dependencia de animacao sera adicionada; CSS e estados existentes do React Flow cobrem o escopo.
- Nenhuma mensagem temporaria, toast, auto-layout ou nova funcionalidade de edicao faz parte desta alteracao.

## Verificacao

- Testar manualmente o resize de grupos e sua persistencia apos salvar e reabrir um projeto.
- Confirmar que drag, resize, selecao, handles, conexoes, botoes e campos possuem resposta visual direta.
- Executar `npm run check` e verificar o comportamento reduzido com a preferencia de movimento reduzido ativa.
