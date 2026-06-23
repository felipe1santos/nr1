<?php
require 'banco.php';
$mensagem = '';

// Se o formulário foi enviado (botão clicado)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $emailNovo = $_POST['email'] ?? '';
    $senhaAdmin = $_POST['senha_admin'] ?? '';

    // 1. Verifica se quem está tentando adicionar é você (Admin)
    if ($senhaAdmin !== 'Suprema123') {
        $mensagem = '<div class="msg erro">❌ Senha de administrador incorreta! Acesso negado.</div>';
    } 
    // 2. Verifica se o e-mail digitado é válido
    elseif (!filter_var($emailNovo, FILTER_VALIDATE_EMAIL)) {
        $mensagem = '<div class="msg erro">⚠️ Por favor, digite um formato de e-mail válido.</div>';
    } 
    // 3. Tudo certo! Tenta salvar no banco de dados
    else {
        // Cria a senha padrão '12345' criptografada
        $senhaPadrao = password_hash('12345', PASSWORD_DEFAULT);
        
        try {
            $stmt = $db->prepare("INSERT OR IGNORE INTO clientes (email, senha) VALUES (:email, :senha)");
            $stmt->execute([':email' => $emailNovo, ':senha' => $senhaPadrao]);
            
            // Verifica se o e-mail foi inserido ou se já existia (por causa do IGNORE)
            if ($stmt->rowCount() > 0) {
                $mensagem = "<div class='msg sucesso'>✅ Sucesso! O cliente <b>{$emailNovo}</b> foi adicionado.<br>Ele já pode acessar usando a senha: <b>12345</b></div>";
            } else {
                $mensagem = "<div class='msg alerta'>⚠️ O e-mail <b>{$emailNovo}</b> já está cadastrado no sistema.</div>";
            }
        } catch (Exception $e) {
            $mensagem = "<div class='msg erro'>❌ Erro ao adicionar no banco: " . $e->getMessage() . "</div>";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Admin - Adicionar Cliente</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f7f6;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .painel {
            background-color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
        }
        h2 {
            margin-top: 0;
            color: #333;
            text-align: center;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            border-radius: 5px;
            box-sizing: border-box;
            font-size: 16px;
        }
        button {
            width: 100%;
            padding: 15px;
            background-color: #0d6efd;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background-color: #0b5ed7;
        }
        .msg {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
            text-align: center;
        }
        .msg.sucesso { background-color: #d1e7dd; color: #0f5132; border: 1px solid #badbcc; }
        .msg.erro { background-color: #f8d7da; color: #842029; border: 1px solid #f5c2c7; }
        .msg.alerta { background-color: #fff3cd; color: #664d03; border: 1px solid #ffecb5; }
    </style>
</head>
<body>

    <div class="painel">
        <h2>Adicionar Cliente 👤</h2>
        
        <?php echo $mensagem; ?>

        <form method="POST">
            <label for="email">E-mail do Comprador:</label>
            <input type="email" id="email" name="email" placeholder="cliente@gmail.com" required autocomplete="off">

            <label for="senha_admin">Sua Senha Suprema (Admin):</label>
            <input type="password" id="senha_admin" name="senha_admin" placeholder="Digite para autorizar" required>

            <button type="submit">Cadastrar Cliente</button>
        </form>
    </div>

</body>
</html>
