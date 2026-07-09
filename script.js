// ========================================================
// ★★★ データ編集エリア ★★★
// ========================================================

// 🖼️ 1. 階層ごとのマップ画像ファイル名
const MAP_IMAGES = {
    '1F': 'map1f.png',
    '2F': 'map2f.png',
    '3F': 'map3f.png',
    '4F': 'map4f.png'
};

// 🛍️ 2. 出店（クラス・部活）データ
// 💡 画像を表示するために、新しく "location" と "image" の設定項目を追加しました！
// 画像ファイル（例: waffle.pngなど）を用意して書き換えてください。指定がない場合はデフォルトのNO IMAGEになります。
const shopData = [
    { id: 1, floor: '1F', location: '商業教育棟1階', title: '3-7：マーケティング部', genre: '展示', x: 120, y: 150, image: 'waffle.png', menu: '部活で開発した商品の販売と活動報告を行います！' },
    { id: 2, floor: '1F', location: 'A棟1階', title: '3-2：人形浄瑠璃部', genre: '展示', x: 380, y: 340, image: '', menu: '伝統ある人形浄瑠璃の公演と、人形の展示を行っています。' },
    { id: 3, floor: '2F', location: 'A棟2階', title: '2-7組：喫茶 美和の館', genre: '食品', x: 410, y: 330, image: 'waffle.png', menu: '美味しいワッフルとお飲み物を用意してお待ちしております！' },
    { id: 4, floor: '3F', location: 'A棟3階', title: '1-1：写真部', genre: '展示', x: 360, y: 340, image: '', menu: '部員が撮影した手作りの一枚を展示中。お気に入りの作品に投票してください！' },
    { id: 5, floor: '4F', location: 'A棟4階', title: '軽音楽部', genre: 'アトラクション', x: 280, y: 340, image: '', menu: '4階A棟端の部室にて、アコースティックミニライブを開催中！' }
];

// 🚻 3. トイレ・救護室などの設備データ
const facilityData = [
    { name: "1F 事務室・AED", floor: "1F", x: 360, y: 80, icon: "🚑" },
    { name: "2F トイレ", floor: "2F", x: 150, y: 220, icon: "🚻" },
    { name: "3F トイレ", floor: "3F", x: 150, y: 220, icon: "🚻" },
    { name: "4F トイレ", floor: "4F", x: 150, y: 220, icon: "🚻" }
];

// ⏱️ 4. 時程（タイムライン）データ
const timelineData = [
    { id: 1, day: 1, time: "10:00 - 11:00", name: "吹奏楽部：オープニングアクト", delay: 0 },
    { id: 2, day: 1, time: "11:30 - 13:00", name: "軽音楽部：無敵ライブ", delay: 0 },
    { id: 3, day: 2, time: "13:00 - 14:00", name: "ダンス部：ファイナルステージ", delay: 0 }
];

// 📢 5. お知らせデータ
const noticeData = [
    { title: "熱中症にご注意ください", sub: "こまめな水分補給をお願いします。" },
    { title: "落とし物・迷子について", sub: "1階職員室前ロビーの本部までお越しください。" }
];

// 🤝 6. ご挨拶データ
const greetingData = [
    { role: "文化祭実行委員長より", name: "実行委員長", text: "第3回王子高文化祭へようこそ！心ゆくまでお楽しみください！" }
];


// ========================================================
// ★★★ システム処理エリア（ポップアップデザイン最適化版） ★★★
// ========================================================

let currentFloor = '1F';
let currentDay = 1;
let searchQuery = '';
let selectedTag = 'すべて';
let map;
let currentImageLayer = null;
let markersGroup = [];
let favorites = JSON.parse(localStorage.getItem('festival_favs')) || [];

const MAP_WIDTH = 900;
const MAP_HEIGHT = 410;
const MAP_BOUNDS = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];

window.onload = function() {
    initImageMap();
    renderShops();
    renderTimeline();
    renderStaticModals();
    initAdminSelect();
    updateNotificationStatusDisplay();
};

function initImageMap() {
    map = L.map('map', {
        crs: L.CRS.Simple,
        minZoom: -1,
        maxZoom: 1.5,
        maxBounds: MAP_BOUNDS,
        maxBoundsViscosity: 1.0,
        attributionControl: false,
        zoomSnap: 0.1
    });

    updateMapFloorImage();
}

function updateMapFloorImage() {
    if (currentImageLayer) {
        map.removeLayer(currentImageLayer);
    }
    const imageUrl = MAP_IMAGES[currentFloor] || 'map1f.png';

    currentImageLayer = L.imageOverlay(imageUrl, MAP_BOUNDS, {
        className: 'festival-map-image'
    }).addTo(map);

    map.fitBounds(MAP_BOUNDS);
    map.setMinZoom(map.getBoundsZoom(MAP_BOUNDS));

    updateMapMarkers();
}

