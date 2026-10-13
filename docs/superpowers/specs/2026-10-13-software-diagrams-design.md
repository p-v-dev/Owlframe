# Visao Software e diagramas internos

## Objetivo

Substituir a vista desativada `Em breve` por uma vista global `Software`, voltada a documentar as tecnologias que existem dentro da infraestrutura, como Go, Node.js, Nginx e Docker.

Cada bloco tecnologico pode manter uma galeria propria de diagramas simples. A primeira versao suporta Fluxograma, MER/DER, UML de Classes, UML de Casos de Uso e UML de Componentes. O objetivo e registrar estrutura e intencao com os blocos principais de cada notacao, sem modelagem semantica avancada.

## Escopo

### Incluido

- Ativar a terceira vista global e renomea-la para `Software` em novos projetos.
- Permitir blocos tecnologicos livres ou vinculados a componentes existentes.
- Manter o conteudo de cada bloco independente, mesmo quando houver vinculo.
- Disponibilizar uma galeria de diagramas nomeados em cada componente.
- Permitir criar, abrir, renomear e excluir diagramas.
- Usar um canvas e um modelo grafico comuns aos cinco tipos de diagrama.
- Oferecer paletas especificas por tipo de diagrama.
- Permitir texto livre nos blocos e rotulo opcional nos conectores.
- Exportar o diagrama ativo em SVG e PNG.
- Migrar o detalhe interno atual para um Fluxograma chamado `Fluxo principal`.

### Fora do escopo

- Validacao formal de UML, MER/DER ou fluxogramas.
- Atributos e metodos estruturados em classes.
- Campos, chaves, tipos ou cardinalidades estruturadas em entidades.
- Geracao de codigo, SQL ou documentacao automatica.
- Sincronizacao automatica entre infraestrutura e Software.
- Compartilhamento de galerias entre blocos vinculados.
- Diagramas recursivos dentro dos elementos de um diagrama.
- Colaboracao remota ou armazenamento em nuvem.

## Navegacao

### Vista global Software

A vista existente `view-servicos` continua com `altitude: 'servicos'`, mas novos documentos usam o nome `Software`. Manter o ID e a altitude evita criar uma quinta estrutura de navegacao ou quebrar referencias existentes.

A vista usa o canvas global atual. Sua paleta prioriza tecnologias, incluindo linguagens, runtimes, proxies, containers, bancos, filas e ferramentas ja presentes no catalogo de icones.

Um bloco pode ser:

- livre, sem relacao com outra vista; ou
- vinculado a um componente global por `{ viewId, nodeId }`.

O vinculo apenas comunica pertencimento, por exemplo `Go pertence ao Server A`. O bloco de Software continua com sua propria galeria e nao compartilha diagramas com o alvo.

### Galeria do componente

Todo componente global pode possuir uma galeria. A acao de detalhes abre a galeria antes de abrir um canvas interno.

A galeria apresenta cada diagrama como um item com:

- nome;
- tipo;
- acao para abrir;
- acao para renomear;
- acao para excluir.

A acao `Novo diagrama` solicita um nome e um dos cinco tipos. O nome deve conter ao menos um caractere nao vazio. Nomes repetidos sao permitidos porque a identidade e definida pelo ID.

Ao abrir um diagrama, a navegacao mostra projeto, vista, componente e diagrama. Voltar retorna primeiro para a galeria e depois para o canvas global.

## Tipos e paletas

Todos os elementos possuem texto livre. O tipo do diagrama controla apenas a paleta e a apresentacao visual; nao introduz regras semanticas.

### Fluxograma

- Inicio/fim
- Processo
- Decisao
- Entrada/saida

### MER/DER

- Entidade
- Relacionamento
- Atributo

### UML de Classes

- Classe
- Interface
- Enumeracao
- Pacote

### UML de Casos de Uso

- Ator
- Caso de uso
- Limite do sistema

### UML de Componentes

- Componente
- Interface
- Porta
- Pacote

