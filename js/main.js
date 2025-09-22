// =================================================================
// ==      الملف الرئيسي (main.js) - النسخة النهائية الكاملة
// ==      تتضمن منطق التحكم في جميع الميزات الجديدة
// =================================================================
import * as map from './map.js';
import * as ui from './ui.js';
import * as api from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';
import * as achievements from './achievements.js';
import * as quests from './quests.js';
import * as companion from './companion.js';
import * as skills from './skills.js';
import { surahMetadata } from './quran-metadata.js';
import { supabase } from './config.js';
import { dispatch } from './eventBus.js';

let messageSubscription = null;
let presenceChannel = null;
let weeklyPeriodKey = ''; // مفتاح لتحديد الأسبوع الحالي للمهام والغزوات

// --- 1. التهيئة عند تحميل الصفحة ---
async function initializeApp() {
    ui.toggleLoader(true);
    try {
        // تهيئة الوحدات التي لا تعتمد على بيانات اللاعب أولاً
        await achievements.initializeAchievements();
        companion.initializeCompanionSystem();
        setupEventListeners();
        ui.showScreen(ui.startScreen);
    } catch (error) {
        console.error("فشل تهيئة التطبيق:", error);
        document.body.innerHTML = '<p style="text-align: center; color: red;">حدث خطأ فادح أثناء التهيئة الأولية. يرجى تحديث الصفحة.</p>';
    } finally {
        ui.toggleLoader(false);
    }
}

// --- 2. إعداد مستمعي الأحداث (Event Listeners) ---
function setupEventListeners() {
    document.getElementById('loginButton')?.addEventListener('click', handleLogin);
    document.getElementById('signUpButton')?.addEventListener('click', handleSignUp);
    document.getElementById('reloadButton')?.addEventListener('click', returnToMainMenu);
    document.getElementById('show-final-result-button')?.addEventListener('click', showFinalResultScreen);
    document.getElementById('startTestButton')?.addEventListener('click', onStartPageTestClick);

    document.body.addEventListener('change', async (e) => {
        if (e.target.matches('#title-select')) {
            const selectedTitle = e.target.value;
            player.playerData.equipped_title = selectedTitle || null;
            await player.savePlayer();
            ui.showToast("تم تحديث لقبك بنجاح!", "success");
            updateUIWithPlayerData();
        }
    });

    document.body.addEventListener('click', (e) => {
        const target = e.target;
        const button = target.closest('button');

        const friendItem = target.closest('.friend-item[data-friend-id]');
        if (friendItem && !target.closest('button')) {
            const friendId = friendItem.dataset.friendId;
            const friendUsername = friendItem.dataset.friendUsername;
            openChatWindow({ id: friendId, username: friendUsername });
            return;
        }
        
        const skillNode = target.closest('.skill-node.available');
        if (skillNode) {
            handleUnlockSkill(skillNode.dataset.skillId);
            return;
        }

        if (!button) return;

        const actions = {
            '.tab-button': () => handleMainUITabClick(button),
            '.filter-button': () => handleStoreFilterClick(button),
            '.sub-tab-button': () => handleLeaderboardSubTabClick(button.dataset.leaderboard),
            '.details-button': () => store.handleDetailsClick(button.dataset.itemId),
            '#modal-buy-button': () => store.purchaseItem(button.dataset.itemId),
            '#modal-close-btn': () => ui.showModal(false),
            '.claim-button:not([disabled])': () => quests.handleClaimReward(e),
            '.claim-challenge-button:not([disabled])': () => handleClaimChallengeReward(button.dataset.challengeId),
            '.join-event-btn': () => handleJoinLiveEvent(button.dataset.eventId),
            '#friend-search-button': handleSearchFriends,
            '.add-friend-btn': () => sendFriendRequest(button.dataset.userId),
            '.accept-friend-btn': () => handleFriendRequest(button.dataset.friendshipId, 'accepted'),
            '.reject-friend-btn': () => handleFriendRequest(button.dataset.friendshipId, 'rejected'),
            '.remove-friend-btn': () => handleFriendRequest(button.dataset.friendshipId, 'removed'),
            '#create-clan-btn': handleCreateClan,
            '#leave-clan-btn': handleLeaveClan,
            '#delete-clan-btn': handleDeleteClan,
            '.join-clan-btn': () => handleJoinClan(button.dataset.clanId),
            '#send-chat-message-btn': () => handleSendMessage(button.dataset.receiverId),
            '#show-clans-leaderboard-btn': handleShowClansLeaderboard,
            '#generic-modal-close-btn': () => ui.toggleGenericModal(false),
            '#send-duel-challenge-btn': handleSendDuel,
            '.start-duel-btn': () => handleStartDuel(button.dataset),
        };

        for (const selector in actions) {
            if (button.matches(selector)) {
                actions[selector]();
                return;
            }
        }
    });

    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('#chat-message-input')) {
            e.preventDefault();
            const sendButton = document.getElementById('send-chat-message-btn');
            if (sendButton) handleSendMessage(sendButton.dataset.receiverId);
        }
    });
}

