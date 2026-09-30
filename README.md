# Forma — App Karol

Webapp (não-PWA) para acompanhar alimentação, treino, peso, macros e balanço energético estimado.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS
- Neon PostgreSQL
- Drizzle ORM
- JWT em cookie HTTP-only + bcrypt
- Vercel para deploy

## Funcionalidades do MVP

- Cadastro e login por e-mail/senha
- Onboarding corporal e objetivo
- Dashboard diário com calorias ingeridas, gasto estimado e saldo
- Metas estimadas de proteína, carboidratos e gordura
- Registro de refeições
- Registro de musculação, jiu-jitsu, muay thai, corrida e outras atividades
- Estimativa de gasto dos treinos por MET, duração e peso corporal
- Registro e gráfico de peso
- Layout responsivo para celular e desktop
- Aplicação web tradicional: sem service worker, sem modo offline e sem manifest de instalação

## Configuração local

1. Copie `.env.example` para `.env.local`.
2. Preencha `DATABASE_URL` com a string do Neon.
3. Gere `AUTH_SECRET` com um valor aleatório longo.
4. Instale dependências: `npm install`.
5. Aplique `drizzle/0000_init.sql` no Neon ou use `npm run db:push`.
6. Execute `npm run dev`.

## Modelo de gasto energético

A aplicação usa Mifflin-St Jeor para estimar metabolismo basal, um fator de atividade cotidiana separado e METs para a atividade registrada. O resultado é uma estimativa; a tendência de peso e desempenho ao longo das semanas deve orientar ajustes.

## Segurança

- Senhas são armazenadas com bcrypt, nunca em texto puro.
- Sessões usam JWT assinado em cookie HTTP-only.
- `DATABASE_URL` e `AUTH_SECRET` ficam apenas em variáveis de ambiente.
- Nenhum segredo deve ser versionado no GitHub.


## Deploy de produção

O projeto é um webapp tradicional em Next.js, sem manifest PWA e sem service worker. O fluxo de produção esperado é GitHub → Vercel, com PostgreSQL gerenciado pelo Neon.
