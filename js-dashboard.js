// js-dashboard.js
let meuGraficoRadar = null;

document.addEventListener("DOMContentLoaded", () => {
    // 1. Sincronização Invisível (Verifica se há novos dados antes de carregar o painel)
    if (typeof sincronizarRiscosAutomaticamenteSilencioso === "function") {
        sincronizarRiscosAutomaticamenteSilencioso();
    }

    // 2. Continua com o fluxo normal do dashboard
    if(document.getElementById('kpi-total')) {
        aplicarFiltroDashboard();
    }
});

function aplicarFiltroDashboard() {
    const filtroSetor = document.getElementById('filtroGlobal') ? document.getElementById('filtroGlobal').value : 'Todos';
    const filtroData = document.getElementById('filtroData') ? document.getElementById('filtroData').value : 'Todo';
    const filtroAvaliacao = document.getElementById('filtroAvaliacao') ? document.getElementById('filtroAvaliacao').value : 'Todas';

    let dadosInventario = getDados(); 
    
    if (filtroSetor !== 'Todos') dadosInventario = dadosInventario.filter(d => d.setor === filtroSetor);

    if (filtroData !== 'Todo') {
        const hoje = new Date();
        const diasLimite = filtroData === '30d' ? 30 : 90;
        dadosInventario = dadosInventario.filter(d => {
            if(!d.data) return true; 
            const partes = d.data.split('/');
            if(partes.length === 3) {
                const dataRisco = new Date(partes[2], partes[1] - 1, partes[0]);
                const diffDias = Math.ceil(Math.abs(hoje - dataRisco) / (1000 * 60 * 60 * 24));
                return diffDias <= diasLimite;
            }
            return true;
        });
    }

    // --- INÍCIO DO BLOCO DE ATUALIZAÇÃO DOS KPIS COM TENDÊNCIAS ---
    const kpiTotal = document.getElementById('kpi-total');
    if (kpiTotal) {
        // 1. Calcula os valores atuais baseados no filtro selecionado
        const qtdTotal = dadosInventario.length;
        const qtdCriticos = dadosInventario.filter(d => d.score >= 15).length;
        const qtdPendentes = dadosInventario.filter(d => d.status === 'Pendente').length;
        const qtdConcluidos = dadosInventario.filter(d => d.status === 'Concluído').length;

        // Atualiza os números grandes
        kpiTotal.innerText = qtdTotal;
        document.getElementById('kpi-criticos').innerText = qtdCriticos;
        document.getElementById('kpi-pendentes').innerText = qtdPendentes;
        
        const kpiConcluidos = document.getElementById('kpi-concluidos');
        if(kpiConcluidos) kpiConcluidos.innerText = qtdConcluidos;

        // 2. Encontra os dados anteriores para fazer a comparação (lógica cronológica)
        const todosDadosGlobais = getDados();
        const datasDisponiveis = [...new Set(todosDadosGlobais.map(d => d.data))].sort((a, b) => {
            const [da, ma, ya] = a.split('/');
            const [db, mb, yb] = b.split('/');
            return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
        });

        let dadosAnteriores = [];
        if (datasDisponiveis.length >= 2) {
            // Se tiver pelo menos duas datas, compara a atual com a penúltima
            const dataAnterior = datasDisponiveis[datasDisponiveis.length - 2];
            dadosAnteriores = todosDadosGlobais.filter(d => d.data === dataAnterior);
            if (filtroSetor !== 'Todos') dadosAnteriores = dadosAnteriores.filter(d => d.setor === filtroSetor);
        } else {
            // Falso Histórico apenas para fins de demonstração inicial caso só tenha 1 ciclo cadastrado
            dadosAnteriores = dadosInventario.slice(0, Math.floor(dadosInventario.length / 2));
        }

        const prevTotal = dadosAnteriores.length;
        const prevCriticos = dadosAnteriores.filter(d => d.score >= 15).length;
        const prevPendentes = dadosAnteriores.filter(d => d.status === 'Pendente').length;
        const prevConcluidos = dadosAnteriores.filter(d => d.status === 'Concluído').length;

        // 3. Função Mágica de Inteligência de Cores (Aumentou coisa boa = Verde. Aumentou coisa ruim = Vermelho)
        function gerarTrendHtml(atual, anterior, isGoodWhenIncreasing) {
            if (anterior === 0 && atual === 0) return ''; 
            const diff = atual - anterior;
            
            // Se o número não mudou, mostra um tracinho cinza
            if (diff === 0) return `<span style="font-size: 0.8rem; color: #94a3b8; margin-left: 10px; font-weight: normal;"><i class="fa-solid fa-minus"></i></span>`;

            let cor = '';
            let icone = '';

            if (diff > 0) { // Número AUMENTOU
                icone = '<i class="fa-solid fa-arrow-trend-up"></i>';
                cor = isGoodWhenIncreasing ? '#16a34a' : '#ef4444'; // Aumentou Concluídos = Verde. Aumentou Risco = Vermelho.
            } else {        // Número DIMINUIU
                icone = '<i class="fa-solid fa-arrow-trend-down"></i>';
                cor = isGoodWhenIncreasing ? '#ef4444' : '#16a34a'; // Caiu Concluídos = Vermelho. Caiu Risco = Verde.
            }

            return `<span style="font-size: 0.85rem; color: ${cor}; margin-left: 8px; font-weight: bold;">${icone} ${Math.abs(diff)}</span>`;
        }

        // 4. Aplica as tendências nas telas respeitando a regra
        const trendTotal = document.getElementById('trend-total');
        if(trendTotal) trendTotal.innerHTML = gerarTrendHtml(qtdTotal, prevTotal, false); // Aumento de Risco Geral = RUIM (False)

        const trendCriticos = document.getElementById('trend-criticos');
        if(trendCriticos) trendCriticos.innerHTML = gerarTrendHtml(qtdCriticos, prevCriticos, false); // Aumento de Risco Crítico = RUIM (False)

        const trendPendentes = document.getElementById('trend-pendentes');
        if(trendPendentes) trendPendentes.innerHTML = gerarTrendHtml(qtdPendentes, prevPendentes, false); // Aumento de Pendências = RUIM (False)

        const trendConcluidos = document.getElementById('trend-concluidos');
        if(trendConcluidos) trendConcluidos.innerHTML = gerarTrendHtml(qtdConcluidos, prevConcluidos, true); // Aumento de Concluídos = BOM (True)
    }
    // --- FIM DO BLOCO ---

    renderizarMatriz(dadosInventario);
    renderizarGraficoRadar(getDados()); // Radar sempre olha pro total (comportamento original)
    atualizarTabelasSecundarias(dadosInventario);
    renderizarMiniaturasRelatorios();
    renderizarGraficoNivelCategorias(dadosInventario);
    
    if (document.getElementById('lineChartEvolucao')) {
        // Pega o valor do filtro local (se ele existir), caso contrário usa o global
        const filtroGrafico = document.getElementById('filtroSetorGrafico');
        const setorParaOGrafico = filtroGrafico ? filtroGrafico.value : filtroSetor;
        
        renderizarGraficoEvolucao(setorParaOGrafico, filtroAvaliacao);
    }
}


