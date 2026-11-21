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
- `public/images/human-ai-connection.webp`: arte original gerada para a terceira etapa, inspirada na conexão humano–IA, com entrada animada em CSS. Não é um modelo 3D das mãos nem reprodução da foto de referência.
- `src/components/Scene.tsx`: composição 3D e travessia pelo interior da rede ao rolar a seção 03.
- `src/components/NeuralBrain.tsx`: shaders de impulsos simultâneos, brilho localizado por hover/toque, pool limitado a 240 partículas e legendas ancoradas em 3D.
- `src/components/Processor.tsx`: encapsulamento arredondado, metal escovado procedural, contatos dourados e iluminação dedicada. A transição usa escurecimento, sem flash branco.
- `src/components/neuralGeometry.ts`: 540 neurônios procedurais, hemisférios, cerebelo, tronco e conexões por proximidade. Sem modelos ou texturas externos.
- `src/components/NeuralSignals.tsx`: 28 bastões luminosos curtos percorrem as conexões e escolhem um vizinho aleatório a cada chegada. Centro 100% opaco, com transparência gradual até zero nas pontas. Movimento reduzido desativa esses deslocamentos.
- `src/components/NeuralFallback.tsx`: representação SVG quando WebGL não está disponível.
- `src/components/Interactions.tsx`: preloader, magnetismo, spotlight e cursor.
- `src/components/Briefing.tsx`: modal acessível com briefing baixável.
- `src/styles.css`: direção visual, responsividade e movimento reduzido.

## Verificação

Com o servidor rodando, `npm test` executa testes de navegador em Chromium instalado em `/usr/bin/chromium`. Os screenshots ficam em `test-results/` (ignorado pelo Git). Para outros ambientes, ajuste o executável no teste ou use o Chromium do Playwright.

`npm run test:responsive` verifica telas de 320, 390 e 768 px e celular na horizontal: etapas do zoom, gesto de rolagem sobre o canvas, largura dos cards e acesso ao rodapé. No mobile, a seção 03 usa `position: sticky` em uma faixa de rolagem nativa; no desktop, mantém o pin do ScrollTrigger.

## Limites da demonstração

O briefing é gerado localmente em um arquivo TXT. Nenhum dado é enviado ou persistido. Antes de publicar como canal de contato, configure um destino real e uma integração de envio, proteção contra abuso e política de privacidade adequada. Os links do ChatSafe apontam para https://chatsafe.chat. A conversa mostrada é ilustrativa; não é uma integração com o produto. Não foram inventados clientes, métricas ou depoimentos.

O acesso ao ChatSafe foi bloqueado por HTTP 403 no proxy do ambiente durante a criação. O texto usa a descrição fornecida pelo proprietário; a identidade visual do produto não foi verificada.

## Performance e acessibilidade

Geometrias procedurais, linhas e pontos agrupados em buffers, partículas recicladas, DPR limitado a 1.5, ambiente de iluminação gerado localmente, carregamento separado do módulo 3D, fallback sem WebGL, fontes locais, layouts responsivos, suporte a prefers-reduced-motion, diálogo nativo e navegação por teclado. 60fps é uma meta; desempenho real depende do dispositivo/GPU e deve ser medido em hardware de destino.

## Publicação

`npm run build` gera `dist/`, que pode ser hospedado em qualquer serviço estático com HTTPS. Não há rotas de servidor nem segredos no frontend.
