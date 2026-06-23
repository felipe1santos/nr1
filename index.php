<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | PSI-GRO</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <style>
        body { display: flex; align-items: center; justify-content: center; height: 100vh; background-color: var(--bg-color); }
        .login-card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
        .login-logo { font-size: 3rem; color: var(--btn-yellow); margin-bottom: 10px; }
        .login-title { color: var(--sidebar-bg); margin-bottom: 30px; font-weight: 700; }
        .form-group { text-align: left; margin-bottom: 20px; }
        .btn-login { width: 100%; margin-top: 10px; height: 45px; }
        
        /* Overlay de Carregamento */
        #loader-overlay { 
            display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(30, 41, 59, 0.95); z-index: 9999; flex-direction: column;
            align-items: center; justify-content: center; color: white;
        }
        .spinner { 
            width: 50px; height: 50px; border: 5px solid rgba(255,255,255,0.1); 
            border-top: 5px solid var(--btn-yellow); border-radius: 50%; animation: spin 1s linear infinite; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>

    <div id="loader-overlay">
        <div class="spinner"></div>
        <p style="margin-top: 20px; font-weight: bold; letter-spacing: 1px;">AUTENTICANDO...</p>
    </div>

    <audio id="audioLoading" src="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"></audio>

    <div class="login-card">
        <i class="fa-solid fa-brain login-logo"></i>
        <h2 class="login-title">PSI-GRO</h2>
        
        <form onsubmit="processarFormulario(event)">
            
            <div id="bloco-email" class="form-group">
                <label>Usuário (E-mail da compra):</label>
                <input type="text" id="user" placeholder="Ex: gestor@empresa.com" required>
            </div>

            <div id="msg-primeiro-acesso" style="display: none; background: #fff9e6; color: #856404; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 0.9rem; border: 1px solid #ffeeba;">
                <i class="fa-solid fa-circle-exclamation"></i> <strong>Primeiro acesso detectado!</strong><br>Crie uma senha segura para o seu sistema.
            </div>

            <div id="bloco-senha" class="form-group" style="display: none;">
                <label>Sua Senha:</label>
                <input type="password" id="pass" placeholder="••••••••">
            </div>

            <div id="bloco-nova-senha" class="form-group" style="display: none;">
                <label>Crie sua Senha:</label>
                <input type="password" id="nova-senha" placeholder="Mínimo 5 caracteres">
            </div>

            <button type="submit" id="btn-acao" class="btn-primary btn-login">CONTINUAR</button>
            
            <button type="button" id="btn-voltar" style="display:none; width: 100%; background: transparent; border: none; color: #64748b; margin-top: 15px; cursor: pointer; text-decoration: underline;" onclick="voltarParaEmail()">Voltar e trocar e-mail</button>
        </form>
        <p style="margin-top: 20px; font-size: 0.8rem; color: #94a3b8;">Acesso Restrito - Monitoramento GRO</p>
    </div>

    <script src="js-cerebro.js"></script>
    <script>
        let etapaAtual = 'email';

        function voltarParaEmail() {
            etapaAtual = 'email';
            document.getElementById('bloco-email').style.display = 'block';
            document.getElementById('bloco-senha').style.display = 'none';
            document.getElementById('bloco-nova-senha').style.display = 'none';
            document.getElementById('msg-primeiro-acesso').style.display = 'none';
            document.getElementById('btn-voltar').style.display = 'none';
            
            // Remove as obrigatoriedades
            document.getElementById('pass').required = false;
            document.getElementById('nova-senha').required = false;
            
            document.getElementById('btn-acao').innerHTML = 'CONTINUAR';
        }

        async function processarFormulario(event) {
            event.preventDefault();
            
            const user = document.getElementById('user').value;
            const btn = document.getElementById('btn-acao');
            const textoOriginal = btn.innerHTML;
            
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';

            const formData = new FormData();
            formData.append('user', user);

            try {
                // VERIFICA O EMAIL
                if (etapaAtual === 'email') {
                    formData.append('acao', 'verificar_email');
                    const resposta = await fetch('api_login.php', { method: 'POST', body: formData });
                    const dados = await resposta.json();

                    if (dados.sucesso) {
                        document.getElementById('bloco-email').style.display = 'none';
                        document.getElementById('btn-voltar').style.display = 'block';

                        if (dados.etapa === 'primeiro_acesso') {
                            etapaAtual = 'nova_senha';
                            document.getElementById('msg-primeiro-acesso').style.display = 'block';
                            document.getElementById('bloco-nova-senha').style.display = 'block';
                            document.getElementById('nova-senha').required = true;
                            btn.innerHTML = 'SALVAR E ACESSAR';
                        } else {
                            etapaAtual = 'login';
                            document.getElementById('bloco-senha').style.display = 'block';
                            document.getElementById('pass').required = true;
                            btn.innerHTML = 'ENTRAR NO SISTEMA';
                        }
                    } else {
                        alert(dados.erro);
                        btn.innerHTML = textoOriginal;
                    }
                    btn.disabled = false;

                // TENTA LOGAR NORMALMENTE
                } else if (etapaAtual === 'login') {
                    formData.append('acao', 'login');
                    formData.append('pass', document.getElementById('pass').value);
                    
                    const resposta = await fetch('api_login.php', { method: 'POST', body: formData });
                    const dados = await resposta.json();

                    if (dados.sucesso) {
                        animacaoSucesso(user);
                    } else {
                        alert(dados.erro);
                        btn.disabled = false;
                        btn.innerHTML = textoOriginal;
                    }

                // SALVA A SENHA DO PRIMEIRO ACESSO
                } else if (etapaAtual === 'nova_senha') {
                    const novaSenha = document.getElementById('nova-senha').value;
                    if(novaSenha.length < 5) {
                        alert('A senha deve ter pelo menos 5 caracteres para sua segurança.');
                        btn.disabled = false;
                        btn.innerHTML = textoOriginal;
                        return;
                    }
                    
                    formData.append('acao', 'nova_senha');
                    formData.append('nova_senha', novaSenha);
                    
                    const resposta = await fetch('api_login.php', { method: 'POST', body: formData });
                    const dados = await resposta.json();

                    if (dados.sucesso) {
                        animacaoSucesso(user);
                    } else {
                        alert(dados.erro);
                        btn.disabled = false;
                        btn.innerHTML = textoOriginal;
                    }
                }
            } catch (erro) {
                console.error(erro);
                alert("Erro ao conectar com o banco de dados.");
                btn.disabled = false;
                btn.innerHTML = textoOriginal;
            }
        }

        function animacaoSucesso(user) {
            const loader = document.getElementById('loader-overlay');
            const som = document.getElementById('audioLoading');
            loader.style.display = 'flex';
            som.play().catch(() => console.log('Áudio bloqueado pelo navegador'));
            
            localStorage.setItem('psi_gro_sessao', 'ativo');
            localStorage.setItem('psi_gro_email_logado', user);
            
            setTimeout(() => { window.location.href = "dashboard.html"; }, 3500);
        }
    </script>
</body>
</html>
