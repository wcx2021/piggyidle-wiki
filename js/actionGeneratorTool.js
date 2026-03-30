/**
 * Wiki 行动生成器模块
 * 提供行动配置编辑和导出功能
 */

(function() {
  'use strict';

  // 枚举选项
  var ACTION_TYPE_OPTIONS = ['PIG_CRAFT', 'ITEM_USE', 'SHOP_BUY', 'MARKET_TRADE', 'TASK_FINISH', 'PIG_RECLASS', 'BUILD_DEPLOY'];
  var TRIGGER_TYPE_OPTIONS = ['EXTERNAL', 'INTERNAL'];
  var CONSUME_TYPE_OPTIONS = ['item', 'resource', 'map_resource'];
  var REWARD_SUBTYPE_OPTIONS = [
    { value: 1, label: '1-物品' },
    { value: 2, label: '2-经验' },
    { value: 5, label: '5-地图创建' },
    { value: 6, label: '6-地图资源奖励' }
  ];

  /**
   * 创建输入字段
   */
  function createField(label, type, value, options, onChange) {
    var div = document.createElement('div');
    div.style.marginBottom = '8px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '8px';

    var labelEl = document.createElement('label');
    labelEl.textContent = label;
    labelEl.style.minWidth = '120px';
    labelEl.style.fontWeight = '500';

    var input;

    if (type === 'select') {
      input = document.createElement('select');
      input.style.flex = '1';
      input.style.padding = '6px';
      input.style.borderRadius = '4px';
      input.style.border = '1px solid var(--muted)';
      input.style.background = 'var(--card)';
      input.style.color = 'var(--text)';

      options.forEach(function(opt) {
        var optEl = document.createElement('option');
        if (typeof opt === 'object') {
          optEl.value = opt.value;
          optEl.textContent = opt.label;
        } else {
          optEl.value = opt;
          optEl.textContent = opt;
        }
        if (String(value) === String(optEl.value)) optEl.selected = true;
        input.appendChild(optEl);
      });
    } else if (type === 'boolean') {
      input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = Boolean(value);
      input.style.width = 'auto';
    } else if (type === 'json') {
      input = document.createElement('textarea');
      input.rows = 4;
      input.style.flex = '1';
      input.style.padding = '6px';
      input.style.borderRadius = '4px';
      input.style.border = '1px solid var(--muted)';
      input.style.background = 'var(--card)';
      input.style.color = 'var(--text)';
      input.value = typeof value === 'object' ? JSON.stringify(value, null, 2) : (value || '{}');
    } else if (type === 'array') {
      input = document.createElement('textarea');
      input.rows = 4;
      input.style.flex = '1';
      input.style.padding = '6px';
      input.style.borderRadius = '4px';
      input.style.border = '1px solid var(--muted)';
      input.style.background = 'var(--card)';
      input.style.color = 'var(--text)';
      input.value = Array.isArray(value) ? JSON.stringify(value, null, 2) : (value || '[]');
    } else {
      input = document.createElement('input');
      input.type = type || 'text';
      input.value = value || '';
      input.style.flex = '1';
      input.style.padding = '6px';
      input.style.borderRadius = '4px';
      input.style.border = '1px solid var(--muted)';
      input.style.background = 'var(--card)';
      input.style.color = 'var(--text)';
    }

    input.addEventListener('change', function(e) {
      var newValue;
      if (type === 'boolean') {
        newValue = e.target.checked;
      } else if (type === 'number') {
        newValue = e.target.value ? Number(e.target.value) : null;
      } else if (type === 'json' || type === 'array') {
        try {
          newValue = JSON.parse(e.target.value || (type === 'array' ? '[]' : '{}'));
        } catch (err) {
          newValue = e.target.value;
        }
      } else {
        newValue = e.target.value;
      }
      if (onChange) onChange(newValue);
    });

    div.appendChild(labelEl);
    div.appendChild(input);
    return div;
  }

  /**
   * 下载 JSON 文件
   */
  function downloadJSON(data, filename) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /**
   * 挂载行动生成器工具
   */
  function mountActionGeneratorTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('action-generator-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.action-generator-component');
    var newBtn = root.querySelector('.newActionBtn');
    var importBtn = root.querySelector('.importActionBtn');
    var fileInput = root.querySelector('.actionFileInput');
    var exportAllBtn = root.querySelector('.exportAllBtn');
    var exportStatus = root.querySelector('.export-status');

    var actionForm = root.querySelector('.action-form');
    var consumeForm = root.querySelector('.consume-form');
    var rewardForm = root.querySelector('.reward-form');

    // 当前行动数据
    var currentAction = {
      action: {
        actionId: '',
        actionType: 'ITEM_USE',
        subActionType: '',
        actionName: '',
        triggerType: 'EXTERNAL',
        exposeApi: true,
        isNeedActor: true,
        isNeedMap: false,
        consumeTableId: '',
        rewardTableId: '',
        extraParams: {}
      },
      consumeTable: {
        consume_id: '',
        consume_items: [],
        trigger_condition: ''
      },
      rewardTable: {
        reward_id: '',
        trigger_type: 4,
        trigger_related_id: '',
        mutex_rewards: [],
        independent_rewards: [],
        trigger_condition: ''
      }
    };

    /**
     * 设置状态提示
     */
    function setStatus(msg) {
      if (exportStatus) exportStatus.textContent = msg || '';
    }

    /**
     * 渲染行动表单
     */
    function renderActionForm() {
      actionForm.innerHTML = '';
      var action = currentAction.action;

      actionForm.appendChild(createField('行动标识:', 'text', action.actionId, null, function(v) {
        action.actionId = v;
      }));
      actionForm.appendChild(createField('行动名称:', 'text', action.actionName, null, function(v) {
        action.actionName = v;
      }));
      actionForm.appendChild(createField('行动类型:', 'select', action.actionType, ACTION_TYPE_OPTIONS, function(v) {
        action.actionType = v;
      }));
      actionForm.appendChild(createField('子类型:', 'text', action.subActionType, null, function(v) {
        action.subActionType = v;
      }));
      actionForm.appendChild(createField('触发方式:', 'select', action.triggerType, TRIGGER_TYPE_OPTIONS, function(v) {
        action.triggerType = v;
      }));
      actionForm.appendChild(createField('暴露API:', 'boolean', action.exposeApi, null, function(v) {
        action.exposeApi = v;
      }));
      actionForm.appendChild(createField('需要角色:', 'boolean', action.isNeedActor, null, function(v) {
        action.isNeedActor = v;
      }));
      actionForm.appendChild(createField('需要地图:', 'boolean', action.isNeedMap, null, function(v) {
        action.isNeedMap = v;
      }));
      actionForm.appendChild(createField('消耗表ID:', 'text', action.consumeTableId, null, function(v) {
        action.consumeTableId = v;
        currentAction.consumeTable.consume_id = v;
        currentAction.rewardTable.reward_id = v;
        currentAction.rewardTable.trigger_related_id = v;
      }));
      actionForm.appendChild(createField('奖励表ID:', 'text', action.rewardTableId, null, function(v) {
        action.rewardTableId = v;
      }));
      actionForm.appendChild(createField('额外参数:', 'json', action.extraParams, null, function(v) {
        action.extraParams = v;
      }));
    }

    /**
     * 渲染消耗表单
     */
    function renderConsumeForm() {
      consumeForm.innerHTML = '';
      var consume = currentAction.consumeTable;

      consumeForm.appendChild(createField('消耗表ID:', 'text', consume.consume_id, null, function(v) {
        consume.consume_id = v;
      }));
      consumeForm.appendChild(createField('消耗项列表:', 'array', consume.consume_items, null, function(v) {
        consume.consume_items = v;
      }));
      consumeForm.appendChild(createField('触发条件:', 'text', consume.trigger_condition, null, function(v) {
        consume.trigger_condition = v;
      }));

      var helpDiv = document.createElement('div');
      helpDiv.style.marginTop = '8px';
      helpDiv.style.padding = '8px';
      helpDiv.style.background = 'var(--bg)';
      helpDiv.style.borderRadius = '4px';
      helpDiv.style.fontSize = '12px';
      helpDiv.innerHTML = '<strong>消耗项格式示例：</strong><pre style="margin:4px 0;white-space:pre-wrap;">[\n  {\n    "consume_type": "item",\n    "target_id": 7001,\n    "amount": 1.0,\n    "chance": 1.0\n  }\n]</pre>';
      consumeForm.appendChild(helpDiv);
    }

    /**
     * 渲染奖励表单
     */
    function renderRewardForm() {
      rewardForm.innerHTML = '';
      var reward = currentAction.rewardTable;

      rewardForm.appendChild(createField('奖励表ID:', 'text', reward.reward_id, null, function(v) {
        reward.reward_id = v;
      }));
      rewardForm.appendChild(createField('触发类型:', 'number', reward.trigger_type, null, function(v) {
        reward.trigger_type = v;
      }));
      rewardForm.appendChild(createField('关联触发ID:', 'text', reward.trigger_related_id, null, function(v) {
        reward.trigger_related_id = v;
      }));
      rewardForm.appendChild(createField('互斥奖励池:', 'array', reward.mutex_rewards, null, function(v) {
        reward.mutex_rewards = v;
      }));
      rewardForm.appendChild(createField('独立奖励池:', 'array', reward.independent_rewards, null, function(v) {
        reward.independent_rewards = v;
      }));
      rewardForm.appendChild(createField('触发条件:', 'text', reward.trigger_condition, null, function(v) {
        reward.trigger_condition = v;
      }));

      var helpDiv = document.createElement('div');
      helpDiv.style.marginTop = '8px';
      helpDiv.style.padding = '8px';
      helpDiv.style.background = 'var(--bg)';
      helpDiv.style.borderRadius = '4px';
      helpDiv.style.fontSize = '12px';
      helpDiv.innerHTML = '<strong>奖励项格式示例：</strong><pre style="margin:4px 0;white-space:pre-wrap;">[\n  {\n    "reward_subtype": 1,\n    "target_id": 1000,\n    "amount_min": 100.0,\n    "amount_max": 500.0,\n    "chance": 1.0\n  }\n]</pre>';
      rewardForm.appendChild(helpDiv);
    }

    // 初始化渲染
    renderActionForm();
    renderConsumeForm();
    renderRewardForm();

    // 新建行动
    newBtn.addEventListener('click', function() {
      currentAction = {
        action: {
          actionId: '',
          actionType: 'ITEM_USE',
          subActionType: '',
          actionName: '',
          triggerType: 'EXTERNAL',
          exposeApi: true,
          isNeedActor: true,
          isNeedMap: false,
          consumeTableId: '',
          rewardTableId: '',
          extraParams: {}
        },
        consumeTable: {
          consume_id: '',
          consume_items: [],
          trigger_condition: ''
        },
        rewardTable: {
          reward_id: '',
          trigger_type: 4,
          trigger_related_id: '',
          mutex_rewards: [],
          independent_rewards: [],
          trigger_condition: ''
        }
      };
      renderActionForm();
      renderConsumeForm();
      renderRewardForm();
      setStatus('已重置为空白行动配置');
    });

    // 导入行动配置
    importBtn.addEventListener('click', function() {
      fileInput.click();
    });

    fileInput.addEventListener('change', function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function() {
        try {
          var data = JSON.parse(reader.result);
          if (data.action) currentAction.action = data.action;
          if (data.consumeTable) currentAction.consumeTable = data.consumeTable;
          if (data.rewardTable) currentAction.rewardTable = data.rewardTable;
          renderActionForm();
          renderConsumeForm();
          renderRewardForm();
          setStatus('导入成功');
        } catch (err) {
          alert('JSON解析失败：' + err.message);
        }
      };
      reader.readAsText(file);
    });

    // 导出全部配置
    exportAllBtn.addEventListener('click', function() {
      downloadJSON(currentAction.action, 'action_' + (currentAction.action.actionId || 'export') + '.json');

      if (currentAction.consumeTable.consume_items && currentAction.consumeTable.consume_items.length > 0) {
        setTimeout(function() {
          downloadJSON(currentAction.consumeTable, 'consumeTable_' + (currentAction.consumeTable.consume_id || 'export') + '.json');
        }, 200);
      }

      if (currentAction.rewardTable.independent_rewards && currentAction.rewardTable.independent_rewards.length > 0) {
        setTimeout(function() {
          downloadJSON(currentAction.rewardTable, 'rewardTable_' + (currentAction.rewardTable.reward_id || 'export') + '.json');
        }, 400);
      }

      setStatus('已导出行动配置文件');
    });
  }

  // 暴露到全局
  window.mountActionGeneratorTool = mountActionGeneratorTool;

})();
