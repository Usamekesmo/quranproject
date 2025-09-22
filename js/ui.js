// ====================================================================
// ==      وحدة واجهة المستخدم (ui.js) - النسخة النهائية الكاملة
// ==      تتضمن دوال عرض جميع الميزات الجديدة
// ====================================================================

import { skillTreeConfig } from './skill-tree-config.js';
import * as player from './player.js';

// --- تعريف عناصر واجهة المستخدم (DOM Elements) ---
export const startScreen = document.getElementById('start-screen');
export const mainInterface = document.getElementById('main-interface');
export const quizScreen = document.getElementById('quiz-screen');
export const errorReviewScreen = document.getElementById('error-review-screen');
export const resultScreen = document.getElementById('result-screen');
export const loader = document.getElementById('loader');
export const playerInfoHeader = document.getElementById('player-info-header');
export const pageSelect = document.getElementById('pageSelect');
export const qariSelect = document.getElementById('qariSelect');
export const questionsCountSelect = document.getElementById('questionsCount');
export const leaderboardList = document.getElementById('leaderboard-list');
export const progressCounter = document.getElementById('progress-counter');
export const progressBar = document.getElementById('progress-bar');
export const questionArea = document.getElementById('question-area');
export const feedbackArea = document.getElementById('feedback-area');
export const errorListDiv = document.getElementById('error-list');
export const showFinalResultButton = document.getElementById('show-final-result-button');
export const resultNameSpan = document.getElementById('resultName');
export const finalScoreSpan = document.getElementById('finalScore');
export const xpGainedSpan = document.getElementById('xpGained');
export const levelUpMessage = document.getElementById('level-up-message');
export const saveStatus = document.getElementById('save-status');
export const reloadButton = document.getElementById('reloadButton');
export const achievementToast = document.getElementById('achievement-toast');
export const toastNotification = document.getElementById('toast-notification');
export const modalOverlay = document.getElementById('item-details-modal');
export const modalBody = document.getElementById('modal-body');
export const modalBuyButton = document.getElementById('modal-buy-button');
export const specialChallengesContainer = document.getElementById('special-challenges-container');
export const companionContainer = document.getElementById('companion-container');
export const skillTreeContainer = document.getElementById('skill-tree-container');
export const duelsContainer = document.getElementById('duels-container');
export const duelFriendSelect = document.getElementById('duel-friend-select');
export const duelPageSelect = document.getElementById('duel-page-select');


// --- دوال التحكم في الواجهة ---

export function showScreen(screenToShow) {
    [startScreen, mainInterface, quizScreen, errorReviewScreen, resultScreen].forEach(s => {
        if (s) s.classList.add('hidden');
    });
    if (screenToShow) screenToShow.classList.remove('hidden');
}

export function showTab(tabIdToShow) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    const activeTabContent = document.getElementById(tabIdToShow);
    const activeTabButton = document.querySelector(`.tab-button[data-tab="${tabIdToShow}"]`);

    if (activeTabContent) {
        activeTabContent.classList.remove('hidden');
    }
    if (activeTabButton) {
        activeTabButton.classList.add('active');
    }
}

export function toggleLoader(show) {
    if (loader) loader.classList.toggle('hidden', !show);
}

export function updatePlayerHeader(playerData, levelInfo) {
    if (!playerInfoHeader) return;

    const testAttempts = playerData.test_attempts || 0;
    const energyStars = playerData.energy_stars || 0;
    const skillPoints = playerData.skill_points || 0;
    
    const displayName = playerData.equipped_title 
        ? `${playerData.username} <span class="equipped-title">(${playerData.equipped_title})</span>`
        : playerData.username;

    playerInfoHeader.innerHTML = `
        <div class="player-stats-grid">
            <span>مرحباً, <strong>${displayName}</strong>!</span>
            <span>المستوى: ${levelInfo.level} (${levelInfo.title})</span>
            <span>الخبرة: ${playerData.xp} XP</span>
            <span>الألماس: ${playerData.diamonds} 💎</span>
            <span>نقاط المهارة: ${skillPoints} 🧠</span>
            <span>المحاولات اليومية: ${testAttempts} 🔄</span>
            <span>نجوم الطاقة: ${energyStars} ⭐</span>
        </div>
    `;
}

