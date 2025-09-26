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

// 搜索建议API配置
const suggestApis = {
    bing: (query) => `https://api.bing.com/qsonhs.aspx?type=cb&q=${encodeURIComponent(query)}&cb=window.bing.sug`,
    google: (query) => `https://suggestqueries.google.com/complete/search?client=youtube&q=${encodeURIComponent(query)}&jsonp=window.google.ac.h`
};

// 快捷方式数据
let shortcuts = [];
const DEFAULT_SHORTCUTS_URL = 'shortcuts.json'; // 服务器环境下的JSON文件路径

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
    getHitokoto();
    setInterval(getHitokoto, 30000);
    
    // 初始化公告提示
    initNoticeModal();
    
    // 初始化右键菜单
    initContextMenu();
    
    // 加载快捷方式（服务器环境下读取本地JSON）
    loadShortcuts();
    
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

// 初始化公告提示弹窗
function initNoticeModal() {
    const modal = document.getElementById('noticeModal');
    const btnConfirm = document.getElementById('btnConfirm');
    const btnNotShowAgain = document.getElementById('btnNotShowAgain');
    
    // 检查是否显示公告
    if (!localStorage.getItem('showNotice') || localStorage.getItem('showNotice') === 'true') {
        modal.style.display = 'flex';
    }
    
    // 确定按钮
    btnConfirm.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // 不再提示按钮
    btnNotShowAgain.addEventListener('click', () => {
        localStorage.setItem('showNotice', 'false');
        modal.style.display = 'none';
    });
}

// 初始化右键菜单
function initContextMenu() {
    const contextMenu = document.getElementById('contextMenu');
    const closeBtn = document.getElementById('closeContextMenu');
    const btnEdit = document.getElementById('btnEdit');
    const btnNew = document.getElementById('btnNew');
    const btnImport = document.getElementById('btnImport');
    const btnExport = document.getElementById('btnExport');
    
    // 右键菜单显示
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        contextMenu.style.display = 'block';
    });
    
    // 点击其他区域关闭右键菜单
    document.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });
    
    // 关闭按钮
    closeBtn.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });
    
    // 编辑按钮
    btnEdit.addEventListener('click', toggleEditMode);
    
    // 新建按钮
    btnNew.addEventListener('click', createNewShortcut);
    
    // 导出按钮
    btnExport.addEventListener('click', exportShortcuts);
    
    // 导入按钮
    btnImport.addEventListener('click', importShortcuts);
}

// 加载快捷方式（服务器环境下读取本地JSON文件）
function loadShortcuts() {
    const saved = localStorage.getItem('shortcuts');
    if (saved) {
        try {
            shortcuts = JSON.parse(saved);
            console.log('成功加载本地快捷方式数据:', shortcuts);
            renderShortcuts();
            return;
        } catch (e) {
            console.error('解析本地快捷方式失败，将加载服务器默认数据', e);
            localStorage.removeItem('shortcuts');
        }
    }
    
    // 加载服务器端默认JSON文件
    console.log('尝试加载服务器默认快捷方式数据:', DEFAULT_SHORTCUTS_URL);
    fetch(DEFAULT_SHORTCUTS_URL)
        .then(response => {
            console.log('JSON请求状态码:', response.status);
            if (!response.ok) throw new Error(`HTTP错误，状态码: ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('成功加载服务器默认快捷方式数据:', data);
            shortcuts = data;
            localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
            renderShortcuts();
        })
        .catch(error => {
            console.error('加载服务器默认快捷方式失败:', error);
            // 显示错误提示弹窗
            const errorModal = document.createElement('div');
            errorModal.className = 'modal';
            errorModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header"><h3>加载错误</h3></div>
                    <div class="modal-body">
                        <p>无法加载快捷方式数据，请确保：</p>
                        <p>1. shortcuts.json文件已部署到服务器根目录</p>
                        <p>2. 服务器配置允许读取JSON文件</p>
                        <p>错误详情: ${error.message}</p>
                    </div>
                    <div class="modal-footer"><button onclick="this.parentElement.parentElement.parentElement.style.display='none'">确定</button></div>
                </div>
            `;
            document.body.appendChild(errorModal);
            errorModal.style.display = 'flex';
            
            // 使用默认数据应急
            shortcuts = [
                { url: 'https://www.jd.com', name: '京东' },
                { url: 'https://www.taobao.com', name: '淘宝' }
            ];
            renderShortcuts();
        });
}

// 渲染快捷方式
function renderShortcuts() {
    const container = document.getElementById('shortcutsContainer');
    container.innerHTML = '';
    
    shortcuts.forEach((shortcut, index) => {
        const item = document.createElement('div');
        item.className = 'shortcut-item';
        item.draggable = true;
        item.setAttribute('data-url', shortcut.url);
        item.innerHTML = `
            <span>${shortcut.name}</span>
            <div class="delete-btn" data-index="${index}">×</div>
        `;
        
        // 点击打开链接
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                window.open(shortcut.url, '_blank');
            }
        });
        
        // 删除按钮事件
        item.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteShortcut(index);
        });
        
        // 拖放事件
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        
        container.appendChild(item);
    });
    
    // 初始化拖放容器事件
    initDragContainerEvents();
}

