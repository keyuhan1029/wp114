// 初始化地圖（台大校園中心位置）
let map;
let currentCategory = null;
let markers = [];

// 台大校園中心座標
const NTU_CENTER = [25.0170, 121.5345];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    initMenu();
    initControls();
    initModal();
});

// 初始化地圖
function initMap() {
    map = L.map('map').setView(NTU_CENTER, 16);
    
    // 使用 OpenStreetMap 圖層
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    // 點擊地圖顯示資訊
    map.on('click', function(e) {
        if (currentCategory) {
            showLocationInfo(e.latlng, currentCategory);
        }
    });
}

// 初始化選單
function initMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const closeMenu = document.getElementById('closeMenu');
    const overlay = document.getElementById('overlay');
    const menuItems = document.querySelectorAll('.menu-item');

    menuToggle.addEventListener('click', function() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    });

    closeMenu.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    overlay.addEventListener('click', function() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });

    // 選單項目點擊事件
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            handleMenuClick(section);
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
}

// 處理選單點擊
function handleMenuClick(section) {
    switch(section) {
        case 'login':
            showLoginModal();
            break;
        case 'forum':
            alert('論壇功能開發中...');
            break;
        case 'schedule':
            alert('共享課表功能開發中...');
            break;
        case 'activities':
            alert('活動功能開發中...\n每天登入可以推播隨機的活動，加入自己的行事曆');
            break;
        case 'calendar':
            alert('行事曆功能開發中...\n將整合 Google Calendar');
            break;
    }
}

// 初始化控制按鈕
function initControls() {
    const controlButtons = document.querySelectorAll('.control-btn');
    
    controlButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有 active 狀態
            controlButtons.forEach(b => b.classList.remove('active'));
            // 添加當前按鈕的 active 狀態
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            currentCategory = category;
            
            // 清除舊的標記
            clearMarkers();
            
            // 根據類別顯示範例標記
            showCategoryMarkers(category);
        });
    });
}

// 顯示類別標記
function showCategoryMarkers(category) {
    // 範例位置數據（實際應用中應該從 API 獲取）
    const categoryData = {
        food: [
            { lat: 25.0175, lng: 121.5350, name: '小福餐廳' },
            { lat: 25.0165, lng: 121.5340, name: '活大餐廳' },
            { lat: 25.0180, lng: 121.5360, name: '鹿鳴堂' }
        ],
        transport: [
            { lat: 25.0170, lng: 121.5345, name: '公車站牌' },
            { lat: 25.0160, lng: 121.5335, name: 'Youbike 站點' },
            { lat: 25.0185, lng: 121.5365, name: '捷運站' }
        ],
        campus: [
            { lat: 25.0172, lng: 121.5347, name: '普通教室' },
            { lat: 25.0168, lng: 121.5343, name: '綜合教室' },
            { lat: 25.0182, lng: 121.5355, name: '體育館' }
        ],
        library: [
            { lat: 25.0173, lng: 121.5348, name: '總圖書館' },
            { lat: 25.0167, lng: 121.5342, name: '分館' }
        ],
        gym: [
            { lat: 25.0178, lng: 121.5358, name: '新體健身房' }
        ]
    };

    const locations = categoryData[category] || [];
    
    locations.forEach(location => {
        const marker = L.marker([location.lat, location.lng])
            .addTo(map)
            .bindPopup(location.name)
            .on('click', function() {
                showLocationInfo([location.lat, location.lng], category, location.name);
            });
        
        markers.push(marker);
    });
}

// 清除標記
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
}

// 顯示位置資訊
function showLocationInfo(latlng, category, name = '') {
    const infoPanel = document.getElementById('infoPanel');
    const infoContent = document.getElementById('infoContent');
    
    let content = '';
    
    switch(category) {
        case 'food':
            content = `
                <h3>${name || '美食資訊'}</h3>
                <p>點擊地圖上的標記查看詳細資訊</p>
                <ul>
                    <li>營業時間：週一至週五 11:00-14:00, 17:00-20:00</li>
                    <li>推薦餐點：便當、麵食、小菜</li>
                    <li>價格範圍：$50-$150</li>
                </ul>
            `;
            break;
        case 'transport':
            if (name.includes('公車')) {
                content = `
                    <h3>公車站牌資訊</h3>
                    <p>點下去跳出站牌上各路公車抵達時間</p>
                    <ul>
                        <li>1 路公車：預計 5 分鐘後抵達</li>
                        <li>18 路公車：預計 12 分鐘後抵達</li>
                        <li>235 路公車：預計 8 分鐘後抵達</li>
                    </ul>
                `;
            } else if (name.includes('Youbike')) {
                content = `
                    <h3>Youbike 站點</h3>
                    <p>資料來源：<a href="https://data.taipei/dataset/detail?id=c6bc8aed-557d-41d5-bfb1-8da24f78f2fb" target="_blank">台北市政府資料開放平台</a></p>
                    <ul>
                        <li>可借車輛：5 輛</li>
                        <li>可還空位：3 個</li>
                    </ul>
                `;
            } else if (name.includes('捷運')) {
                content = `
                    <h3>捷運資訊</h3>
                    <ul>
                        <li>最晚時間：23:30</li>
                        <li>最近車站：公館站</li>
                    </ul>
                `;
            }
            break;
        case 'campus':
            content = `
                <h3>${name || '校內設施'}</h3>
                <p>教室、設施資訊</p>
                <ul>
                    <li>開放時間：週一至週五 08:00-22:00</li>
                    <li>設備：投影機、音響、空調</li>
                    <li>容納人數：50-200 人</li>
                </ul>
            `;
            break;
        case 'library':
            content = `
                <h3>${name || '圖書館'}</h3>
                <ul>
                    <li>關門時間：22:00</li>
                    <li>目前人數：約 150 人</li>
                    <li>空位：約 30 個</li>
                </ul>
            `;
            break;
        case 'gym':
            content = `
                <h3>新體健身房</h3>
                <ul>
                    <li>目前人數：約 25 人</li>
                    <li>入場券：學生 $50 / 次</li>
                    <li>開放時間：06:00-22:00</li>
                </ul>
            `;
            break;
    }
    
    infoContent.innerHTML = content;
    infoPanel.classList.add('active');
}

// 初始化模態框
function initModal() {
    const loginModal = document.getElementById('loginModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const loginForm = document.getElementById('loginForm');
    const overlay = document.getElementById('overlay');

    // 關閉模態框
    function closeModal() {
        loginModal.classList.remove('active');
        overlay.classList.remove('active');
    }

    closeModalBtn.addEventListener('click', closeModal);
    
    overlay.addEventListener('click', function() {
        if (loginModal.classList.contains('active')) {
            closeModal();
        }
    });

    // 登入表單提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // 這裡應該連接到後端 API
        alert(`登入功能開發中...\n帳號：${username}`);
        closeModal();
    });
}

// 顯示登入模態框
function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const overlay = document.getElementById('overlay');
    
    loginModal.classList.add('active');
    overlay.classList.add('active');
}

// 關閉資訊面板
document.getElementById('closeInfo').addEventListener('click', function() {
    document.getElementById('infoPanel').classList.remove('active');
});
