// ========================================
// MNEMOSYNE | Form Steps Navigation
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Controla a navegação entre os 4 passos (steps) do formulário
// Estrutura:
// - Step 1: Escrever o texto da memória (textarea)
// - Step 2: Escolher a frequência (5 tamanhos de círculos)
// - Step 3: Escolher a emoção (8 cores)
// - Step 5: Escolher o nível de medo (5 intensidades)
// - Submit: Enviar para o Firebase
// ========================================

document.addEventListener('DOMContentLoaded', function() {


  // Permitir avançar do Step 1 para o Step 2 ao carregar Enter dentro da textarea
  
  // ENCONTRA OS ELEMENTOS (STEPS)
  // Cada step é um <section> do formulário
  const step1 = document.getElementById('form-step-1');  // Step 1: Campo texto (textarea)
  const step2 = document.getElementById('form-step-2');  // Step 2: Frequência (5 opções circulares)
  const step3 = document.getElementById('form-step-3');  // Step 3: Emoção (8 cores/gradientes)
  const step5 = document.getElementById('form-step-5');  // Step 5: Medo (5 intensidades)
  
  // ENCONTRA OS BOTÕES DE NAVEGAÇÃO
  // Cada botão leva ao step seguinte ou submete
  const btnStep1 = document.getElementById('btn-step-1');      // Botão: continuar de Step 1
  const btnStep2 = document.getElementById('btn-step-2');      // Botão: continuar de Step 2
  const btnStep3 = document.getElementById('btn-step-3');      // Botão: continuar de Step 3
  const btnSubmit = document.getElementById('btn-submit');     // Botão: submeter formulário
  
  // ENCONTRA OS CAMPOS DO FORMULÁRIO
  const memoryText = document.getElementById('memory-text');   // Textarea do Step 1
  const form = document.getElementById('memory-form');         // Elemento <form>
  
  // VALIDAÇÃO: TODOS OS ELEMENTOS EXISTEM
  // Se falta algum elemento, não funciona a navegação
  if (!step1 || !step2 || !step3 || !step5 || 
      !btnStep1 || !btnStep2 || !btnStep3 || !btnSubmit || 
      !memoryText || !form) {
    console.warn('⚠️ Elementos do formulário não encontrados');
    return;
  }
  
  // CONFIRMAÇÃO DAS ANIMAÇÕES
  const fadeDuration = 420;  // Duração de cada transição fade (milissegundos)
  const slightDelay = 120;   // Pausa entre fade-out e fade-in (evita flicker)
  
  // Função para avançar Step 1 -> Step 2
  function avancarStep1ParaStep2() {
    if (!memoryText.value.trim()) {
      alert('Por favor, escreve algo');
      memoryText.focus();
      return;
    }
    btnStep1.setAttribute('hidden', '');
    btnStep2.removeAttribute('hidden');
    step1.classList.add('fade-out');
    setTimeout(() => {
      step1.setAttribute('hidden', '');
      setTimeout(() => {
        step2.removeAttribute('hidden');
        step2.classList.add('fade-in');
      }, slightDelay);
    }, fadeDuration);
  }

  // Avançar com o botão
  btnStep1.onclick = avancarStep1ParaStep2;

  // Avançar com Enter na textarea
  memoryText.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      avancarStep1ParaStep2();
    }
  });
  
  // STEP 2 - STEP 3
  // De: Escolher a frequência
  // Para: Escolher a emoção
  /**
   * Valida a frequência selecionada e transiciona para o Step 3
   */
  btnStep2.onclick = function() {
    // VALIDAÇÃO: FREQUÊNCIA SELECIONADA
    // O utilizador deve escolher uma das 5 opções
    const sizeSelected = document.querySelector('input[name="size-choice"]:checked');
    if (!sizeSelected) {
      alert('Por favor, seleciona uma opção'); // Aviso ao utilizador
      return;                                   // Cancela a transição
    }
    
    // TROCA DE BOTÕES VISÍVEIS
    btnStep2.setAttribute('hidden', '');      // Esconde o botão Step 2
    btnStep3.removeAttribute('hidden');       // Mostra o botão Step 3
    
    // ANIMAÇÃO: TRANSIÇÃO STEP 2 - STEP 3
    step2.classList.add('fade-out');          // Fade out Step 2
    
    setTimeout(() => {
      step2.setAttribute('hidden', '');       // Esconde o Step 2
      setTimeout(() => {
        step3.removeAttribute('hidden');      // Mostra o Step 3
        step3.classList.add('fade-in');       // Fade in Step 3
      }, slightDelay); // 120ms de espera
    }, fadeDuration); // 420ms
  };
  
  // STEP 3 - STEP 5
  // De: Escolher a emoção
  // Para: Escolher o medo
  // (Notinha: Chamamos "Step 5" em vez de "Step 4" pelo design da página)
  /**
   * Valida a emoção selecionada e transiciona para o Step 5
   */
  btnStep3.onclick = function() {
    // VALIDAÇÃO: EMOÇÃO SELECIONADA
    // O utilizador deve escolher uma das 3 emoções (warm/cool/vibrant)
    const emotionSelected = document.querySelector('input[name="color-choice"]:checked');
    if (!emotionSelected) {
      alert('Por favor, seleciona uma emoção'); // Aviso ao utilizador
      return;                                    // Cancela transição
    }
    
    // TROCA DE BOTÕES VISÍVEIS
    btnStep3.setAttribute('hidden', '');      // Esconde o botão Step 3
    btnSubmit.removeAttribute('hidden');      // Mostra o botão de submissão
    
    // ANIMAÇÃO: TRANSIÇÃO STEP 3 - STEP 5
    step3.classList.add('fade-out');          // Fade out Step 3
    
    setTimeout(() => {
      step3.setAttribute('hidden', '');       // Esconde o Step 3
      setTimeout(() => {
        step5.removeAttribute('hidden');      // Mostra o Step 5 (escolha do medo)
        step5.classList.add('fade-in');       // Fade in Step 5
      }, slightDelay); // 120ms de espera
    }, fadeDuration); // 420ms
  };
  
  // STEP 5 - SUBMIT
  // De: Escolher o medo
  // Para: Enviar para o Firebase
  /**
   * Valida nível de medo e submete o formulário
   */
  btnSubmit.onclick = function() {
    // VALIDAÇÃO: MEDO SELECIONADO
    // O utilizador deve escolher uma das 5 intensidades (low/medium/high)
    const fearSelected = document.querySelector('input[name="fear-choice"]:checked');
    if (!fearSelected) {
      alert('Por favor, seleciona uma opção'); // Aviso ao utilizador
      return;                                   // Cancela a submissão
    }
    
    // SUBMETE O FORMULÁRIO
    // requestSubmit() dispara o evento submit do form (chamará o form-handler.js)
    // Fallback para .submit() em browsers mais antigos
    form.requestSubmit ? form.requestSubmit() : form.submit();
  };
});