function renderizarMatriz(dadosFiltrados) {
    const matrixContainer = document.getElementById('riskMatrix');
    if (!matrixContainer) return;
    matrixContainer.innerHTML = '<div class="y-axis-label">PROBABILIDADE</div>'; 

    for (let p = 5; p >= 1; p--) {
        matrixContainer.innerHTML += `<div class="cell axis-label">${p}</div>`;
        for (let s = 1; s <= 5; s++) {
            const score = p * s;
            const risco = classificarRisco(score);
            const count = dadosFiltrados.filter(d => d.p === p && d.s === s).length;
            const content = count > 0 ? `<span style="background:#000;color:#fff;padding:2px 6px;border-radius:50%;font-size:0.7rem">${count}</span>` : score;
            matrixContainer.innerHTML += `<div class="cell" style="background:${risco.bg}">${content}</div>`;
        }
    }
    matrixContainer.innerHTML += `<div></div>` + [1,2,3,4,5].map(n => `<div class="cell axis-label">${n}</div>`).join('') + `<div class="x-axis-label">SEVERIDADE</div>`;
}

function renderizarGraficoRadar(dados) {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;
    const setores = getSetoresConfig();
    const scores = setores.map(s => dados.filter(d => d.setor === s).reduce((acc, curr) => acc + curr.score, 0));

    if (meuGraficoRadar) meuGraficoRadar.destroy();
    meuGraficoRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: setores,
            datasets: [{ label: 'Carga de Risco Bruta', data: scores, backgroundColor: 'rgba(250, 204, 21, 0.4)', borderColor: '#eab308', borderWidth: 2 }]
        },
        options: { scales: { r: { beginAtZero: true, suggestedMax: 25 } } }
    });
}

