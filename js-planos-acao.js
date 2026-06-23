// js-planos-acao.js

// Gatilho para carregar a tabela ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('tb-planos')) {
        renderizarPlanosDeAcao();
    }
});


function renderizarPlanosDeAcao() {
    const tbPlanos = document.getElementById('tb-planos');
    const dados = getDados();
    if (tbPlanos) {
        tbPlanos.innerHTML = dados.map(d => `
            <tr>
                <td style="font-weight: bold;">${d.setor}</td>
                <td style="max-width: 200px; white-space: normal; line-height: 1.4;">${d.icon || '⚠️'} <span style="font-size: 0.8rem;">${d.perigo.replace(" (⚠️ SISTEMA: REVISÃO HUMANA NECESSÁRIA)", "")}</span></td>
                <td style="max-width: 200px; white-space: normal; line-height: 1.4;">${d.acao}</td>
                <td style="max-width: 150px; white-space: normal;">${d.setoresEnv || d.setor}</td>
                <td style="max-width: 250px; white-space: normal; font-size: 0.8rem; line-height: 1.4; color: #475569;">${d.resp || '<em>Aguardando edição do especialista...</em>'}</td>
                <td>
                    <select onchange="atualizarStatus(${d.id}, this.value)" style="padding: 5px; border-radius: 4px; font-weight: bold; background: ${d.status === 'Concluído' ? '#dcfce7' : d.status === 'Em Execução' ? '#fef08a' : '#f1f5f9'}; border: 1px solid var(--border);">
                        <option value="Pendente" ${d.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="Em Execução" ${d.status === 'Em Execução' ? 'selected' : ''}>Em Execução</option>
                        <option value="Concluído" ${d.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                    </select>
                </td>
            </tr>`).join('');
    }
}




function atualizarStatus(id, novoStatus) {
    const dados = getDados();
    const index = dados.findIndex(d => d.id === id);
    if (index !== -1) {
        dados[index].status = novoStatus;
        salvarDados(dados);
        
        // Atualiza a tabela imediatamente na tela
        renderizarPlanosDeAcao(); 
        
        // Se a função do dashboard existir (caso esteja na index), atualiza os gráficos também
        if(typeof aplicarFiltroDashboard === "function") aplicarFiltroDashboard(); 
    }
}