Os conectores usam uma representacao comum com rotulo opcional, linha solida ou tracejada e marcador opcional na extremidade. A primeira versao nao interpreta cardinalidade, heranca, composicao, `include`, `extend` ou outras relacoes formais.

## Modelo de dados

### Versao do documento

A mudanca de um detalhe unico para uma galeria tipada altera o formato persistido. O documento passa para `schemaVersion: 2`.

Arquivos da versao 1 sao migrados antes da validacao. Arquivos de versoes futuras continuam sendo rejeitados.

### Canvas comum

Vistas globais continuam usando `DiagramNode`, pois representam componentes de arquitetura. Diagramas internos usam elementos proprios para nao misturar infraestrutura com notacoes de modelagem.

```ts
type ModelDiagramType = 'flowchart' | 'erd' | 'uml-class' | 'uml-use-case' | 'uml-component'

type DiagramElementKind =
  | 'start-end'
  | 'process'
  | 'decision'
  | 'input-output'
  | 'entity'
  | 'relationship'
  | 'attribute'
  | 'class'
  | 'interface'
  | 'enumeration'
  | 'package'
  | 'actor'
  | 'use-case'
  | 'system-boundary'
  | 'component'
  | 'port'

interface DiagramElement {
  id: string
  kind: DiagramElementKind
  label: string
  position: DiagramPosition
  width?: number
  height?: number
  style: DiagramStyle
}

interface DiagramConnector {
  id: string
  sourceId: string
  targetId: string
  label?: string
  style: 'solid' | 'dashed'
  marker: 'none' | 'end'
}

interface ModelDiagram {
  id: string
  name: string
  type: ModelDiagramType
  elements: DiagramElement[]
  connectors: DiagramConnector[]
  groups: DiagramGroup[]
  viewport: DiagramViewport
}

interface DiagramNodeLink {
  viewId: string
  nodeId: string
}
```

`DiagramNode` recebe dois campos opcionais:

```ts
interface DiagramNode {
  // campos atuais
  linkedTo?: DiagramNodeLink
  diagrams?: ModelDiagram[]
}
```

Elementos internos nao recebem `diagrams`, impedindo recursao.

## Fluxo de dados

O estado efemero do editor identifica separadamente:

- a vista global ativa;
- o componente cuja galeria esta aberta;
- o diagrama interno ativo.

O seletor de canvas ativo retorna a vista global ou o `ModelDiagram` selecionado. O identificador usado para remontar o React Flow inclui vista, componente e diagrama, evitando reaproveitar dimensoes ou viewport entre diagramas diferentes.

Alteracoes no canvas interno atualizam o diagrama por `viewId`, `nodeId` e `diagramId`. IDs de elementos e conectores precisam ser unicos apenas dentro do respectivo diagrama.

## Vinculos

Um vinculo sempre usa `viewId` e `nodeId`, porque IDs de nos sao unicos apenas dentro de cada canvas global.

Ao excluir o componente ou a vista apontada por um vinculo:

- o campo `linkedTo` e removido automaticamente;
- o bloco de Software e sua galeria sao preservados;
- nenhuma exclusao em cascata ocorre.

A interface mostra vinculos ausentes como estado desvinculado, sem bloquear a abertura da galeria.

## Migracao da versao 1

A migracao ocorre depois de interpretar o JSON e antes de validar o documento atual.

Para cada `DiagramNode.detail` existente, criar:

```ts
{
  id: 'main-flow',
  name: 'Fluxo principal',
  type: 'flowchart',
  elements: [...],
  connectors: [...],
  groups: detail.groups,
  viewport: detail.viewport
}
```

Cada no interno existente vira um elemento `process`, preservando:

- ID;
- rotulo;
- posicao;
- largura e altura;
- cor e demais propriedades visuais compativeis.

Cada aresta preserva ID, endpoints, rotulo e estilo. O marcador padrao e `end`.

