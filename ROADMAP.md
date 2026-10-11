# Owlframe — Roadmap

> **Owlframe** é um editor desktop, open source e local-first para criar diagramas visuais de arquitetura de software e infraestrutura, com foco em acabamento visual, simplicidade e futura integração com agentes de IA via MCP.

## Visão do produto

O usuário deve conseguir abrir o Owlframe, montar um diagrama com componentes e conexões, personalizar o visual e salvar/exportar o resultado **sem criar conta, sem conexão com a internet e sem depender de serviços externos**.

O foco é **diagramas bonitos e práticos**, não competir com o Figma ou implementar todas as funcionalidades de um editor gráfico genérico.

### Princípios inegociáveis

- **Offline-first:** criação, edição, carregamento, salvamento e exportação devem funcionar sem rede.
- **Sem login, backend remoto ou banco de dados obrigatório.** Os projetos são arquivos locais.
- **Separação de responsabilidades:** o formato do documento e as operações sobre ele não dependem do React Flow, do Electron nem da futura API MCP.
- **Simplicidade:** implementar apenas o necessário para entregar uma ferramenta utilizável; evitar abstrações especulativas.
- **Visual consistente:** os diagramas devem parecer bons por padrão, mesmo antes de qualquer personalização.
- **Open source de verdade:** documentação, licença, testes e releases instaláveis.
- **MCP é uma extensão futura:** não criar infraestrutura de IA durante o MVP.

### Direção visual: atlas operacional

- **Objetivo visual:** um projeto deve poder ser lido em múltiplas altitudes, do contexto de infraestrutura ao fluxo entre componentes.
- **Vistas nomeadas:** um projeto contém vistas independentes, como `Contexto`, `Sistema`, `Serviços` e `Fluxo de pedidos`; cada uma preserva o próprio canvas e viewport.
- **Zoom semântico:** ao afastar, a interface prioriza grupos e relações; ao aproximar, revela componentes e conexões detalhadas, sem criar nem alterar vistas.
- **Linguagem:** canvas mineral claro (`Survey #E8ECE7`), moldura em grafite (`Graphite #162127`) e uma única cor de sinal por vista; `Signal Copper #C85F30` é reservado para foco, atenção e ação primária.
- **Assinatura:** uma régua vertical de altitude alterna vistas e mostra uma linha de contorno cuja densidade comunica o nível de abstração ativo.
- **Legibilidade:** nós, grupos e arestas devem ser distinguíveis sem depender só de cor; foco visível, contraste adequado e `prefers-reduced-motion` são obrigatórios.
- **Offline:** fontes de interface e precisão devem ser empacotadas localmente quando adotadas; não depender de fontes ou ativos remotos.

## Stack

| Camada            | Tecnologia               | Responsabilidade                                     |
| ----------------- | ------------------------ | ---------------------------------------------------- |
| Desktop           | Electron                 | Janela, menus e integração com o sistema operacional |
| UI                | React + TypeScript       | Interface do editor                                  |
| Editor de grafos  | `@xyflow/react`          | Canvas, nós, arestas, seleção e interação            |
| Estado            | Zustand                  | Estado temporário do editor e ações da interface     |
| Layout            | `elkjs`                  | Posicionamento e roteamento assistidos               |
| Estilo            | Tailwind CSS             | Layout e design system da interface                  |
| Ícones            | Lucide + Simple Icons    | Interface e catálogo visual de tecnologias           |
| Persistência      | Arquivos JSON locais     | Abrir e salvar diagramas                             |
| Testes            | Vitest + Testing Library | Regras de domínio e componentes                      |
| Integração futura | MCP SDK                  | Acesso de agentes a operações sobre diagramas        |

> A lista indica as bibliotecas disponíveis, não a obrigação de usar todas desde a primeira fase.

## Definição de MVP

O MVP está concluído quando alguém consegue, do zero e sem internet:

1. Abrir o aplicativo desktop.
2. Criar um diagrama vazio.
3. Adicionar, mover, renomear e remover nós.
4. Conectar e desconectar nós.
5. Ajustar propriedades visuais básicas.
6. Salvar em um arquivo local e reabrir sem perder informações.
7. Exportar um diagrama legível em PNG ou SVG.

**Não fazem parte do MVP:** autenticação, colaboração em tempo real, sincronização em nuvem, geração por IA, marketplace, editor de código embutido ou importação de configurações reais de cloud/Kubernetes.

---

## Fase 0 — Fundação do projeto

