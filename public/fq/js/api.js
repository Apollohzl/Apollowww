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
   * 获取书籍的简化目录信息（章节ID + 标题）
   * @param {string} fqId  书籍ID（book_id / series_id）
   */
  function getDirectory(fqId) {
    return request('/directory', { fq_id: fqId });
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
   * 从搜索响应中提取书籍/内容数组。
   *
   * 不同 tab_type 的数据结构不同：
   * - tab_type=3(小说) / tab_type=2(听书):
   *     data[].book_data[] — 每一项就是一个独立的书籍
   * - tab_type=11(短剧):
   *     data[].video_data[0] — 真实内容在 video_data 数组的第一个元素
   * - tab_type=8(漫画):
   *     search 接口返回 data=null，漫画数据通过 /content?tab=漫画 获取
   */
  function extractBooksFromSearch(resp, matchTabTypes) {
    var tabs = (resp && resp.data && resp.data.search_tabs) || [];
    if (!tabs.length) return [];

    // 如果指定了要过滤的 tab_type
    var filtered = tabs;
    if (matchTabTypes !== undefined && matchTabTypes !== null) {
      var m = Array.isArray(matchTabTypes) ? matchTabTypes : [Number(matchTabTypes)];
      filtered = tabs.filter(function (t) {
        return t && t.tab_type !== undefined && m.indexOf(Number(t.tab_type)) !== -1;
      });
    }
    // 去掉没有 data 的 tab
    filtered = filtered.filter(function (t) {
      return t && Array.isArray(t.data) && t.data.length > 0;
    });
    if (!filtered.length) {
      // 兜底：如果指定 tab 没数据，退回到所有有数据的 tab
      filtered = tabs.filter(function (t) {
        return t && Array.isArray(t.data) && t.data.length > 0;
      });
    }

    var result = [];
    for (var ti = 0; ti < filtered.length; ti++) {
      var tab = filtered[ti];
      var tabType = Number(tab.tab_type);

      for (var ii = 0; ii < tab.data.length; ii++) {
        var item = tab.data[ii];
        if (!item) continue;

        // ====== 小说 / 听书：扁平化 book_data ======
        if (item.book_data && Array.isArray(item.book_data) && item.book_data.length) {
          for (var bi = 0; bi < item.book_data.length; bi++) {
            var sub = item.book_data[bi];
            if (sub) {
              var bookItem = normalizeSearchItem(sub, tabType);
              // 继承外层的 book_id / search_result_id（若内部没有）
              if (bookItem && !bookItem.book_id) {
                bookItem.book_id = item.book_id || item.search_result_id || bookItem.book_id;
              }
              if (bookItem) result.push(bookItem);
            }
          }
          continue;
        }

        // ====== 短剧：从 video_data[0] 取主要字段 ======
        if (item.video_data && Array.isArray(item.video_data) && item.video_data.length) {
          var v = item.video_data[0];
          var dramaItem = normalizeSearchItem(v, tabType);
          // 用 item 顶层的 id 补充
          if (dramaItem) {
            dramaItem.book_id = item.book_id || item.search_result_id || item.series_id || dramaItem.book_id;
            // 短剧专属字段
            if (v.vid) dramaItem.vid = v.vid;
            if (v.episode_cnt) dramaItem.episode_cnt = v.episode_cnt;
            result.push(dramaItem);
          }
          continue;
        }

        // ====== 其它：直接用 item ======
        var n = normalizeSearchItem(item, tabType);
        if (n && n.book_name) result.push(n);
      }
    }
    return result;
  }

  /**
   * 把各种来源的 item 统一成标准字段：
   *   book_name / book_id / author / category / cover (=thumb_url)
   *   score / read_cnt_text / serial_count / sub_title
   */
  function normalizeSearchItem(item, tabType) {
    if (!item) return null;

    var out = {
      _tab_type: tabType,
      _raw: item
    };

    // ===== 基础 ID =====
    out.book_id = item.book_id || item.series_id || item.search_result_id ||
                  item.item_id || item.chapter_id || '';

    // ===== 标题：优先 book_name，其次 title / raw_book_name / series_title =====
    out.book_name = item.book_name || item.series_title || item.title || item.raw_book_name || item.name || '';

    // ===== 作者/主讲人/演员 =====
    var author = '';
    if (item.author) author = item.author;
    else if (item.speaker) author = item.speaker;
    else if (item.video_detail && item.video_detail.role) author = item.video_detail.role;
    out.author = author;

    // ===== 分类/标签 =====
    var category = '';
    if (item.category) category = item.category;
    else if (item.pure_category_tags) category = item.pure_category_tags;
    else if (item.sub_title) category = item.sub_title;
    else if (item.sub_title_list && item.sub_title_list.length) {
      category = item.sub_title_list.map(function (s) { return (s && s.content) || ''; }).join(' ');
    }
    else if (item.tag_info && item.tag_info.text) category = item.tag_info.text;
    else if (item.type_name) category = item.type_name;
    out.category = category;

    // ===== 副标题（短剧用）=====
    out.sub_title = item.sub_title || '';

    // ===== 评分 =====
    out.score = item.score || item.rating || '';

    // ===== 封面 =====
    var cover = '';
    if (item.cover) cover = item.cover;
    else if (item.thumb_url) cover = item.thumb_url;
    else if (item.thumb_uri) cover = item.thumb_uri;
    else if (item.cover_url) cover = item.cover_url;
    else if (item.audio_thumb_uri) cover = item.audio_thumb_uri;
    else if (item.audio_thumb_url_hd) cover = item.audio_thumb_url_hd;
    else if (item.book_cover_url) cover = item.book_cover_url;
    else if (item.series_cover) cover = item.series_cover;
    if (cover) cover = String(cover).replace(/^`|`$/g, '').trim();
    out.cover = cover;
    out.thumb_url = cover;

    // ===== 阅读量/播放量/热度 =====
    var cnt = '';
    if (item.read_cnt_text) cnt = item.read_cnt_text;
    else if (item.play_cnt !== undefined && item.play_cnt !== null) {
      cnt = formatCount(item.play_cnt) + '次播放';
    }
    else if (item.series_play_cnt !== undefined && item.series_play_cnt !== null) {
      cnt = formatCount(item.series_play_cnt) + '次播放';
    }
    else if (item.rec_text) cnt = item.rec_text;
    out.read_cnt_text = cnt;

    // ===== 集数/章数 =====
    var episode = '';
    if (item.serial_count) episode = item.serial_count;
    else if (item.episode_cnt) episode = '全' + item.episode_cnt + '集';
    else if (item.chapter_number) episode = item.chapter_number;
    else if (item.sub_title_list && item.sub_title_list.length) {
      for (var i = 0; i < item.sub_title_list.length; i++) {
        var s = item.sub_title_list[i];
        if (s && s.content && /集/.test(s.content)) {
          episode = s.content; break;
        }
      }
    }
    out.serial_count = episode;

    return out;
  }

  /**
   * 从搜索响应中提取某一短剧（series_id / book_id 匹配）的完整详情
   * - 短剧：video_data[0] 为主内容，video_data[0].video_detail 含简介/演员/首集ID等
   * @returns {{title, cover, score, play_cnt, rec_text, sub_title, episode_cnt,
   *            series_id, vid, first_vid, series_intro, role, followed_cnt,
   *            copyright, record_number, color_dominate, sub_title_list}|null}
   */
  function extractDramaDetailBySeriesId(resp, seriesId) {
    var tabs = (resp && resp.data && resp.data.search_tabs) || [];
    var targetId = String(seriesId);

    for (var ti = 0; ti < tabs.length; ti++) {
      var tab = tabs[ti];
      if (!tab || !Array.isArray(tab.data)) continue;
      // 优先在短剧 tab 内查找
      if (Number(tab.tab_type) !== 11 && Number(tab.tab_type) !== 1) continue;

      for (var ii = 0; ii < tab.data.length; ii++) {
        var item = tab.data[ii];
        if (!item) continue;
        // series_id 可能在 item 顶层 或 item.video_data[0].series_id
        var itemSeriesId = item.book_id || item.search_result_id ||
          (item.video_data && item.video_data[0] && item.video_data[0].series_id) || '';
        if (String(itemSeriesId) !== targetId) continue;

        var v = item.video_data && item.video_data[0] ? item.video_data[0] : null;
        if (!v) continue;
        var vd = v.video_detail || {};

        var cover = v.cover || vd.series_cover || '';
        if (cover) cover = String(cover).replace(/^`|`$/g, '').trim();

        var title = v.title || vd.series_title || v.raw_book_name || '';
        var subTitle = v.sub_title || '';
        var categoryList = [];
        if (v.sub_title_list && v.sub_title_list.length) {
          for (var ci = 0; ci < v.sub_title_list.length; ci++) {
            if (v.sub_title_list[ci] && v.sub_title_list[ci].content) {
              categoryList.push(v.sub_title_list[ci].content);
            }
          }
        }

        var playCntStr = '';
        if (v.play_cnt !== undefined && v.play_cnt !== null) {
          playCntStr = formatCount(v.play_cnt);
        } else if (vd.series_play_cnt !== undefined && vd.series_play_cnt !== null) {
          playCntStr = formatCount(vd.series_play_cnt);
        }

        var rec = v.rec_text || '';
        var score = v.score || '';
        var episodeCnt = v.episode_cnt || vd.episode_cnt || 0;
        var vid = v.vid || '';
        var firstVid = vd.first_vid || vid;
        var seriesIntro = vd.series_intro || '';
        var role = vd.role || '';
        var followedCnt = vd.followed_cnt || 0;
        var copyright = v.copyright || '';
        var colorDom = v.color_dominate || vd.series_color_hex || '';
        var seriesId = v.series_id || vd.series_id_str || item.book_id || targetId;

        var recordNumber = '';
        if (vd.record_info && vd.record_info.record_number) {
          recordNumber = vd.record_info.record_number;
        }

        return {
          title: title,
          cover: cover,
          score: score,
          play_cnt_raw: v.play_cnt || vd.series_play_cnt || 0,
          play_cnt_text: playCntStr,
          rec_text: rec,
          sub_title: subTitle,
          sub_title_list: categoryList,
          episode_cnt: episodeCnt,
          series_id: seriesId,
          vid: vid,
          first_vid: firstVid,
          series_intro: seriesIntro,
          role: role,
          followed_cnt: followedCnt,
          copyright: copyright,
          record_number: recordNumber,
          color_dominate: colorDom
        };
      }
    }
    return null;
  }

  /**
   * 从短剧内容响应中递归查找视频 URL
   * - 期望的视频字段可能在 resp.data.video_url / resp.data.video /
   *   resp.data.data.video_url 等
   * - 也可能以字符串形式直接返回整个响应体（内容接口返回格式较为灵活）
   */
  function extractVideoUrl(resp) {
    // 1) 直接命中：优先查最常见的路径，避免递归走入死路
    if (resp) {
      // resp.data.video_url（短剧接口的标准路径）
      var d = resp.data;
      if (d) {
        if (typeof d.video_url === 'string' && d.video_url) {
          return String(d.video_url).replace(/^`|`$/g, '').trim();
        }
        // resp.data 直接就是 URL 字符串
        if (typeof d === 'string' && /^https?:\/\/.+\.(mp4|m3u8|flv|webm)/i.test(d)) {
          return d.trim();
        }
        // resp.data.url
        if (typeof d.url === 'string' && /^https?:\/\/.+\.(mp4|m3u8|flv|webm)/i.test(d.url)) {
          return d.url;
        }
      }
      // resp 直接就是 URL 字符串
      if (typeof resp === 'string' && /^https?:\/\/.+\.(mp4|m3u8|flv|webm)/i.test(resp)) {
        return resp.trim();
      }
    }

    // 2) 兜底：递归搜索更深层级（防死循环的 Set）
    var visited = new Set();
    function dive(obj) {
      if (!obj || typeof obj !== 'object') return '';
      var type = Object.prototype.toString.call(obj);
      if (visited.has(obj) || type === '[object Function]') return '';
      visited.add(obj);

      var keys = ['video_url', 'src', 'play_url', 'url', 'mp4', 'videoUrl', 'playUrl',
                  'media_url', 'file_url', 'source_url', 'video_url_hd', 'video_url_sd', 'm3u8_url'];
      for (var i = 0; i < keys.length; i++) {
        var v = obj[keys[i]];
        if (typeof v === 'string' && /^https?:\/\/.+\.(mp4|m3u8|flv|webm|mov)(\?|$)/i.test(v)) {
          return v;
        }
      }
      for (var k in obj) {
        var val = obj[k];
        if (val && typeof val === 'object') {
          var r = dive(val);
          if (r) return r;
        }
      }
      return '';
    }
    return dive(resp);
  }

  function formatCount(n) {
    n = Number(n);
    if (!isFinite(n)) return String(n || 0);
    if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
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
    getDirectory: getDirectory,
    getChaptersBatch: getChaptersBatch,
    getComments: getComments,
    getRecommend: getRecommend,
    extractBooksFromSearch: extractBooksFromSearch,
    extractChapterList: extractChapterList,
    extractDramaDetailBySeriesId: extractDramaDetailBySeriesId,
    extractVideoUrl: extractVideoUrl,
    TAB_TYPE: TAB_TYPE
  };
})(window);
