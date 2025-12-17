// ========================================
// MNEMOSYNE | Esferas na Página do Formulário
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Anima as bolas pequenas e médias na página do formulário
// Estas esferas são APENAS ESTÉTICAS (não estão ligadas ao Firebase)
// Usa os mesmos gradientes e filtros SVG do rest do projeto
// Objetivo: Criar um ambiente visual consistente na página de submissão
// ========================================

(function() {
  // Aguarda que o DOM esteja carregado
  document.addEventListener('DOMContentLoaded', () => {
    
    // ENCONTRA O SVG / ELEMENTOS DO FORMULÁRIO
    // Procura o canvas SVG na página
    const svg = document.querySelector('.decor-canvas svg');
    if (!svg) return; // Se não existe, sai (página talvez sem formulário)
    
    // Encontra grupo com filtro (glow), ou usa SVG raiz como fallback
    const group = svg.querySelector('#memory-circles-container') || 
                  svg.querySelector('g[filter]') || 
                  svg;
    
    // DIMENSÕES
    // Lê viewBox para saber o tamanho do canvas
    const vb = svg.viewBox.baseVal;
    const width = vb.width;   // Largura (ex: 1728)
    const height = vb.height; // Altura (ex: 1117)
    
    // ESTADO GLOBAL DAS BOLAS/ESFERAS
    // Array que guarda todas as bolas decorativas
    const balls = [];

    // GRADIENTES
    // IDs dos 12 gradientes definidos no SVG
    const gradients = Array.from({ length: 12 }, (_, i) => `grad-${i+1}`);
    
    // CONFIGURAÇÃO TIPO POR NÍVEL PARA AS ESFERAS
    // Simulamos 5 níveis (como as memórias reais do website) para a estética consistente
    // Quanto menor o nível, mais pequenas/mais fortes as bolas
    // 1: minúsculas/muito vibrantes; 5: maiores/suaves
    const levelConfigs = [
      { minR: 18, maxR: 42, opacity: 1.0, glow: 1.0, speed: 2.4 },   // Nível 1: Pequenas + rápidas + fortes
      { minR: 22, maxR: 56, opacity: 0.95, glow: 0.95, speed: 2.2 }, // Nível 2: Pequeno-médio + rápidas
      { minR: 34, maxR: 78, opacity: 0.9, glow: 0.9, speed: 2.0 },   // Nível 3: Médio + moderadas
      { minR: 48, maxR: 110, opacity: 0.85, glow: 0.85, speed: 1.8 }, // Nível 4: Médio-grande + suaves
      { minR: 62, maxR: 140, opacity: 0.8, glow: 0.8, speed: 1.6 }   // Nível 5: Grandes + lentas
    ];

    // Funções auxiliares
    /**
     * Retorna o número aleatório entre min (inclusive) e max (exclusivo)
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     * @returns {number} Número aleatório
     */
    function rand(min, max) { 
      return Math.random() * (max - min) + min; 
    }
    
    /**
     * Retorna o elemento aleatório de um array
     * @param {Array} arr - Array para escolher
     * @returns {*} Elemento aleatório
     */
    function pick(arr) { 
      return arr[Math.floor(Math.random() * arr.length)]; 
    }
    
    /**
     * Cria uma nova bola decorativa e adiciona ao canvas
     * Cada bola tem: tamanho aleatório, posição aleatória, cor aleatória, velocidade aleatória
     */
    function createDecorBall() {
      // ESCOLHE O NÍVEL DA BOLA
      // Pesos: níveis pequenos (1,2) aparecem mais frequentemente
      // Percentuais: nível 1=34%, 2=26%, 3=20%, 4=12%, 5=8%
      const levelWeights = [0.34, 0.26, 0.2, 0.12, 0.08];
      const rand01 = Math.random(); // Número entre 0 e 1
      let acc = 0, lvl = 0;
      // Procura qual nível corresponde ao número aleatório
      for (let i = 0; i < levelWeights.length; i++) { 
        acc += levelWeights[i]; 
        if (rand01 <= acc) { 
          lvl = i; // Escolhe este nível
          break; 
        } 
      }
      const cfg = levelConfigs[lvl]; // Obtém a configuração do nível

      // PARÂMETROS ALEATÓRIOS 
      const r = rand(cfg.minR, cfg.maxR);                    // Raio aleatório dentro do intervalo
      const x = rand(r, width - r);                          // X aleatória (sem cair fora)
      const y = rand(r, height - r);                         // Y aleatória (sem cair fora)
      const vx = rand(-cfg.speed, cfg.speed);                // Velocidade X (pode ser negativa)
      const vy = rand(-cfg.speed, cfg.speed);                // Velocidade Y (pode ser negativa)
      const gradient = pick(gradients);                      // Cor aleatória

      // CRIA O ELEMENTO SVG CÍRCULO
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.classList.add('decor-ball');
      circle.setAttribute('cx', x);                          // Posição X
      circle.setAttribute('cy', y);                          // Posição Y
      circle.setAttribute('r', r);                           // Raio
      circle.setAttribute('fill', `url(#${gradient})`);      // Preenchimento com gradiente SVG
      circle.setAttribute('filter', 'url(#highlight)');      // Aplica filtro glow
      // Opacidade depende do nível: níveis pequenos mais visíveis
      circle.style.opacity = String(cfg.opacity);
      group.appendChild(circle);                             // Adiciona ao SVG

      // ADICIONA AO ARRAY DAS BOLAS
      balls.push({ el: circle, x, y, r, vx, vy, lvl });
    }
    
    /**
     * Loop de animação (~60 vezes por segundo)
     * Move cada bola, faz bounce nas bordas, atualiza SVG
     */
    function animate() {
      balls.forEach(p => {
        // MOVIMENTO
        // Adiciona velocidade à posição
        p.x += p.vx;
        p.y += p.vy;
        
        // COLISÃO COM AS PAREDES
        // Verifica se saiu pela esquerda
        if (p.x - p.r < 0) { 
          p.x = p.r;                 // Corrige posição
          p.vx = Math.abs(p.vx);     // Inverte velocidade (volta para dentro)
        }
        // Verifica se saiu pela direita
        if (p.x + p.r > width) { 
          p.x = width - p.r;         // Corrige posição
          p.vx = -Math.abs(p.vx);    // Inverte velocidade (volta para dentro)
        }
        // Verifica se saiu pelo topo
        if (p.y - p.r < 0) { 
          p.y = p.r;                 // Corrige posição
          p.vy = Math.abs(p.vy);     // Inverte velocidade (volta para dentro)
        }
        // Verifica se saiu pelo fundo
        if (p.y + p.r > height) { 
          p.y = height - p.r;        // Corrige posição
          p.vy = -Math.abs(p.vy);    // Inverte velocidade (volta para dentro)
        }
        
        // ATUALIZA A POSIÇÃO NO SVG
        // Muda as coordenadas do círculo (mostra mudança na tela)
        p.el.setAttribute('cx', p.x);
        p.el.setAttribute('cy', p.y);
        
        // VARIAÇÃO LIGEIRA DA VELOCIDADE
        // A cada ~100 frames (1-2 segundos), muda levemente a velocidade
        // Isto cria movimento mais natural/orgânico (não em linha reta perfeita)
        if (Math.random() < 0.01) { 
          // Adiciona pequeno valor aleatório à velocidade (-0.15 a 0.15)
          p.vx += rand(-0.15, 0.15);
          p.vy += rand(-0.15, 0.15);
        }
        // Limita a velocidade máxima (evita bolas a andar muito rápidas)
        p.vx = Math.max(-3, Math.min(3, p.vx));
        p.vy = Math.max(-3, Math.min(3, p.vy));
      });
      
      // Agenda o próximo frame (~60 FPS)
      requestAnimationFrame(animate);
    }
    
    // INICIALIZAÇÃO
    // Cria 28 bolas decorativas
    const COUNT = 28;
    for (let i = 0; i < COUNT; i++) createDecorBall();
    
    // Inicia o loop de animação
    animate();
  });
})();