**Objetivo:** ter uma aplicação Electron limpa, executável e fácil de manter.

- [x] Remover telas e conteúdos demonstrativos do template, preservando suas configurações funcionais.
- [x] Definir o nome do aplicativo como **Owlframe** (metadados e título da janela).
- [x] Configurar o Tailwind CSS no renderer.
- [x] Estabelecer lint, formatação e verificação de tipos utilizando as ferramentas já presentes no template sempre que possível.
- [x] Configurar Vitest para testar lógica TypeScript sem iniciar o Electron.
- [x] Criar uma estrutura de módulos simples, sem sobrearquitetura.
- [x] Manter Electron com `contextIsolation` habilitado, `nodeIntegration` desabilitado e preload com API mínima.
- [x] Documentar no README como instalar dependências e executar `npm run dev`.

**Critério de aceite:** o aplicativo abre uma janela vazia/limpa, os comandos de desenvolvimento e verificação passam e o renderer não tem acesso irrestrito às APIs do Node.js.

## Fase 1 — Modelo de documento e operações de domínio

**Objetivo:** definir o formato do diagrama antes de acoplá-lo à interface.

- [x] Definir um formato JSON versionado com `schemaVersion`, `metadata` e `views`; cada vista armazena `id`, nome, altitude, `nodes`, `edges` e `viewport`.
- [x] Definir os tipos de altitude (`contexto`, `sistema`, `servicos`, `fluxo`) e os tipos de nós, conexões, posição, rótulos, propriedades visuais e grupos sem importar tipos do React Flow na camada de domínio.
- [x] Criar funções puras para adicionar, atualizar e remover nós e arestas.
- [x] Garantir IDs estáveis e impedir referências inválidas (como conexão para nó inexistente).
- [x] Definir valores padrão de estilo, uma vista inicial `Contexto` e um documento inicial vazio.
- [x] Implementar validação na leitura de arquivos (incluindo versão do formato e mensagens úteis de erro).
- [x] Criar testes unitários cobrindo operações, integridade e serialização.

**Critério de aceite:** um diagrama pode ser criado e modificado em testes usando apenas TypeScript, sem React, React Flow ou Electron.

## Fase 2 — Canvas e edição básica

**Objetivo:** tornar possível desenhar e modificar um diagrama visualmente.

- [x] Integrar React Flow à interface.
- [ ] Criar a régua vertical de altitude para alternar entre vistas nomeadas sem confundi-la com a paleta de componentes.
- [x] Criar um nó visual padrão baseado no modelo de documento.
- [x] Adicionar nós por uma ação simples na interface.
- [ ] Permitir mover, selecionar, renomear e excluir nós.
- [x] Permitir criar, selecionar e excluir conexões.
- [x] Implementar pan, zoom, _fit view_ e atalhos essenciais.
- [x] Sincronizar alterações com Zustand sem introduzir um segundo formato de documento como fonte de verdade.
- [x] Distinguir estado persistido do diagrama de estado efêmero de UI (seleção, menus, painéis).
- [x] Criar estado vazio e feedback para operações inválidas.
- [ ] Aplicar zoom semântico progressivo: ocultar detalhes secundários antes de reduzir a legibilidade de grupos e conexões principais.

**Critério de aceite:** o usuário consegue montar e editar um pequeno diagrama com pelo menos cinco componentes conectados, sem editar JSON manualmente.

## Fase 3 — Salvar, abrir e recuperar projetos

**Objetivo:** tornar o aplicativo realmente utilizável offline.

- [x] Implementar `Novo`, `Abrir`, `Salvar` e `Salvar como` usando diálogos nativos do Electron.
- [x] Definir a extensão de projeto `.owlframe` (conteúdo JSON) ou `.json` documentado; escolher uma opção e mantê-la consistente.
- [x] Expor apenas operações necessárias de filesystem por IPC/preload, com validação no processo principal.
- [x] Evitar sobrescrever alterações não salvas sem confirmação.
- [x] Exibir nome do projeto e indicador de alterações pendentes.
- [x] Tratar arquivos inválidos, ausência de permissão e falhas de gravação sem travar o aplicativo.
- [x] Implementar escrita segura de arquivos (arquivo temporário + substituição, quando viável).
- [x] Testar o ciclo completo **criar → salvar → fechar → abrir → continuar editando**.

**Critério de aceite:** um projeto reabre com nós, conexões, posições e estilos preservados, inclusive após reiniciar o aplicativo.

