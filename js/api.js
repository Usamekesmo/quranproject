// =============================================================
// ==      وحدة الاتصالات (api.js) - النسخة النهائية الكاملة
// ==      (مدمجة مع حل المصادقة ودوال الميزات الجديدة)
// =============================================================

import { supabase } from './config.js';

// --- دالة مساعدة جديدة لضمان تحديث الجلسة ---
async function ensureAuthenticatedClient() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && (!supabase.auth.headers.Authorization || supabase.auth.headers.Authorization !== `Bearer ${session.access_token}`)) {
        console.log("Refreshing Supabase auth headers to ensure session context.");
        await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
        });
    }
    return supabase;
}


// --- 1. دوال المصادقة (Authentication) ---

export async function loginUser(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpUser(email, password, username) {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            }
        }
    });
}

export async function getEmailForUsername(username) {
    const { data, error } = await supabase
        .from('players')
        .select('email')
        .eq('username', username)
        .single();

    if (error) {
        console.error(`خطأ أثناء البحث عن بريد للمستخدم "${username}":`, error.message);
        return null;
    }
    return data ? data.email : null;
}


// --- 2. دوال جلب البيانات العامة (Data Fetching) ---

export async function fetchPlayer() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("جلسة المستخدم غير صالحة أو منتهية الصلاحية.");
    }

    const { data, error } = await supabase.from('players').select('*').eq('id', user.id).single();
    
    if (error) {
        console.error("خطأ في جلب بيانات اللاعب من Supabase:", error);
        throw new Error(`خطأ في قاعدة البيانات: ${error.message}`);
    }

    if (!data) {
        console.error("لم يتم العثور على بيانات للاعب على الرغم من نجاح المصادقة. تحقق من سياسات RLS على جدول 'players'.");
        throw new Error("فشل العثور على ملف تعريف اللاعب. قد تكون هناك مشكلة في إعدادات الحساب أو أذونات قاعدة البيانات (RLS).");
    }

    return data;
}

export async function fetchProgressionConfig() {
    const { data, error } = await supabase.from('progression_config').select('settings').eq('id', 1).single();
    if (error) {
        console.error("خطأ في جلب إعدادات التقدم:", error);
        return null;
    }
    return data ? data.settings : null;
}

export async function fetchQuestionsConfig() {
    const { data, error } = await supabase.from('questions_config').select('*');
    if (error) console.error("خطأ في جلب إعدادات الأسئلة:", error);
    return data || [];
}

export async function fetchLevelsConfig() {
    const { data, error } = await supabase.from('levels').select('*').order('level', { ascending: true });
    if (error) {
        console.error("خطأ في جلب إعدادات المستويات من جدول 'levels':", error);
        return null;
    }
    return data;
}

export async function fetchStoreConfig() {
    const { data, error } = await supabase.from('store_config').select('*').order('sort_order', { ascending: true });
    if (error) console.error("خطأ في جلب إعدادات المتجر:", error);
    return data || [];
}

