// CloudDataService.js - Now using fetch + PHP + SQLite

const CloudDataService = {
  // ========== 分类相关 ==========

  async getCategories() {
    const res = await fetch("../server/api.php?action=getCategories");
    const data = await res.json();
    return data;
  },

  async addCategory(category) {
    const res = await fetch("../server/api.php?action=addCategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    return await res.json();
  },

  async updateCategoryName(categoryId, newName) {
    const payload = { categoryId, newName };
    const res = await fetch("../server/api.php?action=updateCategoryName", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async deleteCategory(categoryId) {
    const payload = { categoryId };
    const res = await fetch("../server/api.php?action=deleteCategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async moveNotesToUncategorized(categoryId) {
    const payload = { categoryId };

    const res = await fetch(
      "../server/api.php?action=moveNotesToUncategorized",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    return await res.json();
  },

  // ========== 笔记相关 ==========

  async getNotes() {
    const res = await fetch("../server/api.php?action=getNotes");
    return await res.json();
  },

  async addNote(note) {
    const res = await fetch("../server/api.php?action=addNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    return await res.json(); // {success:true}
  },

  async moveNoteToCategory(noteId, categoryId) {
    const payload = { noteId, categoryId };
    const res = await fetch("../server/api.php?action=moveNoteToCategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async getNoteById(noteId) {
    // 先获取所有notes,再过滤
    const notes = await this.getNotes();
    return notes.find((note) => note.id === noteId);
  },

  async updateNote(updatedNote) {
    const res = await fetch("../server/api.php?action=updateNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedNote),
    });
    return await res.json(); // {success:true, lastModified:xxx}
  },

  async deleteNote(noteId) {
    const payload = { noteId };
    const res = await fetch("../server/api.php?action=deleteNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async moveNoteToTrash(noteId) {
    const payload = { noteId };
    const res = await fetch("../server/api.php?action=moveNoteToTrash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async restoreNoteFromTrash(noteId) {
    const payload = { noteId };
    const res = await fetch("../server/api.php?action=restoreNoteFromTrash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async permanentlyDeleteNote(noteId) {
    const payload = { noteId };
    const res = await fetch("../server/api.php?action=permanentlyDeleteNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async uploadFile(file, filename) {
    const formData = new FormData();
    formData.append("file", file, filename);

    const res = await fetch("../server/api.php?action=uploadFile", {
      method: "POST",
      body: formData,
    });

    return await res.json(); // {success:true, url:xxx}
  },

  async login(username, password) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch("../server/api.php?action=login", {
      method: "POST",
      body: formData,
    });
    return await res.json(); // {success:true, msg:"", ...}
  },

  async register(username, password) {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const res = await fetch("../server/api.php?action=register", {
      method: "POST",
      body: formData,
    });
    return await res.json(); // {success:true, msg:"", ...}
  },

  async checkSession() {
    const res = await fetch("../server/api.php?action=checkSession");
    return await res.json(); // {loggedIn:true/false}
  },

  async logout() {
    const res = await fetch("../server/api.php?action=logout");
    return await res.json(); // {success:true}
  },
};
