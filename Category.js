// Category.js - Handles category management

const Category = {
  init: function () {
    this.loadCategories();
    this.bindEvents();
    this.defaultFocus();
  },

  loadCategories: function () {
    const categories = DataService.getCategories();
    const folderList = document.querySelector(".folder-list");
    folderList.innerHTML = "";

    // 添加默认分类项 "全部笔记" 和 "未分类"
    const defaultCategories = [
      { id: "all", name: "全部笔记" },
      { id: "uncategorized", name: "未分类" },
      { id: "trash", name: "回收站" },
    ];

    defaultCategories.forEach((category) => {
      const li = document.createElement("li");
      li.classList.add("folder-item");
      li.textContent = category.name;
      li.setAttribute("data-folder", category.id);
      folderList.appendChild(li);
    });

    // 添加用户创建的分类项
    categories.forEach((category) => {
      if (category.id !== "all" && category.id !== "uncategorized") {
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

    this.bindCategorySelection();
  },

  defaultFocus: function () {
    // 默认选择 "全部笔记"
    const allNotesItem = document.querySelector(
      '.folder-item[data-folder="all"]'
    );
    if (allNotesItem) {
      allNotesItem.classList.add("focused");
      NoteList.loadNotesByCategory("all");
    }
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

  addCategory: function () {
    const categoryName = prompt("请输入新的分类名称：");
    if (categoryName) {
      DataService.addCategory({
        id: Date.now().toString(),
        name: categoryName,
      });
      this.loadCategories();
    }
  },

  editCategory: function (categoryId) {
    const newCategoryName = prompt("请输入新的分类名称：");
    if (newCategoryName) {
      DataService.updateCategoryName(categoryId, newCategoryName);
      this.loadCategories();
    }
  },

  deleteCategory: function (categoryId) {
    const confirmDelete = confirm(
      "确定要删除该分类吗？分类下的笔记将移动到未分类。"
    );
    if (confirmDelete) {
      DataService.moveNotesToUncategorized(categoryId);
      DataService.deleteCategory(categoryId);
      this.loadCategories();
    }
  },
};

Category.init();
