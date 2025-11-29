// 全局变量
let currentChapterIndex = -1;
let allItemIds = [];
let chapterTitles = {};
let bookId = '';
let totalChapters = 0;
let sidebarVisible = true;

// 切换目录显示/隐藏
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const expandBtn = document.getElementById('expandSidebarBtn');
    
    sidebarVisible = !sidebarVisible;
    if (sidebarVisible) {
        sidebar.classList.remove('collapsed');
        if (expandBtn) {
            expandBtn.style.display = 'none';
        }
    } else {
        sidebar.classList.add('collapsed');
        if (expandBtn) {
            expandBtn.style.display = 'inline-block';
        }
    }
}

// 展开目录
function expandSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const expandBtn = document.getElementById('expandSidebarBtn');
    
    sidebarVisible = true;
    sidebar.classList.remove('collapsed');
    if (expandBtn) {
        expandBtn.style.display = 'none';
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
    
    // 应用初始设置
    applySettings();
});

// 根据字体大小和背景色设置样式
function applySettings() {
    const fontSize = document.getElementById('fontSize').value;
    const bgColor = document.getElementById('bgColor').value;
    const contentDiv = document.getElementById('readerContent');
    
    if (contentDiv) {
        contentDiv.style.fontSize = fontSize + 'em';
        contentDiv.style.backgroundColor = bgColor;
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
        
        // 加载第一章
        if (allItemIds.length > 0) {
            currentChapterIndex = 0;
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