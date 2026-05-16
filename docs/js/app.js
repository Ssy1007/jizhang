/* ===================================
   记账APP - 主入口
   初始化、页面路由、全局事件
   =================================== */

/* ---- 页面路由 ---- */

/* 切换到指定页面 */
function switchPage(pageName) {
  // 隐藏所有页面
  var pages = document.querySelectorAll('.page');
  pages.forEach(function (p) { p.classList.remove('active'); });

  // 显示目标页面
  var target = document.getElementById('page-' + pageName);
  if (target) {
    target.classList.add('active');
  }

  // 更新底部导航高亮
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function (item) {
    item.classList.remove('active');
    if (item.getAttribute('data-page') === pageName) {
      item.classList.add('active');
    }
  });

  // 首页以外的页面隐藏 FAB
  var fab = document.getElementById('fab');
  if (fab) {
    fab.style.display = (pageName === 'home') ? 'flex' : 'none';
  }

  // 清除展开状态和编辑状态
  expandedTxId = null;
  currentEditId = null;
  expandedCat = null;
  expandedItem = null;

  // 渲染对应页面内容
  if (pageName === 'home') renderHomePage();
  if (pageName === 'stats') renderStatsPage();
  if (pageName === 'search') renderSearchPage();
  if (pageName === 'settings') renderSettingsPage();
}

/* ---- 应用初始化 ---- */
function initApp() {
  // 初始化存储
  initStorage();

  // 应用主题
  var settings = getSettings();
  applyTheme(settings.theme);

  // 绑定底部导航
  var navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      var page = item.getAttribute('data-page');
      switchPage(page);
    });
  });

  // 绑定 FAB 按钮
  var fab = document.getElementById('fab');
  if (fab) {
    fab.addEventListener('click', openAddSheet);
  }

  // 绑定记一笔弹窗的关闭和保存
  bindSheetEvents();

  // 默认显示首页
  switchPage('home');

  // 注册 Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(function () {
      // 离线功能非关键路径，静默处理失败
    });
  }

  // 初始化 PWA 安装提示
  initInstallPrompt();
}

/* ---- PWA 安装提示 ---- */

var deferredPrompt = null;

function initInstallPrompt() {
  var banner = document.getElementById('install-banner');
  if (!banner) return;

  // 如果已经在独立窗口中运行（已安装到桌面），不显示横幅
  if (window.matchMedia('(display-mode: standalone)').matches) {
    banner.classList.remove('show');
    return;
  }

  // 监听 beforeinstallprompt 事件（Android Chrome/Edge 支持）
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    showInstallBanner();
  });

  // iOS Safari 不触发 beforeinstallprompt，检测是否 iOS 并显示手动指引
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  var isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(navigator.userAgent);
  if (isIOS && isSafari && !window.matchMedia('(display-mode: standalone)').matches) {
    document.getElementById('banner-text').textContent = '分享按钮 → 添加到主屏幕';
    var installBtn = document.getElementById('banner-install-btn');
    if (installBtn) installBtn.style.display = 'none';
    showInstallBanner();
  }

  // 检查是否之前已关闭过
  if (localStorage.getItem('jizhang_banner_closed')) {
    banner.classList.remove('show');
  }
}

function showInstallBanner() {
  var banner = document.getElementById('install-banner');
  if (banner && !banner.classList.contains('show')) {
    banner.classList.add('show');
  }
}

/* 绑定安装横幅事件（在 DOMContentLoaded 中执行） */
document.addEventListener('DOMContentLoaded', function () {
  var installBtn = document.getElementById('banner-install-btn');
  var closeBtn = document.getElementById('banner-close');

  if (installBtn) {
    installBtn.addEventListener('click', function () {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function (result) {
          deferredPrompt = null;
          var banner = document.getElementById('install-banner');
          if (banner) banner.classList.remove('show');
        });
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      var banner = document.getElementById('install-banner');
      if (banner) banner.classList.remove('show');
      localStorage.setItem('jizhang_banner_closed', '1');
    });
  }
});

/* 页面加载完成后启动 */
document.addEventListener('DOMContentLoaded', initApp);
