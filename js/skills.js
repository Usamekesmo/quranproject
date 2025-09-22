// =============================================================
// ==      وحدة نظام شجرة المهارات (skills.js)
// =============================================================

import { skillTreeConfig } from './skill-tree-config.js';
import * as player from './player.js';
import * as ui from './ui.js';

/**
 * محاولة فتح مهارة جديدة.
 * @param {string} skillId - معرف المهارة المراد فتحها.
 * @returns {Promise<{success: boolean, message: string}>} - نتيجة العملية.
 */
export async function unlockSkill(skillId) {
    const skill = skillTreeConfig[skillId];
    if (!skill) {
        return { success: false, message: "المهارة غير موجودة." };
    }

    // 1. التحقق من نقاط المهارة
    if (player.playerData.skill_points < skill.cost) {
        return { success: false, message: "ليس لديك نقاط مهارة كافية." };
    }

    // 2. التحقق من المتطلبات (المهارات السابقة)
    for (const depId of skill.dependencies) {
        if (!player.playerData.unlocked_skills.includes(depId)) {
            const requiredSkill = skillTreeConfig[depId];
            return { success: false, message: `يجب فتح مهارة "${requiredSkill.name}" أولاً.` };
        }
    }

    // 3. خصم التكلفة وإضافة المهارة
    player.playerData.skill_points -= skill.cost;
    player.playerData.unlocked_skills.push(skillId);

    // 4. حفظ بيانات اللاعب
    await player.savePlayer();

    // 5. تحديث الواجهة
    ui.updatePlayerHeader(player.playerData, ui.getLevelInfo(player.playerData.xp));

    return { success: true, message: `تهانينا! لقد فتحت مهارة: ${skill.name}` };
}

/**
 * الحصول على قيمة تأثير مهارة معينة إذا كانت مفتوحة.
 * @param {string} effectType - نوع التأثير المطلوب (مثل 'xp_modifier').
 * @returns {number} - قيمة التأثير أو القيمة الافتراضية (0 أو 1).
 */
export function getSkillEffect(effectType) {
    let totalValue = 0;
    
    if (!player.playerData.unlocked_skills) {
        return 0;
    }

    for (const skillId of player.playerData.unlocked_skills) {
        const skill = skillTreeConfig[skillId];
        if (skill && skill.effect && skill.effect.type === effectType) {
            totalValue += skill.effect.value;
        }
    }
    
    return totalValue;
}

/**
 * تطبيق التأثيرات التي تحدث مرة واحدة عند تسجيل الدخول.
 */
export function applySkillBonusesOnLogin() {
    // مثال: مهارة زيادة عدد المحاولات اليومية
    const extraAttempts = getSkillEffect('extra_daily_attempt');
    if (extraAttempts > 0) {
        // هذا المنطق يجب أن يتم دمجه مع منطق إعادة التعيين اليومي في main.js
        // للتأكد من أن العدد الإجمالي للمحاولات هو 3 + قيمة المهارة.
        console.log(`تأثير المهارة: تم تطبيق ${extraAttempts} محاولة إضافية.`);
    }
}
