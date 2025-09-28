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
        const contextMenu = document.getElementById('contextMenu');
        
        if (!selectButton.contains(e.target) && !engineMenu.contains(e.target)) {
            engineMenu.style.display = 'none';
            selectButton.classList.remove('active');
        }
        
        if (!searchContainer.contains(e.target)) {
            suggestionsList.style.display = 'none';
        }
        
        // 点击菜单外区域关闭右键菜单
        if (!contextMenu.contains(e.target) && !searchContainer.contains(e.target)) {
            contextMenu.style.display = 'none';
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
    const searchContainer = document.querySelector('.search-container');
    
    // 右键菜单显示
    document.addEventListener('contextmenu', (e) => {
        // 如果点击搜索框区域，使用默认右键菜单
        if (searchContainer.contains(e.target)) {
            return; // 不阻止默认行为
        }
        
        e.preventDefault();
        contextMenu.style.display = 'block';
        // 移除JS定位，使用CSS居中
        contextMenu.style.left = '';
        contextMenu.style.top = '';
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

// 加载快捷方式（服务器环境下读取本地JSON）
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

// 渲染快捷方式（恢复CSS Grid布局）
function renderShortcuts() {
    const container = document.getElementById('shortcutsContainer');
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(5, 1fr)';
    container.style.gap = '10px';
    
    shortcuts.forEach((shortcut, index) => {
        const item = document.createElement('div');
        item.className = 'shortcut-item';
        item.setAttribute('data-index', index);
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
        
        // 初始化拖拽事件（修复版：添加点击阈值）
        initItemDrag(item);
        
        container.appendChild(item);
    });
}

// 初始化拖拽事件（修复版：添加点击阈值判断）
function initItemDrag(item) {
    let startX, startY, offsetX, offsetY;
    let isDragging = false;
    let isClick = true; // 默认为点击
    let initialIndex, currentIndex;
    let items, container, placeholder;
    let originalOrder = [];
    let containerRect;
    const DRAG_THRESHOLD = 5; // 拖拽阈值（像素）
    
    // 鼠标按下开始拖拽
    item.addEventListener('mousedown', startDrag);
    
    function startDrag(e) {
        // 忽略右键点击
        if (e.button !== 0) return;
        
        // 获取容器和项目信息
        container = document.getElementById('shortcutsContainer');
        containerRect = container.getBoundingClientRect();
        items = Array.from(container.querySelectorAll('.shortcut-item'));
        initialIndex = parseInt(item.getAttribute('data-index'));
        currentIndex = initialIndex;
        
        // 保存原始顺序
        originalOrder = [...shortcuts];
        
        // 计算鼠标在元素内的偏移量
        const rect = item.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // 记录起始鼠标位置
        startX = e.clientX;
        startY = e.clientY;
        
        // 初始状态为点击
        isClick = true;
        
        // 添加事件监听
        document.addEventListener('mousemove', handleDrag);
        document.addEventListener('mouseup', endDrag);
        
        // 阻止默认行为
        e.preventDefault();
    }
    
    function handleDrag(e) {
        if (!containerRect) return;
        
        // 计算移动距离
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        
        // 判断是否超过拖拽阈值
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            if (isClick) {
                // 超过阈值，标记为拖拽并初始化
                isClick = false;
                isDragging = true;
                item.classList.add('dragging');
                item.style.zIndex = '1000';
                
                // 创建并插入占位符
                placeholder = document.createElement('div');
                placeholder.className = 'shortcut-item placeholder';
                placeholder.style.height = `${item.offsetHeight}px`;
                placeholder.style.width = `${item.offsetWidth}px`;
                item.parentNode.insertBefore(placeholder, item);
            }
            
            // 更新拖拽位置
            updateDraggingPosition(e);
            updatePlaceholderPosition(e);
        }
    }
    
    function updateDraggingPosition(e) {
        // 计算相对于容器的位置
        const relativeX = e.clientX - containerRect.left - offsetX;
        const relativeY = e.clientY - containerRect.top - offsetY;
        
        // 使用fixed定位确保跟随鼠标
        item.style.position = 'fixed';
        item.style.width = `${item.offsetWidth}px`;
        item.style.left = `${e.clientX - offsetX}px`;
        item.style.top = `${e.clientY - offsetY}px`;
        item.style.transform = 'none';
    }
    
    function updatePlaceholderPosition(e) {
        if (!placeholder) return;
        
        // 将鼠标位置转换为相对于容器的坐标
        const mouseX = e.clientX - containerRect.left;
        const mouseY = e.clientY - containerRect.top;
        
        // 遍历其他元素检查碰撞
        items.forEach((otherItem, index) => {
            if (otherItem === item || otherItem === placeholder) return;
            
            const otherRect = otherItem.getBoundingClientRect();
            const otherCenterX = otherRect.left - containerRect.left + otherRect.width / 2;
            const otherCenterY = otherRect.top - containerRect.top + otherRect.height / 2;
            
            // 二维碰撞检测
            const isHorizontalOverlap = Math.abs(mouseX - otherCenterX) < otherRect.width * 0.55;
            const isVerticalOverlap = Math.abs(mouseY - otherCenterY) < otherRect.height * 0.55;
            
            if (isHorizontalOverlap && isVerticalOverlap && index !== currentIndex) {
                currentIndex = index;
                
                // 根据网格布局特点决定插入位置
                if (mouseX < otherCenterX) {
                    otherItem.parentNode.insertBefore(placeholder, otherItem);
                } else {
                    otherItem.parentNode.insertBefore(placeholder, otherItem.nextSibling);
                }
                
                // 强制同步元素索引
                syncItemIndexes();
            }
        });
    }
    
    // 同步所有元素的索引属性与DOM顺序
    function syncItemIndexes() {
        const items = container.querySelectorAll('.shortcut-item:not(.placeholder)');
        items.forEach((el, i) => {
            el.setAttribute('data-index', i);
        });
    }
    
    function endDrag() {
        // 清理事件
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', endDrag);
        
        if (!isClick && isDragging) {
            // 移除拖拽状态
            item.classList.remove('dragging');
            item.removeAttribute('style');
            
            // 移除占位符并插入元素
            if (placeholder) {
                // 获取最终位置并同步
                const finalIndex = Array.from(container.children).indexOf(placeholder);
                placeholder.parentNode.insertBefore(item, placeholder);
                placeholder.remove();
                
                // 同步索引
                syncItemIndexes();
                
                // 更新数据
                if (finalIndex !== initialIndex) {
                    const [movedItem] = originalOrder.splice(initialIndex, 1);
                    originalOrder.splice(finalIndex, 0, movedItem);
                    shortcuts = [...originalOrder];
                    saveShortcuts();
                    renderShortcuts();
                }
            }
            
            // 重置状态
            isDragging = false;
            placeholder = null;
        }
        
        // 重置状态
        containerRect = null;
    }
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