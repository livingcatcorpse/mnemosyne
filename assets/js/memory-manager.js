// ========================================
// MNEMOSYNE - Memory Manager
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Gere criação, carregamento, monitorização e limpeza das memórias no Firebase
// Calcula o tamanho e duração baseado nas respostas do formulário do utilizador
// Este ficheiro funciona como a "camada de base de dados" do projeto
// Fornece as funções para:
// - Criar uma nova memória (formData - Firebase doc)
// - Carregar as memórias ativas
// - Ouvir as mudanças em tempo real
// - Limpar as memórias expiradas
// ========================================

// CONFIGURAÇÃO
// Mapeamento das escolhas do formulário para valores técnicos/visuais

const MEMORY_CONFIG = {
  // TAMANHO DA ESFERA (em pixels de raio)
  // Quanto maior a esfera, mais visível é a memória
  size: {
    small: 60,           // Nível 1: muito pequena
    'small-medium': 90,  // Nível 2: pequena-média
    medium: 120,         // Nível 3: média (default)
    'medium-large': 150, // Nível 4: média-grande
    large: 180           // Nível 5: muito grande
  },
  
  // CORES/GRADIENTES DISPONÍVEIS
  // Cada emoção tem uma paleta de cores para escolher
  // Os IDs referem-se a elementos <linearGradient> no SVG
  color: {
    warm: ['grad-1', 'grad-4', 'grad-7', 'grad-11'],     // Quentes: vermelho, laranja, dourado
    cool: ['grad-2', 'grad-6', 'grad-10', 'grad-12'],    // Frias: azul, ciano, verde água
    vibrant: ['grad-3', 'grad-5', 'grad-8', 'grad-9']    // Vibrantes: rosa, roxo, amarelo, lima
  }
  // Nota: não há duração fixa aqui; é calculada dinamicamente por createMemory()
};

// CRIAR MEMÓRIA
/**
 * Cria uma nova memória no Firebase baseada nas respostas do formulário
 * 1. Converte as escolhas do formulário em números (scores 1-5)
 * 2. Calcula o tamanho da esfera baseado na intensidade da emoção
 * 3. Calcula a duração baseada no peso emocional
 * 4. Escolhe uma cor aleatória da paleta emocional
 * 5. Coloca numa posição aleatória
 * 6. Guarda tudo no Firebase
 * 
 * @param {Object} memoryData - Dados do formulário
 *   - text: string (conteúdo da memória)
 *   - sizeChoice: string ('small', 'medium', 'large', etc)
 *   - colorChoice: string ('warm', 'cool', 'vibrant')
 *   - fearChoice: string ('low', 'medium', 'high', etc)
 *   - durationChoice: string ('brief', 'moderate', 'lasting')
 * @returns {Promise<Object>} { success: boolean, id: string (ou error: string) }
 */
