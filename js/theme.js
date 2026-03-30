/**
 * Wiki 主题切换模块
 * 处理明暗主题切换
 */

(function() {
  'use strict';

  /**
   * 应用主题
   * @param {string} theme - 主题名称 ('light' 或 'dark')
   */
  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.textContent = theme === 'dark' ? '开灯' : '关灯';
    }
  }

  /**
   * 初始化主题
   * 从 localStorage 读取保存的主题设置
   */
  function initTheme() {
    var stored = localStorage.getItem('wikiTheme');
    applyTheme(stored === 'dark' ? 'dark' : 'light');

    var themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function() {
        var now = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(now);
        localStorage.setItem('wikiTheme', now);
      });
    }
  }

  // 暴露到全局
  window.initTheme = applyTheme;
  window.applyTheme = applyTheme;

})();
