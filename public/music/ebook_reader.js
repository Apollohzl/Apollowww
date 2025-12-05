// 全局变量
let currentChapterIndex = -1;
let allItemIds = [];
let chapterTitles = {};
let bookId = '';
let totalChapters = 0;
let sidebarVisible = true;

// 读取本地存储中的阅读记录
function getReadingHistory() {
    try {
        const history = localStorage.getItem('ken520RT_RBDL');
        if (history) {
            return JSON.parse(history);
        } else {
            // 如果没有记录，创建空数组
            localStorage.setItem('ken520RT_RBDL', JSON.stringify([]));
            return [];
        }
    } catch (error) {
        console.error('读取阅读历史失败:', error);
        // 如果解析失败，创建新的空数组
        localStorage.setItem('ken520RT_RBDL', JSON.stringify([]));
        return [];
    }
}

// 更新本地存储中的阅读记录
function updateReadingHistory(bookId, chapterIndex) {
    try {
        let history = getReadingHistory();
        const bookIndex = history.findIndex(item => item.id === bookId);
        if (bookIndex !== -1) {
            // 如果书已存在，更新章节索引
            history[bookIndex].last_r_index = chapterIndex;
        } else {
            // 如果书不存在，添加新记录
            history.push({ id: bookId, last_r_index: chapterIndex });
        }
        localStorage.setItem('ken520RT_RBDL', JSON.stringify(history));
    } catch (error) {
        console.error('更新阅读历史失败:', error);
    }
}

// 获取指定书籍的阅读记录
function getBookReadingHistory(bookId) {
    const history = getReadingHistory();
    const bookRecord = history.find(item => item.id === bookId);
    return bookRecord ? bookRecord.last_r_index : 0; // 默认返回0（第一章）
}

// 切换目录显示/隐藏
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const expandBtn = document.getElementById('expandSidebarBtn');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    sidebarVisible = !sidebarVisible;
    if (sidebarVisible) {
        sidebar.classList.remove('collapsed');
        if (expandBtn) {
            expandBtn.style.display = 'none';
        }
        if (toggleBtn) {
            toggleBtn.textContent = '📋 隐藏侧边';
        }
    } else {
        sidebar.classList.add('collapsed');
        if (expandBtn) {
            expandBtn.style.display = 'inline-block';
        }
        if (toggleBtn) {
            toggleBtn.textContent = '📋 显示侧边';
        }
    }
}

// 展开目录
function expandSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const expandBtn = document.getElementById('expandSidebarBtn');
    const toggleBtn = document.getElementById('toggleSidebarBtn');
    
    sidebarVisible = true;
    sidebar.classList.remove('collapsed');
    if (expandBtn) {
        expandBtn.style.display = 'none';
    }
    if (toggleBtn) {
        toggleBtn.textContent = '📋 隐藏侧边';
    }
}

// 设置书本ID到输入框并自动加载
function setBookId(bookId, bookTitle) {
    const bookIdInput = document.getElementById('bookId');
    if (bookIdInput) {
        bookIdInput.value = bookId;
        // 触发输入框的input事件，以便其他可能监听此事件的代码可以执行
        bookIdInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 自动加载书籍
    loadBook();
}

// 监听设置变化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化阅读历史记录
    getReadingHistory();
    
    const fontSizeElement = document.getElementById('fontSize');
    const bgColorElement = document.getElementById('bgColor');
    
    if (fontSizeElement) {
        fontSizeElement.addEventListener('change', applySettings);
    }
    
    if (bgColorElement) {
        bgColorElement.addEventListener('change', applySettings);
    }
    
    // 为快捷书籍按钮添加点击事件
    const quickBookButtons = document.querySelectorAll('.quick-book-btn');
    quickBookButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookId = this.getAttribute('data-id');
            const bookTitle = this.getAttribute('data-title');
            setBookId(bookId, bookTitle);
        });
    });
    
    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyPress);
    
    // 应用初始设置
    applySettings();
});

// 搜索书籍功能
async function searchBooks() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        alert('请输入要搜索的书名');
        return;
    }
    
    try {
        // 显示搜索状态
        searchResults.innerHTML = '<div class="loading">正在搜索...</div>';
        
        // 发起搜索请求
        const response = await fetch(`https://bk.yydjtc.cn/api/search?key=${encodeURIComponent(searchTerm)}`);
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.message || '搜索失败');
        }
        
        // 提取搜索结果
        const searchResult = data.data.search_tabs[0].data[0].book_data;
        displaySearchResults(searchResult, searchResults);
    } catch (error) {
        console.error('搜索失败:', error);
        searchResults.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
    }
}

