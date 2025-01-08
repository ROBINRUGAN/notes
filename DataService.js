// DataService.js - Handles data storage and retrieval

const DataService = {
  // 获取所有分类
  getCategories: function () {
    return JSON.parse(localStorage.getItem("categories")) || [];
  },

  // 添加分类
  addCategory: function (category) {
    const categories = this.getCategories();
    categories.push(category);
    localStorage.setItem("categories", JSON.stringify(categories));
  },

  // 更新分类名称
  updateCategoryName: function (categoryId, newName) {
    let categories = this.getCategories();
    categories = categories.map((category) =>
      category.id === categoryId ? { ...category, name: newName } : category
    );
    localStorage.setItem("categories", JSON.stringify(categories));
  },

  // 删除分类
  deleteCategory: function (categoryId) {
    let categories = this.getCategories();
    categories = categories.filter((category) => category.id !== categoryId);
    localStorage.setItem("categories", JSON.stringify(categories));
  },

  // 将分类下的笔记移动到 "未分类"
  moveNotesToUncategorized: function (categoryId) {
    let notes = this.getNotes();
    notes = notes.map((note) =>
      note.categoryId === categoryId
        ? { ...note, categoryId: "uncategorized" }
        : note
    );
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  // 获取所有笔记
  getNotes: function () {
    return JSON.parse(localStorage.getItem("notes")) || [];
  },

  addNote: function (note) {
    const notes = this.getNotes();
    // 如果外部没有指定 isEncrypted，就默认为 false
    if (note.isEncrypted === undefined) {
      note.isEncrypted = false;
    }
    if (!note.password) {
      note.password = ""; // 默认没有密码
    }
    notes.push(note);
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  moveNoteToCategory: function (noteId, categoryId) {
    let notes = this.getNotes();
    notes = notes.map((note) => {
      if (note.id === noteId) {
        note.categoryId = categoryId;
      }
      return note;
    });
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  getNoteById: function (noteId) {
    const notes = this.getNotes();
    return notes.find((note) => note.id === noteId);
  },

  updateNote: function (updatedNote) {
    let notes = this.getNotes();
    notes = notes.map((note) => {
      if (note.id === updatedNote.id) {
        // 当我们更新笔记时，刷新 lastModified 字段
        updatedNote.lastModified = Date.now();
        return { ...note, ...updatedNote };
      }
      return note;
    });
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  deleteNote: function (noteId) {
    let notes = this.getNotes();
    notes = notes.filter((note) => note.id !== noteId);
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  // 把笔记移动到垃圾箱
  moveNoteToTrash: function (noteId) {
    let notes = this.getNotes();
    notes = notes.map((note) => {
      if (note.id === noteId) {
        // 记录原分类
        note.previousCategoryId = note.categoryId;
        // 设置当前分类为 "trash"
        note.categoryId = "trash";
      }
      return note;
    });
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  // 从垃圾箱还原笔记
  restoreNoteFromTrash: function (noteId) {
    let notes = this.getNotes();
    notes = notes.map((note) => {
      if (note.id === noteId && note.categoryId === "trash") {
        // 还原回原分类
        if (note.previousCategoryId) {
          note.categoryId = note.previousCategoryId;
        } else {
          // 如果没有记录，就还原到 "uncategorized" 或其它
          note.categoryId = "uncategorized";
        }
        note.previousCategoryId = ""; // 清空原分类记录
      }
      return note;
    });
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  // 真正删除笔记
  permanentlyDeleteNote: function (noteId) {
    let notes = this.getNotes();
    notes = notes.filter((note) => note.id !== noteId);
    localStorage.setItem("notes", JSON.stringify(notes));
  },
};
