/**
 * Wiki 工具函数模块
 * 提供基础工具函数和数据缓存
 */

(function() {
  'use strict';

  // 数据文件路径
  var PATH_ITEMS = 'data/items.json';
  var PATH_ACTIONS = 'data/actions.json';
  var PATH_CONSUME_TABLES = 'data/consumeTables.json';
  var PATH_REWARD_TABLES = 'data/rewardTables.json';
  var PATH_PROFESSION_CONFIG = 'data/professionconfig.json';
  var PATH_JOBS = 'data/jobs.json';
  var PATH_SKILLS = 'data/skills.json';

  var fetchCache = {
    items: null,
    actions: null,
    consumeTables: null,
    rewardTables: null,
    professionConfig: null,
    jobs: null
  };

  /**
   * HTML 转义函数
   * @param {string} s - 需要转义的字符串
   * @returns {string} 转义后的字符串
   */
  function escapeHTML(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * 获取数据集（带缓存）
   * @param {string} name - 数据集名称 ('items' 或 'actions')
   * @returns {Promise<Array>} 数据数组
   */
  function fetchDataset(name) {
    var pathMap = {
      items: PATH_ITEMS,
      actions: PATH_ACTIONS,
      consumeTables: PATH_CONSUME_TABLES,
      rewardTables: PATH_REWARD_TABLES,
      professionConfig: PATH_PROFESSION_CONFIG,
      jobs: PATH_JOBS,
      skills: PATH_SKILLS
    };
    var path = pathMap[name];
    if (!path) return Promise.resolve([]);
    if (fetchCache[name]) return Promise.resolve(fetchCache[name]);
    return fetch(path)
      .then(function(r) {
        if (!r.ok) throw new Error('网络错误');
        return r.json();
      })
      .then(function(j) {
        fetchCache[name] = j;
        return j;
      })
      .catch(function() {
        return [];
      });
  }

  /**
   * 解析 JSON 或 NDJSON 格式
   * 支持 JSON 数组、单对象、NDJSON（逐行 JSON）
   * @param {string} text - 输入文本
   * @returns {Array} 解析后的数组
   */
  function parseJsonOrNdjson(text) {
    if (!text || typeof text !== 'string') throw new Error('输入为空');
    
    // 移除 BOM
    text = text.replace(/^\uFEFF/, '');
    
    // 如果被 markdown code fence 包裹，提取内部内容
    var fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch && fenceMatch[1]) text = fenceMatch[1];
    text = text.trim();
    if (text === '') throw new Error('输入为空');

    // 如果存在前导的说明文字，找到第一个 JSON 起始字符
    var firstJsonPos = text.search(/[{\[]/);
    if (firstJsonPos >= 0) text = text.slice(firstJsonPos).trim();
    else throw new Error('未检测到 JSON 起始符号 { 或 [');

    // 先尝试整体 JSON.parse
    try {
      var parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (e) {
      // 整体解析失败，尝试按行 NDJSON 解析
    }

    // NDJSON 逐行解析
    var lines = text.split(/\r?\n/);
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line === '' || /^```/.test(line)) continue;
      
      var pos = line.search(/[{\[]/);
      if (pos >= 0) line = line.slice(pos);
      else continue;
      
      try {
        var v = JSON.parse(line);
        out.push(v);
      } catch (err) {
        throw new Error('NDJSON 解析失败：第 ' + (i + 1) + ' 行 JSON 格式有误: ' + err.message);
      }
    }
    
    if (out.length === 0) throw new Error('无可解析内容');
    return out;
  }

  /**
   * 加载字段映射配置
   */
  window.fieldMapping = null;
  fetch('data/fieldMapping.json', { cache: 'no-cache' })
    .then(function(r) {
      if (!r.ok) return {};
      return r.json();
    })
    .then(function(j) {
      window.fieldMapping = j || null;
    })
    .catch(function() {
      window.fieldMapping = null;
    });

  // 暴露到全局
  window.escapeHTML = escapeHTML;
  window.fetchDataset = fetchDataset;
  window.fetchCache = fetchCache;
  window.parseJsonOrNdjson = parseJsonOrNdjson;

})();