// 显示搜索结果
function displaySearchResults(books, container) {
    container.innerHTML = '';
    
    if (!books || books.length === 0) {
        container.innerHTML = '<div class="error">未找到相关书籍</div>';
        return;
    }
    
    // 创建搜索结果列表
    const resultsList = document.createElement('div');
    resultsList.className = 'search-results-list';
    
    for (const book of books) {
        const bookItem = document.createElement('div');
        bookItem.className = 'search-result-item';
        bookItem.innerHTML = `
            <div class="search-result-book" style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; transition: background-color 0.2s;">
                <div style="text-align: center; margin: 5px;">
                    <img src="${book.audio_thumb_uri}" alt="${book.book_name}" style="width: calc(100% - 10px); max-width: 100%; height: auto; object-fit: cover; border-radius: 4px; margin: 5px;">
                </div>
                <div style="text-align: left;">
                    <div style="font-weight: bold; margin-bottom: 5px;">${book.book_name}</div>
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">作者: ${book.author}</div>
                    <div style="font-size: 0.85em; color: #888; line-height: 1.3;">${book.abstract}</div>
                </div>
            </div>
        `;
        
        // 添加点击事件，点击后加载书籍
        bookItem.addEventListener('click', function() {
            setBookId(book.book_id, book.book_name);
        });
        
        resultsList.appendChild(bookItem);
    }
    
    container.appendChild(resultsList);
}

// 处理键盘按键事件
function handleKeyPress(event) {
    // 防止在输入框中触发翻页
    if (event.target.tagName === 'INPUT') {
        return;
    }
    
    switch(event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            prevChapter();
            break;
        case 'ArrowRight':
            event.preventDefault();
            nextChapter();
            break;
    }
}

// 根据字体大小和背景色设置样式
function applySettings() {
    const fontSize = document.getElementById('fontSize').value;
    const bgColor = document.getElementById('bgColor').value;
    const contentDiv = document.getElementById('readerContent');
    const chapterTitle = document.querySelector('.chapter-title');
    const chapterContent = document.querySelector('.chapter-content');
    
    if (contentDiv) {
        contentDiv.style.fontSize = fontSize + 'em';
        contentDiv.style.backgroundColor = bgColor;
        
        // 如果是暗黑模式，设置文字颜色为白色
        if (bgColor === '#1e1e1e') {
            contentDiv.style.color = '#ffffff';
            if (chapterTitle) chapterTitle.style.color = '#ffffff';
            if (chapterContent) chapterContent.style.color = '#ffffff';
        } else {
            // 非暗黑模式，使用默认颜色
            contentDiv.style.color = '#333';
            if (chapterTitle) chapterTitle.style.color = '#2c3e50';
            if (chapterContent) chapterContent.style.color = '#333';
        }
    }
}

// 获取书籍章节信息
async function getChapterInfo(bookId) {
    try {
        const response = await fetch(`https://bk.yydjtc.cn/api/book?book_id=${bookId}`);
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.message || '获取书籍信息失败');
        }
        
        const bookData = data.data.data;
        allItemIds = bookData.allItemIds;
        chapterTitles = {};
        
        // 从chapterListWithVolume中提取章节标题
        for (const volume of bookData.chapterListWithVolume) {
            for (const chapter of volume) {
                const itemId = chapter.itemId;
                const title = chapter.title;
                chapterTitles[itemId] = title;
            }
        }
        
        totalChapters = allItemIds.length;
        return { allItemIds, chapterTitles };
    } catch (error) {
        console.error('获取书籍信息失败:', error);
        throw error;
    }
}

// 获取章节内容
async function getChapterContent(itemId) {
    try {
        const response = await fetch(`https://bk.yydjtc.cn/api/content?tab=%E5%B0%8F%E8%AF%B4&item_id=${itemId}`);
        const data = await response.json();
        
        if (data.code !== 200) {
            throw new Error(data.message || '获取章节内容失败');
        }
        
        return data.data.content;
    } catch (error) {
        console.error('获取章节内容失败:', error);
        throw error;
    }
}

