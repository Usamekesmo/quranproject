// js/map-config.js (النسخة الكاملة للأجزاء الثلاثين)

// دالة مساعدة لإنشاء مصفوفة صفحات الجزء
function getJuzPages(juzNumber) {
    // كل جزء تقريباً 20 صفحة. هذه معادلة تقريبية.
    // الجزء الأول يبدأ من صفحة 2.
    const startPage = (juzNumber - 1) * 20 + 2;
    const pages = [];
    // الجزء 30 له عدد صفحات مختلف قليلاً
    const pageCount = (juzNumber === 30) ? 23 : 20;
    for (let i = 0; i < pageCount; i++) {
        // نتوقف عند صفحة 604
        if (startPage + i <= 604) {
            pages.push(startPage + i);
        }
    }
    return pages;
}

export const mapLocations = {
    // الأجزاء من 1 إلى 10 (الشمال والوسط)
    juz_1:  { id: 'juz_1',  name: 'الجزء الأول',  type: 'capital', top: '15%', left: '55%', pages: getJuzPages(1) },
    juz_2:  { id: 'juz_2',  name: 'الجزء الثاني',  type: 'city',    top: '20%', left: '45%', pages: getJuzPages(2) },
    juz_3:  { id: 'juz_3',  name: 'الجزء الثالث',  type: 'city',    top: '25%', left: '60%', pages: getJuzPages(3) },
    juz_4:  { id: 'juz_4',  name: 'الجزء الرابع',  type: 'city',    top: '22%', left: '75%', pages: getJuzPages(4) },
    juz_5:  { id: 'juz_5',  name: 'الجزء الخامس',  type: 'city',    top: '30%', left: '35%', pages: getJuzPages(5) },
    juz_6:  { id: 'juz_6',  name: 'الجزء السادس',  type: 'city',    top: '35%', left: '50%', pages: getJuzPages(6) },
    juz_7:  { id: 'juz_7',  name: 'الجزء السابع',  type: 'city',    top: '33%', left: '68%', pages: getJuzPages(7) },
    juz_8:  { id: 'juz_8',  name: 'الجزء الثامن',  type: 'city',    top: '40%', left: '42%', pages: getJuzPages(8) },
    juz_9:  { id: 'juz_9',  name: 'الجزء التاسع',  type: 'city',    top: '45%', left: '58%', pages: getJuzPages(9) },
    juz_10: { id: 'juz_10', name: 'الجزء العاشر',  type: 'city',    top: '42%', left: '80%', pages: getJuzPages(10) },

    // الأجزاء من 11 إلى 20 (الوسط)
    juz_11: { id: 'juz_11', name: 'الجزء 11', type: 'city', top: '50%', left: '30%', pages: getJuzPages(11) },
    juz_12: { id: 'juz_12', name: 'الجزء 12', type: 'city', top: '55%', left: '48%', pages: getJuzPages(12) },
    juz_13: { id: 'juz_13', name: 'الجزء 13', type: 'city', top: '58%', left: '65%', pages: getJuzPages(13) },
    juz_14: { id: 'juz_14', name: 'الجزء 14', type: 'city', top: '53%', left: '78%', pages: getJuzPages(14) },
    juz_15: { id: 'juz_15', name: 'الجزء 15', type: 'city', top: '62%', left: '38%', pages: getJuzPages(15) },
    juz_16: { id: 'juz_16', name: 'الجزء 16', type: 'city', top: '65%', left: '55%', pages: getJuzPages(16) },
    juz_17: { id: 'juz_17', name: 'الجزء 17', type: 'city', top: '68%', left: '72%', pages: getJuzPages(17) },
    juz_18: { id: 'juz_18', name: 'الجزء 18', type: 'city', top: '72%', left: '45%', pages: getJuzPages(18) },
    juz_19: { id: 'juz_19', name: 'الجزء 19', type: 'city', top: '75%', left: '60%', pages: getJuzPages(19) },
    juz_20: { id: 'juz_20', name: 'الجزء 20', type: 'city', top: '70%', left: '28%', pages: getJuzPages(20) },

    // الأجزاء من 21 إلى 30 (الجنوب)
    juz_21: { id: 'juz_21', name: 'الجزء 21', type: 'city', top: '80%', left: '35%', pages: getJuzPages(21) },
    juz_22: { id: 'juz_22', name: 'الجزء 22', type: 'city', top: '83%', left: '50%', pages: getJuzPages(22) },
    juz_23: { id: 'juz_23', name: 'الجزء 23', type: 'city', top: '81%', left: '65%', pages: getJuzPages(23) },
    juz_24: { id: 'juz_24', name: 'الجزء 24', type: 'city', top: '87%', left: '42%', pages: getJuzPages(24) },
    juz_25: { id: 'juz_25', name: 'الجزء 25', type: 'city', top: '88%', left: '58%', pages: getJuzPages(25) },
    juz_26: { id: 'juz_26', name: 'الجزء 26', type: 'city', top: '92%', left: '30%', pages: getJuzPages(26) },
    juz_27: { id: 'juz_27', name: 'الجزء 27', type: 'city', top: '94%', left: '48%', pages: getJuzPages(27) },
    juz_28: { id: 'juz_28', name: 'الجزء 28', type: 'city', top: '93%', left: '68%', pages: getJuzPages(28) },
    juz_29: { id: 'juz_29', name: 'الجزء 29', type: 'city', top: '78%', left: '75%', pages: getJuzPages(29) },
    juz_30: { id: 'juz_30', name: 'الجزء 30', type: 'city', top: '90%', left: '55%', pages: getJuzPages(30) },
};