// --- 3. معالجات الأحداث (Event Handlers) ---
async function handleLogin() {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('password').value;
    if (!username || !password) return ui.showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "error");
    ui.toggleLoader(true);
    try {
        const email = await api.getEmailForUsername(username);
        if (!email) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
        const { error } = await api.loginUser(email, password);
        if (error) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة.");
        await onSuccessfulAuth();
    } catch (error) {
        ui.showToast(error.message, "error");
        ui.toggleLoader(false);
    }
}

async function handleSignUp() {
    const usernameInput = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('password').value;
    if (!usernameInput || !password) return ui.showToast("يرجى إدخال اسم مستخدم وكلمة مرور.", "error");
    ui.toggleLoader(true);
    try {
        const randomString = Math.random().toString(36).substring(2, 15);
        const dummyEmail = `${usernameInput.replace(/\s/g, '_')}_${randomString}@quran-app.local`;
        const { error } = await api.signUpUser(dummyEmail, password, usernameInput);
        if (error) throw new Error(error.message);
        ui.showToast("تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...", "info");
        await onSuccessfulAuth();
    } catch (error) {
        ui.showToast(`فشل إنشاء الحساب: ${error.message}`, "error");
        ui.toggleLoader(false);
    }
}

async function onSuccessfulAuth() {
    ui.toggleLoader(true);
    try {
        await Promise.all([progression.initializeProgression(), quiz.initializeQuiz()]);

        const playerLoaded = await player.loadPlayer();
        if (!playerLoaded) throw new Error("فشل تحميل بيانات اللاعب لسبب غير معروف.");

        const getPeriodKey = (d, type) => {
            if (type === 'daily') return d.toISOString().split('T')[0];
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
            var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
            return `${d.getUTCFullYear()}-W${weekNo}`;
        };

        const today = new Date();
        const dailyKey = getPeriodKey(today, 'daily');
        weeklyPeriodKey = getPeriodKey(today, 'weekly');
        
        const lastDailyReset = player.playerData.last_daily_reset ? player.playerData.last_daily_reset.split('T')[0] : null;
        if (lastDailyReset !== dailyKey) {
            let baseAttempts = 3;
            const extraAttempts = skills.getSkillEffect('extra_daily_attempt');
            baseAttempts += extraAttempts;
            
            player.playerData.test_attempts = baseAttempts;
            player.playerData.last_daily_reset = today.toISOString();
            
            await api.assignQuestsForPeriod(player.playerData.id, dailyKey, 'daily');
            await api.assignQuestsForPeriod(player.playerData.id, weeklyPeriodKey, 'weekly');
            
            if (player.playerData.clan_id) {
                await api.assignClanRaid(player.playerData.clan_id, weeklyPeriodKey);
            }
            
            await player.savePlayer();
            ui.showToast("تم تجديد محاولاتك ومهامك اليومية!", "success");
        }
        
        const [storeConfig, dailyQuests, weeklyQuests, activeSeason] = await Promise.all([
            api.fetchStoreConfig(),
            api.fetchPlayerQuests(player.playerData.id, dailyKey),
            api.fetchPlayerQuests(player.playerData.id, weeklyPeriodKey),
            api.fetchActiveSeason(),
        ]);

        store.processStoreData(storeConfig, []);
        quests.initialize([...dailyQuests, ...weeklyQuests]);
        if (activeSeason) ui.displaySeasonInfo(activeSeason, []);

        const levelInfo = progression.getLevelInfo(player.playerData.xp);
        companion.checkForCompanionEvolution(levelInfo.level);

        if (presenceChannel) supabase.removeChannel(presenceChannel);
        presenceChannel = supabase.channel('online-users', { config: { presence: { key: player.playerData.id } } });
        presenceChannel.on('presence', { event: 'sync' }, () => {
            if (document.getElementById('friends-tab')?.classList.contains('active')) renderFriendsTab();
        }).subscribe(async (status) => {
            if (status === 'SUBSCRIBED') await presenceChannel.track({ online_at: new Date().toISOString() });
        });
        
        if (messageSubscription) messageSubscription.unsubscribe();
        messageSubscription = api.subscribeToNewMessages((newMessage) => {
            if (newMessage.receiver_id === player.playerData.id) {
                ui.showToast(`رسالة جديدة من صديق!`, 'info');
                if (document.querySelector('.chat-header')) ui.appendMessageToChat(newMessage, player.playerData.id);
            }
        });

        updateUIWithPlayerData();
        ui.showScreen(ui.mainInterface);
        ui.showTab('map-tab');
        map.renderMapLocations();

    } catch (error) {
        console.error("خطأ حاسم بعد المصادقة:", error);
        ui.showToast(error.message, "error");
        if (supabase) await supabase.auth.signOut();
        ui.showScreen(ui.startScreen);
    } finally {
        ui.toggleLoader(false);
    }
}

