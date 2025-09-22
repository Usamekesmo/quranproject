// js/map.js (النسخة الكاملة)

import { mapLocations } from './map-config.js';
import * as player from './player.js';
import * as ui from './ui.js'; // <-- استيراد واجهة المستخدم للتفاعل

// --- تعريف عناصر الواجهة ---
const mapContainer = document.getElementById('map-tab');
const localMapModal = document.getElementById('local-map-modal');
const localMapTitle = document.getElementById('local-map-title');
const localMapContainer = document.getElementById('local-map-container');
const localMapCloseBtn = document.getElementById('local-map-close-btn');

const pageDetailsModal = document.getElementById('page-details-modal');
const pageDetailsTitle = document.getElementById('page-details-title');
const pageDetailsBody = document.getElementById('page-details-body');
const pageDetailsCloseBtn = document.getElementById('page-details-close-btn');
const pageDetailsTestBtn = document.getElementById('page-details-test-btn');

// --- دوال التحكم في النوافذ ---
function toggleLocalMapModal(show) {
    localMapModal.classList.toggle('hidden', !show);
}
function togglePageDetailsModal(show) {
    pageDetailsModal.classList.toggle('hidden', !show);
}

// --- دالة عرض تفاصيل الصفحة ---
function showPageDetails(pageNumber) {
    toggleLocalMapModal(false); // إخفاء النافذة الأولى
    pageDetailsTitle.textContent = `تفاصيل الصفحة رقم ${pageNumber}`;

    const highScore = player.playerData.page_high_scores?.[pageNumber] || 'لا توجد';
    // ملاحظة: سنضيف سجل الاختبارات لاحقاً إذا أردنا تعقيدها

    pageDetailsBody.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div>أعلى درجة</div>
                <div class="stat-value">${highScore}%</div>
            </div>
            <div class="stat-card">
                <div>الحالة</div>
                <div class="stat-value">${highScore === 100 ? 'متقنة' : 'تحتاج للمراجعة'}</div>
            </div>
        </div>
    `;
    
    // ربط زر الاختبار
    pageDetailsTestBtn.onclick = () => {
        togglePageDetailsModal(false);
        // الانتقال إلى تبويب الاختبار وتحديد الصفحة
        ui.showTab('test-tab');
        const pageSelect = document.getElementById('pageSelect');
        if (pageSelect) {
            pageSelect.value = pageNumber;
            ui.showToast(`تم تحديد صفحة ${pageNumber}. ابدأ اختبارك!`, 'info');
        }
    };

    togglePageDetailsModal(true);
}

// --- دالة عرض الخريطة المحلية (محدثة بالكامل) ---
function showLocalMap(locationId) {
    const location = mapLocations[locationId];
    if (!location) return;

    localMapTitle.textContent = location.name;
    localMapContainer.innerHTML = '';

    const ownedPages = player.playerData.inventory
        .filter(id => id.startsWith('page_'))
        .map(id => parseInt(id.replace('page_', ''), 10));
    
    const highScores = player.playerData.page_high_scores || {};

    location.pages.forEach(pageNumber => {
        const dot = document.createElement('div');
        dot.className = 'page-dot';
        dot.textContent = pageNumber;

        const isOwned = ownedPages.includes(pageNumber);
        const isMastered = highScores[pageNumber] === 100;

        if (isMastered) {
            dot.classList.add('mastered');
            dot.title = `صفحة ${pageNumber} (متقنة)`;
            dot.addEventListener('click', () => showPageDetails(pageNumber));
        } else if (isOwned) {
            dot.classList.add('owned');
            dot.title = `صفحة ${pageNumber} (مملوكة)`;
            dot.addEventListener('click', () => {
                // عند النقر على صفحة مملوكة، نذهب مباشرة للاختبار
                toggleLocalMapModal(false);
                ui.showTab('test-tab');
                const pageSelect = document.getElementById('pageSelect');
                if (pageSelect) {
                    pageSelect.value = pageNumber;
                    ui.showToast(`تم تحديد صفحة ${pageNumber}. ابدأ اختبارك!`, 'info');
                }
            });
        } else {
            dot.classList.add('locked');
            dot.title = `صفحة ${pageNumber} (غير مملوكة)`;
            dot.addEventListener('click', () => {
                // عند النقر على صفحة مقفلة، نذهب للمتجر
                toggleLocalMapModal(false);
                ui.showTab('store-tab');
                ui.showToast('يمكنك شراء صفحات جديدة من المتجر.', 'info');
            });
        }
        
        localMapContainer.appendChild(dot);
    });

    toggleLocalMapModal(true);
}

// --- دالة رسم مواقع الخريطة الرئيسية (محدثة) ---
export function renderMapLocations() {
    if (!mapContainer) return;
    mapContainer.innerHTML = '';

    for (const key in mapLocations) {
        const location = mapLocations[key];
        
        const locationDiv = document.createElement('div');
        locationDiv.className = `map-location ${location.type}`;
        locationDiv.style.top = location.top;
        locationDiv.style.left = location.left;
        locationDiv.dataset.locationId = location.id;
        locationDiv.title = location.name;

        locationDiv.addEventListener('click', () => {
            showLocalMap(location.id);
        });

        mapContainer.appendChild(locationDiv);
    }
}

// --- إضافة أحداث الإغلاق للنوافذ ---
localMapCloseBtn.addEventListener('click', () => toggleLocalMapModal(false));
pageDetailsCloseBtn.addEventListener('click', () => togglePageDetailsModal(false));
