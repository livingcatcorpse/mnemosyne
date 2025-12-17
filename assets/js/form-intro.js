// ========================================
// MNEMOSYNE | Form Intro Navigation
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Controla a navegação entre os ecrãs da página do formulário:
// Ecrã de Intro - Ecrã de Texto - Ecrã do Formulário
// ========================================

(function() {
  
  // Encontra elementos dos ecrãs
  // Cada ecrã é uma <section> que mostra/esconde conforme o progresso
  const intro = document.getElementById('intro-screen');       // Ecrã inicial: apresentação do projecto
  const textScreen = document.getElementById('text-screen');   // Ecrã intermédio: parágrafos explicativos
  const form = document.getElementById('form-screen');         // Ecrã final: formulário
  
  // Encontra os botões de navegação
  // Cada botão leva ao próximo ecrã
  const introBtn = document.getElementById('intro-continue');  // Botão "continuar" da intro
  const textBtn = document.getElementById('text-continue');    // Botão "continuar" do texto
  
  // VALIDAÇÃO: todos os elementos existem
  // Se faltar algum elemento, a navegação não vai funcionar
  if (!intro || !textScreen || !form || !introBtn || !textBtn) {
    console.warn('⚠️ Elementos de navegação intro não encontrados');
    return;
  }
  
  // CONFIGURAÇÃO DAS ANIMAÇÕES
  const fadeDuration = 420;  // Quanto tempo demora a animação fade (em milissegundos)
  const slightDelay = 120;   // Tempo de espera entre fade out e fade in (para evitar flicker)
  
  // FUNÇÃO: MOSTRAR ECRÃ DE TEXTO
  /**
   * Transição: Ecrã Intro - Ecrã Texto
   * 
   * Animação:
   * 1. Fade out da intro (torna-se invisível)
   * 2. Esconde intro do DOM
   * 3. Mostra o texto
   * 4. Fade in do texto (torna-se visível)
   */
  function showTextScreenWithFade() {
    // FASE 1: FADE OUT INTRO
    intro.classList.remove('fade-in');  // Remove animação fade-in (se existir)
    intro.classList.add('fade-out');    // Adiciona animação fade-out (desaparece gradualmente)
    
    // Aguarda que o fade out termine (420ms)
    setTimeout(() => {
      intro.setAttribute('hidden', '');  // Esconde a intro (não ocupa espaço no DOM)
      
      // FASE 2: FADE IN TEXTO
      // Aguarda um curto delay para evitar flicker (mudança de ecrã brusca)
      setTimeout(() => {
        textScreen.removeAttribute('hidden');  // Mostra o texto (torna acessível no DOM)
        textScreen.classList.add('fade-in');   // Adiciona animação fade-in (aparece gradualmente)
      }, slightDelay); // 120ms de espera
    }, fadeDuration); // Aguarda 420ms (duração do fade out)
  }
  
  // FUNÇÃO: MOSTRAR ECRÃ DO FORMULÁRIO
  /**
   * Transição: Ecrã Texto - Ecrã Formulário
   * 
   * Animação:
   * 1. Fade out do texto (torna-se invisível)
   * 2. Esconde texto do DOM
   * 3. Mostra formulário
   * 4. Fade in do formulário (torna-se visível)
   * 5. foca no primeiro campo (acessibilidade)
   */
  function showFormWithFade() {
    // FASE 1: FADE OUT TEXTO
    textScreen.classList.remove('fade-in');  // Remove animação fade-in
    textScreen.classList.add('fade-out');    // Adiciona animação fade-out (desaparece)
    
    // Aguarda que o fade out termine (420ms)
    setTimeout(() => {
      textScreen.setAttribute('hidden', '');  // Esconde o texto (não ocupa espaço)
      
      // FASE 2: FADE IN FORMULÁRIO
      // Aguarda um curto delay para evitar flicker (mudança brusca)
      setTimeout(() => {
        form.removeAttribute('hidden');       // Mostra o formulário (torna acessível)
        form.classList.add('fade-in');        // Adiciona animação fade-in (aparece)
        
        // ACESSIBILIDADE: FOCO NO PRIMEIRO CAMPO
        // Posiciona o cursor no primeiro campo do formulário (textarea, input, etc)
        // Permite o utilizador começar a escrever imediatamente logo
        const firstField = form.querySelector('textarea, select, input, button');
        if (firstField) firstField.focus();
      }, slightDelay); // 120ms de espera
    }, fadeDuration); // Aguarda 420ms (duração do fade out)
  }
  
  // EVENT LISTENERS DOS BOTÕES
  // Quando o utilizador clica, executa a transição correspondente
  introBtn.addEventListener('click', showTextScreenWithFade);  // Intro - Texto
  textBtn.addEventListener('click', showFormWithFade);         // Texto - Formulário

  // Permitir avançar com Enter (acessibilidade)
  introBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showTextScreenWithFade();
    }
  });
  textBtn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showFormWithFade();
    }
  });
  
})();
