// =============================================================
// ==      وحدة المهام (quests.js) - نسخة كاملة ونهائية
// =============================================================

import * as api from './api.js';
import * as player from './player.js';
import * as ui from './ui.js';
import * as progression from './progression.js';
import { subscribe } from './eventBus.js';

let activeQuests = [];

/**
 * دالة التهيئة، تستقبل المهام اليومية وتشترك في الأحداث.
 * @param {Array} quests - مصفوفة المهام اليومية للاعب.
 */
export function initialize(quests) {
    activeQuests = quests.filter(q => q.quests_config) || [];
    console.log(`تم تهيئة ${activeQuests.length} مهمة يومية.`);
    
    // سطر تشخيصي مهم لعرض بيانات المهام عند التحميل
    console.log('Active quests on initialize:', JSON.stringify(activeQuests, null, 2));

    // الاشتراك في جميع الأحداث التي قد تؤثر على المهام
    subscribe('quiz_completed', (data) => handleEvent('quiz_completed', data));
    subscribe('perfect_quiz', (data) => handleEvent('perfect_quiz', data));
    subscribe('question_answered_correctly', (data) => handleEvent('question_answered_correctly', data));
    subscribe('item_purchased', (data) => handleEvent('item_purchased', data));
    subscribe('friend_added', (data) => handleEvent('friend_added', data));
    subscribe('level_up', (data) => handleEvent('level_up', data));
    subscribe('energy_star_used', (data) => handleEvent('energy_star_used', data));
}

/**
 * دالة مركزية لمعالجة جميع الأحداث وتحديث المهام.
 * @param {string} eventType - نوع الحدث الذي وقع.
 * @param {object} eventData - البيانات المرفقة مع الحدث.
 */
function handleEvent(eventType, eventData) {
    const updates = [];
    const value = eventData?.amount || 1;

    activeQuests.forEach(q => {
        if (q && q.id && !q.is_completed && q.quests_config && q.quests_config.type === eventType) {
            q.progress = Math.min(q.quests_config.target_value, q.progress + value);
            updates.push({ id: q.id, progress: q.progress });
        }
    });

    if (updates.length > 0) {
        console.log(`[EventBus] تحديث ${updates.length} مهمة من نوع: ${eventType}`);
        api.updatePlayerQuests(updates);
        if (document.getElementById('quests-tab')?.classList.contains('active')) {
            renderQuests();
        }
    }
}

/**
 * تعرض المهام في واجهة المستخدم.
 */
export function renderQuests() {
    const container = document.getElementById('quests-container');
    if (!container) return;

    if (!activeQuests || activeQuests.length === 0) {
        container.innerHTML = '<p>لا توجد مهام متاحة حاليًا. عد غدًا لمهام جديدة!</p>';
        return;
    }

    container.innerHTML = activeQuests.map(playerQuest => {
        const questConfig = playerQuest.quests_config;
        if (!questConfig) return ''; // تجنب الأخطاء إذا كانت بيانات المهمة غير مكتملة

        const isReadyToClaim = playerQuest.progress >= questConfig.target_value && !playerQuest.is_completed;
        const isClaimed = playerQuest.is_completed;

        let buttonHTML = '';
        if (isClaimed) {
            buttonHTML = `<button class="claim-button" disabled>تمت المطالبة</button>`;
        } else if (isReadyToClaim) {
            buttonHTML = `<button class="claim-button" data-quest-id="${playerQuest.id}">مطالبة</button>`;
        } else {
            buttonHTML = `<button class="claim-button" disabled>مستمر</button>`;
        }

        const progressPercentage = Math.min(100, (playerQuest.progress / questConfig.target_value) * 100);
        
        return `
            <div class="quest-card ${isClaimed ? 'completed' : ''}">
                <div class="quest-info">
                    <h4>${questConfig.title}</h4>
                    <p>${questConfig.description}</p>
                    <div class="quest-progress-bar-container">
                        <div class="quest-progress-bar" style="width: ${progressPercentage}%;"></div>
                    </div>
                    <span class="quest-progress-text">${playerQuest.progress} / ${questConfig.target_value}</span>
                </div>
                <div class="quest-reward">
                    ${buttonHTML}
                     <p>+${questConfig.xp_reward} XP, +${questConfig.diamonds_reward} 💎</p>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * تعالج عملية المطالبة بمكافأة المهمة.
 */
export async function handleClaimReward(event) {
    const button = event.target;
    const questId = parseInt(button.dataset.questId, 10);
    const questToClaim = activeQuests.find(q => q.id === questId);

    if (!questToClaim || questToClaim.is_completed || questToClaim.progress < questToClaim.quests_config.target_value) {
        ui.showToast("لا يمكنك المطالبة بهذه الجائزة.", "error");
        return;
    }

    button.disabled = true;
    button.textContent = 'جاري...';

    try {
        const questConfig = questToClaim.quests_config;
        
        // إرسال طلب لتحديث حالة المهمة في قاعدة البيانات
        await api.updatePlayerQuests([{ id: questToClaim.id, progress: questToClaim.progress, is_completed: true }]);

        // تحديث بيانات اللاعب محلياً
        player.playerData.xp += questConfig.xp_reward;
        player.playerData.diamonds += questConfig.diamonds_reward;
        player.playerData.seasonal_xp = (player.playerData.seasonal_xp || 0) + questConfig.xp_reward;

        // ▼▼▼ هذا هو التعديل المهم لمنع تكرار المطالبة في نفس الجلسة ▼▼▼
        // نقوم بإزالة المهمة من المصفوفة المحلية فوراً بعد المطالبة بها.
        activeQuests = activeQuests.filter(q => q.id !== questId);
        // ▲▲▲ نهاية التعديل ▲▲▲
        
        // حفظ بيانات اللاعب المحدثة (الخبرة والألماس)
        await player.savePlayer();

        ui.showToast(`تمت المطالبة بمكافأة: "${questConfig.title}"!`, "success");
        
        // تحديث واجهة المستخدم بالبيانات الجديدة
        const levelInfo = progression.getLevelInfo(player.playerData.xp);
        ui.updatePlayerHeader(player.playerData, levelInfo);
        
        // إعادة رسم المهام، والتي ستعرض الآن القائمة بدون المهمة التي تمت المطالبة بها
        renderQuests(); 

    } catch (error) {
        ui.showToast("حدث خطأ أثناء المطالبة. يرجى المحاولة مرة أخرى.", "error");
        button.disabled = false;
        button.textContent = 'مطالبة';
    }
}