## Fase 4 — Identidade visual e acabamento dos diagramas

**Objetivo:** aproximar o visual de diagramas modernos de arquitetura, em vez de apenas caixas ligadas por linhas.

- [ ] Criar o tema padrão **Atlas Operacional**: canvas Survey claro, moldura Graphite, Harbor para estrutura, Moss para grupos, Cloud para superfícies elevadas e Signal Copper somente para foco, atenção e ação primária.
- [ ] Empacotar localmente `Instrument Sans` para interface e `IBM Plex Mono` para precisão técnica antes de torná-las parte da identidade visual.
- [ ] Criar uma paleta lateral de componentes (serviço, banco de dados, fila, gateway, cliente e grupo).
- [ ] Adicionar ícones de tecnologias a partir de um catálogo local empacotado com o aplicativo.
- [ ] Permitir personalizar título, descrição opcional, ícone e cor dos componentes.
- [ ] Criar estilos de arestas (por exemplo, linha contínua, tracejada, seta e rótulo).
- [ ] Permitir criar contêineres/grupos visuais (por exemplo, `VPC`, `Kubernetes Cluster`, `Docker Compose`).
- [ ] Implementar alinhamento visual básico, grade opcional e _snap-to-grid_.
- [ ] Construir um painel de propriedades contextual, sem poluir o canvas.
- [ ] Implementar a assinatura de contorno na régua de altitude: densidade baixa no contexto, maior em serviços e trajetos direcionais finos em fluxos.
- [ ] Garantir foco visível, contraste adequado e respeito a `prefers-reduced-motion` para controles, transições e movimentos do canvas.
- [ ] Validar o resultado com dois exemplos reais: uma arquitetura web simples e uma arquitetura com microsserviços.

**Critério de aceite:** diagramas novos ficam visualmente consistentes por padrão e o usuário consegue reproduzir, de forma aproximada, o estilo de um diagrama profissional de infraestrutura.

## Fase 5 — Exportação e compartilhamento

**Objetivo:** usar os diagramas em README, documentação, apresentações e portfólio.

- [ ] Exportar SVG preservando texto, conexões e ícones.
- [ ] Exportar PNG com resolução configurável.
- [ ] Oferecer opção de fundo transparente ou fundo do tema.
- [ ] Ajustar enquadramento para incluir todo o diagrama, não apenas a área visível do canvas.
- [ ] Garantir que exportação não contenha elementos da interface do editor.
- [ ] Testar ícones, fontes, arestas, grupos e diagramas maiores nos arquivos exportados.

**Critério de aceite:** o usuário consegue inserir a exportação em um README ou slide com qualidade legível, sem precisar fazer captura de tela.

## Fase 6 — Organização automática e produtividade

**Objetivo:** reduzir o trabalho manual necessário para criar um diagrama bonito.

- [ ] Integrar ELK.js por um adaptador entre o modelo de documento e a biblioteca.
- [ ] Implementar a ação `Organizar automaticamente`.
- [ ] Oferecer pelo menos orientação horizontal e vertical.
- [ ] Preservar IDs, conteúdo e estilos durante o rearranjo.
- [ ] Adicionar desfazer/refazer para operações de edição, incluindo layout automático.
- [ ] Implementar duplicação de nós e atalhos de produtividade.
- [ ] Adicionar alguns templates locais (API + banco, serviços + fila, infraestrutura em camadas).
- [ ] Avaliar o roteamento de conexões em diagramas densos e ajustar somente onde for necessário.

**Critério de aceite:** um diagrama criado com posições arbitrárias pode ser reorganizado sem perda de informações; é possível desfazer a ação.

## Fase 7 — Qualidade, documentação e primeira release pública

**Objetivo:** publicar uma ferramenta open source que qualquer pessoa consiga instalar e usar.

- [ ] Definir licença (por exemplo, MIT ou Apache-2.0) e adicionar `LICENSE`.
- [ ] Escrever README com proposta, screenshots, recursos, instalação e limitações atuais.
- [ ] Adicionar `CONTRIBUTING.md` e um guia curto de arquitetura do código.
- [ ] Automatizar verificações de tipos, lint e testes com GitHub Actions.
- [ ] Configurar builds e pacotes para Windows; avaliar Linux como segundo alvo.
- [ ] Verificar funcionamento em instalação limpa, sem Node.js instalado na máquina do usuário.
- [ ] Publicar uma release com changelog e artefatos instaláveis.
- [ ] Registrar problemas conhecidos e objetivos futuros em issues.
- [ ] Revisar segurança do Electron, dependências e origens de conteúdo externo.

