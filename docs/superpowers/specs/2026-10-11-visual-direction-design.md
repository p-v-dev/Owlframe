# Direção Visual do Owlframe

## Decisão de Produto

O Owlframe é uma bancada local para arquitetos e desenvolvedores criarem mapas de um sistema em múltiplas altitudes. Uma pessoa deve poder abrir um projeto, escolher a vista necessária e documentar desde o contexto de infraestrutura até o fluxo entre workers, sem abandonar o mesmo modelo mental.

Um projeto contém vistas nomeadas, como `Contexto`, `Sistema`, `Serviços` e `Fluxo de pedidos`. Cada vista possui zoom semântico: ao afastar, ela prioriza grupos e relações; ao aproximar, revela componentes e conexões detalhadas. O zoom não cria uma vista nova nem altera o documento fora da vista ativa.

## Linguagem Visual

A identidade é um atlas operacional: a legibilidade de um mapa técnico com a precisão silenciosa de uma sala de controle. O canvas usa uma base mineral clara para funcionar em sessões longas e exportações; a moldura do aplicativo, navegação e controles usam grafite escuro para indicar ferramentas e estado operacional.

### Tokens

| Nome          | Valor     | Uso                                                        |
| ------------- | --------- | ---------------------------------------------------------- |
| Survey        | `#E8ECE7` | Canvas, superfícies amplas e fundo de exportação padrão    |
| Graphite      | `#162127` | Moldura do aplicativo, texto principal e controles escuros |
| Harbor        | `#315B68` | Seleção, navegação de vistas e elementos estruturais       |
| Signal Copper | `#C85F30` | Estado ativo, alertas de atenção e ação primária única     |
| Moss          | `#8DA59A` | Grupos, contêineres e informações auxiliares               |
| Cloud         | `#F8F7F2` | Superfícies elevadas, campos e texto sobre Graphite        |

### Tipografia

- `Instrument Sans` é a face de interface: títulos, nomes de vistas e controles.
- `IBM Plex Mono` é a face de precisão: IDs, rótulos técnicos, dados de conexão e escala.
- As fontes devem ser empacotadas localmente antes de se tornarem dependência visual do produto.

## Estrutura da Interface

- A barra superior mostra somente o projeto, a vista ativa, ações globais e o estado de salvamento.
- Uma régua vertical de altitude à esquerda alterna vistas nomeadas; ela não é uma paleta de componentes.
- O canvas recebe a maior área disponível e mantém o fundo Survey.
- O painel de propriedades aparece somente com seleção ativa e nunca reduz o canvas permanentemente em telas pequenas.
- A paleta de componentes entra em uma área secundária, distinta da régua de altitude.

## Assinatura Visual

A régua de altitude é o elemento memorável. Ela contém uma linha de contorno que muda de densidade com a vista ativa: contornos largos para contexto, linhas mais densas para serviços e trajetos direcionais finos para fluxo. O motivo comunica nível de abstração, não serve como enfeite.

## Regras de Diagramas

- Cada vista usa uma cor de sinal dominante; Signal Copper é reservado para foco, atenção e ação primária.
- Nós, grupos e arestas devem ser distinguíveis sem depender somente da cor.
- O zoom semântico reduz detalhes antes de reduzir legibilidade: ícones e rótulos secundários desaparecem primeiro, enquanto grupos e conexões principais permanecem.
- Fluxos devem ter direção evidente por seta, espaçamento e rótulo; não por animação obrigatória.
- Linhas de contorno, transições e movimento devem respeitar `prefers-reduced-motion`.
- Controles interativos devem ter foco visível e manter contraste suficiente sobre Survey e Graphite.

## Exemplos de Uso

- `Contexto`: provedores cloud, regiões, clientes externos e limites de rede.
- `Sistema`: frontend, APIs, banco de dados, filas e integrações principais.
- `Serviços`: serviços internos, bancos, tópicos e dependências diretas.
- `Fluxo de pedidos`: frontend para backend, eventos assíncronos e workers encadeados.

## Fora de Escopo

- Um modo de diagrama para cada provedor cloud.
- Temas adicionais antes de o atlas operacional estar maduro.
- Dependência de fontes, imagens ou dados hospedados remotamente.
