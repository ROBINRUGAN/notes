const AuthService = {
  init: function () {
    this.initLoginPage();
    this.initRegisterPage();
  },

  // 保护 index.html，如果未登录则跳转至 login.html，并设置用户信息与退出按钮
  checkIndexPage: function () {
    (async () => {
      const session = await CloudDataService.checkSession();
      if (!session.success) {
        alert("请先登录");
        window.location.href = "login.html";
      } else {
        const greetingEl = document.getElementById("userGreeting");
        if (greetingEl)
          greetingEl.textContent = session.username
            ? `欢迎，${session.username}`
            : "欢迎，用户";

        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
          logoutBtn.addEventListener("click", async () => {
            await AuthService.logout();
          });
        }
      }
    })();
  },

  // 初始化 login.html 的登录逻辑
  initLoginPage: function () {
    const loginBtn = document.getElementById("loginBtn");
    if (!loginBtn) return;
    async function login() {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      if (!username || !password) {
        alert("请填写完整信息");
        return;
      }
      const result = await CloudDataService.login(username, password);
      if (result.success) {
        alert(result.msg);
        window.location.href = "index.html";
      } else {
        alert(result.msg);
      }
    }
    document
      .getElementById("username")
      .addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          login();
        }
      });

    document
      .getElementById("password")
      .addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          login();
        }
      });

    loginBtn.addEventListener("click", login);
  },

  // 初始化 register.html 的注册逻辑
  initRegisterPage: function () {
    const registerBtn = document.getElementById("registerBtn");
    if (!registerBtn) return;
    registerBtn.addEventListener("click", async () => {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      if (!username || !password) {
        alert("请填写完整信息");
        return;
      }
      const result = await CloudDataService.register(username, password);
      if (result.success) {
        alert(result.msg);
        window.location.href = "login.html";
      } else {
        alert(result.msg);
      }
    });
  },

  // 退出登录
  logout: async function () {
    await CloudDataService.logout();
    alert("已退出登录");
    window.location.href = "login.html";
  },
};

AuthService.init();
