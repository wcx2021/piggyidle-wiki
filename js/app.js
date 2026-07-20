/**
 * Wiki 主入口文件
 * 初始化、事件绑定、hash 处理
 */

(function() {
  'use strict';

  /**
   * 处理 hash（例如 #production-properties、#tool-items、#tool-generator）
   */
  function handleHash(hash) {
    if (!hash) return;
    var key = String(hash).replace(/^#/, '');
    if (!key) return;

    if (key === 'home') {
      if (window.loadGuidePage) window.loadGuidePage('home');
      return;
    }
    if (key === 'tool-items') {
      if (window.mountItemsTool) window.mountItemsTool();
      return;
    }
    if (key === 'tool-actions') {
      if (window.mountActionsTool) window.mountActionsTool();
      return;
    }
    if (key === 'tool-jobs') {
      if (window.mountJobsTool) window.mountJobsTool();
      return;
    }
    if (key === 'tool-skills') {
      if (window.mountSkillsTool) window.mountSkillsTool();
      return;
    }
    if (key === 'tool-level') {
      if (window.mountLevelTool) window.mountLevelTool();
      return;
    }
    if (key === 'tool-map') {
      if (window.mountMapTool) window.mountMapTool();
      return;
    }
    if (key === 'tool-battle') {
      if (window.mountBattleTool) window.mountBattleTool();
      return;
    }

    // 默认将 hash 当作章节 slug 处理
    if (window.loadGuidePage) window.loadGuidePage(key);
  }

  /**
   * 初始化移动端菜单
   */
  function initMobileMenu() {
    var menuBtn = document.getElementById('menuToggle');
    var left = document.getElementById('leftNav');

    function openMenu() {
      if (!left) return;
      left.classList.add('show');
      document.body.classList.add('show-overlay');
      document.body.style.overflow = 'hidden';
      var first = left.querySelector('button, a, [tabindex]');
      if (first) first.focus();
    }

    function closeMenu() {
      if (!left) return;
      left.classList.remove('show');
      document.body.classList.remove('show-overlay');
      document.body.style.overflow = '';
      if (menuBtn) menuBtn.focus();
    }

    if (menuBtn && left) {
      menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (left.classList.contains('show')) closeMenu();
        else openMenu();
      });

      // 点击遮罩或页面空白处关闭侧栏
      document.addEventListener('click', function(e) {
        if (!left.classList.contains('show')) return;
        if (menuBtn.contains(e.target)) return;
        if (left.contains(e.target)) return;
        closeMenu();
      }, { capture: true });

      // Esc 键关闭
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeMenu();
      });
    }
  }

  /**
   * 初始化锚点点击代理
   */
  function initAnchorProxy() {
    document.addEventListener('click', function(e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.startsWith('#')) {
        e.preventDefault();
        handleHash(href);
        if (location.hash !== href) location.hash = href;
      }
    });
  }

  /**
   * 主初始化函数
   */
  function init() {
    // 初始化主题
    if (window.initTheme) window.initTheme();

    // 渲染左侧导航
    if (window.renderLeftNav) window.renderLeftNav();

    // 初始化移动端菜单
    initMobileMenu();

    // 初始化锚点代理
    initAnchorProxy();

    // 监听 hash 变化
    window.addEventListener('hashchange', function() {
      handleHash(location.hash);
    });

    // 默认显示首页或根据 hash 加载
    var leftNavElem = document.getElementById('leftNav');
    var home = leftNavElem ? leftNavElem.querySelector('.home-item') : null;
    if (home) home.classList.add('active');

    if (location.hash && location.hash.length > 1) {
      handleHash(location.hash);
    } else {
      if (window.loadGuidePage) window.loadGuidePage('home');
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
