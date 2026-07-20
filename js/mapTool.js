/**
 * Wiki 地图地块查询工具模块
 * 提供地图信息、升级消耗、地块池等查询功能
 */

(function() {
  'use strict';

  var mapInfo = {
    id: 7001,
    name: '初始之地',
    terrainTags: ['grassland'],
    acquire: '地图碎片 ×300 合成'
  };

  var upgradeCosts = [
    { level: 1, fragments: 1000, gold: 500 },
    { level: 2, fragments: 3000, gold: 1500 },
    { level: 3, fragments: 8000, gold: 4000 },
    { level: 4, fragments: 15000, gold: 7500 },
    { level: 5, fragments: 60000, gold: 30000 },
    { level: 6, fragments: 100000, gold: 50000 },
    { level: 7, fragments: 200000, gold: 100000 },
    { level: 8, fragments: 0, gold: 0 }
  ];

  var plotPool = [
    { name: '肥沃农田', tags: ['farm'], bonus: '效率+5%', type: '初始', resourcePoints: ['胡萝卜', '小麦'] },
    { name: '涓涓河流', tags: ['water'], bonus: '容量+5000', type: '初始', resourcePoints: ['鱼', '芦苇'] },
    { name: '小型矿脉', tags: ['mine'], bonus: '速度+5%', type: '初始', resourcePoints: ['铜矿', '铁矿'] },
    // 可解锁地块x9
    { name: '茂密林地', tags: ['forest'], bonus: '效率+8%', type: 'Lv.3解锁' },
    { name: '草药园', tags: ['farm'], bonus: '效率+10%', type: 'Lv.3解锁' },
    { name: '采石场', tags: ['mine'], bonus: '容量+10000', type: 'Lv.3解锁' },
    { name: '狩猎场', tags: ['hunting_ground'], bonus: '效率+12%', type: 'Lv.5解锁' },
    { name: '训练场', tags: ['combat'], bonus: '速度+10%', type: 'Lv.5解锁' },
    { name: '钻井平台', tags: ['oilfield'], bonus: '容量+20000', type: 'Lv.5解锁' },
    { name: '工坊区', tags: ['workshop'], bonus: '效率+15%', type: 'Lv.7解锁' },
    { name: '观测站', tags: ['research'], bonus: '速度+15%', type: 'Lv.7解锁' },
    { name: '地下洞穴', tags: ['mine', 'mysterious'], bonus: '稀有掉落+20%', type: 'Lv.7解锁' }
  ];

  var terrainTagLabels = {
    grassland: '草原',
    farm: '农田',
    water: '水域',
    mine: '矿脉',
    forest: '林地',
    hunting_ground: '狩猎场',
    combat: '训练场',
    oilfield: '油田',
    workshop: '工坊',
    research: '研究',
    mysterious: '神秘'
  };

  var typeBadgeColors = {
    '初始': '#3b82f6',
    'Lv.3解锁': '#10b981',
    'Lv.5解锁': '#f97316',
    'Lv.7解锁': '#8b5cf6'
  };

  function escapeHTML(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function mountMapTool() {
    var container = document.getElementById('guideContentContainer');
    if (!container) return;
    container.innerHTML = '';
    var tpl = document.getElementById('map-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var contentEl = container.querySelector('.map-content');
    var selectEl = container.querySelector('.map-category-select');
    if (!contentEl || !selectEl) return;

    function renderCategory(category) {
      contentEl.dataset.currentCategory = category;
      contentEl.innerHTML = '';

      if (category === 'info') {
        renderMapInfo(contentEl);
      }
      if (category === 'upgrade') {
        renderUpgradeCosts(contentEl);
      }
      if (category === 'plots') {
        renderPlotPool(contentEl);
      }
      if (category === 'items') {
        loadMapItemsData(contentEl);
      }
    }

    selectEl.addEventListener('change', function() {
      renderCategory(selectEl.value);
    });

    // 默认显示第一个分类
    renderCategory(selectEl.value);
  }

  function renderMapInfo(contentEl) {
    var tagsHtml = (mapInfo.terrainTags || []).map(function(tag) {
      var label = terrainTagLabels[tag] || tag;
      return '<span class="type-badge" style="background:#6366f11a;color:#6366f1;border:1px solid #6366f133;">' + escapeHTML(label) + '</span>';
    }).join(' ');

    contentEl.innerHTML +=
      '<div class="detail-section">' +
      '<h5>地图基本信息</h5>' +
      '<table class="detail-table">' +
      '<tr><td>地图ID</td><td>#' + escapeHTML(String(mapInfo.id)) + '</td></tr>' +
      '<tr><td>名称</td><td><strong>' + escapeHTML(mapInfo.name) + '</strong></td></tr>' +
      '<tr><td>地形标签</td><td>' + tagsHtml + '</td></tr>' +
      '<tr><td>获取方式</td><td>' + escapeHTML(mapInfo.acquire) + '</td></tr>' +
      '</table>' +
      '</div>';
  }

  function renderUpgradeCosts(contentEl) {
    var rows = upgradeCosts.map(function(c) {
      var levelLabel = 'Lv.' + c.level;
      if (c.level === 3) levelLabel += '（解锁地块）';
      if (c.level === 5) levelLabel += '（解锁地块）';
      if (c.level === 7) levelLabel += '（解锁地块）';
      var fragmentsStr = c.fragments === 0 ? '—' : c.fragments.toLocaleString();
      var goldStr = c.gold === 0 ? '—' : c.gold.toLocaleString();
      return '<tr>' +
        '<td>' + levelLabel + '</td>' +
        '<td>' + fragmentsStr + '</td>' +
        '<td>' + goldStr + '</td>' +
        '</tr>';
    }).join('');

    contentEl.innerHTML +=
      '<div class="detail-section">' +
      '<h5>升级消耗表</h5>' +
      '<table class="data-table">' +
      '<thead><tr><th>等级</th><th>碎片消耗</th><th>金币消耗</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '</div>';
  }

  function renderPlotPool(contentEl) {
    var initialCount = 0;
    var unlockableCount = 0;
    plotPool.forEach(function(p) {
      if (p.type === '初始') initialCount++;
      else unlockableCount++;
    });

    var headerHtml =
      '<div class="detail-section">' +
      '<h5>地块池</h5>' +
      '<p class="detail-sub-title">初始地块 <strong>' + initialCount + '</strong> 个 | 可解锁地块 <strong>' + unlockableCount + '</strong> 个</p>';

    var rows = plotPool.map(function(p) {
      var tagsHtml = (p.tags || []).map(function(tag) {
        var label = terrainTagLabels[tag] || tag;
        return '<span class="type-badge" style="background:#6366f11a;color:#6366f1;border:1px solid #6366f133;font-size:11px;">' + escapeHTML(label) + '</span>';
      }).join(' ');

      var color = typeBadgeColors[p.type] || '#6b7280';
      var typeHtml = '<span class="type-badge" style="background:' + color + '1a;color:' + color + ';border:1px solid ' + color + '33;">' + escapeHTML(p.type) + '</span>';

      var resourceHtml = p.resourcePoints ? p.resourcePoints.join('、') : '—';

      return '<tr>' +
        '<td><strong>' + escapeHTML(p.name) + '</strong></td>' +
        '<td>' + tagsHtml + '</td>' +
        '<td>' + escapeHTML(p.bonus) + '</td>' +
        '<td>' + typeHtml + '</td>' +
        '<td>' + escapeHTML(resourceHtml) + '</td>' +
        '</tr>';
    }).join('');

    var tableHtml =
      '<table class="data-table">' +
      '<thead><tr><th>地块名称</th><th>地形标签</th><th>加成效果</th><th>类型</th><th>资源点</th></tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>';

    contentEl.innerHTML += headerHtml + tableHtml + '</div>';
  }

  function loadMapItemsData(contentEl) {
    var loadingSection = document.createElement('div');
    loadingSection.className = 'detail-section';
    loadingSection.innerHTML = '<h5>地图道具列表</h5><p class="detail-empty">加载中...</p>';
    contentEl.appendChild(loadingSection);

    window.fetchDataset('items').then(function(itemsData) {
      if (contentEl.dataset.currentCategory !== 'items' && contentEl.dataset.currentCategory !== 'all') return;

      var mapItems = (itemsData || []).filter(function(item) {
        return item.itemType === 'map';
      });

      if (mapItems.length === 0) {
        loadingSection.innerHTML = '<h5>地图道具列表</h5><p class="detail-empty">暂无数据</p>';
        return;
      }

      var rows = mapItems.map(function(item) {
        return '<tr>' +
          '<td>#' + escapeHTML(String(item.itemId)) + '</td>' +
          '<td><strong>' + escapeHTML(item.itemName || '') + '</strong></td>' +
          '<td>' + escapeHTML(item.itemDescription || '') + '</td>' +
          '<td>' + (item.isTradable ? '✓' : '✗') + '</td>' +
          '<td>' + (item.isDecomposable ? '✓' : '✗') + '</td>' +
          '<td>' + (item.shopPrice !== null && item.shopPrice !== undefined ? item.shopPrice : '—') + '</td>' +
          '</tr>';
      }).join('');

      loadingSection.innerHTML =
        '<h5>地图道具列表</h5>' +
        '<p class="detail-sub-title">共 ' + mapItems.length + ' 张地图</p>' +
        '<table class="data-table">' +
        '<thead><tr><th>ID</th><th>名称</th><th>描述</th><th>可交易</th><th>可分解</th><th>商店价格</th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';
    }).catch(function() {
      if (contentEl.dataset.currentCategory !== 'items' && contentEl.dataset.currentCategory !== 'all') return;
      loadingSection.innerHTML = '<h5>地图道具列表</h5><p class="detail-empty">加载失败</p></div>';
    });
  }

  window.mountMapTool = mountMapTool;

})();
