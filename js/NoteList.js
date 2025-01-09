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

    // 判断当前分类是否是垃圾箱
    const currentFolder = document.querySelector(".folder-item.focused");
    const folderId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "all";
    const isTrash = folderId === "trash";

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
      // 使用 highlightedTitle 替代原始 title
      li.innerHTML = `<p>${icon}${note.highlightedTitle || note.title}</p>${isTrash
        ? '<button class="perm-delete-note-btn">❌</button><button class="restore-note-btn">↩️</button>'
        : '<button class="delete-note-btn">❌</button>'
        }`;

      noteList.appendChild(li);
      this.bindDragEvents(li);
    });
    // ======= 新增：更新笔记数量 =======
    const noteCountEl = document.querySelector(".note-count");
    if (noteCountEl) {
      noteCountEl.textContent = `共${notes.length}条笔记`;
    }
  },

  bindDragEvents: function (noteItem) {
    noteItem.removeEventListener("dragstart", () => { });

    noteItem.addEventListener("dragstart", (event) => {
      event.stopPropagation();
      event.dataTransfer.setData(
        "text/plain",
        noteItem.getAttribute("data-note-id")
      );
    });
  },

  bindCategoryDropEvents: async function () {
    const folderItems = document.querySelectorAll(".folder-item");
    folderItems.forEach((folder) => {
      // 先清空EventListener
      folder.removeEventListener("dragover", () => { });
      folder.removeEventListener("dragleave", () => { });
      folder.removeEventListener("drop", () => { });

      folder.addEventListener("dragover", (event) => {
        event.preventDefault(); // 必须阻止默认行为，否则 drop 事件无法触发
        event.stopPropagation();
        folder.classList.add("drag-over");
      });

      folder.addEventListener("dragleave", () => {
        folder.classList.remove("drag-over");
      });

      folder.addEventListener("drop", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        folder.classList.remove("drag-over");

        const noteId = event.dataTransfer.getData("text/plain");
        const targetFolderId = folder.getAttribute("data-folder");

        // 获取当前笔记的分类
        const note = await CloudDataService.getNoteById(noteId);

        if (
          !note ||
          note.categoryId === targetFolderId ||
          targetFolderId === "all"
        ) {
          return;
        }

        if (note.categoryId === "trash") {
          const confirmRestore = confirm("确认要将该笔记还原到指定分类吗？");

          if (confirmRestore) {
            await CloudDataService.moveNoteToCategory(noteId, targetFolderId);
            this.applyFiltersAndRender();
            folderItems.forEach((item) => item.classList.remove("focused"));
            folder.classList.add("focused");
            this.applyFiltersAndRender();
          }
          return;
        }

        if (targetFolderId === "trash") {
          const confirmDelete = confirm("确定要删除该笔记吗？将移动到垃圾箱。");
          if (confirmDelete) {
            await CloudDataService.moveNoteToTrash(noteId);
            folderItems.forEach((item) => item.classList.remove("focused"));
            folder.classList.add("focused");
            this.applyFiltersAndRender();
          }
          return;
        }
        folderItems.forEach((item) => item.classList.remove("focused"));
        folder.classList.add("focused");
        // 更新笔记的分类
        await CloudDataService.moveNoteToCategory(noteId, targetFolderId);

        // 重新渲染
        this.applyFiltersAndRender();
      });
    });
  },

  bindEvents: function () {
    document
      .querySelector(".add-note-btn")
      .addEventListener("click", this.addNote.bind(this));

    // 2) 在 .notes 容器上事件委托
    const notesContainer = document.querySelector(".notes");
    notesContainer.addEventListener("click", this.handleNotesClick.bind(this));

    const searchInput = document.querySelector(".search-bar input");
    searchInput.addEventListener("input", this.handleSearch.bind(this));

    const sortBtn = document.querySelector(".sort-btn");
    const sortDropdown = document.querySelector(".sort-dropdown");

    sortBtn.addEventListener("click", () => {
      sortDropdown.classList.toggle("hidden");
    });

    sortDropdown.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() === "li") {
        this.currentSortOption = event.target.getAttribute("data-sort");
        sortDropdown.classList.add("hidden");
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

    const exportBtn = document.querySelector(".export-btn");
    const exportDropdown = document.querySelector(".export-dropdown");

    exportBtn.addEventListener("click", () => {
      exportDropdown.classList.toggle("hidden");
    });

    exportDropdown.addEventListener("click", (event) => {
      if (event.target.tagName.toLowerCase() === "li") {
        const exportType = event.target.getAttribute("data-export"); // "pdf" or "markdown"
        this.handleExport(currentNote, exportType);
        exportDropdown.classList.add("hidden");
      }
    });
  },

  handleExport: function (note, exportType) {
    // 安全处理文件名：去掉某些非法字符
    const safeTitle = (note.title || "未命名").replace(
      /[\\\/:\*\?"<>\|]/g,
      "_"
    );

    if (exportType === "pdf") {
      const hiddenDiv = document.createElement("div");
      hiddenDiv.innerHTML = `
      <style>
        .pdf-container {
          width: 100%;
          max-width: 595pt; /* A4纸宽度 */
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 10px auto;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        code { padding: 0.2em 0.4em; background-color: rgba(27,31,35,0.05); border-radius: 3px; }
        pre { padding: 16px; overflow: auto; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; }
        pre code { padding: 0; background-color: transparent; }
        blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; }
        table { border-spacing: 0; border-collapse: collapse; }
        td, th { padding: 6px 13px; border: 1px solid #dfe2e5; }
        
      </style>
        <h1>${note.title}</h1>
        <div>${marked.parse(note.content || "")}</div>
      `;

      // 将所有图片转换为 base64
      const convertImagesToBase64 = async (div) => {
        const images = div.getElementsByTagName("img");
        const promises = Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              const tempImg = new Image();
              tempImg.crossOrigin = "anonymous"; // 添加这行

              tempImg.onload = function () {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = tempImg.width;
                  canvas.height = tempImg.height;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(tempImg, 0, 0);
                  img.src = canvas.toDataURL("image/png");
                } catch (e) {
                  console.error("Canvas export failed:", e);
                  // 如果转换失败，保留原始图片
                }
                resolve();
              };
              tempImg.src = img.src;
            })
        );

        return Promise.all(promises);
      };

      const opt = {
        margin: 24,
        filename: safeTitle + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: true, // 启用日志以便调试
          allowTaint: true, // 允许使用跨域图片
          useCORS: true, // 使用跨域
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      };

      // 等待所有图片加载完成后再生成PDF
      convertImagesToBase64(hiddenDiv).then(() => {
        html2pdf().set(opt).from(hiddenDiv).save();
      });
    } else if (exportType === "markdown") {
      // 加上标题和时间
      const markdownContent = `# ${note.title}\n\n${note.content || ""}`;

      const blob = new Blob([markdownContent], { type: "text/markdown" });
      // const blob = new Blob([note.content || ""], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = safeTitle + ".md";
      link.click();

      URL.revokeObjectURL(url);
    } else if (exportType === "pdf-link") {
      const hiddenDiv = document.createElement("div");

      hiddenDiv.innerHTML = `
      <style>
        .pdf-container {
          width: 100%;
          max-width: 595pt; /* A4纸宽度 */
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 10px auto;
        }
        h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        h1 { font-size: 2em; }
        h2 { font-size: 1.5em; }
        code { padding: 0.2em 0.4em; background-color: rgba(27,31,35,0.05); border-radius: 3px; }
        pre { padding: 16px; overflow: auto; line-height: 1.45; background-color: #f6f8fa; border-radius: 3px; }
        pre code { padding: 0; background-color: transparent; }
        blockquote { padding: 0 1em; color: #6a737d; border-left: 0.25em solid #dfe2e5; }
        table { border-spacing: 0; border-collapse: collapse; }
        td, th { padding: 6px 13px; border: 1px solid #dfe2e5; }
        
      </style>
        <h1>${note.title}</h1>
        <div>${marked.parse(note.content || "")}</div>
      `;

      // 将所有图片转换为 base64
      const convertImagesToBase64 = async (div) => {
        const images = div.getElementsByTagName("img");
        const promises = Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              const tempImg = new Image();
              tempImg.crossOrigin = "anonymous"; // 添加这行

              tempImg.onload = function () {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = tempImg.width;
                  canvas.height = tempImg.height;
                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(tempImg, 0, 0);
                  img.src = canvas.toDataURL("image/png");
                } catch (e) {
                  console.error("Canvas export failed:", e);
                  // 如果转换失败，保留原始图片
                }
                resolve();
              };
              tempImg.src = img.src;
            })
        );

        return Promise.all(promises);
      };

      const opt = {
        margin: 24,
        filename: safeTitle + ".pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: true, // 启用日志以便调试
          allowTaint: true, // 允许使用跨域图片
          useCORS: true, // 使用跨域
        },
        jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
      };

      convertImagesToBase64(hiddenDiv).then(() => {
        html2pdf()
          .set(opt)
          .from(hiddenDiv)
          .outputPdf("blob")
          .then(function (pdfBlob) {
            CloudDataService.uploadFile(pdfBlob, `${safeTitle}.pdf`)
              .then((data) => {
                if (data.success) {
                  const url = data.url;
                  navigator.clipboard.writeText(url).then(
                    function () {
                      alert("链接已生成，已复制到剪切板。");
                    },
                    function (err) {
                      console.error("无法复制到剪切板: ", err);
                    }
                  );
                } else {
                  console.error("上传失败: ", data.error);
                }
              })
              .catch((error) => {
                console.error("上传失败: ", error);
              });
          });
      });
    } else if (exportType === "markdown-link") {
      const markdownContent = `# ${note.title}\n\n${note.content || ""}`;

      const blob = new Blob([markdownContent], { type: "text/markdown" });
      CloudDataService.uploadFile(blob, `${safeTitle}.md`)
        .then((data) => {
          if (data.success) {
            const url = data.url;
            navigator.clipboard.writeText(url).then(
              function () {
                alert("链接已生成，已复制到剪切板。");
              },
              function (err) {
                console.error("无法复制到剪切板: ", err);
              }
            );
          } else {
            console.error("上传失败: ", data.error);
          }
        })
        .catch((error) => {
          console.error("上传失败: ", error);
        });
    }
  },

  handleNotesClick: async function (event) {
    const noteItem = event.target.closest(".note-item");
    if (!noteItem) return; // 点到空白，不做事

    const noteId = noteItem.getAttribute("data-note-id");
    if (!noteId) return;

    // 1) 如果是删除按钮
    if (event.target.classList.contains("delete-note-btn")) {
      event.stopPropagation();
      event.preventDefault();
      const confirmDelete = confirm("确定要删除该笔记吗？将移动到垃圾箱。");
      if (confirmDelete) {
        await CloudDataService.moveNoteToTrash(noteId);
        this.loadNotes();
      }
      return;
    }

    // 2) 如果是彻底删除
    if (event.target.classList.contains("perm-delete-note-btn")) {
      event.stopPropagation();
      event.preventDefault();
      const confirmPermDelete = confirm("此操作不可恢复，确定要彻底删除吗？");
      if (confirmPermDelete) {
        await CloudDataService.permanentlyDeleteNote(noteId);
        this.loadNotes();
      }
      return;
    }

    // 3) 如果是还原
    if (event.target.classList.contains("restore-note-btn")) {
      event.stopPropagation();
      event.preventDefault();
      const confirmRestore = confirm("确认要还原此笔记吗？");
      if (confirmRestore) {
        await CloudDataService.restoreNoteFromTrash(noteId);
        this.loadNotes();
      }
      return;
    }

    // 4) 如果点击的既不是删除/彻底删除/还原 => 显示笔记详情
    //    (说明点到了 note-item 的其他地方，比如标题p)
    //    => 不要阻止冒泡 => 继续处理
    // 先让当前 noteItem focused
    // 取消其他 .note-item 的 focused
    const allItems = document.querySelectorAll(".note-item");
    allItems.forEach((i) => i.classList.remove("focused"));
    noteItem.classList.add("focused");

    this.showNoteDetails(noteId);
  },

  async handleEncrypt() {
    // 获取当前 focused 笔记
    const noteItem = document.querySelector(".note-item.focused");
    if (!noteItem) {
      alert("请先选中一条笔记再进行加密操作。");
      return;
    }
    const noteId = noteItem.getAttribute("data-note-id");
    let note = await CloudDataService.getNoteById(noteId);
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
    await CloudDataService.updateNote(note);

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
    let note = await CloudDataService.getNoteById(noteId);
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
    await CloudDataService.updateNote(note);

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
  applyFiltersAndRender: async function () {
    // 1. 获取当前焦点分类
    const currentFolder = document.querySelector(".folder-item.focused");

    const folderId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "all";

    // 2. 获取所有笔记
    let notes = await CloudDataService.getNotes();

    // 3. 按分类过滤
    if (folderId === "all") {
      // 排除垃圾箱
      notes = notes.filter((note) => note.categoryId !== "trash");
    } else {
      // 只显示该分类
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
    const [key, order] = sortOption.split("-");
    notes.sort((a, b) => {
      let compareVal;
      if (key === "title") {
        compareVal = a.title.localeCompare(b.title);
      } else {
        compareVal = a[key] - b[key];
      }
      return order === "asc" ? compareVal : -compareVal;
    });

    return notes;
  },

  handleSearch: function (event) {
    const query = event.target.value.trim().toLowerCase();
    this.searchNotes(query);
  },

  searchNotes: async function (query) {
    // 1. 获取当前选中的分类
    const currentFolder = document.querySelector(".folder-item.focused");
    const folderId = currentFolder
      ? currentFolder.getAttribute("data-folder")
      : "all";

    // 2. 获取所有笔记
    const notes = await CloudDataService.getNotes();

    // 3. 如果当前分类不是"all"，先按分类过滤
    let filteredNotes =
      folderId === "all"
        ? notes
        : notes.filter((note) => note.categoryId === folderId);

    // 4. 如果搜索关键词非空，进行过滤和标题处理
    if (query) {
      filteredNotes = filteredNotes.filter((note) => {
        const titleMatch = note.title.toLowerCase().includes(query);
        const contentMatch = note.content.toLowerCase().includes(query);

        // 添加高亮标记的标题
        if (titleMatch) {
          note.highlightedTitle = note.title.replace(
            new RegExp(query, 'gi'),
            match => `<mark>${match}</mark>`
          );
        } else {
          note.highlightedTitle = note.title;
        }

        return titleMatch || contentMatch;
      });
    } else {
      // 清空搜索时，清除高亮标记
      filteredNotes.forEach(note => {
        note.highlightedTitle = note.title;
      });
    }

    // 5. 重新渲染笔记列表
    this.renderNotes(filteredNotes);

    // 如果需要在搜索时隐藏右侧详情，可以根据需求做额外处理
    this.hideNoteDetails();
  },

  // 其余函数如 addNote、handleNoteClick、showNoteDetails 等处
  // 新建笔记时，为笔记自动加上 createTime / lastModified
  addNote: async function () {
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

      await CloudDataService.addNote(newNote);
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

  showNoteDetails: async function (noteId) {
    const note = await CloudDataService.getNoteById(noteId);
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

            this.renderNotes(await CloudDataService.getNotes());
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
    // 1) 记录“当前笔记”为全局，这样在 switchEditorMode() 里也能访问
    currentNote = note; // <-- 关键改动

    const noteDetailsSection = document.querySelector(".note-details-section");
    noteDetailsSection.classList.remove("hidden");

    // ---------- 标题输入处理 ----------
    let noteTitleInput = document.querySelector(".note-title");

    // 为避免多次绑定input事件，可以做一次“克隆”替换：
    const newTitleInput = noteTitleInput.cloneNode(true);
    noteTitleInput.replaceWith(newTitleInput);
    noteTitleInput = newTitleInput;

    // 设置标题
    noteTitleInput.value = note.title;

    // 每次点击别的笔记，都要重新监听“input”事件
    noteTitleInput.addEventListener("input", async () => {
      currentNote.title = noteTitleInput.value;
      currentNote.lastModified = Date.now(); // <-- 关键改动：更新最后修改
      await CloudDataService.updateNote(currentNote);

      // 若要实时刷新“最后修改时间”，可做：
      const lastModifiedEl = document.querySelector(".note-last-modified");
      if (lastModifiedEl) {
        lastModifiedEl.textContent = new Date(
          currentNote.lastModified
        ).toLocaleString();
      }
    });

    // ---------- 初始化编辑器（默认Markdown） ----------
    initEditorForNote(currentNote); // <-- 使用 currentNote

    // 如果复选框勾选 => 切到富文本，否则Markdown
    const editModeCheckbox = document.querySelector(".edit-mode-checkbox");
    if (editModeCheckbox.checked) {
      switchEditorMode("richtext");
    } else {
      switchEditorMode("markdown");
    }

    // ---------- 显示时间 ----------
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

    // ---------- 加密/解密按钮控制 ----------
    const encryptBtn = document.querySelector(".encrypt-toggle-btn");
    const decryptBtn = document.querySelector(".decrypt-toggle-btn");
    if (note.isEncrypted) {
      encryptBtn.classList.add("hidden-encrypt-btn");
      decryptBtn.classList.remove("hidden-encrypt-btn");
    } else {
      encryptBtn.classList.remove("hidden-encrypt-btn");
      decryptBtn.classList.add("hidden-encrypt-btn");
    }
  },
};

NoteList.init();
