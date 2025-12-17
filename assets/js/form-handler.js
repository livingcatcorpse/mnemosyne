// ========================================
// MNEMOSYNE | Form Handler & Submission
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Gere a submissão do formulário de memórias:
// - Valida as respostas
// - Envia os dados para Firebase
// - Mostra "feedback" ao utilizador
// - Transição para o ecrã de confirmação
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  
  // PARA ENCONTRAR O FORMULÁRIO
  const form = document.getElementById('memory-form');
  
  if (!form) {
    console.warn('⚠️ Formulário não encontrado');
    return;
  }
  
  // SUBMISSÃO DO FORMULÁRIO
  // Executado quando utilizador clica em "submete"
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Previne comportamento padrão (reload da página)
    
    //RECOLHE OS DADOS DO FORMULÁRIO
    // Cada campo corresponde a uma resposta do utilizador
    const memoryText = document.getElementById('memory-text')?.value?.trim();               // O texto da memória (textarea)
    const sizeChoice = document.querySelector('input[name="size-choice"]:checked')?.value; // Frequência: small, medium, large, etc
    const colorChoice = document.querySelector('input[name="color-choice"]:checked')?.value; // Emoção: warm, cool, vibrant etc
    const fearChoice = document.querySelector('input[name="fear-choice"]:checked')?.value; // Nível de medo: low, medium, high, etc
    const durationChoice = 'moderate'; // Duração: fixa em 'moderate' (não é passo do form)
    
    // VALIDAÇÃO DOS DADOS DO TEXTO
    // Mensagem que aparece de limitação do texto deve ter pelo menos 10 caracteres (memória significativa)
    if (!memoryText || memoryText.length < 10) {
      showMessage('Por favor, escreve uma memória com pelo menos 10 caracteres.', 'error');
      return;
    }
    
    // VALIDAÇÃO DAS ESCOLHAS
    // Utilizador deve responder a todas as perguntas para conseguir avançar e submeter
    if (!sizeChoice || !colorChoice || !fearChoice) {
      showMessage('Por favor, responde a todas as perguntas.', 'error');
      return;
    }
    
    // DESATIVA O BOTÃO DE SUBMISSÃO
    // Previne múltiplas submissões acidentais
    const submitBtn = document.getElementById('btn-submit');
    const originalText = submitBtn?.querySelector('p')?.textContent;
    
    if (submitBtn) {
      submitBtn.style.pointerEvents = 'none'; // Não responde a cliques
      submitBtn.style.opacity = '0.5';        // Aparência visual desativada (mais claro)
      const btnText = submitBtn.querySelector('p');
      if (btnText) btnText.textContent = 'a enviar...'; // Feedback: mostra que está a enviar
    }
    
    try {
      // ENVIA OS DADOS PARA O FIREBASE
      // MemoryManager.create() processa e guarda no Firebase
      const result = await window.MemoryManager.create({
        text: memoryText,            // Conteúdo da memória
        sizeChoice: sizeChoice,      // Importância/frequência
        colorChoice: colorChoice,    // Tipo de emoção
        durationChoice: durationChoice, // Duração desejada
        fearChoice: fearChoice       // Nível de medo/intensidade
      });
      
      if (result.success) {
        // SUBMISSÃO COM SUCESSO
        const formScreen = document.getElementById('form-screen');
        const confirmationScreen = document.getElementById('confirmation-screen');
        
        // Esconde o botão de submissão
        if (submitBtn) {
          submitBtn.setAttribute('hidden', '');
        }
        
        // PÁGINA DE CONFIRMAÇÃO E OBRIGADA PELA PARTICIPAÇÃO
        const thankYouMsg = document.createElement('div');
        thankYouMsg.className = 'thank-you-message';
        thankYouMsg.textContent = 'Obrigado pela tua participação.';
        // Estilos CSS para a mensagem flutuar no fundo
        thankYouMsg.style.cssText = `
          position: fixed;           /* Fixo na viewport */
          bottom: 80px;              /* 80px acima do fundo */
          left: 50%;                 /* Centrado horizontalmente */
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.21);
          font-size: 18px;
          line-height: 128.7%;
          font-weight: 600;
          letter-spacing: 0.02em;
          font-family: 'Montserrat', sans-serif;
          text-align: center;
          z-index: 10;
        `;
        document.body.appendChild(thankYouMsg);
        
        // A TRANSIÇÃO DO FORMULÁRIO PARA A CONFIRMAÇÃO
        // Fade out do formulário, fade in da confirmação
        formScreen.classList.add('fade-out'); // Começa a desaparecer
        setTimeout(() => {
          formScreen.setAttribute('hidden', '');              // Esconde (não ocupa espaço)
          confirmationScreen.removeAttribute('hidden');       // Mostra a confirmação
          confirmationScreen.classList.add('fade-in');        // Fade in suave
        }, 420); // 420ms = duração da animação CSS fade
        
      } else {
        // ERRO NA SUBMISSÃO DOS DADOS NO FIREBASE
        showMessage('❌ Erro ao enviar: ' + result.error, 'error');
      }
      
    } catch (error) {
      // ERRO NA EXECUÇÃO GERAL (exceção)
      showMessage('❌ Erro ao enviar memória. Tenta novamente.', 'error');
      console.error(error);
      
    } finally {
      // REATIVA O BOTÃO DE SUBMISSÃO (sempre, sucesso ou erro)
      // Garante que o botão volta ao normal para novo envio
      if (submitBtn) {
        submitBtn.style.pointerEvents = '';  // Volta a responder a cliques
        submitBtn.style.opacity = '';        // Restaura opacidade (100% de novo)
        const btnText = submitBtn.querySelector('p');
        if (btnText) btnText.textContent = originalText || 'submete'; // Restaura o texto original
      }
    }
  });
});

