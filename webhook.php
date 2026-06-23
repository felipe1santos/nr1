<?php
require 'banco.php';

// Lê o JSON que a Kiwify enviou
$input = file_get_contents('php://input');

// SALVA O QUE A KIWIFY MANDOU EM UM ARQUIVO DE TEXTO PARA VOCÊ LER DEPOIS
file_put_contents(__DIR__ . '/log_kiwify.txt', date('Y-m-d H:i:s') . " - Payload: " . $input . PHP_EOL, FILE_APPEND);

$dados = json_decode($input, true);

// Verifica se o status do pedido é "paid" (pago/aprovado)
if (isset($dados['order_status']) && $dados['order_status'] === 'paid') {
    
    $emailComprador = $dados['Customer']['email'];
    
    // Cria a senha padrão '12345' criptografada (nunca salve senhas em texto puro)
    $senhaPadrao = password_hash('12345', PASSWORD_DEFAULT);

    // Salva no banco de dados. O "IGNORE" evita duplicar se a pessoa comprar de novo.
    $stmt = $db->prepare("INSERT OR IGNORE INTO clientes (email, senha) VALUES (:email, :senha)");
    $stmt->execute([':email' => $emailComprador, ':senha' => $senhaPadrao]);

    // Responde para a Kiwify que deu tudo certo
    http_response_code(200);
    echo "Acesso criado com sucesso para: " . $emailComprador;

} else {
    // Se for boleto gerado, carrinho abandonado, etc, ele ignora.
    http_response_code(200);
    echo "Evento ignorado.";
}
?>
