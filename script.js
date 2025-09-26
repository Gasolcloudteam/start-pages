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

// 搜索建议API配置（已移除Yahoo）
const suggestApis = {
    bing: (query) => `http://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(query)}&cb=window.bing.sug`,
    google: (query) => `http://suggestqueries.google.com/complete/search?client=youtube&q=${encodeURIComponent(query)}&jsonp=window.google.ac.h`
};

// 防抖函数
function debounce(func, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

// 一言API调用函数
function getHitokoto() {
    fetch('https://v1.hitokoto.cn')
        .then(response => response.json())
        .then(data => {
            const hitokotoElement = document.getElementById('hitokoto');
            if (hitokotoElement) {
                hitokotoElement.innerText = data.hitokoto + ' ——「' + (data.from || '未知来源') + '」';
            }
        })
        .catch(error => {
            console.error('一言API请求失败:', error);
            const hitokotoElement = document.getElementById('hitokoto');
            if (hitokotoElement) {
                hitokotoElement.innerText = '生活就像海洋，只有意志坚强的人才能到达彼岸。 ——「马克思」';
            }
        });
}

// 初始化搜索引擎选择和一言
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchEngine').value = searchEngine;
    document.getElementById('selectedEngineText').textContent = formatEngineName(searchEngine);
    initBackground();
    updateTooltip();
    getHitokoto(); // 初始加载一言
    setInterval(getHitokoto, 30000); // 每30秒自动刷新一言
    
    // 点击其他区域关闭下拉菜单和建议列表
    document.addEventListener('click', (e) => {
        const engineMenu = document.getElementById('engineMenu');
        const selectButton = document.getElementById('selectEngineBtn');
        const suggestionsList = document.getElementById('suggestionsList');
        const searchContainer = document.querySelector('.search-container');
        
        if (!selectButton.contains(e.target) && !engineMenu.contains(e.target)) {
            engineMenu.style.display = 'none';
            selectButton.classList.remove('active');
        }
        
        if (!searchContainer.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
    });
});

// 格式化引擎名称
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
        document.getElementById('suggestionsList').style.display = 'none';
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

    if (useVideoWallpaper) {
        videoBg.style.display = 'block';
        staticBg.style.display = 'none';
    } else {
        videoBg.style.display = 'none';
        staticBg.style.display = 'block';
    }
}

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

// 搜索建议功能（已调整为7条建议）
function getSuggestions() {
    const query = document.getElementById('searchInput').value.trim();
    const suggestionsList = document.getElementById('suggestionsList');
    
    // 清空并隐藏建议列表
    suggestionsList.innerHTML = '';
    suggestionsList.style.display = 'none';
    
    // 排除不支持建议的搜索引擎（仅保留bing和google）
    if (!['bing', 'google'].includes(searchEngine) || !query) {
        return;
    }
    
    // 根据当前搜索引擎调用对应的API
    const apiUrl = suggestApis[searchEngine](query);
    
    // 创建script标签动态加载JSONP
    const script = document.createElement('script');
    script.src = apiUrl;
    script.onerror = () => {
        document.head.removeChild(script);
    };
    document.head.appendChild(script);
}

// 渲染搜索建议（显示7条结果）
function renderSuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestions.length === 0) {
        suggestionsList.style.display = 'none';
        return;
    }
    
    // 最多显示7条建议
    suggestions.slice(0, 7).forEach(text => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.textContent = text;
        item.onclick = () => {
            document.getElementById('searchInput').value = text;
            suggestionsList.style.display = 'none';
            search();
        };
        suggestionsList.appendChild(item);
    });
    
    suggestionsList.style.display = 'block';
}

// 绑定各搜索引擎的JSONP回调函数
window.bing = {
    sug: (data) => {
        const suggestions = data.AS?.Results?.[0]?.Suggests?.map(s => s.Txt) || [];
        renderSuggestions(suggestions);
    }
};

window.google = {
    ac: {
        h: (data) => {
            const suggestions = data[1]?.map(item => item[0]) || [];
            renderSuggestions(suggestions);
        }
    }
};

// 为搜索框绑定防抖输入事件
document.getElementById('searchInput').addEventListener('input', debounce(getSuggestions, 300));

// 点击搜索框外部关闭建议列表
document.addEventListener('click', (e) => {
    const searchInput = document.getElementById('searchInput');
    const suggestionsList = document.getElementById('suggestionsList');
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
        suggestionsList.style.display = 'none';
    }
});