async function createMemory(memoryData) {
  const { text, sizeChoice, colorChoice, durationChoice, fearChoice } = memoryData;
  
  // CONVERTE AS ESCOLHAS EM VALORES NUMÉRICOS (1-5)
  // Cada escolha tem um valor que representa intensidade/importância
  const sizeMap = { 
    small: 1,           // Memória pequena
    'small-medium': 2,  // Pouco importante
    medium: 3,          // Médio (default)
    'medium-large': 4,  // Importante
    large: 5            // Muito importante
  };
  
  const fearMap = { 
    low: 1,             // Sem medo
    'low-medium': 2,    // Pouco medo
    medium: 3,          // Medo moderado
    'medium-high': 4,   // Muito medo
    high: 5             // Pânico
  };
  
  // INTENSIDADE EMOCIONAL POR COR
  // Cores quentes e vibrantes têm emoções mais intensas
  const emotionIntensity = {
    warm: 4,     // Raiva, medo, nostalgia - emoções fortes
    vibrant: 5,  // Alegria extrema, catarse - emoções muito fortes
    cool: 3      // Nojo, tristeza, distância - emoções moderadas
  };
  
  // PESO DA DURAÇÃO ESCOLHIDA
  // Memórias que o utilizador quer guardar mais tempo são mais importantes
  const durationWeight = {
    brief: 2,     // informação 10-30min
    moderate: 3,  // tempo médio default
    lasting: 5    // muito importante horas
  };
  
  // OBTÉM VALORES DAS ESCOLHAS
  // Fallback: se escolha inválida, usa valor default (3 = médio)
  const frequencyValue = sizeMap[sizeChoice] || 3;
  const fearValue = fearMap[fearChoice] || 3;
  const emotionValue = emotionIntensity[colorChoice] || 3;
  const durationValue = durationWeight[durationChoice] || 3;
  
  // CALCULA O TAMANHO DA ESFERA
  // Quanto mais intensa a memória, maior a esfera
  // Score total: média de todos os valores
  // Possível range: mínimo = (1+1+2+2)/4 = 1.5, máximo = (5+5+5+5)/4 = 5
  const totalScore = (frequencyValue + fearValue + emotionValue + durationValue) / 4;
  
  // Mapeia score (1.5-5) para raio em pixels (60-180)
  const minRadius = 60;      // Esfera mais pequena
  const maxRadius = 180;     // Esfera mais grande
  const radius = Math.round(minRadius + ((totalScore - 1.5) * (maxRadius - minRadius) / 3.5));
  
  // CALCULA DURAÇÃO DA MEMÓRIA
  // Score ponderado: frequência e medo contam 2x cada
  // Isto dá mais peso às memórias que assustam ou que ocorrem frequentemente
  const durationScore = (frequencyValue * 2 + fearValue * 2 + emotionValue + durationValue) / 6;
  
  // 5 NÍVEIS DE DURAÇÃO
  // Baseado no score, escolhe quanto tempo a memória vive
  let durationHours;
  if (durationScore <= 2) {
    durationHours = 5 / 60;      // Nível 1: 5 minutos (muito efémera)
  } else if (durationScore <= 2.8) {
    durationHours = 20 / 60;     // Nível 2: 20 minutos
  } else if (durationScore <= 3.6) {
    durationHours = 40 / 60;     // Nível 3: 40 minutos
  } else if (durationScore <= 4.3) {
    durationHours = 3;           // Nível 4: 3 horas
  } else {
    durationHours = 6;           // Nível 5: 6 horas (longa vida)
  }
  
  // SELECIONA A COR DE FORMA ALEATÓRIA
  // A paleta de cores é determinada pela escolha de emoção
  const colorPalette = MEMORY_CONFIG.color[colorChoice];
  // Escolhe um gradiente aleatório dessa paleta
  const gradient = colorPalette[Math.floor(Math.random() * colorPalette.length)];
  
  // POSIÇÃO INICIAL ALEATÓRIA
  // Canvas SVG: viewBox = "0 0 1728 1117"
  // Deixa margem de 100px para as esferas não aparecerem na beira
  const cx = Math.random() * 1528 + 100;  // X entre 100 e 1628
  const cy = Math.random() * 917 + 100;   // Y entre 100 e 1017
  
  // VELOCIDADES INICIAIS ALEATÓRIAS
  // Esferas nascem com movimento aleatório
  // vx, vy: velocidade em pixels por frame (~60fps)
  const vx = (Math.random() - 0.5) * 2;  // Entre -1 e 1
  const vy = (Math.random() - 0.5) * 2;  // Entre -1 e 1
  
  // TIMESTAMPS DE CRIAÇÃO E DE EXPIRAÇÃO
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
  
  // OBJETO FINAL DA MEMÓRIA
  // Este objeto é guardado no Firebase
  const memory = {
    text: text,                                                   // Conteúdo da memória
    radius: radius,                                               // Tamanho em pixels
    gradient: gradient,                                           // ID do gradiente SVG
    cx: cx,                                                       // Posição X inicial
    cy: cy,                                                       // Posição Y inicial
    vx: vx,                                                       // Velocidade X inicial
    vy: vy,                                                       // Velocidade Y inicial
    createdAt: firebase.firestore.Timestamp.fromDate(now),        // Hora de criação
    expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),  // Hora de expiração
    durationHours: durationHours,                                 // Duração em horas
    sizeChoice: sizeChoice,                                       // Escolha original (log)
    fearChoice: fearChoice,                                       // Escolha original (log)
    isActive: true                                                // Flag de ativo
  };
  
  try {
    // ADICIONA AO FIREBASE
    // Firestore adiciona um ID único automaticamente
    const docRef = await window.firebaseDB.collection('memories').add(memory);
    console.log('✅ Memória criada com ID:', docRef.id, '(dura', durationHours.toFixed(2), 'h)');
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Erro ao criar memória:', error);
    return { success: false, error: error.message };
  }
}

