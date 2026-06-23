<?php
session_start();

// Qual ação o JavaScript quer fazer?
$acao = $_POST['acao'] ?? 'login'; 
$emailDigitado = $_POST['user'] ?? '';
$senhaDigitada = $_POST['pass'] ?? '';
$novaSenhaDigitada = $_POST['nova_senha'] ?? '';

// ==========================================
// 👑 ACESSO SUPREMO
// ==========================================
if ($emailDigitado === 'perone@admin.com') {
    if ($acao === 'login' && $senhaDigitada === 'Suprema123') {
        $_SESSION['logado'] = true;
        $_SESSION['email'] = 'Admin Supremo';
        echo json_encode(['sucesso' => true]);
        exit;
    } else if ($acao === 'verificar_email') {
        echo json_encode(['sucesso' => true, 'etapa' => 'login_normal']);
        exit;
    }
}

require 'banco.php';

// ---------------------------------------------------------
// ETAPA 1: VERIFICAR E-MAIL E SE É O PRIMEIRO ACESSO
// ---------------------------------------------------------
if ($acao === 'verificar_email') {
    $stmt = $db->prepare("SELECT * FROM clientes WHERE email = :email");
    $stmt->execute([':email' => $emailDigitado]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario) {
        // Se a senha ainda for a padrão '12345', identificamos o primeiro acesso
        if (password_verify('12345', $usuario['senha'])) {
            echo json_encode(['sucesso' => true, 'etapa' => 'primeiro_acesso']);
        } else {
            echo json_encode(['sucesso' => true, 'etapa' => 'login_normal']);
        }
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'E-mail não encontrado. Você usou este e-mail na compra?']);
    }
    exit;
}

// ---------------------------------------------------------
// ETAPA 2: LOGIN NORMAL
// ---------------------------------------------------------
if ($acao === 'login') {
    $stmt = $db->prepare("SELECT * FROM clientes WHERE email = :email");
    $stmt->execute([':email' => $emailDigitado]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuario && password_verify($senhaDigitada, $usuario['senha'])) {
        $_SESSION['logado'] = true;
        $_SESSION['email'] = $usuario['email'];
        echo json_encode(['sucesso' => true]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'Senha incorreta!']);
    }
    exit;
}

// ---------------------------------------------------------
// ETAPA 3: SALVAR A NOVA SENHA DO PRIMEIRO ACESSO
// ---------------------------------------------------------
if ($acao === 'nova_senha') {
    $stmt = $db->prepare("SELECT * FROM clientes WHERE email = :email");
    $stmt->execute([':email' => $emailDigitado]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

    // Medida de segurança: Só deixa trocar a senha se a atual ainda for a 12345
    if ($usuario && password_verify('12345', $usuario['senha'])) {
        $senhaCriptografada = password_hash($novaSenhaDigitada, PASSWORD_DEFAULT);
        
        $update = $db->prepare("UPDATE clientes SET senha = :senha WHERE email = :email");
        $update->execute([':senha' => $senhaCriptografada, ':email' => $emailDigitado]);

        // Já libera a sessão para o dashboard
        $_SESSION['logado'] = true;
        $_SESSION['email'] = $emailDigitado;
        echo json_encode(['sucesso' => true]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'Ação não permitida.']);
    }
    exit;
}
?>