// FUNÇÃO AUXILIAR: MOSTRAR MENSAGEM AO UTILIZADOR
/**
 * Mostra uma mensagem temporária ao utilizador
 * Aparece no topo da tela durante 5 segundos, depois desaparece
 * 
 * @param {string} message - Texto a mostrar
 * @param {string} type - Tipo: 'success' (verde), 'error' (vermelho), ou 'info' (azul)
 */
function showMessage(message, type = 'info') {
  // Cria ou reutiliza o elemento da mensagem
  let messageEl = document.getElementById('form-message');
  
  if (!messageEl) {
    // Primeira vez: cria elemento novo
    messageEl = document.createElement('div');
    messageEl.id = 'form-message';
    // Estilos: fixo no topo, centrado, com sombra
    messageEl.style.cssText = `
      position: fixed;             /* Fixo na viewport */
      top: 20px;                   /* 20px do topo */
      left: 50%;                   /* Centrado horizontalmente */
      transform: translateX(-50%);
      padding: 16px 24px;          /* Espaço interior */
      border-radius: 8px;          /* Cantos arredondados */
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;               /* Muito à frente */
      max-width: 90%;              /* não ultrapassa ecrã */
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: opacity 0.3s ease; /* Fade suave ao desaparecer */
    `;
    document.body.appendChild(messageEl);
  }
  
  // Define cor baseada no tipo da mensagem
  const colors = {
    success: { bg: '#10b981', color: '#fff' }, // Verde (sucesso)
    error: { bg: '#ef4444', color: '#fff' },   // Vermelho (erro)
    info: { bg: '#3b82f6', color: '#fff' }     // Azul (informação)
  };
  
  const style = colors[type] || colors.info;
  messageEl.style.backgroundColor = style.bg;  // Cor de fundo
  messageEl.style.color = style.color;         // Cor do texto
  messageEl.textContent = message;
  messageEl.style.opacity = '1'; // Mostra (100% visível)
  
  // Remove automaticamente após 5 segundos (desparece e não fica sempre)
  setTimeout(() => {
    messageEl.style.opacity = '0'; // Fade out (torna invisível gradualmente)
    setTimeout(() => messageEl.remove(), 300); // Remove do DOM (300ms após fade)
  }, 5000); // 5 segundos até começar a desaparecer
}