// UTILITÁRIO: CONVERTER TIMESTAMPS
/**
 * Converte qualquer formato de timestamp em milissegundos
 * 
 * Aceita: 
 * - Números (já em ms)
 * - Strings ISO
 * - Firebase Timestamp objects (toMillis(), toDate())
 * - Firestore format {seconds, nanoseconds}
 * - Date objects
 * 
 * Retorna: Milissegundos desde 1 de janeiro 1970, ou NaN se inválido
 * 
 * @param {*} ts - Timestamp em qualquer formato suportado
 * @returns {number} Milissegundos (ou NaN)
 */
function tsToMs(ts) {
  // Se for vazio/null, inválido
  if (!ts) return NaN;
  
  // Se já for número, assume milissegundos
  if (typeof ts === 'number') return ts;
  
  // Se for string, tenta fazer parse ISO
  if (typeof ts === 'string') {
    const ms = Date.parse(ts);
    return Number.isNaN(ms) ? NaN : ms;
  }
  
  // Firebase Timestamp object: toMillis()
  if (typeof ts.toMillis === 'function') return ts.toMillis();
  
  // Firebase Timestamp object: toDate().getTime()
  if (typeof ts.toDate === 'function') return ts.toDate().getTime();
  
  // Firestore compat: {seconds: X, nanoseconds: Y}
  if (typeof ts.seconds === 'number') {
    const ns = typeof ts.nanoseconds === 'number' ? ts.nanoseconds : 0;
    return ts.seconds * 1000 + Math.floor(ns / 1e6);
  }
  
  // Último recurso: tenta criar Date
  try {
    const d = new Date(ts);
    const ms = d.getTime();
    return Number.isNaN(ms) ? NaN : ms;
  } catch {
    return NaN;
  }
}

// CARREGAR MEMÓRIAS ATIVAS
/**
 * Carrega todas as memórias que ainda não expiraram do Firebase
 * 
 * Processo:
 * 1. Procura todos os docs de memórias
 * 2. Verifica expiração no cliente (não confia em 'now' do servidor)
 * 3. Apaga memórias expiradas proativamente
 * 4. Retorna apenas as ativas
 * 
 * Executado uma única vez na inicialização (não em tempo real)
 * 
 * @returns {Promise<Array>} Array de memórias ainda vivas (ou [] se erro)
 */
async function loadActiveMemories() {
  try {
    // Procura TODOS os documentos da coleção 'memories'
    const snapshot = await window.firebaseDB.collection('memories').get();
    const nowMs = Date.now(); // Hora atual para comparar

    // PROCESSA OS RESULTADOS
    const memories = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const expMs = tsToMs(data?.expiresAt); // Converte para ms
      // Verifica se passou da hora de expiração
      const isExpired = Number.isFinite(expMs) ? expMs <= nowMs : false;

      if (isExpired) {
        // Limpeza proativa: apaga memórias expiradas encontradas
        window.firebaseDB.collection('memories').doc(doc.id).delete()
          .then(() => console.log('🧹 Removida expirada (load):', doc.id))
          .catch(() => {}); // Ignora erros de apagamento
        return; // Salta esta memória (não a devolve)
      }

      // Se ainda está ativa (flag isActive = true ou não definida como false)
      if (data.isActive !== false) {
        memories.push({ id: doc.id, ...data });
      }
    });

    console.log(`✅ Carregadas ${memories.length} memórias ativas`);
    return memories;

  } catch (error) {
    console.error('❌ Erro ao carregar memórias:', error);
    return []; // Retorna array vazio em caso de erro
  }
}

// LISTENER EM TEMPO REAL
/**
 * Ouve as mudanças em tempo real nas memórias do Firebase
 * 
 * Quando algo muda (nova memória, removida, etc):
 * 1. Verifica se expirou (cliente side, seguro)
 * 2. Se adicionada e expirada, remove imediatamente
 * 3. Chama callback com tipos: 'added' ou 'removed'
 * 
 * @param {Function} callback - Função chamada quando há mudança
 *   Assinatura: callback({ type: 'added'|'removed', memory: {...} })
 * @returns {Function} unsubscribe function (para parar de ouvir)
 */
