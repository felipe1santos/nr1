<?php
$senhaAdmin = $_POST['senha_admin'] ?? '';
$logado = false;
$clientes = [];
$erro = '';

// Se você digitou a senha e apertou o botão
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($senhaAdmin === 'Suprema123') {
        $logado = true;
        
        try {
            // Usa a conexão centralizada que já tem o caminho certinho e cria a tabela!
            require 'banco.php';
            
            // Puxa todos os clientes, ordenando do mais recente para o mais antigo
            $stmt = $db->query("SELECT id, email FROM clientes ORDER BY id DESC");
// ... o resto do seu código continua igual ...
            $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        } catch (Exception $e) {
            $erro = "❌ Erro ao ler o banco de dados: " . $e->getMessage();
        }
    } else {
        $erro = "❌ Senha de administrador incorreta!";
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Painel Admin - Lista de Clientes</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 20px; }
        .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
        h2 { text-align: center; color: #333; margin-top: 0; }
        .login-form { display: flex; flex-direction: column; gap: 15px; }
        input { padding: 12px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; }
        button { padding: 15px; background-color: #198754; color: white; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer; }
        button:hover { background-color: #157347; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; color: #333; }
        .erro { background-color: #f8d7da; color: #842029; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 15px; }
        .badge { background-color: #0d6efd; color: white; padding: 4px 8px; border-radius: 10px; font-size: 12px; }
    </style>
</head>
<body>

<div class="container">
    <h2>Lista de Clientes 📋</h2>

    <?php if ($erro): ?>
        <div class="erro"><?php echo $erro; ?></div>
    <?php endif; ?>

    <?php if (!$logado): ?>
        <form method="POST" class="login-form">
            <label>Digite sua Senha Suprema para acessar a lista:</label>
            <input type="password" name="senha_admin" placeholder="Sua senha..." required>
            <button type="submit">Ver Clientes</button>
        </form>
    
    <?php else: ?>
        <p>Total de clientes cadastrados: <span class="badge"><?php echo count($clientes); ?></span></p>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>E-mail do Cliente</th>
                </tr>
            </thead>
            <tbody>
                <?php if (count($clientes) > 0): ?>
                    <?php foreach ($clientes as $cliente): ?>
                        <tr>
                            <td>#<?php echo htmlspecialchars($cliente['id']); ?></td>
                            <td><?php echo htmlspecialchars($cliente['email']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="2" style="text-align: center;">Nenhum cliente cadastrado ainda.</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>
        
        <br>
        
    <button style="background-color: #6c757d; padding: 10px;" onclick="window.location.href='clientes.php'">Sair</button>
    <?php endif; ?>
</div>

</body>
</html>
