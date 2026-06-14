/* 共享工具 */
(function (global) {
  'use strict';

  function getQuery(key, def) {
    // 直接用正则解析 query string，兼容 file:// 和 http:// 协议
    var qs = location.search;
    if (!qs || qs === '?') {
      // fallback：尝试从完整 href 提取
      qs = location.href.split('?')[1] || '';
    }
    var re = new RegExp('(?:^|&)' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=(.*?)(?:&|$)');
    var m = qs.match(re);
    var v = (m && m[1] ? decodeURIComponent(m[1]) : null);
    return (v === null || v === '') ? (def === undefined ? '' : def) : v;
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatNumber(n) {
    n = Number(n);
    if (!isFinite(n)) return '0';
    if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
    if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function buildReaderUrl(book, itemId) {
    const q = [];
    const bookId = book.book_id || book.id || '';
    if (bookId) q.push('book_id=' + encodeURIComponent(bookId));
    const iid = itemId || book.item_id || book.first_chapter_item_id || book.first_chapter_item_id || '';
    if (iid) q.push('item_id=' + encodeURIComponent(iid));
    if (book.book_name) q.push('title=' + encodeURIComponent(book.book_name));
    return 'reader.html?' + q.join('&');
  }

  function buildDirUrl(book) {
    const id = book.book_id || book.id || getQuery('book_id') || '';
    const q = [];
    if (id) q.push('book_id=' + encodeURIComponent(id));
    if (book.book_name) q.push('title=' + encodeURIComponent(book.book_name));
    return 'directory.html?' + q.join('&');
  }

  function buildAudioUrl(book, itemId) {
    const q = [];
    // 优先从 book 对象取，否则从当前 URL 参数兜底
    const bookId = book.book_id || book.id || getQuery('book_id') || '';
    if (bookId) q.push('book_id=' + encodeURIComponent(bookId));
    const iid = itemId || book.item_id || book.first_chapter_item_id || getQuery('item_id') || '';
    if (iid) q.push('item_id=' + encodeURIComponent(iid));
    if (book.book_name) q.push('title=' + encodeURIComponent(book.book_name));
    return 'audio.html?' + q.join('&');
  }

  function buildCommentUrl(book) {
    const id = book.book_id || book.item_id || book.id || '';
    const q = [];
    if (id) q.push('book_id=' + encodeURIComponent(id));
    if (book.book_name) q.push('title=' + encodeURIComponent(book.book_name));
    return 'comment.html?' + q.join('&');
  }

  function buildComicUrl(book, itemId) {
    const q = [];
    const bookId = book.book_id || book.id || getQuery('book_id') || '';
    if (bookId) q.push('book_id=' + encodeURIComponent(bookId));
    const iid = itemId || book.item_id || book.first_chapter_item_id || getQuery('item_id') || '';
    if (iid) q.push('item_id=' + encodeURIComponent(iid));
    if (book.book_name) q.push('title=' + encodeURIComponent(book.book_name));
    return 'comic.html?' + q.join('&');
  }

  function buildDramaUrl(book, itemId) {
    const q = [];
    // 短剧：book_id = series_id，同时也作为 item_id 传给 content 接口
    const bookId = book.book_id || book.series_id || book.id || getQuery('book_id') || '';
    const iid = itemId || book.item_id || book.vid || book.first_vid || bookId || getQuery('item_id') || '';
    if (bookId) q.push('book_id=' + encodeURIComponent(bookId));
    if (iid) q.push('item_id=' + encodeURIComponent(iid));
    const name = book.book_name || book.title || book.name || '';
    if (name) q.push('title=' + encodeURIComponent(name));
    return 'drama.html?' + q.join('&');
  }

  /**
   * 渲染单个书籍卡片
   */
  function renderBookCard(book) {
    const title = book.book_name || book.name || book.title || '未知';
    const author = book.author || '';
    const category = book.category || book.pure_category_tags || '';
    const score = book.score || book.rating || '';
    const cover = book.thumb_url || book.cover_url || book.audio_thumb_uri || book.audio_thumb_url_hd || book.book_cover_url || '';
    const readCount = book.read_cnt_text || book.read_count || '';

    // 根据 tab_type 路由到不同页面
    // _tab_type: 3=小说 2=听书 8=漫画 11=短剧
    let url;
    const tt = Number(book._tab_type);
    if (tt === 11) {
      url = buildDramaUrl(book, book.item_id);
    } else if (tt === 8) {
      url = buildComicUrl(book, book.item_id);
    } else if (tt === 2) {
      url = buildAudioUrl(book, book.item_id);
    } else {
      url = buildDirUrl(book); // 小说 → 目录页
    }

    let coverHtml;
    if (cover) {
      coverHtml =
        '<div class="book-cover">' +
          '<img src="' + escapeHtml(cover) + '" alt="" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'grid\';">' +
          '<div class="book-cover-placeholder" style="display:none;">' + escapeHtml(title.slice(0, 4)) + '</div>' +
        '</div>';
    } else {
      coverHtml = '<div class="book-cover"><div class="book-cover-placeholder">' + escapeHtml(title.slice(0, 4)) + '</div></div>';
    }

    const metaHtml =
      '<div class="book-meta">' +
        '<div class="book-title">' + escapeHtml(title) + '</div>' +
        '<div class="book-sub">' +
          (author ? escapeHtml(author) : '') +
          (author && category ? ' · ' : '') +
          (category ? escapeHtml(String(category).split(',')[0]) : '') +
          (score ? ' <span class="book-score" style="margin-left:auto;">★ ' + escapeHtml(score) + '</span>' : '') +
        '</div>' +
      '</div>';

    return '<a class="book-card" href="' + url + '">' + coverHtml + metaHtml + '</a>';
  }

  function renderBookCards(books) {
    if (!books || !books.length) {
      return '<div class="empty-state"><div class="icon">📭</div><p>暂无数据</p></div>';
    }
    return books.map(renderBookCard).join('');
  }

  function showLoading(el, msg) {
    el.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>' + escapeHtml(msg || '加载中…') + '</span></div>';
  }

  function showError(el, msg) {
    el.innerHTML = '<div class="error-box">⚠ ' + escapeHtml(msg || '加载失败，请稍后重试') + '</div>';
  }

  function showEmpty(el, msg) {
    el.innerHTML = '<div class="empty-state"><div class="icon">📭</div><p>' + escapeHtml(msg || '暂无数据') + '</p></div>';
  }

  // 设置页面标题
  function setTitle(text) {
    document.title = text + ' · 番茄书阁';
    const h1 = document.querySelector('h1.page-title');
    if (h1) h1.textContent = text;
  }

  global.Fq = {
    getQuery: getQuery,
    escapeHtml: escapeHtml,
    formatNumber: formatNumber,
    renderBookCard: renderBookCard,
    renderBookCards: renderBookCards,
    showLoading: showLoading,
    showError: showError,
    showEmpty: showEmpty,
    setTitle: setTitle,
    buildDirUrl: buildDirUrl,
    buildReaderUrl: buildReaderUrl,
    buildAudioUrl: buildAudioUrl,
    buildCommentUrl: buildCommentUrl,
    buildComicUrl: buildComicUrl,
    buildDramaUrl: buildDramaUrl
  };
})(window);
