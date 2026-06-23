<?php
// Arquivo: banco.php

// O caminho aponta para a pasta do volume configurado no Coolify.
$caminhoBanco = '/var/www/html/database/usuarios.sqlite';

try {
    // Faz a conexão usando o caminho absoluto
    $db = new PDO('sqlite:' . $caminhoBanco);
    
    // Configura o PDO para sempre lançar exceções em caso de erro
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // =================================================================
    // CÓDIGO NOVO: Cria a tabela "clientes" se ela ainda não existir
    // =================================================================
    $queryCriacao = "CREATE TABLE IF NOT EXISTS clientes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL
    )";
    $db->exec($queryCriacao);
    
} catch (PDOException $e) {
    // Se a conexão falhar, exibe o erro
    echo json_encode(["sucesso" => false, "erro" => "Erro na conexão com o banco: " . $e->getMessage()]);
    exit;
}
?>
