// CloudDataService.js - Now using fetch + PHP + SQLite

const CloudDataService = {
  // ========== 分类相关 ==========

  async getCategories() {
    const res = await fetch("/api.php?action=getCategories");
    const data = await res.json();
    return data; // array
  },

  async addCategory(category) {
    // category: {id, name}
    const res = await fetch("/api.php?action=addCategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    return await res.json(); // {success:true, id:xxx}
  },

  async updateCategoryName(categoryId, newName) {
    const payload = { categoryId, newName };
    const res = await fetch("/api.php?action=updateCategoryName", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async deleteCategory(categoryId) {
    const payload = { categoryId };
    const res = await fetch("/api.php?action=deleteCategory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async moveNotesToUncategorized(categoryId) {
    const payload = { categoryId };

    const res = await fetch("/api.php?action=moveNotesToUncategorized", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  // ========== 笔记相关 ==========

  async getNotes() {
    const res = await fetch("/api.php?action=getNotes");
    return await res.json(); // array of notes
  },

  async addNote(note) {
    const res = await fetch("/api.php?action=addNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    return await res.json(); // {success:true}
  },

  async moveNoteToCategory(noteId, categoryId) {
    const payload = { noteId, categoryId };
    const res = await fetch("/api.php?action=moveNoteToCategory", {
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
    const res = await fetch("/api.php?action=updateNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedNote),
    });
    return await res.json(); // {success:true, lastModified:xxx}
  },

  async deleteNote(noteId) {
    const payload = { noteId };
    const res = await fetch("/api.php?action=deleteNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async moveNoteToTrash(noteId) {
    const payload = { noteId };
    const res = await fetch("/api.php?action=moveNoteToTrash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async restoreNoteFromTrash(noteId) {
    const payload = { noteId };
    const res = await fetch("/api.php?action=restoreNoteFromTrash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async permanentlyDeleteNote(noteId) {
    const payload = { noteId };
    const res = await fetch("/api.php?action=permanentlyDeleteNote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  },

  async uploadFile(file, filename) {
    const formData = new FormData();
    formData.append("file", file, filename);

    const res = await fetch("/api.php?action=uploadFile", {
      method: "POST",
      body: formData,
    });

    return await res.json(); // {success:true, url:xxx}
  },
};