function returnToMainMenu() {
    updateUIWithPlayerData();
    ui.showScreen(ui.mainInterface);
    ui.showTab('test-tab');
}

function showFinalResultScreen() {
    const quizState = quiz.getCurrentState();
    const oldXp = player.playerData.xp - quizState.xpEarned;
    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    ui.displayFinalResult(quizState, levelUpInfo);
}

function handleMainUITabClick(button) {
    const tabId = button.dataset.tab;
    ui.showTab(tabId);
    
    const actions = {
        'map-tab': () => map.renderMapLocations(),
        'store-tab': () => handleStoreFilterClick(document.querySelector('.filter-button.active')),
        'leaderboard-tab': async () => {
            const activeSeason = await api.fetchActiveSeason();
            if (activeSeason) ui.displaySeasonInfo(activeSeason, []);
            handleLeaderboardSubTabClick('seasonal');
        },
        'profile-tab': () => {
            ui.renderPlayerStats(player.playerData);
            const levelInfo = progression.getLevelInfo(player.playerData.xp);
            companion.checkForCompanionEvolution(levelInfo.level);
        },
        'quests-tab': () => quests.renderQuests(),
        'challenges-tab': renderChallengesTab,
        'friends-tab': renderFriendsTab,
        'clans-tab': renderClansTab,
        'skills-tab': () => ui.renderSkillTree(player.playerData),
        'duels-tab': renderDuelsTab,
    };
    if (actions[tabId]) actions[tabId]();
}

function handleStoreFilterClick(button) {
    if (!button) return;
    document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    store.renderStoreTabs(button.dataset.filter);
}

async function handleLeaderboardSubTabClick(leaderboardType) {
    document.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.querySelector(`.sub-tab-button[data-leaderboard="${leaderboardType}"]`);
    if (activeButton) activeButton.classList.add('active');
    if (ui.leaderboardList) ui.leaderboardList.innerHTML = '<p>جاري تحميل لوحة الصدارة...</p>';
    const data = leaderboardType === 'seasonal' ? await api.fetchSeasonalLeaderboard() : await api.fetchLeaderboard();
    const key = leaderboardType === 'seasonal' ? 'seasonal_xp' : 'xp';
    ui.displayLeaderboard(data, key);
}