O ID deterministico `main-flow` e local a cada componente e evita resultados diferentes a cada abertura. Depois da conversao, o campo legado `detail` e removido. Salvar um documento migrado grava apenas a versao 2.

Nomes de vistas de projetos existentes nao sao alterados automaticamente. Apenas novos documentos nascem com `Software`.

## Comportamentos de interface

- Abrir uma galeria vazia nao modifica o documento.
- Criar, renomear ou excluir um diagrama marca o documento como alterado.
- Excluir um diagrama solicita confirmacao e nao pode apagar outros diagramas.
- Excluir o ultimo diagrama deixa a galeria vazia.
- A paleta e o estado vazio sempre indicam o tipo do diagrama ativo.
- O painel de propriedades de um bloco Software permite vincular, trocar ou remover o componente de origem.
- A exportacao usa um nome derivado de projeto, componente e diagrama para evitar sobrescritas acidentais.
- O botao de detalhes nao aparece nos elementos internos, pois eles nao possuem galerias.

## Validacao e erros

A validacao da versao 2 verifica:

- IDs unicos de diagramas dentro de cada componente;
- nome nao vazio e tipo reconhecido;
- `elements`, `connectors`, `groups` e `viewport` validos;
- kinds permitidos para o tipo do diagrama;
- IDs unicos de elementos, conectores e grupos dentro do diagrama;
- endpoints e grupos locais existentes;
- dimensoes positivas;
- vinculos apontando para uma vista e um no global existentes.

Falhas de migracao ou validacao impedem abertura e gravacao, preservando o arquivo original. Mensagens identificam a vista, o componente e o diagrama afetado quando aplicavel.

## Exportacao

O exportador passa a aceitar um canvas estrutural em vez de exigir `DiagramView`. A mesma infraestrutura gera SVG e PNG para vistas globais e diagramas internos.

O nome sugerido segue o formato:

```text
<projeto>-<componente>-<diagrama>.<extensao>
```

## Testes

### Dominio

- Novo documento cria a vista `Software` habilitada para navegacao.
- Criar, renomear e excluir diagramas altera apenas o componente correto.
- Um componente aceita varios diagramas do mesmo tipo e com o mesmo nome.
- Remover alvo de vinculo limpa `linkedTo` sem remover o bloco Software.

### Migracao e validacao

- Documento v1 sem detalhes migra para v2 sem alterar o conteudo global.
- Detalhe v1 migra para `Fluxo principal` preservando IDs, layout, grupos, conexoes e viewport.
- Documento v2 reabre sem nova transformacao.
- Versao futura e rejeitada.
- Tipos, kinds, endpoints, grupos e vinculos invalidos sao rejeitados.

### Store

- Abrir galeria vazia nao marca o documento como alterado.
- Alternar diagramas mantem conteudo e viewport independentes.
- Voltar do diagrama retorna a galeria; voltar da galeria retorna a vista global.
- New e Open limpam a navegacao interna ativa.

### Interface

- `Software` substitui o botao desativado `Em breve` em novos documentos.
- A criacao exige nome e tipo.
- Cada tipo mostra somente sua paleta.
- Blocos livres e vinculados abrem galerias independentes.
- Confirmacao protege a exclusao de diagramas.

### Persistencia e exportacao

- Documento migrado e salvo como v2 e reabre com os mesmos diagramas.
- Escrita invalida nao sobrescreve o arquivo existente.
- SVG e PNG usam o canvas e o nome do diagrama ativo.

## Criterios de aceite

1. Um novo projeto possui a vista navegavel `Software`.
2. O usuario cria blocos tecnologicos livres ou vinculados sem compartilhar galerias.
3. Qualquer componente global pode manter varios diagramas nomeados.
4. Os cinco tipos exibem apenas seus blocos principais e usam texto livre.
5. Diagramas mantem canvas, viewport e exportacao independentes.
6. Projetos v1 abrem sem perda do detalhe interno existente.
7. Nenhuma funcionalidade avancada de modelagem e introduzida implicitamente.