// 拖放容器事件处理
function initDragContainerEvents() {
    const container = document.getElementById('shortcutsContainer');
    
    // 移除已存在的事件监听，避免重复绑定
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragenter', handleDragEnter);
    
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragenter', handleDragEnter);
}

// 拖动状态变量
let draggingItem = null;
let placeholder = null;
let initialX = 0;
let initialY = 0;
let startX = 0;
let startY = 0;
let lastUpdateTime = 0;
const UPDATE_THROTTLE = 60; // 限制更新频率（毫秒）
let lastPositionUpdate = 0;
let elementPositions = new Map(); // 缓存元素位置信息
let currentAfterElement = null;
let initialDragDirection = null; // 初始拖动方向
let dragDistance = 0; // 拖动距离

// 拖动开始处理
function handleDragStart(e) {
    // 精确选择拖动元素
    draggingItem = e.target.closest('.shortcut-item');
    if (!draggingItem) return;
    
    // 记录初始位置用于方向判断
    startX = e.clientX;
    startY = e.clientY;
    
    // 重置拖动状态
    initialDragDirection = null;
    dragDistance = 0;
    
    // 记录初始位置
    const rect = draggingItem.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;
    
    // 创建单一占位符
    placeholder = document.createElement('div');
    placeholder.className = 'shortcut-item placeholder';
    placeholder.style.height = `${draggingItem.offsetHeight}px`;
    placeholder.style.width = `${draggingItem.offsetWidth}px`;
    
    // 初始化位置缓存
    updateElementPositions();
    
    // 添加拖动样式（使用setTimeout确保样式应用）
    setTimeout(() => {
        draggingItem.classList.add('dragging');
        draggingItem.parentNode.insertBefore(placeholder, draggingItem);
        draggingItem.style.position = 'fixed';
        draggingItem.style.width = `${draggingItem.offsetWidth}px`;
        updateDraggingPosition(e);
    }, 0);
}

// 拖动过程处理
function handleDragOver(e) {
    e.preventDefault();
    if (!draggingItem || !placeholder) return;
    
    // 计算拖动距离
    dragDistance = Math.sqrt(Math.pow(e.clientX - startX, 2) + Math.pow(e.clientY - startY, 2));
    
    // 确定拖动方向（仅在拖动一定距离后）
    if (!initialDragDirection && dragDistance > 10) { // 拖动超过10px才确定方向
        initialDragDirection = Math.abs(e.clientX - startX) > Math.abs(e.clientY - startY) ? 
            'horizontal' : 'vertical';
        
        // 添加水平拖动类，用于特殊样式
        if (initialDragDirection === 'horizontal') {
            draggingItem.classList.add('horizontal-drag');
        }
    }
    
    // 使用requestAnimationFrame优化动画更新
    requestAnimationFrame(() => {
        updateDraggingPosition(e);
        
        // 缓存元素位置信息（每100ms更新一次）
        const now = Date.now();
        if (!lastPositionUpdate || now - lastPositionUpdate > 100) {
            updateElementPositions();
            lastPositionUpdate = now;
        }
        
        // 找到插入位置
        const afterElement = getDragAfterElement(draggingItem.parentNode, e.clientX, e.clientY);
        
        // 移动占位符（仅在位置变化时更新）
        if (afterElement !== currentAfterElement) {
            currentAfterElement = afterElement;
            if (afterElement) {
                draggingItem.parentNode.insertBefore(placeholder, afterElement);
            } else {
                draggingItem.parentNode.appendChild(placeholder);
            }
        }
    });
}