async function onStartPageTestClick() {
    const hasEnergyStars = (player.playerData.energy_stars || 0) > 0;
    const hasTestAttempts = (player.playerData.test_attempts || 0) > 0;
    if (!hasEnergyStars && !hasTestAttempts) return ui.showToast("ليس لديك محاولات اختبار متبقية.", "error");

    const page = ui.pageSelect.value;
    if (!page) return ui.showToast("يرجى اختيار صفحة لبدء الاختبار.", "error");
    const selection = { type: 'single', pages: [parseInt(page)] };

    if (hasEnergyStars) {
        player.playerData.energy_stars--;
        dispatch('energy_star_used');
    } else {
        player.playerData.test_attempts--;
    }
    updateUIWithPlayerData();

    ui.toggleLoader(true);
    try {
        const pageAyahs = await api.fetchPageData(selection.pages[0]);
        if (!pageAyahs || pageAyahs.length === 0) throw new Error(`فشل تحميل بيانات الصفحة رقم ${selection.pages[0]}.`);

        quiz.start({
            pageAyahs: pageAyahs,
            totalQuestions: parseInt(ui.questionsCountSelect.value, 10),
            selectedQari: ui.qariSelect.value,
            userName: player.playerData.username,
            pageNumber: selection.pages[0],
            testMode: { type: 'normal_test' }
        });
    } catch (error) {
        ui.showToast(error.message, "error");
    } finally {
        ui.toggleLoader(false);
    }
}

function updateUIWithPlayerData() {
    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    ui.updatePlayerHeader(player.playerData, levelInfo);
    updateAvailablePages();
    ui.populateQariSelect(ui.qariSelect, player.playerData.inventory);
    const maxQuestions = progression.getMaxQuestionsForLevel(levelInfo.level);
    ui.updateQuestionsCountOptions(maxQuestions);
}

function updateAvailablePages() {
    const ownedPages = player.playerData.inventory.filter(id => id.startsWith('page_')).map(id => parseInt(id.replace('page_', ''), 10));
    const availablePages = [...new Set([...player.FREE_PAGES, ...ownedPages])].sort((a, b) => a - b);
    if (ui.pageSelect) {
        ui.pageSelect.innerHTML = '';
        availablePages.forEach(pageNumber => {
            const option = document.createElement('option');
            option.value = pageNumber;
            option.textContent = `صفحة ${pageNumber} (${getSurahInfoForPage(pageNumber)})`;
            ui.pageSelect.appendChild(option);
        });
    }
    if (ui.duelPageSelect) {
        ui.duelPageSelect.innerHTML = '<option value="">اختر صفحة للتحدي...</option>';
        availablePages.forEach(pageNumber => {
            const option = document.createElement('option');
            option.value = pageNumber;
            option.textContent = `صفحة ${pageNumber}`;
            ui.duelPageSelect.appendChild(option);
        });
    }
}

function getSurahInfoForPage(pageNumber) {
    for (const surahNum in surahMetadata) {
        const meta = surahMetadata[surahNum];
        if (pageNumber >= meta.startPage && pageNumber <= meta.endPage) {
            return meta.name;
        }
    }
    return 'غير معروف';
}

async function renderChallengesTab() {
    if (ui.specialChallengesContainer) {
        ui.specialChallengesContainer.innerHTML = '<p>جاري تحميل التحديات والأحداث...</p>';
    }

    const [challenges, playerProgress, liveEvents] = await Promise.all([
        api.fetchActiveChallenges(),
        api.fetchPlayerChallengeProgress(player.playerData.id),
        api.fetchActiveLiveEvents()
    ]);

    ui.renderSpecialChallenges(challenges, playerProgress);
    ui.renderLiveEvents(liveEvents);
}

async function handleClaimChallengeReward(challengeId) {
    const challenges = await api.fetchActiveChallenges();
    const challenge = challenges.find(c => c.id.toString() === challengeId);
    if (!challenge) return ui.showToast("هذا التحدي لم يعد متاحًا.", "error");
    
    const playerProgressList = await api.fetchPlayerChallengeProgress(player.playerData.id);
    const progress = playerProgressList.find(p => p.challenge_id.toString() === challengeId);
    if (!progress || !progress.is_completed || progress.is_claimed) return ui.showToast("لا يمكنك المطالبة بهذه الجائزة.", "error");

    player.playerData.xp += challenge.reward_xp;
    player.playerData.seasonal_xp = (player.playerData.seasonal_xp || 0) + challenge.reward_xp;
    player.playerData.diamonds += challenge.reward_diamonds;
    progress.is_claimed = true;
    
    await api.savePlayerChallengeProgress(progress);
    await player.savePlayer();
    
    ui.showToast(`تهانينا! لقد حصلت على مكافأة تحدي "${challenge.title}"!`, "success");
    updateUIWithPlayerData();
    renderChallengesTab();
}

