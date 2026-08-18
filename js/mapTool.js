/**
 * Wiki 地图地块查询工具模块
 * 提供地图信息、升级消耗、地块池等查询功能
 */

(function() {
  'use strict';

  /** 展示数据（来自 data/mapTool.json）：地图信息/地块池/地形标签/类型配色 */
  var viewData = null;
  /** 升级消耗（来自 data/mapUpgradeCosts.json，权威源） */
  var upgradeCostsArr = [];

  /** upgradeCosts 普通转换：从 {level:{costs[],effects}} 提取 碎片(3001)/金币(1000) */
  function transformUpgradeCosts(obj) {
    if (!obj || typeof obj !== 'object') return [];
    var out = [];
    Object.keys(obj).forEach(function(levelKey) {
      var lv = obj[levelKey];
      if (!lv || !Array.isArray(lv.costs)) return;
      var fragments = 0;
      var gold = 0;
      lv.costs.forEach(function(c) {
        if (c.itemId === 3001) fragments = c.amount || 0;
        else if (c.itemId === 1000) gold = c.amount || 0;
      });
      out.push({ level: Number(levelKey), fragments: fragments, gold: gold });
    });
    out.sort(function(a, b) { return a.level - b.level; });
    return out;
  }

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

    // 先加载数据，完成后再渲染默认分类
    Promise.all([
      window.fetchDataset('mapToolView'),
      window.fetchDataset('mapUpgradeCosts')
    ]).then(function(results) {
      var view = results[0] || {};
      var costs = results[1] || {};
      viewData = view;
      upgradeCostsArr = transformUpgradeCosts(
        (costs && costs.mapUpgradeCosts) || costs
      );
      renderCategory(selectEl.value);
    }).catch(function() {
      viewData = null;
      upgradeCostsArr = [];
      renderCategory(selectEl.value);
    });
  }

  function renderMapInfo(contentEl) {
    var mapInfo = (viewData && viewData.mapInfo) || {};
    var terrainTagLabels = (viewData && viewData.terrainTagLabels) || {};
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
    var rows = upgradeCostsArr.map(function(c) {
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

    if (rows === '') {
      contentEl.innerHTML +=
        '<div class="detail-section">' +
        '<h5>升级消耗表</h5>' +
        '<p class="detail-empty">暂无数据</p>' +
        '</div>';
      return;
    }

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
    var plotPool = (viewData && viewData.plotPool) || [];
    var terrainTagLabels = (viewData && viewData.terrainTagLabels) || {};
    var typeBadgeColors = (viewData && viewData.typeBadgeColors) || {};
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
