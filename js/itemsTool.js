/**
 * Wiki Items 查询工具模块
 * 提供道具数据查询功能
 */

(function() {
  'use strict';

  var itemColumns = [
    { key: 'itemId', label: 'ID', aliases: ['itemId', 'id'] },
    { key: 'itemName', label: '名称', aliases: ['itemName', 'name'] },
    { key: 'itemType', label: '类别', aliases: ['itemType', 'type'], isBadge: true },
    { key: 'itemDescription', label: '简介', aliases: ['itemDescription', 'description'] },
    { key: 'isTradable', label: '可交易', aliases: ['isTradable', 'tradable', 'is_tradable'], isBool: true },
    { key: 'rarity', label: '有星级', aliases: ['rarity'], isTruthy: true },
    { key: 'isInteractive', label: '可互动', aliases: ['isInteractive', 'interactive', 'is_interactive'], isBool: true },
    { key: 'isDecomposable', label: '可分解', aliases: ['isDecomposable', 'decomposable', 'is_decomposable'], isBool: true },
    { key: 'shopPrice', label: '商店价格', aliases: ['shopPrice', 'price'] },
    { key: 'growthCoefficient', label: '成长系数', aliases: ['growthCoefficient', 'growth_coefficient'] },
  ];

  var itemTypeOptions = [
    { value: 'all', label: '全部' },
    { value: 'currency', label: '货币' },
    { value: 'consumable', label: '消耗品' },
    { value: 'map', label: '地图' },
    { value: 'compendium', label: '图鉴' },
    { value: 'equipment', label: '装备' },
    { value: 'pig', label: '小猪' },
    { value: 'suit', label: '套装' },
    { value: 'treasure', label: '宝箱' },
    { value: 'resource', label: '资源' },
    { value: 'building', label: '建筑' }
  ];

  var typeLabelMap = {
    currency: '货币',
    consumable: '消耗品',
    map: '地图',
    compendium: '图鉴',
    equipment: '装备',
    pig: '小猪',
    suit: '套装',
    treasure: '宝箱',
    resource: '资源',
    building: '建筑'
  };

  var typeColorMap = {
    currency: '#f59e0b',
    consumable: '#10b981',
    map: '#6366f1',
    compendium: '#8b5cf6',
    equipment: '#ef4444',
    pig: '#ec4899',
    suit: '#14b8a6',
    treasure: '#f97316',
    resource: '#84cc16',
    building: '#64748b'
  };

  function formatCell(v, col) {
    if (v === null || v === undefined || v === '') return '—';
    if (col && col.isBool) return v ? '✓' : '✗';
    return String(v);
  }

  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
      toast.classList.add('toast-fade');
    }, 1500);
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2200);
  }

  function renderBadge(text, colorKey) {
    var color = typeColorMap[colorKey] || '#6b7280';
    var label = typeLabelMap[colorKey] || text;
    return '<span class="type-badge" style="background:' + color + '1a;color:' + color + ';border:1px solid ' + color + '33;">' + window.escapeHTML(label) + '</span>';
  }

  function renderBoolCell(v) {
    if (v === true) return '<span class="bool-check bool-yes">✓</span>';
    if (v === false) return '<span class="bool-check bool-no">✗</span>';
    return '<span class="bool-empty">—</span>';
  }

  function renderAttributesTable(attrs) {
    if (!attrs || attrs.length === 0) return '<p class="detail-empty">无属性</p>';
    var rows = attrs.map(function(a) {
      var k = a.name || a.key || '';
      var v = a.value || '';
      var displayV = (v === 0 || v === '0') ? '—' : String(v);
      return '<tr><td>' + window.escapeHTML(k) + '</td><td>' + window.escapeHTML(displayV) + '</td></tr>';
    }).join('');
    return '<div class="detail-section"><h5>属性表</h5><table class="detail-table"><thead><tr><th>名称</th><th>数值</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function renderRequiredLevelsTable(item) {
    var rl = item.requiredLevels || item.required_levels || item.required_level || null;
    if (rl === null || rl === undefined || rl === '') return '<p class="detail-empty">无等级需求</p>';
    if (Array.isArray(rl) && rl.length === 0) return '<p class="detail-empty">无等级需求</p>';
    if (typeof rl === 'object' && !Array.isArray(rl) && Object.keys(rl).length === 0) return '<p class="detail-empty">无等级需求</p>';

    if (Array.isArray(rl)) {
      var rows = rl.map(function(r) {
        var k = r.level || r.key || r.skillName || '';
        var v = r.value || r.req || r.level || '';
        return '<tr><td>' + window.escapeHTML(String(k)) + '</td><td>' + window.escapeHTML(String(v)) + '</td></tr>';
      }).join('');
      return '<div class="detail-section"><h5>需求等级</h5><table class="detail-table"><thead><tr><th>技能</th><th>要求</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    } else if (typeof rl === 'object') {
      var objRows = Object.entries(rl).map(function(entry) {
        return '<tr><td>' + window.escapeHTML(entry[0]) + '</td><td>' + window.escapeHTML(String(entry[1])) + '</td></tr>';
      }).join('');
      return '<div class="detail-section"><h5>需求等级</h5><table class="detail-table"><thead><tr><th>键</th><th>值</th></tr></thead><tbody>' + objRows + '</tbody></table></div>';
    } else {
      return '<p><strong>需求等级:</strong> ' + window.escapeHTML(String(rl)) + '</p>';
    }
  }

  function resolveItemName(itemId, itemsData) {
    if (!itemsData || !itemId) return String(itemId);
    for (var i = 0; i < itemsData.length; i++) {
      if (itemsData[i].itemId === itemId) return itemsData[i].itemName || String(itemId);
    }
    return String(itemId);
  }

  function buildTableHeader(tableHead, columns) {
    tableHead.innerHTML = '';
    var tr = document.createElement('tr');
    columns.forEach(function(col) {
      var th = document.createElement('th');
      th.textContent = col.label || col.key;
      tr.appendChild(th);
    });
    var opTh = document.createElement('th');
    opTh.textContent = '操作';
    tr.appendChild(opTh);
    tableHead.appendChild(tr);
  }

  function mountItemsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('items-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.items-component');
    var typeFilter = root.querySelector('.typeFilter');
    var searchInput = root.querySelector('.searchInput');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var statsCount = root.querySelector('.stats-count');
    var tableHead = root.querySelector('.tableHead');
    var itemsBody = root.querySelector('.itemsBody');
    var emptyNotice = root.querySelector('.empty');

    var data = [];
    var expanded = {};
    var sortAsc = true;

    function updateStats(total, filtered) {
      if (total === filtered) {
        statsCount.textContent = '共 ' + total + ' 条';
      } else {
        statsCount.textContent = '共 ' + total + ' 条 / 筛选后 ' + filtered + ' 条';
      }
    }

    function render() {
      var typeVal = typeFilter.value;
      var keyword = (searchInput.value || '').trim().toLowerCase();
      itemsBody.innerHTML = '';
      var list = data.slice();

      if (typeVal !== 'all') {
        list = list.filter(function(it) {
          var t = it.itemType || '';
          return t === typeVal;
        });
      }

      if (keyword) {
        list = list.filter(function(it) {
          var id = String(it.itemId !== undefined ? it.itemId : '').toLowerCase();
          var name = String(it.itemName || '').toLowerCase();
          var desc = String(it.itemDescription || '').toLowerCase();
          return id.indexOf(keyword) >= 0 || name.indexOf(keyword) >= 0 || desc.indexOf(keyword) >= 0;
        });
      }

      list.sort(function(a, b) {
        var ai = a.itemId;
        var bi = b.itemId;
        if (typeof ai === 'number' && typeof bi === 'number') {
          return sortAsc ? ai - bi : bi - ai;
        } else {
          return sortAsc ? String(ai).localeCompare(String(bi)) : String(bi).localeCompare(String(ai));
        }
      });

      updateStats(data.length, list.length);

      if (list.length === 0) {
        emptyNotice.classList.remove('hidden');
        buildTableHeader(tableHead, []);
        return;
      } else {
        emptyNotice.classList.add('hidden');
      }

      var columns = itemColumns;
      buildTableHeader(tableHead, columns);

      list.forEach(function(item) {
        var id = item.itemId;
        var tr = document.createElement('tr');
        tr.className = 'row';

        columns.forEach(function(col) {
          var value = '';
          var aliases = col.aliases || [col.key];
          for (var i = 0; i < aliases.length; i++) {
            if (item[aliases[i]] !== undefined && item[aliases[i]] !== null) {
              value = item[aliases[i]];
              break;
            }
          }
          var td = document.createElement('td');

          if (col.isBadge && value) {
            td.innerHTML = renderBadge(String(value), String(value));
          } else if (col.isBool) {
            td.innerHTML = renderBoolCell(value);
          } else if (col.isTruthy) {
            td.innerHTML = renderBoolCell(!!value);
          } else if (col.key === 'iconUrl' && typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
            var img = document.createElement('img');
            img.className = 'icon-thumb';
            img.src = value;
            img.alt = 'icon';
            td.appendChild(img);
          } else {
            td.textContent = formatCell(value, col);
          }

          tr.appendChild(td);
        });

        var opTd = document.createElement('td');
        opTd.className = 'op-cell';
        var expandBtn = document.createElement('button');
        expandBtn.className = 'btn-expand';
        expandBtn.textContent = expanded[id] ? '收起' : '展开';
        var copyBtn = document.createElement('button');
        copyBtn.className = 'btn-copy';
        copyBtn.textContent = '复制';
        opTd.appendChild(expandBtn);
        opTd.appendChild(copyBtn);
        tr.appendChild(opTd);
        itemsBody.appendChild(tr);

        var detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        detailRow.style.display = expanded[id] ? '' : 'none';
        var colspan = columns.length + 1;
        var description = item.itemDescription || item.description || '';
        var hasActions = item.useActionId || item.sellActionId || item.decomposeActionId;
        var detailContent = '<div class="details">' +
          '<div class="detail-section"><h5>简介</h5><p class="detail-desc">' + window.escapeHTML(description) + '</p></div>' +
          renderRequiredLevelsTable(item) +
          renderAttributesTable(item.attributes || []) +
          (hasActions ? '<div class="detail-section"><h5>动作ID</h5><table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>' +
            (item.useActionId ? '<tr><td>使用动作</td><td>' + window.escapeHTML(String(item.useActionId)) + '</td></tr>' : '') +
            (item.sellActionId ? '<tr><td>卖出动作</td><td>' + window.escapeHTML(String(item.sellActionId)) + '</td></tr>' : '') +
            (item.decomposeActionId ? '<tr><td>分解动作</td><td>' + window.escapeHTML(String(item.decomposeActionId)) + '</td></tr>' : '') +
            '</tbody></table></div>' : '') +
          '</div>';

        detailRow.innerHTML = '<td colspan="' + colspan + '">' + detailContent + '</td>';
        itemsBody.appendChild(detailRow);

        copyBtn.addEventListener('click', async function() {
          try {
            await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
            showToast('JSON 已复制到剪贴板', 'success');
          } catch (e) {
            console.error(e);
            showToast('复制失败', 'error');
          }
        });

        expandBtn.addEventListener('click', function() {
          expanded[id] = !expanded[id];
          render();
        });
      });
    }

    function loadDataAndRender() {
      window.fetchDataset('items').then(function(result) {
        data = Array.isArray(result) ? result : [];
        expanded = {};
        render();
      });
    }

    function init() {
      typeFilter.addEventListener('change', function() {
        render();
      });

      var searchTimer = null;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() {
          render();
        }, 200);
      });

      toggleSortBtn.addEventListener('click', function() {
        sortAsc = !sortAsc;
        toggleSortBtn.textContent = '排序: ' + (sortAsc ? '升序' : '降序');
        render();
      });

      loadDataAndRender();
    }

    init();
  }

  window.mountItemsTool = mountItemsTool;

})();
