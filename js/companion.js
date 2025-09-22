// =============================================================
// ==      وحدة نظام رفيق الحفظ (companion.js)
// =============================================================

import { companionConfig } from './companion-config.js';
import * as player from './player.js';
import * as ui from './ui.js';

let currentStageName = '';

/**
 * دالة تهيئة بسيطة للنظام.
 */
export function initializeCompanionSystem() {
    console.log("تم تهيئة نظام رفيق الحفظ.");
}

/**
 * تحدد المرحلة الحالية للرفيق بناءً على مستوى اللاعب.
 * @param {number} playerLevel - مستوى اللاعب الحالي.
 * @returns {object} - كائن يحتوي على بيانات المرحلة الحالية للرفيق.
 */
function getCurrentCompanionStage(playerLevel) {
    let currentStage = companionConfig.stage1; // المرحلة الافتراضية
    // البحث عن أعلى مرحلة وصل إليها اللاعب
    for (const key in companionConfig) {
        if (playerLevel >= companionConfig[key].level_required) {
            currentStage = companionConfig[key];
        }
    }
    return currentStage;
}

/**
 * تتحقق مما إذا كان الرفيق قد تطور عند تسجيل الدخول أو بعد رفع المستوى.
 * @param {number} playerLevel - مستوى اللاعب الحالي.
 */
export function checkForCompanionEvolution(playerLevel) {
    const newStage = getCurrentCompanionStage(playerLevel);
    
    // إذا كان اسم المرحلة الجديدة مختلفًا عن المرحلة المسجلة، فهذا يعني حدوث تطور
    if (newStage.name !== currentStageName) {
        console.log(`تطور الرفيق! من "${currentStageName}" إلى "${newStage.name}"`);
        
        // عرض إشعار التطور (فقط إذا لم تكن هذه هي المرة الأولى عند تسجيل الدخول)
        if (currentStageName !== '') {
            ui.showToast(`تهانينا! لقد تطور رفيقك إلى: ${newStage.name}`, 'success');
        }
        
        // تحديث المرحلة الحالية ورسم الرفيق في الواجهة
        currentStageName = newStage.name;
        ui.renderCompanion(newStage);
    }
}