// 加载书籍
async function loadBook() {
    const bookIdInput = document.getElementById('bookId').value.trim();
    
    if (!bookIdInput) {
        alert('请输入书本ID');
        return;
    }
    
    bookId = bookIdInput;
    
    try {
        // 显示加载状态
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.textContent = '正在加载书籍信息...';
            loadingMessage.className = 'loading';
        }
        
        // 获取章节信息
        const { allItemIds: ids, chapterTitles: titles } = await getChapterInfo(bookId);
        
        // 加载所有章节
        allItemIds = ids;
        totalChapters = allItemIds.length;
        
        // 生成目录
        generateChapterList();
        
        // 更新页面信息
        updatePageInfo();
        
        // 检查阅读历史，获取上次阅读的章节
        const lastReadIndex = getBookReadingHistory(bookId);
        const startIndex = Math.min(lastReadIndex, allItemIds.length - 1);
        
        // 加载上次阅读的章节或第一章
        if (allItemIds.length > 0) {
            currentChapterIndex = startIndex;
            await loadChapter(currentChapterIndex);
        }
        
    } catch (error) {
        console.error('加载书籍失败:', error);
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.innerHTML = `<div class="error">加载书籍失败: ${error.message}</div>`;
        }
    }
}

// 生成目录列表
function generateChapterList() {
    const chapterList = document.getElementById('chapterList');
    if (!chapterList) return;
    
    chapterList.innerHTML = '';
    
    for (let i = 0; i < allItemIds.length; i++) {
        const itemId = allItemIds[i];
        const title = chapterTitles[itemId] || `第${i + 1}章`;
        
        const chapterItem = document.createElement('div');
        chapterItem.className = 'chapter-item';
        chapterItem.textContent = title;
        chapterItem.onclick = () => loadChapter(i);
        chapterList.appendChild(chapterItem);
    }
}

// 加载指定章节
async function loadChapter(index) {
    if (index < 0 || index >= allItemIds.length) {
        return;
    }
    
    try {
        const loadingMessage = document.getElementById('loadingMessage');
        if (loadingMessage) {
            loadingMessage.textContent = '正在加载章节内容...';
            loadingMessage.className = 'loading';
        }
        
        const itemId = allItemIds[index];
        const content = await getChapterContent(itemId);
        
        // 更新当前章节索引
        currentChapterIndex = index;
        
        // 更新阅读历史
        if (bookId) {
            updateReadingHistory(bookId, index);
        }
        
        // 显示章节内容
        const readerContent = document.getElementById('readerContent');
        if (readerContent) {
            readerContent.innerHTML = `
                <div class="chapter-title">${chapterTitles[itemId] || `第${index + 1}章`}</div>
                <div class="chapter-content">${formatContent(content)}</div>
            `;
            
            // 使用setTimeout确保DOM更新后再滚动
            setTimeout(() => {
                readerContent.scrollTop = 0;
                // 同时也滚动窗口到顶部
                window.scrollTo(0, 0);
            }, 0);
        }
        
        // 更新章节列表中的激活项
        const chapterItems = document.querySelectorAll('.chapter-item');
        chapterItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // 更新导航按钮状态
        updateNavigationButtons();
        
        // 更新页面信息
        updatePageInfo();
        
        // 应用设置
        applySettings();
        
    } catch (error) {
        console.error('加载章节失败:', error);
        const readerContent = document.getElementById('readerContent');
        if (readerContent) {
            readerContent.innerHTML = `<div class="error">加载章节失败: ${error.message}</div>`;
        }
    }
}

// 格式化内容（处理换行等）
function formatContent(content) {
    // 将换行符转换为HTML的<br>标签
    return content.replace(/\n/g, '<br>');
}

// 更新导航按钮状态
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.disabled = currentChapterIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentChapterIndex >= allItemIds.length - 1;
}

// 更新页面信息
function updatePageInfo() {
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo && totalChapters > 0) {
        pageInfo.textContent = `第 ${currentChapterIndex + 1} 章，共 ${totalChapters} 章`;
    }
}

// 上一章
async function prevChapter() {
    if (currentChapterIndex > 0) {
        await loadChapter(currentChapterIndex - 1);
    }
}

// 下一章
async function nextChapter() {
    if (currentChapterIndex < allItemIds.length - 1) {
        await loadChapter(currentChapterIndex + 1);
    }
}

// 监听设置变化
document.addEventListener('DOMContentLoaded', function() {
    const fontSizeElement = document.getElementById('fontSize');
    const bgColorElement = document.getElementById('bgColor');
    
    if (fontSizeElement) {
        fontSizeElement.addEventListener('change', applySettings);
    }
    
    if (bgColorElement) {
        bgColorElement.addEventListener('change', applySettings);
    }
    
    // 应用初始设置
    applySettings();
});