async function handleJoinLiveEvent(eventId) {
    const hasEnergyStars = (player.playerData.energy_stars || 0) > 0;
    const hasTestAttempts = (player.playerData.test_attempts || 0) > 0;
    if (!hasEnergyStars && !hasTestAttempts) return ui.showToast("ليس لديك محاولات اختبار متبقية للمشاركة في الحدث.", "error");

    ui.toggleLoader(true);
    try {
        const events = await api.fetchActiveLiveEvents();
        const event = events.find(e => e.id.toString() === eventId);
        if (!event) throw new Error("عذرًا، هذا الحدث لم يعد متاحًا.");

        let pagesForTest = [];
        if (event.scope_type === 'page') {
            pagesForTest.push(parseInt(event.scope_value, 10));
        } else if (event.scope_type === 'surah') {
            const surahInfo = surahMetadata[event.scope_value];
            if (!surahInfo) throw new Error(`بيانات السورة رقم ${event.scope_value} غير موجودة.`);
            for (let i = surahInfo.startPage; i <= surahInfo.endPage; i++) pagesForTest.push(i);
        } else if (event.scope_type === 'range') {
            const [start, end] = event.scope_value.split('-').map(Number);
            if (isNaN(start) || isNaN(end) || end < start) throw new Error('نطاق الصفحات المحدد في الحدث غير صالح.');
            for (let i = start; i <= end; i++) pagesForTest.push(i);
        }

        if (pagesForTest.length === 0 || !event.questions_count) {
            return ui.showToast("تفاصيل اختبار هذا الحدث غير مكتملة. يرجى مراجعة الإدارة.", "error");
        }

        if (hasEnergyStars) {
            player.playerData.energy_stars--;
            dispatch('energy_star_used');
        } else {
            player.playerData.test_attempts--;
        }
        updateUIWithPlayerData();

        const pagePromises = pagesForTest.map(pageNumber => api.fetchPageData(pageNumber));
        const results = await Promise.all(pagePromises);
        
        const allPagesAyahs = results.flat();
        if (allPagesAyahs.length === 0) throw new Error(`فشل تحميل بيانات الصفحات الخاصة بالحدث.`);

        quiz.start({
            pageAyahs: allPagesAyahs,
            totalQuestions: event.questions_count,
            selectedQari: ui.qariSelect.value,
            userName: player.playerData.username,
            pageNumber: 0,
            testMode: { type: 'live_event', eventId: event.id, eventTitle: event.title }
        });

    } catch (error) {
        ui.showToast(error.message, "error");
    } finally {
        ui.toggleLoader(false);
    }
}

async function renderFriendsTab() {
    const userId = player.playerData.id;
    if (!userId) return;
    
    ui.renderFriendsTab({ status: 'loading' });

    const presenceState = presenceChannel ? presenceChannel.presenceState() : {};
    const onlineUsers = Object.keys(presenceState);

    const friendships = await api.fetchFriendships(userId);
    
    ui.renderFriendsTab({ status: 'loaded', friendships, currentUserId: userId, onlineUsers });
}

async function handleSearchFriends() {
    const searchInput = document.getElementById('friend-search-input');
    const searchText = searchInput.value.trim();
    if (searchText.length < 3) return ui.showToast("يرجى إدخال 3 أحرف على الأقل للبحث.", "warning");
    ui.renderFriendSearchResults({ status: 'loading' });
    const [searchResults, friendships] = await Promise.all([
        api.searchPlayers(searchText, player.playerData.id),
        api.fetchFriendships(player.playerData.id)
    ]);
    ui.renderFriendSearchResults({ status: 'loaded', searchResults, friendships, currentUserId: player.playerData.id });
}

async function sendFriendRequest(toUserId) {
    try {
        await api.sendFriendRequest(player.playerData.id, toUserId);
        ui.showToast("تم إرسال طلب الصداقة بنجاح!", "success");
        const button = document.querySelector(`.add-friend-btn[data-user-id="${toUserId}"]`);
        if (button) { button.textContent = 'تم الإرسال'; button.disabled = true; }
    } catch (error) {
        ui.showToast(error.message, "error");
    }
}

