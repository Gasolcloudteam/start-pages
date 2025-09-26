// 默认搜索引擎为Bing
let searchEngine = localStorage.getItem('searchEngine') || 'bing';
const engines = {
    bing: 'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q=',
    yahoo: 'https://search.yahoo.com/search?p=',
    yandex: 'https://yandex.com/search/?text=',
    bilibili: 'https://search.bilibili.com/all?keyword=',
    douyin: 'https://www.douyin.com/search/'
};

// 初始化搜索引擎选择
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchEngine').value = searchEngine;
    document.getElementById('selectedEngineText').textContent = formatEngineName(searchEngine);
    initBackground();
    updateTooltip();
    // 添加点击其他区域关闭下拉菜单的事件
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('engineMenu');
        const button = document.getElementById('selectEngineBtn');
        if (!button.contains(e.target) && !menu.contains(e.target)) {
            menu.style.display = 'none';
            button.classList.remove('active');
        }
    });
});

// 格式化引擎名称（首字母大写或自定义名称）
function formatEngineName(engine) {
    const names = {
        'bilibili': 'B站',
        'douyin': '抖音'
    };
    return names[engine] || engine.charAt(0).toUpperCase() + engine.slice(1);
}

// 切换搜索引擎并保存选择
function changeEngine() {
    searchEngine = document.getElementById('searchEngine').value;
    localStorage.setItem('searchEngine', searchEngine);
}

// 搜索功能
function search() {
    const query = document.getElementById('searchInput').value;
    if (query) {
        const url = engines[searchEngine] + encodeURIComponent(query);
        window.open(url, '_blank');
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
    updateTooltip();
}

function updateTooltip() {
    const toggleButton = document.getElementById('toggleButton');
    const useVideoWallpaper = localStorage.getItem('useVideoWallpaper') === 'true';
    toggleButton.setAttribute('data-tooltip', useVideoWallpaper ? '切换到静态背景' : '切换到动态背景');
}

// 时钟显示功能
let is24HourFormat = false;

function updateClock() {
    const clock = document.getElementById('clock');
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    if (!is24HourFormat) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        clock.innerHTML = `${ampm} ${hours}:${minutes}:${seconds}`;
    } else {
        hours = hours.toString().padStart(2, '0');
        clock.innerHTML = `${hours}:${minutes}:${seconds}`;
    }
}

setInterval(updateClock, 1000);

// 背景初始化
function initBackground() {
    const useVideoWallpaper = localStorage.getItem('useVideoWallpaper') === 'true';
    const videoBg = document.getElementById('videoBg');
    const staticBg = document.getElementById('staticBg');
    const toggleButton = document.getElementById('toggleButton');

    if (useVideoWallpaper) {
        videoBg.style.display = 'block';
        staticBg.style.display = 'none';
    } else {
        videoBg.style.display = 'none';
        staticBg.style.display = 'block';
    }
}

// 一言API
function getHitokoto() {
    fetch('https://v1.hitokoto.cn')
        .then(response => response.json())
        .then(data => {
            document.getElementById('hitokoto').innerText = data.hitokoto + ' ——「' + data.from + '」';
        })
        .catch(console.error);
}

document.addEventListener('DOMContentLoaded', getHitokoto);
setInterval(getHitokoto, 30000);

// 自定义下拉菜单交互
function toggleEngineMenu() {
    const menu = document.getElementById('engineMenu');
    const button = document.getElementById('selectEngineBtn');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    button.classList.toggle('active', menu.style.display === 'block');
}

function selectEngine(value) {
    document.getElementById('selectedEngineText').textContent = formatEngineName(value);
    document.getElementById('searchEngine').value = value;
    changeEngine(); // 保存选择
    document.getElementById('engineMenu').style.display = 'none';
    document.getElementById('selectEngineBtn').classList.remove('active');
}