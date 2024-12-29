// 默认搜索引擎为Bing
let searchEngine = localStorage.getItem('searchEngine') || 'bing';
const engines = {
    bing: 'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q='
};

// 初始化搜索引擎选择
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchEngine').value = searchEngine;
});

// 切换搜索引擎并保存选择
function changeEngine() {
    searchEngine = document.getElementById('searchEngine').value;
    localStorage.setItem('searchEngine', searchEngine);
}

// 搜索功能
function search() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        window.open(engines[searchEngine] + query, '_blank');
    }
}

// 按下回车键进行搜索
function checkEnter(event) {
    if (event.key === 'Enter') {
        search();
    }
}

// 初始化背景
function toggleWallpaper() {
    const useVideoWallpaper = localStorage.getItem('useVideoWallpaper') === 'true';
    localStorage.setItem('useVideoWallpaper', !useVideoWallpaper);
    initBackground();
    updateTooltip(); // 调用更新提示词的函数
}

function updateTooltip() {
    const toggleButton = document.getElementById('toggleButton');
    const useVideoWallpaper = localStorage.getItem('useVideoWallpaper') === 'true';
    if (useVideoWallpaper) {
        toggleButton.setAttribute('data-tooltip', '切换到静态背景');
    } else {
        toggleButton.setAttribute('data-tooltip', '切换到动态背景');
    }
}

// 确保在页面加载时也调用一次 updateTooltip 函数
document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    updateTooltip();
});

// 时钟显示功能
let is24HourFormat = false;

function updateClock() {
    const clock = document.getElementById('clock');
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // 24小时制转换
    if (!is24HourFormat) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // 0 => 12
        clock.innerHTML = `${ampm} ${hours}:${minutes}:${seconds}`;
    } else {
        hours = hours.toString().padStart(2, '0');
        clock.innerHTML = `${hours}:${minutes}:${seconds}`;
    }
}

// 定时更新时钟
setInterval(updateClock, 1000);

// 点击按钮时切换壁纸
function initBackground() {
    const useVideoWallpaper = localStorage.getItem('useVideoWallpaper') === 'true';
    const videoBg = document.getElementById('videoBg');
    const staticBg = document.getElementById('staticBg');
    const toggleButton = document.getElementById('toggleButton');

    if (useVideoWallpaper) {
        // 显示动态壁纸
        videoBg.style.display = 'block';
        staticBg.style.display = 'none';
        toggleButton.dataset.tooltip = '切换到静态背景';
    } else {
        // 显示静态壁纸
        videoBg.style.display = 'none';
        staticBg.style.display = 'block';
        toggleButton.dataset.tooltip = '切换到动态背景';
    }
}

function toggleWallpaper() {
    const useVideoWallpaper = localStorage.getItem('useVideoWallpaper') === 'true';
    localStorage.setItem('useVideoWallpaper', !useVideoWallpaper);
    initBackground();
}

// 当文档加载完毕时调用 initBackground
document.addEventListener('DOMContentLoaded', initBackground);

// 一言API
function getHitokoto() {
    fetch('https://v1.hitokoto.cn')
        .then(response => response.json())
        .then(data => {
            document.getElementById('hitokoto').innerText = data.hitokoto + ' ——「' + data.from + '」';
        })
        .catch(console.error);
}

// 页面加载时获取一言
document.addEventListener('DOMContentLoaded', getHitokoto);

// 定时更换一言
setInterval(getHitokoto, 30000); // 每30秒更换一次