async function handleFriendRequest(friendshipId, action) {
    try {
        if (action === 'accepted') {
            await api.updateFriendshipStatus(friendshipId, 'accepted');
            ui.showToast("تم قبول الصداقة!", "success");
        } else {
            await api.removeFriendship(friendshipId);
            ui.showToast(action === 'rejected' ? "تم رفض الطلب." : "تمت إزالة الصديق.", "info");
        }
        renderFriendsTab();
    } catch (error) {
        ui.showToast(error.message, "error");
    }
}

async function renderClansTab() {
    const container = document.getElementById('clans-container');
    if (!container) return;
    container.innerHTML = '<p>جاري تحميل...</p>';
    
    const currentClanId = player.playerData.clan_id || null;

    if (!currentClanId) {
        try {
            const allClans = await api.fetchAllClans();
            ui.renderNoClanView(container, allClans);
        } catch (error) {
            console.error("خطأ أثناء عرض قائمة القبائل:", error);
            container.innerHTML = '<p class="error-message">حدث خطأ أثناء تحميل قائمة القبائل.</p>';
        }
        return; 
    }

    try {
        const clanRaid = await api.fetchClanRaid(currentClanId, weeklyPeriodKey);
        let raidDetails = null;
        if (clanRaid) {
            const detailsData = await api.fetchClanRaidDetails(clanRaid.raid_id);
            raidDetails = detailsData.map(stage => {
                const progress = stage.progress.find(p => p.clan_raid_id === clanRaid.id);
                return { ...stage, progress: progress || { progress: 0, is_completed: false } };
            });
        }

        const [clanDetails, activeQuest] = await Promise.all([
            api.fetchClanDetails(currentClanId),
            api.fetchActiveClanQuest(currentClanId) 
        ]);

        if (!clanDetails) {
            player.playerData.clan_id = null;
            await player.savePlayer();
            renderClansTab(); 
            return;
        }

        ui.renderClanDetailsView(container, clanDetails, player.playerData.id, activeQuest, raidDetails, clanRaid);
    } catch (error) {
        console.error("خطأ أثناء عرض تبويب القبيلة:", error);
        container.innerHTML = '<p class="error-message">حدث خطأ أثناء تحميل بيانات القبيلة. يرجى المحاولة مرة أخرى.</p>';
    }
}

async function handleShowClansLeaderboard() {
    try {
        const leaderboardData = await api.fetchClansLeaderboard();
        ui.toggleGenericModal(true, ui.getClansLeaderboardHTML(leaderboardData));
    } catch (error) {
        ui.showToast(error.message, "error");
    }
}

async function handleCreateClan() {
    const name = document.getElementById('new-clan-name').value.trim();
    const emblem = document.getElementById('new-clan-emblem').value.trim();
    const description = document.getElementById('new-clan-description').value.trim();
    if (!name || !emblem) return ui.showToast("اسم القبيلة والشعار مطلوبان.", "error");
    try {
        const newClanId = await api.createClan(name, description, emblem);
        player.playerData.clan_id = newClanId;
        await player.savePlayer();
        ui.showToast("تهانينا! تم تأسيس قبيلتك بنجاح.", "success");
        renderClansTab();
    } catch (error) {
        ui.showToast(error.message, "error");
    }
}

async function handleLeaveClan() {
    if (confirm('هل أنت متأكد من رغبتك في مغادرة القبيلة؟')) {
        try {
            await api.leaveCurrentClan();
            player.playerData.clan_id = null;
            await player.savePlayer();
            renderClansTab();
        } catch (error) {
            ui.showToast(error.message, "error");
        }
    }
}

async function handleDeleteClan() {
    if (confirm('تحذير! سيتم حذف القبيلة نهائيًا لجميع الأعضاء. هل أنت متأكد؟')) {
        try {
            await api.deleteClan(player.playerData.clan_id);
            player.playerData.clan_id = null;
            await player.savePlayer();
            renderClansTab();
        } catch (error) {
            ui.showToast(error.message, "error");
        }
    }
}

async function handleJoinClan(clanId) {
    if (!clanId) return;
    if (confirm('هل أنت متأكد من رغبتك في الانضمام إلى هذه القبيلة؟')) {
        try {
            await api.joinClan(clanId);
            player.playerData.clan_id = clanId;
            await player.savePlayer();
            ui.showToast("لقد انضممت إلى القبيلة بنجاح!", "success");
            renderClansTab();
        } catch (error) {
            ui.showToast(error.message, "error");
        }
    }
}

