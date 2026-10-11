# Fase 0 - Fundação do Projeto

## Objetivo

Transformar o template Electron-Vite em uma base limpa para o Owlframe: uma janela desktop segura, com uma tela inicial contendo somente o nome do aplicativo, Tailwind CSS no renderer, verificações locais e testes TypeScript independentes do Electron.

## Escopo

- Remover a interface, recursos e IPC demonstrativos do template.
- Usar `Owlframe` no título da janela e nos metadados existentes do pacote.
- Configurar Tailwind CSS v4 pelo plugin Vite já instalado e importar seu CSS no renderer.
- Preservar as ferramentas existentes para ESLint, Prettier e TypeScript; fornecer um comando agregado de verificação.
- Configurar Vitest para executar testes TypeScript em ambiente Node, sem iniciar Electron.
- Organizar somente os módulos necessários nesta fase: `main`, `preload` e `renderer`.
- Manter `contextIsolation: true`, `nodeIntegration: false` e nenhum objeto customizado exposto pelo preload.
- Documentar instalação, desenvolvimento e verificação no README.

## Arquitetura

O processo principal continua concentrado em `src/main/index.ts`: ele cria a janela Owlframe com a configuração de segurança explícita e carrega o renderer. O preload permanece como uma ponte vazia para que o renderer não obtenha acesso a APIs Node; IPC e APIs específicas só serão adicionados quando uma fase futura os exigir.

O renderer contém um único componente React, estilizado por classes Tailwind, que centraliza o nome Owlframe. A configuração do Tailwind permanece no `electron.vite.config.ts`, evitando arquivos de configuração extras.

Vitest recebe uma configuração Node independente, com um teste simples que valida os metadados puros do aplicativo. Isso comprova que a suíte executa TypeScript sem carregar Electron e estabelece o padrão para regras de domínio da Fase 1.

## Tratamento de Erros

Esta fase não recebe entradas externas nem executa operações de arquivo. A remoção do IPC demonstrativo elimina a única ponte de mensagens não utilizada. Falhas de lint, formatação, tipos e testes são reportadas pelos respectivos comandos npm e bloqueiam o comando agregado de verificação.

## Testes e Verificação

- Um teste Vitest confirma os metadados puros da aplicação, executado em ambiente Node.
- `npm run lint`, `npm run format:check`, `npm run typecheck` e `npm run test` validam cada ferramenta.
- `npm run check` executa todas as verificações.
- `npm run build` confirma a compilação do Electron-Vite.

## Fora de Escopo

- Modelo de documento, tipos de domínio ou diretório `core`.
- React Flow, Zustand, ELK, persistência, exportação ou MCP.
- APIs de preload, IPC, menu personalizado ou lógica de arquivos.
