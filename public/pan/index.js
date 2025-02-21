// script.js
const GITHUB_TOKEN = '你的GitHub令牌'; // 替换为你的GitHub令牌
const GITHUB_REPO = '你的GitHub用户名/你的仓库名'; // 替换为你的GitHub仓库
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}/contents`;

document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const searchInput = document.getElementById('search-input');
    const fileList = document.getElementById('file-list');

    // 初始化加载文件列表
    loadFiles();

    // 上传文件
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileUpload);

    // 搜索文件
    searchInput.addEventListener('input', searchFiles);

    // 加载文件列表
    async function loadFiles() {
        try {
            const response = await fetch(GITHUB_API_URL, {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                },
            });
            const files = await response.json();
            renderFiles(files);
        } catch (error) {
            console.error('加载文件失败:', error);
        }
    }

    // 渲染文件列表
    function renderFiles(files) {
        fileList.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.textContent = file.name;
            li.setAttribute('data-url', file.download_url);
            fileList.appendChild(li);

            // 点击文件下载
            li.addEventListener('click', () => downloadFile(file.download_url));
        });
    }

    // 上传文件到 GitHub
    async function handleFileUpload(event) {
        const files = event.target.files;
        for (let file of files) {
            const content = await readFileAsBase64(file);
            const path = file.name;

            try {
                const response = await fetch(GITHUB_API_URL + `/${path}`, {
                    method: 'PUT',
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: `上传文件: ${path}`,
                        content: content.split(',')[1], // 去掉Base64前缀
                    }),
                });

                if (response.ok) {
                    alert('文件上传成功！');
                    loadFiles(); // 重新加载文件列表
                } else {
                    alert('文件上传失败！');
                }
            } catch (error) {
                console.error('上传文件失败:', error);
            }
        }
    }

    // 将文件读取为Base64
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }

    // 下载文件
    function downloadFile(url) {
        window.open(url, '_blank');
    }

    // 搜索文件
    function searchFiles() {
        const query = searchInput.value.toLowerCase();
        const items = fileList.querySelectorAll('li');
        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(query) ? 'flex' : 'none';
        });
    }
});