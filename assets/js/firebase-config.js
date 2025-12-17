// ========================================
// MNEMOSYNE | Configuração da Firebase
// Autoras: Carolina Machado, Mariana Marinha, Maria Sá, Rita Mendes
// UC: Projeto 4
// Curso: Design de Comunicação, 3º Ano
// Faculdade de Belas Artes da Universidade do Porto
// 2025/2026
// ========================================
// Inicializa Firebase Firestore e exporta a referência global
// Este ficheiro é carregado no início (antes de outros scripts)
// ========================================

// O PROJETO NA FIREBASE DO GOOGLE
// Credenciais copy-paste que identificam o projeto "Mnemosyne-2025" no Google Cloud
// Estas credenciais são públicas (Front-end) - segurança vem do Firebase Rules
const firebaseConfig = {
  apiKey: "AIzaSyAgT3ok_f6UQTucZBUGxBj4rKH0fb7_rkA",            // Chave pública para acesso à API
  authDomain: "mnemosyne-2025.firebaseapp.com",                 // Domínio para autenticação (email/senha/etc)
  projectId: "mnemosyne-2025",                                  // ID único do projeto
  storageBucket: "mnemosyne-2025.appspot.com",                  // Bucket para guardar ficheiros (não está a ser usado atualmente)
  messagingSenderId: "681275159828",                            // ID para notificações push (não usado)
  appId: "1:681275159828:web:1c8487b4cc58825d203e01",           // ID da aplicação web
  measurementId: "G-YMZ8CS0SQE"                                 // ID para Google Analytics (não usado)
};

// INICIALIZA A FIREBASE
// Carrega a configuração e conecta à plataforma Firebase
// O script deve estar carregado via <script> tag CDN no HTML
firebase.initializeApp(firebaseConfig);

// CRIA REFERÊNCIA À BASE DE DADOS
// Firestore é o banco de dados de documentos (NoSQL)
// Onde guardamos as memórias do utilizador
const db = firebase.firestore();

// EXPORTA A BASE DE DADOS GLOBALMENTE
// Torna a base de dados acessível para outros scripts via window.firebaseDB
// memory-manager.js e main.js usam isto para aceder ao Firebase
window.firebaseDB = db;

// LOG DE CONFIRMAÇÃO
console.log('✅ Firebase configurado com sucesso!');