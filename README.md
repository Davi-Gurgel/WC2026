# WC 2026 Next.js

Simulador da Copa do Mundo 2026 reescrito em Next.js.

## Como rodar

```bash
corepack enable pnpm
pnpm install
pnpm dev
```

Abra `http://localhost:3000`.

## Scripts

- `pnpm dev`: servidor local de desenvolvimento.
- `pnpm build`: build de producao do Next.js.
- `pnpm lint`: lint com ESLint.
- `pnpm typecheck`: checagem TypeScript.
- `pnpm test`: suite Vitest.

## Funcionalidades

- 48 selecoes carregadas de `data/national_teams.json`.
- Inicio e reinicio da copa.
- Fase de grupos com tres rodadas, classificacao e criterios de desempate.
- Classificacao dos oito melhores terceiros colocados.
- Chaveamento do mata-mata, incluindo terceiro lugar e final.
- Simulacao de placares, prorrogacao, penaltis e artilharia.
- Paginas de grupos, chaveamento, partidas, estatisticas, selecoes e detalhe de selecao.
- Estado do torneio mantido apenas durante a sessao aberta; ao fechar e abrir de novo, a copa reinicia.
