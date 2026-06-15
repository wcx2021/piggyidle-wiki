/**
 * Wiki Items 查询工具模块
 * 提供道具/行动数据查询功能
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
    { key: 'useActionId', label: '使用动作', aliases: ['useActionId', 'use_action_id'] },
    { key: 'sellActionId', label: '卖出动作', aliases: ['sellActionId', 'sell_action_id'] },
    { key: 'decomposeActionId', label: '分解动作', aliases: ['decomposeActionId', 'decompose_action_id'] }
  ];

  var actionColumns = [
    { key: 'actionId', label: '行动标识', aliases: ['actionId', 'id'] },
    { key: 'actionName', label: '行动名称', aliases: ['actionName', 'name'] },
    { key: 'actionType', label: '行动类型', aliases: ['actionType', 'type'], isBadge: true },
    { key: 'subActionType', label: '子类型', aliases: ['subActionType'] },
    { key: 'triggerType', label: '触发方式', aliases: ['triggerType'] },
    { key: 'exposeApi', label: '暴露API', aliases: ['exposeApi'], isBool: true },
    { key: 'isNeedActor', label: '需要角色', aliases: ['isNeedActor'], isBool: true },
    { key: 'isNeedMap', label: '需要地图', aliases: ['isNeedMap'], isBool: true },
    { key: 'consumeTableId', label: '消耗表ID', aliases: ['consumeTableId'] },
    { key: 'rewardTableId', label: '奖励表ID', aliases: ['rewardTableId'] }
  ];

  var jobColumns = [
    { key: 'id', label: '标识', aliases: ['id'] },
    { key: 'name', label: '名称', aliases: ['name'] },
    { key: 'category', label: '分类', aliases: ['category'], isBadge: true }
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

  var jobCategoryOptions = [
    { value: 'all', label: '全部' },
    { value: 'race', label: '种族' },
    { value: 'combat', label: '战斗系' },
    { value: 'production', label: '生产系' }
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
    building: '建筑',
    PIG_CRAFT: '小猪技艺',
    ITEM_USE: '物品使用',
    SHOP_BUY: '商店购买',
    MARKET_TRADE: '市场交易',
    TASK_FINISH: '任务完成',
    PIG_RECLASS: '小猪转职',
    BUILD_DEPLOY: '建筑部署',
    race: '种族',
    combat: '战斗系',
    production: '生产系'
  };

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
    INTERNAL: '自动触发',
    EXTERNAL: '手动触发',
    AUTO: '自动触发',
    MANUAL: '手动触发'
  };

  var jobExpSourceLabels = {
    none: '不可升级',
    profession_exp: '跟随技艺经验',
    combat_exp: '战斗获取',
    craft_exp: '制造获取',
    explore_exp: '探索获取',
    all_action: '全行动获取'
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
    consumeHunger: '消耗体重（已迁移至消耗表）',
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
    building: '#64748b',
    PIG_CRAFT: '#8b5cf6',
    ITEM_USE: '#3b82f6',
    SHOP_BUY: '#f59e0b',
    MARKET_TRADE: '#10b981',
    TASK_FINISH: '#6366f1',
    PIG_RECLASS: '#ec4899',
    BUILD_DEPLOY: '#64748b',
    race: '#a855f7',
    combat: '#ef4444',
    production: '#22c55e'
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

  function renderJobEffects(job) {
    var html = '<div class="detail-section"><h5>加成效果</h5>';
    var baseEff = job.baseEffect || {};
    var lvlEff = job.levelEffect || {};

    // Abilities
    var baseAb = baseEff.abilities || {};
    var lvlAb = lvlEff.abilities || {};
    var allAbilityKeys = Object.keys(Object.assign({}, baseAb, lvlAb));
    if (allAbilityKeys.length > 0) {
      html += '<p class="detail-sub-title">属性加成</p>';
      html += '<table class="detail-table"><thead><tr><th>属性</th><th>初始</th><th>每级</th></tr></thead><tbody>';
      allAbilityKeys.forEach(function(k) {
        html += '<tr><td>' + window.escapeHTML(k) + '</td><td>' + (baseAb[k] || 0) + '</td><td>' + (lvlAb[k] || 0) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    // Professions
    var baseProf = baseEff.professions || {};
    var lvlProf = lvlEff.professions || {};
    var allProfKeys = Object.keys(Object.assign({}, baseProf, lvlProf));
    if (allProfKeys.length > 0) {
      html += '<p class="detail-sub-title">技艺加成</p>';
      html += '<table class="detail-table"><thead><tr><th>技艺</th><th>初始</th><th>每级</th></tr></thead><tbody>';
      allProfKeys.forEach(function(k) {
        var bProf = baseProf[k] || {};
        var lProf = lvlProf[k] || {};
        var bStr = (bProf.speed ? '速度+' + bProf.speed : '') + (bProf.efficiency ? ' 效率+' + bProf.efficiency : '') + (bProf.successRate ? ' 成功率+' + bProf.successRate : '') || '—';
        var lStr = (lProf.speed ? '速度+' + lProf.speed : '') + (lProf.efficiency ? ' 效率+' + lProf.efficiency : '') + (lProf.successRate ? ' 成功率+' + lProf.successRate : '') || '—';
        html += '<tr><td>' + window.escapeHTML(subActionTypeLabels[k] || k) + '</td><td>' + window.escapeHTML(bStr) + '</td><td>' + window.escapeHTML(lStr) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    if (allAbilityKeys.length === 0 && allProfKeys.length === 0) {
      html += '<p class="detail-empty">无加成</p>';
    }
    html += '</div>';
    return html;
  }

  function renderJobReclassInfo(job) {
    var html = '<div class="detail-section"><h5>转职信息</h5>';

    // Prerequisites
    var prereqs = job.prerequisites || [];
    if (prereqs.length > 0) {
      html += '<p><strong>前置职业：</strong>' + prereqs.map(function(p) { return window.escapeHTML(p); }).join('、') + '</p>';
    }

    // Reclass conditions
    var conditions = job.reclassConditions || {};
    var condParts = [];
    if (conditions.requiredJobs && conditions.requiredJobs.length > 0) {
      condParts.push(conditions.requiredJobs.map(function(rj) {
        return rj.jobId + ' ≥ Lv.' + rj.minLevel;
      }).join('；'));
    }
    if (conditions.requiredProfessions && conditions.requiredProfessions.length > 0) {
      condParts.push(conditions.requiredProfessions.map(function(rp) {
        return (subActionTypeLabels[rp.professionId] || rp.professionId) + ' ≥ ' + rp.minLevel;
      }).join('；'));
    }
    html += '<p><strong>转职条件：</strong>' + (condParts.length > 0 ? condParts.join('；') : '无') + '</p>';

    // Reclass cost
    var cost = job.reclassCost || {};
    var costParts = [];
    if (cost.gold) costParts.push('金币 ×' + cost.gold);
    if (cost.reclassPoints) costParts.push('转职次数 ×' + cost.reclassPoints);
    if (cost.items && cost.items.length > 0) {
      cost.items.forEach(function(ci) { costParts.push('物品#' + ci.itemId + ' ×' + ci.amount); });
    }
    html += '<p><strong>转职消耗：</strong>' + (costParts.length > 0 ? costParts.join('、') : '无') + '</p>';

    // Exp info
    html += '<p><strong>经验来源：</strong>' + (jobExpSourceLabels[job.expSource] || job.expSource) + '</p>';
    html += '<p><strong>经验倍率：</strong>' + (job.expMultiplier !== undefined ? job.expMultiplier : '—') + '</p>';
    var expProfs = job.expProfessions || [];
    html += '<p><strong>触发技艺：</strong>' + (expProfs.length > 0 ? expProfs.join('、') : '全部技艺') + '</p>';

    html += '</div>';
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

  function updateTypeFilter(typeFilter, currentDataset) {
    var options = currentDataset === 'items' ? itemTypeOptions : (currentDataset === 'jobs' ? jobCategoryOptions : actionTypeOptions);
    typeFilter.innerHTML = '';
    options.forEach(function(opt) {
      var option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      typeFilter.appendChild(option);
    });
  }

  function mountItemsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('items-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.items-component');
    var datasetFilter = root.querySelector('.datasetFilter');
    var typeFilter = root.querySelector('.typeFilter');
    var searchInput = root.querySelector('.searchInput');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var statsCount = root.querySelector('.stats-count');
    var tableHead = root.querySelector('.tableHead');
    var itemsBody = root.querySelector('.itemsBody');
    var emptyNotice = root.querySelector('.empty');

    var currentDataset = datasetFilter.value;
    var data = [];
    var expanded = {};
    var sortAsc = true;
    var consumeTables = [];
    var rewardTables = [];
    var itemsData = [];

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
          var t = it.itemType || it.type || it.actionType || '';
          return t === typeVal;
        });
      }

      if (keyword) {
        list = list.filter(function(it) {
          var id = String(it.itemId !== undefined ? it.itemId : (it.id !== undefined ? it.id : it.actionId)).toLowerCase();
          var name = String(it.itemName || it.actionName || it.name || '').toLowerCase();
          var desc = String(it.itemDescription || it.description || '').toLowerCase();
          return id.indexOf(keyword) >= 0 || name.indexOf(keyword) >= 0 || desc.indexOf(keyword) >= 0;
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

      updateStats(data.length, list.length);

      if (list.length === 0) {
        emptyNotice.classList.remove('hidden');
        buildTableHeader(tableHead, []);
        return;
      } else {
        emptyNotice.classList.add('hidden');
      }

      var columns = currentDataset === 'items' ? itemColumns : (currentDataset === 'jobs' ? jobColumns : actionColumns);
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
          } else if (col.key === 'actionId') {
            var shortId = String(value)
              .replace(/^PIG_CRAFT_/, '')
              .replace(/^ITEM_USE_CRAFTBOOK_/, '书·')
              .replace(/^ITEM_USE_/, '使用·');
            td.innerHTML = '<span title="' + window.escapeHTML(String(value)) + '">' + window.escapeHTML(shortId) + '</span>';
          } else if (col.key === 'subActionType') {
            var subLabel = subActionTypeLabels[value] || value;
            td.innerHTML = '<span title="' + window.escapeHTML(String(value)) + '">' + window.escapeHTML(subLabel) + '</span>';
          } else if (col.key === 'triggerType') {
            var trigLabel = triggerTypeLabels[value] || value;
            td.innerHTML = '<span title="' + window.escapeHTML(String(value)) + '">' + window.escapeHTML(trigLabel) + '</span>';
          } else if (col.key === 'expSource') {
            var expLabel = jobExpSourceLabels[value] || value;
            td.innerHTML = '<span title="' + window.escapeHTML(String(value)) + '">' + window.escapeHTML(expLabel) + '</span>';
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
        var detailContent = '';

        if (currentDataset === 'actions') {
          detailContent = '<div class="details">' +
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
        } else if (currentDataset === 'jobs') {
          detailContent = '<div class="details">' +
            '<div class="detail-section"><h5>描述</h5><p class="detail-desc">' + window.escapeHTML(item.desc || '') + '</p></div>' +
            '<div class="detail-grid">' +
            renderJobEffects(item) +
            renderJobReclassInfo(item) +
            '</div>' +
            '</div>';
        } else {
          var description = item.itemDescription || item.description || '';
          detailContent = '<div class="details">' +
            '<div class="detail-section"><h5>简介</h5><p class="detail-desc">' + window.escapeHTML(description) + '</p></div>' +
            renderRequiredLevelsTable(item) +
            renderAttributesTable(item.attributes || []) +
            '</div>';
        }

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
      var fetches = [
        window.fetchDataset(currentDataset)
      ];
      if (currentDataset === 'actions') {
        fetches.push(window.fetchDataset('consumeTables'));
        fetches.push(window.fetchDataset('rewardTables'));
        fetches.push(window.fetchDataset('items'));
      }

      Promise.all(fetches).then(function(results) {
        data = Array.isArray(results[0]) ? results[0] : [];
        if (currentDataset === 'actions') {
          consumeTables = Array.isArray(results[1]) ? results[1] : [];
          rewardTables = Array.isArray(results[2]) ? results[2] : [];
          itemsData = Array.isArray(results[3]) ? results[3] : [];
        } else {
          itemsData = data;
        }
        expanded = {};
        render();
      });
    }

    function init() {
      datasetFilter.addEventListener('change', function() {
        currentDataset = datasetFilter.value;
        updateTypeFilter(typeFilter, currentDataset);
        searchInput.value = '';
        loadDataAndRender();
      });

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
