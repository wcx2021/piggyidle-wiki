/**
 * Wiki 等级经验对照表工具模块
 * 从 server/data/experience.json 加载 1-200 级数据
 */

(function() {
  'use strict';

  var PAGE_SIZE = 10;

  function formatNumber(n) {
    if (n === null || n === undefined) return '—';
    return n.toLocaleString('en-US');
  }

  function mountLevelTool() {
    var container = document.getElementById('guideContentContainer');
    container.innerHTML = '';
    var tpl = document.getElementById('level-template');
    var node = tpl.content.cloneNode(true);
    container.appendChild(node);

    var root = container.querySelector('.level-component');
    var levelBody = root.querySelector('.levelBody');
    var statsCount = root.querySelector('.stats-count');
    var pageInfo = root.querySelector('.page-info');
    var prevPageBtn = root.querySelector('.prevPageBtn');
    var nextPageBtn = root.querySelector('.nextPageBtn');
    var toggleSortBtn = root.querySelector('.toggleSortBtn');
    var rangeFrom = root.querySelector('.rangeFrom');
    var rangeTo = root.querySelector('.rangeTo');
    var applyRangeBtn = root.querySelector('.applyRangeBtn');
    var rangeBtns = root.querySelectorAll('.range-btn');

    var allLevels = [];
    var currentPage = 0;
    var sortAsc = true;
    var filterFrom = 1;
    var filterTo = 200;

    function getFilteredData() {
      var list = allLevels.filter(function(item) {
        return item.level >= filterFrom && item.level <= filterTo;
      });
      if (!sortAsc) {
        list = list.slice().reverse();
      }
      return list;
    }

    function updateStats(filteredList) {
      var total = allLevels.length;
      var filtered = filteredList.length;
      var msg = '共 ' + total + ' 级';
      if (filtered !== total) {
        msg += ' / 当前范围 ' + filtered + ' 级';
      }
      statsCount.textContent = msg;
    }

    function updatePageInfo(filteredList) {
      var totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
      if (currentPage >= totalPages) currentPage = totalPages - 1;
      if (currentPage < 0) currentPage = 0;
      var start = currentPage * PAGE_SIZE + 1;
      var end = Math.min((currentPage + 1) * PAGE_SIZE, filteredList.length);
      pageInfo.textContent = '第 ' + (currentPage + 1) + '/' + totalPages + ' 页（显示 ' + start + '-' + end + '）';
      prevPageBtn.disabled = currentPage <= 0;
      nextPageBtn.disabled = currentPage >= totalPages - 1;
    }

    function render() {
      var filtered = getFilteredData();
      updateStats(filtered);
      updatePageInfo(filtered);
      levelBody.innerHTML = '';

      var start = currentPage * PAGE_SIZE;
      var pageItems = filtered.slice(start, start + PAGE_SIZE);

      pageItems.forEach(function(item) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + item.level + '</td>' +
          '<td>' + formatNumber(item.xpTotal) + '</td>' +
          '<td>' + formatNumber(item.xpToNext) + '</td>';
        levelBody.appendChild(tr);
      });
    }

    function goToPage(page) {
      var filtered = getFilteredData();
      var totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      currentPage = Math.max(0, Math.min(page, totalPages - 1));
      render();
    }

    function applyRange(fromVal, toVal) {
      fromVal = Math.max(1, Math.min(200, parseInt(fromVal, 10) || 1));
      toVal = Math.max(fromVal, Math.min(200, parseInt(toVal, 10) || 200));
      filterFrom = fromVal;
      filterTo = toVal;
      rangeFrom.value = fromVal;
      rangeTo.value = toVal;
      currentPage = 0;
      render();
    }

    function init() {
      fetch('data/experience.json')
        .then(function(r) {
          if (!r.ok) throw new Error('网络错误');
          return r.json();
        })
        .then(function(j) {
          allLevels = (j && j.levels) || [];
          applyRange(1, 200);
        })
        .catch(function(err) {
          console.error('加载经验数据失败:', err);
          statsCount.textContent = '数据加载失败';
        });

      // Pagination
      prevPageBtn.addEventListener('click', function() {
        goToPage(currentPage - 1);
      });
      nextPageBtn.addEventListener('click', function() {
        goToPage(currentPage + 1);
      });

      // Sort toggle
      toggleSortBtn.addEventListener('click', function() {
        sortAsc = !sortAsc;
        toggleSortBtn.textContent = '排序: ' + (sortAsc ? '升序' : '降序');
        currentPage = 0;
        render();
      });

      // Quick range buttons
      rangeBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var from = parseInt(btn.getAttribute('data-from'), 10);
          var to = parseInt(btn.getAttribute('data-to'), 10);
          applyRange(from, to);
        });
      });

      // Custom range
      applyRangeBtn.addEventListener('click', function() {
        applyRange(rangeFrom.value, rangeTo.value);
      });
      rangeFrom.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') applyRange(rangeFrom.value, rangeTo.value);
      });
      rangeTo.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') applyRange(rangeFrom.value, rangeTo.value);
      });

      // --- Calculator ---
      var calcFromLevel = root.querySelector('.calcFromLevel');
      var calcToLevel = root.querySelector('.calcToLevel');
      var calcRangeBtn = root.querySelector('.calcRangeBtn');
      var calcRangeResult = root.querySelector('.calcRangeResult');
      var calcXpInput = root.querySelector('.calcXpInput');
      var calcXpBtn = root.querySelector('.calcXpBtn');
      var calcXpResult = root.querySelector('.calcXpResult');

      function computeRangeXp(from, to) {
        from = Math.max(1, Math.min(200, parseInt(from, 10) || 1));
        to = Math.max(from, Math.min(200, parseInt(to, 10) || 200));
        if (!allLevels.length) return '数据未就绪';
        var total = 0;
        // sum xpToNext from `from` to `to-1`
        for (var i = 0; i < allLevels.length; i++) {
          var lvl = allLevels[i];
          if (lvl.level >= from && lvl.level < to) {
            total += (lvl.xpToNext || 0);
          }
        }
        var fromFormatted = from.toLocaleString('en-US');
        var toFormatted = to.toLocaleString('en-US');
        var totalFormatted = total.toLocaleString('en-US');
        return '从 ' + fromFormatted + ' 级升到 ' + toFormatted + ' 级需要 ' + totalFormatted + ' 经验';
      }

      function computeLevelFromXp(xp) {
        xp = Math.max(0, parseInt(xp, 10) || 0);
        if (!allLevels.length) return '数据未就绪';
        var result = null;
        for (var i = 0; i < allLevels.length; i++) {
          if (allLevels[i].xpTotal <= xp) {
            result = allLevels[i];
          } else {
            break;
          }
        }
        if (!result) return '输入经验过少，无法升到1级';
        var xpFormatted = xp.toLocaleString('en-US');
        var lvl = result.level;
        var remainXp = (result.xpToNext || 0) - (xp - result.xpTotal);
        if (remainXp <= 0) {
          if (lvl >= 200) return xpFormatted + ' 经验已达满级 200 级';
          var nextLevel = lvl + 1;
          return xpFormatted + ' 经验 = ' + lvl + ' 级（可升到 ' + nextLevel + ' 级，经验溢出）';
        }
        var remainFormatted = remainXp.toLocaleString('en-US');
        return xpFormatted + ' 经验 = ' + lvl + ' 级（还需 ' + remainFormatted + ' 经验升至 ' + (lvl + 1) + ' 级）';
      }

      function doCalcRange() {
        calcRangeResult.textContent = computeRangeXp(calcFromLevel.value, calcToLevel.value);
      }

      function doCalcXp() {
        calcXpResult.textContent = computeLevelFromXp(calcXpInput.value);
      }

      calcRangeBtn.addEventListener('click', doCalcRange);
      calcFromLevel.addEventListener('keydown', function(e) { if (e.key === 'Enter') doCalcRange(); });
      calcToLevel.addEventListener('keydown', function(e) { if (e.key === 'Enter') doCalcRange(); });

      calcXpBtn.addEventListener('click', doCalcXp);
      calcXpInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') doCalcXp(); });

      // Auto-calc on data load
      var dataLoadedInterval = setInterval(function() {
        if (allLevels.length > 0) {
          clearInterval(dataLoadedInterval);
          doCalcRange();
          doCalcXp();
        }
      }, 200);
    }

    init();
  }

  window.mountLevelTool = mountLevelTool;

})();