async function openChatWindow(friend) {
    const currentUserId = player.playerData.id;
    try {
        const history = await api.fetchChatHistory(currentUserId, friend.id);
        ui.showChatModal(friend, history, currentUserId);
    } catch (error) {
        ui.showToast("فشل تحميل سجل المحادثة.", "error");
    }
}

async function handleSendMessage(receiverId) {
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    const content = input.value.trim();
    if (!content) return;
    try {
        input.disabled = true;
        document.getElementById('send-chat-message-btn').disabled = true;
        await api.sendMessage(player.playerData.id, receiverId, content);
        const sentMessage = { sender_id: player.playerData.id, content: content, created_at: new Date().toISOString() };
        ui.appendMessageToChat(sentMessage, player.playerData.id);
        input.value = '';
    } catch (error) {
        ui.showToast(error.message, "error");
    } finally {
        input.disabled = false;
        document.getElementById('send-chat-message-btn').disabled = false;
        input.focus();
    }
}

async function handleUnlockSkill(skillId) {
    const result = await skills.unlockSkill(skillId);
    ui.showToast(result.message, result.success ? 'success' : 'error');
    if (result.success) {
        ui.renderSkillTree(player.playerData);
        updateUIWithPlayerData();
    }
}

async function renderDuelsTab() {
    const container = document.getElementById('duels-container');
    if (!container) return;
    container.innerHTML = '<p>جاري تحميل التحديات...</p>';
    try {
        const [duels, friendships] = await Promise.all([
            api.fetchDuels(player.playerData.id),
            api.fetchFriendships(player.playerData.id)
        ]);
        ui.renderDuels(duels, player.playerData.id, friendships);
        updateAvailablePages();
    } catch (error) {
        console.error("Error rendering duels tab:", error);
        container.innerHTML = '<p class="error-message">فشل تحميل بيانات المبارزات.</p>';
    }
}

async function handleSendDuel() {
    const opponentId = ui.duelFriendSelect.value;
    const pageNumber = ui.duelPageSelect.value;
    const questionsCount = document.getElementById('duel-questions-count').value;

    if (!opponentId || !pageNumber || !questionsCount) {
        return ui.showToast("يرجى اختيار صديق وصفحة وعدد أسئلة.", "warning");
    }

    try {
        await api.createDuel(player.playerData.id, opponentId, parseInt(pageNumber), parseInt(questionsCount));
        ui.showToast("تم إرسال تحدي المبارزة بنجاح!", "success");
        renderDuelsTab();
    } catch (error) {
        ui.showToast(`فشل إرسال التحدي: ${error.message}`, "error");
    }
}
    
async function handleStartDuel(dataset) {
    const duelId = dataset.duelId;
    const pageNumber = dataset.pageNumber;
    const questionsCount = dataset.questionsCount;

    if (!duelId || !pageNumber || !questionsCount) {
        return ui.showToast("بيانات المبارزة غير مكتملة.", "error");
    }

    ui.toggleLoader(true);
    try {
        const [duel, pageAyahs] = await Promise.all([
            api.fetchDuelById(duelId),
            api.fetchPageData(parseInt(pageNumber))
        ]);

        if (!duel) throw new Error("لم يتم العثور على المبارزة.");
        if (!pageAyahs) throw new Error("فشل تحميل صفحة المبارزة.");

        // تحديث حالة المبارزة إلى "جارية" إذا كانت "معلقة"
        if (duel.status === 'pending') {
            await api.updateDuel(duelId, { status: 'ongoing' });
        }

        quiz.start({
            pageAyahs: pageAyahs,
            totalQuestions: parseInt(questionsCount),
            selectedQari: ui.qariSelect.value,
            userName: player.playerData.username,
            pageNumber: parseInt(pageNumber),
            testMode: { type: 'duel', duel: duel }
        });

    } catch (error) {
        ui.showToast(error.message, "error");
    } finally {
        ui.toggleLoader(false);
    }
}

// --- بدء تشغيل التطبيق ---
document.addEventListener('DOMContentLoaded', initializeApp);