// 拖动进入处理（增强边界判断）
function handleDragEnter(e) {
    e.preventDefault();
    if (!draggingItem || !placeholder) return;
    
    const container = document.getElementById('shortcutsContainer');
    const containerRect = container.getBoundingClientRect();
    
    // 水平方向边界判断
    if (initialDragDirection === 'horizontal') {
        // 左侧边界判断 - 拖到最左边
        if (e.clientX < containerRect.left + 30) {
            container.insertBefore(placeholder, container.firstChild);
            currentAfterElement = container.firstChild;
            return;
        }
        
        // 右侧边界判断 - 拖到最右边
        if (e.clientX > containerRect.right - 30) {
            container.appendChild(placeholder);
            currentAfterElement = null;
            return;
        }
    } 
    // 垂直方向边界判断
    else {
        // 顶部边界判断 - 拖到最前面
        if (e.clientY < containerRect.top + 30) {
            container.insertBefore(placeholder, container.firstChild);
            currentAfterElement = container.firstChild;
            return;
        }
        
        // 底部边界判断 - 拖到最后面
        if (e.clientY > containerRect.bottom - 30) {
            container.appendChild(placeholder);
            currentAfterElement = null;
            return;
        }
    }
}

// 拖动结束处理
function handleDragEnd() {
    if (!draggingItem) return;
    
    // 移除拖动类
    draggingItem.classList.remove('dragging', 'horizontal-drag');
    draggingItem.removeAttribute('style');
    
    // 移除占位符并更新排序
    if (placeholder) {
        // 将拖动元素插入到占位符位置
        placeholder.parentNode.insertBefore(draggingItem, placeholder);
        placeholder.remove();
    }
    
    // 更新数据并重置状态
    updateShortcutsOrder();
    draggingItem = null;
    placeholder = null;
    initialX = 0;
    initialY = 0;
    startX = 0;
    startY = 0;
    currentAfterElement = null;
    elementPositions.clear();
}

// 更新拖动元素位置，添加滚动补偿
function updateDraggingPosition(e) {
    if (!draggingItem) return;
    
    // 获取当前滚动位置
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // 计算新位置（考虑滚动偏移）
    const x = e.clientX - initialX + scrollLeft;
    const y = e.clientY - initialY + scrollTop;
    
    draggingItem.style.left = `${x}px`;
    draggingItem.style.top = `${y}px`;
}

// 批量更新元素位置缓存
function updateElementPositions() {
    elementPositions.clear();
    const draggableElements = document.querySelectorAll('.shortcut-item:not(.dragging):not(.placeholder)');
    const container = document.getElementById('shortcutsContainer');
    const containerRect = container.getBoundingClientRect();
    
    draggableElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        // 同时保存绝对位置和相对容器位置
        elementPositions.set(element, {
            // 绝对位置
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            // 相对容器位置
            relLeft: rect.left - containerRect.left,
            relTop: rect.top - containerRect.top,
            // 尺寸
            width: rect.width,
            height: rect.height,
            // 中心点
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2,
            relCenterX: (rect.left - containerRect.left) + rect.width / 2
        });
    });
}

