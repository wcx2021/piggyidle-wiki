/**
 * Wiki Buff 查询工具模块
 * 提供 Buff 配置数据查询功能
 * 属性字段映射从 buffs.json 的 _attributeLabels 动态加载
 */

(function() {
  'use strict';

  var typeColorMap = {
    buff: '#10b981',
    debuff: '#ef4444',
    control: '#f59e0b'
  };

  // 属性字段标签映射（从数据加载）
  var labels = {
    type: {},
    targetAttribute: {},
    modifyMode: {},
    damageType: {},
    variable: {}
  };

  var buffColumns = [
    { key: 'name_cn', label: '名称', aliases: ['name_cn', 'name'] },
    { key: 'type', label: '类型', aliases: ['type'], isBadge: true },
    { key: 'targetAttribute', label: '目标属性', aliases: ['targetAttribute', 'attribute'], useLabelMap: 'targetAttribute' },
    { key: 'modifyMode', label: '修正模式', aliases: ['modifyMode'], useLabelMap: 'modifyMode' },
    { key: 'defaultValue', label: '默认数值', aliases: ['defaultValue'] },
    { key: 'stackable', label: '可叠加', aliases: ['stackable'], isBool: true },
    { key: 'variable', label: '可变输入', aliases: ['variable'], useLabelMap: 'variable' },
    { key: 'tag', label: '特殊标记', aliases: ['tag'] }
  ];

  function getLabel(mapName, key) {
    var map = labels[mapName];
    if (!map) return null;
    return map[key] || null;
  }

  function formatCell(v, col) {
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return '—';
    if (col && col.isBool) return v ? '✓' : '✗';
    if (col && col.useLabelMap) {
      if (Array.isArray(v)) {
        return v.map(function(item) {
          return getLabel(col.useLabelMap, item) || item;
        }).join(', ');
      }
      if (v === null) return '—';
      return getLabel(col.useLabelMap, v) || String(v);
    }
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  }

  function renderBadge(text, colorKey) {
    var color = typeColorMap[colorKey] || '#6b7280';
    var label = getLabel('type', colorKey) || text;
    return '<span class="type-badge" style="background:' + color + '1a;color:' + color + ';border:1px solid ' + color + '33;">' + window.escapeHTML(label) + '</span>';
  }

  function renderDetailContent(item) {
    var html = '';

    // buffId 标识头
    html += '<div class="buff-detail-header">' +
      '<span class="buff-detail-id">' + window.escapeHTML(item.buffId) + '</span>' +
      '<span class="type-badge" style="background:' + (typeColorMap[item.type] || '#6b7280') + '1a;color:' + (typeColorMap[item.type] || '#6b7280') + ';border:1px solid ' + (typeColorMap[item.type] || '#6b7280') + '33;">' + window.escapeHTML(getLabel('type', item.type) || item.type) + '</span>' +
      '</div>';

    // 属性修正卡片
    html += '<div class="detail-section"><h5>属性修正</h5><div class="detail-grid">';
    if (item.targetAttribute !== null && item.targetAttribute !== undefined) {
      html += '<div class="detail-card"><span class="detail-card-label">目标属性</span><span class="detail-card-value">' + window.escapeHTML(getLabel('targetAttribute', item.targetAttribute) || item.targetAttribute) + '</span></div>';
    } else {
      html += '<div class="detail-card"><span class="detail-card-label">目标属性</span><span class="detail-card-value muted">无（纯标记/周期）</span></div>';
    }
    if (item.modifyMode) {
      html += '<div class="detail-card"><span class="detail-card-label">修正模式</span><span class="detail-card-value">' + window.escapeHTML(getLabel('modifyMode', item.modifyMode) || item.modifyMode) + '</span></div>';
    }
    html += '<div class="detail-card"><span class="detail-card-label">默认数值</span><span class="detail-card-value">' + item.defaultValue + '</span></div>';
    html += '<div class="detail-card"><span class="detail-card-label">可叠加</span><span class="detail-card-value">' + (item.stackable ? '✓ 是' : '✗ 覆盖') + '</span></div>';
    if (item.variable && item.variable.length > 0) {
      var variableLabels = item.variable.map(function(v) { return getLabel('variable', v) || v; });
      html += '<div class="detail-card"><span class="detail-card-label">可变输入</span><span class="detail-card-value">' + variableLabels.join(', ') + '</span></div>';
    }
    if (item.tag) {
      html += '<div class="detail-card"><span class="detail-card-label">特殊标记</span><span class="detail-card-value">' + window.escapeHTML(item.tag) + '</span></div>';
    }
    html += '</div></div>';

    // 周期性效果卡片
    if (item.periodicEffect) {
      var pe = item.periodicEffect;
      html += '<div class="detail-section"><h5>周期性效果</h5><div class="detail-grid">' +
        '<div class="detail-card"><span class="detail-card-label">触发间隔</span><span class="detail-card-value">每 ' + pe.interval + ' 帧</span></div>' +
        '<div class="detail-card"><span class="detail-card-label">基础值</span><span class="detail-card-value">' + pe.baseValue + '</span></div>' +
        '<div class="detail-card"><span class="detail-card-label">伤害类型</span><span class="detail-card-value">' + window.escapeHTML(getLabel('damageType', pe.damageType) || pe.damageType || '—') + '</span></div>' +
        '</div></div>';
    }

    return html;
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

  function mountBuffsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('buffs-template');
    if (!tpl) {
      container.innerHTML = '<p class="notice">模板加载失败</p>';
      return;
    }
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.buffs-component');
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
          return it.type === typeVal;
        });
      }

      if (keyword) {
        list = list.filter(function(it) {
          var id = String(it.buffId || '').toLowerCase();
          var name = String(it.name_cn || '').toLowerCase();
          var attr = String(it.targetAttribute || '').toLowerCase();
          var type = String(it.type || '').toLowerCase();
          return id.indexOf(keyword) >= 0 || name.indexOf(keyword) >= 0 || attr.indexOf(keyword) >= 0 || type.indexOf(keyword) >= 0;
        });
      }

      list.sort(function(a, b) {
        var ai = a.buffId || '';
        var bi = b.buffId || '';
        return sortAsc ? ai.localeCompare(bi) : bi.localeCompare(ai);
      });

      updateStats(data.length, list.length);

      if (list.length === 0) {
        emptyNotice.classList.remove('hidden');
        buildTableHeader(tableHead, []);
        return;
      } else {
        emptyNotice.classList.add('hidden');
      }

      var columns = buffColumns;
      buildTableHeader(tableHead, columns);

      list.forEach(function(item) {
        var id = item.buffId;
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
            td.innerHTML = value ? '✓' : '✗';
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
        opTd.appendChild(expandBtn);
        tr.appendChild(opTd);
        itemsBody.appendChild(tr);

        var detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        detailRow.style.display = expanded[id] ? '' : 'none';
        var colspan = columns.length + 1;
        detailRow.innerHTML = '<td colspan="' + colspan + '"><div class="details">' + renderDetailContent(item) + '</div></td>';
        itemsBody.appendChild(detailRow);

        expandBtn.addEventListener('click', function() {
          expanded[id] = !expanded[id];
          render();
        });
      });
    }

    function loadDataAndRender() {
      window.fetchDataset('buffs').then(function(result) {
        // 加载属性字段映射
        if (result && result._attributeLabels) {
          var attrKeys = Object.keys(result._attributeLabels);
          for (var i = 0; i < attrKeys.length; i++) {
            var key = attrKeys[i];
            if (labels[key] !== undefined) {
              labels[key] = result._attributeLabels[key];
            }
          }
        }

        // buffs.json 格式: { _meta: {...}, _attributeLabels: {...}, buffs: { id: config, ... } }
        // 转为数组 [{ buffId, ...config }, ...]
        data = [];
        if (result && result.buffs && typeof result.buffs === 'object') {
          var keys = Object.keys(result.buffs);
          for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var entry = result.buffs[key];
            entry.buffId = key;
            data.push(entry);
          }
        }
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

  window.mountBuffsTool = mountBuffsTool;

})();