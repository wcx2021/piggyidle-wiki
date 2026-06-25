/**
 * Wiki 左侧导航模块
 * 处理左侧目录的渲染和交互
 */

(function() {
  'use strict';

  // 导航配置
  var GUIDE_NAV = [
    {
      group: '游戏标签',
      items: [
        { title: '猪栏', slug: 'tags/piglets' },
        { title: '领地', slug: 'tags/territory' },
        { title: '仓库', slug: 'tags/warehouse' },
        { title: '神殿', slug: 'tags/temple' },
        { title: '探索', slug: 'tags/explorer' },
        { title: '生产', slug: 'tags/production' },
        { title: '制造', slug: 'tags/craft' },
        { title: '战斗', slug: 'tags/combat' },
        { title: '公会', slug: 'tags/guilds' },
        { title: '任务', slug: 'tags/quests' },
        { title: '交易', slug: 'tags/trading' }
      ]
    },
    {
      group: '游戏玩法指引',
      items: [
        { title: '生活说明', slug: 'guidebook/life-description' },
        { title: '战斗说明', slug: 'guidebook/combat-description' },
        { title: '属性说明', slug: 'guidebook/properties' },
        { title: '职业与技能', slug: 'guidebook/jobs-and-skills' },
        { title: '战斗设置说明', slug: 'guidebook/combat-settings' },
        { title: '交易说明', slug: 'guidebook/trading-description' }
      ]
    },
    {
      group: '游戏设计',
      items: [
        { title: '地图地形与资源', slug: 'design/map' },
        { title: '建筑', slug: 'design/building' },
        { title: '属性公式', slug: 'design/attribute-formulas' },
        { title: '等级和经验表', slug: 'design/experience' },
        { title: '货币和商店', slug: 'design/currency-shop' },
        { title: '装备', slug: 'design/equipment' },
        { title: '星级与精炼', slug: 'design/star-level' }
      ]
    },
    {
      group: '实用工具',
      items: [
        { title: '查询工具', type: 'tool', tool: 'items' },
        { title: '道具生成器', type: 'tool', tool: 'generator' },
        { title: '行动生成器', type: 'tool', tool: 'actionGenerator' }
      ]
    }
  ];

  /**
   * 渲染左侧导航
   * 实现可折叠分组：箭头在文字左侧，点击分组标题展开/收起组内条目
   */
  function renderLeftNav() {
    var left = document.getElementById('leftNav');
    left.innerHTML = '';

    // 创建首页条目（不可展开）
    var homeEl = document.createElement('div');
    homeEl.className = 'home-item';
    homeEl.innerHTML = '<div style="display:flex;flex-direction:column;"><span>首页</span></div>';
    homeEl.addEventListener('click', function() {
      // 清除其它高亮
      left.querySelectorAll('.nav-item').forEach(function(n) {
        n.style.background = '';
      });
      // 切换 home 高亮样式
      left.querySelectorAll('.home-item').forEach(function(h) {
        h.classList.remove('active');
      });
      homeEl.classList.add('active');
      // 加载首页内容
      if (window.loadGuidePage) {
        window.loadGuidePage('home');
      }
    });
    left.appendChild(homeEl);

    // 渲染分组
    GUIDE_NAV.forEach(function(section) {
      // 整个分组外层容器
      var wrap = document.createElement('div');
      wrap.className = 'nav-group collapsible-group';

      // 分组头部：包含箭头与分组名称
      var header = document.createElement('div');
      header.className = 'group-toggle';
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      header.setAttribute('aria-expanded', 'false');

      var arrow = document.createElement('span');
      arrow.className = 'group-arrow';
      arrow.textContent = '▸';
      arrow.setAttribute('aria-hidden', 'true');

      var label = document.createElement('span');
      label.className = 'group-title';
      label.textContent = section.group;

      header.appendChild(arrow);
      header.appendChild(label);
      wrap.appendChild(header);

      // 分组项容器（默认隐藏）
      var itemsContainer = document.createElement('div');
      itemsContainer.className = 'group-items';
      itemsContainer.setAttribute('aria-hidden', 'true');

      // 构建每个子条目
      section.items.forEach(function(item) {
        var li = document.createElement('div');
        li.className = 'nav-item';
        li.textContent = item.title;
        li.dataset.type = item.type || 'page';
        if (item.type === 'tool') li.dataset.tool = item.tool;
        else li.dataset.slug = item.slug;

        // 点击条目时高亮并加载对应内容
        li.addEventListener('click', function() {
          // 清除其它条目高亮
          left.querySelectorAll('.nav-item').forEach(function(n) {
            n.style.background = '';
          });
          left.querySelectorAll('.home-item').forEach(function(h) {
            h.classList.remove('active');
          });
          li.style.background = 'rgba(0,0,0,0.03)';

          if (li.dataset.type === 'tool') {
            // 按需加载工具模块
            loadToolModule(li.dataset.tool);
          } else {
            if (window.loadGuidePage) {
              window.loadGuidePage(li.dataset.slug);
            }
          }

          // 窄屏适配：点击条目后自动关闭侧栏
          try {
            if (left && left.classList && left.classList.contains('show')) {
              left.classList.remove('show');
              document.body.classList.remove('show-overlay');
              document.body.style.overflow = '';
              var menuBtn = document.getElementById('menuToggle');
              if (menuBtn) menuBtn.focus();
            }
          } catch (e) {
            // 忽略任何关闭错误
          }
        });

        itemsContainer.appendChild(li);
      });

      wrap.appendChild(itemsContainer);

      // 切换函数
      function toggleGroup() {
        var wasExpanded = header.getAttribute('aria-expanded') === 'true';
        var willExpand = !wasExpanded;
        header.setAttribute('aria-expanded', String(willExpand));
        if (willExpand) {
          itemsContainer.classList.add('expanded');
          itemsContainer.setAttribute('aria-hidden', 'false');
          arrow.textContent = '▾';
        } else {
          itemsContainer.classList.remove('expanded');
          itemsContainer.setAttribute('aria-hidden', 'true');
          arrow.textContent = '▸';
        }
      }

      // 点击 header 或回车/空格键触发切换
      header.addEventListener('click', toggleGroup);
      header.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleGroup();
        }
      });

      // 初始状态：默认收起
      itemsContainer.classList.remove('expanded');
      itemsContainer.setAttribute('aria-hidden', 'true');
      header.setAttribute('aria-expanded', 'false');

      left.appendChild(wrap);
    });
  }

  /**
   * 按需加载工具模块
   * @param {string} toolName - 工具名称
   */
  function loadToolModule(toolName) {
    var scriptId = 'script-' + toolName;
    var existingScript = document.getElementById(scriptId);

    if (existingScript) {
      // 脚本已加载，直接调用
      callToolFunction(toolName);
      return;
    }

    // 动态加载脚本
    var script = document.createElement('script');
    script.id = scriptId;
    script.src = 'js/' + toolName + 'Tool.js';
    script.onload = function() {
      callToolFunction(toolName);
    };
    script.onerror = function() {
      console.error('加载工具模块失败:', toolName);
    };
    document.head.appendChild(script);
  }

  /**
   * 调用工具函数
   * @param {string} toolName - 工具名称
   */
  function callToolFunction(toolName) {
    var fnName = 'mount' + toolName.charAt(0).toUpperCase() + toolName.slice(1) + 'Tool';
    if (toolName === 'items') fnName = 'mountItemsTool';
    if (toolName === 'generator') fnName = 'mountGeneratorTool';
    if (toolName === 'actionGenerator') fnName = 'mountActionGeneratorTool';

    if (window[fnName]) {
      window[fnName]();
    } else {
      console.error('工具函数不存在:', fnName);
    }
  }

  // 暴露到全局
  window.renderLeftNav = renderLeftNav;
  window.GUIDE_NAV = GUIDE_NAV;

})();
