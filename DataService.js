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
    notes.push(note);
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  getNoteById: function (noteId) {
    const notes = this.getNotes();
    return notes.find((note) => note.id === noteId);
  },

  updateNote: function (updatedNote) {
    let notes = this.getNotes();
    notes = notes.map((note) =>
      note.id === updatedNote.id ? updatedNote : note
    );
    localStorage.setItem("notes", JSON.stringify(notes));
  },

  deleteNote: function (noteId) {
    let notes = this.getNotes();
    notes = notes.filter((note) => note.id !== noteId);
    localStorage.setItem("notes", JSON.stringify(notes));
  },
};
