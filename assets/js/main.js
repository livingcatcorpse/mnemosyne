// ========================================
// MNEMOSYNE | Main Script e animações
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Script principal: animação das esferas, interações e menu
// Responsável por: criar/remover esferas, aplicar fade de vida, 
// mostrar/ocultar texto com efeito de apagamento gradual, gerir interações do menu
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  
  // ELEMENTOS DOM
  // Encontra todos os elementos do HTML que precisamos de controlar
  const svg = document.getElementById('circles-svg');          // Canvas SVG onde aparecem as esferas animadas
  const memoryDisplay = document.getElementById('memory-display'); // Caixa que mostra o texto da memória ao clicar
  const footerTrigger = document.getElementById('footer-trigger'); // Botão "MNEMOSYNE" no footer para abrir o menu
  const menuOverlay = document.getElementById('menu-overlay');     // Fundo do menu (overlay que cobre toda a página)
  const menuText = document.getElementById('menu-text');           // Parágrafo de texto dentro do menu
  const menuTitleEl = document.getElementById('menu-title');       // Título da página do menu
  const menuPanel = document.querySelector('.menu-panel');         // Painel de vidro do menu
  const menuArrowPrev = document.getElementById('menu-arrow-prev'); // Seta para voltar a página anterior do menu
  const menuArrow = document.getElementById('menu-arrow');         // Seta para ir para próxima página do menu
  
  if (!svg) return; // Se o SVG não existe, não há nada a animar então vai sair da função
  
  // CONFIGURAÇÃO DO CANVAS
  // Lê as dimensões do SVG (definidas no atributo viewBox)
  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width;   // Largura total (1728px)
  const height = viewBox.height; // Altura total (1117px)
  
  // ESTADO GLOBAL DAS ESFERAS/BOLAS
  // Array que guarda todas as partículas (esferas) animadas ativas
  const particles = [];
  
  // ID da memória que o utilizador tem selecionada (clicar numa esfera)
  // Usada para destacar a esfera selecionada com 100% opacidade
  let selectedMemoryId = null;
  
  // Flag para ligar/desligar logs detalhados sobre fade (use no console: window.setDebugFade(true))
  let DEBUG_FADE = false;
  // Permite ao utilizador ligar debug via console: window.setDebugFade(true)
  window.setDebugFade = (v) => { 
    DEBUG_FADE = !!v;  // Converte para booleano
    console.log('DEBUG_FADE =', DEBUG_FADE); 
  };

  // CONFIGURAÇÃO DO EFEITO DE TEXTO A APAGAR GRADUALMENTE
  // Pré-visualização: multiplica a velocidade do efeito "borracha" apenas para testes na CONSOLE do Inspector
  // Não altera a vida real da esfera, apenas o visual do apagamento
  // Usar: window.setTextEraserPreview(2) para fazer o efeito 2x mais rápido
  let TEXT_ERASER_PREVIEW = 1; // 1 = velocidade real, >1 = mais rápido
  window.setTextEraserPreview = (mul) => {
    const m = Number(mul);
    // Valida se é um número positivo válido
    if (!Number.isFinite(m) || m <= 0) {
      console.warn('setTextEraserPreview: valor inválido (deve ser > 0)');
      return;
    }
    TEXT_ERASER_PREVIEW = m;
    console.log('TEXT_ERASER_PREVIEW =', TEXT_ERASER_PREVIEW);
  };

  // Atraso antes de iniciar o efeito de texto (para o utilizador ter tempo de ler)
  // Usar: window.setTextWipeDelay(30000) para mudar para 30 segundos
  let TEXT_WIPE_DELAY_MS = 300 * 1000; // 300 segundos (5 minutos) por defeito
  window.setTextWipeDelay = (ms) => {
    const v = Number(ms);
    // Valida se é um número não-negativo válido
    if (!Number.isFinite(v) || v < 0) {
      console.warn('setTextWipeDelay: valor inválido (deve ser >= 0)');
      return;
    }
    TEXT_WIPE_DELAY_MS = v;
    console.log('TEXT_WIPE_DELAY_MS =', TEXT_WIPE_DELAY_MS);
  };
  
  // Duração total do efeito de apagamento (independente da vida real da esfera)
  // Usar: window.setTextWipeDuration(45000) para mudar para 45 segundos
  let TEXT_WIPE_DURATION_MS = 600 * 1000; // 600 segundos (10 minutos) por defeito
  window.setTextWipeDuration = (ms) => {
    const v = Number(ms);
    // Valida se é um número positivo válido
    if (!Number.isFinite(v) || v <= 0) {
      console.warn('setTextWipeDuration: valor inválido (deve ser > 0)');
      return;
    }
    TEXT_WIPE_DURATION_MS = v;
    console.log('TEXT_WIPE_DURATION_MS =', TEXT_WIPE_DURATION_MS);
  };
  
  // Força o início imediato do efeito de apagamento no texto atualmente aberto
  // Usar: window.startTextWipeNow() para começar o efeito antes do atraso
  window.startTextWipeNow = () => {
    const attrId = memoryDisplay.getAttribute('data-memory-id');
    if (!attrId) return; // Se não houver texto aberto, sai
    
    const now = Date.now();
    // Define que o efeito começa agora (ignora o atraso normal)
    memoryDisplay.setAttribute('data-wipe-start', String(now));
    
    // Calcula quando termina o efeito (agora + duração)
    let targetEnd = now + TEXT_WIPE_DURATION_MS;
    
    // Tenta encontrar a hora de expiração da memória (para não apagar depois que expira)
    let expiresAt = null;
    // Procura no array de partículas a expiração desta memória
    const p = particles.find(pp => pp.firebaseId === attrId);
    if (p && Number.isFinite(p.expiresAtMs)) expiresAt = p.expiresAtMs;
    
    // Se conhecemos a expiração, não deixa o efeito ir além disso
    if (Number.isFinite(expiresAt)) targetEnd = Math.min(targetEnd, expiresAt);
    memoryDisplay.setAttribute('data-wipe-end', String(targetEnd));
    console.log('💬 Texto: efeito de apagamento iniciado agora');
  };

  // UTILITÁRIO: CONVERTER TIMESTAMPS
  /**
   * Converte os vários formatos de timestamp em milissegundos (number)
   * Aceita: Firebase Timestamp objects, {seconds, nanoseconds}, Date, number, string
   * Retorna: millisegundos desde 1 de janeiro de 1970, ou NaN se inválido
   * 
   * @param {*} ts - Timestamp em qualquer formato suportado
   * @returns {number} Milissegundos desde época (ou NaN)
   */
  function tsToMs(ts) {
    // Se for vazio/null, retorna NaN
    if (!ts) return NaN;
    
    // Se já for número, assume milissegundos
    if (typeof ts === 'number') return ts;
    
    // Se for string, tenta fazer parse como data ISO
    if (typeof ts === 'string') {
      const ms = Date.parse(ts);
      return Number.isNaN(ms) ? NaN : ms;
    }
    
    // Firebase Timestamp object tem método toMillis()
    if (typeof ts.toMillis === 'function') return ts.toMillis();
    
    // Firebase Timestamp object também pode ter toDate()
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    
    // Firestore compatibilidade: {seconds: X, nanoseconds: Y}
    if (typeof ts.seconds === 'number') {
      const ns = typeof ts.nanoseconds === 'number' ? ts.nanoseconds : 0;
      // Converte segundos para ms + converte nanosegundos para ms
      return ts.seconds * 1000 + Math.floor(ns / 1e6);
    }
    
    // Último recurso: tenta criar um Date object
    try {
      const d = new Date(ts);
      const ms = d.getTime();
      return Number.isNaN(ms) ? NaN : ms;
    } catch {
      return NaN; // Se tudo falhar, retorna NaN
    }
  }
  
  // ANIMAÇÃO DAS ESFERAS
  /**
   * Loop de animação principal (requestAnimationFrame)
   * Executado ~60x por segundo
   * Responsável por:
   * - Mover as esferas pela tela
   * - Fazer bounce nas bordas
   * - Aplicar fade de desaparecimento
   * - Destacar esfera selecionada
   * - Animar efeito de apagamento do texto
   */
  const animate = () => {
    const now = Date.now(); // Hora atual em milissegundos
    
    // Processa cada esfera/partícula animada
    particles.forEach(p => {
      // MOVIMENTO
      // Aplica o multiplicador de velocidade
      const speed = (typeof p.el.getSpeedMultiplier === 'function') ? p.el.getSpeedMultiplier() : 1.0;
      p.x += p.vx * speed; // Move na horizontal
      p.y += p.vy * speed; // Move na vertical
      
      // COLISÃO COM BORDAS (bounce - ricochete)
      // Verifica se a esfera saiu pela esquerda
      if (p.x - p.r < 0) { 
        p.x = p.r;              // Coloca dentro do limite
        p.vx = Math.abs(p.vx);  // Inverte direção (para a direita)
      }
      // Verifica se a esfera saiu pela direita
      if (p.x + p.r > width) { 
        p.x = width - p.r;       // Coloca dentro do limite
        p.vx = -Math.abs(p.vx);  // Inverte direção (para a esquerda)
      }
      // Verifica se a esfera saiu pela parte de cima
      if (p.y - p.r < 0) { 
        p.y = p.r;              // Coloca dentro do limite
        p.vy = Math.abs(p.vy);  // Inverte direção (para baixo)
      }
      // Verifica se a esfera saiu pela parte de baixo
      if (p.y + p.r > height) { 
        p.y = height - p.r;      // Coloca dentro do limite
        p.vy = -Math.abs(p.vy);  // Inverte direção (para cima)
      }
      
      // ATUALIZA POSIÇÃO NO SVG
      // Muda as coordenadas do círculo SVG (mostra na tela)
      p.el.setAttribute('cx', p.x);
      p.el.setAttribute('cy', p.y);
      
      // FADE GRADUAL + DESTAQUE DE SELEÇÃO
      // A opacidade (transparência) muda conforme a esfera envelhece
      // Começa 100% visível, fica progressivamente mais transparente
      let baseOpacity = 1;
      
      // Garante que temos os timestamps em milissegundos (para contas de tempo)
      // Fallback: se não foram calculados na criação, calcula agora
      if (!p.expiresAtMs && p.expiresAt) p.expiresAtMs = tsToMs(p.expiresAt);
      if (!p.createdAtMs && p.createdAt) p.createdAtMs = tsToMs(p.createdAt);

      // Verifica se os timestamps são válidos (números reais)
      if (Number.isFinite(p.expiresAtMs) && Number.isFinite(p.createdAtMs)) {
        const timeRemaining = p.expiresAtMs - now;          // Quantos ms faltam até expirar
        const totalDuration = p.expiresAtMs - p.createdAtMs; // Quantos ms durará a vida total

        // EXPIRAÇÃO: A MEMÓRIA CHEGOU AO FIM DA SUA VIDA
        if (timeRemaining <= 0) {
          // A memória passou da hora de expiração
          if (p.firebaseId && !p.deleted) {
            p.deleted = true; // Marca como já apagada
            // Remove do Firebase
            window.firebaseDB.collection('memories').doc(p.firebaseId).delete()
              .then(() => console.log(`🗑️ Memória ${p.firebaseId} apagada do Firebase`))
              .catch(err => console.error('Erro ao apagar:', err));
            // Remove do DOM como segurança (caso a função genérica não tenha sido chamada)
            removeMemoryCircle(p.firebaseId);
          }
          baseOpacity = 0; // Desaparece imediatamente
        } 
        // FADE NORMAL: A ESFERA AINDA ESTÁ VIVA
        else if (totalDuration > 0) {
          // Calcula qual % da vida restante (1.0 = acaba de criar, 0.0 = está para expirar)
          const lifeRatio = Math.max(0, Math.min(1, timeRemaining / totalDuration));
          baseOpacity = lifeRatio; // Opacidade = percentagem de vida restante
          
          // Debug: registar informações se ligado e este item estiver selecionado
          if (DEBUG_FADE && p.firebaseId === selectedMemoryId) {
            // Loga apenas a cada ~1 segundo (evita encher console de logs)
            if (!p._lastLog || now - p._lastLog > 1000) {
              console.log('⏳', p.firebaseId, 
                'lifeRatio:', lifeRatio.toFixed(3),  // Quanto da vida restante (0-1)
                'restante(s):', Math.max(0, Math.floor(timeRemaining/1000))); // Segundos até expiração
              p._lastLog = now; // Guarda hora do último log
            }
          }

          // TEXTO: EFEITO DE APAGAMENTO GRADUAL (BORRACHA)
          // Texto apaga palavra por palavra, começando do fim do texto para o início
          // Cada palavra passa por 2 fases: 1) blur aumenta, 2) transparência sobe
          if (memoryDisplay.classList.contains('active') && 
              memoryDisplay.getAttribute('data-memory-id') === p.firebaseId) {
            // Garante que o container de texto está visível
            memoryDisplay.style.opacity = '1';

            // Remove filtros globais (blur será aplicado por palavra, não no todo)
            memoryDisplay.style.filter = 'none';

            // Remove máscaras globais (máscaras serão aplicadas por palavra, não no todo)
            memoryDisplay.style.maskImage = 'none';
            memoryDisplay.style.webkitMaskImage = 'none';

            // Processa o efeito de apagamento do texto
            // Primeiro, encontra todos os elementos (frases ou palavras)
            const sentenceEls = memoryDisplay.querySelectorAll('span[data-sentence-index]');
            const hasSentences = sentenceEls && sentenceEls.length > 0;

            // Se não há frases, procura palavras diretas
            const wordSpans = hasSentences ? null : memoryDisplay.querySelectorAll('span[data-word-index]');
            const totalWords = hasSentences ? 0 : (wordSpans ? wordSpans.length : 0);
            
            // Só processa se houver algo para apagar (frases ou palavras)
            if ((hasSentences && sentenceEls.length > 0) || (!hasSentences && totalWords > 0)) {
              // Lê os timestamps que definem quando o efeito começa e termina
              const wipeStartAttr = memoryDisplay.getAttribute('data-wipe-start');
              const wipeEndAttr = memoryDisplay.getAttribute('data-wipe-end');
              const wipeStart = wipeStartAttr ? parseInt(wipeStartAttr, 10) : null;
              const wipeEnd = wipeEndAttr ? parseInt(wipeEndAttr, 10) : null;

              // FASE 1: ATRASO (Tempo de leitura)
              // Enquanto estamos dentro do atraso configurado, texto fica 100% nítido
              if (wipeStart && now < wipeStart) {
                // Limpa qualquer efeito anterior (blur, máscara, opacidade reduzida)
                if (hasSentences) {
                  sentenceEls.forEach((sent) => {
                    const words = sent.querySelectorAll('span[data-word-index]');
                    words.forEach((span) => {
                      span.style.maskImage = 'none';
                      span.style.webkitMaskImage = 'none';
                      span.style.filter = 'none';
                      span.style.webkitFilter = 'none';
                      span.style.opacity = '1'; // 100% visível
                    });
                  });
                } else {
                  wordSpans.forEach((span) => {
                    span.style.maskImage = 'none';
                    span.style.webkitMaskImage = 'none';
                    span.style.filter = 'none';
                    span.style.webkitFilter = 'none';
                    span.style.opacity = '1'; // 100% visível
                  });
                }
                // Sai deste bloco até o atraso terminar
                return;
              }

              // FASE 2: EFEITO DE APAGAMENTO
              // Calcula o progresso do efeito (0 = começou agora, 1 = terminou)
              let progress = 0;
              if (wipeStart && wipeEnd && wipeEnd > wipeStart) {
                // Quantos % estamos entre wipeStart e wipeEnd
                progress = Math.max(0, Math.min(1, (now - wipeStart) / (wipeEnd - wipeStart)));
              } else {
                // Fallback: usa a vida da esfera como progresso
                progress = Math.max(0, Math.min(1, 1 - lifeRatio));
              }

              const maxWordBlurPx = 16;     // Máximo blur aplicado a cada palavra (16 pixels)
              const BLUR_CUTOFF = 0.6;      // Primeira 60% do progresso = só blur, depois blur+fade

              // PROCESSA CADA FRASE (do fim para o início)
              if (hasSentences) {
                const totalSentences = sentenceEls.length;
                // Quantas frases devem estar completamente apagadas (0 = nenhuma, 1 = primeira, etc)
                const sentenceUnits = progress * totalSentences * TEXT_ERASER_PREVIEW;
                const fullyErasedSent = Math.floor(sentenceUnits);
                // Para a frase que está a ser processada, quanto de progresso tem
                const partialSentFrac = Math.max(0, Math.min(1, sentenceUnits - fullyErasedSent));

                sentenceEls.forEach((sent, sIndex) => {
                  // sRev = 0 é a última frase, sRev = n-1 é a primeira frase
                  const sRev = totalSentences - 1 - sIndex;
                  const words = sent.querySelectorAll('span[data-word-index]');
                  
                  if (sRev < fullyErasedSent) {
                    // FRASE JÁ COMPLETAMENTE APAGADA
                    // Todas as palavras nesta frase desapareceram completamente
                    words.forEach((span) => {
                      span.style.filter = 'none';
                      span.style.webkitFilter = 'none';
                      span.style.opacity = '0';  // Invisível
                      span.style.maskImage = 'none';
                      span.style.webkitMaskImage = 'none';
                    });
                  } 
                  else if (sRev === fullyErasedSent) {
                    // FRASE QUE ESTÁ A SER APAGADA AGORA
                    // Processa palavra a palavra dentro desta frase
                    const totalW = words.length;
                    // Quantas palavras devem estar apagadas nesta frase
                    const wordsUnits = partialSentFrac * totalW;
                    
                    words.forEach((span, wIndex) => {
                      // wRev = 0 é a última palavra, wRev = n-1 é a primeira palavra
                      const wRev = totalW - 1 - wIndex;
                      // Quanto desta palavra está a ser processada (0-1)
                      const wordProgress = Math.max(0, Math.min(1, wordsUnits - wRev));

                      // Limpa os efeitos anteriores
                      span.style.maskImage = 'none';
                      span.style.webkitMaskImage = 'none';
                      span.style.filter = 'none';
                      span.style.webkitFilter = 'none';
                      span.style.opacity = '1'; // Começa visível

                      if (wordProgress <= 0) return; // Esta palavra ainda está nítida

                      if (wordProgress < BLUR_CUTOFF) {
                        // FASE 1: SÓ BLUR (0 até 60% do progresso da palavra)
                        // Acelera o blur: usa t para efeito mais suave
                        const t = wordProgress / BLUR_CUTOFF;        // 0..1
                        const blur = maxWordBlurPx * (t * t);        // ease-in
                        const bs = `blur(${blur.toFixed(2)}px)`;
                        span.style.filter = bs;
                        span.style.webkitFilter = bs;
                        span.style.opacity = '1'; // Ainda 100% visível
                      } else {
                        // FASE 2: BLUR + FADE (60% até 100% do progresso da palavra)
                        // Mantém um blur máximo, mas começa a desaparecer por transparência
                        const eraseProgress = Math.max(0, Math.min(1, (wordProgress - BLUR_CUTOFF) / (1 - BLUR_CUTOFF)));
                        const maxBs = `blur(${maxWordBlurPx.toFixed(2)}px)`;
                        span.style.filter = maxBs;
                        span.style.webkitFilter = maxBs;
                        // Opacidade: 100% no início, 0% no fim (1 - progress)
                        span.style.opacity = (1 - eraseProgress).toFixed(3);
                      }
                    });
                  } 
                  else {
                    // FRASES AINDA NÃO ATINGIDAS
                    // Estas frases aparecem depois, ainda estão totalmente visíveis
                    words.forEach((span) => {
                      span.style.filter = 'none';
                      span.style.webkitFilter = 'none';
                      span.style.opacity = '1'; // 100% visível
                      span.style.maskImage = 'none';
                      span.style.webkitMaskImage = 'none';
                    });
                  }
                });
              } 
              else {
                // FALLBACK: PALAVRAS DIRETAS (sem estrutura de frases)
                // Usa o mesmo efeito mas diretamente nas palavras
                const wordsProgress = progress * totalWords * TEXT_ERASER_PREVIEW;
                wordSpans.forEach((span, index) => {
                  // reverseIndex = 0 é a última palavra, reverseIndex = n-1 é a primeira
                  const reverseIndex = totalWords - 1 - index;
                  // Quanto desta palavra está a ser processada (0-1)
                  const wordProgress = Math.max(0, Math.min(1, wordsProgress - reverseIndex));
                  
                  // Limpa os efeitos anteriores
                  span.style.maskImage = 'none';
                  span.style.webkitMaskImage = 'none';
                  span.style.filter = 'none';
                  span.style.webkitFilter = 'none';
                  span.style.opacity = '1'; // Começa visível
                  
                  if (wordProgress <= 0) return; // Esta palavra ainda está nítida
                  
                  if (wordProgress < BLUR_CUTOFF) {
                    // FASE 1: SÓ BLUR (0 até 60% do progresso da palavra)
                    const t = wordProgress / BLUR_CUTOFF;        // 0..1
                    const blur = maxWordBlurPx * (t * t);        // ease-in
                    const blurStr = `blur(${blur.toFixed(2)}px)`;
                    span.style.filter = blurStr;
                    span.style.webkitFilter = blurStr;
                  } else {
                    // FASE 2: BLUR + FADE (60% até 100% do progresso da palavra)
                    const eraseProgress = Math.max(0, Math.min(1, (wordProgress - BLUR_CUTOFF) / (1 - BLUR_CUTOFF)));
                    const maxBlurStr = `blur(${maxWordBlurPx.toFixed(2)}px)`;
                    span.style.filter = maxBlurStr;
                    span.style.webkitFilter = maxBlurStr;
                    // Opacidade: 100% no início, 0% no fim (1 - progress)
                    span.style.opacity = (1 - eraseProgress).toFixed(3);
                  }
                });
              }
            }
          }
        }
      }

      // DESTAQUE DE SELEÇÃO
      // DESTAQUE DE SELEÇÃO (restaurado)
      let finalOpacity = Math.max(0, Math.min(1, baseOpacity));

      // SOBREPOR A BOLA AO TEXTO SE ESTIVER SELECIONADA
      // --- Overlay HTML para a esfera selecionada sobre o texto ---
      const existingOverlay = document.getElementById('memory-sphere-overlay');
      if (selectedMemoryId && p.firebaseId === selectedMemoryId && memoryDisplay.classList.contains('active')) {
        p.el.classList.add('over-text');

        // Calcula posição e tamanho da esfera no viewport
        const cx = Number(p.el.getAttribute('cx'));
        const cy = Number(p.el.getAttribute('cy'));
        const r = Number(p.el.getAttribute('r'));
        // Converte coordenadas SVG para viewport
        const svgRect = svg.getBoundingClientRect();
        const x = svgRect.left + (cx / width) * svgRect.width;
        const y = svgRect.top + (cy / height) * svgRect.height;
        const radiusPx = (r / width) * svgRect.width;

        // Cria ou atualiza overlay
        let overlay = existingOverlay;
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'memory-sphere-overlay';
          overlay.className = 'memory-sphere-overlay';
          document.body.appendChild(overlay);
        }
        // Estilo: posição e tamanho
        overlay.style.width = `${radiusPx * 2}px`;
        overlay.style.height = `${radiusPx * 2}px`;
        overlay.style.left = `${x - radiusPx}px`;
        overlay.style.top = `${y - radiusPx}px`;
        // Usa o mesmo gradiente SVG da esfera, se possível
        const fill = p.el.getAttribute('fill');
        if (fill && fill.startsWith('url(')) {
          // Extrai o id do gradiente
          const gradId = fill.match(/url\(#(.+?)\)/);
          if (gradId && gradId[1]) {
            overlay.style.background = `radial-gradient(circle at 50% 50%, #fff 0%, ${window.getComputedStyle(p.el).fill} 100%)`;
          } else {
            overlay.style.background = '#fff';
          }
        } else {
          overlay.style.background = fill || '#fff';
        }
        overlay.style.boxShadow = '0 0 60px 30px #fff8, 0 0 0 2px #fff4';
        overlay.style.opacity = '1';
        overlay.style.zIndex = '2000';
        overlay.style.display = 'block';
      } else {
        p.el.classList.remove('over-text');
        // Remove overlay se existir
        if (existingOverlay) existingOverlay.style.display = 'none';
      }
      if (selectedMemoryId) {
        if (p.firebaseId === selectedMemoryId) {
          // Esta é a esfera selecionada: sempre 100% visível
          finalOpacity = 1.0;
        } else {
          // Outras esferas: ficam a 20% (ou menos, se o fade delas já as tornou menos visíveis)
          finalOpacity = Math.min(baseOpacity, 0.2);
        }
      }
      p.el.style.opacity = Number.isFinite(finalOpacity) ? finalOpacity.toFixed(3) : '0';
    });
    
    // Agenda o próximo frame (~60x por segundo)
    requestAnimationFrame(animate);
  };
  
  // Inicia o loop de animação
  animate();
  
  // MENU OVERLAY
  // Menu acessível pelo botão no footer que mostra as informações sobre o projeto
  
  /**
   * Abre o menu (mostra overlay)
   */
  function openMenu() {
    menuOverlay.classList.add('open');                    // Adiciona classe CSS 'open'
    menuOverlay.setAttribute('aria-hidden', 'false');     // Marca como visível
  }
  
  /**
   * Fecha o menu (esconde overlay)
   */
  function closeMenu() {
    menuOverlay.classList.remove('open');                 // Remove classe CSS 'open'
    menuOverlay.setAttribute('aria-hidden', 'true');      // Marca como oculto
  }
  
  // CLICK NO FUNDO "MNEMOSYNE"
  // Alterna menu: abre se fechado, fecha se aberto
  footerTrigger?.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita propagar click para document
    menuOverlay.classList.contains('open') ? closeMenu() : openMenu();
  });
  
  // FECHAR COM TECLA ESC
  document.addEventListener('keydown', (e) => { 
    if (e.key === 'Escape') closeMenu(); 
  });
  
  // FECHAR AO CLICAR FORA DO MENU
  // Se menu está aberto e clicar fora do painel (mas não no botão), fecha menu
  document.addEventListener('click', (e) => {
    if (menuOverlay.classList.contains('open')) {
      // Verifica se o click não foi no painel e não foi no botão
      if (!menuPanel.contains(e.target) && e.target !== footerTrigger) {
        closeMenu();
      }
    }
  });
  
  // EFEITO PARALLAX DO RATO
  // Enquanto o menu está aberto, o movimento do rato afeta a perspectiva do painel
  // Isto cria um efeito 3D subtil (através de CSS variables --mx e --my)
  window.addEventListener('mousemove', (e) => {
    if (!menuOverlay.classList.contains('open') || !menuPanel) return;
    // Normaliza a posição do rato a valores entre 0 e 1
    const x = e.clientX / window.innerWidth;   // Posição horizontal (0=esquerda, 1=direita)
    const y = e.clientY / window.innerHeight;  // Posição vertical (0=topo, 1=fundo)
    // Atualiza CSS variables que controlam o efeito parallax
    menuPanel.style.setProperty('--mx', x.toFixed(3));
    menuPanel.style.setProperty('--my', y.toFixed(3));
  });
  
  // CONTEÚDO DAS PÁGINAS DO MENU
  // O menu tem páginas que podem ser navegadas com as setas
  const initialTitle = menuTitleEl?.textContent || 'TITULO';
  const initialText = menuText?.textContent || '';
  
  // Array de funções que retornam o conteúdo de cada página
  const menuPages = [
    () => ({ title: initialTitle, text: initialText }), // Página 0: SOBRE MNEMOSYNE (conteúdo do HTML)
    () => ({ title: 'SOBRE NÓS', text: 'Sob o olhar atento de Mnemosyne, a personificação divina da memória na mitologia grega antiga que inspirou o nome e conceito deste projeto, criámos um arquivo comunitário, anónimo e temporário de memórias, que é alimentado única e exclusivamente através da participação do observador. Criado no intuito de ser experiênciado numa sala escura e íntima, após de responder ao questionário disponível através do respectivo código QR, o observador poderá observar a sua memória surgir no espaço da projeção na forma de uma aura colorida, que vai existir no mesmo espaço onírico que as respostas de observadores anteriores por quanto tempo a sua relevância para o observador a permitir.\n\nEste é um projeto realizado por quatro estudantes de Design de Comunicação do 3º ano da Faculdade de Belas Artes da Universidade do Porto em resposta ao projeto final de UC Projeto 4. Fascinadas pela recordação e o esquecimento inevitável, brotou uma experiência que, não só testou as nossas capacidades técnicas, como também exercitou a ligação conceptual que temos com a nossa arte.' }) // Página 1: SOBRE NÓS
  ];
  
  let menuPageIndex = 0; // Índice da página que está a ser mostrada (começa em 0)
  
  /**
   * Atualiza o conteúdo do menu para uma página específica
   * @param {number} pageIdx - Índice da página a mostrar
   */
  function setMenuContent(pageIdx) {
    // Obtém o conteúdo da página
    const page = menuPages[pageIdx]();
    
    // Atualiza o HTML
    if (menuTitleEl) menuTitleEl.textContent = page.title;
    if (menuText) menuText.textContent = page.text;
    
    // Reinicia animação CSS (para o texto aparecer com efeito fade-in)
    if (menuOverlay.classList.contains('open')) {
      // Remove a animação temporariamente
      menuTitleEl && (menuTitleEl.style.animation = 'none');
      menuText && (menuText.style.animation = 'none');
      // Força reflow (faz o browser recalcular layout)
      void menuPanel.offsetWidth;
      // Recoloca a animação (agora vai rodar novamente)
      menuTitleEl && (menuTitleEl.style.animation = '');
      menuText && (menuText.style.animation = '');
    }
  }
  
  // SETA ANTERIOR (∧)
  // Volta para a página anterior (com ciclo circular)
  menuArrowPrev?.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita propagar click
    // Decrementa índice, wrap-around se for negativo (cicla ao final)
    menuPageIndex = (menuPageIndex - 1 + menuPages.length) % menuPages.length;
    setMenuContent(menuPageIndex);
  });
  
  // SETA SEGUINTE (∨)
  // Avança para a página seguinte (com ciclo circular)
  menuArrow?.addEventListener('click', (e) => {
    e.stopPropagation(); // Evita propagar click
    // Incrementa índice, wrap-around se ultrapassar número de páginas
    menuPageIndex = (menuPageIndex + 1) % menuPages.length;
    setMenuContent(menuPageIndex);
  });
  
  // INTEGRAÇÃO FIREBASE
  // Carrega memórias submetidas via formulário e cria esferas animadas na tela
  
  /**
   * Cria uma nova esfera/bola SVG e a sua animação baseada numa memória do Firebase
   * 
   * @param {Object} memory - Objeto da memória com:
   *   - text: string (conteúdo da memória)
   *   - cx, cy: números (posição inicial)
   *   - radius: número (tamanho da esfera em pixels)
   *   - gradient: string (ID do gradiente SVG, ex: 'grad-1')
   *   - id: string (ID do Firebase)
   *   - createdAt: timestamp (quando foi criada)
   *   - expiresAt: timestamp (quando vai expirar)
   *   - durationHours: número (duração total em horas)
   *   - vx, vy: números opcionais (velocidade inicial)
   */
  function createMemoryCircle(memory) {
    // CRIA ELEMENTO SVG CIRCLE
    // Desenha o círculo que representa a esfera visualmente
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.classList.add('memory-circle');                   // Classe para CSS.styles
    circle.setAttribute('data-memory', memory.text);         // Guarda o texto (para DEBUG)
    circle.setAttribute('cx', memory.cx);                    // Posição X inicial
    circle.setAttribute('cy', memory.cy);                    // Posição Y inicial
    circle.setAttribute('r', memory.radius);                 // Raio (tamanho da esfera)
    circle.setAttribute('fill', `url(#${memory.gradient})`); // Preenchimento com gradiente SVG
    circle.setAttribute('data-firebase-id', memory.id);      // ID único do Firebase

    // ADICIONA O CÍRCULO AO GRUPO <g id="memory-circles-container">
    const group = document.getElementById('memory-circles-container');
    if (group) {
      group.appendChild(circle);
    } else {
      svg.appendChild(circle); // fallback: adiciona ao SVG raiz
    }
    
      // Multiplicador de velocidade baseado no tamanho (raio):
      // Esferas menores andam mais rápido, maiores mais devagar
      circle.getSpeedMultiplier = function() {
        // 5 níveis de velocidade baseados na duração da memória
        // 5min (<=0.09h): muito rápido
        // 20min (<=0.34h): rápido
        // 40min (<=0.67h): médio
        // 3h (<=3.5h): lento
        // 6h (>3.5h): muito lento
        if (!memory.durationHours) return 2.5;
        if (memory.durationHours <= 0.09) return 2.5;    // 5min (muito rápido)
        if (memory.durationHours <= 0.34) return 1.9;    // 20min (rápido)
        if (memory.durationHours <= 0.67) return 1.3;    // 40min (médio)
        if (memory.durationHours <= 3.5) return 0.8;     // 3h (lento)
          return 0.07;                                     // 6h (muito lento)
      };
    // Precisa de tempos em ms para fazer contas de fade precisas
    let createdAtMs = tsToMs(memory.createdAt);
    let expiresAtMs = tsToMs(memory.expiresAt);
    
    // Fallback 1: Se expiresAt é inválido mas temos durationHours, calcula a expiração
    if (!Number.isFinite(expiresAtMs) && Number.isFinite(createdAtMs) && typeof memory.durationHours === 'number') {
      expiresAtMs = createdAtMs + memory.durationHours * 60 * 60 * 1000;
    }
    
    // Fallback 2: Se createdAt é inválido, usa agora
    if (!Number.isFinite(createdAtMs)) {
      createdAtMs = Date.now();
      // Se expiração é anterior a "agora", desloca-a para o futuro (mantém duração)
      if (Number.isFinite(expiresAtMs) && expiresAtMs < createdAtMs) {
        const duration = createdAtMs - expiresAtMs;
        if (duration > 0) expiresAtMs = createdAtMs + duration;
      }
    }

    // CRIA OBJETO DE PARTÍCULA
    // Este objeto guarda todo o estado que a função animate() precisa
    const particle = {
      el: circle,                                       // Referência ao elemento SVG
      x: memory.cx,                                     // Posição X atual
      y: memory.cy,                                     // Posição Y atual
      r: memory.radius,                                 // Raio (não muda)
      vx: memory.vx || (Math.random() - 0.5) * 2.5,     // Velocidade X (aleatória se não definida)
      vy: memory.vy || (Math.random() - 0.5) * 2.5,     // Velocidade Y (aleatória se não definida)
      firebaseId: memory.id,                            // ID do Firebase (para encontrar de novo)
      // Timestamps originais (pode ser objetos complexos ou strings)
      expiresAt: memory.expiresAt,
      createdAt: memory.createdAt,
      // Timestamps em milissegundos (para cálculos rápidos de tempo)
      expiresAtMs: expiresAtMs,
      createdAtMs: createdAtMs
    };
    particles.push(particle); // Adiciona ao array global (processado no loop animate)
    
    // EVENT LISTENER: CLICK NA ESFERA
    // Quando o utilizador clica numa esfera, mostra o seu texto da memória
    circle.addEventListener('click', (e) => {
      e.stopPropagation(); // Evita propagar para document listener

      // Marca esta memória como selecionada (para destaque visual)
      selectedMemoryId = memory.id;

      // --- TRAZ A ESFERA SELECIONADA PARA O TOPO DO SVG E SOBRE O TEXTO ---
      // Move o círculo para o fim do grupo (último filho = topo visual)
      if (circle.parentNode) {
        circle.parentNode.appendChild(circle);
      }
      // Adiciona classe para garantir z-index sobre o texto
      circle.classList.add('over-text');

      // Remove a classe 'over-text' das outras esferas
      document.querySelectorAll('.memory-circle.over-text').forEach(el => {
        if (el !== circle) el.classList.remove('over-text');
      });

      // Limpa qualquer texto anterior e mostra o novo
      memoryDisplay.innerHTML = '';
      memoryDisplay.classList.add('active'); // Mostra (via CSS)

      // DIVIDE TEXTO EM FRASES E PALAVRAS
      // Regex: encontra frases (text até ponto/interrogação/exclamação, incluindo a pontuação)
      const sentenceChunks = memory.text.match(/[^.!?]+[.!?]*\s*/g) || [memory.text];
      
      sentenceChunks.forEach((sentText, sIdx) => {
        // Cria elemento span para cada frase
        const sentEl = document.createElement('span');
        sentEl.setAttribute('data-sentence-index', sIdx);
        sentEl.style.display = 'inline'; // Frases aparecem na mesma linha

        // Divide a frase em palavras
        const tokens = sentText.trim().split(/\s+/).filter(Boolean); // Separa por espaços
        
        tokens.forEach((word, wIdx) => {
          // Cria element span para cada palavra
          const span = document.createElement('span');
          span.textContent = word;
          span.style.opacity = '1'; // Começa visível
          
          // Estilos: cada palavra é texto branco sólido
          span.style.display = 'inline-block';
          span.style.background = 'none';
          span.style.webkitBackgroundClip = 'initial';
          span.style.backgroundClip = 'initial';
          span.style.color = '#fff';
          
          // Prepara para possíveis máscaras (não usadas atualmente, mas fica pronto aqui)
          span.style.maskImage = 'none';
          span.style.webkitMaskImage = 'none';
          span.style.maskRepeat = 'no-repeat';
          span.style.webkitMaskRepeat = 'no-repeat';
          span.style.maskSize = '100% 100%';
          span.style.webkitMaskSize = '100% 100%';
          
          // Marca índice da palavra (para encontrar no loop de animação)
          span.setAttribute('data-word-index', wIdx);
          
          sentEl.appendChild(span);
          // Adiciona espaço real (text node) após cada palavra (preserva layout)
          sentEl.appendChild(document.createTextNode(' '));
        });

        memoryDisplay.appendChild(sentEl);
      });

      // DEFINE TIMELINE DO EFEITO DE APAGAMENTO
      // Garante que espaços são preservados no layout
      memoryDisplay.style.whiteSpace = 'normal';
      
      // Marca qual memória está aberta
      memoryDisplay.setAttribute('data-memory-id', memory.id);
      
      // Calcula quando o efeito deve começar e terminar
      const nowMs = Date.now();
      let delayMs = TEXT_WIPE_DELAY_MS;       // Quanto tempo de leitura (defeito: 60s)
      let durationMs = TEXT_WIPE_DURATION_MS; // Quanto tempo demora o efeito (defeito: 90s)

      // ADAPTAÇÃO PARA MEMÓRIAS CURTAS
      // Se a memória tem pouco tempo de vida (nível 1 = 5 minutos), acelera o efeito
      if (Number.isFinite(expiresAtMs)) {
        const remainingMs = Math.max(0, expiresAtMs - nowMs); // Tempo até expirar
        // Se faltam menos de (delay + 10s), acelera
        if (remainingMs < (delayMs + 10000)) {
          // Reserva 20% para leitura (mínimo 2s), 80% para o efeito
          const fastDelay = Math.max(2000, Math.floor(remainingMs * 0.2));
          delayMs = Math.min(delayMs, fastDelay);
          durationMs = Math.max(5000, Math.floor(remainingMs - delayMs - 500));
        }
      }

      // Calcula os tempos absolutos (em ms desde 1970)
      let wipeStartMs = nowMs + delayMs;    // Quando começa o efeito
      let wipeEndMs = wipeStartMs + durationMs; // Quando termina o efeito
      
      // Se a memória expira antes do fim do efeito, limita ao momento de expiração
      if (Number.isFinite(expiresAtMs)) wipeEndMs = Math.min(wipeEndMs, expiresAtMs);
      
      // Garante que há pelo menos 1 segundo para o efeito (caso esteja muito perto do fim)
      if (wipeEndMs - wipeStartMs < 1000) wipeStartMs = Math.max(nowMs, wipeEndMs - 1000);
      
      // Guarda estes tempos no elemento (o loop de animação vai usá-los)
      memoryDisplay.setAttribute('data-wipe-start', String(wipeStartMs));
      memoryDisplay.setAttribute('data-wipe-end', String(wipeEndMs));
    });
    
    // LOG DEBUG
    if (DEBUG_FADE) {
      const total = Number.isFinite(expiresAtMs) && Number.isFinite(createdAtMs) 
        ? ((expiresAtMs - createdAtMs) / 1000).toFixed(1) 
        : 'N/A';
      console.log('✅ Esfera criada:', memory.id, 
        '| duração (seg):', total, 
        '| expiresAtMs:', expiresAtMs, 
        '| createdAtMs:', createdAtMs);
    } else {
      console.log('✅ Esfera criada:', memory.id);
    }
  }
  
  /**
   * Remove uma esfera SVG quando a memória expira ou é apagada
   * 
   * @param {string} memoryId - ID único do Firebase da memória a remover
   */
  function removeMemoryCircle(memoryId) {
    // ENCONTRA E REMOVE O ELEMENTO SVG
    const circle = svg.querySelector(`[data-firebase-id="${memoryId}"]`);
    if (circle) {
      circle.remove(); // Remove do DOM
      
      // REMOVE DO ARRAY DE PARTÍCULAS
      // Procura a posição no array global de partículas
      const index = particles.findIndex(p => p.firebaseId === memoryId);
      if (index > -1) {
        particles.splice(index, 1); // Remove da lista (mais 1 item)
      }

      // LIMPA SELEÇÃO SE NECESSÁRIO
      // Se a esfera removida era a selecionada, fecha o texto
      if (selectedMemoryId === memoryId) {
        selectedMemoryId = null; // Limpa seleção
        memoryDisplay.classList.remove('active'); // Esconde texto
        memoryDisplay.removeAttribute('data-memory-id');
        memoryDisplay.innerHTML = ''; // Limpa conteúdo
      }
      
      console.log('🗑️ Esfera removida do ecrã:', memoryId); // Confirmação no console
    }
  }
  
  // FECHAR TEXTO AO CLICAR FORA
  // Se clicar em qualquer lugar que não seja uma esfera, fecha o painel de texto
  document.addEventListener('click', (e) => {
    // Verifica se o elemento clicado é uma esfera
    if (!e.target.classList.contains('memory-circle')) {
      // Não é esfera, então fecha texto aberto
      memoryDisplay.classList.remove('active'); // Esconde (CSS)
      memoryDisplay.removeAttribute('data-memory-id');
      memoryDisplay.innerHTML = '';
      selectedMemoryId = null; // Remove destaque das esferas
      // Remove a classe especial de todas as esferas
      document.querySelectorAll('.memory-circle.over-text').forEach(el => {
        el.classList.remove('over-text');
      });
    }
  });
  
  /**
   * Inicializa a ligação ao Firebase e começa a ouvir mudanças em memórias
   * Aguarda que MemoryManager tenha carregado (do ficheiro memory-manager.js)
   */
  function initFirebaseListener() {
    // GUARDA FIREBASE E MemoryManager
    // memory-manager.js define window.MemoryManager quando carrega
    if (typeof window.MemoryManager === 'undefined') {
      console.log('⏳ Aguardando Firebase e MemoryManager...');
      // Tenta novamente em 100ms (MemoryManager ainda não foi carregado)
      setTimeout(initFirebaseListener, 100);
      return;
    }
    
    console.log('🔥 Firebase e MemoryManager carregados!');

    // LIMPA MEMÓRIAS EXPIRADAS NA INICIALIZAÇÃO
    // Remove qualquer memória que já passou da data de expiração
    if (typeof window.MemoryManager.cleanExpired === 'function') {
      window.MemoryManager.cleanExpired()
        .catch(err => console.warn('Aviso ao limpar expiradas:', err));
    }
    
    // CARREGA MEMÓRIAS EXISTENTES
    // Vai procurar memórias já submetidas (que ainda não expiraram)
    let initialLoadDone = false;
    window.MemoryManager.loadActive().then(memories => {
      memories.forEach(memory => {
        createMemoryCircle(memory); // Cria a bola animada para cada memória
      });
      initialLoadDone = true;
      console.log(`✅ Carregadas ${memories.length} memórias existentes`);
    });
    
    // LISTENER EM TEMPO REAL
    // Fica atento a novas submissões e remoções
    window.MemoryManager.listen((change) => {
      if (change.type === 'added') {
        // Só toca som se já terminou o carregamento inicial (ou seja, é recebida em tempo real)
        createMemoryCircle(change.memory);
        if (initialLoadDone) {
          try {
            const audio = new Audio('assets/musica/som.mp3');
            audio.volume = 0.8;
            audio.play();
          } catch (e) {
            console.warn('Erro ao tocar som:', e);
          }
        }
      }
      if (change.type === 'removed') {
        // Uma memória expirou (apagada do Firebase)
        removeMemoryCircle(change.memory.id);
      }
    });
  }
  
  // INICIA O SISTEMA
  // Começa o listener Firebase na inicialização da página
  initFirebaseListener();

});
