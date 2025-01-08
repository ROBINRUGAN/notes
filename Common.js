function showPasswordModal() {
  return new Promise((resolve, reject) => {
    const modal = document.querySelector(".password-modal");
    const input = document.querySelector(".password-input");
    const confirmBtn = document.querySelector(".password-confirm-btn");
    const cancelBtn = document.querySelector(".password-cancel-btn");

    // 清空上一次的输入
    input.value = "";

    // 显示弹窗
    modal.classList.remove("hidden-password-modal");

    const handleConfirm = () => {
      const pwd = input.value;
      closeModal();
      resolve(pwd);
    };

    const handleCancel = () => {
      closeModal();
      resolve(null);
    };

    function closeModal() {
      modal.classList.add("hidden-password-modal");
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
    }

    function handleKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    }

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    input.addEventListener("keydown", handleKeydown);
    // 让输入框获得焦点
    input.focus();
  });
}

function showSetPasswordModal() {
  return new Promise((resolve) => {
    const modal = document.querySelector(".set-password-modal");
    const pwdInput = modal.querySelector(".password-input");
    const confirmInput = modal.querySelector(".confirm-password-input");
    const confirmBtn = modal.querySelector(".password-confirm-btn");
    const cancelBtn = modal.querySelector(".password-cancel-btn");

    // 清空上一次的输入
    pwdInput.value = "";
    confirmInput.value = "";

    // 显示弹窗
    modal.classList.remove("hidden-password-modal");

    // 点击“确认”时
    const handleConfirm = () => {
      const pwd1 = pwdInput.value.trim();
      const pwd2 = confirmInput.value.trim();
      closeModal();

      // 返回一个对象 { pwd1, pwd2 } 以便在外面做校验
      resolve({ pwd1, pwd2 });
    };

    // 点击“取消”时
    const handleCancel = () => {
      closeModal();
      resolve(null); // 表示用户放弃设置
    };

    // 隐藏弹窗并卸载监听器
    function closeModal() {
      modal.classList.add("hidden-password-modal");
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
    }

    function handleKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    }

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    pwdInput.addEventListener("keydown", handleKeydown);
    confirmInput.addEventListener("keydown", handleKeydown);
    // 让第一个密码框获得焦点
    pwdInput.focus();
  });
}

function showDecryptModal() {
  return new Promise((resolve) => {
    const modal = document.querySelector(".decrypt-modal");
    const pwdInput = modal.querySelector(".decrypt-password-input");
    const confirmBtn = modal.querySelector(".decrypt-confirm-btn");
    const cancelBtn = modal.querySelector(".decrypt-cancel-btn");

    // 清空上一次输入
    pwdInput.value = "";

    // 显示弹窗
    modal.classList.remove("hidden-password-modal");

    // 点击确认 => 返回密码
    const handleConfirm = () => {
      const pwd = pwdInput.value.trim();
      closeModal();
      resolve(pwd);
    };

    // 点击取消 => 返回 null
    const handleCancel = () => {
      closeModal();
      resolve(null);
    };

    function closeModal() {
      modal.classList.add("hidden-password-modal");
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
    }

    // 当用户在密码框里按下回车，触发“确认”；按下Esc，触发“取消”
    function handleKeydown(e) {
      if (e.key === "Enter") {
        e.preventDefault(); // 避免默认的表单提交等
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancel();
      }
    }

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    pwdInput.addEventListener("keydown", handleKeydown);

    // 让输入框获得焦点
    pwdInput.focus();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("theme-select");
  const modeToggleBtn = document.getElementById("mode-toggle-btn");

  // 1. 读取 localStorage 中的上次主题
  let savedTheme = localStorage.getItem("userTheme");

  // 如果没有，则默认使用 “theme-blue”
  if (!savedTheme) {
    savedTheme = "theme-blue";
    localStorage.setItem("userTheme", savedTheme);
  }

  // 2. 应用主题
  applyTheme(savedTheme);

  // 同步下拉框选项
  themeSelect.value = savedTheme;

  // 如果当前是 dark，就把按钮文字改成“🌞”，否则“🌙”
  if (savedTheme === "theme-dark") {
    modeToggleBtn.textContent = "🌞";
  } else {
    modeToggleBtn.textContent = "🌙";
  }

  // 3. 下拉框切换事件
  themeSelect.addEventListener("change", (event) => {
    const newTheme = event.target.value;
    applyTheme(newTheme);

    // 持久化存储
    localStorage.setItem("userTheme", newTheme);

    // 根据是否是暗黑模式，更新按钮图标
    if (newTheme === "theme-dark") {
      modeToggleBtn.textContent = "🌞";
    } else {
      modeToggleBtn.textContent = "🌙";
    }
  });

  // 4. 月亮/太阳按钮点击
  modeToggleBtn.addEventListener("click", () => {
    const currentTheme = localStorage.getItem("userTheme") || "theme-blue";

    if (currentTheme === "theme-dark") {
      // 当前暗黑 => 切回蓝色
      applyTheme("theme-blue");
      localStorage.setItem("userTheme", "theme-blue");
      themeSelect.value = "theme-blue";
      modeToggleBtn.textContent = "🌙";
    } else {
      // 不管是不是蓝色，统一切到暗黑
      applyTheme("theme-dark");
      localStorage.setItem("userTheme", "theme-dark");
      themeSelect.value = "theme-dark";
      modeToggleBtn.textContent = "🌞";
    }
  });
});

/**
 * 应用主题
 * 先移除所有可能的主题类，再添加 newTheme
 */
function applyTheme(newTheme) {
  document.body.classList.remove(
    "theme-blue",
    "theme-dark",
    "theme-yellow",
    "theme-purple",
    "theme-green"
  );
  document.body.classList.add(newTheme);
}
