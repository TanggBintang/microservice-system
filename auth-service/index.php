<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Log request for debugging
error_log("=== AUTH SERVICE DEBUG ===");
error_log("Method: " . $_SERVER['REQUEST_METHOD']);
error_log("URI: " . $_SERVER['REQUEST_URI']);
error_log("Headers: " . json_encode(getallheaders()));

// Simple routing
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

// Remove query string if present
$path = parse_url($path, PHP_URL_PATH);

// Remove leading slash for easier matching
$path = ltrim($path, '/');

error_log("Processed path: " . $path);

// Root endpoint - untuk testing
if (empty($path) || $path === '' || $path === 'index.php') {
    echo json_encode([
        'message' => 'Auth Service is running',
        'timestamp' => date('Y-m-d H:i:s'),
        'endpoints' => [
            'POST /token' => 'Get authentication token',
            'GET /' => 'Service status'
        ]
    ]);
    exit;
}

// Token endpoint
if ($method === 'POST' && $path === 'token') {
    error_log("=== TOKEN REQUEST PROCESSING ===");
    
    // Read JSON input
    $rawInput = file_get_contents('php://input');
    error_log("Raw input: " . $rawInput);
    
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        error_log("JSON decode failed");
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON format']);
        exit;
    }
    
    if (!isset($input['username']) || !isset($input['password'])) {
        error_log("Missing username or password");
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required']);
        exit;
    }
    
    $username = $input['username'];
    $password = $input['password'];
    
    error_log("Login attempt - Username: " . $username);
    
    // Database connection
    try {
        $host = $_ENV['DB_HOST'] ?? 'mysql';
        $dbname = $_ENV['DB_NAME'] ?? 'auth_db';
        $db_username = $_ENV['DB_USER'] ?? 'root';
        $db_password = $_ENV['DB_PASS'] ?? 'rootpassword';
        
        error_log("Connecting to DB: $host, $dbname, $db_username");
        
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $db_username, $db_password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        error_log("Database connected successfully");
        
        // Check if users table exists and has data
        $checkStmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $userCount = $checkStmt->fetch()['count'];
        error_log("Users in database: " . $userCount);
        
        // Simple authentication
        $hashedPassword = md5($password);
        error_log("Hashed password: " . $hashedPassword);
        
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
        $stmt->execute([$username, $hashedPassword]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            error_log("User found: " . json_encode($user));
            
            // Generate simple JWT-like token
            $payload = [
                'user_id' => $user['id'],
                'username' => $user['username'],
                'exp' => time() + 3600 // 1 hour
            ];
            
            $token = base64_encode(json_encode($payload));
            
            echo json_encode([
                'success' => true,
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username']
                ]
            ]);
        } else {
            error_log("User not found or invalid credentials");
            
            // Debug: Show all users for troubleshooting
            $allUsers = $pdo->query("SELECT username, password FROM users")->fetchAll();
            error_log("All users in DB: " . json_encode($allUsers));
            
            http_response_code(401);
            echo json_encode(['error' => 'Invalid credentials']);
        }
    } catch (Exception $e) {
        error_log("Database error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
    }
    exit;
}

// If no route matches
error_log("No matching route found");
http_response_code(404);
echo json_encode([
    'error' => 'Endpoint not found',
    'method' => $method,
    'path' => $path,
    'available_endpoints' => [
        'GET /' => 'Service info',
        'POST /token' => 'Get authentication token'
    ]
]);
?>