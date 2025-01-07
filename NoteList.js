// NoteList.js - Handles note list management

const NoteList = {
  init: function () {
    this.loadNotes();
    this.bindEvents();
    this.bindCategoryDropEvents(); // 确保拖放事件在初始化时绑定
  },

  loadNotes: function () {
    const notes = DataService.getNotes();
    this.renderNotes(notes);
    this.bindCategoryDropEvents(); // 每次更新列表时重新绑定
  },

  loadNotesByCategory: function (folderId) {
    const notes = DataService.getNotes();
    let filteredNotes;

    if (folderId === "all") {
      filteredNotes = notes;
    } else {
      filteredNotes = notes.filter((note) => note.categoryId === folderId);
    }

    this.renderNotes(filteredNotes);
    this.hideNoteDetails();
    this.bindCategoryDropEvents(); // 确保分类项的拖放事件被绑定
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
      li.innerHTML = `<p>${note.title}</p><button class="delete-note-btn">❌</button>`;
      noteList.appendChild(li);

      // 绑定拖拽事件
      this.bindDragEvents(li);
    });

    this.bindNoteSelection();
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
  },

  addNote: function () {
    // 获取当前选中的分类
    const currentFolder = document.querySelector(".folder-item.focused");
    const categoryId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "uncategorized";

    // 输入新笔记标题
    const noteTitle = prompt("请输入笔记标题：");
    if (noteTitle) {
      const newNote = {
        id: Date.now().toString(),
        title: noteTitle,
        content: "",
        categoryId: categoryId,
      };

      // 添加笔记到数据存储
      DataService.addNote(newNote);
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

  showNoteDetails: function (noteId) {
    const note = DataService.getNoteById(noteId);
    if (note) {
      let noteTitleInput = document.querySelector(".note-title");
      let noteContentInput = document.querySelector(".note-content");

      // 移除之前绑定的所有事件监听器
      let newTitleInput = noteTitleInput.cloneNode(true);
      let newContentInput = noteContentInput.cloneNode(true);

      noteTitleInput.replaceWith(newTitleInput);
      noteContentInput.replaceWith(newContentInput);

      // 更新变量引用
      noteTitleInput = newTitleInput;
      noteContentInput = newContentInput;

      // 设置当前笔记内容
      noteTitleInput.value = note.title;
      noteContentInput.value = note.content;

      // 显示笔记详情
      const noteDetailsSection = document.querySelector(
        ".note-details-section"
      );
      noteDetailsSection.classList.remove("hidden");

      // 绑定新的事件监听器
      noteTitleInput.addEventListener("input", () => {
        note.title = noteTitleInput.value;
        DataService.updateNote(note);
      });

      noteContentInput.addEventListener("input", () => {
        note.content = noteContentInput.value;
        DataService.updateNote(note);
      });
    }
  },
};

NoteList.init();
