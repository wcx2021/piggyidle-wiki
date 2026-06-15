/**
 * Wiki 道具生成器模块
 * 提供道具数据编辑和导出功能
 */

(function() {
  'use strict';

  // 字段类型覆盖配置
  var FIELD_TYPE_OVERRIDES = {
    isTradable: 'boolean',
    isInteractive: 'boolean',
    isDecomposable: 'boolean',
    itemId: 'number',
    shopPrice: 'number',
    growthCoefficient: 'number',
    actionId: 'number',
    baseDuration: 'number',
    baseExperience: 'number',
    itemDescription: 'textarea',
    attributes: 'json',
    requiredLevels: 'json',
    baseRewards: 'json',
    rareRewards: 'json',
    iconUrl: 'text',
    useActionId: 'text',
    sellActionId: 'text',
    decomposeActionId: 'text'
  };

  // 枚举选项
  var ENUM_OPTIONS = {
    itemType: ['currency', 'map', 'compendium', 'equipment', 'pig', 'suit', 'treasure', 'resource', 'building'],
    professionType: ['surveying', 'exploration', 'enemy_hunt', 'treasure_hunt', 'research', 'logging', 'mining', 'harvesting', 'hunting', 'blacksmith', 'weaving', 'cooking', 'alchemy', 'enchantment', 'crafting']
  };

  // 类型前缀映射
  var TYPE_PREFIX = {
    currency: '1',
    map: '2',
    compendium: '3',
    equipment: '4',
    pig: '5',
    suit: '6',
    treasure: '7',
    resource: '8',
    building: '9'
  };

  /**
   * 补齐三位数字
   */
  function pad3(n) {
    return String(n).padStart(3, '0');
  }

  /**
   * 解析 itemId
   */
  function parseItemId(num) {
    if (num === '' || num === null || num === undefined) return { prefix: '', suffix: '' };
    var s = String(num);
    if (s.length >= 4) {
      return { prefix: s[0], suffix: s.slice(1).padStart(3, '0') };
    } else if (s.length <= 3) {
      return { prefix: '', suffix: pad3(Number(num) || 0) };
    } else {
      return { prefix: s[0], suffix: s.slice(1).padStart(3, '0') };
    }
  }

  /**
   * 检测数据类型
   */
  function detectDataType(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return 'items';
    var sample = arr[0];
    if (sample.hasOwnProperty('actionId') || sample.hasOwnProperty('baseDuration') || sample.hasOwnProperty('professionType')) return 'actions';
    return 'items';
  }

  /**
   * 构建可编辑表格
   */
  function buildEditableTable(arr, type, genType, area) {
    var itemCols = ['itemId', 'itemName', 'itemType', 'itemDescription', 'iconUrl', 'isTradable', 'isInteractive', 'isDecomposable', 'shopPrice', 'growthCoefficient', 'requiredLevels', 'attributes', 'useActionId', 'sellActionId', 'decomposeActionId'];
    var actionCols = ['actionId', 'actionName', 'professionType', 'baseDuration', 'baseExperience'];
    var cols = type === 'actions' ? actionCols : itemCols;
    var keys = cols.slice();

    var table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';

    var thead = document.createElement('thead');
    var trh = document.createElement('tr');

    keys.forEach(function(k) {
      var th = document.createElement('th');
      th.style.padding = '6px';
      th.style.border = '1px solid var(--muted)';
      var label = k;
      try {
        if (window.fieldMapping) {
          if (type === 'actions' && window.fieldMapping.Action && window.fieldMapping.Action[k]) {
            label = window.fieldMapping.Action[k];
          } else if (type === 'items' && window.fieldMapping.Item && window.fieldMapping.Item[k]) {
            label = window.fieldMapping.Item[k];
          } else if (window.fieldMapping.Item && window.fieldMapping.Item[k]) {
            label = window.fieldMapping.Item[k];
          } else if (window.fieldMapping.Action && window.fieldMapping.Action[k]) {
            label = window.fieldMapping.Action[k];
          }
        }
      } catch (e) {
        // 忽略错误
      }
      th.textContent = label;
      trh.appendChild(th);
    });

    var opTh = document.createElement('th');
    opTh.style.padding = '6px';
    opTh.style.border = '1px solid var(--muted)';
    opTh.textContent = '操作';
    trh.appendChild(opTh);
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    table.appendChild(tbody);

    /**
     * 获取下一个可用后缀
     */
    function getNextSuffix(prefix, scanGlobal) {
      var used = new Set();
      tbody.querySelectorAll('tr').forEach(function(r) {
        var el = r.querySelector('td input[data-role="itemSuffix"]');
        var pEl = r.querySelector('td input[data-role="itemPrefix"]');
        if (el && pEl) {
          var p = pEl.value || '';
          var s = el.value || '';
          if (p === String(prefix) && s !== '') {
            used.add(Number(s));
          }
        }
      });

      if (scanGlobal && window.fetchCache && window.fetchCache.items && Array.isArray(window.fetchCache.items)) {
        window.fetchCache.items.forEach(function(it) {
          var id = it.itemId || it.id;
          if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
            var parsed = parseItemId(id);
            if (parsed.prefix === String(prefix) && parsed.suffix !== '') {
              used.add(Number(parsed.suffix));
            }
          }
        });
      }

      for (var i = 1; i <= 999; i++) {
        if (!used.has(i)) return i;
      }
      return null;
    }

    /**
     * 创建 itemId 单元格
     */
    function createItemIdCell(obj, value) {
      var td = document.createElement('td');
      td.style.padding = '6px';
      td.style.border = '1px solid var(--muted)';

      var currentTypeFromRow = (obj && (obj.itemType || obj.type)) || '';
      var globalType = (genType && genType.value) ? genType.value : (type || '');
      var currentType = currentTypeFromRow || globalType || '';
      var prefixVal = TYPE_PREFIX[currentType] || '';
      var parsed = parseItemId(value);

      var prefixInput = document.createElement('input');
      prefixInput.type = 'text';
      prefixInput.readOnly = true;
      prefixInput.value = parsed.prefix || prefixVal || '';
      prefixInput.style.width = '40px';
      prefixInput.style.marginRight = '6px';
      prefixInput.dataset.type = 'number';
      prefixInput.dataset.role = 'itemPrefix';

      var suffixInput = document.createElement('input');
      suffixInput.type = 'number';
      suffixInput.min = 0;
      suffixInput.max = 999;
      suffixInput.step = 1;
      suffixInput.value = parsed.suffix ? String(Number(parsed.suffix)) : '';
      suffixInput.style.width = '80px';
      suffixInput.dataset.type = 'number';
      suffixInput.dataset.role = 'itemSuffix';

      suffixInput.getFullId = function() {
        var p = prefixInput.value || '';
        var s = suffixInput.value === '' ? '' : pad3(Number(suffixInput.value));
        return p && s ? Number(String(p) + s) : (s ? Number(s) : null);
      };

      if ((suffixInput.value === '' || suffixInput.value === '0') && prefixInput.value) {
        var next = getNextSuffix(prefixInput.value, true);
        if (next !== null) {
          suffixInput.value = String(next);
        }
      }

      td.updatePrefix = function(newPrefix) {
        prefixInput.value = newPrefix || '';
        if ((suffixInput.value === '' || suffixInput.value === '0') && prefixInput.value) {
          var nextSuffix = getNextSuffix(prefixInput.value, true);
          if (nextSuffix !== null) suffixInput.value = String(nextSuffix);
        }
      };

      td.appendChild(prefixInput);
      td.appendChild(suffixInput);
      return td;
    }

    /**
     * 创建单元格输入
     */
    function createCellInput(key, value, rowObj) {
      var td = document.createElement('td');
      td.style.padding = '6px';
      td.style.border = '1px solid var(--muted)';
      var input;
      var override = FIELD_TYPE_OVERRIDES[key];

      if (key === 'itemId' && (type === 'items' || rowObj && rowObj.itemType !== undefined)) {
        return createItemIdCell(rowObj || {}, value);
      }

      if (override === 'boolean' || (override === undefined && typeof value === 'boolean')) {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = Boolean(value);
        input.dataset.type = 'boolean';
        input.style.width = 'auto';
      } else if (override === 'json') {
        input = document.createElement('textarea');
        input.rows = 3;
        try {
          input.value = value && typeof value !== 'string' ? JSON.stringify(value, null, 2) : (value || '[]');
        } catch (e) {
          input.value = String(value || '[]');
        }
        input.dataset.type = 'json';
      } else if (override === 'select' || ENUM_OPTIONS[key]) {
        input = document.createElement('select');
        var opts = ENUM_OPTIONS[key] || [];
        opts.forEach(function(o) {
          var opt = document.createElement('option');
          opt.value = o;
          opt.textContent = o;
          if (String(value) === String(o)) opt.selected = true;
          input.appendChild(opt);
        });
        input.dataset.type = 'select';

        if (key === 'itemType') {
          input.addEventListener('change', function(e) {
            try {
              var selVal = e.target.value;
              var desiredPrefix = TYPE_PREFIX[selVal] || '';
              var tr = input.closest('tr');
              if (!tr) return;
              var idCell = Array.from(tr.children).find(function(td) {
                return td.querySelector && td.querySelector('input[data-role="itemPrefix"]');
              });
              if (idCell) {
                var pEl = idCell.querySelector('input[data-role="itemPrefix"]');
                var sEl = idCell.querySelector('input[data-role="itemSuffix"]');
                if (pEl && (!pEl.value || pEl.value !== desiredPrefix)) {
                  pEl.value = desiredPrefix;
                  if (sEl && (sEl.value === '' || sEl.value === '0') && desiredPrefix) {
                    var nextSuffix = getNextSuffix(desiredPrefix, true);
                    if (nextSuffix !== null) sEl.value = String(nextSuffix);
                  }
                }
              }
            } catch (err) {
              // 忽略错误
            }
          });
        }
      } else if (override === 'textarea' || (override === undefined && typeof value === 'string' && value.length > 120)) {
        input = document.createElement('textarea');
        input.rows = 3;
        input.value = value || '';
        input.dataset.type = 'text';
      } else if (override === 'number' || (override === undefined && typeof value === 'number')) {
        input = document.createElement('input');
        input.type = 'number';
        input.step = 'any';
        input.value = (value === null || value === undefined) ? '' : String(value);
        input.dataset.type = 'number';
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = value === null || value === undefined ? '' : String(value);
        input.dataset.type = 'text';
      }

      input.style.width = '100%';
      input.style.boxSizing = 'border-box';
      td.appendChild(input);
      return td;
    }

    /**
     * 添加行
     */
    function appendRow(obj) {
      var tr = document.createElement('tr');
      keys.forEach(function(k) {
        var v = obj && obj[k] !== undefined && obj[k] !== null ? obj[k] : '';
        var td = createCellInput(k, v, obj);
        tr.appendChild(td);
      });
      var opTd = document.createElement('td');
      opTd.style.padding = '6px';
      opTd.style.border = '1px solid var(--muted)';
      var del = document.createElement('button');
      del.textContent = '删除';
      del.addEventListener('click', function() {
        tr.remove();
      });
      opTd.appendChild(del);
      tr.appendChild(opTd);
      tbody.appendChild(tr);
    }

    arr.forEach(function(a) {
      appendRow(a);
    });

    var addRowBtn = document.createElement('button');
    addRowBtn.textContent = '新增行';
    addRowBtn.addEventListener('click', function() {
      appendRow({});
    });

    var exportBtn = document.createElement('button');
    exportBtn.textContent = '生成 JSON 并导出';
    exportBtn.style.marginLeft = '8px';
    exportBtn.addEventListener('click', function() {
      var out = [];
      var conflicts = [];
      var idSet = new Set();

      tbody.querySelectorAll('tr').forEach(function(r, rowIndex) {
        var obj = {};
        var cells = Array.from(r.children);
        for (var i = 0; i < keys.length; i++) {
          var cell = cells[i];
          var k = keys[i];

          if (k === 'itemId') {
            var pEl = cell.querySelector('input[data-role="itemPrefix"]');
            var sEl = cell.querySelector('input[data-role="itemSuffix"]');
            var prefix = pEl ? (pEl.value || '') : '';
            var suffixRaw = sEl ? (sEl.value || '') : '';
            var suffix = suffixRaw === '' ? null : pad3(Number(suffixRaw));
            if (prefix && suffix) {
              obj[k] = Number(String(prefix) + suffix);
            } else if (suffix && !prefix) {
              obj[k] = Number(suffix);
            } else {
              obj[k] = null;
            }
            continue;
          }

          var el = cell.querySelector('input,textarea,select');
          if (!el) {
            obj[k] = '';
            continue;
          }
          var dtype = el.dataset.type;
          if (dtype === 'boolean') obj[k] = !!el.checked;
          else if (dtype === 'number') {
            var v = el.value.trim();
            obj[k] = v === '' ? null : Number(v);
          } else if (dtype === 'json') {
            try {
              obj[k] = JSON.parse(el.value || '[]');
            } catch (e) {
              obj[k] = el.value;
            }
          } else obj[k] = el.value;
        }

        if (obj.itemId !== null && obj.itemId !== undefined) {
          if (idSet.has(obj.itemId)) conflicts.push({ row: rowIndex + 1, id: obj.itemId });
          idSet.add(obj.itemId);
        }
        out.push(obj);
      });

      if (conflicts.length > 0) {
        var msg = '检测到重复 ID：\n';
        conflicts.forEach(function(c) {
          msg += '行 ' + c.row + ' 重复 ID ' + c.id + '\n';
        });
        msg += '\n请选择：确认将自动为冲突行分配下一个可用后缀，或取消手动处理。';
        if (confirm(msg)) {
          tbody.querySelectorAll('tr').forEach(function(r) {
            var cells = Array.from(r.children);
            var idCell = cells[keys.indexOf('itemId')];
            if (!idCell) return;
            var pEl = idCell.querySelector('input[data-role="itemPrefix"]');
            var sEl = idCell.querySelector('input[data-role="itemSuffix"]');
            if (!pEl || !sEl) return;
            var prefix = pEl.value || '';
            var fullNum = sEl.getFullId ? sEl.getFullId() : null;
            if (fullNum && idSet.has(fullNum)) {
              var nextSuffix = getNextSuffix(prefix, true);
              if (nextSuffix !== null) {
                sEl.value = String(nextSuffix);
                idSet.add(Number(String(prefix) + pad3(nextSuffix)));
              }
            }
          });
        } else {
          alert('导出已取消，请先修复冲突后再导出');
          return;
        }
      }

      var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = (type === 'actions' ? 'actions_export.json' : 'items_export.json');
      a.click();
      URL.revokeObjectURL(url);
    });

    var copyBtn = document.createElement('button');
    copyBtn.textContent = '复制到剪贴板';
    copyBtn.style.marginLeft = '6px';
    copyBtn.addEventListener('click', async function() {
      var out = [];
      var conflicts = [];
      var idSet = new Set();

      tbody.querySelectorAll('tr').forEach(function(r, rowIndex) {
        var obj = {};
        var cells = Array.from(r.children);
        for (var i = 0; i < keys.length; i++) {
          var cell = cells[i];
          var k = keys[i];
          if (k === 'itemId') {
            var pEl = cell.querySelector('input[data-role="itemPrefix"]');
            var sEl = cell.querySelector('input[data-role="itemSuffix"]');
            var prefix = pEl ? (pEl.value || '') : '';
            var suffixRaw = sEl ? (sEl.value || '') : '';
            var suffix = suffixRaw === '' ? null : pad3(Number(suffixRaw));
            if (prefix && suffix) {
              obj[k] = Number(String(prefix) + suffix);
            } else if (suffix && !prefix) {
              obj[k] = Number(suffix);
            } else {
              obj[k] = null;
            }
            continue;
          }
          var el = cell.querySelector('input,textarea,select');
          if (!el) {
            obj[k] = '';
            continue;
          }
          var dtype = el.dataset.type;
          if (dtype === 'boolean') obj[k] = !!el.checked;
          else if (dtype === 'number') {
            var v = el.value.trim();
            obj[k] = v === '' ? null : Number(v);
          } else if (dtype === 'json') {
            try {
              obj[k] = JSON.parse(el.value || '[]');
            } catch (e) {
              obj[k] = el.value;
            }
          } else obj[k] = el.value;
        }
        if (obj.itemId !== null && obj.itemId !== undefined) {
          if (idSet.has(obj.itemId)) conflicts.push({ row: rowIndex + 1, id: obj.itemId });
          idSet.add(obj.itemId);
        }
        out.push(obj);
      });

      if (conflicts.length > 0) {
        var msg = '检测到重复 ID：\n';
        conflicts.forEach(function(c) {
          msg += '行 ' + c.row + ' 重复 ID ' + c.id + '\n';
        });
        msg += '\n请选择：确认将自动为冲突行分配下一个可用后缀，或取消手动处理。';
        if (confirm(msg)) {
          tbody.querySelectorAll('tr').forEach(function(r) {
            var cells = Array.from(r.children);
            var idCell = cells[keys.indexOf('itemId')];
            if (!idCell) return;
            var pEl = idCell.querySelector('input[data-role="itemPrefix"]');
            var sEl = idCell.querySelector('input[data-role="itemSuffix"]');
            if (!pEl || !sEl) return;
            var prefix = pEl.value || '';
            var fullNum = sEl.getFullId ? sEl.getFullId() : null;
            if (fullNum && idSet.has(fullNum)) {
              var nextSuffix = getNextSuffix(prefix, true);
              if (nextSuffix !== null) {
                sEl.value = String(nextSuffix);
                idSet.add(Number(String(prefix) + pad3(nextSuffix)));
              }
            }
          });
        } else {
          alert('复制已取消，请先修复冲突后再复制');
          return;
        }
      }

      try {
        await navigator.clipboard.writeText(JSON.stringify(out, null, 2));
        alert('JSON 已复制到剪贴板');
      } catch (e) {
        alert('复制失败：' + e.message);
      }
    });

    var container = document.createElement('div');
    container.appendChild(addRowBtn);
    container.appendChild(table);
    container.appendChild(exportBtn);
    container.appendChild(copyBtn);
    return container;
  }

  /**
   * 挂载道具生成器工具
   */
  function mountGeneratorTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('generator-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.generator-component');
    var importBtn = root.querySelector('.importJsonBtn');
    var fileInput = root.querySelector('.jsonFileInput');
    var pasteBtn = root.querySelector('.pasteJsonBtn');
    var newBtn = root.querySelector('.newEmptyTableBtn');
    var genType = root.querySelector('.generatorTypeSelect');
    var exportBtn = root.querySelector('.exportJsonBtn');
    var area = root.querySelector('.generatorArea');

    var panel = root.querySelector('.importExportPanel');
    var panelToggle = root.querySelector('.panelToggleBtn');
    var panelTextarea = panel ? panel.querySelector('.iex-textarea') : null;
    var panelParseBtn = panel ? panel.querySelector('.iex-parse-btn') : null;
    var panelExportBtn = panel ? panel.querySelector('.iex-export-btn') : null;
    var panelDownloadBtn = panel ? panel.querySelector('.iex-download-btn') : null;
    var panelCopyBtn = panel ? panel.querySelector('.iex-copy-btn') : null;
    var panelClearBtn = panel ? panel.querySelector('.iex-clear-btn') : null;
    var panelStatus = panel ? panel.querySelector('.iex-status') : null;

    function setPanelStatus(msg) {
      if (panelStatus) panelStatus.textContent = msg || '';
    }

    function parseTextarea() {
      if (!panelTextarea) return;
      var txt = panelTextarea.value;
      if (!txt || !txt.trim()) {
        setPanelStatus('面板为空，请粘贴 JSON 数组后再解析。');
        return;
      }
      try {
        var j = window.parseJsonOrNdjson(txt);
        if (!Array.isArray(j)) {
          setPanelStatus('解析结果不是数组');
          return;
        }
        var type = detectDataType(j);
        genType.value = type;
        area.innerHTML = '';
        area.appendChild(buildEditableTable(j, type, genType, area));
        setPanelStatus('解析成功：已渲染表格。');
      } catch (err) {
        setPanelStatus('JSON 解析失败：' + err.message);
      }
    }

    function writeCurrentTableToTextarea() {
      if (!panelTextarea) return;
      var tbody = area.querySelector('tbody');
      if (!tbody) {
        setPanelStatus('当前无表格内容可导出。');
        return;
      }
      var ths = area.querySelectorAll('table thead th');
      var headers = Array.from(ths).map(function(th) {
        return th.textContent;
      }).filter(function(h) {
        return h !== '操作';
      });
      var out = [];
      var trs = area.querySelectorAll('table tbody tr');

      Array.from(trs).forEach(function(tr) {
        if (!tr.querySelector('input,textarea,select')) return;
        var obj = {};
        var cells = Array.from(tr.children);
        for (var i = 0; i < headers.length; i++) {
          var k = headers[i];
          var cell = cells[i];
          if (!cell) {
            obj[k] = '';
            continue;
          }
          if (k === 'itemId') {
            var pEl = cell.querySelector('input[data-role="itemPrefix"]');
            var sEl = cell.querySelector('input[data-role="itemSuffix"]');
            var prefix = pEl ? (pEl.value || '') : '';
            var suffixRaw = sEl ? (sEl.value || '') : '';
            var suffix = suffixRaw === '' ? null : String(suffixRaw).padStart(3, '0');
            if (prefix && suffix) {
              obj[k] = Number(String(prefix) + suffix);
            } else if (suffix && !prefix) {
              obj[k] = Number(suffix);
            } else {
              obj[k] = null;
            }
            continue;
          }
          var el = cell.querySelector('input,textarea,select');
          if (!el) {
            obj[k] = '';
            continue;
          }
          var dtype = el.dataset.type;
          if (dtype === 'boolean') obj[k] = !!el.checked;
          else if (dtype === 'number') {
            var v = el.value.trim();
            obj[k] = v === '' ? null : Number(v);
          } else if (dtype === 'json') {
            try {
              obj[k] = JSON.parse(el.value || '[]');
            } catch (e) {
              obj[k] = el.value;
            }
          } else obj[k] = el.value;
        }
        out.push(obj);
      });

      panelTextarea.value = JSON.stringify(out, null, 2);
      setPanelStatus('已将当前表格序列化到面板。');
    }

    function downloadTextarea() {
      if (!panelTextarea) return;
      var txt = panelTextarea.value || '';
      if (!txt) {
        setPanelStatus('面板为空，无法下载。');
        return;
      }
      try {
        JSON.parse(txt);
      } catch (e) {
        setPanelStatus('不可下载：面板 JSON 非法。');
        return;
      }
      var blob = new Blob([txt], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'export.json';
      a.click();
      URL.revokeObjectURL(url);
      setPanelStatus('已触发下载。');
    }

    async function copyTextarea() {
      if (!panelTextarea) return;
      try {
        await navigator.clipboard.writeText(panelTextarea.value || '');
        setPanelStatus('面板内容已复制到剪贴板。');
      } catch (e) {
        setPanelStatus('复制失败：' + (e.message || e));
      }
    }

    function clearTextarea() {
      if (!panelTextarea) return;
      panelTextarea.value = '';
      setPanelStatus('面板已清空。');
    }

    if (panelToggle && panel) {
      panelToggle.addEventListener('click', function() {
        panel.classList.toggle('hidden');
      });
    }

    if (panelParseBtn) panelParseBtn.addEventListener('click', parseTextarea);
    if (panelExportBtn) panelExportBtn.addEventListener('click', writeCurrentTableToTextarea);
    if (panelDownloadBtn) panelDownloadBtn.addEventListener('click', downloadTextarea);
    if (panelCopyBtn) panelCopyBtn.addEventListener('click', copyTextarea);
    if (panelClearBtn) panelClearBtn.addEventListener('click', clearTextarea);

    importBtn.addEventListener('click', function() {
      fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var j = window.parseJsonOrNdjson(String(reader.result || ''));
          var type = detectDataType(j);
          genType.value = type;
          area.innerHTML = '';
          area.appendChild(buildEditableTable(j, type, genType, area));
          if (panel) setPanelStatus('解析成功：已渲染表格（来自文件）。');
        } catch (err) {
          alert('解析失败：' + err.message);
        }
      };
      reader.readAsText(f);
    });

    pasteBtn.addEventListener('click', async function() {
      try {
        var text = '';
        if (navigator.clipboard && navigator.clipboard.readText) {
          try {
            text = await navigator.clipboard.readText();
          } catch (e) {
            text = '';
          }
        }
        if (!text) {
          text = prompt('检测到无法直接读取剪贴板，请粘贴 JSON 到此处：') || '';
        }
        if (!text) return;
        if (panel && panelTextarea) {
          panelTextarea.value = text;
          panel.classList.remove('hidden');
          parseTextarea();
        } else {
          try {
            var j = window.parseJsonOrNdjson(text);
            var type = detectDataType(j);
            genType.value = type;
            area.innerHTML = '';
            area.appendChild(buildEditableTable(j, type, genType, area));
            if (panel) setPanelStatus('解析成功：已渲染表格（来自粘贴）。');
          } catch (e) {
            alert('JSON 解析失败：' + e.message);
          }
        }
      } catch (err) {
        var txt = prompt('请粘贴 JSON 数组：');
        if (!txt) return;
        try {
          var j2 = window.parseJsonOrNdjson(txt);
          var type2 = detectDataType(j2);
          genType.value = type2;
          area.innerHTML = '';
          area.appendChild(buildEditableTable(j2, type2, genType, area));
          if (panel) setPanelStatus('解析成功：已渲染表格（来自粘贴）。');
        } catch (e) {
          alert('JSON 解析失败：' + e.message);
        }
      }
    });

    newBtn.addEventListener('click', function() {
      var type = genType.value || 'items';
      area.innerHTML = '';
      area.appendChild(buildEditableTable([], type, genType, area));
    });

    genType.addEventListener('change', function() {
      var desiredPrefix = TYPE_PREFIX[genType.value] || '';
      var table = area.querySelector('table');
      if (table) {
        try {
          var prefixInputs = table.querySelectorAll('input[data-role="itemPrefix"]');
          prefixInputs.forEach(function(pEl) {
            if (!pEl) return;
            if (!pEl.value || pEl.value === '') {
              pEl.value = desiredPrefix;
              var sEl = pEl.parentElement.querySelector('input[data-role="itemSuffix"]');
              if (sEl && (sEl.value === '' || sEl.value === '0') && desiredPrefix) {
                var nextSuffix = getNextSuffixLocal(desiredPrefix, true, area);
                if (nextSuffix !== null) sEl.value = String(nextSuffix);
              }
            }
          });
        } catch (e) {
          // 忽略错误
        }
      } else {
        area.innerHTML = '';
        area.appendChild(buildEditableTable([], genType.value, genType, area));
      }
    });

    exportBtn.addEventListener('click', function() {
      var btn = area.querySelector('button');
      if (btn) btn.click();
      else alert('当前无可导出的表格，请先导入或新建表格');
    });

    // 本地获取下一个可用后缀
    function getNextSuffixLocal(prefix, scanGlobal, areaEl) {
      var used = new Set();
      var tbody = areaEl.querySelector('tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach(function(r) {
          var el = r.querySelector('td input[data-role="itemSuffix"]');
          var pEl = r.querySelector('td input[data-role="itemPrefix"]');
          if (el && pEl) {
            var p = pEl.value || '';
            var s = el.value || '';
            if (p === String(prefix) && s !== '') {
              used.add(Number(s));
            }
          }
        });
      }

      if (scanGlobal && window.fetchCache && window.fetchCache.items && Array.isArray(window.fetchCache.items)) {
        window.fetchCache.items.forEach(function(it) {
          var id = it.itemId || it.id;
          if (typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id))) {
            var parsed = parseItemId(id);
            if (parsed.prefix === String(prefix) && parsed.suffix !== '') {
              used.add(Number(parsed.suffix));
            }
          }
        });
      }

      for (var i = 1; i <= 999; i++) {
        if (!used.has(i)) return i;
      }
      return null;
    }

    // 初始空表格
    area.innerHTML = '';
    area.appendChild(buildEditableTable([], genType.value, genType, area));
  }

  // 暴露到全局
  window.mountGeneratorTool = mountGeneratorTool;

})();