export async function fetchPageData(pageNumber) {
    try {
        const response = await fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani` );
        if (!response.ok) throw new Error('فشل استجابة الشبكة.');
        const data = await response.json();
        return data.data.ayahs;
    } catch (error) {
        console.error("Error fetching page data:", error);
        return null;
    }
}

export async function fetchAyahWordsByText(ayahText) {
    const { data, error } = await supabase
        .from('ayah_words')
        .select('*')
        .eq('ayah_text', ayahText)
        .limit(1); 

    if (error) {
        console.error(`خطأ في جلب كلمات الآية: "${ayahText.substring(0, 20)}..."`, error);
        return null;
    }
    
    return data && data.length > 0 ? data[0] : null;
}

export async function fetchLeaderboard() {
    const { data, error } = await supabase.from('players').select('username, xp').order('xp', { ascending: false }).limit(10);
    if (error) console.error("خطأ في جلب لوحة الصدارة الدائمة:", error);
    return data || [];
}

export async function fetchSeasonalLeaderboard() {
    const { data, error } = await supabase
        .from('players')
        .select('username, seasonal_xp')
        .order('seasonal_xp', { ascending: false })
        .limit(10);
        
    if (error) console.error("خطأ في جلب لوحة الصدارة الموسمية:", error);
    return data || [];
}


// --- 3. دوال المهام والأحداث (Quests & Events) ---

// في ملف api.js

export async function fetchPlayerQuests(playerId, periodKey) {
    const { data, error } = await supabase
        .from('player_quests')
        .select('*, quests_config(*)')
        .eq('user_id', playerId) // <-- الإصلاح: تغيير 'player_id' إلى 'user_id'
        .eq('period_key', periodKey);

    if (error) {
        console.error(`خطأ في جلب مهام اللاعب:`, error);
        return [];
    }
    return data || [];
}

// في ملف api.js

export async function assignQuestsForPeriod(playerId, periodKey, questType) {
    const client = await ensureAuthenticatedClient();
    
    // ▼▼▼ هذا هو السطر الذي تم تصحيحه ▼▼▼
    // تم تغيير اسم الدالة من 'assign_quests_for_period' إلى الاسم الصحيح
    const { error } = await client.rpc('get_or_assign_quests_for_period', {
        p_user_id: playerId,
        p_period_key: periodKey,
        p_quest_type: questType
    });

    if (error) {
        console.error(`فشل تعيين مهام (${questType}):`, error);
    }
}


export async function fetchActiveChallenges() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('special_challenges')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    
    if (error) console.error("خطأ في جلب التحديات النشطة:", error);
    return data || [];
}

export async function fetchPlayerChallengeProgress(userId) {
    const { data, error } = await supabase
        .from('player_challenge_progress')
        .select('*')
        .eq('player_id', userId);

    if (error) console.error("خطأ في جلب تقدم اللاعب في التحديات:", error);
    return data || [];
}

export async function fetchActiveLiveEvents() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('live_events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

    if (error) {
        console.error("خطأ في جلب الأحداث المباشرة:", error);
        return [];
    }
    return data || [];
}


// --- 4. دوال حفظ البيانات (Data Saving) ---

export async function savePlayer(playerData) {
    const client = await ensureAuthenticatedClient();
    const { id, ...updatableData } = playerData;
    delete updatableData.weeklyPeriodKey;
    
    const { error } = await client.from('players').update(updatableData).eq('id', id);
    if (error) console.error("خطأ في حفظ بيانات اللاعب:", error);
}

export async function saveResult(resultData) {
    const client = await ensureAuthenticatedClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return;
    const dataToSave = {
        user_id: user.id,
        page_number: resultData.pageNumber,
        score: resultData.score,
        total_questions: resultData.totalQuestions,
        xp_earned: resultData.xpEarned,
        errors: resultData.errorLog
    };
    const { error } = await client.from('quiz_results').insert([dataToSave]);
    if (error) console.error("خطأ في حفظ نتيجة الاختبار:", error);
}

export async function updatePlayerQuests(updates) {
    const client = await ensureAuthenticatedClient();
    const updatePromises = updates.map(update => 
        client.rpc('update_quest_progress', {
            quest_row_id: update.id,
            new_progress: update.progress
        })
    );
    try {
        const results = await Promise.all(updatePromises);
        results.forEach(result => {
            if (result.error) throw result.error;
        });
    } catch (error) {
        console.error("Error updating player quests via RPC:", error);
    }
}

export async function savePlayerChallengeProgress(progressData) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client
        .from('player_challenge_progress')
        .upsert(progressData, { onConflict: 'player_id, challenge_id' });

    if (error) console.error("خطأ في حفظ تقدم التحدي:", error);
}


// --- 5. دوال الأصدقاء (Friends) ---

export async function searchPlayers(searchText, currentUserId) {
    const { data, error } = await supabase
        .from('players')
        .select('id, username, xp')
        .ilike('username', `%${searchText}%`)
        .not('id', 'eq', currentUserId)
        .limit(10);
    if (error) throw new Error(error.message);
    return data;
}

export async function fetchFriendships(userId) {
    const { data, error } = await supabase
        .from('friendships')
        .select('*, user1:user1_id(id, username), user2:user2_id(id, username)')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        
    if (error) {
        console.error("خطأ في جلب الصداقات:", error);
        throw new Error(error.message);
    }
    return data;
}

export async function sendFriendRequest(fromUserId, toUserId) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client.from('friendships').insert({
        user1_id: fromUserId,
        user2_id: toUserId,
        status: 'pending'
    });
    if (error) throw new Error(error.message);
}

export async function updateFriendshipStatus(friendshipId, status) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client.from('friendships').update({ status }).eq('id', friendshipId);
    if (error) throw new Error(error.message);
}

export async function removeFriendship(friendshipId) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client.from('friendships').delete().eq('id', friendshipId);
    if (error) throw new Error(error.message);
}


// --- 6. دوال القبائل والغزوات (Clans & Raids) ---

export async function fetchAllClans() {
    const { data, error } = await supabase
        .from('clans_with_stats') 
        .select('id, name, emblem, total_xp, member_count') 
        .order('total_xp', { ascending: false }); 
    if (error) throw new Error(error.message);
    return data;
}

// في ملف api.js

export async function fetchClanDetails(clanId) {
    const { data, error } = await supabase
        .from('clans')
        .select(`
            *,
            members:clan_members (
                player_id,
                role,
                player:players (
                    username,
                    xp
                )
            )
        `)
        .eq('id', clanId)
        .single();

    // لا تعتبر "عدم العثور على صفوف" خطأً فادحاً، بل أرجع null
    if (error && error.code !== 'PGRST116') {
        console.error("خطأ في fetchClanDetails:", error);
        throw new Error(error.message);
    }
    return data; // سيعود بـ null إذا لم يتم العثور على القبيلة
}


export async function createClan(name, description, emblem) {
    const client = await ensureAuthenticatedClient();
    const { data, error } = await client.rpc('create_clan_and_join', {
        clan_name: name,
        clan_description: description,
        clan_emblem: emblem
    });
    if (error) {
        if (error.message.includes('duplicate key value violates unique constraint "clans_name_key"')) {
            throw new Error('اسم القبيلة هذا مستخدم بالفعل. يرجى اختيار اسم آخر.');
        }
        throw new Error(error.message);
    }
    return data;
}

export async function leaveCurrentClan() {
    const client = await ensureAuthenticatedClient();
    const { error } = await client.rpc('leave_clan');
    if (error) throw new Error(error.message);
}

export async function deleteClan(clanId) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client.from('clans').delete().eq('id', clanId);
    if (error) throw new Error(error.message);
}

export async function joinClan(clanId) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client.rpc('join_clan', {
        target_clan_id: clanId
    });
    if (error) throw new Error(error.message);
}

export async function fetchClansLeaderboard() {
    const { data, error } = await supabase
        .from('clans')
        .select('id, name, emblem, season_quest_points')
        .order('season_quest_points', { ascending: false })
        .limit(20);

    if (error) throw new Error(error.message);
    return data;
}

export async function fetchActiveClanQuest(clanId) {
    if (!clanId) return null;
    const { data, error } = await supabase
        .from('active_clan_quests')
        .select(`*, quest:clan_quests_config (*)`)
        .eq('clan_id', clanId)
        .single();
        
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching active clan quest:", error);
    }
    return data;
}

export async function incrementClanQuestProgress(clanId, questType, incrementValue) {
    const client = await ensureAuthenticatedClient();
    const { error: rpcError } = await client.rpc('increment_clan_quest_progress', {
        c_id: clanId,
        q_type: questType,
        inc_val: incrementValue
    });
    if (rpcError) console.error("Failed to increment clan quest progress:", rpcError);

    const { error: completeError } = await client.rpc('complete_clan_quest_if_done', {
        c_id: clanId
    });
    if (completeError) console.error("Failed to check for clan quest completion:", completeError);
}

export async function fetchClanRaid(clanId, periodKey) {
    const client = await ensureAuthenticatedClient();
    const { data, error } = await client
        .rpc('get_or_assign_clan_raid', { p_clan_id: clanId, p_period_key: periodKey });
    if (error) {
        console.error("خطأ في جلب غزوة القبيلة:", error);
        return null;
    }
    return data && data.length > 0 ? data[0] : null;
}

export async function fetchClanRaidDetails(clanRaidId) {
    const { data, error } = await supabase
        .from('raid_stages')
        .select(`*, progress:clan_raid_progress (clan_raid_id, progress, is_completed)`)
        .eq('raid_id', clanRaidId)
        .order('stage_order', { ascending: true });

    if (error) {
        console.error("خطأ في جلب تفاصيل مراحل الغزوة:", error);
        return [];
    }
    return data;
}

export async function incrementRaidProgress(clanId, eventType, periodKey) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client
        .rpc('increment_raid_progress', {
            p_clan_id: clanId,
            p_event_type: eventType,
            p_period_key: periodKey
        });
    if (error) console.error("فشل تحديث تقدم الغزوة:", error);
}


// --- 7. دوال المواسم (Seasons) ---

export async function fetchActiveSeason() {
    const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('is_active', true)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error("خطأ في جلب الموسم النشط:", error);
    }
    return data;
}


// --- 8. دوال المبارزات (Duels) ---

export async function createDuel(challengerId, opponentId, pageNumber, questionsCount) {
    const client = await ensureAuthenticatedClient();
    const { data, error } = await client
        .from('duels')
        .insert({
            challenger_id: challengerId,
            opponent_id: opponentId,
            page_number: pageNumber,
            questions_count: questionsCount
        })
        .select()
        .single();
    
    if (error) throw new Error("فشل إرسال التحدي: " + error.message);
    return data;
}

export async function fetchDuels(userId) {
    const { data, error } = await supabase
        .from('duels')
        .select(`*, challenger:challenger_id (username), opponent:opponent_id (username)`)
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) throw new Error("فشل جلب التحديات: " + error.message);
    return data;
}

export async function submitDuelResult(duelId, userId, score, time) {
    const client = await ensureAuthenticatedClient();
    const { data: duelData, error: fetchError } = await client.from('duels').select('challenger_id').eq('id', duelId).single();
    if (fetchError) throw new Error("فشل التحقق من هوية اللاعب في المبارزة.");

    const isChallenger = duelData.challenger_id === userId;
    
    const updateData = isChallenger 
        ? { challenger_score: score, challenger_time_seconds: time }
        : { opponent_score: score, opponent_time_seconds: time, status: 'ongoing' };

    const { error: updateError } = await client.from('duels').update(updateData).eq('id', duelId);
    if (updateError) throw new Error("فشل حفظ نتيجة التحدي: " + updateError.message);

    await client.rpc('resolve_duel', { p_duel_id: duelId });
}


// --- 9. دوال المحادثة اللحظية (Realtime Chat) ---

export async function fetchChatHistory(userId1, userId2) {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
            `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),` +
            `and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`
        )
        .order('created_at', { ascending: true });

    if (error) {
        console.error("خطأ أثناء جلب سجل المحادثة من Supabase:", error);
        throw new Error(error.message);
    }
    return data;
}

export async function sendMessage(senderId, receiverId, content) {
    const client = await ensureAuthenticatedClient();
    const { error } = await client
        .from('messages')
        .insert({ sender_id: senderId, receiver_id: receiverId, content: content });

    if (error) throw new Error(error.message);
}

export function subscribeToNewMessages(onNewMessage) {
    return supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            onNewMessage(payload.new);
        })
        .subscribe();
}
