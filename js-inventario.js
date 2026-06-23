// js-inventario.js

// Gatilho para carregar a tabela e o gráfico ao abrir a página
// Gatilho para carregar a tabela e o gráfico ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
    // Agora ele procura pelo ID correto do novo HTML
    if (document.getElementById('id-area-inventario')) {
        renderizarInventarioAgrupado();
        renderizarGraficoPizza(); 
    }
});

// FUNÇÃO ATUALIZADA: Renderiza agrupado por setor
// FUNÇÃO ATUALIZADA: Renderiza agrupado por setor (Visual Profissional e Compacto)
// FUNÇÃO ATUALIZADA: Renderiza agrupado por setor (Visual Clean e Uniforme)
function renderizarInventarioAgrupado() {
    const container = document.getElementById('id-area-inventario');
    if (!container) return;

    const dados = getDados();
    if (dados.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px;">Nenhum risco mapeado ainda. Realize uma pesquisa e clique em "Auto-Preencher" no Dashboard.</div>`;
        return;
    }

    const dadosAgrupados = dados.reduce((acc, curr) => {
        if (!acc[curr.setor]) acc[curr.setor] = [];
        acc[curr.setor].push(curr);
        return acc;
    }, {});

    let htmlFinal = '';

    Object.entries(dadosAgrupados).forEach(([nomeSetor, riscosDoSetor]) => {
        htmlFinal += `
        <div style="margin-bottom: 30px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: #fff;">
            <div style="background-color: var(--sidebar-bg); color: white; padding: 8px 15px;">
                <div style="font-weight: bold; font-size: 0.9rem; text-transform: uppercase;">SETOR: ${nomeSetor}</div>
                <div style="font-size: 0.75rem; color: #cbd5e1;">${riscosDoSetor.length} risco(s) mapeado(s)</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--border); background-color: #f8fafc; color: #64748b; font-size: 0.8rem;">
                        <th style="padding: 10px 15px; font-weight: 600; width: 40%;">Fator de Risco (Perigo)</th>
                        <th style="padding: 10px 15px; font-weight: 600; width: 25%;">Plano de Ação</th>
                        <th style="padding: 10px 15px; font-weight: 600; width: 15%;">Responsável</th>
                        <th style="padding: 10px 15px; font-weight: 600; width: 10%; text-align: center;">Nível de Risco</th>
                        <th style="padding: 10px 15px; font-weight: 600; width: 10%; text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        riscosDoSetor.forEach(d => {
            const riscoInfo = classificarRisco(d.score);
            
            // 1. Tratamento do nome para destacar APENAS a pergunta
            const nomePerigoLimpo = d.perigo.replace(" (⚠️ SISTEMA: Revisão Humana Necessária)", "");
            let fatorFormatado = nomePerigoLimpo;
            
            // Tenta separar a [Categoria] da Pergunta
            const matchCategoria = nomePerigoLimpo.match(/\[(.*?)\]/);
            if (matchCategoria) {
                const categoria = matchCategoria[0]; // ex: [Impacto Emocional e Burnout]
                const pergunta = nomePerigoLimpo.replace(categoria, '').trim(); // ex: deu o cu ja?
                // Remonta deixando a categoria normal e a pergunta em negrito
                fatorFormatado = `${categoria} <strong>${pergunta}</strong>`;
            } else {
                // Se não tiver colchetes (criado manualmente), deixa tudo em negrito
                fatorFormatado = `<strong>${nomePerigoLimpo}</strong>`;
            }

            // 2. Alerta com a nova cor solicitada
            const alertaRobo = d.perigo.includes("SISTEMA:") ? `<span style="color: #ffdd21; font-weight: 600;">(⚠️ SISTEMA: Revisão Humana Necessária)</span>` : "";

            htmlFinal += `
                    <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;">
                        <!-- COLUNA 1: Fator (Fontes uniformes) -->
                        <td style="padding: 12px 15px;">
                            <div style="display: flex; align-items: flex-start; gap: 10px;">
                                <span style="font-size: 1.3rem; margin-top: -2px;">${d.icon || '⚠️'}</span>
                                <div>
                                    <div style="font-size: 0.8rem; color: #475569; font-weight: normal; line-height: 1.4;">
                                        ${fatorFormatado} ${alertaRobo}
                                    </div>
                                    <div style="font-size: 0.7rem; color: #64748b; margin-top: 4px;">
                                        <i class="fa-solid fa-users"></i> ${d.expostos || 1} expostos
                                    </div>
                                </div>
                            </div>
                        </td>
                        
                        <!-- COLUNA 2: Plano de Ação -->
                        <td style="padding: 12px 15px; font-size: 0.8rem; color: #475569; font-weight: normal; line-height: 1.4;">
                            ${d.acao || '<em style="color:#94a3b8">Pendente...</em>'}
                        </td>

                        <!-- COLUNA 3: Responsável -->
                        <td style="padding: 12px 15px; font-size: 0.8rem; color: #475569; font-weight: normal; line-height: 1.4;">
                            ${d.resp ? d.resp : '<em style="color:#94a3b8;">Pendente...</em>'}
                        </td>

                        <!-- COLUNA 4: Nível -->
                        <td style="padding: 12px 15px; text-align: center;">
                            <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 3px;">P:${d.p} x S:${d.s}</div>
                            <span style="background-color: ${riscoInfo.bg}; color: ${riscoInfo.color}; padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; text-transform: uppercase;">
                                ${riscoInfo.label}
                            </span>
                        </td>

                        <!-- COLUNA 5: Ações (Cores Novas) -->
                        <td style="padding: 12px 15px; text-align: center;">
                            <div style="display: flex; gap: 5px; justify-content: center;">
                                <!-- Botão Lápis (Azul Claro) -->
                                <button onclick="editarRisco(${d.id})" style="background: #c2e7ff; color: #0d5580; border: 1px solid #99c2ff; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: 0.2s;" title="Editar Plano de Ação">
                                    <i class="fa-solid fa-pencil"></i>
                                </button>
                                <!-- Botão Lixeira (Cinza) -->
                                <button onclick="deletarRisco(${d.id})" style="background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 4px; cursor: pointer; transition: 0.2s;" title="Excluir">
                                    <i class="fa-solid fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
            `;
        });

        htmlFinal += `
                </tbody>
            </table>
        </div>
        `;
    });

    container.innerHTML = htmlFinal;
}

// Lógica do Gráfico de Pizza (Tipos de Estresse)
// Lógica do Gráfico de Barras (Fatores por Setor)
let meuGraficoInventario = null;

function renderizarGraficoPizza() { // Mantive o nome da função para não quebrar a chamada no DOMContentLoaded
    const ctx = document.getElementById('graficoFatoresPorSetor');
    if (!ctx) return;

    const dados = getDados();
    if(dados.length === 0) return;

    // 1. Extrair os tipos de fatores (categorias)
    const categoriasSet = new Set();
    dados.forEach(d => {
        const match = d.perigo.match(/\[(.*?)\]/);
        categoriasSet.add(match ? match[1] : "Outros");
    });
    const tiposDeFatores = Array.from(categoriasSet);

    // 2. Extrair os nomes dos setores
    const setoresSet = new Set(dados.map(d => d.setor));
    const nomesSetores = Array.from(setoresSet);

    // 3. Montar os dados para cada categoria por setor
    const cores = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
    
    const datasets = tiposDeFatores.map((fator, index) => {
        return {
            label: fator,
            data: nomesSetores.map(setor => {
                return dados.filter(d => {
                    const match = d.perigo.match(/\[(.*?)\]/);
                    const catRisco = match ? match[1] : "Outros";
                    return d.setor === setor && catRisco === fator;
                }).length;
            }),
            backgroundColor: cores[index % cores.length],
            borderColor: '#ffffff',
            borderWidth: 1
        };
    });

    if (meuGraficoInventario) meuGraficoInventario.destroy();
    
    meuGraficoInventario = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nomesSetores,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 10, font: { size: 10 } }
                }
            },
            scales: {
                x: { stacked: false }, // Mude para true se quiser colunas empilhadas
                y: { 
                    stacked: false, // Mude para true se quiser colunas empilhadas
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}

// AS SUAS FUNÇÕES ORIGINAIS CONTINUAM DAQUI PARA BAIXO INTACTAS:
// --- FUNÇÕES DO MODAL DE RISCO MANUAL ---

function abrirModalNovoRisco() {
    const modal = document.getElementById('modalNovoRisco');
    if(modal) {
        // 1. Injeta os Setores que você criou nas Configurações
        const selectSetor = document.getElementById('setor');
        const setores = JSON.parse(localStorage.getItem('psi_gro_setores')) || [];
        selectSetor.innerHTML = '<option value="">Selecione o Setor...</option>' + 
            setores.map(s => `<option value="${s}">${s}</option>`).join('');

        // 2. Injeta os Fatores/Categorias que você criou nas Configurações
        const selectFator = document.getElementById('perigoSelect');
        const fatores = JSON.parse(localStorage.getItem('psi_gro_fatores')) || [];
        selectFator.innerHTML = '<option value="">Selecione a Categoria de Risco...</option>' + 
            fatores.map(f => `<option value="${f.icone}|${f.nome}">${f.icone} ${f.nome}</option>`).join('');

        modal.classList.add('active');
    }
}

function fecharModal() {
    const modal = document.getElementById('modalNovoRisco');
    if(modal) modal.classList.remove('active');
}

function salvarNovoRisco(event) {
    event.preventDefault();
    const perigoRaw = document.getElementById('perigoSelect').value;
    if (!perigoRaw) return alert("Selecione uma Categoria de Risco!");
    
    // Separa o ícone do nome do perigo
    const [icone, nomePerigo] = perigoRaw.split('|');

    const novo = {
        id: Date.now(),
        setor: document.getElementById('setor').value,
        
        // A MÁGICA: Formata com [Colchetes] para o Gráfico de Colunas do Dashboard entender a categoria!
        perigo: `[${nomePerigo}] Identificado via Inspeção Manual`, 
        
        icon: icone,
        p: parseInt(document.getElementById('prob').value),
        s: parseInt(document.getElementById('sev').value),
        score: parseInt(document.getElementById('prob').value) * parseInt(document.getElementById('sev').value),
        expostos: document.getElementById('expostos').value,
        aep: document.getElementById('requerAep').value,
        acao: document.getElementById('acao').value,
        status: 'Pendente'
    };

    const dados = getDados();
    dados.push(novo);
    salvarDados(dados);
    window.location.reload();
}



function carregarFatoresNoSelect() {
    const select = document.getElementById('perigoSelect');
    if (!select) return;
    const fatores = JSON.parse(localStorage.getItem(FATORES_KEY)) || [
        { nome: "Sobrecarga de Trabalho", icone: "🧠" },
        { nome: "Assédio Moral", icone: "📢" }
    ];
    select.innerHTML = '<option value="">Selecione um fator...</option>' + 
        fatores.map(f => `<option value="${f.icone}|${f.nome}">${f.icone} ${f.nome}</option>`).join('');
}



function deletarRisco(id) {
    if(confirm("Excluir registro?")) {
        salvarDados(getDados().filter(d => d.id !== id));
        window.location.reload();
    }
}

// --- FUNÇÕES DE EDIÇÃO HUMANA ---
function editarRisco(id) {
    const dados = getDados();
    const risco = dados.find(d => d.id === id);
    if(!risco) return;

    document.getElementById('editId').value = risco.id;
    // Tira a mensagem de robô apenas visualmente no modal
    document.getElementById('editPerigo').value = risco.perigo.replace(" (⚠️ SISTEMA: REVISÃO HUMANA NECESSÁRIA)", "");
    document.getElementById('editProb').value = risco.p;
    document.getElementById('editSev').value = risco.s;
    document.getElementById('editAcao').value = risco.acao;
    
    // Novos campos NR-1 (se não existir no risco, puxa o setor original como padrão)
    document.getElementById('editSetoresEnv').value = risco.setoresEnv || risco.setor;
    document.getElementById('editResp').value = risco.resp || '';

    document.getElementById('modalEditarRisco').classList.add('active');
}

function fecharModalEdicao() {
    document.getElementById('modalEditarRisco').classList.remove('active');
}

function salvarEdicaoRisco(event) {
    event.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const dados = getDados();
    const index = dados.findIndex(d => d.id === id);
    
    if(index !== -1) {
        // NÃO ATUALIZAMOS O PERIGO. Ele fica intacto.
        // Removemos a tag de robô do texto original no banco para registrar que um humano validou
        dados[index].perigo = dados[index].perigo.replace(" (⚠️ SISTEMA: REVISÃO HUMANA NECESSÁRIA)", "");
        
        dados[index].p = parseInt(document.getElementById('editProb').value);
        dados[index].s = parseInt(document.getElementById('editSev').value);
        dados[index].score = dados[index].p * dados[index].s; 
        
        dados[index].acao = document.getElementById('editAcao').value;
        dados[index].setoresEnv = document.getElementById('editSetoresEnv').value;
        dados[index].resp = document.getElementById('editResp').value;
        
        salvarDados(dados);
        window.location.reload(); 
    }
}




// --- AUTOMAÇÃO SILENCIOSA: Sincroniza sem alerts ou reload na tela ---
// --- AUTOMAÇÃO SILENCIOSA: Sincroniza sem alerts ou reload na tela ---
function sincronizarRiscosAutomaticamenteSilencioso() {
    const respostas = getRespostas();
    const perguntas = getPerguntasConfig();
    let dadosInventario = getDados();

    if (respostas.length === 0) return false;

    let alteracoesRealizadas = false;
    const setoresAvaliados = [...new Set(respostas.map(r => r.setor))];

    setoresAvaliados.forEach(setor => {
        const respostasDoSetor = respostas.filter(r => r.setor === setor);
        
        perguntas.forEach(pergunta => {
            let somaPesos = 0;
            let respostasValidas = 0; // O SEGREDO ESTÁ AQUI: Só conta quem respondeu
            
            respostasDoSetor.forEach(r => {
                const textoResposta = r.respostas[pergunta.id];
                if (textoResposta) { // Se a pessoa não respondeu essa pergunta (ex: pesquisa antiga), o sistema ignora
                    const configOpcao = pergunta.opcoes.find(o => (typeof o === 'object' ? o.texto : o) === textoResposta);
                    const peso = (configOpcao && typeof configOpcao === 'object') ? (configOpcao.peso || 1) : 1;
                    somaPesos += parseInt(peso);
                    respostasValidas++;
                }
            });

            // Se pelo menos uma pessoa respondeu a essa pergunta...
            if (respostasValidas > 0) {
                const mediaPeso = Math.round(somaPesos / respostasValidas);

                // O sistema só acusa no inventário se a média de risco for >= 3 (Moderado, Alto, Extremo)
                if (mediaPeso >= 3) {
                    const categoriaBruta = pergunta.categoria || '⚠️|Risco Geral';
                    const partes = categoriaBruta.split('|');
                    const iconeRisco = partes[0];
                    const categoriaRisco = partes.length > 1 ? partes[1] : partes[0];
                    
                    const perigoNome = `[${categoriaRisco}] ${pergunta.texto} (⚠️ SISTEMA: Revisão Humana Necessária)`;
                    
                    // Verifica se esse risco já foi mapeado pelo robô neste setor
                    const jaExisteIndex = dadosInventario.findIndex(d => d.setor === setor && d.perigo === perigoNome);
                    
                    if (jaExisteIndex === -1) {
                        // É um risco novo, vamos criar com o Ícone e Texto dinâmicos!
                        dadosInventario.push({
                            id: Date.now() + Math.floor(Math.random() * 1000), 
                            data: new Date().toLocaleDateString('pt-BR'),
                            setor: setor, 
                            perigo: perigoNome, 
                            icon: iconeRisco, 
                            p: mediaPeso, 
                            s: mediaPeso,
                            score: mediaPeso * mediaPeso, 
                            status: 'Pendente', 
                            acao: `Aprofundar diagnóstico sobre ${categoriaRisco} e definir intervenção`,
                            expostos: respostasValidas, 
                            aep: 'Sim (Sugerido pelo Sistema)'
                        });
                        alteracoesRealizadas = true;
                    } else {
                        // O risco já existe, mas vamos atualizar a nota se a média tiver piorado/melhorado
                        if (dadosInventario[jaExisteIndex].score !== (mediaPeso * mediaPeso)) {
                            dadosInventario[jaExisteIndex].p = mediaPeso;
                            dadosInventario[jaExisteIndex].s = mediaPeso;
                            dadosInventario[jaExisteIndex].score = mediaPeso * mediaPeso;
                            dadosInventario[jaExisteIndex].expostos = respostasValidas;
                            alteracoesRealizadas = true;
                        }
                    }
                }
            }
        });
    });

    if (alteracoesRealizadas) {
        salvarDados(dadosInventario); 
        return true; 
    }
    return false;
}