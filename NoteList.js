// NoteList.js - Handles note list management

const NoteList = {
  tempUnlockedNotes: {}, // 记录笔记是否在当前会话中已解锁

  // 新增：存储当前的排序方式
  currentSortOption: null, // e.g. 'createTime-asc' / 'title-desc' 等
  // 新增：存储当前的搜索关键字
  currentSearchQuery: "",

  init: function () {
    this.loadNotes();
    this.bindEvents();
    this.bindCategoryDropEvents(); // 确保拖放事件在初始化时绑定
  },

  loadNotes: function () {
    this.applyFiltersAndRender();
  },

  loadNotesByCategory: function (folderId) {
    // 改动：将当前分类设置为focused，然后直接调用 applyFiltersAndRender()
    const folderItems = document.querySelectorAll(".folder-item");
    folderItems.forEach((item) => {
      if (item.getAttribute("data-folder") === folderId) {
        item.classList.add("focused");
      } else {
        item.classList.remove("focused");
      }
    });

    // 调用过滤 & 渲染
    this.applyFiltersAndRender();
    this.hideNoteDetails();
  },

  hideNoteDetails: function () {
    const noteDetailsSection = document.querySelector(".note-details-section");
    noteDetailsSection.classList.add("hidden");
  },

  renderNotes: function (notes) {
    const noteList = document.querySelector(".notes");
    noteList.innerHTML = "";

    notes.forEach((note) => {
      const li = document.createElement("li");
      li.classList.add("note-item");
      li.setAttribute("data-note-id", note.id);
      li.setAttribute("draggable", "true"); // 允许拖拽

      // 如果加密，则在标题前面加上锁图标
      let icon = "";
      if (note.isEncrypted) {
        // 判断 tempUnlockedNotes[noteId] 是否为 true
        if (this.tempUnlockedNotes[note.id]) {
          icon = "🔐 "; // 当前会话解锁
        } else {
          icon = "🔒 "; // 未解锁
        }
      }
      li.innerHTML = `<p>${icon}${note.title}</p><button class="delete-note-btn">❌</button>`;

      noteList.appendChild(li);

      // 绑定拖拽事件
      this.bindDragEvents(li);
    });

    this.bindNoteSelection();

    // ======= 新增：更新笔记数量 =======
    const noteCountEl = document.querySelector(".note-count");
    if (noteCountEl) {
      noteCountEl.textContent = `共${notes.length}条笔记`;
    }

    this.bindCategoryDropEvents();
  },

  bindDragEvents: function (noteItem) {
    noteItem.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData(
        "text/plain",
        noteItem.getAttribute("data-note-id")
      );
    });
  },

  bindCategoryDropEvents: function () {
    const folderItems = document.querySelectorAll(".folder-item");

    folderItems.forEach((folder) => {
      folder.addEventListener("dragover", (event) => {
        event.preventDefault(); // 必须阻止默认行为，否则 drop 事件无法触发
        folder.classList.add("drag-over");
      });

      folder.addEventListener("dragleave", () => {
        folder.classList.remove("drag-over");
      });

      folder.addEventListener("drop", (event) => {
        event.preventDefault();
        folder.classList.remove("drag-over");

        const noteId = event.dataTransfer.getData("text/plain");
        const targetFolderId = folder.getAttribute("data-folder");

        // 获取当前笔记的分类
        const note = DataService.getNoteById(noteId);

        folderItems.forEach((item) => item.classList.remove("focused"));
        folder.classList.add("focused");

        if (
          !note ||
          note.categoryId === targetFolderId ||
          targetFolderId === "all"
        ) {
          // 刷新目标分类的笔记列表
          this.loadNotesByCategory(targetFolderId);
          console.log("Note is already in the same folder. No action taken.");
          return;
        }

        // 更新笔记的分类
        DataService.moveNoteToCategory(noteId, targetFolderId);

        // 刷新目标分类的笔记列表
        this.loadNotesByCategory(targetFolderId);
      });
    });
  },

  bindNoteSelection: function () {
    const noteItems = document.querySelectorAll(".note-item");
    noteItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        noteItems.forEach((item) => item.classList.remove("focused"));
        event.currentTarget.classList.add("focused");
        this.showNoteDetails(event.currentTarget.getAttribute("data-note-id"));
      });
    });
  },

  bindEvents: function () {
    document
      .querySelector(".add-note-btn")
      .addEventListener("click", this.addNote.bind(this));
    document
      .querySelector(".notes")
      .addEventListener("click", this.handleNoteClick.bind(this));

    // 绑定搜索
    const searchInput = document.querySelector(".search-bar input");
    searchInput.addEventListener("input", this.handleSearch.bind(this));

    // 新增：绑定排序按钮和下拉列表
    const sortBtn = document.querySelector(".sort-btn");
    const sortDropdown = document.querySelector(".sort-dropdown");

    // 点击“排序”按钮，切换下拉框显示状态
    sortBtn.addEventListener("click", () => {
      sortDropdown.classList.toggle("hidden");
    });

    // 点击下拉框中的选项，设置 currentSortOption 并重新渲染
    sortDropdown.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() === "li") {
        this.currentSortOption = event.target.getAttribute("data-sort");
        // 隐藏下拉框
        sortDropdown.classList.add("hidden");
        // 重新渲染
        this.applyFiltersAndRender();
      }
    });

    const encryptBtn = document.querySelector(".encrypt-toggle-btn");
    const decryptBtn = document.querySelector(".decrypt-toggle-btn");

    encryptBtn.addEventListener("click", () => {
      this.handleEncrypt();
    });

    decryptBtn.addEventListener("click", () => {
      this.handleDecrypt();
    });
  },

  async handleEncrypt() {
    // 获取当前 focused 笔记
    const noteItem = document.querySelector(".note-item.focused");
    if (!noteItem) {
      alert("请先选中一条笔记再进行加密操作。");
      return;
    }
    const noteId = noteItem.getAttribute("data-note-id");
    let note = DataService.getNoteById(noteId);
    if (!note) return;

    // 如果已经加密了，就不继续
    if (note.isEncrypted) {
      alert("当前笔记已加密。请解密后再操作。");
      return;
    }

    // 弹出自定义弹窗，让用户同时输入两遍密码
    const result = await showSetPasswordModal();
    // 如果点击了取消 => result为 null
    if (!result) {
      return; // 放弃设置
    }

    const { pwd1, pwd2 } = result;
    if (!pwd1 || !pwd2) {
      alert("密码不能为空，加密操作取消。");
      return;
    }
    if (pwd1 !== pwd2) {
      alert("两次密码不一致，加密操作取消。");
      return;
    }

    // 设置加密
    note.isEncrypted = true;
    note.password = pwd1;
    DataService.updateNote(note);

    // 隐藏详情页
    const noteDetailsSection = document.querySelector(".note-details-section");
    noteDetailsSection.classList.add("hidden");

    // 重新渲染笔记列表 (加“🔒”或“🔐”)
    this.applyFiltersAndRender();

    alert("笔记已加密！");
  },

  async handleDecrypt() {
    // 获取当前 focused 笔记
    const noteItem = document.querySelector(".note-item.focused");
    if (!noteItem) {
      alert("请先选中一条笔记再进行解密操作。");
      return;
    }
    const noteId = noteItem.getAttribute("data-note-id");
    let note = DataService.getNoteById(noteId);
    if (!note) return;

    // 如果没加密就不处理
    if (!note.isEncrypted) {
      alert("当前笔记未加密。");
      return;
    }

    // 弹出解密对话框...
    const pwd = await showDecryptModal();
    if (pwd === null) {
      // 用户点了取消
      return;
    }

    if (pwd !== note.password) {
      alert("密码错误，无法解密。");
      return;
    }

    // 解密成功
    note.isEncrypted = false;
    note.password = "";
    DataService.updateNote(note);

    // 重新渲染笔记列表
    this.applyFiltersAndRender();

    // =========== 让当前笔记重新获得 focused ===========
    const newNoteItem = document.querySelector(
      `.note-item[data-note-id="${noteId}"]`
    );
    if (newNoteItem) {
      newNoteItem.classList.add("focused");
    }

    // 重新显示详情（此时已不加密）
    this.renderNoteDetails(note);

    alert("笔记已解密！");
  },

  // 统一调用此方法来“获取当前分类的笔记 -> 搜索过滤 -> 排序 -> render”
  applyFiltersAndRender: function () {
    // 1. 获取当前焦点分类
    const currentFolder = document.querySelector(".folder-item.focused");
    const folderId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "all";

    // 2. 获取所有笔记
    let notes = DataService.getNotes();

    // 3. 按分类过滤
    if (folderId !== "all") {
      notes = notes.filter((note) => note.categoryId === folderId);
    }

    // 4. 搜索过滤
    if (this.currentSearchQuery) {
      const q = this.currentSearchQuery;
      notes = notes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(q);
        const contentMatch = note.content.toLowerCase().includes(q);
        return titleMatch || contentMatch;
      });
    }

    // 5. 排序
    if (this.currentSortOption) {
      notes = this.sortNotes(notes, this.currentSortOption);
    }

    // 6. 渲染笔记列表
    this.renderNotes(notes);
  },

  // 排序函数
  sortNotes: function (notes, sortOption) {
    // sortOption 形如 "createTime-asc", "lastModified-desc", "title-asc" 等
    const [key, order] = sortOption.split("-");
    // key: createTime / lastModified / title
    // order: asc / desc

    // 注意：createTime / lastModified 为数值类型，title 是字符串
    notes.sort((a, b) => {
      let compareVal;
      if (key === "title") {
        // 字符串比较
        compareVal = a.title.localeCompare(b.title);
      } else {
        // 时间戳数值比较
        compareVal = a[key] - b[key];
      }

      // 如果是 'desc'，则反转 compareVal
      return order === "asc" ? compareVal : -compareVal;
    });

    return notes;
  },

  handleSearch: function (event) {
    const query = event.target.value.trim().toLowerCase();
    this.searchNotes(query);
  },

  searchNotes: function (query) {
    // 1. 获取当前选中的分类
    const currentFolder = document.querySelector(".folder-item.focused");
    const folderId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "all";

    // 2. 获取所有笔记
    const notes = DataService.getNotes();

    // 3. 如果当前分类不是"all"，先按分类过滤
    let filteredNotes =
      folderId === "all"
        ? notes
        : notes.filter((note) => note.categoryId === folderId);

    // 4. 如果搜索关键词非空，再进行二次过滤（标题或内容包含关键字）
    if (query) {
      filteredNotes = filteredNotes.filter((note) => {
        const titleMatch = note.title.includes(query);
        const contentMatch = note.content.includes(query);
        return titleMatch || contentMatch;
      });
    }

    // 5. 重新渲染笔记列表
    this.renderNotes(filteredNotes);

    // 如果需要在搜索时隐藏右侧详情，可以根据需求做额外处理
    this.hideNoteDetails();
  },

  // 其余函数如 addNote、handleNoteClick、showNoteDetails 等处
  // 新建笔记时，为笔记自动加上 createTime / lastModified
  addNote: function () {
    const currentFolder = document.querySelector(".folder-item.focused");
    const categoryId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "uncategorized";

    const noteTitle = prompt("请输入笔记标题：");
    if (noteTitle) {
      const newNote = {
        id: Date.now().toString(),
        title: noteTitle,
        content: "",
        categoryId: categoryId,
        createTime: Date.now(),
        lastModified: Date.now(),
      };

      DataService.addNote(newNote);
      // 添加完毕后，重新渲染
      this.loadNotesByCategory(categoryId);

      // 设置新建的笔记为 focused
      setTimeout(() => {
        const newNoteItem = document.querySelector(
          `.note-item[data-note-id="${newNote.id}"]`
        );
        if (newNoteItem) {
          newNoteItem.classList.add("focused");
          this.showNoteDetails(newNote.id);
        }
      }, 100);
    }
  },

  handleNoteClick: function (event) {
    if (event.target.classList.contains("delete-note-btn")) {
      const noteId = event.target
        .closest(".note-item")
        .getAttribute("data-note-id");
      DataService.deleteNote(noteId);
      this.loadNotes();
    }
  },

  showNoteDetails: async function (noteId) {
    const note = DataService.getNoteById(noteId);
    if (!note) return;

    if (note.isEncrypted) {
      // 如果本会话中已经解锁过，就直接render
      if (!this.tempUnlockedNotes[noteId]) {
        // 否则要弹窗输入密码
        while (true) {
          const pwd = await showPasswordModal();
          // 如果用户点击取消 => pwd 为 null
          if (pwd === null) {
            return; // 直接不显示详情
          }
          if (pwd === note.password) {
            // 正确 => 标记临时解锁
            this.tempUnlockedNotes[noteId] = true;

            this.renderNotes(DataService.getNotes());
            const newNoteItem = document.querySelector(
              `.note-item[data-note-id="${noteId}"]`
            );
            if (newNoteItem) {
              newNoteItem.classList.add("focused");
            }
            break; // 跳出 while 循环
          } else {
            alert("密码错误，请重新输入或取消。");
          }
        }
      }
    }

    // 如果笔记未加密 或 本会话中已解锁 => 显示详情
    this.renderNoteDetails(note);
  },

  renderNoteDetails(note) {
    let noteTitleInput = document.querySelector(".note-title");
    let noteContentInput = document.querySelector(".note-content");
    const noteDetailsSection = document.querySelector(".note-details-section");

    // 替换旧 input
    let newTitleInput = noteTitleInput.cloneNode(true);
    let newContentInput = noteContentInput.cloneNode(true);
    noteTitleInput.replaceWith(newTitleInput);
    noteContentInput.replaceWith(newContentInput);

    noteTitleInput = newTitleInput;
    noteContentInput = newContentInput;

    // 显示笔记详情
    noteDetailsSection.classList.remove("hidden");

    // 设置当前笔记内容
    noteTitleInput.value = note.title;
    noteContentInput.value = note.content;

    // ======= 显示时间 =======
    const createTimeEl = document.querySelector(".note-create-time");
    const lastModifiedEl = document.querySelector(".note-last-modified");
    if (createTimeEl) {
      createTimeEl.textContent = note.createTime
        ? new Date(note.createTime).toLocaleString()
        : "无";
    }
    if (lastModifiedEl) {
      lastModifiedEl.textContent = note.lastModified
        ? new Date(note.lastModified).toLocaleString()
        : "无";
    }

    // ====== 监听编辑，实时更新 ======
    noteTitleInput.addEventListener("input", () => {
      note.title = noteTitleInput.value;
      DataService.updateNote(note);
      // 更新lastModified
      if (lastModifiedEl) {
        lastModifiedEl.textContent = new Date(
          note.lastModified
        ).toLocaleString();
      }
    });

    noteContentInput.addEventListener("input", () => {
      note.content = noteContentInput.value;
      DataService.updateNote(note);
      // 同理
      if (lastModifiedEl) {
        lastModifiedEl.textContent = new Date(
          note.lastModified
        ).toLocaleString();
      }
    });

    // 根据笔记是否加密，动态显示 加密按钮/解密按钮
    const encryptBtn = document.querySelector(".encrypt-toggle-btn");
    const decryptBtn = document.querySelector(".decrypt-toggle-btn");
    if (note.isEncrypted) {
      // 显示“解密”按钮，隐藏“加密”按钮
      encryptBtn.classList.add("hidden-encrypt-btn");
      decryptBtn.classList.remove("hidden-encrypt-btn");
    } else {
      // 显示“加密”按钮，隐藏“解密”按钮
      encryptBtn.classList.remove("hidden-encrypt-btn");
      decryptBtn.classList.add("hidden-encrypt-btn");
    }
  },
};

NoteList.init();
