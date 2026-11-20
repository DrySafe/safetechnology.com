# Safe Technology

Site institucional em português, construído com React, TypeScript e Vite. Tailwind CSS 4, Three.js, React Three Fiber, Drei, GSAP/ScrollTrigger, Lenis e Framer Motion.

## Executar

Node.js 22+ (validado em Node 24). No diretório do projeto:

```sh
npm ci
npm run dev
npm run build
npm run preview
```

O servidor de desenvolvimento usa a porta 3000. O preview de produção usa a porta 4173. Não requer banco de dados ou credenciais.

## Estrutura

- `src/App.tsx`: conteúdo, seções, navegação e timelines de scroll.
- `src/components/Scene.tsx`: cabeça biônica de perfil, chip e núcleo neural procedurais. Sem GLB, HDR ou texturas remotas.
- `src/components/BionicHead.tsx`: placas curvas, perfil facial, mecanismos, ouvido com túnel aberto e projeção das legendas de humano + IA. A seção 03 acelera a câmera pelo ouvido enquanto as placas se abrem e giram. Movimento reduzido mantém a câmera estática e desativa o clarão de transição.
- `src/components/Interactions.tsx`: preloader, magnetismo, spotlight e cursor.
- `src/components/Briefing.tsx`: modal acessível com briefing baixável.
- `src/styles.css`: direção visual, responsividade e movimento reduzido.

## Verificação

Com o servidor rodando, `npm test` executa testes de navegador em Chromium instalado em `/usr/bin/chromium`. Os screenshots ficam em `test-results/` (ignorado pelo Git). Para outros ambientes, ajuste o executável no teste ou use o Chromium do Playwright.

## Limites da demonstração

O briefing é gerado localmente em um arquivo TXT. Nenhum dado é enviado ou persistido. Antes de publicar como canal de contato, configure um destino real e uma integração de envio, proteção contra abuso e política de privacidade adequada. Os links do ChatSafe apontam para https://chatsafe.chat. A conversa mostrada é ilustrativa; não é uma integração com o produto. Não foram inventados clientes, métricas ou depoimentos.

O acesso ao ChatSafe foi bloqueado por HTTP 403 no proxy do ambiente durante a criação. O texto usa a descrição fornecida pelo proprietário; a identidade visual do produto não foi verificada.

## Performance e acessibilidade

Geometrias procedurais, DPR limitado a 1.5, ambiente de iluminação gerado localmente, carregamento separado do módulo 3D, fallback sem WebGL, fontes locais, layouts responsivos, suporte a prefers-reduced-motion, diálogo nativo e navegação por teclado. 60fps é uma meta; desempenho real depende do dispositivo/GPU e deve ser medido em hardware de destino.

## Publicação

`npm run build` gera `dist/`, que pode ser hospedado em qualquer serviço estático com HTTPS. Não há rotas de servidor nem segredos no frontend.
