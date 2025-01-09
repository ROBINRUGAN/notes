// Category.js - Handles category management

const Category = {
  init: function () {
    this.loadCategories();
    this.bindEvents();
  },

  loadCategories: async function () {
    const categories = await CloudDataService.getCategories();
    const folderList = document.querySelector(".folder-list");

    // 添加用户创建的分类项
    categories.forEach((category) => {
      if (
        category.id != "all" &&
        category.id != "uncategorized" &&
        category.id != "trash"
      ) {
        const li = document.createElement("li");
        li.classList.add("folder-item");
        li.setAttribute("data-folder", category.id);

        // 分类名称
        const p = document.createElement("p");
        p.textContent = category.name;
        li.appendChild(p);

        // 编辑按钮
        const editBtn = document.createElement("button");
        editBtn.classList.add("edit-note-btn");
        editBtn.textContent = "✏️";
        editBtn.addEventListener("click", () => this.editCategory(category.id));
        li.appendChild(editBtn);

        // 删除按钮
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-note-btn");
        deleteBtn.textContent = "❌";
        deleteBtn.addEventListener("click", () =>
          this.deleteCategory(category.id)
        );
        li.appendChild(deleteBtn);

        folderList.appendChild(li);
      }
    });
    NoteList.bindCategoryDropEvents(); // 确保拖放事件在初始化时绑定
    this.bindCategorySelection();
  },

  bindEvents: function () {
    document
      .querySelector(".add-folder")
      .addEventListener("click", this.addCategory.bind(this));
  },

  bindCategorySelection: function () {
    const folderItems = document.querySelectorAll(".folder-item");
    folderItems.forEach((item) => {
      item.addEventListener("click", (event) => {
        // 移除其他分类的 focused 类
        folderItems.forEach((item) => item.classList.remove("focused"));
        // 给当前选中的分类添加 focused 类
        event.currentTarget.classList.add("focused");
        // 更新笔记列表
        const folderId = event.currentTarget.getAttribute("data-folder");
        NoteList.loadNotesByCategory(folderId);
      });
    });
  },

  addCategory: async function () {
    const categoryName = prompt("请输入新的分类名称：");
    const id = Date.now().toString();
    if (categoryName) {
      await CloudDataService.addCategory({
        id: id,
        name: categoryName,
      });
      // this.loadCategories();
      // 优化：只添加新分类项
      const folderList = document.querySelector(".folder-list");
      const li = document.createElement("li");
      li.classList.add("folder-item");
      li.setAttribute("data-folder", id);
      const p = document.createElement("p");
      p.textContent = categoryName;
      li.appendChild(p);
      const editBtn = document.createElement("button");
      editBtn.classList.add("edit-note-btn");
      editBtn.textContent = "✏️";
      editBtn.addEventListener("click", () => this.editCategory(id));
      li.appendChild(editBtn);
      const deleteBtn = document.createElement("button");
      deleteBtn.classList.add("delete-note-btn");

      deleteBtn.textContent = "❌";
      deleteBtn.addEventListener("click", () => this.deleteCategory(id));
      li.appendChild(deleteBtn);
      folderList.appendChild(li);
      this.bindCategorySelection();
    }
  },

  editCategory: async function (categoryId) {
    const newCategoryName = prompt("请输入新的分类名称：");
    if (newCategoryName) {
      await CloudDataService.updateCategoryName(categoryId, newCategoryName);
      // this.loadCategories();
      // 优化：只更新当前分类项的名称
      const folderItems = document.querySelectorAll(".folder-item");
      folderItems.forEach((item) => {
        if (item.getAttribute("data-folder") === categoryId) {
          item.querySelector("p").textContent = newCategoryName;
        }
      });
    }
  },

  deleteCategory: async function (categoryId) {
    const confirmDelete = confirm(
      "确定要删除该分类吗？分类下的笔记将移动到未分类。"
    );
    if (confirmDelete) {
      await CloudDataService.moveNotesToUncategorized(categoryId);
      await CloudDataService.deleteCategory(categoryId);
      // this.loadCategories();
      // 优化：只删除当前分类项
      const folderItems = document.querySelectorAll(".folder-item");
      folderItems.forEach((item) => {
        if (item.getAttribute("data-folder") === categoryId) {
          item.remove();
        }
      });
    }
  },
};

Category.init();
