// js-relatorios.js
document.addEventListener("DOMContentLoaded", () => {
    if(document.getElementById('container-avaliacoes')) renderizarAvaliacoes();
});

function renderizarAvaliacoes() {
    const container = document.getElementById('container-avaliacoes');
    if (!container) return;
    const avaliacoes = getAvaliacoes();
    const respostas = getRespostas();

    container.innerHTML = avaliacoes.map(av => {
        const total = respostas.filter(r => r.avaliacaoId === av.id).length;
        return `
            <div class="card-relatorio">
                <div class="card-header"><h3>${av.titulo}</h3><button onclick="deletarAvaliacao('${av.id}')">🗑️</button></div>
                <div class="card-body"><p>Respostas: ${total}</p></div>
                <div class="card-actions">
                    <button class="btn-primary btn-outline" onclick="abrirModalQrEspecifico('${av.id}')">QR Code</button>
                    <button class="btn-primary" onclick="verRespostas('${av.id}')">Ver Dados</button>
                </div>
            </div>`;
    }).join('');
}

function verRespostas(id) {
    const respostas = getRespostas().filter(r => r.avaliacaoId === id);
    const container = document.getElementById('conteudoResultados');
    
    if(respostas.length === 0) {
        container.innerHTML = "<p>Nenhuma resposta coletada ainda.</p>";
    } else {
        const perguntas = getPerguntasConfig();
        let html = `<p style="margin-bottom: 15px;">Total de respostas: <strong>${respostas.length}</strong></p>`;

        perguntas.forEach(p => {
            html += `<div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 6px; border: 1px solid var(--border);">`;
            html += `<strong>${p.texto}</strong><ul style="margin-top: 10px; list-style: none;">`;
            
            p.opcoes.forEach(opt => {
                const textoOpcao = typeof opt === 'object' ? opt.texto : opt;
                const count = respostas.filter(r => r.respostas[p.id] === textoOpcao).length;
                const porcentagem = Math.round((count / respostas.length) * 100) || 0;
                
                html += `<li style="margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                                <span>${textoOpcao}</span> <span>${count} votos (${porcentagem}%)</span>
                            </div>
                            <div style="width: 100%; background: #e2e8f0; border-radius: 4px; height: 8px; margin-top: 4px;">
                                <div style="width: ${porcentagem}%; background: var(--btn-yellow); height: 100%; border-radius: 4px;"></div>
                            </div>
                         </li>`;
            });
            html += `</ul></div>`;
        });
        container.innerHTML = html;
    }
    document.getElementById('modalResultados').classList.add('active');
}

function iniciarAvaliacao() {
    const titulo = prompt("Título da Avaliação:");
    if(!titulo) return;
    const nova = { id: Date.now().toString(), data: new Date().toLocaleDateString(), titulo };
    const avs = getAvaliacoes();
    avs.push(nova);
    salvarAvaliacoes(avs);
    renderizarAvaliacoes();
}

function abrirModalQrEspecifico(id) {
    const modal = document.getElementById('modalQrCode');
    const img = document.getElementById('qrCodeImg');
    const input = document.getElementById('linkAvaliacao');
    const link = window.location.origin + window.location.pathname.replace('relatorios.html', 'avaliacao.html') + '?id=' + id;
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
    input.value = link;
    modal.classList.add('active');
}

function fecharModalQr() { document.getElementById('modalQrCode').classList.remove('active'); }

function copiarLink() {
    const input = document.getElementById('linkAvaliacao');
    input.select();
    document.execCommand("copy");
    alert("Link copiado com sucesso!");
}

function deletarAvaliacao(id) {
    if(confirm("ATENÇÃO: Tem certeza que deseja excluir este relatório? Isso apagará as respostas, limpará os gráficos e removerá os riscos automáticos vinculados a ele.")) {
        
        // 1. Apaga a Avaliação (O Relatório da Tela)
        salvarAvaliacoes(getAvaliacoes().filter(av => av.id !== id));
        
        // 2. Apaga todas as Respostas que os funcionários deram para este relatório
        salvarRespostas(getRespostas().filter(r => r.avaliacaoId !== id));

        // 3. FAXINA INTELIGENTE NO INVENTÁRIO (A Mágica)
        // Apagamos do banco de dados todos os riscos que o robô gerou e que ainda não foram validados.
        // Os riscos que você já editou manualmente (que perderam a tag "SISTEMA:") NÃO serão apagados.
        const inventarioLimpo = getDados().filter(d => !d.perigo.includes("SISTEMA:"));
        salvarDados(inventarioLimpo);

        // 4. Atualiza a tela de relatórios na mesma hora
        renderizarAvaliacoes();
        
        alert("Relatório e dados vinculados foram excluídos com sucesso! Seu Dashboard já foi atualizado.");
    }
}