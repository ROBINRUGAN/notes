let currentEditorMode = "markdown"; // "markdown" | "richtext"
let simplemde = null; // SimpleMDE 实例
let quill = null; // Quill 实例
let currentNote = null; // 当前编辑的 note 对象

// 切换模式时，需要先保存旧内容，再销毁旧编辑器，再初始化新编辑器
function switchEditorMode(newMode) {
  // 1) 先保存旧编辑器内容并销毁
  if (currentEditorMode === "markdown" && simplemde) {
    currentNote.content = simplemde.value(); // 修改为 currentNote
    simplemde.toTextArea();
    simplemde = null;
  } else if (currentEditorMode === "richtext" && quill) {
    currentNote.content = quill.root.innerHTML; // 修改为 currentNote
    quill = null;
  }

  // 2) 清空 #editorContainer
  const container = document.getElementById("editorContainer");
  container.innerHTML = "";

  // 3) 新建编辑器 DOM
  if (newMode === "markdown") {
    const textarea = document.createElement("textarea");
    container.appendChild(textarea);

    simplemde = new SimpleMDE({
      element: textarea,
      initialValue: currentNote.content || "", // 修改为 currentNote
    });

    // 监听编辑
    simplemde.codemirror.on("change", async function () {
      currentNote.content = simplemde.value(); // 修改为 currentNote
      currentNote.lastModified = Date.now(); // 实时更新
      await CloudDataService.updateNote(currentNote);

      // 如需实时显示 lastModified，可在这里更新 DOM:
      const lastModifiedEl = document.querySelector(".note-last-modified");
      if (lastModifiedEl) {
        lastModifiedEl.textContent = new Date(
          currentNote.lastModified
        ).toLocaleString();
      }
    });
  } else if (newMode === "richtext") {
    const div = document.createElement("div");
    container.appendChild(div);

    quill = new Quill(div, { theme: "snow" });
    quill.root.innerHTML = currentNote.content || ""; // 修改为 currentNote

    quill.on("text-change", async function () {
      currentNote.content = quill.root.innerHTML; // 修改为 currentNote
      currentNote.lastModified = Date.now(); // 实时更新
      await CloudDataService.updateNote(currentNote);

      // 更新 DOM
      const lastModifiedEl = document.querySelector(".note-last-modified");
      if (lastModifiedEl) {
        lastModifiedEl.textContent = new Date(
          currentNote.lastModified
        ).toLocaleString();
      }
    });
  }

  currentEditorMode = newMode;
}

// 当用户在笔记详情时，决定初始化(默认markdown)
function initEditorForNote(note) {
  // 如果之前有残留的编辑器实例（simplemde/quill），可在这里销毁
  if (simplemde) {
    simplemde.toTextArea();
    simplemde = null;
  }
  if (quill) {
    quill = null;
  }
  currentNote = note; // 记录当前笔记
  currentEditorMode = "markdown"; // 默认是markdown
  switchEditorMode("markdown"); // 创建markdown编辑器
}

// 当用户点击开关时，切换模式
document
  .querySelector(".edit-mode-checkbox")
  .addEventListener("change", (e) => {
    if (e.target.checked) {
      // checked => rich text
      switchEditorMode("richtext");
    } else {
      switchEditorMode("markdown");
    }
  });
