<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

include_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Initialize database table if not exists
$query = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";
$db->exec($query);

// Insert sample users
$checkUser = $db->prepare("SELECT COUNT(*) FROM users");
$checkUser->execute();
if ($checkUser->fetchColumn() == 0) {
    $sampleUsers = [
        ['admin', 'admin@example.com', 'admin123'],
        ['user1', 'user1@example.com', 'password123'],
        ['john', 'john@example.com', 'john123']
    ];
    
    foreach ($sampleUsers as $user) {
        $stmt = $db->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->execute($user);
    }
}

$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

switch ($request_method) {
    case 'POST':
        if (strpos($request_uri, '/login') !== false) {
            login($db);
        } elseif (strpos($request_uri, '/register') !== false) {
            register($db);
        }
        break;
    case 'GET':
        if (strpos($request_uri, '/users') !== false) {
            getUsers($db);
        }
        break;
}

function login($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->username) && !empty($data->password)) {
        $stmt = $db->prepare("SELECT id, username, email FROM users WHERE username = ? AND password = ?");
        $stmt->execute([$data->username, $data->password]);
        
        if ($stmt->rowCount() > 0) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            echo json_encode([
                "success" => true,
                "message" => "Login successful",
                "user" => $user,
                "token" => base64_encode($user['username'] . ':' . time())
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid credentials"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Username and password required"]);
    }
}

function register($db) {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!empty($data->username) && !empty($data->email) && !empty($data->password)) {
        $stmt = $db->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        
        if ($stmt->execute([$data->username, $data->email, $data->password])) {
            echo json_encode(["success" => true, "message" => "User registered successfully"]);
        } else {
            echo json_encode(["success" => false, "message" => "Registration failed"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "All fields required"]);
    }
}

function getUsers($db) {
    $stmt = $db->prepare("SELECT id, username, email, created_at FROM users");
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);
}
?>
