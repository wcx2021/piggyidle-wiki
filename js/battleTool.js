/**
 * Wiki 战斗数据查询工具模块
 * 四合一：敌人模板 / 敌人阵容 / 战场模板 / 副本配置
 * 支持搜索、筛选、排序、展开详情、跨表引用
 */

(function() {
  'use strict';

  /* ========== 常量定义 ========== */

  var ATTRIBUTE_LABELS = {
    strength: '力量', constitution: '体质', agility: '敏捷',
    dexterity: '灵巧', intelligence: '智力', perception: '感知',
    will: '意志', charisma: '魅力', startingWeight: '起始体重'
  };

  var COMBAT_LABELS = {
    attack: '攻击力', endurance: '耐力', hit: '命中', dodge: '闪避',
    armor: '护甲', magicResist: '魔法抗性', moveSpeed: '移动速度',
    chargeSpeed: '充能速度', critDamage: '暴击伤害', resistance: '抗性'
  };

  var RANK_LABELS = { front: '前排', mid: '中排', rear: '后排', 1: '前排', 2: '中排', 3: '后排' };

  var TARGET_RULE_LABELS = {
    weakest: '欺负弱小', threat: '排除威胁', follow: '跟随行动', rear: '优先后排'
  };

  var AOE_TARGET_LABELS = {
    sequential: '按序号', lowestHp: '血量最低', random: '随机'
  };

  var DUNGEON_TYPE_LABELS = { normal: '普通奖励', rare: '稀有奖励' };

  var DIFFICULTY_LABELS = { '1': 'Ⅰ', '2': 'Ⅱ', '3': 'Ⅲ' };

  var BATTLE_TYPE_LABELS = { pve: 'PVE', pvp: 'PVP（预留）' };

  // 分页配置
  var PAGE_SIZE = 50;

  /* ========== 标签定义 ========== */

  var enemyColumns = [
    { key: 'name', label: '名称' },
    { key: 'level', label: '等级', compute: function(e) {
      var attrs = e.attributes || {};
      var sum = (attrs.strength||0) + (attrs.constitution||0) + (attrs.agility||0)
        + (attrs.dexterity||0) + (attrs.intelligence||0) + (attrs.perception||0)
        + (attrs.will||0) + (attrs.charisma||0);
      return sum;
    }},
    { key: 'startingWeight', label: '起始体重' },
    { key: 'expReward', label: '经验奖励' }
  ];

  var groupColumns = [
    { key: 'name', label: '名称' },
    { key: 'enemyCount', label: '敌人数量', compute: function(g) {
      return (g.enemies || []).length;
    }}
  ];

  var templateColumns = [
    { key: 'name', label: '名称' },
    { key: 'battleType', label: '战场类型' },
    { key: 'layoutInfo', label: '布局', compute: function(t) {
      var lay = t.layout || {};
      return (lay.lanes||'?') + '路×' + (lay.ranks||'?') + '排';
    }},
    { key: 'maxUnitsPerSide', label: '最大单位数' },
    { key: 'marchThreshold', label: '行军阈值' }
  ];

  var dungeonColumns = [
    { key: 'difficulty', label: '难度' },
    { key: 'dungeonType', label: '奖励类型' },
    { key: 'queueDuration', label: '队列时长' }
  ];

  var configColumns = [
    { key: 'name', label: '配置名' },
    { key: 'preferredRanks', label: '可入排位', compute: function(c) {
      return formatPreferredRanks(c.preferredRanks);
    }},
    { key: 'stanceCondition', label: '条件入场', compute: function(c) {
      return formatStanceCondition(c.stanceCondition);
    }},
    { key: 'targetRule', label: '寻敌策略', compute: function(c) {
      return TARGET_RULE_LABELS[c.targetRule] || c.targetRule || '—';
    }},
    { key: 'aoeTargetRule', label: '群攻规则', compute: function(c) {
      return AOE_TARGET_LABELS[c.aoeTargetRule] || c.aoeTargetRule || '—';
    }},
    { key: 'skillQueue', label: '技能队列', compute: function(c) {
      var sq = c.skillQueue || [];
      return sq.length > 0 ? sq.length + ' 条' : '空';
    }}
  ];

  /* ========== 辅助函数 ========== */

  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { toast.classList.add('toast-fade'); }, 1500);
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2200);
  }

  function renderBadge(text, color) {
    var c = color || '#6b7280';
    return '<span class="type-badge" style="background:' + c + '1a;color:' + c + ';border:1px solid ' + c + '33;">' + window.escapeHTML(text) + '</span>';
  }

  function resolveItemName(itemId, itemsData) {
    if (!itemsData || !itemId) return String(itemId);
    for (var i = 0; i < itemsData.length; i++) {
      if (itemsData[i].itemId === itemId) return itemsData[i].itemName || String(itemId);
    }
    return String(itemId);
  }

  var rewardSubtypeLabels = {
    1: '物品',
    2: '经验值',
    3: '权限',
    4: '其他',
    5: '地图创建',
    6: '地图资源点'
  };

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
          targetName = '地图资源#' + ri.target_id;
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
      var indRows = [];
      // 将 expReward 作为表格第一行显示
      if (table.expReward !== undefined && table.expReward !== null) {
        indRows.push('<tr><td>经验值</td><td>—</td><td>' + window.escapeHTML(String(table.expReward)) + '</td><td>100%</td></tr>');
      }
      independent.forEach(function(ri) {
        var subtypeLabel = rewardSubtypeLabels[ri.reward_subtype] || '类型' + ri.reward_subtype;
        var targetName;
        if (ri.reward_subtype === 1) {
          targetName = resolveItemName(ri.target_id, itemsData);
        } else if (ri.reward_subtype === 6) {
          targetName = '地图资源#' + ri.target_id;
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
        indRows.push('<tr>' +
          '<td>' + window.escapeHTML(subtypeLabel) + '</td>' +
          '<td>' + window.escapeHTML(targetName) + (ri.reward_subtype === 1 ? ' <span class="ref-id">#' + window.escapeHTML(String(ri.target_id)) + '</span>' : '') + '</td>' +
          '<td>' + amountStr + '</td>' +
          '<td>' + chanceStr + '</td>' +
          '</tr>');
      });
      html += '<table class="detail-table"><thead><tr><th>类型</th><th>目标</th><th>数量</th><th>概率</th></tr></thead><tbody>' + indRows + '</tbody></table>';
    }

    if (mutex.length === 0 && independent.length === 0) {
      html += '<p class="detail-empty">奖励表为空</p>';
    }

    html += '</div>';
    return html;
  }

  function computeLevel(attrs) {
    if (!attrs) return 0;
    return (attrs.strength||0) + (attrs.constitution||0) + (attrs.agility||0)
      + (attrs.dexterity||0) + (attrs.intelligence||0) + (attrs.perception||0)
      + (attrs.will||0) + (attrs.charisma||0);
  }

  function formatCell(v) {
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }

  function formatPreferredRanks(preferredRanks) {
    if (!preferredRanks || !Array.isArray(preferredRanks) || preferredRanks.length === 0) return '—';
    return preferredRanks.map(function(r) { return RANK_LABELS[r] || r; }).join(', ');
  }

  function formatStanceCondition(cond) {
    if (!cond) return '—';
    var rankLabel = RANK_LABELS[cond.rank] || cond.rank;
    if (cond.type === 'ally_in_lane_rank') {
      return '同路该排有友军(' + rankLabel + '≥' + (cond.minCount || 1) + '人)';
    }
    if (cond.type === 'ally_in_rank') {
      return '该排有友军(' + rankLabel + '≥' + (cond.minCount || 1) + '人)';
    }
    return window.escapeHTML(cond.type || JSON.stringify(cond));
  }

  function findConfigById(configId, configsData) {
    if (!configId || !configsData) return null;
    for (var i = 0; i < configsData.length; i++) {
      if (configsData[i].configId === configId) return configsData[i];
    }
    return null;
  }

  /* ========== 详情渲染 ========== */

  function renderEnemyDetail(enemy, enemiesData, groupsData, itemsData, rewardTablesData, configsData) {
    var sections = [];

    // Basic info
    var basicRows = [
      { label: 'ID', value: enemy.enemyId },
      { label: '名称', value: enemy.name },
      { label: '描述', value: enemy.description },
      { label: '总等级', value: String(computeLevel(enemy.attributes)) },
      { label: '起始体重', value: enemy.startingWeight ? (enemy.startingWeight/100).toFixed(2) + 'kg' : '—' },
      { label: '经验奖励', value: String(enemy.expReward) }
    ];

    var basicHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>';
    basicRows.forEach(function(r) {
      basicHtml += '<tr><td>' + window.escapeHTML(r.label) + '</td><td>' + window.escapeHTML(r.value) + '</td></tr>';
    });
    basicHtml += '</tbody></table>';
    sections.push('<div class="detail-section"><h5>基本信息</h5>' + basicHtml + '</div>');

    // Attributes (八维)
    var attrs = enemy.attributes || {};
    var attrHtml = '<table class="detail-table"><thead><tr><th>属性</th><th>值</th></tr></thead><tbody>';
    Object.keys(ATTRIBUTE_LABELS).forEach(function(k) {
      var v = attrs[k];
      if (v === undefined || v === null) v = '—';
      attrHtml += '<tr><td>' + ATTRIBUTE_LABELS[k] + '</td><td>' + v + '</td></tr>';
    });
    attrHtml += '</tbody></table>';
    sections.push('<div class="detail-section"><h5>八维属性</h5>' + attrHtml + '</div>');

    // Modifiers (额外属性)
    var mods = enemy.modifiers || {};
    var hasMods = (mods.abilityBonus && Object.keys(mods.abilityBonus).length > 0)
      || (mods.combatBonus && Object.keys(mods.combatBonus).length > 0);
    if (hasMods) {
      var modHtml = '<table class="detail-table"><thead><tr><th>补正类型</th><th>字段</th><th>加成值</th></tr></thead><tbody>';
      var ab = mods.abilityBonus;
      if (ab && Object.keys(ab).length > 0) {
        Object.keys(ab).forEach(function(k) {
          var label = ATTRIBUTE_LABELS[k] || k;
          modHtml += '<tr><td>abilityBonus</td><td>' + label + '</td><td>' + (ab[k] > 0 ? '+' : '') + ab[k] + '</td></tr>';
        });
      }
      var cb = mods.combatBonus;
      if (cb && Object.keys(cb).length > 0) {
        Object.keys(cb).forEach(function(k) {
          var label = COMBAT_LABELS[k] || k;
          modHtml += '<tr><td>combatBonus</td><td>' + label + '</td><td>' + (cb[k] > 0 ? '+' : '') + cb[k] + '</td></tr>';
        });
      }
      modHtml += '</tbody></table>';
      sections.push('<div class="detail-section"><h5>额外属性补正</h5>' + modHtml + '</div>');
    } else {
      sections.push('<div class="detail-section"><h5>额外属性补正</h5><p class="detail-empty">无</p></div>');
    }

    // Skills
    var skills = enemy.skills || [];
    if (skills.length > 0) {
      var skillHtml = '<table class="detail-table"><thead><tr><th>技能ID</th><th>等级</th></tr></thead><tbody>';
      skills.forEach(function(s) {
        skillHtml += '<tr><td><span class="ref-id">#' + window.escapeHTML(s.skillId) + '</span></td><td>' + window.escapeHTML(String(s.level)) + '</td></tr>';
      });
      skillHtml += '</tbody></table>';
      sections.push('<div class="detail-section"><h5>技能</h5>' + skillHtml + '</div>');
    }

    // AI 配置（从 enemy-battle-configs.json 读取，显示配置名 + preferredRanks + stanceCondition）
    var configId = enemy.defaultConfigId;
    var configName = '使用默认配置';
    var matchedConfig = null;
    if (configId && configsData) {
      matchedConfig = findConfigById(configId, configsData);
      if (matchedConfig) {
        configName = window.escapeHTML(matchedConfig.name || configId);
      } else {
        configName = '<span class="ref-id">#' + window.escapeHTML(configId) + '</span>（未找到）';
      }
    }
    var preferredRanksDisplay = matchedConfig ? formatPreferredRanks(matchedConfig.preferredRanks) : '—';
    var stanceConditionDisplay = matchedConfig ? formatStanceCondition(matchedConfig.stanceCondition) : '—';
    var configHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>' +
      '<tr><td>AI 配置</td><td>' + configName + '</td></tr>' +
      '<tr><td>可入排位</td><td>' + window.escapeHTML(preferredRanksDisplay) + '</td></tr>' +
      '<tr><td>条件入场</td><td>' + (stanceConditionDisplay === '—' ? '—' : stanceConditionDisplay) + '</td></tr>' +
      '</tbody></table>';
    sections.push('<div class="detail-section"><h5>AI 配置</h5>' + configHtml + '</div>');

    // Used in groups
    var usedInGroups = [];
    if (groupsData) {
      groupsData.forEach(function(g) {
        var members = g.enemies || [];
        members.forEach(function(m) {
          if (m.enemyId === enemy.enemyId) {
            usedInGroups.push(g.groupId + ' (' + g.name + ')');
          }
        });
      });
    }
    if (usedInGroups.length > 0) {
      sections.push('<div class="detail-section"><h5>出现在阵容</h5><p>' + usedInGroups.join('；') + '</p></div>');
    }

    // Reward table
    if (enemy.rewardTableId) {
      sections.push(renderRewardTable(enemy.rewardTableId, rewardTablesData, itemsData));
    }

    return '<div class="details">' + sections.join('') + '</div>';
  }

  function renderGroupDetail(group, enemiesData, configsData) {
    var sections = [];

    var basicHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>' +
      '<tr><td>ID</td><td>' + window.escapeHTML(group.groupId) + '</td></tr>' +
      '<tr><td>名称</td><td>' + window.escapeHTML(group.name) + '</td></tr>' +
      '<tr><td>描述</td><td>' + window.escapeHTML(group.description || '—') + '</td></tr>' +
      '<tr><td>敌人数量</td><td>' + (group.enemies || []).length + '</td></tr>' +
      '</tbody></table>';
    sections.push('<div class="detail-section"><h5>基本信息</h5>' + basicHtml + '</div>');

    // Members with position
    var members = group.enemies || [];
    if (members.length > 0) {
      var memberHtml = '<table class="detail-table"><thead><tr><th>敌人</th><th>位置</th><th>AI 配置</th><th>覆盖</th></tr></thead><tbody>';
      members.forEach(function(m) {
        var enemyName = m.enemyId;
        var enemyDefaultConfigId = null;
        if (enemiesData) {
          for (var i = 0; i < enemiesData.length; i++) {
            if (enemiesData[i].enemyId === m.enemyId) {
              enemyName = enemiesData[i].name + ' <span class="ref-id">#' + m.enemyId + '</span>';
              enemyDefaultConfigId = enemiesData[i].defaultConfigId;
              break;
            }
          }
        }
        // 位置：Lane X，加上从配置读取的可入排位
        var pos = 'Lane ' + m.lane;
        var effectiveConfigId = m.configId || enemyDefaultConfigId;
        var effectiveConfig = findConfigById(effectiveConfigId, configsData);
        if (effectiveConfig && effectiveConfig.preferredRanks && effectiveConfig.preferredRanks.length > 0) {
          pos += ' (' + formatPreferredRanks(effectiveConfig.preferredRanks) + ')';
        }
        // 实际生效的配置：阵容 configId 覆盖 → 模板 defaultConfigId
        var configDisplay = '—';
        if (effectiveConfigId && configsData) {
          if (effectiveConfig) {
            configDisplay = window.escapeHTML(effectiveConfig.name || effectiveConfigId);
          } else {
            configDisplay = '<span class="ref-id">#' + window.escapeHTML(effectiveConfigId) + '</span>（未找到）';
          }
        }
        var overrideStr = m.overrides ? JSON.stringify(m.overrides) : '—';
        memberHtml += '<tr><td>' + enemyName + '</td><td>' + pos + '</td><td>' + configDisplay + '</td><td><code>' + window.escapeHTML(overrideStr) + '</code></td></tr>';
      });
      memberHtml += '</tbody></table>';
      sections.push('<div class="detail-section"><h5>阵容成员</h5>' + memberHtml + '</div>');
    }

    return '<div class="details">' + sections.join('') + '</div>';
  }

  function renderTemplateDetail(template) {
    var sections = [];

    var basicRows = [
      { label: 'ID', value: template.templateId },
      { label: '名称', value: template.name },
      { label: '描述', value: template.description },
      { label: '战场类型', value: BATTLE_TYPE_LABELS[template.battleType] || template.battleType },
      { label: '布局', value: (template.layout ? (template.layout.lanes + '路×' + template.layout.ranks + '排') : '—') },
      { label: '最大单位数', value: String(template.maxUnitsPerSide) },
      { label: '敌人阵容', value: template.enemyGroupId ? '<span class="ref-id">#' + window.escapeHTML(template.enemyGroupId) + '</span>' : '无（副本指定）' },
      { label: '行军阈值', value: String(template.marchThreshold) }
    ];

    var html = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>';
    basicRows.forEach(function(r) {
      html += '<tr><td>' + window.escapeHTML(r.label) + '</td><td>' + r.value + '</td></tr>';
    });
    html += '</tbody></table>';
    sections.push('<div class="detail-section"><h5>基本信息</h5>' + html + '</div>');

    return '<div class="details">' + sections.join('') + '</div>';
  }

  function renderDungeonDetail(dungeon, groupsData, rewardTablesData, itemsData) {
    var sections = [];

    var basicHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>' +
      '<tr><td>副本ID</td><td>' + window.escapeHTML(dungeon.dungeonId) + '</td></tr>' +
      '<tr><td>地图ID</td><td>' + window.escapeHTML(dungeon.mapId) + '</td></tr>' +
      '<tr><td>难度</td><td>' + (DIFFICULTY_LABELS[dungeon.difficulty] || dungeon.difficulty) + '</td></tr>' +
      '<tr><td>奖励类型</td><td>' + (DUNGEON_TYPE_LABELS[dungeon.dungeonType] || dungeon.dungeonType) + '</td></tr>' +
      '<tr><td>敌人阵容</td><td><span class="ref-id">#' + window.escapeHTML(dungeon.enemyGroupId) + '</span></td></tr>' +
      '<tr><td>队列时长</td><td>' + dungeon.queueDuration + '秒</td></tr>' +
      '<tr><td>奖励包ID</td><td><span class="ref-id">#' + window.escapeHTML(dungeon.rewardPackId) + '</span></td></tr>' +
      '<tr><td>排序</td><td>' + dungeon.order + '</td></tr>' +
      '</tbody></table>';
    sections.push('<div class="detail-section"><h5>副本配置</h5>' + basicHtml + '</div>');

    // Enemy group reference
    if (groupsData && dungeon.enemyGroupId) {
      var refGroup = null;
      for (var i = 0; i < groupsData.length; i++) {
        if (groupsData[i].groupId === dungeon.enemyGroupId) {
          refGroup = groupsData[i];
          break;
        }
      }
      if (refGroup) {
        sections.push('<div class="detail-section"><h5>关联阵容</h5><p>' +
          window.escapeHTML(refGroup.name) + '（' + (refGroup.enemies || []).length + '个敌人）</p></div>');
      }
    }

    // Reward pack
    if (dungeon.rewardPackId) {
      sections.push(renderRewardTable(dungeon.rewardPackId, rewardTablesData, itemsData));
    }

    return '<div class="details">' + sections.join('') + '</div>';
  }

  function renderConfigDetail(config) {
    var sections = [];

    var preferredRanksDisplay = formatPreferredRanks(config.preferredRanks);
    var stanceConditionDisplay = formatStanceCondition(config.stanceCondition);

    var basicHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>' +
      '<tr><td>配置ID</td><td><span class="ref-id">#' + window.escapeHTML(config.configId) + '</span></td></tr>' +
      '<tr><td>配置名</td><td>' + window.escapeHTML(config.name || '—') + '</td></tr>' +
      '<tr><td>可入排位</td><td>' + window.escapeHTML(preferredRanksDisplay) + '</td></tr>' +
      '<tr><td>条件入场</td><td>' + (stanceConditionDisplay === '—' ? '—' : stanceConditionDisplay) + '</td></tr>' +
      '<tr><td>寻敌策略</td><td>' + window.escapeHTML(TARGET_RULE_LABELS[config.targetRule] || config.targetRule || '—') + '</td></tr>' +
      '<tr><td>群攻规则</td><td>' + window.escapeHTML(AOE_TARGET_LABELS[config.aoeTargetRule] || config.aoeTargetRule || '—') + '</td></tr>' +
      '</tbody></table>';
    sections.push('<div class="detail-section"><h5>基本信息</h5>' + basicHtml + '</div>');

    // 技能队列
    var sq = config.skillQueue || [];
    if (sq.length > 0) {
      var sqHtml = '<table class="detail-table"><thead><tr><th>优先级</th><th>技能ID</th><th>释放条件</th></tr></thead><tbody>';
      sq.forEach(function(entry, idx) {
        var skillDisplay = '<span class="ref-id">#' + window.escapeHTML(entry.skillId) + '</span>';
        var condDisplay = '—';
        if (entry.conditions && entry.conditions.length > 0) {
          condDisplay = entry.conditions.map(function(c) {
            return window.escapeHTML(c.metric + ' ' + c.operator + ' ' + c.value);
          }).join('<br>');
        }
        sqHtml += '<tr><td>' + (idx + 1) + '</td><td>' + skillDisplay + '</td><td>' + condDisplay + '</td></tr>';
      });
      sqHtml += '</tbody></table>';
      sections.push('<div class="detail-section"><h5>技能队列</h5>' + sqHtml + '</div>');
    }

    return '<div class="details">' + sections.join('') + '</div>';
  }

  /* ========== 主工具函数 ========== */

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

  function renderList(tabName, columns, data, expanded, sortAsc, searchKeyword, root, enemiesData, groupsData, itemsData, rewardTablesData, configsData) {
    var tableHead = root.querySelector('.battle-tableHead');
    var itemsBody = root.querySelector('.battle-itemsBody');
    var statsCount = root.querySelector('.battle-stats-count');
    var emptyNotice = root.querySelector('.battle-empty');
    var pageInfo = root.querySelector('.battle-page-info');
    var prevBtn = root.querySelector('.battle-prev');
    var nextBtn = root.querySelector('.battle-next');

    var list = data.slice();

    // Search
    if (searchKeyword) {
      var kw = searchKeyword.toLowerCase();
      list = list.filter(function(item) {
        for (var key in item) {
          if (item.hasOwnProperty(key)) {
            var v = String(item[key] || '').toLowerCase();
            if (v.indexOf(kw) >= 0) return true;
          }
        }
        return false;
      });
    }

    // Sort
    list.sort(function(a, b) {
      var ai = a[columns[0].key] || '';
      var bi = b[columns[0].key] || '';
      return sortAsc ? String(ai).localeCompare(String(bi)) : String(bi).localeCompare(String(ai));
    });

    var total = data.length;
    var filtered = list.length;

    // Pagination
    var pageData = root._btPageData || {};
    var currentPage = pageData[tabName] || 0;
    var totalPages = Math.ceil(filtered / PAGE_SIZE) || 1;
    if (currentPage >= totalPages) currentPage = totalPages - 1;
    if (currentPage < 0) currentPage = 0;
    pageData[tabName] = currentPage;
    root._btPageData = pageData;

    var pageStart = currentPage * PAGE_SIZE;
    var pageEnd = Math.min(pageStart + PAGE_SIZE, filtered);
    var pageList = list.slice(pageStart, pageEnd);

    // Stats
    if (total === filtered) {
      statsCount.textContent = '共 ' + total + ' 条';
    } else {
      statsCount.textContent = '共 ' + total + ' 条 / 筛选后 ' + filtered + ' 条';
    }

    // Page info
    if (totalPages > 1) {
      pageInfo.textContent = '第 ' + (currentPage + 1) + '/' + totalPages + ' 页（' + pageStart + '-' + pageEnd + '）';
      pageInfo.classList.remove('hidden');
      prevBtn.classList.remove('hidden');
      nextBtn.classList.remove('hidden');
      prevBtn.disabled = currentPage <= 0;
      nextBtn.disabled = currentPage >= totalPages - 1;
    } else {
      pageInfo.classList.add('hidden');
      prevBtn.classList.add('hidden');
      nextBtn.classList.add('hidden');
    }

    // Render table
    itemsBody.innerHTML = '';

    if (pageList.length === 0) {
      emptyNotice.classList.remove('hidden');
      buildTableHeader(tableHead, columns);
      return;
    } else {
      emptyNotice.classList.add('hidden');
    }

    buildTableHeader(tableHead, columns);

    pageList.forEach(function(item) {
      var id = item[columns[0].key] || JSON.stringify(item);
      var tr = document.createElement('tr');
      tr.className = 'row';

      columns.forEach(function(col) {
        var td = document.createElement('td');
        var value;

        if (col.compute) {
          value = col.compute(item);
        } else {
          value = item[col.key];
        }

        if (col.key === 'difficulty') {
          td.textContent = DIFFICULTY_LABELS[String(value)] || value;
        } else if (col.key === 'dungeonType') {
          td.textContent = DUNGEON_TYPE_LABELS[value] || value;
        } else if (col.key === 'battleType') {
          td.textContent = BATTLE_TYPE_LABELS[value] || value;
        } else if (col.key === 'rewardTableId' || col.key === 'enemyGroupId') {
          td.innerHTML = '<span class="ref-id">#' + window.escapeHTML(String(value)) + '</span>';
        } else if (col.key === 'queueDuration') {
          td.textContent = value >= 60 ? (value / 60).toFixed(1) + '分' : value + '秒';
        } else {
          td.textContent = formatCell(value);
        }

        tr.appendChild(td);
      });

      // Operations
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

      // Detail row
      var detailRow = document.createElement('tr');
      detailRow.className = 'detail-row';
      detailRow.style.display = expanded[id] ? '' : 'none';
      var colspan = columns.length + 1;
      var detailContent = '';

      if (tabName === 'enemies') {
        detailContent = renderEnemyDetail(item, enemiesData, groupsData, itemsData, rewardTablesData, configsData);
      } else if (tabName === 'groups') {
        detailContent = renderGroupDetail(item, enemiesData, configsData);
      } else if (tabName === 'templates') {
        detailContent = renderTemplateDetail(item);
      } else if (tabName === 'dungeons') {
        detailContent = renderDungeonDetail(item, groupsData, rewardTablesData, itemsData);
      } else if (tabName === 'configs') {
        detailContent = renderConfigDetail(item);
      }

      detailRow.innerHTML = '<td colspan="' + colspan + '">' + detailContent + '</td>';
      itemsBody.appendChild(detailRow);

      copyBtn.addEventListener('click', function() {
        try {
          navigator.clipboard.writeText(JSON.stringify(item, null, 2));
          showToast('JSON 已复制到剪贴板', 'success');
        } catch (e) {
          showToast('复制失败', 'error');
        }
      });

      expandBtn.addEventListener('click', function() {
        expanded[id] = !expanded[id];
        renderList(tabName, columns, data, expanded, sortAsc, searchKeyword, root, enemiesData, groupsData, itemsData, rewardTablesData, configsData);
      });
    });
  }

  /* ========== 主工具函数 ========== */

  function mountBattleTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';

    // Build UI
    var html =
      '<div class="items-component battle-component">' +
      '  <style>' +
      '    .battle-title{margin-bottom:12px;}' +
      '    .battle-pagination{display:flex;gap:8px;margin-bottom:8px;}' +
      '    .battle-page-btn{padding:4px 12px;border:1px solid var(--btn-border,#ddd);border-radius:4px;cursor:pointer;font-size:13px;background:var(--card,#f9f9f9);}' +
      '    .battle-page-btn:disabled{opacity:0.4;cursor:default;}' +
      '    .battle-page-btn:hover:not(:disabled){background:var(--btn-hover-bg,#eee);}' +
      '    .battle-sort-btn{padding:4px 12px;border:1px solid var(--btn-border,#ddd);border-radius:4px;cursor:pointer;font-size:13px;background:var(--card,#f9f9f9);}' +
      '    .battle-sort-btn:hover{background:var(--btn-hover-bg,#eee);}' +
      '    .battle-page-info{margin-left:16px;font-size:13px;color:var(--muted,#888);}' +
    '  </style>' +
      '  <h3 class="battle-title">战斗数据查询器</h3>' +
      '  <div class="toolbar">' +
      '    <label>数据集:' +
      '      <select class="battle-filter-select" aria-label="数据集选择">' +
      '        <option value="enemies">敌人模板</option>' +
      '        <option value="groups">敌人阵容</option>' +
      '        <option value="templates">战场模板</option>' +
      '        <option value="dungeons">副本配置</option>' +
      '        <option value="configs">敌人设置</option>' +
      '      </select>' +
      '    </label>' +
      '    <div class="search-box">' +
      '      <span class="search-icon">🔍</span>' +
      '      <input type="text" class="searchInput" placeholder="搜索..." aria-label="搜索关键词" />' +
      '    </div>' +
      '    <button class="battle-sort-btn">排序: 升序</button>' +
      '  </div>' +
      '  <div class="stats-bar">' +
      '    <span class="stats-count battle-stats-count"></span>' +
      '    <span class="battle-page-info"></span>' +
      '  </div>' +
      '  <div class="battle-pagination">' +
      '    <button class="battle-page-btn battle-prev">上一页</button>' +
      '    <button class="battle-page-btn battle-next">下一页</button>' +
      '  </div>' +
      '  <table class="itemsTable" aria-describedby="战斗数据">' +
      '    <thead class="battle-tableHead"></thead>' +
      '    <tbody class="battle-itemsBody"></tbody>' +
      '  </table>' +
      '  <p class="battle-empty notice hidden">无数据</p>' +
      '</div>';

    container.innerHTML = html;
    var root = container.querySelector('.battle-component');

    // Tab state
    var currentTab = 'enemies';
    var expanded = {};
    var sortAsc = true;
    var searchKeyword = '';

    // Data stores
    var enemiesData = [];
    var groupsData = [];
    var templatesData = [];
    var dungeonsData = [];
    var itemsData = [];
    var rewardTablesData = [];
    var configsData = [];

    // Load all data
    function loadAllData() {
      Promise.all([
        window.fetchDataset('enemies'),
        window.fetchDataset('enemyGroups'),
        window.fetchDataset('battleTemplates'),
        window.fetchDataset('dungeonTemplates'),
        window.fetchDataset('items'),
        window.fetchDataset('rewardTables'),
        window.fetchDataset('enemyBattleConfigs')
      ]).then(function(results) {
        // Helper: 提取包装格式 JSON {_meta:..., key:[...]} 中的数据数组
        function extractArray(result, key) {
          if (result && typeof result === 'object' && !Array.isArray(result)) {
            if (result[key] && Array.isArray(result[key])) return result[key];
            // 也检查 result 直接在 data 字段下
            if (result.data && Array.isArray(result.data)) return result.data;
          }
          if (Array.isArray(result)) return result;
          return [];
        }

        enemiesData = extractArray(results[0], 'enemies');
        groupsData = extractArray(results[1], 'groups');
        templatesData = extractArray(results[2], 'templates');
        dungeonsData = extractArray(results[3], 'templates');
        itemsData = extractArray(results[4], 'items');
        rewardTablesData = extractArray(results[5], 'rewardTables');
        configsData = extractArray(results[6], 'configs');

        expanded = {};
        renderCurrentTab();
      });
    }

    function getCurrentData() {
      switch (currentTab) {
        case 'enemies': return enemiesData;
        case 'groups': return groupsData;
        case 'templates': return templatesData;
        case 'dungeons': return dungeonsData;
        case 'configs': return configsData;
        default: return [];
      }
    }

    function getCurrentColumns() {
      switch (currentTab) {
        case 'enemies': return enemyColumns;
        case 'groups': return groupColumns;
        case 'templates': return templateColumns;
        case 'dungeons': return dungeonColumns;
        case 'configs': return configColumns;
        default: return [];
      }
    }

    function renderCurrentTab() {
      var data = getCurrentData();
      var columns = getCurrentColumns();

      // Move page info, pagination inside renderList
      renderList(currentTab, columns, data, expanded, sortAsc, searchKeyword, root, enemiesData, groupsData, itemsData, rewardTablesData, configsData);
    }

    // Dataset selection
    var filterSelect = root.querySelector('.battle-filter-select');
    filterSelect.addEventListener('change', function() {
      currentTab = filterSelect.value;
      searchKeyword = '';
      root.querySelector('.searchInput').value = '';
      renderCurrentTab();
    });

    // Search
    var searchInput = root.querySelector('.searchInput');
    var searchTimer = null;
    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        searchKeyword = searchInput.value.trim();
        renderCurrentTab();
      }, 200);
    });

    // Sort toggle
    var toggleSortBtn = root.querySelector('.battle-sort-btn');
    toggleSortBtn.addEventListener('click', function() {
      sortAsc = !sortAsc;
      toggleSortBtn.textContent = '排序: ' + (sortAsc ? '升序' : '降序');
      renderCurrentTab();
    });

    // Pagination
    root.querySelector('.battle-prev').addEventListener('click', function() {
      var pageData = root._btPageData || {};
      var cp = pageData[currentTab] || 0;
      if (cp > 0) {
        pageData[currentTab] = cp - 1;
        root._btPageData = pageData;
        renderCurrentTab();
      }
    });

    root.querySelector('.battle-next').addEventListener('click', function() {
      var data = getCurrentData();
      var pageData = root._btPageData || {};
      var cp = pageData[currentTab] || 0;
      var totalPages = Math.ceil(data.length / PAGE_SIZE) || 1;
      if (cp < totalPages - 1) {
        pageData[currentTab] = cp + 1;
        root._btPageData = pageData;
        renderCurrentTab();
      }
    });

    // Initial load
    loadAllData();
  }

  window.mountBattleTool = mountBattleTool;

})();
