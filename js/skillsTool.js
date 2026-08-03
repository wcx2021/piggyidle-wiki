/**
 * Wiki 技能查询工具模块
 * 从 skills.json 加载数据，显示技能完整属性
 */

(function() {
  'use strict';

  var skillTypeLabels = {
    passive: '被动', active: '主动', combat_active: '战斗主动',
    combat_support: '战斗辅助', domain: '领域'
  };
  var skillEffectLabels = {
    attribute: '属性加成', exp_bonus: '经验加成', proficiency: '熟练加成',
    resource_bonus: '资源加成', item_gain: '获得道具', global_buff: '全局增益',
    resource_gain: '获得资源', instant_heal: '立即恢复', special: '特殊效果',
    damage: '伤害', heal: '治疗', self_buff: '自身增益', enemy_debuff: '敌方减益',
    buff: '友方增益', debuff: '敌方减益', shield: '护盾',
    position_bonus: '位置强化', formation_bonus: '阵型强化', condition_trigger: '条件触发'
  };
  var skillRangeLabels = {
    melee: '近战', ranged: '远程', single: '单体', aoe: '范围',
    self: '自身', all: '全场', all_allies: '全体友方', all_enemies: '全体敌人',
    adjacent: '相邻', column: '整列', row: '整行', area: '区域',
    same_column: '同列', same_row: '同行'
  };
  var skillScopeLabels = { both: '通用', combat: '战斗', life: '生活' };
  var skillTriggerLabels = { always: '常驻', on_attack: '攻击时', on_hit: '受击时',
    on_crit: '暴击时', hp_below_30: '血量<30%', on_kill: '击杀时',
    on_enter_combat: '进入战斗', position_front: '前排位置', position_middle: '中排位置', position_back: '后排位置' };

  function formatCooldown(value, scope, type) {
    if (value === null || value === undefined || value === '') return '—';
    if (type === 'passive') return '—';
    // combat 场景：单位是帧，1帧 = 0.1s，保留一位小数
    if (scope === 'combat') {
      var seconds = value * 0.1;
      if (seconds === 0) return '0s';
      return seconds.toFixed(1) + 's';
    }
    // life 场景：单位是秒，显示整数
    if (scope === 'life') {
      return Math.floor(value) + 's';
    }
    // both 或其他：按整数秒显示
    return Math.floor(value) + 's';
  }

  var skillColumns = [
    { key: 'name', label: '名称' },
    { key: 'type', label: '类型', isBadge: true },
    { key: 'effect', label: '效果', isEffect: true },
    { key: 'target', label: '目标', isRangeLabel: true },
    { key: 'range', label: '范围', isRangeLabel: true },
    { key: 'cooldown', label: '冷却', isCooldown: true },
    { key: 'maxLevel', label: '最高等级' }
  ];

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

  function renderBadge(text, color) {
    var c = color || '#6b7280';
    var label = skillTypeLabels[text] || text;
    return '<span class="type-badge" style="background:' + c + '1a;color:' + c + ';border:1px solid ' + c + '33;">' + window.escapeHTML(label) + '</span>';
  }

  var typeColorMap = {
    passive: '#6366f1',
    active: '#f59e0b',
    combat_active: '#ef4444',
    combat_support: '#10b981',
    domain: '#8b5cf6'
  };

  function formatCell(v) {
    if (v === null || v === undefined || v === '') return '—';
    return String(v);
  }

  function findJobsForSkill(skillId, jobsData) {
    if (!jobsData || !skillId) return [];
    var result = [];
    for (var i = 0; i < jobsData.length; i++) {
      var job = jobsData[i];
      var skills = job.skills || [];
      for (var j = 0; j < skills.length; j++) {
        if (skills[j] === skillId) {
          result.push(job.name || job.id);
          break;
        }
      }
    }
    return result;
  }

  function getEffectLabel(effect) {
    return skillEffectLabels[effect] || effect || '—';
  }

  function getTypeColor(type) {
    return typeColorMap[type] || '#6b7280';
  }

  function renderExtraEffects(extraEffects) {
    var labels = {
      greatSuccess: '大成功',
      success: '成功',
      normal: '普通',
      failure: '失败',
      greatFailure: '大失败'
    };
    var groups = extraEffects || {};
    var rows = [];
    Object.keys(labels).forEach(function(key) {
      var effects = Array.isArray(groups[key]) ? groups[key] : [];
      if (effects.length === 0) return;
      var value = effects.map(function(item) {
        if (!item || typeof item !== 'object') return String(item);
        var effect = getEffectLabel(item.effect);
        var params = item.params ? ' ' + JSON.stringify(item.params) : '';
        var formula = item.formula ? ' 公式: ' + item.formula : '';
        return effect + params + formula;
      }).join('；');
      rows.push('<tr><td>' + window.escapeHTML(labels[key]) + '</td><td>' + window.escapeHTML(value) + '</td></tr>');
    });
    if (rows.length === 0) return '';
    return '<div class="detail-section"><h5>额外效果</h5><table class="detail-table"><thead><tr><th>判定结果</th><th>效果</th></tr></thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  function renderDetailContent(skill, jobsData) {
    var sections = [];

    // Basic info
    var basicRows = [
      { label: '技能ID', value: skill.id },
      { label: '类型', value: skillTypeLabels[skill.type] || skill.type },
      { label: '效果', value: skillEffectLabels[skill.effect] || skill.effect },
      { label: '目标', value: skillRangeLabels[skill.target] || skill.target || '—' },
      { label: '目标数量', value: skill.targetCount !== undefined && skill.targetCount !== null ? skill.targetCount : '—' },
      { label: '范围', value: skillRangeLabels[skill.range] || skill.range || '—' },
      { label: '需求武器', value: Array.isArray(skill.requiredWeaponTypes) && skill.requiredWeaponTypes.length > 0 ? skill.requiredWeaponTypes.join('、') : '无限制' },
      { label: '作用域', value: skillScopeLabels[skill.scope] || skill.scope || '—' },
      { label: '冷却', value: formatCooldown(skill.cooldown, skill.scope, skill.type) },
      { label: '最高等级', value: skill.maxLevel || '—' },
      { label: '持续回合', value: skill.duration !== null && skill.duration !== undefined ? skill.duration + '回合' : '—' }
    ];
    if (skill.triggerCondition) {
      basicRows.push({ label: '触发条件', value: skillTriggerLabels[skill.triggerCondition] || skill.triggerCondition });
    }

    var basicHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>';
    basicRows.forEach(function(r) {
      basicHtml += '<tr><td>' + window.escapeHTML(r.label) + '</td><td>' + window.escapeHTML(r.value) + '</td></tr>';
    });
    basicHtml += '</tbody></table>';
    sections.push('<div class="detail-section"><h5>基本信息</h5>' + basicHtml + '</div>');

    // Associated jobs
    var jobNames = findJobsForSkill(skill.id, jobsData);
    if (jobNames.length > 0) {
      sections.push('<div class="detail-section"><h5>关联职业</h5><p>' + window.escapeHTML(jobNames.join('、')) + '</p></div>');
    }

    // Description
    sections.push('<div class="detail-section"><h5>描述</h5><p class="detail-desc">' + window.escapeHTML(skill.desc || '—') + '</p></div>');

    var extraEffectsHtml = renderExtraEffects(skill.extraEffects);
    if (extraEffectsHtml) sections.push(extraEffectsHtml);

    // Energy data (for active skills)
    if (skill.type === 'active') {
      var energyHtml = '<table class="detail-table"><thead><tr><th>字段</th><th>公式</th></tr></thead><tbody>';
      energyHtml += '<tr><td>能量消耗公式</td><td>' + window.escapeHTML(skill.energyCostFormula || '—') + '</td></tr>';
      energyHtml += '<tr><td>能量上限公式</td><td>' + window.escapeHTML(skill.energyMaxFormula || '—') + '</td></tr>';
      energyHtml += '<tr><td>回复速率公式</td><td>' + window.escapeHTML(skill.regenRateFormula || '—') + '</td></tr>';
      energyHtml += '<tr><td>能量公式</td><td>' + window.escapeHTML(skill.energyFormula || '—') + '</td></tr>';
      energyHtml += '</tbody></table>';
      sections.push('<div class="detail-section"><h5>能量数据</h5>' + energyHtml + '</div>');
    }

    // Formula fields for combat-related types
    if (skill.type === 'combat_active' || skill.type === 'combat_support' || skill.type === 'domain') {
      var formulaRows = [];
      if (skill.damageType) formulaRows.push('<tr><td>伤害类型</td><td>' + window.escapeHTML(skill.damageType) + '</td></tr>');
      if (skill.damageFormula) formulaRows.push('<tr><td>公式</td><td>' + window.escapeHTML(skill.damageFormula) + '</td></tr>');
      if (skill.positionBonus !== undefined) formulaRows.push('<tr><td>位置加成</td><td>' + window.escapeHTML(String(skill.positionBonus)) + '</td></tr>');
      if (formulaRows.length > 0) {
        sections.push('<div class="detail-section"><h5>公式</h5><table class="detail-table"><thead><tr><th>字段</th><th>值</th></tr></thead><tbody>' + formulaRows.join('') + '</tbody></table></div>');
      }
    }

    // Params
    var params = skill.params || {};
    if (Object.keys(params).length > 0) {
      var paramHtml = '<table class="detail-table"><thead><tr><th>参数</th><th>值</th></tr></thead><tbody>';
      Object.keys(params).forEach(function(k) {
        paramHtml += '<tr><td>' + window.escapeHTML(k) + '</td><td>' + window.escapeHTML(formatCell(params[k])) + '</td></tr>';
      });
      paramHtml += '</tbody></table>';
      sections.push('<div class="detail-section"><h5>参数</h5>' + paramHtml + '</div>');
    }

    return '<div class="details">' + sections.join('') + '</div>';
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

  function mountSkillsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('skills-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.skills-component');
    var typeFilter = root.querySelector('.skillTypeFilter');
    var rangeFilter = root.querySelector('.skillRangeFilter');
    var searchInput = root.querySelector('.searchInput');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var statsCount = root.querySelector('.stats-count');
    var tableHead = root.querySelector('.tableHead');
    var itemsBody = root.querySelector('.itemsBody');
    var emptyNotice = root.querySelector('.empty');

    var skillsData = [];
    var jobsData = [];
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
      var rangeVal = rangeFilter.value;
      var keyword = (searchInput.value || '').trim().toLowerCase();
      itemsBody.innerHTML = '';
      var list = skillsData.slice();

      if (typeVal !== 'all') {
        list = list.filter(function(s) {
          return s.type === typeVal;
        });
      }

      if (rangeVal !== 'all') {
        list = list.filter(function(s) {
          return s.range === rangeVal || s.target === rangeVal;
        });
      }

      if (keyword) {
        list = list.filter(function(s) {
          var id = String(s.id || '').toLowerCase();
          var name = String(s.name || '').toLowerCase();
          var desc = String(s.desc || '').toLowerCase();
          return id.indexOf(keyword) >= 0 || name.indexOf(keyword) >= 0 || desc.indexOf(keyword) >= 0;
        });
      }

      list.sort(function(a, b) {
        var ai = a.id || '';
        var bi = b.id || '';
        return sortAsc ? String(ai).localeCompare(String(bi)) : String(bi).localeCompare(String(ai));
      });

      updateStats(skillsData.length, list.length);

      if (list.length === 0) {
        emptyNotice.classList.remove('hidden');
        buildTableHeader(tableHead, skillColumns);
        return;
      } else {
        emptyNotice.classList.add('hidden');
      }

      buildTableHeader(tableHead, skillColumns);

      list.forEach(function(skill) {
        var id = skill.id;
        var tr = document.createElement('tr');
        tr.className = 'row';

        skillColumns.forEach(function(col) {
          var value = '';
          var aliases = col.aliases || [col.key];
          for (var i = 0; i < aliases.length; i++) {
            if (skill[aliases[i]] !== undefined && skill[aliases[i]] !== null) {
              value = skill[aliases[i]];
              break;
            }
          }
          var td = document.createElement('td');

          if (col.isBadge && value) {
            td.innerHTML = renderBadge(String(value), getTypeColor(String(value)));
          } else if (col.isEffect && value) {
            td.innerHTML = renderBadge(getEffectLabel(value), getTypeColor(skill.type));
          } else if (col.isRangeLabel && value) {
            td.textContent = skillRangeLabels[value] || value;
          } else if (col.isCooldown) {
            td.textContent = formatCooldown(value, skill.scope, skill.type);
          } else {
            td.textContent = formatCell(value, col);
          }

          tr.appendChild(td);
        });

        // op cell
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

        // detail row
        var detailRow = document.createElement('tr');
        detailRow.className = 'detail-row';
        detailRow.style.display = expanded[id] ? '' : 'none';
        var colspan = skillColumns.length + 1;
        detailRow.innerHTML = '<td colspan="' + colspan + '">' + renderDetailContent(skill, jobsData) + '</td>';
        itemsBody.appendChild(detailRow);

        copyBtn.addEventListener('click', function() {
          try {
            navigator.clipboard.writeText(JSON.stringify(skill, null, 2));
            showToast('JSON 已复制到剪贴板', 'success');
          } catch (e) {
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
        window.fetchDataset('skills'),
        window.fetchDataset('jobs')
      ]).then(function(results) {
        skillsData = Array.isArray(results[0]) ? results[0] : [];
        jobsData = Array.isArray(results[1]) ? results[1] : [];
        expanded = {};
        render();
      });
    }

    function init() {
      typeFilter.addEventListener('change', function() {
        render();
      });

      rangeFilter.addEventListener('change', function() {
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

  window.mountSkillsTool = mountSkillsTool;

})();