function switchPage(pageId) {
    document.querySelectorAll('.app-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.page-tab-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(pageId === 'map-page' && map) {
        setTimeout(() => { 
            map.invalidateSize(); 
            map.fitBounds(MAP_BOUNDS); 
        }, 200);
    }
}

function switchFloor(floor) {
    currentFloor = floor;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.getElementById('floor-title').innerText = `${floor}の出店一覧`;
    
    renderShops();
    updateMapFloorImage();
}

function switchDay(day) {
    currentDay = day;
    document.getElementById('day1-btn').classList.toggle('active', day === 1);
    document.getElementById('day2-btn').classList.toggle('active', day === 2);
    renderTimeline();
}

// 📌 マップ上のピンをタップしたときの処理（理想画像に合わせました）
function updateMapMarkers() {
    markersGroup.forEach(m => map.removeLayer(m));
    markersGroup = [];

    shopData.filter(s => s.floor === currentFloor).forEach(shop => {
        // 画像があるかどうかの判定処理
        const imageHtml = shop.image 
            ? `<img src="${shop.image}" class="popup-img" alt="${shop.title}">`
            : `<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#e5e7eb;color:#9ca3af;font-size:0.7rem;font-weight:bold;">NO IMAGE</div>`;

        // 理想のデザインを完全に再現するHTML構造
        const popupContent = `
            <div class="popup-location">${shop.location || (shop.floor + '棟')}</div>
            <div class="popup-title">${shop.title}</div>
            <div class="popup-img-wrapper" onclick="openShopDetailFromMap(${shop.id})">
                ${imageHtml}
            </div>
        `;

        const marker = L.marker([shop.y, shop.x]).addTo(map)
            .bindPopup(popupContent, { maxWidth: 210, minWidth: 180 });
        markersGroup.push(marker);
    });

    facilityData.filter(f => f.floor === currentFloor).forEach(facility => {
        const customIcon = L.divIcon({
            html: `<div class="custom-toilet-icon-inner">${facility.icon}</div>`,
            className: 'custom-toilet-icon',
            iconSize: [30, 30]
        });
        const marker = L.marker([facility.y, facility.x], {icon: customIcon}).addTo(map)
            .bindPopup(`<b>${facility.name}</b>`);
        markersGroup.push(marker);
    });
}

function panToCoordinates(x, y, shopId) {
    map.setView([y, x], 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
        const detailDiv = document.getElementById(`details-${shopId}`);
        if (detailDiv) { detailDiv.classList.add('open'); }
    }, 300);
}

