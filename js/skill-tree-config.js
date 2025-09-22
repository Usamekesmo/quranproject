// =============================================================
// ==      ملف إعدادات شجرة المهارات (skill-tree-config.js)
// =============================================================

export const skillTreeConfig = {
    // --- المسار الأول: مسار الحكمة (زيادة المكافآت) ---
    'xp_boost_1': {
        id: 'xp_boost_1',
        name: 'حكمة الحافظ',
        description: 'زيادة الخبرة المكتسبة من كل إجابة صحيحة بنسبة 10%.',
        cost: 1,
        icon: '🧠',
        dependencies: [], // لا يوجد متطلبات
        effect: { type: 'xp_modifier', value: 0.10 }
    },
    'xp_boost_2': {
        id: 'xp_boost_2',
        name: 'بركة العلم',
        description: 'زيادة الخبرة المكتسبة من كل إجابة صحيحة بنسبة 20% إضافية.',
        cost: 2,
        icon: '📚',
        dependencies: ['xp_boost_1'],
        effect: { type: 'xp_modifier', value: 0.20 }
    },
    'diamond_boost_1': {
        id: 'diamond_boost_1',
        name: 'كنز المعرفة',
        description: 'فرصة 5% للحصول على ألماسة إضافية عند إكمال اختبار.',
        cost: 3,
        icon: '💎',
        dependencies: ['xp_boost_2'],
        effect: { type: 'bonus_diamond_chance', value: 0.05 }
    },

    // --- المسار الثاني: مسار الإتقان (تحسين الاختبارات) ---
    'perfect_bonus_1': {
        id: 'perfect_bonus_1',
        name: 'نور الإتقان',
        description: 'زيادة مكافأة الخبرة للاختبار المتقن (100%) بمقدار 25 نقطة.',
        cost: 1,
        icon: '✨',
        dependencies: [],
        effect: { type: 'perfect_bonus_xp', value: 25 }
    },
    'extra_attempt_1': {
        id: 'extra_attempt_1',
        name: 'نَفَسٌ إضافي',
        description: 'الحصول على محاولة اختبار يومية إضافية (تصبح 4 بدلاً من 3).',
        cost: 2,
        icon: '🔄',
        dependencies: ['perfect_bonus_1'],
        effect: { type: 'extra_daily_attempt', value: 1 }
    },
    'error_forgiveness_1': {
        id: 'error_forgiveness_1',
        name: 'فرصة ثانية',
        description: 'في كل اختبار، يتم التغاضي عن أول خطأ ولا يتم احتسابه.',
        cost: 3,
        icon: '❤️',
        dependencies: ['extra_attempt_1'],
        effect: { type: 'error_forgiveness', value: 1 }
    },

    // --- المسار الثالث: مسار الاجتماعية (تعزيز القبيلة والأصدقاء) ---
    'clan_raid_boost_1': {
        id: 'clan_raid_boost_1',
        name: 'همة القبيلة',
        description: 'مساهمتك في غزوات القبيلة تحتسب مرتين (تضيف نقطتين بدلاً من واحدة).',
        cost: 2,
        icon: '🛡️',
        dependencies: [],
        effect: { type: 'clan_raid_contribution_multiplier', value: 2 }
    },
    'duel_reward_boost_1': {
        id: 'duel_reward_boost_1',
        name: 'شرف المبارزة',
        description: 'الحصول على 10 نقاط خبرة إضافية عند الفوز في مبارزة.',
        cost: 2,
        icon: '⚔️',
        dependencies: ['clan_raid_boost_1'],
        effect: { type: 'duel_win_bonus_xp', value: 10 }
    }
};