// 优化的位置计算函数（重点优化从右向左拖动）
function getDragAfterElement(container, x, y) {
    const draggableElements = [...container.querySelectorAll('.shortcut-item:not(.dragging):not(.placeholder)')];
    
    // 记录最小距离和对应元素
    let closestElement = null;
    let minDistance = Number.POSITIVE_INFINITY;
    let closestOffset = 0;
    
    // 判断拖动方向
    const isHorizontalDrag = initialDragDirection === 'horizontal' || 
                            (Math.abs(x - startX) > Math.abs(y - startY) && dragDistance > 10);
    
    // 获取容器位置，用于相对坐标计算
    const containerRect = container.getBoundingClientRect();
    
    draggableElements.forEach(element => {
        const pos = elementPositions.get(element);
        if (!pos) return;
        
        // 根据拖动方向动态调整权重，水平方向增加x轴权重
        const weightX = isHorizontalDrag ? 1.2 : 0.5; // 水平拖动时增加x轴权重
        const weightY = isHorizontalDrag ? 0.5 : 1;
        
        // 计算相对容器的坐标（而非视口绝对坐标）
        const relX = x - containerRect.left;
        const offsetX = (relX - pos.relCenterX) * weightX;
        
        // 垂直方向使用绝对坐标
        const offsetY = (y - pos.centerY) * weightY;
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
        
        // 更新最近元素
        if (distance < minDistance) {
            minDistance = distance;
            closestElement = element;
            closestOffset = isHorizontalDrag ? offsetX : offsetY;
        }
    });
    
    if (!closestElement) return null;
    
    // 获取元素尺寸用于阈值计算
    const elementSize = isHorizontalDrag ? 
        elementPositions.get(closestElement).width : 
        elementPositions.get(closestElement).height;
    
    // 根据拖动方向和方向动态调整阈值
    let threshold = elementSize * 0.5; // 默认阈值
    
    // 从右向左拖动时降低阈值，提高灵敏度
    if (isHorizontalDrag && x < startX) { 
        threshold = elementSize * 0.4; 
    }
    
    // 添加方向补偿，解决从右向左拖动的偏移问题
    const directionCompensation = isHorizontalDrag && x < startX ? elementSize * 0.05 : 0;
    
    return (closestOffset + directionCompensation) > threshold ? 
        closestElement.nextSibling : closestElement;
}

// 更新排序数据
function updateShortcutsOrder() {
    const container = document.getElementById('shortcutsContainer');
    const items = Array.from(container.querySelectorAll('.shortcut-item:not(.placeholder)'));
    
    // 直接从DOM元素获取当前顺序和数据
    const newOrder = items.map(item => {
        return {
            name: item.querySelector('span').textContent,
            url: item.getAttribute('data-url')
        };
    });
    
    // 更新数据并保存
    shortcuts = newOrder;
    saveShortcuts();
}

// 保存快捷方式到本地存储
function saveShortcuts() {
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts));
}

// 切换编辑模式
function toggleEditMode() {
    const items = document.querySelectorAll('.shortcut-item');
    items.forEach(item => item.classList.toggle('edit-mode'));
}

// 删除快捷方式
function deleteShortcut(index) {
    shortcuts.splice(index, 1);
    saveShortcuts();
    renderShortcuts();
}

// 创建新快捷方式
function createNewShortcut() {
    const name = prompt('请输入快捷方式名称:');
    if (!name) return;
    
    const url = prompt('请输入网址:');
    if (!url) return;
    
    shortcuts.push({ url, name });
    saveShortcuts();
    renderShortcuts();
}

// 导出快捷方式
function exportShortcuts() {
    const dataStr = JSON.stringify(shortcuts, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'shortcuts_backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// 导入快捷方式
function importShortcuts() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const imported = JSON.parse(event.target.result);
                if (Array.isArray(imported) && imported.every(item => item.url && item.name)) {
                    shortcuts = imported;
                    saveShortcuts();
                    renderShortcuts();
                    alert('导入成功');
                } else {
                    alert('导入失败: 无效的快捷方式数据');
                }
            } catch (err) {
                alert('导入失败: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

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
    changeEngine();
    document.getElementById('engineMenu').style.display = 'none';
    document.getElementById('selectEngineBtn').classList.remove('active');
}

// 搜索建议功能
function getSuggestions() {
    const query = document.getElementById('searchInput').value.trim();
    const suggestionsList = document.getElementById('suggestionsList');
    
    suggestionsList.innerHTML = '';
    suggestionsList.style.display = 'none';
    
    if (!['bing', 'google'].includes(searchEngine) || !query) return;
    
    const apiUrl = suggestApis[searchEngine](query);
    const script = document.createElement('script');
    script.src = apiUrl;
    script.onerror = () => document.head.removeChild(script);
    document.head.appendChild(script);
}

// 渲染搜索建议
function renderSuggestions(suggestions) {
    const suggestionsList = document.getElementById('suggestionsList');
    if (suggestions.length === 0) return;
    
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
window.bing = { sug: (data) => renderSuggestions(data.AS?.Results?.[0]?.Suggests?.map(s => s.Txt) || []) };
window.google = { ac: { h: (data) => renderSuggestions(data[1]?.map(item => item[0]) || []) } };

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