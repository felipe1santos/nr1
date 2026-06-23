// js-cerebro.js
const SETORES_KEY = 'psi_gro_setores';
const PERGUNTAS_KEY = 'psi_gro_perguntas';
const STORAGE_KEY = 'psi_gro_dados'; 
const AVALIACOES_KEY = 'psi_gro_avaliacoes'; 
const RESPOSTAS_KEY = 'psi_gro_respostas'; 
const FATORES_KEY = 'psi_gro_fatores'; 

// --- FUNÇÕES DE BANCO DE DADOS (LOCALSTORAGE) ---
function getSetoresConfig() { return JSON.parse(localStorage.getItem(SETORES_KEY)) || ["Produção", "Vendas", "Administrativo", "Logística", "Outros"]; }
function salvarSetoresConfig(s) { localStorage.setItem(SETORES_KEY, JSON.stringify(s)); }

function getPerguntasConfig() {
    const padrao = [
        { id: 'p1', texto: 'O volume de trabalho é compatível com seu tempo?', categoria: '⏱️|Organização e Ritmo', opcoes: [{texto: 'Sempre', peso: 1}, {texto: 'As vezes', peso: 2}, {texto: 'Raramente', peso: 4}, {texto: 'Nunca', peso: 5}] },
        { id: 'p2', texto: 'Presenciou situações de desrespeito ou assédio?', categoria: '📢|Violência e Assédio', opcoes: [{texto: 'Nunca', peso: 1}, {texto: 'Raramente', peso: 3}, {texto: 'Frequentemente', peso: 5}] },
        { id: 'p3', texto: 'Tem autonomia para organizar suas tarefas?', categoria: '🏢|Gestão e Autonomia', opcoes: [{texto: 'Total', peso: 1}, {texto: 'Parcial', peso: 3}, {texto: 'Nenhuma', peso: 5}] }
    ];
    return JSON.parse(localStorage.getItem(PERGUNTAS_KEY)) || padrao;
}



function salvarPerguntasConfig(p) { localStorage.setItem(PERGUNTAS_KEY, JSON.stringify(p)); }

function getDados() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
function salvarDados(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function getAvaliacoes() { return JSON.parse(localStorage.getItem(AVALIACOES_KEY)) || []; }
function salvarAvaliacoes(d) { localStorage.setItem(AVALIACOES_KEY, JSON.stringify(d)); }

function getRespostas() { return JSON.parse(localStorage.getItem(RESPOSTAS_KEY)) || []; }
function salvarRespostas(d) { localStorage.setItem(RESPOSTAS_KEY, JSON.stringify(d)); }

// --- LÓGICA DE NEGÓCIO ---
function classificarRisco(score) {
    if (score <= 4) return { label: 'Baixo', bg: 'var(--risk-low)', color: '#064e3b' };
    if (score <= 9) return { label: 'Moderado', bg: 'var(--risk-mod)', color: '#713f12' };
    if (score <= 14) return { label: 'Alto', bg: 'var(--risk-high)', color: '#9a3412' }; 
    if (score <= 19) return { label: 'Crítico', bg: 'var(--risk-crit)', color: '#7f1d1d' }; 
    return { label: 'Extremo', bg: 'var(--risk-ext)', color: '#fff' };
}

// --- CONTROLE DE INTERFACE GLOBAL ---
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }
});










// --- PROTEÇÃO DE ACESSO ---
function verificarAcesso() {
    // Se NÃO estiver na página de login (index.php) e não tiver sessão ativa, chuta pra fora!
    if (!window.location.href.includes('index.php') && !window.location.href.includes('avaliacao.html')) {
        const sessao = localStorage.getItem('psi_gro_sessao');
        if (!sessao || sessao !== 'ativo') {
            window.location.href = 'index.php'; // Volta pro login
        }
    }
}

function logout() {
    localStorage.removeItem('psi_gro_sessao');
    localStorage.removeItem('psi_gro_email_logado');
    window.location.href = 'index.php'; // Volta pro login
}

verificarAcesso();