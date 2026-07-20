/**
 * Wiki Actions 查询工具模块
 * 提供行动数据查询功能
 */

(function() {
  'use strict';

  var actionColumns = [
    { key: 'actionName', label: '行动名称', aliases: ['actionName', 'name'] },
    { key: 'actionType', label: '行动类型', aliases: ['actionType', 'type'], isBadge: true },
    { key: 'subActionType', label: '子类型', aliases: ['subActionType'] },
    { key: 'triggerType', label: '触发', aliases: ['triggerType'] },
    { key: 'exposeApi', label: '暴露API', aliases: ['exposeApi'], isBool: true },
    { key: 'isNeedActor', label: '需要角色', aliases: ['isNeedActor'], isBool: true },
    { key: 'isNeedMap', label: '需要地图', aliases: ['isNeedMap'], isBool: true },
    { key: 'consumeTableId', label: '消耗表ID', aliases: ['consumeTableId'] },
    { key: 'rewardTableId', label: '奖励表ID', aliases: ['rewardTableId'] }
  ];

  var actionTypeOptions = [
    { value: 'all', label: '全部' },
    { value: 'PIG_CRAFT', label: '小猪技艺' },
    { value: 'ITEM_USE', label: '物品使用' },
    { value: 'SHOP_BUY', label: '商店购买' },
    { value: 'MARKET_TRADE', label: '市场交易' },
    { value: 'TASK_FINISH', label: '任务完成' },
    { value: 'PIG_RECLASS', label: '小猪转职' },
    { value: 'BUILD_DEPLOY', label: '建筑部署' }
  ];

  var subActionTypeLabels = {
    surveying: '测绘',
    exploration: '探索',
    enemy_hunt: '寻敌',
    treasure_hunt: '寻宝',
    research: '研究',
    logging: '伐木',
    mining: '采矿',
    harvesting: '采摘',
    hunting: '狩猎',
    forge: '锻造',
    weave: '纺织',
    cook: '烹饪',
    alchemy: '炼金',
    enchant: '附魔',
    craft_book: '技艺之书',
    harvest: '采摘',
    craft: '制造'
  };

  var triggerTypeLabels = {
    INTERNAL: '自动',
    EXTERNAL: '手动',
    AUTO: '自动',
    MANUAL: '手动'
  };

  var extraParamLabels = {
    duration: '耗时(秒)',
    minExecutionTimes: '最小执行次数',
    maxExecutionTimes: '最大执行次数',
    requirements: '前置条件',
    professionId: '技艺',
    profession_strength: '技艺强度',
    expPerBook: '提供经验',
    craftId: '关联行动',
    mapRequirements: '地图需求',
    terrainTags: '地形标签',
    resourcePointType: '资源点类型',
    baseYieldMin: '最小产出',
    baseYieldMax: '最大产出',
    rewardTarget: '奖励目标',
    rareDrop: '稀有掉落',
    materialTier: '原料档位'
  };

  var resourcePointTypeLabels = {
    wood: '木材',
    ore: '矿石',
    herb: '草药',
    hunting_boar: '野猪',
    hunting_wolf: '狼',
    crop: '作物',
    fish: '鱼'
  };

  var mapResourceTypeLabels = {
    1: '活力',
    2: '资源',
    3: '外交'
  };

  var typeLabelMap = {
    PIG_CRAFT: '小猪技艺',
    ITEM_USE: '物品使用',
    SHOP_BUY: '商店购买',
    MARKET_TRADE: '市场交易',
    TASK_FINISH: '任务完成',
    PIG_RECLASS: '小猪转职',
    BUILD_DEPLOY: '建筑部署'
  };

  var typeColorMap = {
    PIG_CRAFT: '#8b5cf6',
    ITEM_USE: '#3b82f6',
    SHOP_BUY: '#f59e0b',
    MARKET_TRADE: '#10b981',
    TASK_FINISH: '#6366f1',
    PIG_RECLASS: '#ec4899',
    BUILD_DEPLOY: '#64748b'
  };

  var consumeTypeLabels = {
    item: '物品',
    suit: '套装',
    build: '建筑',
    map: '地图',
    resource: '身体资源',
    map_resource: '地图资源'
  };

  var rewardSubtypeLabels = {
    1: '物品',
    2: '经验值',
    3: '权限',
    4: '其他',
    5: '地图创建',
    6: '地图资源点'
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

  function resolveItemName(itemId, itemsData) {
    if (!itemsData || !itemId) return String(itemId);
    for (var i = 0; i < itemsData.length; i++) {
      if (itemsData[i].itemId === itemId) return itemsData[i].itemName || String(itemId);
    }
    return String(itemId);
  }

  function renderConsumeTable(consumeTableId, consumeTables, itemsData) {
    if (!consumeTableId) return '<p class="detail-empty">无消耗表</p>';
    var table = null;
    for (var i = 0; i < (consumeTables || []).length; i++) {
      if (String(consumeTables[i].consume_id) === String(consumeTableId)) {
        table = consumeTables[i];
        break;
      }
    }
    if (!table) return '<p class="detail-empty">消耗表 #' + window.escapeHTML(String(consumeTableId)) + ' 未找到</p>';

    var items = table.consume_items || [];
    if (items.length === 0) return '<p class="detail-empty">消耗表 #' + window.escapeHTML(String(consumeTableId)) + '（空）</p>';

    var rows = items.map(function(ci) {
      var typeLabel = consumeTypeLabels[ci.consume_type] || ci.consume_type;
      var targetName;
      if (ci.consume_type === 'item') {
        targetName = resolveItemName(ci.target_id, itemsData);
      } else if (ci.consume_type === 'resource' && ci.target_id === 1) {
        targetName = '体重';
      } else if (ci.consume_type === 'map_resource') {
        targetName = mapResourceTypeLabels[ci.target_id] || ('地图资源#' + ci.target_id);
      } else if (ci.consume_type === 'resource_point') {
        targetName = resourcePointTypeLabels[ci.target_id] || ('资源点#' + ci.target_id);
      } else {
        targetName = String(ci.target_id);
      }
      var chanceStr = ci.chance !== undefined && ci.chance !== null && ci.chance < 1
        ? (ci.chance * 100) + '%'
        : '100%';
      return '<tr>' +
        '<td>' + window.escapeHTML(typeLabel) + '</td>' +
        '<td>' + window.escapeHTML(targetName) + (ci.consume_type === 'item' ? ' <span class="ref-id">#' + window.escapeHTML(String(ci.target_id)) + '</span>' : '') + '</td>' +
        '<td>' + window.escapeHTML(String(ci.amount)) + '</td>' +
        '<td>' + chanceStr + '</td>' +
        '</tr>';
    }).join('');

    return '<div class="detail-section"><h5>消耗表 #' + window.escapeHTML(String(consumeTableId)) + '</h5>' +
      '<table class="detail-table"><thead><tr><th>类型</th><th>目标</th><th>数量</th><th>概率</th></tr></thead><tbody>' +
      rows + '</tbody></table></div>';
  }

  function renderRewardTable(rewardTableId, rewardTables, itemsData) {
    if (!rewardTableId) return '<p class="detail-empty">无奖励表</p>';
    var table = null;
    for (var i = 0; i < (rewardTables || []).length; i++) {
      if (String(rewardTables[i].reward_id) === String(rewardTableId)) {
        table = rewardTables[i];
        break;
      }
    }
    if (!table) return '<p class="detail-empty">奖励表 #' + window.escapeHTML(String(rewardTableId)) + ' 未找到</p>';

    var html = '<div class="detail-section"><h5>奖励表 #' + window.escapeHTML(String(rewardTableId)) + '</h5>';

    var mutex = table.mutex_rewards || [];
    if (mutex.length > 0) {
      html += '<p class="detail-sub-title">互斥奖励池（权重随机选一）</p>';
      var mutexRows = mutex.map(function(ri) {
        var subtypeLabel = rewardSubtypeLabels[ri.reward_subtype] || '类型' + ri.reward_subtype;
        var targetName;
        if (ri.reward_subtype === 1) {
          targetName = resolveItemName(ri.target_id, itemsData);
        } else if (ri.reward_subtype === 6) {
          targetName = mapResourceTypeLabels[ri.target_id] || ('地图资源#' + ri.target_id);
        } else if (ri.reward_subtype === 5) {
          targetName = '地图创建';
        } else {
          targetName = String(ri.target_id);
        }
        var amountStr = ri.amount_min === ri.amount_max
          ? String(ri.amount_min)
          : ri.amount_min + ' ~ ' + ri.amount_max;
        var chanceStr = ri.chance !== undefined && ri.chance !== null && ri.chance < 1
          ? (ri.chance * 100) + '%'
          : '100%';
        var weightStr = ri.weight !== undefined ? String(ri.weight) : '—';
        return '<tr>' +
          '<td>' + window.escapeHTML(subtypeLabel) + '</td>' +
          '<td>' + window.escapeHTML(targetName) + (ri.reward_subtype === 1 ? ' <span class="ref-id">#' + window.escapeHTML(String(ri.target_id)) + '</span>' : '') + '</td>' +
          '<td>' + amountStr + '</td>' +
          '<td>' + chanceStr + '</td>' +
          '<td>' + weightStr + '</td>' +
          '</tr>';
      }).join('');
      html += '<table class="detail-table"><thead><tr><th>类型</th><th>目标</th><th>数量</th><th>概率</th><th>权重</th></tr></thead><tbody>' + mutexRows + '</tbody></table>';
    }

    var independent = table.independent_rewards || [];
    if (independent.length > 0) {
      if (mutex.length > 0) html += '<p class="detail-sub-title">独立奖励池（每项独立判定）</p>';
      var indRows = independent.map(function(ri) {
        var subtypeLabel = rewardSubtypeLabels[ri.reward_subtype] || '类型' + ri.reward_subtype;
        var targetName;
        if (ri.reward_subtype === 1) {
          targetName = resolveItemName(ri.target_id, itemsData);
        } else if (ri.reward_subtype === 6) {
          targetName = mapResourceTypeLabels[ri.target_id] || ('地图资源#' + ri.target_id);
        } else if (ri.reward_subtype === 5) {
          targetName = '地图创建';
        } else {
          targetName = String(ri.target_id);
        }
        var amountStr = ri.amount_min === ri.amount_max
          ? String(ri.amount_min)
          : ri.amount_min + ' ~ ' + ri.amount_max;
        var chanceStr = ri.chance !== undefined && ri.chance !== null && ri.chance < 1
          ? (ri.chance * 100) + '%'
          : '100%';
        return '<tr>' +
          '<td>' + window.escapeHTML(subtypeLabel) + '</td>' +
          '<td>' + window.escapeHTML(targetName) + (ri.reward_subtype === 1 ? ' <span class="ref-id">#' + window.escapeHTML(String(ri.target_id)) + '</span>' : '') + '</td>' +
          '<td>' + amountStr + '</td>' +
          '<td>' + chanceStr + '</td>' +
          '</tr>';
      }).join('');
      html += '<table class="detail-table"><thead><tr><th>类型</th><th>目标</th><th>数量</th><th>概率</th></tr></thead><tbody>' + indRows + '</tbody></table>';
    }

    if (mutex.length === 0 && independent.length === 0) {
      html += '<p class="detail-empty">奖励表为空</p>';
    }

    html += '</div>';
    return html;
  }

  function renderExtraParamsTable(params) {
    var rows = [];
    Object.keys(params).forEach(function(key) {
      var label = extraParamLabels[key] || key;
      var val = params[key];
      var displayVal = '';

      if (key === 'duration') {
        displayVal = val >= 60 ? (val / 60).toFixed(1) + ' 分钟' : val + ' 秒';
      } else if (key === 'requirements' && Array.isArray(val)) {
        displayVal = val.map(function(req) {
          var parts = [];
          if (req.type === 'profession_strength') {
            parts.push('技艺「' + (subActionTypeLabels[req.professionId] || req.professionId) + '」强度 ≥ ' + req.value);
          } else {
            parts.push((req.type || '') + ' ≥ ' + (req.value || ''));
          }
          return parts.join('，');
        }).join('；');
      } else if (key === 'professionId') {
        displayVal = subActionTypeLabels[val] || val;
      } else if (key === 'expPerBook') {
        displayVal = val === 0 ? '—' : val + ' 经验';
      } else if (key === 'mapRequirements' && typeof val === 'object') {
        var mapParts = [];
        if (val.terrainTags) {
          mapParts.push('地形: ' + val.terrainTags.join(', '));
        }
        if (val.resourcePointType) {
          mapParts.push('资源点: ' + (resourcePointTypeLabels[val.resourcePointType] || val.resourcePointType));
        }
        displayVal = mapParts.join('；') || JSON.stringify(val);
      } else if (key === 'resourcePointType') {
        displayVal = resourcePointTypeLabels[val] || val;
      } else if (typeof val === 'object') {
        displayVal = JSON.stringify(val);
      } else {
        displayVal = val === 0 ? '—' : String(val);
      }

      rows.push('<tr><td>' + window.escapeHTML(label) + '</td><td>' + window.escapeHTML(displayVal) + '</td></tr>');
    });

    return '<table class="detail-table"><thead><tr><th>参数</th><th>值</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>';
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

  function mountActionsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('actions-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.actions-component');
    var typeFilter = root.querySelector('.actionTypeFilter');
    var searchInput = root.querySelector('.searchInput');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var statsCount = root.querySelector('.stats-count');
    var tableHead = root.querySelector('.tableHead');
    var itemsBody = root.querySelector('.itemsBody');
    var emptyNotice = root.querySelector('.empty');

    var data = [];
    var expanded = {};
    var sortAsc = true;
    var consumeTables = [];
    var rewardTables = [];
    var itemsData = [];

    // Build type filter options
    actionTypeOptions.forEach(function(opt) {
      var option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      typeFilter.appendChild(option);
    });

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
          return it.actionType === typeVal;
        });
      }

      if (keyword) {
        list = list.filter(function(it) {
          var id = String(it.actionId).toLowerCase();
          var name = String(it.actionName || '').toLowerCase();
          return id.indexOf(keyword) >= 0 || name.indexOf(keyword) >= 0;
        });
      }

      list.sort(function(a, b) {
        var ai = a.actionId;
        var bi = b.actionId;
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

      buildTableHeader(tableHead, actionColumns);

      list.forEach(function(item) {
        var id = item.actionId;
        var tr = document.createElement('tr');
        tr.className = 'row';

        actionColumns.forEach(function(col) {
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
          } else if (col.key === 'subActionType') {
            var subLabel = subActionTypeLabels[value] || value;
            td.innerHTML = '<span title="' + window.escapeHTML(String(value)) + '">' + window.escapeHTML(subLabel) + '</span>';
          } else if (col.key === 'triggerType') {
            var trigLabel = triggerTypeLabels[value] || value;
            td.innerHTML = '<span title="' + window.escapeHTML(String(value)) + '">' + window.escapeHTML(trigLabel) + '</span>';
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
        var colspan = actionColumns.length + 1;
        var detailContent = '';

        detailContent = '<div class="details">' +
          '<div class="detail-section"><h5>行动标识</h5><p class="detail-desc">' + window.escapeHTML(item.actionId) + '</p></div>' +
          '<div class="detail-grid">' +
          renderConsumeTable(item.consumeTableId, consumeTables, itemsData) +
          renderRewardTable(item.rewardTableId, rewardTables, itemsData) +
          '</div>';

        var extraParams = item.extraParams || {};
        if (Object.keys(extraParams).length > 0) {
          detailContent += '<div class="detail-section"><h5>额外参数</h5>' +
            renderExtraParamsTable(extraParams) + '</div>';
        }
        detailContent += '</div>';

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
      Promise.all([
        window.fetchDataset('actions'),
        window.fetchDataset('consumeTables'),
        window.fetchDataset('rewardTables'),
        window.fetchDataset('items')
      ]).then(function(results) {
        data = Array.isArray(results[0]) ? results[0] : [];
        consumeTables = Array.isArray(results[1]) ? results[1] : [];
        rewardTables = Array.isArray(results[2]) ? results[2] : [];
        itemsData = Array.isArray(results[3]) ? results[3] : [];
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

  window.mountActionsTool = mountActionsTool;

})();
