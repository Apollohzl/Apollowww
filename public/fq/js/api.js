/* =============================================================
 * Fanqie Novel API - 正式封装
 * 文档参考本地 API.txt
 * ============================================================= */

(function (global) {
  'use strict';

  // ============== 配置 ==============
  const API_BASE = 'http://101.35.133.34:5000/api';
  const PROXY_BASE = 'https://hzliflow.ken520.top/api/cors?url=';

  // tab_type 枚举（用于 search）
  const TAB_TYPE = {
    小说: 3,
    听书: 2,
    漫画: 8,
    短剧: 11,
    综合: 1,
    社区: 4
  };

  // ============== 代理 URL 编码 ==============
  /**
   * 将 '?k1=v1&k2=v2&k3=v3' 编码为 '?k1=v1%26k2%3Dv2%26k3%3Dv3'
   * - 首个 ? 保留
   * - 首个 = 保留
   * - 其余 & -> %26, = -> %3D
   */
  function encodeQueryForProxy(query) {
    if (!query) return '';
    var firstEq = query.indexOf('=');
    if (firstEq === -1) return query;
    var head = query.slice(0, firstEq + 1); // "k1="
    var rest = query.slice(firstEq + 1);    // "v1&k2=v2&k3=v3"
    // 先把 %XX 暂时替换为不可见占位符，防止重编码
    var placeholders = {};
    var idx = 0;
    var v = rest.replace(/%[0-9A-Fa-f]{2}/g, function (m) {
      var ph = '\x00PH' + idx + '\x00';
      placeholders[ph] = m;
      idx++;
      return ph;
    });
    // 现在 v 里没有 % 编码了，替换 & 和 =
    v = v.replace(/&/g, '%26').replace(/=/g, '%3D');
    // 还原占位符
    for (var p in placeholders) {
      v = v.split(p).join(placeholders[p]);
    }
    return head + v;
  }

  // ============== 请求核心 ==============
  /**
   * 构造一个请求 URL（自动走代理）
   * @param {string} path   例如 '/search', '/detail', '/book', '/content'
   * @param {object} params 形如 { key: '修仙', tab_type: 3 } 或 { book_id: 'xxx' }
   */
  function buildUrl(path, params) {
    const pairs = [];
    if (params) {
      for (const k of Object.keys(params)) {
        const v = params[k];
        if (v === undefined || v === null || v === '') continue;
        pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(v)));
      }
    }
    const query = pairs.join('&');
    const raw = API_BASE + path + (query ? '?' + query : '');

    // 直接在 HTTPS 站点中，HTTP 会被拦截，所以走代理
    // 代理期望的是把目标 URL 作为 url 参数传入
    const proxyTarget = API_BASE + path + (query ? '?' + encodeQueryForProxy(query) : '');
    return PROXY_BASE + proxyTarget;
  }

  function request(path, params) {
    const url = buildUrl(path, params);
    return fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (text) {
      try { return JSON.parse(text); } catch (e) {
        // 某些接口可能返回原始文本
        return { code: 200, data: text, message: 'raw' };
      }
    });
  }

  // ============== 业务接口 ==============

  /**
   * 搜索
   * @param {string} keyword         搜索关键词
   * @param {string|number} tabType  3=小说 2=听书 8=漫画 11=短剧
   * @param {number} offset          偏移量，默认 0
   */
  function search(keyword, tabType, offset) {
    const tt = (typeof tabType === 'string') ? (TAB_TYPE[tabType] || tabType) : (tabType || 3);
    return request('/search', { key: keyword, tab_type: tt, offset: offset || 0 });
  }

  /**
   * 书籍详情（元数据 + 内容预览）
   * @param {string} bookId
   */
  function getDetail(bookId) {
    return request('/detail', { book_id: bookId });
  }

  /**
   * 获取书籍的章节目录（完整，含 chapterListWithVolume 和 allItemIds）
   * @param {string} bookId
   */
  function getBook(bookId) {
    return request('/book', { book_id: bookId });
  }

  /**
   * 获取某一章正文
   * @param {string} itemId
   */
  function getChapterContent(itemId) {
    return request('/content', { tab: '小说', item_id: itemId });
  }

  /**
   * 获取某一章的音频
   * @param {string} itemId
   * @param {string} [toneId]  音色ID
   */
  function getChapterAudio(itemId, toneId) {
    const params = { tab: '听书', item_id: itemId };
    if (toneId) params.tone_id = toneId;
    return request('/content', params);
  }

  /**
   * 获取漫画章节
   * @param {string} itemId
   * @param {string} [showHtml]  '0' 或 '1'
   */
  function getComic(itemId, showHtml) {
    const params = { tab: '漫画', item_id: itemId };
    if (showHtml) params.show_html = showHtml;
    return request('/content', params);
  }

  /**
   * 获取短剧视频
   * @param {string} itemId
   */
  function getDrama(itemId) {
    return request('/content', { tab: '短剧', item_id: itemId });
  }

  /**
   * 批量获取章节内容
   * @param {string[]} itemIds
   * @param {string} bookId
   */
  function getChaptersBatch(itemIds, bookId) {
    return request('/content', {
      tab: '批量',
      item_ids: itemIds.join(','),
      book_id: bookId
    });
  }

  /**
   * 获取评论
   * @param {string} itemId  可以是 book_id
   */
  function getComments(itemId) {
    return request('/comment', { item_id: itemId });
  }

  /**
   * 获取推荐首页（用内容接口拿通用推荐）
   * @param {string} tab  小说 / 听书 / 漫画 / 短剧
   */
  function getRecommend(tab) {
    return request('/content', { tab: tab });
  }

  // ============== 工具 ==============
  /**
   * 从搜索响应中提取 book_data 数组
   */
  function extractBooksFromSearch(resp) {
    const tabs = (resp && resp.data && resp.data.search_tabs) || [];
    // 找到一个有 data 的 tab（tab_type=3 小说优先）
    const tab = tabs.find(function (t) { return t.tab_type === 3 && t.data && t.data.length; })
              || tabs.find(function (t) { return t.data && t.data.length; })
              || tabs[0];
    if (!tab || !tab.data || !tab.data.length) return [];
    const books = [];
    for (const item of tab.data) {
      if (item.book_data && item.book_data.length) {
        for (const b of item.book_data) books.push(b);
      } else if (item.book_name) {
        books.push(item);
      }
    }
    return books;
  }

  /**
   * 从 getBook 响应中提取章节扁平化列表
   * @returns {{itemId:string,title:string,volume_name:string,realChapterOrder:string,needPay:number,isChapterLock:boolean}[]}
   */
  function extractChapterList(resp) {
    // resp.data.data.chapters = [{ title: "...", data: [chapterItem, ...] }]
    // 或者 resp.data.data.chapterListWithVolume = [[chapterItem, ...], ...]
    var raw;
    try { raw = resp.data.data; } catch (e) { raw = resp.data || resp; }

    // 格式A: chapters [{ title, data }]
    if (raw.chapters && Array.isArray(raw.chapters)) {
      var flat = [];
      for (var i = 0; i < raw.chapters.length; i++) {
        var grp = raw.chapters[i];
        if (grp.data && Array.isArray(grp.data)) {
          for (var j = 0; j < grp.data.length; j++) {
            flat.push(grp.data[j]);
          }
        }
      }
      return flat;
    }

    // 格式B: chapterListWithVolume [[item,...], [item,...]]
    if (raw.chapterListWithVolume && Array.isArray(raw.chapterListWithVolume)) {
      var flat2 = [];
      for (var a = 0; a < raw.chapterListWithVolume.length; a++) {
        var vol = raw.chapterListWithVolume[a];
        if (Array.isArray(vol)) {
          for (var b = 0; b < vol.length; b++) {
            flat2.push(vol[b]);
          }
        }
      }
      return flat2;
    }

    // 直接是数组
    if (Array.isArray(raw)) return raw;

    return [];
  }

  global.FqApi = {
    search: search,
    getDetail: getDetail,
    getBook: getBook,
    getChapterContent: getChapterContent,
    getChapterAudio: getChapterAudio,
    getComic: getComic,
    getDrama: getDrama,
    getChaptersBatch: getChaptersBatch,
    getComments: getComments,
    getRecommend: getRecommend,
    extractBooksFromSearch: extractBooksFromSearch,
    extractChapterList: extractChapterList,
    TAB_TYPE: TAB_TYPE
  };
})(window);
