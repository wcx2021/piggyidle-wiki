/**
 * Wiki Items 查询工具模块
 * 提供道具/行动数据查询功能
 */

(function() {
  'use strict';

  // 列定义
  var itemColumns = [
    { key: 'itemId', label: 'ID', aliases: ['itemId', 'id'] },
    { key: 'itemName', label: '名称', aliases: ['itemName', 'name'] },
    { key: 'itemType', label: '类别', aliases: ['itemType', 'type'] },
    { key: 'itemDescription', label: '简介', aliases: ['itemDescription', 'description'] },
    { key: 'iconUrl', label: '图标', aliases: ['iconUrl', 'icon'] },
    { key: 'isTradable', label: '可交易', aliases: ['isTradable', 'tradable', 'is_tradable'] },
    { key: 'isInteractive', label: '可互动', aliases: ['isInteractive', 'interactive', 'is_interactive'] },
    { key: 'isDecomposable', label: '可分解', aliases: ['isDecomposable', 'decomposable', 'is_decomposable'] },
    { key: 'shopPrice', label: '商店价格', aliases: ['shopPrice', 'price'] },
    { key: 'growthCoefficient', label: '成长系数', aliases: ['growthCoefficient', 'growth_coefficient'] },
    { key: 'useActionId', label: '使用动作ID', aliases: ['useActionId', 'use_action_id'] },
    { key: 'sellActionId', label: '卖出动作ID', aliases: ['sellActionId', 'sell_action_id'] },
    { key: 'decomposeActionId', label: '分解动作ID', aliases: ['decomposeActionId', 'decompose_action_id'] }
  ];

  var actionColumns = [
    { key: 'actionId', label: '行动标识', aliases: ['actionId', 'id'] },
    { key: 'actionName', label: '行动名称', aliases: ['actionName', 'name'] },
    { key: 'actionType', label: '行动类型', aliases: ['actionType', 'type'] },
    { key: 'subActionType', label: '子类型', aliases: ['subActionType'] },
    { key: 'triggerType', label: '触发方式', aliases: ['triggerType'] },
    { key: 'exposeApi', label: '暴露API', aliases: ['exposeApi'] },
    { key: 'isNeedActor', label: '需要角色', aliases: ['isNeedActor'] },
    { key: 'isNeedMap', label: '需要地图', aliases: ['isNeedMap'] },
    { key: 'consumeTableId', label: '消耗表ID', aliases: ['consumeTableId'] },
    { key: 'rewardTableId', label: '奖励表ID', aliases: ['rewardTableId'] }
  ];

  // 类型筛选选项
  var itemTypeOptions = [
    { value: 'all', label: '全部' },
    { value: 'currency', label: '货币（currency）' },
    { value: 'map', label: '地图（map）' },
    { value: 'compendium', label: '图鉴（compendium）' },
    { value: 'equipment', label: '装备（equipment）' },
    { value: 'pig', label: '小猪（pig）' },
    { value: 'suit', label: '套装（suit）' },
    { value: 'treasure', label: '宝箱（treasure）' },
    { value: 'resource', label: '资源（resource）' },
    { value: 'building', label: '建筑（building）' }
  ];

  var actionTypeOptions = [
    { value: 'all', label: '全部' },
    { value: 'PIG_CRAFT', label: '小猪技艺（PIG_CRAFT）' },
    { value: 'ITEM_USE', label: '物品使用（ITEM_USE）' },
    { value: 'SHOP_BUY', label: '商店购买（SHOP_BUY）' },
    { value: 'MARKET_TRADE', label: '市场交易（MARKET_TRADE）' },
    { value: 'TASK_FINISH', label: '任务完成（TASK_FINISH）' },
    { value: 'PIG_RECLASS', label: '小猪转职（PIG_RECLASS）' },
    { value: 'BUILD_DEPLOY', label: '建筑部署（BUILD_DEPLOY）' }
  ];

  /**
   * 格式化单元格值
   */
  function formatCell(v) {
    if (v === null || v === undefined || v === '') return '空';
    return String(v);
  }

  /**
   * 渲染属性表
   */
  function renderAttributesTableFromList(attrs) {
    if (!attrs || attrs.length === 0) return '<p><em>无属性</em></p>';
    var rows = attrs.map(function(a) {
      var k = a.name || a.key || '';
      var v = a.value || '';
      return '<tr><td>' + window.escapeHTML(k) + '</td><td>' + window.escapeHTML(String(v)) + '</td></tr>';
    }).join('');
    return '<h4>属性表</h4><table class="attr-table" aria-label="属性表"><thead><tr><th>名称</th><th>数值</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /**
   * 渲染需求等级表
   */
  function renderRequiredLevelsTable(item) {
    var rl = item.requiredLevels || item.required_levels || item.required_level || null;
    if (rl === null || rl === undefined || rl === '') return '<p><em>无等级需求</em></p>';
    if (Array.isArray(rl) && rl.length === 0) return '<p><em>无等级需求</em></p>';
    if (typeof rl === 'object' && !Array.isArray(rl) && Object.keys(rl).length === 0) return '<p><em>无等级需求</em></p>';

    if (Array.isArray(rl)) {
      var rows = rl.map(function(r) {
        var k = r.level || r.key || '';
        var v = r.value || r.req || JSON.stringify(r);
        return '<tr><td>' + window.escapeHTML(String(k)) + '</td><td>' + window.escapeHTML(String(v)) + '</td></tr>';
      }).join('');
      return '<h4>需求等级</h4><table class="attr-table"><thead><tr><th>等级</th><th>要求</th></tr></thead><tbody>' + rows + '</tbody></table>';
    } else if (typeof rl === 'object') {
      var objRows = Object.entries(rl).map(function(entry) {
        return '<tr><td>' + window.escapeHTML(entry[0]) + '</td><td>' + window.escapeHTML(String(entry[1])) + '</td></tr>';
      }).join('');
      return '<h4>需求等级</h4><table class="attr-table"><thead><tr><th>键</th><th>值</th></tr></thead><tbody>' + objRows + '</tbody></table>';
    } else {
      return '<p><strong>需求等级:</strong> ' + window.escapeHTML(String(rl)) + '</p>';
    }
  }

  /**
   * 构建表头
   */
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

  /**
   * 更新类型筛选器选项
   */
  function updateTypeFilter(typeFilter, currentDataset) {
    var options = currentDataset === 'items' ? itemTypeOptions : actionTypeOptions;
    typeFilter.innerHTML = '';
    options.forEach(function(opt) {
      var option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      typeFilter.appendChild(option);
    });
  }

  /**
   * 挂载 Items 查询工具
   */
  function mountItemsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('items-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.items-component');
    var datasetFilter = root.querySelector('.datasetFilter');
    var typeFilter = root.querySelector('.typeFilter');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var tableHead = root.querySelector('.tableHead');
    var itemsBody = root.querySelector('.itemsBody');
    var emptyNotice = root.querySelector('.empty');

    var currentDataset = datasetFilter.value;
    var data = [];
    var expanded = {};
    var sortAsc = true;

    /**
     * 渲染表格
     */
    function render() {
      var typeVal = typeFilter.value;
      itemsBody.innerHTML = '';
      var list = data.slice();

      if (typeVal !== 'all') {
        list = list.filter(function(it) {
          var t = it.itemType || it.type || it.actionType || '';
          return t === typeVal;
        });
      }

      list.sort(function(a, b) {
        var ai = a.itemId !== undefined ? a.itemId : (a.id !== undefined ? a.id : a.actionId);
        var bi = b.itemId !== undefined ? b.itemId : (b.id !== undefined ? b.id : b.actionId);
        if (typeof ai === 'number' && typeof bi === 'number') {
          return sortAsc ? ai - bi : bi - ai;
        } else {
          return sortAsc ? String(ai).localeCompare(String(bi)) : String(bi).localeCompare(String(ai));
        }
      });

      if (list.length === 0) {
        emptyNotice.classList.remove('hidden');
        buildTableHeader(tableHead, []);
        return;
      } else {
        emptyNotice.classList.add('hidden');
      }

      var columns = currentDataset === 'items' ? itemColumns : actionColumns;
      buildTableHeader(tableHead, columns);

      list.forEach(function(item) {
        var id = item.itemId !== undefined ? item.itemId : (item.id !== undefined ? item.id : item.actionId);
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
          if (col.key === 'iconUrl' && typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
            var img = document.createElement('img');
            img.className = 'icon-thumb';
            img.src = value;
            img.alt = 'icon';
            td.appendChild(img);
          } else {
            td.textContent = formatCell(value);
          }
          tr.appendChild(td);
        });

        // 操作列
        var opTd = document.createElement('td');
        var copyBtn = document.createElement('button');
        copyBtn.textContent = '复制 JSON';
        var expandBtn = document.createElement('button');
        expandBtn.textContent = expanded[id] ? '收起' : '展开详情';
        opTd.appendChild(copyBtn);
        opTd.appendChild(document.createTextNode(' '));
        opTd.appendChild(expandBtn);
        tr.appendChild(opTd);
        itemsBody.appendChild(tr);

        // 详情行
        var detailRow = document.createElement('tr');
        detailRow.style.display = expanded[id] ? '' : 'none';
        var colspan = columns.length + 1;
        var detailContent = '';

        if (currentDataset === 'actions') {
          var extraParams = item.extraParams || {};
          detailContent = '<div class="details">' +
            '<h4>行动详情</h4>' +
            '<p><strong>消耗表ID:</strong> ' + window.escapeHTML(String(item.consumeTableId || '无')) + '</p>' +
            '<p><strong>奖励表ID:</strong> ' + window.escapeHTML(String(item.rewardTableId || '无')) + '</p>' +
            '<h4>额外参数（extraParams）</h4>' +
            '<pre style="background:var(--bg);padding:8px;border-radius:4px;overflow:auto;white-space:pre-wrap;">' +
            window.escapeHTML(JSON.stringify(extraParams, null, 2)) + '</pre>' +
            '</div>';
        } else {
          var description = item.itemDescription || item.description || '';
          var attrs = item.attributes || [];
          detailContent = '<div class="details"><strong>简介:</strong> ' +
            window.escapeHTML(description) +
            renderRequiredLevelsTable(item) +
            renderAttributesTableFromList(attrs) +
            '</div>';
        }

        detailRow.innerHTML = '<td colspan="' + colspan + '">' + detailContent + '</td>';
        itemsBody.appendChild(detailRow);

        // 复制按钮事件
        copyBtn.addEventListener('click', async function() {
          try {
            await navigator.clipboard.writeText(JSON.stringify(item, null, 2));
            alert('JSON 已复制到剪贴板');
          } catch (e) {
            console.error(e);
            alert('复制失败');
          }
        });

        // 展开按钮事件
        expandBtn.addEventListener('click', function() {
          expanded[id] = !expanded[id];
          render();
        });
      });
    }

    /**
     * 加载数据并渲染
     */
    function loadDataAndRender() {
      window.fetchDataset(currentDataset).then(function(arr) {
        data = Array.isArray(arr) ? arr : [];
        expanded = {};
        render();
      });
    }

    /**
     * 初始化
     */
    function init() {
      datasetFilter.addEventListener('change', function() {
        currentDataset = datasetFilter.value;
        updateTypeFilter(typeFilter, currentDataset);
        loadDataAndRender();
      });

      typeFilter.addEventListener('change', function() {
        render();
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

  // 暴露到全局
  window.mountItemsTool = mountItemsTool;

})();
