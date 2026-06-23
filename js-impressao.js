// js-impressao.js - MOTOR DE IMPRESSÃO PGR/AEP PROFISSIONAL (NR-01)

function abrirModalImpressao() {
    const modal = document.getElementById('modalImprimirPGR');
    if (!modal) return;
    const container = document.getElementById('listaAvaliacoesImprimir');
    const avaliacoes = getAvaliacoes();
    
    if(avaliacoes.length === 0) {
        container.innerHTML = "<p style='font-size: 0.9rem; color: red;'>Nenhuma pesquisa disponível no sistema.</p>";
    } else {
        container.innerHTML = avaliacoes.map(av => `
            <label style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #e2e8f0; cursor: pointer; font-size: 0.9rem;">
                <input type="checkbox" class="chk-imprimir" value="${av.id}" checked> 
                ${av.titulo} <small style="color: var(--text-light);">(${av.data})</small>
            </label>
        `).join('');
    }
    modal.classList.add('active');
}

function executarImpressaoPGR() {
    // Esconde o modal IMEDIATAMENTE para garantir que nenhum código vaze na impressão
    const modal = document.getElementById('modalImprimirPGR');
    if (modal) modal.classList.remove('active');
    
    const emp = JSON.parse(localStorage.getItem('psi_gro_empresa')) || { nome: 'Empresa Não Cadastrada', cnpj: '---', func: '---', logo: '' };
    const checkboxes = document.querySelectorAll('.chk-imprimir:checked');
    const relatoriosSelecionados = Array.from(checkboxes).length;
    const dados = getDados();
    
    // --- LÓGICA DE AGRUPAMENTO POR SETOR ---
    // Transforma a lista plana de riscos em um objeto agrupado: {'Vendas': [risco1, risco2], 'Produção': [risco3]}
    const dadosAgrupadosPorSetor = dados.reduce((acc, curr) => {
        if (!acc[curr.setor]) {
            acc[curr.setor] = [];
        }
        acc[curr.setor].push(curr);
        return acc;
    }, {});

    // Estatísticas Gerais
    const totalRiscos = dados.length;
    const riscosCriticos = dados.filter(d => d.score >= 15).length;
    const acoesConcluidas = dados.filter(d => d.status === 'Concluído').length;
    const acoesPendentes = dados.filter(d => d.status !== 'Concluído').length;

    // --- CAPTURA DOS GRÁFICOS DO DASHBOARD (Canvas para Imagem Base64) ---
    // Nota: Devem ser gerados a partir da aba "Dashboard" para aparecerem.
    let radarImg = '';
    let lineImg = '';
    const radarCanvas = document.getElementById('radarChart');
    const lineCanvas = document.getElementById('lineChartEvolucao');
    
    // Aumentando a qualidade da captura
    if (radarCanvas) radarImg = radarCanvas.toDataURL('image/png', 1.0);
    if (lineCanvas) lineImg = lineCanvas.toDataURL('image/png', 1.0);

    const hoje = new Date().toLocaleDateString('pt-BR');

    // Limpeza preventiva de impressões antigas
    const oldPrint = document.getElementById('notaImpressao');
    if (oldPrint) oldPrint.remove();

    const notaImpressao = document.createElement('div');
    notaImpressao.id = 'notaImpressao';
    
    // --- ESTRUTURA E CSS DE IMPRESSÃO (ESTILO TÉCNICO LARANJA) ---
    let htmlPGR = `
        <style>
            @media print { 
                /* CORREÇÃO DO BUG: Esconde absolutamente tudo do sistema original e tira as margens */
                body > * { display: none !important; } 
                body, html { background-color: #fff !important; margin: 0; padding: 0; }
                #notaImpressao { display: block !important; position: absolute; top: 0; left: 0; width: 100%; }
                @page { size: A4 portrait; margin: 10mm; }
                
                /* Força os navegadores a imprimirem as cores de fundo */
                * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
            
            #notaImpressao { font-family: 'Arial', sans-serif; font-size: 11px; color: #000; width: 100%; box-sizing: border-box; }
            
            /* CABEÇALHO PADRÃO ENGENHARIA - DESIGN MODERNO */
            .report-header { display: flex; border: 2px solid #000; border-bottom: none; width: 100%; }
            .header-logo { width: 150px; display: flex; align-items: center; justify-content: center; border-right: 2px solid #000; padding: 10px; }
            .header-logo img { max-width: 130px; max-height: 65px; object-fit: contain; }
            .header-title { flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: center; padding: 10px; }
            .header-title h1 { font-size: 18px; margin: 0; padding-bottom: 5px; color: #000; text-transform: uppercase; font-weight: 900; }
            .header-title h2 { font-size: 11px; margin: 0; font-weight: bold; color: #334155; }
            .header-title h3 { font-size: 9px; margin-top: 4px; font-weight: normal; color: #64748b; }
            .header-info { width: 160px; border-left: 2px solid #000; display: flex; flex-direction: column; justify-content: center; padding: 10px; font-size: 10px; font-weight: bold; background: #f8fafc; }
            
            /* TÍTULOS DE SEÇÃO - LARANJA TÉCNICO */
            .section-title { background-color: #f97316; color: #fff; padding: 6px 10px; font-weight: bold; font-size: 12px; border: 2px solid #000; margin-top: 15px; text-transform: uppercase; }
            
            /* TABELAS DE DADOS (GRIDS) */
            .data-grid { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
            .data-grid td { border: 1px solid #000; padding: 6px 8px; font-size: 11px; }
            .data-grid .label { font-weight: bold; background: #f1f5f9; width: 15%; color: #000; }
            
            /* TABELAS DE INVENTÁRIO E AÇÃO - CABEÇALHO LARANJA */
            .report-table { width: 100%; border-collapse: collapse; border: 2px solid #000; border-top: none; }
            .report-table th { background-color: #f97316 !important; border: 1px solid #000; padding: 6px 8px; text-align: center; vertical-align: middle; font-weight: bold; font-size: 10px; color: #fff !important; text-transform: uppercase; }
            .report-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: middle; font-size: 11px; }
            
            /* LINHA DE AGRUPAMENTO DE SETOR */
            .sector-group-header { background-color: #f1f5f9 !important; font-weight: bold !important; color: #000 !important; text-transform: uppercase; }
            
            /* BLOCO DE GRÁFICOS - AUMENTADOS */
            .chart-container { display: flex; flex-direction: column; gap: 15px; border: 2px solid #000; border-top: none; width: 100%; padding: 15px; background: #fff; box-sizing: border-box; }
            .chart-box { width: 100%; text-align: center; border: 1px solid #000; padding: 10px; }
            .chart-box img { max-width: 100%; height: auto; max-height: 400px; /* Gráfico Gigante */ object-fit: contain; }
            .chart-title { font-weight: bold; margin-bottom: 10px; font-size: 10px; background: #f97316; padding: 4px; border: 1px solid #000; text-transform: uppercase; color: #fff; }
            
            /* ASSINATURAS */
            .signature-box { display: flex; justify-content: space-around; margin-top: 30px; padding: 20px 0; border: 2px solid #000; background: #f8fafc; page-break-inside: avoid; }
            .signature-line { width: 35%; text-align: center; font-size: 11px; }
            .signature-line hr { border: none; border-top: 1px solid #000; margin-bottom: 5px; }
        </style>

        <div class="report-header">
            <div class="header-logo">
                ${emp.logo ? `<img src="${emp.logo}" alt="Logo">` : '<strong style="color: #cbd5e1;">LOGOMARCA</strong>'}
            </div>
            <div class="header-title">
                <h1>PROGRAMA DE GERENCIAMENTO DE RISCOS (PGR)</h1>
                <h2>AVALIAÇÃO ERGONÔMICA PRELIMINAR (AEP) - RISCOS PSICOSSOCIAIS</h2>
                <h3 style="font-size: 9px; margin-top: 4px; font-weight: normal; color: #64748b;">DOCUMENTO BASE CONFORME EXIGÊNCIAS MTE (NR-01 E NR-17)</h3>
            </div>
            <div class="header-info">
                <div>DATA DOC: ${hoje}</div>
                <div style="margin-top: 5px;">BASE (CICLOS): ${relatoriosSelecionados}</div>
                <div style="margin-top: 5px;">CÓDIGO: PGR-PSI/2026</div>
            </div>
        </div>

        <div class="section-title">1. DADOS DE IDENTIFICAÇÃO E ESTATÍSTICA GERAL</div>
        <table class="data-grid">
            <tr>
                <td class="label">RAZÃO SOCIAL:</td>
                <td style="width: 35%; text-transform: uppercase;">${emp.nome}</td>
                <td class="label">CNPJ:</td>
                <td style="width: 35%;">${emp.cnpj}</td>
            </tr>
            <tr>
                <td class="label">COLABORADORES:</td>
                <td>${emp.func} Trabalhadores Ativos</td>
                <td class="label">MAPEAMENTO GLOBAL:</td>
                <td>${totalRiscos} Riscos Mapeados (${riscosCriticos} Críticos/Extremos)</td>
            </tr>
            <tr>
                <td class="label">AÇÕES PREVENTIVAS:</td>
                <td colspan="3">${acoesConcluidas} Concluídas e Ativas | ${acoesPendentes} Pendentes ou em Execução</td>
            </tr>
        </table>

        <div class="section-title">2. EVIDÊNCIAS GRÁFICAS DO CLIMA PSICOSSOCIAL (DASHBOARD)</div>
        <div class="chart-container">
            ${radarImg ? `
            <div class="chart-box">
                <div class="chart-title">Distribuição de Carga de Risco por Setor (Análise Geral)</div>
                <img src="${radarImg}">
            </div>` : ''}
            
            ${lineImg ? `
            <div class="chart-box">
                <div class="chart-title">Evolução Histórica dos Indicadores Psicossociais</div>
                <img src="${lineImg}">
            </div>` : ''}
            
            ${(!radarImg && !lineImg) ? `
            <div style="padding: 20px; width: 100%; text-align: center; color: #ef4444; font-weight: bold;">
                [ AVISO EM VERMELHO ]: Gráficos não carregados. Para imprimir o documento com as imagens estatísticas psicossociais atualizadas, por favor, clique no botão "Gerar Relatório" a partir da aba "Dashboard".
            </div>` : ''}
        </div>

        <div class="section-title">3. MEMÓRIA DE CARACTERIZAÇÃO E INVENTÁRIO DE RISCOS</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 50%">FATOR DE RISCO AVALIADO E FATOR ERGONÔMICO (NR-17)</th>
                    <th style="width: 15%">EXPOSTOS (FUNC)</th>
                    <th style="width: 20%">CÁLCULO (P x S)</th>
                    <th style="width: 15%">NÍVEL DO RISCO</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // --- LÓGICA DE GERAÇÃO DAS LINHAS DO INVENTÁRIO AGRUPADAS ---
    if(totalRiscos > 0) {
        // Itera sobre as entradas do objeto agrupado ['Vendas', [itens], 'Produção', [itens]]
        Object.entries(dadosAgrupadosPorSetor).forEach(([sectorName, risksArray]) => {
            // Adiciona a LINHA DE CABEÇALHO DO SETOR
            htmlPGR += `
                <tr class="sector-group-header">
                    <td colspan="4" style="font-weight: bold; background-color: #f1f5f9 !important; text-transform: uppercase;">
                        SETOR: ${sectorName}
                    </td>
                </tr>
            `;

            // Adiciona cada risco daquele setor
            risksArray.forEach(d => {
                const risco = classificarRisco(d.score);
                const nomePerigoLimpo = d.perigo.replace(" (⚠️ SISTEMA: REVISÃO HUMANA NECESSÁRIA)", "");
                
                htmlPGR += `<tr>
                    <td style="font-size: 10px;">${nomePerigoLimpo}<br><span style="font-size: 8px; color: #64748b; margin-top: 3px; display: inline-block;">Necessidade AEP Direta: ${d.aep || 'Não Avaliado'}</span></td>
                    <td style="text-align: center;">${d.expostos || 1} func.</td>
                    <td style="text-align: center; font-size: 10px;">Prob: ${d.p} <br> Sev: ${d.s}</td>
                    <td style="background-color: ${risco.bg} !important; text-align: center;">
                        <span style="font-weight: bold; color: ${risco.color}; font-size: 10px;">${d.score} - ${risco.label}</span>
                    </td>
                </tr>`;
            });
        });
    } else { 
        htmlPGR += `<tr><td colspan="4" style="text-align:center; padding: 15px;">Nenhum risco crítico ou extremo foi mapeado neste ciclo.</td></tr>`; 
    }
    
    htmlPGR += `
            </tbody>
        </table>

        <div class="section-title">4. PLANO DE AÇÃO PREVENTIVA E CORRETIVA (CRONOGRAMA NR-01)</div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 30%">MEDIDA DE PREVENÇÃO (AÇÃO E ESTRATÉGIA)</th>
                    <th style="width: 20%">SETORES ENVOLVIDOS</th>
                    <th style="width: 35%">RESPONSABILIDADES TÉCNICAS E EXECUÇÃO</th>
                    <th style="width: 15%">STATUS</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // --- LÓGICA DE GERAÇÃO DAS LINHAS DO PLANO DE AÇÃO AGRUPADAS ---
    if(totalRiscos > 0) {
        // Itera sobre as entradas do objeto agrupado
        Object.entries(dadosAgrupadosPorSetor).forEach(([sectorName, risksArray]) => {
            // Adiciona a LINHA DE CABEÇALHO DO SETOR
            htmlPGR += `
                <tr class="sector-group-header">
                    <td colspan="4" style="font-weight: bold; background-color: #f1f5f9 !important; text-transform: uppercase;">
                        SETOR: ${sectorName}
                    </td>
                </tr>
            `;

            // Adiciona cada plano de ação daquele setor
            risksArray.forEach(d => {
                let statusColor = d.status === 'Concluído' ? '#dcfce7' : d.status === 'Em Execução' ? '#fef08a' : '#fff';
                
                htmlPGR += `<tr>
                    <td style="font-size: 10px;">${d.acao}</td>
                    <td style="font-size: 10px; font-style: italic;">${d.setoresEnv || d.setor}</td>
                    <td style="font-size: 10px; color: #1e293b;">${d.resp || 'Análise de responsabilidades pendente.'}</td>
                    <td style="text-align: center; font-weight: bold; font-size: 10px; background-color: ${statusColor} !important;">${d.status.toUpperCase()}</td>
                </tr>`;
            });
        });
    } else { 
        htmlPGR += `<tr><td colspan="4" style="text-align:center; padding: 15px;">Nenhum plano de ação ativo.</td></tr>`; 
    }
    
    htmlPGR += `
            </tbody>
        </table>

        <div class="signature-box">
            <div class="signature-line">
                <hr>
                <strong>TÉCNICO / ESPECIALISTA RESPONSÁVEL</strong><br>
                <span style="color: #475569;">Elaboração do PGR e AEP</span>
            </div>
            <div class="signature-line">
                <hr>
                <strong>REPRESENTANTE LEGAL DA EMPRESA</strong><br>
                <span style="color: #475569;">Aprovação e Validação</span>
            </div>
        </div>
        
        <div style="text-align: center; font-size: 8px; color: #94a3b8; margin-top: 15px; text-transform: uppercase;">
            Sistema Integrado PSI-GRO (Gerência de Riscos Ocupacionais) | Gerado Eletronicamente
        </div>
    `;
    
    notaImpressao.innerHTML = htmlPGR;
    document.body.appendChild(notaImpressao);
    
    // Pequeno atraso para garantir que as imagens gigantes carreguem na folha antes de abrir a tela de imprimir
    setTimeout(() => { 
        window.print(); 
        notaImpressao.remove(); 
    }, 800);
}

// O botão original da página "Relatórios" chamava essa função. Repassamos ela para a função principal e robusta.
function gerarRelatorio() {
    executarImpressaoPGR();
}