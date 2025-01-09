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
        let savedLang = localStorage.getItem("userLanguage") || navigator.language.split("-")[0];
        const langPack = translations[savedLang];
        alert(langPack["msg.loginFirst"]);
        window.location.href = "/html/login.html";
      } else {
        const nameEl = document.getElementById("userGreeting");
        const welcomeEl = document.getElementById("welcomeState");
        const logoutEl = document.getElementById("logoutState");
        welcomeEl.style.display = "inline";
        logoutEl.style.display = "none";
        nameEl.textContent = session.username
        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn.style.display = "inline";
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
    let savedLang = localStorage.getItem("userLanguage") || navigator.language.split("-")[0];
    const langPack = translations[savedLang];
    const loginBtn = document.getElementById("loginBtn");
    if (!loginBtn) return;
    async function login() {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      if (!username || !password) {
        alert(langPack["msg.fillInfo"]);
        return;
      }
      const result = await CloudDataService.login(username, password);
      if (result.success) {
        alert(langPack["msg.loginSuccess"]);

        window.location.href = "/html/index.html";
      } else {
        alert(langPack["msg.wrongInfo"]);
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
    let savedLang = localStorage.getItem("userLanguage") || navigator.language.split("-")[0];
    const langPack = translations[savedLang];
    const registerBtn = document.getElementById("registerBtn");
    if (!registerBtn) return;
    registerBtn.addEventListener("click", async () => {
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      if (!username || !password) {
        alert(langPack["msg.fillInfo"]);
        return;
      }
      const result = await CloudDataService.register(username, password);
      if (result.success) {
        if (result.msg === "注册成功") {
          alert(langPack["msg.registerSuccess"]);
        }
        window.location.href = "/html/login.html";
      } else {
        if (result.msg === "用户名已存在") {
          alert(langPack["msg.userExists"]);
        }
      }
    });
  },

  // 退出登录
  logout: async function () {
    let savedLang = localStorage.getItem("userLanguage") || navigator.language.split("-")[0];
    const langPack = translations[savedLang];
    await CloudDataService.logout();
    alert(langPack["msg.logoutSuccess"]);
    window.location.href = "/html/login.html";
  },
};

AuthService.init();
