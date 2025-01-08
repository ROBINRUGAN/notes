<?php


header('Content-Type: application/json; charset=utf-8');

// 连接或创建数据库文件 notes.db
$pdo = new PDO('sqlite:notes.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 初始化建表：categories & notes
$pdo->exec("CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
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
  createTime INTEGER
)");

// 获取 action 参数
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// 分发处理
switch($action) {
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

  // moveNoteToCategory / moveNoteToTrash / restoreNoteFromTrash / permanentlyDeleteNote
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
  case 'uploadFile':
    uploadFile();
    break;

  default:
    echo json_encode(['error' => 'Invalid action']);
    break;
}

/* ------------------ 函数实现区域 ------------------ */

// ========== 分类 ==========

function getCategories($pdo) {
  $stmt = $pdo->query("SELECT * FROM categories");
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($rows);
}

function addCategory($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $id = $data['id'] ?? time();  // 或 uniqid()
  $name = $data['name'] ?? '未命名';

  $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (?,?)");
  $stmt->execute([$id, $name]);

  echo json_encode(['success' => true, 'id' => $id]);
}

function updateCategoryName($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $categoryId = $data['categoryId'];
  $newName = $data['newName'] ?? '未命名';

  $stmt = $pdo->prepare("UPDATE categories SET name=? WHERE id=?");
  $stmt->execute([$newName, $categoryId]);

  echo json_encode(['success' => true]);
}

function deleteCategory($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $categoryId = $data['categoryId'];

  // 删除此分类
  $stmt = $pdo->prepare("DELETE FROM categories WHERE id=?");
  $stmt->execute([$categoryId]);

  echo json_encode(['success' => true]);
}

function moveNotesToUncategorized($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $categoryId = $data['categoryId'];

  // 将此分类下的所有笔记移动到未分类
  $stmt = $pdo->prepare("UPDATE notes SET categoryId='uncategorized' WHERE categoryId=?");
  $stmt->execute([$categoryId]);

  echo json_encode(['success' => true]);
}

// ========== 笔记 ==========

function getNotes($pdo) {
  $stmt = $pdo->query("SELECT * FROM notes");
  $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode($rows);
}

function addNote($pdo) {
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
    (id, title, content, categoryId, previousCategoryId, isEncrypted, password, lastModified, createTime)
    VALUES (?,?,?,?,?,?,?,?,?)");
  $stmt->execute([$id, $title, $content, $categoryId, $previousCategoryId, $isEncrypted, $password, $lastModified, $createTime]);

  echo json_encode(['success' => true]);
}

function updateNote($pdo) {
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

  $stmt = $pdo->prepare("UPDATE notes 
    SET title=?, content=?, categoryId=?, previousCategoryId=?, isEncrypted=?, password=?, lastModified=?
    WHERE id=?");
  $stmt->execute([$title, $content, $categoryId, $previousCategoryId, $isEncrypted, $password, $lastModified, $id]);

  echo json_encode(['success' => true, 'lastModified'=>$lastModified]);
}

function deleteNote($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  $stmt = $pdo->prepare("DELETE FROM notes WHERE id=?");
  $stmt->execute([$noteId]);

  echo json_encode(['success' => true]);
}

// ========== moveNoteToCategory / Trash / Restore / PermDelete ==========

function moveNoteToCategory($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];
  $categoryId = $data['categoryId'];

  $stmt = $pdo->prepare("UPDATE notes SET categoryId=? WHERE id=?");
  $stmt->execute([$categoryId, $noteId]);

  echo json_encode(['success' => true]);
}

function moveNoteToTrash($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  // 获取当前笔记categoryId, 记录到 previousCategoryId, 设置 categoryId="trash"
  $stmt = $pdo->prepare("SELECT categoryId FROM notes WHERE id=?");
  $stmt->execute([$noteId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row) {
    $prev = $row['categoryId'];

    $stmt2 = $pdo->prepare("UPDATE notes SET previousCategoryId=?, categoryId='trash' WHERE id=?");
    $stmt2->execute([$prev, $noteId]);
  }

  echo json_encode(['success' => true]);
}

function restoreNoteFromTrash($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  // 先查 previousCategoryId
  $stmt = $pdo->prepare("SELECT previousCategoryId FROM notes WHERE id=? AND categoryId='trash'");
  $stmt->execute([$noteId]);
  $row = $stmt->fetch(PDO::FETCH_ASSOC);
  if ($row) {
    $prev = $row['previousCategoryId'] ?: 'uncategorized';

    $stmt2 = $pdo->prepare("UPDATE notes SET categoryId=?, previousCategoryId='' WHERE id=?");
    $stmt2->execute([$prev, $noteId]);
  }

  echo json_encode(['success'=>true]);
}

function permanentlyDeleteNote($pdo) {
  $data = json_decode(file_get_contents('php://input'), true);
  $noteId = $data['noteId'];

  $stmt = $pdo->prepare("DELETE FROM notes WHERE id=?");
  $stmt->execute([$noteId]);
  echo json_encode(['success'=>true]);
}

function uploadFile() {
  if (!isset($_FILES['file'])) {
    echo json_encode(['error' => 'No file uploaded']);
    return;
  }

  $file = $_FILES['file'];
  $uploadDir = __DIR__ . '/../assets/';
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