function openShopDetailFromMap(shopId) {
    map.closePopup();
    const detailDiv = document.getElementById(`details-${shopId}`);
    if (detailDiv) {
        detailDiv.classList.add('open');
        detailDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// 出店リストの出力
function renderShops() {
    const container = document.getElementById('shop-list-container');
    container.innerHTML = '';

    const filtered = shopData.filter(shop => {
        const matchesFloor = shop.floor === currentFloor;
        const matchesTag = selectedTag === 'すべて' || shop.genre === selectedTag;
        const matchesSearch = shop.title.includes(searchQuery) || shop.menu.includes(searchQuery);
        return matchesFloor && matchesTag && matchesSearch;
    });

    if(filtered.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#9ca3af; font-weight:bold; padding:20px;">該当する出店が見つかりません</p>';
        return;
    }

    filtered.forEach(shop => {
        const imageListHtml = shop.image 
            ? `<img src="${shop.image}" alt="${shop.title}">`
            : `NO IMAGE<br><span style="font-size:0.6rem;">文化祭</span>`;

        const card = document.createElement('div');
        card.className = 'shop-card-wrapper';
        card.innerHTML = `
            <div class="shop-card" onclick="toggleAccordion(${shop.id})">
                <span class="shop-loc">${shop.floor}</span>
                <div class="shop-title">
                    ${shop.title}
                    <span class="shop-genre">🏷️ ${shop.genre}</span>
                </div>
                <i class="fa-solid fa-chevron-down" style="color:#9ca3af;" id="arrow-${shop.id}"></i>
            </div>
            <div class="shop-details" id="details-${shop.id}">
                <div class="details-left">
                    <div class="logo-dummy">${imageListHtml}</div>
                </div>
                <div class="details-right">
                    <span class="menu-headline">📋 出店内容・メニュー</span>
                    <div class="menu-text">${shop.menu}</div>
                    <div class="card-actions">
                        <button class="map-go-btn" onclick="panToCoordinates(${shop.x}, ${shop.y}, ${shop.id})">
                            <i class="fa-solid fa-location-arrow"></i> マップで位置を確認
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function toggleAccordion(id) {
    const detail = document.getElementById(`details-${id}`);
    const arrow = document.getElementById(`arrow-${id}`);
    const isOpen = detail.classList.contains('open');
    
    document.querySelectorAll('.shop-details').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.shop-card i').forEach(i => { i.style.transform = 'rotate(0deg)'; });

    if (!isOpen) {
        detail.classList.add('open');
        arrow.style.transform = 'rotate(180deg)';
    }
}

function filterShops() {
    searchQuery = document.getElementById('search-box').value;
    renderShops();
}

function filterTag(tag, element) {
    selectedTag = tag;
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    element.classList.add('active');
    renderShops();
}

// タイムラインの出力
function renderTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = '';

    const filtered = timelineData.filter(t => t.day === currentDay);

    filtered.forEach(slot => {
        const isFav = favorites.includes(slot.id);
        const isDelayed = slot.delay > 0;
        
        const div = document.createElement('div');
        div.className = `time-slot ${isDelayed ? 'status-delayed' : ''}`;
        div.innerHTML = `
            <div>
                <span class="time-text">${slot.time}</span>
                <div class="band-name">${slot.name}</div>
                <span class="band-status ${isDelayed ? 'delayed' : ''}">
                    ${isDelayed ? `⚠️ ${slot.delay}分遅延（変更後 ${getDelayedTime(slot.time, slot.delay)}）` : '✅ 通常通り'}
                </span>
            </div>
            <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${slot.id})">
                ${isFav ? '★' : '☆'}
            </button>
        `;
        container.appendChild(div);
    });
}

function getDelayedTime(timeRangeStr, delayMinutes) {
    try {
        const startStr = timeRangeStr.split(' - ')[0];
        let [hours, minutes] = startStr.split(':').map(Number);
        minutes += delayMinutes;
        if (minutes >= 60) {
            hours += Math.floor(minutes / 60);
            minutes = minutes % 60;
        }
        return `${hours}:${String(minutes).padStart(2, '0')}～`;
    } catch(e) { return "時間変更あり"; }
}

function toggleFavorite(id) {
    if (favorites.includes(id)) {
        favorites = favorites.filter(fid => fid !== id);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('festival_favs', JSON.stringify(favorites));
    renderTimeline();
}

function renderStaticModals() {
    const noticeContainer = document.getElementById('notice-list-container');
    noticeContainer.innerHTML = noticeData.map(d => `
        <li>${d.title}<span class="notice-sub">${d.sub}</span></li>
    `).join('');

    const greetingContainer = document.getElementById('greeting-list-container');
    greetingContainer.innerHTML = greetingData.map(d => `
        <div class="greeting-section">
            <div class="greeting-role">${d.role}</div>
            <p>${d.text}</p>
            <div class="greeting-name">${d.name}</div>
        </div>
    `).join('');
}

function initAdminSelect() {
    const select = document.getElementById('admin-target-select');
    select.innerHTML = timelineData.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
}

// 🔔 プッシュ通知制御
function updateNotificationStatusDisplay() {
    const statusText = document.getElementById('push-status-text');
    const reqBtn = document.getElementById('push-request-btn');
    
    if (!("Notification" in window)) {
        statusText.innerText = "通知非対応のブラウザです";
        statusText.style.color = "#ef4444";
        reqBtn.style.display = "none";
        return;
    }

    if (Notification.permission === "granted") {
        statusText.innerText = "許可済み";
        statusText.style.color = "#10b981";
        reqBtn.style.display = "none";
    } else if (Notification.permission === "denied") {
        statusText.innerText = "設定でブロックされています";
        statusText.style.color = "#ef4444";
        reqBtn.style.display = "none";
    } else {
        statusText.innerText = "未設定";
        statusText.style.color = "#f59e0b";
        reqBtn.style.display = "block";
    }
}

function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then(permission => {
        updateNotificationStatusDisplay();
        if (permission === "granted") {
            sendSystemNotification("通知が有効になりました！", "タイムラインの遅延情報などをここにお届けします。");
        }
    });
}

function sendSystemNotification(title, body) {
    if ("Notification" in window && Notification.permission === "granted") {
        try { new Notification(title, { body: body }); } catch (e) { console.log(e); }
    }
}

// ⚙️ 遅延シミュレーション
function simulateDelay(minutes) {
    const targetName = document.getElementById('admin-target-select').value;
    
    timelineData.forEach(slot => {
        if(slot.name === targetName) {
            slot.delay = minutes;
        }
    });

    renderTimeline();
    
    const msg = minutes > 0 
        ? `【遅延情報】「${targetName}」のステージ進行が約 ${minutes} 分遅れています。`
        : `【定時運行】「${targetName}」は通常通りの進行に戻りました。`;

    const alertBar = document.getElementById('global-alert');
    document.getElementById('alert-message').innerText = msg;
    alertBar.style.display = 'flex';

    sendSystemNotification(minutes > 0 ? "⚠️ ステージ遅延情報" : "✅ 進行状況復帰", msg);
    toggleSidebar();
}

function closeAlertBar() {
    document.getElementById('global-alert').style.display = 'none';
}

// UIメニュー操作
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menu-overlay');
    if(sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    } else {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
}

function openModal(modalId) {
    toggleSidebar();
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function closeModalOnOverlay(e, modalId) {
    if (e.target === document.getElementById(modalId)) { closeModal(modalId); }
}