// js-dashboard.js -> Punctual Adjustment for Executive Look & Trend Indicator

// js-dashboard.js -> Punctual Adjustment for Compact Legend

// js-dashboard.js -> Punctual Adjustment for Dynamic Chart (Bars vs Lines)

function renderizarGraficoEvolucao(filtroSetor = 'Todos', filtroAvaliacao = 'Todas') {
    const ctx = document.getElementById('lineChartEvolucao');
    if (!ctx) return;

    let avaliacoes = getAvaliacoes();
    const respostas = getRespostas();
    const perguntas = getPerguntasConfig();
    const setoresConfig = getSetoresConfig();

    if (filtroAvaliacao !== 'Todas') avaliacoes = avaliacoes.filter(av => av.id === filtroAvaliacao);

    if(avaliacoes.length < 1) {
        if (window.meuGraficoLinha instanceof Chart) window.meuGraficoLinha.destroy();
        return;
    }

    // 1. FUNÇÃO AUXILIAR: Calcula quantos riscos ficaram Críticos/Extremos (Score >= 15)
    function contarRiscosCriticos(avaliacaoId, setorName) {
        let resps = respostas.filter(r => r.avaliacaoId === avaliacaoId && r.setor === setorName);
        if (resps.length === 0) return 0;

        let qtdCriticos = 0;
        perguntas.forEach(pergunta => {
            let somaPesos = 0;
            resps.forEach(r => {
                const respostaTexto = r.respostas[pergunta.id];
                if (respostaTexto) {
                    const configOpcao = pergunta.opcoes.find(o => (typeof o === 'object' ? o.texto : o) === respostaTexto);
                    const peso = (configOpcao && typeof configOpcao === 'object') ? (configOpcao.peso || 1) : 1;
                    somaPesos += peso;
                }
            });
            const mediaPeso = Math.round(somaPesos / resps.length);
            const score = mediaPeso * mediaPeso; // Mesma lógica matemática do botão "Auto-Preencher"
            
            if (score >= 15) { // 15 a 25 = Crítico ou Extremo
                qtdCriticos++;
            }
        });
        return qtdCriticos;
    }

    const paletaCores = ['#0891b2', '#f97316', '#16a34a', '#eab308', '#7c3aed', '#dc2626', '#475569'];
    let datasets = [];
    let tipoGrafico = 'line';

    // 2. LÓGICA DINÂMICA DO GRÁFICO (COLUNA x LINHA)
    if (filtroSetor !== 'Todos') {
        // --- SELECIONOU 1 SETOR: GRÁFICO DE COLUNAS (BAR) ---
        tipoGrafico = 'bar'; 
        const dataCounts = avaliacoes.map(av => contarRiscosCriticos(av.id, filtroSetor));

        datasets.push({
            label: `Riscos Críticos/Extremos (${filtroSetor})`,
            data: dataCounts,
            backgroundColor: '#ef4444', // Vermelho indicando alerta/risco
            borderColor: '#b91c1c',
            borderWidth: 1,
            borderRadius: 4, // Borda levemente arredondada na coluna
            barPercentage: 0.4 // Deixa a coluna mais "fina" e elegante
        });
    } else {
        // --- TODOS OS SETORES: GRÁFICO DE LINHAS ---
        tipoGrafico = 'line'; 
        
        // Pega os setores que tem respostas registradas para não gerar linha vazia à toa
        const setoresComResposta = [...new Set(respostas.map(r => r.setor))];
        const setoresParaMostrar = setoresConfig.filter(s => setoresComResposta.includes(s));

        setoresParaMostrar.forEach((setor, index) => {
            const dataCounts = avaliacoes.map(av => contarRiscosCriticos(av.id, setor));
            
            // Só adiciona a linha no gráfico se o setor tiver participado
            if(dataCounts.some(count => count > 0) || respostas.some(r => r.setor === setor)) {
                datasets.push({
                    label: setor,
                    data: dataCounts,
                    borderColor: paletaCores[index % paletaCores.length],
                    backgroundColor: paletaCores[index % paletaCores.length],
                    tension: 0.3, // Curva suave
                    fill: false,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                });
            }
        });
    }

    if (window.meuGraficoLinha instanceof Chart) window.meuGraficoLinha.destroy();
    
    // 3. EIXO X (Mantém os nomes das avaliações e participantes)
    const labelsComContexto = avaliacoes.map(av => {
        let resps = respostas.filter(r => r.avaliacaoId === av.id);
        if (filtroSetor !== 'Todos') resps = resps.filter(r => r.setor === filtroSetor);
        return [`${av.titulo}`, `(${resps.length} particip.)`];
    });

    // 4. RENDERIZANDO A MÁGICA
    window.meuGraficoLinha = new Chart(ctx, { 
        type: tipoGrafico, // O tipo do gráfico muda aqui automaticamente!
        data: { 
            labels: labelsComContexto, 
            datasets: datasets 
        }, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            interaction: { mode: 'index', intersect: false },
            plugins: { 
                legend: {
                    position: 'top',
                    labels: { 
                        usePointStyle: tipoGrafico === 'line', // Bolinha pra linha, quadradinho pra coluna
                        boxWidth: 12,
                        font: { size: 12, weight: '500' }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: ${context.parsed.y} risco(s)`; // Trocou % por "risco(s)"
                        }
                    }
                }
            }, 
            scales: { 
                y: { 
                    beginAtZero: true,
                    ticks: { stepSize: 1 }, // Força a pular de 1 em 1 (não mostra 0.5 riscos)
                    title: { display: true, text: 'Qtd. Riscos Críticos/Extremos', font: {weight: 'bold'} },
                    grid: { borderDash: [5, 5] }
                },
                x: {
                    grid: { display: false }
                }
            } 
        } 
    });
}



// js-dashboard.js -> Punctual Adjustment for KPI Trend Indicators

function renderizarKpis(filtroSetor = 'Todos', filtroAvaliacao = 'Todas') {
    const container = document.getElementById('kpi-container');
    if (!container) return;

    let inventarioDados = JSON.parse(localStorage.getItem('inventarioDados')) || [];
    const allAvaliacoes = getAvaliacoes();
    const allRespostas = getRespostas();

    // 1. IDENTIFICAR AVALIAÇÃO ATUAL E ANTERIOR PARA COMPARAÇÃO
    let currentAvaliacaoId, prevAvaliacaoId;

    if (filtroAvaliacao === 'Todas') {
        // Se todas, pega as duas mais recentes
        if (allAvaliacoes.length >= 2) {
            currentAvaliacaoId = allAvaliacoes[allAvaliacoes.length - 1].id;
            prevAvaliacaoId = allAvaliacoes[allAvaliacoes.length - 2].id;
        } else if (allAvaliacoes.length === 1) {
            currentAvaliacaoId = allAvaliacoes[0].id;
            prevAvaliacaoId = null;
        }
    } else {
        // Se uma específica, encontra a anterior na lista cronológica
        currentAvaliacaoId = filtroAvaliacao;
        const index = allAvaliacoes.findIndex(av => av.id === filtroAvaliacao);
        if (index > 0) {
            prevAvaliacaoId = allAvaliacoes[index - 1].id;
        } else {
            prevAvaliacaoId = null;
        }
    }

    // Função auxiliar para calcular totais de um conjunto de dados
    const calcularTotais = (dados) => {
        let tot = dados.length;
        let totCriticos = 0;
        let totAcoesPendentes = 0;
        
        dados.forEach(d => {
            const riscoInfo = classificarRisco(d.score);
            if (riscoInfo.label === 'Crítico' || riscoInfo.label === 'Extremo') totCriticos++;
            // Lógica para ação pendente: não tem ação definida E não tem responsável
            if (!d.acao && (!d.resp || d.resp.trim() === '')) totAcoesPendentes++;
        });
        
        return { tot, totCriticos, totAcoesPendentes };
    };

    // 2. FILTRAR DADOS DA AVALIAÇÃO ATUAL
    let dadosAtuais = [...inventarioDados];
    if (filtroSetor !== 'Todos') dadosAtuais = dadosAtuais.filter(d => d.setor === filtroSetor);
    if (filtroAvaliacao !== 'Todas') {
        dadosAtuais = dadosAtuais.filter(d => d.perigo.includes(`SISTEMA: Avaliação [${currentAvaliacaoId}]`));
    } else {
        // Se todas, mostra apenas o que foi gerado na última rodada para ser consistente
        if(currentAvaliacaoId) dadosAtuais = dadosAtuais.filter(d => d.perigo.includes(`SISTEMA: Avaliação [${currentAvaliacaoId}]`));
    }
    const totaisAtuais = calcularTotais(dadosAtuais);

    // 3. FILTRAR DADOS DA AVALIAÇÃO ANTERIOR (SE EXISTIR)
    let totaisAnteriores = null;
    if (prevAvaliacaoId) {
        let dadosAnteriores = [...inventarioDados];
        if (filtroSetor !== 'Todos') dadosAnteriores = dadosAnteriores.filter(d => d.setor === filtroSetor);
        dadosAnteriores = dadosAnteriores.filter(d => d.perigo.includes(`SISTEMA: Avaliação [${prevAvaliacaoId}]`));
        totaisAnteriores = calcularTotais(dadosAnteriores);
    }

    // 4. LÓGICA DE GERAÇÃO DO HTML DE TENDÊNCIA
    const gerarHtmlTendencia = (atual, anterior, inverterLogica = false) => {
        if (anterior === null || anterior === undefined || anterior === 0) {
            return `<div style="font-size: 0.7rem; color: #64748b; margin-top: 3px;">(─ Estável)</div>`;
        }
        
        const diff = atual - anterior;
        const varPercent = Math.round((diff / anterior) * 100);
        let trendColor = '#64748b'; // Cinza padrão (estável)
        let trendIcon = '─';
        let trendLabel = 'Estável';
        
        if (diff > 0) {
            // Aumentou: Geralmente é RUIM para riscos e planos pendentes
            trendColor = '#f97316'; // Laranja (Piorou)
            trendIcon = '↑';
            trendLabel = 'Piorou';
        } else if (diff < 0) {
            // Diminuiu: Geralmente é BOM para riscos e planos pendentes
            trendColor = '#16a34a'; // Verde (Melhorou)
            trendIcon = '↓';
            trendLabel = 'Melhorou';
        }

        if (diff === 0) {
             return `<div style="font-size: 0.7rem; color: #64748b; margin-top: 3px;">(─ Estável)</div>`;
        }

        return `
            <div style="font-size: 0.7rem; color: ${trendColor}; margin-top: 3px; font-weight: 600;">
                (${trendIcon} ${Math.abs(varPercent)}% ${trendLabel})
            </div>
        `;
    };

    // Estatísticas adicionais gerais (não comparativas)
    const totParticipantes = allRespostas.filter(r => filtroSetor === 'Todos' || r.setor === filtroSetor).length;
    const totSetores = [...new Set(inventarioDados.map(d => d.setor))].length;

    // 5. RENDERIZAR O HTML FINAL DOS KPIS COM TENDÊNCIA
    container.innerHTML = `
        <div class="kpi-card col-xl-2 col-md-4">
            <div class="kpi-title">Riscos Mapeados (Total)</div>
            <div class="kpi-value text-primary">${totaisAtuais.tot}</div>
            ${gerarHtmlTendencia(totaisAtuais.tot, totaisAnteriores?.tot)}
        </div>
        
        <div class="kpi-card col-xl-2 col-md-4">
            <div class="kpi-title">Riscos Críticos / Extremos</div>
            <div class="kpi-value" style="color: #ef4444;">${totaisAtuais.totCriticos}</div>
            ${gerarHtmlTendencia(totaisAtuais.totCriticos, totaisAnteriores?.totCriticos)}
        </div>
        
        <div class="kpi-card col-xl-2 col-md-4">
            <div class="kpi-title">Planos de Ação Pendentes</div>
            <div class="kpi-value" style="color: #f59e0b;">${totaisAtuais.totAcoesPendentes}</div>
            ${gerarHtmlTendencia(totaisAtuais.totAcoesPendentes, totaisAnteriores?.totAcoesPendentes)}
        </div>
        
        <div class="kpi-card col-xl-2 col-md-4">
            <div class="kpi-title">Total de Participantes (Ciclos)</div>
            <div class="kpi-value text-success">${totParticipantes}</div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 3px;">(Estatística Geral)</div>
        </div>
        
        <div class="kpi-card col-xl-2 col-md-4">
            <div class="kpi-title">Setores com Risco Mapeado</div>
            <div class="kpi-value text-info">${totSetores}</div>
            <div style="font-size: 0.7rem; color: #64748b; margin-top: 3px;">(Estatística Geral)</div>
        </div>
    `;
}



function atualizarTabelasSecundarias(dados) {
    const tbInventario = document.getElementById('tb-inventario');
    if (tbInventario) {
        tbInventario.innerHTML = dados.map(d => {
            const risco = classificarRisco(d.score);
            return `<tr>
                <td>${d.setor}<br><small><i class="fa-solid fa-users"></i> ${d.expostos || 1} expostos</small></td>
                <td>${d.icon || '⚠️'} ${d.perigo}<br><small>AEP: ${d.aep || 'Não'}</small></td>
                <td>P:${d.p} x S:${d.s}</td>
                <td><span class="badge" style="background:${risco.bg}; color:${risco.color};">${d.score} - ${risco.label}</span></td>
                <td><button onclick="deletarRisco(${d.id})" class="btn-delete"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
        }).join('');
    }
}

function sincronizarRiscosAutomaticamente() {
    const respostas = getRespostas();
    const perguntas = getPerguntasConfig();
    let dadosInventario = getDados();

    if (respostas.length === 0) return alert("Nenhuma pesquisa foi respondida ainda para gerar dados.");

    let novosRiscos = 0;
    const setoresAvaliados = [...new Set(respostas.map(r => r.setor))];

    setoresAvaliados.forEach(setor => {
        const respostasDoSetor = respostas.filter(r => r.setor === setor);
        perguntas.forEach(pergunta => {
            let somaPesos = 0;
            respostasDoSetor.forEach(r => {
                const textoResposta = r.respostas[pergunta.id];
                const configOpcao = pergunta.opcoes.find(o => (typeof o === 'object' ? o.texto : o) === textoResposta);
                const peso = (configOpcao && typeof configOpcao === 'object') ? (configOpcao.peso || 1) : 1;
                somaPesos += peso;
            });
            const mediaPeso = Math.round(somaPesos / respostasDoSetor.length);

            if (mediaPeso >= 3) {
                // AQUI A MÁGICA DOS ÍCONES: Separa a string "Ícone|Categoria"
                const categoriaBruta = pergunta.categoria || '🧠|Risco Psicossocial';
                const partes = categoriaBruta.split('|');
                const iconeRisco = partes[0];
                const categoriaRisco = partes.length > 1 ? partes[1] : partes[0];
                
                // Monta o nome do perigo: [Categoria] Pergunta
                const perigoNome = `[${categoriaRisco}] ${pergunta.texto} (⚠️ SISTEMA: Revisão Humana Necessária)`;
                
                const jaExiste = dadosInventario.find(d => d.setor === setor && d.perigo === perigoNome);
                
                if (!jaExiste) {
                    dadosInventario.push({
                        id: Date.now() + Math.floor(Math.random() * 1000), 
                        data: new Date().toLocaleDateString('pt-BR'),
                        setor: setor, 
                        perigo: perigoNome, 
                        icon: iconeRisco, // <-- AQUI! O ícone escolhido lá na configuração vai direto pra tabela!
                        p: mediaPeso, 
                        s: mediaPeso,
                        score: mediaPeso * mediaPeso, 
                        status: 'Pendente', 
                        acao: `Aprofundar diagnóstico sobre ${categoriaRisco} e definir intervenção`,
                        expostos: respostasDoSetor.length, 
                        aep: 'Sim (Sugerido pelo Sistema)'
                    });
                    novosRiscos++;
                }
            }
        });
    });

    if (novosRiscos > 0) {
        salvarDados(dadosInventario);
        alert(`Sucesso! ${novosRiscos} riscos foram identificados e injetados na Matriz.`);
        window.location.reload();
    } else {
        alert("As pesquisas indicam que os riscos estão controlados (pesos baixos). Nada foi adicionado à matriz.");
    }
}






// --- FUNÇÕES DE EDIÇÃO HUMANA ---
function editarRisco(id) {
    const dados = getDados();
    const risco = dados.find(d => d.id === id);
    if(!risco) return;

    // Preenche o modal com os dados atuais do risco
    document.getElementById('editId').value = risco.id;
    // Tira a mensagem de robô para o humano não precisar apagar
    document.getElementById('editPerigo').value = risco.perigo.replace(" (⚠️ SISTEMA: REVISÃO HUMANA NECESSÁRIA)", "");
    document.getElementById('editProb').value = risco.p;
    document.getElementById('editSev').value = risco.s;
    document.getElementById('editAcao').value = risco.acao;

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
        // Atualiza os dados com a análise humana
        dados[index].perigo = document.getElementById('editPerigo').value;
        dados[index].p = parseInt(document.getElementById('editProb').value);
        dados[index].s = parseInt(document.getElementById('editSev').value);
        dados[index].score = dados[index].p * dados[index].s; // Recalcula a nota independente
        dados[index].acao = document.getElementById('editAcao').value;
        
        salvarDados(dados);
        window.location.reload(); // Atualiza a tela para mostrar a nova cor e nota
    }
}





// --- MINIATURAS DE RELATÓRIOS NO DASHBOARD ---

// 1. Função para desenhar as miniaturas
function renderizarMiniaturasRelatorios() {
    const container = document.getElementById('container-mini-relatorios');
    if (!container) return;

    const avaliacoes = getAvaliacoes(); // Pega do bd
    if (avaliacoes.length === 0) {
        container.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8;">Nenhum relatório gerado ainda.</span>';
        return;
    }

    // Pega as últimas 4 avaliações (invertendo a ordem para a mais recente ficar primeiro)
    const ultimasAvaliacoes = [...avaliacoes].reverse().slice(0, 4);

    container.innerHTML = ultimasAvaliacoes.map(av => `
        <div onclick="verRespostasDashboard('${av.id}')" style="min-width: 85px; max-width: 85px; height: 110px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; background: #f8fafc; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; transition: 0.2s; box-shadow: 2px 2px 5px rgba(0,0,0,0.05);" onmouseover="this.style.borderColor='#3b82f6'; this.style.transform='translateY(-3px)';" onmouseout="this.style.borderColor='#cbd5e1'; this.style.transform='translateY(0)';">
            <i class="fa-solid fa-file-lines" style="font-size: 1.8rem; color: #3b82f6; margin-bottom: 8px;"></i>
            <span style="font-size: 0.65rem; font-weight: bold; color: #334155; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.2;">${av.titulo}</span>
            <span style="font-size: 0.55rem; color: #94a3b8; margin-top: auto;">${av.data}</span>
        </div>
    `).join('');
}

// 2. Função para abrir o modal com os dados (Importada e adaptada)
function verRespostasDashboard(id) {
    const respostas = getRespostas().filter(r => r.avaliacaoId === id);
    const container = document.getElementById('conteudoResultados');
    
    if(respostas.length === 0) {
        container.innerHTML = "<p>Nenhuma resposta coletada ainda.</p>";
    } else {
        const perguntas = getPerguntasConfig();
        let html = '<p style="margin-bottom: 15px;">Total de respostas: <strong>' + respostas.length + '</strong></p>';

        perguntas.forEach(p => {
            html += '<div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; border: 1px solid var(--border);">';
            html += '<strong style="font-size: 0.9rem; color: #1e293b;">' + p.texto + '</strong><ul style="margin-top: 10px; list-style: none;">';
            
            p.opcoes.forEach(opt => {
                const textoOpcao = typeof opt === 'object' ? opt.texto : opt;
                const count = respostas.filter(r => r.respostas[p.id] === textoOpcao).length;
                const porcentagem = Math.round((count / respostas.length) * 100) || 0;
                
                html += '<li style="margin-bottom: 8px;">' +
                            '<div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #475569;">' +
                                '<span>' + textoOpcao + '</span> <span style="font-weight: 500;">' + count + ' votos (' + porcentagem + '%)</span>' +
                            '</div>' +
                            '<div style="width: 100%; background: #e2e8f0; border-radius: 4px; height: 8px; margin-top: 4px;">' +
                                '<div style="width: ' + porcentagem + '%; background: var(--btn-yellow); height: 100%; border-radius: 4px;"></div>' +
                            '</div>' +
                         '</li>';
            });
            html += '</ul></div>';
        });
        container.innerHTML = html;
    }
    
    const modal = document.getElementById('modalResultados');
    if (modal) modal.classList.add('active');
}




// js-dashboard.js -> NOVO: Função para renderizar o Gráfico Vertical de Nível por Categoria
function renderizarGraficoNivelCategorias(inventarioDados) {
    const ctx = document.getElementById('barChartCategorias');
    if (!ctx) return;

    // 1. AGRUPAR DADOS E CALCULAR MÉDIAS POR CATEGORIA
    const categoriasMap = {};

    inventarioDados.forEach(d => {
        // Extrai a categoria do nome do perigo (ex: [Organização] -> Organização)
        const match = d.perigo.match(/\[(.*?)\]/);
        const nomeCategoria = match ? match[1] : 'Outros';
        const icone = d.icon || '⚠️';

        if (!categoriasMap[nomeCategoria]) {
            categoriasMap[nomeCategoria] = { 
                nome: nomeCategoria, 
                icone: icone, 
                somaScorePercentual: 0, // Vamos converter P*S em % (1=4%, 25=100%)
                qtd: 0 
            };
        }

        // Converte score P*S (Max 25) para percentual (Max 100%) para mostrar o "Nível"
        const scorePercentual = (d.score / 25) * 100;
        
        categoriasMap[nomeCategoria].somaScorePercentual += scorePercentual;
        categoriasMap[nomeCategoria].qtd++;
    });

    // 2. FORMATAR DADOS PARA O CHART.JS
    const categoriasSorted = Object.values(categoriasMap)
        .filter(c => c.qtd > 0) // Só mostra se houver risco mapeado
        .sort((a, b) => (a.somaScorePercentual / a.qtd) - (b.somaScorePercentual / b.qtd)); // Ordena do menor pro maior risco

    const labels = categoriasSorted.map(c => [`${c.icone}`, `${c.nome}`]); // Label em duas linhas: emoji e texto
    const dataPercentuais = categoriasSorted.map(c => Math.round(c.somaScorePercentual / c.qtd));

    // Paleta de cores profissionais (Azul Petróleo e Laranja)
    const paletaCores = ['#0891b2', '#0e7490', '#f97316', '#ea580c', '#eab308'];

    // 3. RENDERIZAR GRÁFICO (COLUNAS VERTICAIS)
    if (window.meuGraficoNivel) window.meuGraficoNivel.destroy(); // Limpa se já existir

    window.meuGraficoNivel = new Chart(ctx, {
        type: 'bar', // Colunas verticais
        data: {
            labels: labels,
            datasets: [{
                label: 'Nível Médio de Risco',
                data: dataPercentuais,
                backgroundColor: categoriasSorted.map((_, i) => paletaCores[i % paletaCores.length]), // Cores alternadas
                borderWidth: 0,
                borderRadius: 4, // Borda levemente arredondada no topo da coluna
                barPercentage: 0.5 // Colunas mais finas e elegantes
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, // Esconde a legenda (já está no eixo X)
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Nível: ${context.parsed.y}%`; // Mostra % no tooltip
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100, // Força o eixo até 100%
                    ticks: { callback: (value) => value + '%' }, // Adiciona % nos números do eixo Y
                    grid: { borderDash: [5, 5] } // Linhas tracejadas no fundo
                },
                x: {
                    grid: { display: false }, // Remove as linhas verticais do fundo
                    ticks: {
                        font: { size: 11 }, // Fonte menor para caber os textos
                        lineHeight: 1.2
                    }
                }
            }
        }
    });
}