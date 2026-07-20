/**
 * Wiki Jobs 查询工具模块
 * 提供职业数据查询功能，从原 itemsTool.js 提取的职业部分
 */

(function() {
  'use strict';

  var jobPathLabels = {
    origin: '起源',
    meat: '肉猪系',
    knight: '骑士系',
    dumb: '笨猪系',
    smart: '聪明系'
  };

  var jobExpSourceLabels = {
    none: '不可升级',
    profession_exp: '跟随技艺经验',
    combat_exp: '战斗获取',
    craft_exp: '制造获取',
    explore_exp: '探索获取',
    all_action: '全行动获取'
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

  var typeLabelMap = {
    race: '种族',
    combat: '战斗系',
    production: '生产系'
  };

  var skillTypeLabels = {
    passive: '被动', active: '主动', combat_active: '战斗主动',
    combat_support: '战斗辅助', domain: '领域'
  };

  var typeColorMap = {
    race: '#a855f7',
    combat: '#ef4444',
    production: '#22c55e'
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

  function renderSkillNames(skillIds, skillsData) {
    if (!skillIds || skillIds.length === 0) return '—';
    var names = skillIds.map(function(sid) {
      for (var i = 0; i < (skillsData || []).length; i++) {
        if (skillsData[i].id === sid) return skillsData[i].name || sid;
      }
      return sid;
    });
    return names.join('、');
  }

  function renderJobSkills(skillIds, skillsData) {
    if (!skillIds || skillIds.length === 0) return '';
    var html = '<div class="detail-section"><h5>技能列表</h5><table class="detail-table"><thead><tr><th>ID</th><th>名称</th><th>类型</th></tr></thead><tbody>';
    skillIds.forEach(function(sid) {
      var skill = null;
      for (var i = 0; i < (skillsData || []).length; i++) {
        if (skillsData[i].id === sid) { skill = skillsData[i]; break; }
      }
      var name = skill ? (skill.name || sid) : sid;
      var type = skill ? (skillTypeLabels[skill.type] || skill.type || '—') : '—';
      html += '<tr><td>#' + window.escapeHTML(String(sid)) + '</td><td>' + window.escapeHTML(name) + '</td><td>' + window.escapeHTML(type) + '</td></tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function mountJobsTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('jobs-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.jobs-component');
    var pathFilter = root.querySelector('.pathFilter');
    var searchInput = root.querySelector('.searchInput');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var statsCount = root.querySelector('.stats-count');
    var tableHead = root.querySelector('.tableHead');
    var itemsBody = root.querySelector('.itemsBody');
    var emptyNotice = root.querySelector('.empty');

    var jobsData = [];
    var skillsData = [];
    var expanded = {};
    var sortAsc = true;

    var jobColumns = [
      { key: 'name', label: '名称', aliases: ['name'] },
      { key: 'path', label: '职系', aliases: ['path'] },
      { key: 'tier', label: '阶位', aliases: ['tier'] },
      { key: 'isExclusive', label: '互斥', aliases: ['isExclusive'], isBool: true }
    ];

    function updateStats(total, filtered) {
      if (total === filtered) {
        statsCount.textContent = '共 ' + total + ' 条';
      } else {
        statsCount.textContent = '共 ' + total + ' 条 / 筛选后 ' + filtered + ' 条';
      }
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

    function render() {
      var pathVal = pathFilter.value;
      var keyword = (searchInput.value || '').trim().toLowerCase();
      itemsBody.innerHTML = '';
      var list = jobsData.slice();

      if (pathVal !== 'all') {
        list = list.filter(function(job) {
          return job.path === pathVal;
        });
      }

      if (keyword) {
        list = list.filter(function(job) {
          var name = String(job.name || '').toLowerCase();
          var desc = String(job.desc || '').toLowerCase();
          var id = String(job.id || '').toLowerCase();
          return name.indexOf(keyword) >= 0 || desc.indexOf(keyword) >= 0 || id.indexOf(keyword) >= 0;
        });
      }

      list.sort(function(a, b) {
        var ai = a.tier !== undefined ? a.tier : a.id;
        var bi = b.tier !== undefined ? b.tier : b.id;
        if (typeof ai === 'number' && typeof bi === 'number') {
          return sortAsc ? ai - bi : bi - ai;
        }
        return sortAsc ? String(ai).localeCompare(String(bi)) : String(bi).localeCompare(String(ai));
      });

      updateStats(jobsData.length, list.length);

      if (list.length === 0) {
        emptyNotice.classList.remove('hidden');
        buildTableHeader(tableHead, []);
        return;
      } else {
        emptyNotice.classList.add('hidden');
      }

      buildTableHeader(tableHead, jobColumns);

      list.forEach(function(job) {
        var id = job.id;
        var tr = document.createElement('tr');
        tr.className = 'row';

        jobColumns.forEach(function(col) {
          var value = '';
          var aliases = col.aliases || [col.key];
          for (var i = 0; i < aliases.length; i++) {
            if (job[aliases[i]] !== undefined && job[aliases[i]] !== null) {
              value = job[aliases[i]];
              break;
            }
          }
          var td = document.createElement('td');

          if (col.key === 'path') {
            var pathLabel = jobPathLabels[value] || value;
            td.innerHTML = '<span class="type-badge" style="background:#8b5cf61a;color:#8b5cf6;border:1px solid #8b5cf633;">' + window.escapeHTML(pathLabel) + '</span>';
          } else if (col.key === 'tier') {
            td.innerHTML = 'T' + window.escapeHTML(String(value));
          } else if (col.key === 'isExclusive') {
            td.innerHTML = value ? '<span class="bool-check bool-yes">✓</span>' : '<span class="bool-check bool-no">✗</span>';
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
        var colspan = jobColumns.length + 1;
        var detailContent = '<div class="details">' +
          '<div class="detail-section"><h5>描述</h5><p class="detail-desc">' + window.escapeHTML(job.desc || '') + '</p></div>' +
          renderJobSkills(job.skills, skillsData) +
          '<div class="detail-grid">' +
          renderJobEffects(job) +
          renderJobReclassInfo(job) +
          '</div></div>';

        detailRow.innerHTML = '<td colspan="' + colspan + '">' + detailContent + '</td>';
        itemsBody.appendChild(detailRow);

        copyBtn.addEventListener('click', async function() {
          try {
            await navigator.clipboard.writeText(JSON.stringify(job, null, 2));
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
        window.fetchDataset('jobs'),
        window.fetchDataset('skills')
      ]).then(function(results) {
        jobsData = Array.isArray(results[0]) ? results[0] : [];
        skillsData = Array.isArray(results[1]) ? results[1] : [];
        expanded = {};
        render();
      });
    }

    function init() {
      pathFilter.addEventListener('change', function() {
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

  window.mountJobsTool = mountJobsTool;

})();