export function populateQariSelect(selectElement, inventory) {
    if (!selectElement) return;
    selectElement.innerHTML = '';
    const defaultQari = { value: 'ar.alafasy', text: 'مشاري العفاسي' };
    const optionDefault = document.createElement('option');
    optionDefault.value = defaultQari.value;
    optionDefault.textContent = defaultQari.text;
    selectElement.appendChild(optionDefault);

    const purchasableQaris = [
        { id: 'qari_minshawi', value: 'ar.minshawi', text: 'محمد صديق المنشاوي' },
        { id: 'qari_husary', value: 'ar.husary', text: 'محمود خليل الحصري' },
        { id: 'qari_sudais', value: 'ar.sudais', text: 'عبد الرحمن السديس' },
    ];

    purchasableQaris.forEach(q => {
        if (inventory.includes(q.id)) {
            const option = document.createElement('option');
            option.value = q.value;
            option.textContent = `${q.text} (تم شراؤه)`;
            selectElement.appendChild(option);
        }
    });
}

export function updateQuestionsCountOptions(maxQuestions) {
    if (!questionsCountSelect) return;
    const currentValue = questionsCountSelect.value;
    questionsCountSelect.innerHTML = '';
    for (let i = 5; i <= maxQuestions; i += (i < 10 ? 1 : 5)) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} أسئلة`;
        questionsCountSelect.appendChild(option);
    }
    questionsCountSelect.value = currentValue;
    if (!questionsCountSelect.value && questionsCountSelect.options.length > 0) {
        questionsCountSelect.options[questionsCountSelect.options.length - 1].selected = true;
    }
}

export function updateProgress(current, total) {
    if (progressCounter) progressCounter.textContent = `السؤال ${current} من ${total}`;
    if (progressBar) {
        const percentage = total > 0 ? (current / total) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
}

export function disableQuestionInteraction() {
    if (questionArea) {
        questionArea.querySelectorAll('button, .choice-box, .option-div').forEach(el => {
            el.style.pointerEvents = 'none';
        });
    }
}

export function markAnswer(element, isCorrect) {
    if (element) {
        element.classList.add(isCorrect ? 'correct-answer' : 'wrong-answer');
    }
}

export function showFeedback(isCorrect, correctAnswerText) {
    if (!feedbackArea) return;
    feedbackArea.classList.remove('hidden', 'correct-answer', 'wrong-answer');
    if (isCorrect) {
        feedbackArea.textContent = 'إجابة صحيحة! أحسنت.';
        feedbackArea.classList.add('correct-answer');
    } else {
        feedbackArea.innerHTML = `إجابة خاطئة. الإجابة الصحيحة هي: <strong>${correctAnswerText}</strong>`;
        feedbackArea.classList.add('wrong-answer');
    }
}

export function displayLeaderboard(leaderboardData, key = 'xp') {
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '';
    if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardList.innerHTML = '<p>لا توجد بيانات لعرضها حاليًا.</p>';
        return;
    }
    leaderboardData.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';

        const displayName = player.equipped_title
            ? `${player.username} <span class="equipped-title-leaderboard">(${player.equipped_title})</span>`
            : player.username;

        item.innerHTML = `<span class="leaderboard-rank">${index + 1}</span><span class="leaderboard-name">${displayName}</span><span class="leaderboard-xp">${player[key]} XP</span>`;
        leaderboardList.appendChild(item);
    });
}

export function displayFinalResult(quizState, levelUpInfo) {
    if (resultNameSpan) resultNameSpan.textContent = quizState.userName;
    if (finalScoreSpan) finalScoreSpan.textContent = `${quizState.score} / ${quizState.totalQuestions}`;
    if (xpGainedSpan) xpGainedSpan.textContent = quizState.xpEarned;
    if (levelUpMessage) {
        if (levelUpInfo) {
            levelUpMessage.innerHTML = `🎉 تهانينا! لقد ارتقيت إلى المستوى ${levelUpInfo.level} (${levelUpInfo.title}) وكسبت ${levelUpInfo.reward} ألماسة!`;
            levelUpMessage.classList.remove('hidden');
        } else {
            levelUpMessage.classList.add('hidden');
        }
    }
    updateSaveMessage(true);
    showScreen(resultScreen);
}

export function displayErrorReview(errorLog) {
    if (!errorListDiv) return;
    errorListDiv.innerHTML = errorLog.map(error => `
        <div class="error-review-item">
            <h4>السؤال الذي أخطأت فيه:</h4>
            <div class="question-content-review">${error.questionHTML}</div>
            <hr>
            <p><strong>الإجابة الصحيحة كانت:</strong> <span class="correct-text">${error.correctAnswer}</span></p>
        </div>
    `).join('');
    errorListDiv.querySelectorAll('audio, button').forEach(el => {
        el.setAttribute('disabled', 'true');
        el.style.pointerEvents = 'none';
    });
    showScreen(errorReviewScreen);
}

export function updateSaveMessage(isSaved) {
    if (!saveStatus) return;
    saveStatus.textContent = isSaved ? 'تم حفظ تقدمك بنجاح!' : 'جاري حفظ تقدمك...';
    saveStatus.style.color = isSaved ? '#004d40' : '#555';
}

export function showAchievementToast(achievement) {
    if (!achievementToast) return;
    const achievementToastName = document.getElementById('achievement-toast-name');
    const achievementToastReward = document.getElementById('achievement-toast-reward');
    if (achievementToastName) achievementToastName.textContent = achievement.name;
    if (achievementToastReward) achievementToastReward.textContent = `+${achievement.xp_reward} XP, +${achievement.diamonds_reward} 💎`;
    achievementToast.classList.add('show');
    setTimeout(() => achievementToast.classList.remove('show'), 4000);
}

export function showToast(message, type = 'info') {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.className = `toast-notification show ${type}`;
    setTimeout(() => toastNotification.classList.remove('show'), 3000);
}

export function showModal(show, item = null, currentPlayerData = null) {
    if (!modalOverlay) return;
    if (show && item && currentPlayerData) {
        modalBody.innerHTML = `
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="item-price">السعر: ${item.price} ${item.type === 'exchange' ? 'XP' : '💎'}</p>
        `;
        if (modalBuyButton) {
            modalBuyButton.dataset.itemId = item.id;
            const canAfford = (item.type === 'exchange') ? currentPlayerData.xp >= item.price : currentPlayerData.diamonds >= item.price;
            modalBuyButton.disabled = !canAfford;
            modalBuyButton.textContent = canAfford ? 'تأكيد الشراء' : 'رصيدك غير كافٍ';
        }
        modalOverlay.classList.remove('hidden');
    } else {
        modalOverlay.classList.add('hidden');
    }
}

export function renderPlayerStats(stats) {
    const container = document.getElementById('profile-stats-container');
    if (!container) return;

    const playTimeMinutes = Math.floor((stats.total_play_time_seconds || 0) / 60);
    const correctAnswers = stats.total_correct_answers || 0;
    const totalQuestions = stats.total_questions_answered || 1;
    const accuracy = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    let titlesHTML = '<h3>الألقاب</h3>';
    if (stats.titles && stats.titles.length > 0) {
        titlesHTML += '<p>اختر لقباً ليظهر بجانب اسمك في لوحة الصدارة.</p>';
        titlesHTML += '<select id="title-select" class="title-selector">';
        titlesHTML += `<option value="">-- بدون لقب --</option>`;
        stats.titles.forEach(title => {
            const isSelected = (title === stats.equipped_title) ? 'selected' : '';
            titlesHTML += `<option value="${title}" ${isSelected}>${title}</option>`;
        });
        titlesHTML += '</select>';
    } else {
        titlesHTML += '<p>لم تفز بأي ألقاب بعد. نافس في المواسم القادمة للحصول عليها!</p>';
    }

    container.innerHTML = `
        <div id="companion-container"></div>
        <hr>
        <div class="stats-grid">
            <div class="stat-card">
                <div>الاختبارات المكتملة</div>
                <div class="stat-value">${stats.total_quizzes_completed || 0}</div>
            </div>
            <div class="stat-card">
                <div>إجمالي وقت اللعب (دقائق)</div>
                <div class="stat-value">${playTimeMinutes}</div>
            </div>
            <div class="stat-card">
                <div>مجموع الإجابات الصحيحة</div>
                <div class="stat-value">${correctAnswers}</div>
            </div>
            <div class="stat-card">
                <div>نسبة الدقة</div>
                <div class="stat-value">${accuracy}%</div>
            </div>
        </div>
        <hr>
        <div class="titles-section">
            ${titlesHTML}
        </div>
    `;
}

export function renderSpecialChallenges(challenges, playerProgress) {
    if (!specialChallengesContainer) return;

    let challengesOnlyContainer = document.getElementById('challenges-only-container');
    if (!challengesOnlyContainer) {
        challengesOnlyContainer = document.createElement('div');
        challengesOnlyContainer.id = 'challenges-only-container';
        specialChallengesContainer.appendChild(challengesOnlyContainer);
    }

    if (!challenges || challenges.length === 0) {
        challengesOnlyContainer.innerHTML = '<h3>التحديات الخاصة</h3><p>لا توجد تحديات خاصة متاحة حاليًا.</p>';
        return;
    }

    challengesOnlyContainer.innerHTML = '<h3>التحديات الخاصة</h3>' + challenges.map(challenge => {
        const progress = playerProgress.find(p => p.challenge_id === challenge.id) || { progress: 0, is_completed: false, is_claimed: false };
        const targetCount = challenge.target_value.count || 1;
        const progressPercentage = Math.min(100, (progress.progress / targetCount) * 100);
        let buttonHTML = '';
        if (progress.is_claimed) {
            buttonHTML = `<button class="claim-challenge-button" disabled>تمت المطالبة</button>`;
        } else if (progress.is_completed) {
            buttonHTML = `<button class="claim-challenge-button" data-challenge-id="${challenge.id}">المطالبة بالمكافأة</button>`;
        } else {
            buttonHTML = `<button class="claim-challenge-button" disabled>مستمر</button>`;
        }
        const endDate = new Date(challenge.end_date);
        const now = new Date();
        const diff = endDate - now;
        let timeLeft = 'انتهى الوقت';
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            timeLeft = `${days} يوم و ${hours} ساعة`;
        }
        return `
            <div class="quest-card ${progress.is_completed ? 'completed' : ''}">
                <div class="quest-info">
                    <h4>${challenge.title} <span style="font-size: 0.8em; color: #e53935;">(متبقٍ: ${timeLeft})</span></h4>
                    <p>${challenge.description}</p>
                    <div class="quest-progress-bar-container">
                        <div class="quest-progress-bar" style="width: ${progressPercentage}%;"></div>
                    </div>
                    <span class="quest-progress-text">${progress.progress} / ${targetCount}</span>
                </div>
                <div class="quest-reward">
                    ${buttonHTML}
                    <p>+${challenge.reward_xp} XP, +${challenge.reward_diamonds} 💎</p>
                </div>
            </div>
        `;
    }).join('');
}

export function renderLiveEvents(events) {
    if (!specialChallengesContainer) return;

    let liveEventsContainer = document.getElementById('live-events-container');
    if (liveEventsContainer) liveEventsContainer.remove();
    
    liveEventsContainer = document.createElement('div');
    liveEventsContainer.id = 'live-events-container';
    
    specialChallengesContainer.appendChild(liveEventsContainer);

    let content = '<hr><h3>الأحداث المباشرة</h3>';
    if (!events || events.length === 0) {
        content += '<p>لا توجد أحداث مباشرة نشطة حاليًا.</p>';
    } else {
        content += events.map(event => {
            const endDate = new Date(event.end_date);
            const now = new Date();
            const diff = endDate - now;
            let timeLeft = 'انتهى الوقت';
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                timeLeft = `${days} يوم و ${hours} ساعة`;
            }

            return `
                <div class="quest-card live-event-card">
                    <div class="quest-info">
                        <h4><span class="live-badge">مباشر</span> ${event.title}</h4>
                        <p>${event.description}</p>
                        <p class="time-left">الوقت المتبقي: ${timeLeft}</p>
                    </div>
                    <div class="quest-reward">
                        <button class="join-event-btn button-primary" data-event-id="${event.id}">شارك الآن!</button>
                        <p>الجائزة: ${event.reward_diamonds} 💎</p>
                    </div>
                </div>
            `;
        }).join('');
    }
    liveEventsContainer.innerHTML = content;
}

export function displaySeasonInfo(seasonData, rewardsData = []) {
    const container = document.getElementById('season-info-container');
    if (!container) return;

    const endDate = new Date(seasonData.end_date);
    const now = new Date();
    const diff = endDate - now;

    let timeLeft = 'انتهى الموسم!';
    if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        timeLeft = `${days} يوم و ${hours} ساعة`;
    }

    let rewardsHTML = '<h4>جوائز الموسم:</h4><ul>';
    if (rewardsData.length > 0) {
        rewardsData.forEach(reward => {
            rewardsHTML += `<li>المركز ${reward.rank}: ${reward.diamonds_reward} 💎 + لقب "${reward.title_reward}"</li>`;
        });
    } else {
        rewardsHTML += '<li>لا توجد جوائز محددة لهذا الموسم.</li>';
    }
    rewardsHTML += '</ul>';

    container.innerHTML = `
        <h3>${seasonData.name}</h3>
        <p>الوقت المتبقي: <strong>${timeLeft}</strong></p>
        <div class="season-rewards">${rewardsHTML}</div>
    `;
}

export function renderNoClanView(container, allClans) {
    container.innerHTML = `
        <div class="clan-competition-header">
            <h3>منافسة القبائل الأسبوعية</h3>
            <p>انضم إلى قبيلة أو أسس قبيلتك الخاصة للمنافسة على جوائز قيمة!</p>
            <button id="show-clans-leaderboard-btn" class="button-secondary">عرض لوحة صدارة القبائل</button>
        </div>
        <hr>
        <h3>الانضمام إلى قبيلة</h3>
        <div id="clans-list-container">
            ${allClans.length > 0 ? allClans.map(clan => `
                <div class="friend-item">
                    <div class="friend-info">
                        <span class="friend-name">${clan.emblem} ${clan.name}</span>
                        <span class="friend-xp">الخبرة: ${clan.total_xp || 0} | الأعضاء: ${clan.member_count || 0}</span>
                    </div>
                    <div class="friend-actions">
                        <button class="join-clan-btn button-primary" data-clan-id="${clan.id}">انضمام</button>
                    </div>
                </div>
            `).join('') : '<p>لا توجد قبائل متاحة حاليًا.</p>'}
        </div>
        <hr>
        <h3>إنشاء قبيلة جديدة</h3>
        <div class="form-group">
            <input type="text" id="new-clan-name" placeholder="اسم القبيلة (مطلوب)">
            <input type="text" id="new-clan-emblem" placeholder="شعار القبيلة (مطلوب، مثال: 🛡️)">
            <textarea id="new-clan-description" placeholder="وصف قصير للقبيلة (اختياري)"></textarea>
            <button id="create-clan-btn" class="button-primary">تأسيس القبيلة</button>
        </div>
    `;
}

export function renderClanDetailsView(container, clanDetails, currentUserId, activeQuest, raidDetails, clanRaid) {
    const isOwner = clanDetails.owner_id === currentUserId;
    
    let questHTML = `<div class="clan-quest-container"><h4>المهمة الأسبوعية</h4><p>لا توجد مهمة نشطة حاليًا. انتظروا بداية الأسبوع!</p></div>`;
    if (activeQuest && activeQuest.quest) {
        const quest = activeQuest.quest;
        const progressPercentage = Math.min(100, (activeQuest.progress / quest.target_value) * 100);
        questHTML = `
            <div class="clan-quest-container ${activeQuest.is_completed ? 'completed' : ''}">
                <h4>المهمة الأسبوعية: ${quest.title}</h4>
                <p>${quest.description}</p>
                <div class="quest-progress-bar-container">
                    <div class="quest-progress-bar" style="width: ${progressPercentage}%;"></div>
                </div>
                <span class="quest-progress-text">${activeQuest.progress} / ${quest.target_value}</span>
                ${activeQuest.is_completed 
                    ? '<p class="quest-reward completed"><strong>أحسنتم!</strong> لقد أكملتم المهمة وحصلت القبيلة على نقاطها.</p>'
                    : `<p class="quest-reward">المكافأة عند الإكمال: +${quest.reward_clan_points} نقطة للقبيلة</p>`
                }
            </div>
        `;
    }

    let raidHTML = `<h3>غزوة القبيلة الأسبوعية</h3><p>لا توجد غزوة نشطة حاليًا.</p>`;
    if (raidDetails && clanRaid) {
        const currentStage = raidDetails.find(s => s.stage_order === clanRaid.current_stage);
        if (currentStage) {
            const progressPercentage = Math.min(100, (currentStage.progress.progress / currentStage.target_value) * 100);
            raidHTML = `
                <h3>غزوة القبيلة: ${currentStage.name}</h3>
                <p>${currentStage.description}</p>
                <div class="quest-progress-bar-container">
                    <div class="quest-progress-bar" style="width: ${progressPercentage}%;"></div>
                </div>
                <span class="quest-progress-text">${currentStage.progress.progress} / ${currentStage.target_value}</span>
                <p class="quest-reward">المرحلة ${clanRaid.current_stage} من ${raidDetails.length}</p>
            `;
        }
        if (clanRaid.is_completed) {
            raidHTML = `<h3>غزوة القبيلة</h3><p class="completed">تهانينا! لقد أكملت قبيلتكم الغزوة الأسبوعية بنجاح!</p>`;
        }
    }

    container.innerHTML = `
        <div class="clan-header">
            <h2><span class="clan-emblem">${clanDetails.emblem}</span> ${clanDetails.name}</h2>
            <p>${clanDetails.description || 'لا يوجد وصف.'}</p>
            <p><strong>نقاط مهام الموسم:</strong> ${clanDetails.season_quest_points || 0} نقطة</p>
            <button id="show-clans-leaderboard-btn" class="button-secondary">عرض لوحة صدارة القبائل</button>
        </div>
        <hr>
        ${raidHTML}
        <hr>
        ${questHTML} 
        <h3>أعضاء القبيلة (${clanDetails.members.length})</h3>
        <div id="clan-members-list">
            ${clanDetails.members.sort((a, b) => b.player.xp - a.player.xp).map(member => `
                <div class="friend-item ${member.player_id === currentUserId ? 'current-user' : ''}">
                    <div class="friend-info">
                        <span class="friend-name">${member.player.username} ${member.role === 'owner' ? '👑' : ''}</span>
                        <span class="friend-xp">الخبرة: ${member.player.xp}</span>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="clan-actions">
            ${isOwner ? '<button id="delete-clan-btn" class="button-danger">حذف القبيلة</button>' : ''}
            <button id="leave-clan-btn" class="button-secondary">مغادرة القبيلة</button>
        </div>
    `;
}

export function renderFriendsTab(data) {
    const container = document.getElementById('friends-container');
    if (!container) return;

    if (data.status === 'loading') {
        container.innerHTML = '<p>جاري تحميل قائمة الأصدقاء...</p>';
        return;
    }

    const { friendships, currentUserId, onlineUsers = [] } = data;
    const friends = friendships.filter(f => f.status === 'accepted');
    const pendingRequests = friendships.filter(f => f.status === 'pending' && f.user2_id === currentUserId);

    container.innerHTML = `
        <div class="friends-section">
            <h4>طلبات الصداقة (${pendingRequests.length})</h4>
            <div id="friend-requests-list">
                ${pendingRequests.length > 0 ? pendingRequests.map(req => `
                    <div class="friend-item">
                        <div class="friend-info">
                            <span class="friend-name">${req.user1.username}</span>
                        </div>
                        <div class="friend-actions">
                            <button class="accept-friend-btn button-primary" data-friendship-id="${req.id}">قبول</button>
                            <button class="reject-friend-btn button-secondary" data-friendship-id="${req.id}">رفض</button>
                        </div>
                    </div>
                `).join('') : '<p>لا توجد طلبات صداقة حاليًا.</p>'}
            </div>
        </div>
        <hr>
        <div class="friends-section">
            <h4>قائمة الأصدقاء (${friends.length})</h4>
            <div id="friends-list">
                ${friends.length > 0 ? friends.map(friendship => {
                    const friend = friendship.user1_id === currentUserId ? friendship.user2 : friendship.user1;
                    const isOnline = onlineUsers.includes(friend.id);
                    const statusClass = isOnline ? 'online' : '';

                    return `
                        <div class="friend-item" data-friend-id="${friend.id}" data-friend-username="${friend.username}" style="cursor: pointer;">
                            <div class="friend-info">
                                <span class="friend-status ${statusClass}" id="status-${friend.id}"></span>
                                <span class="friend-name">${friend.username}</span>
                            </div>
                            <div class="friend-actions">
                                <button class="remove-friend-btn button-danger" data-friendship-id="${friendship.id}">إزالة</button>
                            </div>
                        </div>
                    `;
                }).join('') : '<p>ليس لديك أصدقاء بعد. ابحث عن أصدقاء جدد!</p>'}
            </div>
        </div>
        <hr>
        <div class="friends-section">
            <h4>البحث عن لاعبين</h4>
            <div class="form-group">
                <input type="text" id="friend-search-input" placeholder="أدخل اسم المستخدم...">
                <button id="friend-search-button" class="button-primary">بحث</button>
            </div>
            <div id="friend-search-results"></div>
        </div>
    `;
}

export function renderFriendSearchResults(data) {
    const container = document.getElementById('friend-search-results');
    if (!container) return;

    if (data.status === 'loading') {
        container.innerHTML = '<p>جاري البحث...</p>';
        return;
    }

    const { searchResults, friendships, currentUserId } = data;
    if (searchResults.length === 0) {
        container.innerHTML = '<p>لم يتم العثور على لاعبين بهذا الاسم.</p>';
        return;
    }

    container.innerHTML = searchResults.map(player => {
        const existingFriendship = friendships.find(f => 
            (f.user1_id === player.id && f.user2_id === currentUserId) ||
            (f.user2_id === player.id && f.user1_id === currentUserId)
        );

        let buttonHTML = '';
        if (existingFriendship) {
            if (existingFriendship.status === 'accepted') {
                buttonHTML = '<button disabled>صديق بالفعل</button>';
            } else if (existingFriendship.status === 'pending') {
                buttonHTML = '<button disabled>طلب معلق</button>';
            }
        } else {
            buttonHTML = `<button class="add-friend-btn button-primary" data-user-id="${player.id}">إضافة صديق</button>`;
        }

        return `
            <div class="friend-item">
                <div class="friend-info">
                    <span class="friend-name">${player.username}</span>
                    <span class="friend-xp">الخبرة: ${player.xp}</span>
                </div>
                <div class="friend-actions">
                    ${buttonHTML}
                </div>
            </div>
        `;
    }).join('');
}

export function showChatModal(friend, messages, currentUserId) {
    const modalBody = document.getElementById('generic-modal-body');
    const modalOverlay = document.getElementById('generic-modal-overlay');
    modalBody.innerHTML = `
        <div class="chat-window">
            <div class="chat-header">محادثة مع ${friend.username}</div>
            <div class="chat-messages" id="chat-messages-container">
                ${messages.map(msg => `
                    <div class="message ${msg.sender_id === currentUserId ? 'sent' : 'received'}">
                        <p>${msg.content}</p>
                        <span class="timestamp">${new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chat-input-area">
                <input type="text" id="chat-message-input" placeholder="اكتب رسالتك..." autocomplete="off">
                <button id="send-chat-message-btn" class="button-primary" data-receiver-id="${friend.id}">إرسال</button>
            </div>
        </div>
    `;

    const messagesContainer = modalBody.querySelector('#chat-messages-container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    const input = modalBody.querySelector('#chat-message-input');
    if(input) input.focus();

    modalOverlay.classList.remove('hidden');
}

export function appendMessageToChat(message, currentUserId) {
    const messagesContainer = document.getElementById('chat-messages-container');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender_id === currentUserId ? 'sent' : 'received'}`;
    messageDiv.innerHTML = `
        <p>${message.content}</p>
        <span class="timestamp">${new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    `;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

export function toggleGenericModal(show, content = '') {
    const modalOverlay = document.getElementById('generic-modal-overlay');
    const modalBody = document.getElementById('generic-modal-body');
    if (!modalOverlay || !modalBody) return;

    if (show) {
        modalBody.innerHTML = content;
        modalOverlay.classList.remove('hidden');
    } else {
        modalOverlay.classList.add('hidden');
    }
}

export function getClansLeaderboardHTML(leaderboardData) {
    let content = '<h3>لوحة صدارة مهام القبائل</h3>';
    if (!leaderboardData || leaderboardData.length === 0) {
        content += '<p>لا توجد بيانات لعرضها.</p>';
    } else {
        content += leaderboardData.map((clan, index) => `
            <div class="leaderboard-item">
                <span class="leaderboard-rank">${index + 1}</span>
                <span class="leaderboard-name">${clan.emblem} ${clan.name}</span>
                <span class="leaderboard-xp">${clan.season_quest_points} نقطة</span> 
            </div>
        `).join('');
    }
    return content;
}

export function updateFriendStatus(friendId, isOnline) {
    const statusIndicator = document.getElementById(`status-${friendId}`);
    if (statusIndicator) {
        statusIndicator.classList.toggle('online', isOnline);
    }
}

export function updateFriendsStatus(presenceState) {
    const onlineUsers = Object.keys(presenceState);
    const allFriendItems = document.querySelectorAll('.friend-item[data-friend-id]');
    
    allFriendItems.forEach(item => {
        const friendId = item.dataset.friendId;
        const isOnline = onlineUsers.includes(friendId);
        updateFriendStatus(friendId, isOnline);
    });
}

// =============================================================
// ==      ▼▼▼ الدوال الجديدة للميزات المضافة ▼▼▼         ==
// =============================================================

/**
 * عرض رفيق الحفظ في واجهة المستخدم.
 * @param {object} stage - بيانات المرحلة الحالية للرفيق.
 */
export function renderCompanion(stage) {
    if (!companionContainer) return;
    companionContainer.innerHTML = `
        <img id="companion-image" src="${stage.image}" alt="${stage.name}" title="${stage.name}">
        <h4 id="companion-name">${stage.name}</h4>
    `;
}

/**
 * عرض شجرة المهارات.
 * @param {object} playerData - بيانات اللاعب الحالية.
 */
export function renderSkillTree(playerData) {
    if (!skillTreeContainer) return;

    const paths = {
        wisdom: ['xp_boost_1', 'xp_boost_2', 'diamond_boost_1'],
        mastery: ['perfect_bonus_1', 'extra_attempt_1', 'error_forgiveness_1'],
        social: ['clan_raid_boost_1', 'duel_reward_boost_1']
    };

    let html = '';
    for (const pathName in paths) {
        html += '<div class="skill-path">';
        paths[pathName].forEach(skillId => {
            const skill = skillTreeConfig[skillId];
            if (!skill) return;

            const isUnlocked = playerData.unlocked_skills.includes(skillId);
            let isAvailable = !isUnlocked && playerData.skill_points >= skill.cost;
            
            // التحقق من المتطلبات
            for (const depId of skill.dependencies) {
                if (!playerData.unlocked_skills.includes(depId)) {
                    isAvailable = false;
                    break;
                }
            }

            const statusClass = isUnlocked ? 'unlocked' : (isAvailable ? 'available' : 'locked');

            html += `
                <div class="skill-node ${statusClass}" data-skill-id="${skillId}" title="${skill.description}\nالتكلفة: ${skill.cost} 🧠">
                    <div class="skill-icon">${skill.icon}</div>
                    <div class="skill-name">${skill.name}</div>
                </div>
            `;
        });
        html += '</div>';
    }
    skillTreeContainer.innerHTML = html;
}

/**
 * عرض واجهة المبارزات.
 * @param {Array} duels - قائمة المبارزات الخاصة باللاعب.
 * @param {string} currentUserId - معرف اللاعب الحالي.
 * @param {Array} friendships - قائمة الصداقات.
 */
export function renderDuels(duels, currentUserId, friendships) {
    if (!duelsContainer) return;

    const friends = friendships
        .filter(f => f.status === 'accepted')
        .map(f => f.user1_id === currentUserId ? f.user2 : f.user1);

    if (duelFriendSelect) {
        duelFriendSelect.innerHTML = '<option value="">اختر صديقًا لتحديه...</option>';
        friends.forEach(friend => {
            const option = document.createElement('option');
            option.value = friend.id;
            option.textContent = friend.username;
            duelFriendSelect.appendChild(option);
        });
    }

    const pendingDuels = duels.filter(d => d.status !== 'completed');
    const completedDuels = duels.filter(d => d.status === 'completed');

    let html = `
        <h3>تحدي جديد</h3>
        <div class="form-group">
            <select id="duel-friend-select"></select>
            <select id="duel-page-select"></select>
            <select id="duel-questions-count">
                <option value="5">5 أسئلة</option>
                <option value="10">10 أسئلة</option>
                <option value="15">15 أسئلة</option>
            </select>
            <button id="send-duel-challenge-btn" class="button-primary">أرسل التحدي</button>
        </div>
        <hr>
        <h3>التحديات الحالية</h3>
    `;

    if (pendingDuels.length > 0) {
        html += pendingDuels.map(duel => {
            const isMyTurn = (duel.challenger_id === currentUserId && duel.challenger_score === null) ||
                             (duel.opponent_id === currentUserId && duel.opponent_score === null);
            const opponent = duel.challenger_id === currentUserId ? duel.opponent : duel.challenger;
            
            let actionButton = '';
            if (isMyTurn) {
                actionButton = `<button class="start-duel-btn button-primary" data-duel-id="${duel.id}" data-page-number="${duel.page_number}" data-questions-count="${duel.questions_count}">ابدأ دورك</button>`;
            } else {
                actionButton = `<button disabled>بانتظار الخصم</button>`;
            }

            return `
                <div class="duel-item">
                    <div class="duel-player">${player.playerData.username}</div>
                    <div class="duel-vs">VS</div>
                    <div class="duel-player">${opponent.username}</div>
                    <div class="duel-status ongoing">صفحة ${duel.page_number}</div>
                    <div class="friend-actions">${actionButton}</div>
                </div>
            `;
        }).join('');
    } else {
        html += '<p>لا توجد تحديات حالية. أرسل تحديًا جديدًا!</p>';
    }

    html += '<hr><h3>المبارزات المكتملة</h3>';

    if (completedDuels.length > 0) {
        html += completedDuels.map(duel => {
            const opponent = duel.challenger_id === currentUserId ? duel.opponent : duel.challenger;
            const myScore = duel.challenger_id === currentUserId ? duel.challenger_score : duel.opponent_score;
            const opponentScore = duel.challenger_id === currentUserId ? duel.opponent_score : duel.challenger_score;
            const iAmWinner = duel.winner_id === currentUserId;
            const isDraw = duel.winner_id === 'draw';

            return `
                <div class="duel-item">
                    <div class="duel-player ${iAmWinner ? 'winner' : ''}">${player.playerData.username} (${myScore})</div>
                    <div class="duel-vs">${isDraw ? '=' : (iAmWinner ? '>' : '<')}</div>
                    <div class="duel-player ${!iAmWinner && !isDraw ? 'winner' : ''}">${opponent.username} (${opponentScore})</div>
                    <div class="duel-status completed">مكتملة</div>
                </div>
            `;
        }).join('');
    } else {
        html += '<p>لا توجد مبارزات مكتملة بعد.</p>';
    }

    duelsContainer.innerHTML = html;
}