**Critério de aceite:** outra pessoa consegue baixar uma release, instalar, produzir um diagrama, salvá-lo e exportá-lo sem falar com o autor.

---

## Fase 8 — MCP local (pós-MVP)

**Objetivo:** permitir que agentes de IA criem e alterem diagramas usando ferramentas, sem tornar o Owlframe dependente de um provedor de IA.

### Pré-requisitos

- Modelo JSON estável e versionado.
- Operações de domínio independentes da UI.
- Salvar/abrir confiáveis e testes automatizados.

### Entregas

- [ ] Criar um processo/CLI MCP em TypeScript, usando o SDK oficial do protocolo e transporte `stdio`.
- [ ] Reutilizar as funções do domínio para manipular documentos em disco; **não automatizar cliques no Electron**.
- [ ] Expor um conjunto mínimo de ferramentas:
  - `create_diagram`
  - `get_diagram`
  - `add_node`
  - `update_node`
  - `remove_node`
  - `connect_nodes`
  - `auto_layout`
- [ ] Definir como cada ferramenta recebe o caminho/identificador do projeto e devolve resultados estruturados.
- [ ] Validar argumentos, caminhos e conteúdo de entrada; limitar escrita a arquivos explicitamente autorizados.
- [ ] Evitar conflitos entre edições feitas por IA e alterações ainda não salvas no aplicativo; inicialmente exigir recarregamento explícito ou confirmação de conflito.
- [ ] Documentar configuração do servidor MCP em clientes compatíveis, sem exigir chave de API no Owlframe.
- [ ] Adicionar testes de integração que criem e alterem um diagrama real em arquivo temporário.

**Critério de aceite:** um agente consegue criar e editar um arquivo Owlframe via MCP, e o aplicativo abre esse arquivo exibindo o diagrama corretamente.

> **Fora do escopo inicial do MCP:** descoberta automática de arquitetura de repositórios, geração inteligente de diagramas e sincronização em tempo real com o canvas. Isso pode vir depois, se houver demanda.

---

## Estrutura sugerida (evolutiva)

A estrutura exata pode seguir as convenções do template Electron. O importante é manter as fronteiras claras:

```text
src/
├── main/             # Electron: janela, menus, arquivos e IPC
├── preload/          # API estrita entre main e renderer
├── renderer/         # React: páginas, canvas, painéis e estado de UI
└── core/             # Tipos, validação e operações puras de diagramas

# Futuramente, fora do renderer:
# src/mcp/            # Servidor MCP que reutiliza core/
```

Se a configuração de build não permitir importar `core/` entre processos facilmente, ajustar a organização sem duplicar a lógica.

## Regras para agentes de desenvolvimento

1. **Trabalhar em uma fase por vez.** Não implementar funcionalidades de fases futuras sem solicitação.
2. **Entregar incrementos executáveis.** Cada mudança deve deixar o aplicativo funcionando.
3. **Priorizar a menor solução sustentável.** Não adicionar backend, autenticação, ORM, serviços externos ou dependências sem necessidade demonstrada.
4. **Preservar a independência do domínio.** `core/` não deve depender de React Flow, Electron ou MCP.
5. **Não inventar funcionalidades.** Seguir o critério de aceite e pedir decisão quando houver alternativa importante de produto.
6. **Testar as regras que podem quebrar projetos.** Principalmente IDs, conexões, compatibilidade de arquivos, salvamento e exportação.
7. **Manter o roadmap atualizado.** Marcar as tarefas concluídas somente após validar o comportamento.
8. **Ao encerrar cada etapa, informar:** alterações, arquivos principais, comandos executados, resultados dos testes e pendências.

## Prioridades

| Prioridade | Entrega                                                                  |
| ---------- | ------------------------------------------------------------------------ |
| **P0**     | Fundação, modelo de documento, canvas, edição e persistência (Fases 0–3) |
| **P1**     | Visual profissional e exportação (Fases 4–5)                             |
| **P2**     | Auto-layout, produtividade e release pública (Fases 6–7)                 |
| **P3**     | MCP local (Fase 8)                                                       |

## O que significa sucesso?

A primeira versão do Owlframe será bem-sucedida quando **o autor usar o aplicativo de verdade para documentar seus projetos** e uma pessoa desconhecida conseguir fazer o mesmo a partir da release pública. A integração MCP será um diferencial, não uma condição para o produto funcionar.
