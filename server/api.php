<?php
session_start();

header('Content-Type: application/json; charset=utf-8');

// 连接或创建数据库文件 notes.db
$pdo = new PDO('sqlite:notes.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

/**
 * 数据库结构
 * users(username TEXT PRIMARY KEY, password TEXT NOT NULL)
 * categories(id TEXT PRIMARY KEY, name TEXT NOT NULL, username TEXT NOT NULL)
 * notes(id TEXT PRIMARY KEY, title TEXT, content TEXT, categoryId TEXT, previousCategoryId TEXT,
 *       isEncrypted INTEGER, password TEXT, lastModified INTEGER, createTime INTEGER, username TEXT NOT NULL)
 */

$pdo->exec("CREATE TABLE IF NOT EXISTS users (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT NOT NULL
)");

$pdo->exec("CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT,
  categoryId TEXT,
  previousCategoryId TEXT,
  isEncrypted INTEGER,
  password TEXT,
  lastModified INTEGER,
  createTime INTEGER,
  username TEXT NOT NULL
)");

// 获取 action 参数
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// 分发处理
switch($action) {
  case 'login':
    login($pdo);
    break;
  case 'register':
    registerUser($pdo);
    break;
  case 'checkSession':
    checkSession();
    break;
  case 'logout':
    logout();
    break;

  // 分类
  case 'getCategories':
    getCategories($pdo);
    break;
  case 'addCategory':
    addCategory($pdo);
    break;
  case 'updateCategoryName':
    updateCategoryName($pdo);
    break;
  case 'deleteCategory':
    deleteCategory($pdo);
    break;
  case 'moveNotesToUncategorized':
    moveNotesToUncategorized($pdo);
    break;

  // 笔记
  case 'getNotes':
    getNotes($pdo);
    break;
  case 'addNote':
    addNote($pdo);
    break;
  case 'updateNote':
    updateNote($pdo);
    break;
  case 'deleteNote':
    deleteNote($pdo);
    break;
  case 'moveNoteToCategory':
    moveNoteToCategory($pdo);
    break;
  case 'moveNoteToTrash':
    moveNoteToTrash($pdo);
    break;
  case 'restoreNoteFromTrash':
    restoreNoteFromTrash($pdo);
    break;
  case 'permanentlyDeleteNote':
    permanentlyDeleteNote($pdo);
    break;

  // 文件上传(示例)
  case 'uploadFile':
    uploadFile();
    break;

  default:
    echo json_encode(['error' => 'Invalid action']);
    break;
}

/* ------------------ 函数实现区域 ------------------ */
 
// 若没有登录，则返回未授权错误 
function ensureLoggedIn() {
  if (!isset($_SESSION['username'])) {
    echo json_encode(['error' => 'not logged in']);
    exit;
  }
}

function login($pdo) {
  $username = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';

  $stmt = $pdo->prepare("SELECT * FROM users WHERE username=? LIMIT 1");
  $stmt->execute([$username]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($user && password_verify($password, $user['password'])) {
    $_SESSION['username'] = $username;
    echo json_encode(['success'=>true, 'msg'=>'登录成功']);
  } else {
    echo json_encode(['success'=>false, 'msg'=>'用户名或密码错误']);
  }
}

function registerUser($pdo) {
  $username = $_POST['username'] ?? '';
  $password = $_POST['password'] ?? '';

  // 检查用户名是否存在
  $stmt = $pdo->prepare("SELECT * FROM users WHERE username=? LIMIT 1");
  $stmt->execute([$username]);
  $user = $stmt->fetch(PDO::FETCH_ASSOC);

  if ($user) {
    echo json_encode(['success'=>false, 'msg'=>'用户名已存在']);
    return;
  }

  $hash = password_hash($password, PASSWORD_DEFAULT);
  $stmt = $pdo->prepare("INSERT INTO users (username, password) VALUES (?,?)");
  $stmt->execute([$username, $hash]);

  echo json_encode(['success'=>true, 'msg'=>'注册成功']);
}

function checkSession() {
  if (isset($_SESSION['username'])) {
    echo json_encode(['success'=>true, 'username'=>$_SESSION['username']]);
  } else {
    echo json_encode(['success'=>false]);
  }
}

function logout() {
  session_destroy();
  echo json_encode(['success'=>true]);
}

// ========== 分类相关操作 ==========
function getCategories($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $stmt = $pdo->prepare("SELECT * FROM categories WHERE username=?");
  $stmt->execute([$username]);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($rows);
}

function addCategory($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $id = $data['id'] ?? time(); 
  $name = $data['name'] ?? '未命名';

  $stmt = $pdo->prepare("INSERT INTO categories (id, name, username) VALUES (?,?,?)");
  $stmt->execute([$id, $name, $username]);

  echo json_encode(['success' => true, 'id' => $id]);
}

function updateCategoryName($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $categoryId = $data['categoryId'];
  $newName = $data['newName'] ?? '未命名';

  // 仅更新该用户下的分类
  $stmt = $pdo->prepare("UPDATE categories SET name=? WHERE id=? AND username=?");
  $stmt->execute([$newName, $categoryId, $username]);

  echo json_encode(['success' => true]);
}

function deleteCategory($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $categoryId = $data['categoryId'];

  // 删除此分类（仅限当前用户）
  $stmt = $pdo->prepare("DELETE FROM categories WHERE id=? AND username=?");
  $stmt->execute([$categoryId, $username]);

  echo json_encode(['success' => true]);
}

function moveNotesToUncategorized($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $categoryId = $data['categoryId'];

  // 将该用户此分类下的所有笔记移动到未分类
  $stmt = $pdo->prepare("UPDATE notes SET categoryId='uncategorized' WHERE categoryId=? AND username=?");
  $stmt->execute([$categoryId, $username]);

  echo json_encode(['success' => true]);
}

// ========== 笔记相关操作 ==========
function getNotes($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $stmt = $pdo->prepare("SELECT * FROM notes WHERE username=?");
  $stmt->execute([$username]);
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($rows);
}

function addNote($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);

  $id = $data['id'];
  $title = $data['title'] ?? '';
  $content = $data['content'] ?? '';
  $categoryId = $data['categoryId'] ?? 'uncategorized';
  $previousCategoryId = $data['previousCategoryId'] ?? '';
  $isEncrypted = !empty($data['isEncrypted']) ? 1 : 0;
  $password = $data['password'] ?? '';
  $createTime = $data['createTime'] ?? (time() * 1000);
  $lastModified = $data['lastModified'] ?? $createTime;

  $stmt = $pdo->prepare("INSERT INTO notes
    (id, title, content, categoryId, previousCategoryId, isEncrypted, password, lastModified, createTime, username)
    VALUES (?,?,?,?,?,?,?,?,?,?)");
  $stmt->execute([$id, $title, $content, $categoryId, $previousCategoryId, $isEncrypted, $password, $lastModified, $createTime, $username]);

  echo json_encode(['success' => true]);
}

function updateNote($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);

  $id = $data['id'];
  if (!$id) {
    echo json_encode(['error'=>'note id missing']);
    return;
  }

  $title = $data['title'] ?? '';
  $content = $data['content'] ?? '';
  $categoryId = $data['categoryId'] ?? 'uncategorized';
  $previousCategoryId = $data['previousCategoryId'] ?? '';
  $isEncrypted = !empty($data['isEncrypted']) ? 1 : 0;
  $password = $data['password'] ?? '';
  // lastModified 强制更新
  $lastModified = time() * 1000;

  // 只更新当前用户的笔记
  $stmt = $pdo->prepare("UPDATE notes 
    SET title=?, content=?, categoryId=?, previousCategoryId=?, isEncrypted=?, password=?, lastModified=?
    WHERE id=? AND username=?");
  $stmt->execute([$title, $content, $categoryId, $previousCategoryId, $isEncrypted, $password, $lastModified, $id, $username]);

  echo json_encode(['success' => true, 'lastModified'=>$lastModified]);
}

function deleteNote($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  // 只删除当前用户的笔记
  $stmt = $pdo->prepare("DELETE FROM notes WHERE id=? AND username=?");
  $stmt->execute([$noteId, $username]);

  echo json_encode(['success' => true]);
}

// ========== moveNoteToCategory / moveNoteToTrash / restoreNoteFromTrash / permanentlyDeleteNote ==========
function moveNoteToCategory($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];
  $categoryId = $data['categoryId'];

  $stmt = $pdo->prepare("UPDATE notes SET categoryId=? WHERE id=? AND username=?");
  $stmt->execute([$categoryId, $noteId, $username]);

  echo json_encode(['success' => true]);
}

function moveNoteToTrash($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  // 获取当前笔记categoryId, 记录到 previousCategoryId, 设置 categoryId="trash"
  $stmt = $pdo->prepare("SELECT categoryId FROM notes WHERE id=? AND username=?");
  $stmt->execute([$noteId, $username]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row) {
    $prev = $row['categoryId'];

    $stmt2 = $pdo->prepare("UPDATE notes SET previousCategoryId=?, categoryId='trash' WHERE id=? AND username=?");
    $stmt2->execute([$prev, $noteId, $username]);
  }

  echo json_encode(['success' => true]);
}

function restoreNoteFromTrash($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  // 先查 previousCategoryId
  $stmt = $pdo->prepare("SELECT previousCategoryId FROM notes WHERE id=? AND categoryId='trash' AND username=?");
  $stmt->execute([$noteId, $username]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row) {
    $prev = $row['previousCategoryId'] ?: 'uncategorized';

    $stmt2 = $pdo->prepare("UPDATE notes SET categoryId=?, previousCategoryId='' WHERE id=? AND username=?");
    $stmt2->execute([$prev, $noteId, $username]);
  }

  echo json_encode(['success'=>true]);
}

function permanentlyDeleteNote($pdo) {
  ensureLoggedIn();
  $username = $_SESSION['username'];

  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  $stmt = $pdo->prepare("DELETE FROM notes WHERE id=? AND username=?");
  $stmt->execute([$noteId, $username]);

  echo json_encode(['success'=>true]);
}

// ========== 文件上传示例 ==========

function uploadFile() {
  ensureLoggedIn();

  if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'No file uploaded']);
    return;
  }

  $file = $_FILES['file'];
  $uploadDir = __DIR__ . '/../../assets/';
  $uploadFile = $uploadDir . basename($file['name']);

  // 调试信息
  error_log("Upload directory: " . $uploadDir);
  error_log("Upload file path: " . $uploadFile);
  error_log("File tmp name: " . $file['tmp_name']);
  error_log("File name: " . $file['name']);
  error_log("File size: " . $file['size']);
  error_log("File error: " . $file['error']);

  if (move_uploaded_file($file['tmp_name'], $uploadFile)) {
    $url = 'https://file.mewtopia.cn/assets/' . basename($file['name']);
    echo json_encode(['success' => true, 'url' => $url]);
  } else {
    echo json_encode(['error' => 'File upload failed']);
    error_log("File upload failed");
  }
}
?>