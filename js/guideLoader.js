/**
 * Wiki 指南页面加载模块
 * 处理指南页面的加载和内容注入
 */

(function() {
  'use strict';

  /**
   * 加载指南页面
   * @param {string} slug - 页面标识符
   */
  function loadGuidePage(slug) {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '<p class="notice">加载中…</p>';
    var path = 'guide/' + slug + '.html';
    console.debug('[loadGuidePage] fetch ->', path);

    fetch(path, { cache: 'no-cache' })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function(html) {
        try {
          // 使用 DOMParser 解析返回的 HTML
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');

          // 选择器列表，用于查找主要内容
          var selectors = [
            '.guide-content',
            '#guide-right',
            '.content',
            '.main',
            '.right',
            '.col-right',
            '.article',
            '.container-right',
            '.doc-main'
          ];
          var guideNode = null;
          for (var i = 0; i < selectors.length; i++) {
            guideNode = doc.querySelector(selectors[i]);
            if (guideNode) break;
          }

          // 回退：如果没有匹配，使用 body 的最后一个子元素
          if (!guideNode) {
            var bodyChildren = Array.from(doc.body.children).filter(function(c) {
              return c.nodeType === 1;
            });
            if (bodyChildren.length > 1) {
              guideNode = bodyChildren[bodyChildren.length - 1];
            } else {
              guideNode = doc.body.firstElementChild || doc.body;
            }
          }

          // 注入提取的内容片段
          try {
            if (guideNode) {
              // 保留并插入根元素
              container.innerHTML = '';
              var imported = document.importNode(guideNode, true);
              container.appendChild(imported);
            } else {
              container.innerHTML = html;
            }
          } catch (injectErr) {
            console.error('[loadGuidePage] inject error', injectErr);
            // 兜底：回退到原先行为
            container.innerHTML = guideNode ? guideNode.innerHTML : html;
          }
        } catch (parseErr) {
          console.error('[loadGuidePage] parse error', parseErr);
          container.innerHTML = html;
        }
        container.scrollTop = 0;
      })
      .catch(function(err) {
        console.error('加载章节失败', err);
        container.innerHTML = '<p class="notice">加载失败：' +
          window.escapeHTML(String(err.message || err)) +
          ' （请检查文件 ' + window.escapeHTML(path) + ' 是否存在）</p>';
      });
  }

  // 暴露到全局
  window.loadGuidePage = loadGuidePage;

})();