function listenToMemories(callback) {
  // Escuta documento-a-documento; onSnapshot é em tempo real
  return window.firebaseDB.collection('memories')
    .onSnapshot(snapshot => {
      // docChanges(): lista de mudanças (added, removed, modified)
      snapshot.docChanges().forEach(change => {
        const data = change.doc.data();
        const memory = { id: change.doc.id, ...data };

        if (change.type === 'added') {
          // NOVA MEMÓRIA ADICIONADA
          // Valida se ainda não expirou
          try {
            const expMs = tsToMs(data?.expiresAt);
            const nowMs = Date.now();
            if (Number.isFinite(expMs) && expMs <= nowMs) {
              // Já expirou: remove do Firebase em vez de propagar
              window.firebaseDB.collection('memories').doc(memory.id).delete()
                .then(() => console.log('🧹 Removida expirada (listener):', memory.id))
                .catch(err => console.error('Erro ao remover expirada:', err));
              return; // Não chama callback para esta memória expirada
            }
          } catch (e) {
            console.warn('Aviso ao verificar expiração:', e);
          }

          // Se está ativa, notifica aplicação
          if (data.isActive) {
            console.log('🆕 Nova memória adicionada:', memory.id);
            callback({ type: 'added', memory });
          }
        }

        if (change.type === 'removed') {
          //  MEMÓRIA REMOVIDA
          // (Pode ser expirada ou manualmente apagada)
          console.log('🗑️ Memória removida do Firebase:', memory.id);
          callback({ type: 'removed', memory });
        }
      });
    });
}

// LIMPEZA PROATIVA DE EXPIRADAS
/**
 * Remove memórias expiradas do Firebase
 * 
 * Executar periodicamente para manter a base de dados limpa
 * Usa batch delete para eficiência
 * 
 * @returns {Promise<void>}
 */
async function cleanExpiredMemories() {
  try {
    // Procura todos os documentos de memórias
    const snapshot = await window.firebaseDB.collection('memories').get();
    const nowMs = Date.now();
    
    // Batch: múltiplas operações de eliminação numa transação
    const batch = window.firebaseDB.batch();
    let removed = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const expMs = tsToMs(data?.expiresAt); // Converte para ms
      
      // Se passou da hora, marca para apagamento
      if (Number.isFinite(expMs) && expMs <= nowMs) {
        batch.delete(doc.ref);
        removed += 1;
      }
    });
    
    // Executa o batch (deleta todos de uma vez)
    if (removed > 0) {
      await batch.commit();
    }
    console.log(`🧹 Removidas ${removed} memórias expiradas`);
    
  } catch (error) {
    console.error('❌ Erro ao limpar memórias:', error);
  }
}

// LIMPEZA AUTOMÁTICA A CADA HORA
// Roda cleanExpiredMemories cada 60 minutos (3.6 milhões ms)
// Isto mantém a base de dados limpa sem depender de ações manuais
setInterval(cleanExpiredMemories, 60 * 60 * 1000);

// EXPORTA API GLOBAL
// Torna todas as funções acessíveis via window.MemoryManager
// Isto permite que main.js, form-handler.js, etc. usem estas funções
window.MemoryManager = {
  // FUNÇÕES PÚBLICAS
  create: createMemory,               // Criar nova memória + guardar em Firebase
  loadActive: loadActiveMemories,     // Carregar memórias não-expiradas
  listen: listenToMemories,           // Escutar mudanças em tempo real
  cleanExpired: cleanExpiredMemories, // Limpar memórias vencidas
  
  // FUNÇÕES DEBUG
  // Apenas para desenvolvimento/teste (use no console do browser)
  debug: {
    /**
     * Lista todas as memórias em tabela (com status de expiração)
     */
    async listAll() {
      const snap = await window.firebaseDB.collection('memories').get();
      const nowMs = Date.now();
      const rows = [];
      snap.forEach(doc => {
        const d = doc.data();
        const cMs = tsToMs(d?.createdAt);
        const eMs = tsToMs(d?.expiresAt);
        rows.push({ 
          id: doc.id, 
          createdAtMs: cMs, 
          expiresAtMs: eMs, 
          nowMs, 
          expired: Number.isFinite(eMs) ? eMs <= nowMs : null, 
          isActive: d?.isActive 
        });
      });
      console.table(rows);
      return rows;
    },
    
    /**
     * Força limpeza imediata de expiradas
     */
    async forceCleanExpired() {
      await cleanExpiredMemories();
      return 'Limpeza executada';
    },
    
    /**
     * Apaga TODAS as memórias (cuidado!!!!!)
     */
    async forceDeleteAll() {
      const snap = await window.firebaseDB.collection('memories').get();
      const batch = window.firebaseDB.batch();
      snap.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log('🧨 Todas as memórias foram apagadas!');
      return 'done';
    }
  }
};
