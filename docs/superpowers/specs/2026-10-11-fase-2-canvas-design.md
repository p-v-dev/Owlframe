# Fase 2: Canvas de Contexto

## Decisão

Esta etapa entrega apenas um editor React Flow para a vista existente `Contexto`. Não cria vistas, régua de altitude, paleta, grupos, painel de propriedades, tema Atlas, persistência ou exportação.

## Estado e Dados

Um store Zustand mantém `document`, a seleção efêmera e uma mensagem de erro efêmera. `DiagramDocument` é a única fonte persistível: nós, arestas e posições são lidos e atualizados por operações de `src/core/`. O store não mantém uma cópia de nós ou arestas no formato React Flow.

## Interações

- A ação `Adicionar serviço` gera um ID com `crypto.randomUUID()` e adiciona um nó `service` à vista `view-contexto`.
- Um nó visual neutro exibe o rótulo e possui handles de entrada e saída.
- Arrastar um nó grava sua posição no documento.
- A seleção pertence somente ao estado efêmero. `Delete` remove nós e arestas selecionados; a remoção de nó remove suas arestas conectadas.
- Uma conexão válida cria uma aresta no documento. Auto-conexões, conexões duplicadas e endpoints ausentes são rejeitados com texto visível.
- React Flow fornece pan, zoom e `fitView`. Sem nós, o canvas mostra um estado vazio orientando a ação de adicionar serviço.

## Testes

Vitest testa as ações do store que alteram o documento. Testing Library testa a ação de adicionar serviço, o estado vazio, a remoção via Delete e o feedback de conexão inválida.
