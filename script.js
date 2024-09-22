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
function initBackground() {
    const useVideoWallpaper = document.getElementById('useVideoWallpaper').value === 'true';
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

// 在页面加载时初始化背景
document.addEventListener('DOMContentLoaded', initBackground);

// 移除高斯模糊背景
function removeBlur() {
    document.querySelector('.blur-background').style.display = 'none';
}

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

// 获取一言
function fetchHitokoto() {
    fetch('https://v1.hitokoto.cn/')
        .then(response => response.json())
        .then(data => {
            document.getElementById('hitokoto').innerText = data.hitokoto;
        })
        .catch(() => {
            document.getElementById('hitokoto').innerText = '一言获取失败，请稍后重试。';
        });
}

// 获取一言显示
fetchHitokoto();
