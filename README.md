# WC 2026 Next.js

Simulador da Copa do Mundo 2026 reescrito em Next.js.

## Estado do projeto

- Next.js 16, React 19 e TypeScript.
- 48 selecoes em 12 grupos carregadas diretamente de `data/national_teams.json`.
- Dados finais congelados no JSON; nao ha mais pipeline de scraping ou ratings no repo.
- Elencos atuais: 46 selecoes com 26 jogadores; Canada e Austria com 25 jogadores conforme a fonte final usada.

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Scripts

- `npm run dev`: servidor local de desenvolvimento.
- `npm run build`: build de producao do Next.js.
- `npm run lint`: checagem ESLint.
- `npm run typecheck`: checagem TypeScript.
- `npm test`: suite Vitest.

## Dados

`data/national_teams.json` e a fonte final usada pelo app. Edite esse arquivo diretamente apenas
quando for necessario corrigir elenco, posicao ou forca de jogador. O JSON e validado em runtime
por `lib/teams.ts` com Zod.

## Funcionalidades

- 48 selecoes carregadas de `data/national_teams.json`.
- Inicio e reinicio da copa.
- Fase de grupos com tres rodadas, classificacao e criterios de desempate.
- Classificacao dos oito melhores terceiros colocados.
- Chaveamento do mata-mata, incluindo terceiro lugar e final.
- Simulacao de placares, prorrogacao, penaltis e artilharia.
- Paginas de grupos, chaveamento, partidas, estatisticas, selecoes e detalhe de selecao.
- Estado do torneio persistido no navegador via `localStorage` e validado antes da restauracao.

## Checklist de release

Antes de publicar ou abrir PR:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Tambem valide manualmente no browser:

- iniciar ou reiniciar torneio;
- simular fase de grupos;
- simular mata-mata ate campeao;
- navegar por grupos, chaveamento, partidas, estatisticas e selecoes;
- conferir home e grupos em viewport mobile.
