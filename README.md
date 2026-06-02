# WC 2026 Next.js

Simulador da Copa do Mundo 2026 reescrito em Next.js.

## Estado do projeto

- Next.js 16, React 19 e TypeScript.
- 48 selecoes em 12 grupos carregadas de `data/national_teams.json`.
- Dados gerados a partir de `data/sql/*.sql` e validados por `npm run data:check`.
- Elencos atuais: 47 selecoes com 26 jogadores; Canada permanece com 15 jogadores porque a fonte raspada ainda nao expunha lista final de 26.

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
- `npm run data:check`: valida se `data/national_teams.json` esta sincronizado com `data/sql/*.sql`.
- `npm run data:scrape`: raspa elencos da pagina `2026_FIFA_World_Cup_squads` da Wikipedia e atualiza apenas listas finais de 26 jogadores.
- `npm run data:ratings -- --csv data/male_players.csv`: aplica ratings do CSV aos jogadores e usa mediana do time para jogadores sem match.
- `npm run data:recalc`: recalcula forcas agregadas dos times a partir dos jogadores.

## Pipeline de dados

Fluxo recomendado ao atualizar elencos:

```bash
npm run data:scrape
npm run data:ratings -- --csv data/male_players.csv
npm run data:recalc
npm run data:check
npm test
```

O scraper preserva dados existentes quando a fonte nao tem lista final de 26 jogadores. Depois de qualquer raspagem, reaplique ratings e recalcule os agregados para evitar jogadores novos com forca padrao.

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
npm run data:check
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
