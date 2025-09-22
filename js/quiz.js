// =============================================================
// ==      وحدة الاختبار (quiz.js) - النسخة النهائية الكاملة
// ==      محدثة لتشمل تأثيرات شجرة المهارات والمبارزات
// =============================================================

import * as ui from './ui.js';
import * as api from './api.js';
import * as player from './player.js';
import * as progression from './progression.js';
import { dispatch } from './eventBus.js';
import { allQuestionGenerators } from './questions.js';
import * as skills from './skills.js'; // <-- استيراد وحدة المهارات

let state = {
    pageAyahs: [],
    currentQuestionIndex: 0,
    score: 0,
    totalQuestions: 10,
    selectedQari: 'ar.alafasy',
    errorLog: [],
    userName: '',
    pageNumber: 0,
    xpEarned: 0,
    startTime: 0,
    currentQuestionHTML: '',
    testMode: { type: 'normal_test' },
    firstErrorForgiven: false, // لتتبع مهارة "فرصة ثانية"
};

let allQuestionTypes = [];
const shuffleArray = array => [...array].sort(() => 0.5 - Math.random());

export async function initializeQuiz() {
    try {
        const config = await api.fetchQuestionsConfig();
        if (config && config.length > 0) {
            allQuestionTypes = config;
            console.log(`تم تحميل ${allQuestionTypes.length} نوع سؤال من قاعدة البيانات.`);
        } else {
            console.error("فشل تحميل إعدادات الأسئلة من قاعدة البيانات (مصفوفة فارغة).");
        }
    } catch (error) {
        console.error("خطأ فادح أثناء تهيئة وحدة الأسئلة:", error);
    } finally {
        return Promise.resolve();
    }
}

export function start(context) {
    state = {
        ...state,
        ...context,
        score: 0,
        currentQuestionIndex: 0,
        errorLog: [],
        xpEarned: 0,
        startTime: Date.now(),
        firstErrorForgiven: false, // إعادة تعيين عند بدء كل اختبار
    };
    ui.showScreen(ui.quizScreen);
    displayNextQuestion();
}

async function displayNextQuestion() {
    if (state.currentQuestionIndex >= state.totalQuestions) {
        endQuiz();
        return;
    }

    ui.updateProgress(state.currentQuestionIndex + 1, state.totalQuestions);
    ui.questionArea.innerHTML = '<p>جاري تحضير السؤال...</p>';
    ui.feedbackArea.classList.add('hidden');

    const levelInfo = progression.getLevelInfo(player.playerData.xp);
    const availablePaths = progression.getAvailablePaths(levelInfo.level);

    const availableGenerators = allQuestionTypes
        .filter(q => q.required_level <= levelInfo.level && availablePaths.includes(q.required_path))
        .map(q => allQuestionGenerators[q.id])
        .filter(g => typeof g === 'function');

    if (availableGenerators.length === 0) {
        ui.questionArea.innerHTML = '<p style="color: red;">عذرًا، لا توجد أنواع أسئلة متاحة لمستواك ومسارك الحالي.</p>';
        return;
    }

    const shuffledGenerators = shuffleArray(availableGenerators);
    let intruderAyahsForThisQuestion = [];
    const needsIntruders = shuffledGenerators.some(g => g.name.includes('Intruder'));

    if (needsIntruders) {
        const currentPageNumbers = [...new Set(state.pageAyahs.map(a => a.page))];
        let randomIntruderPage;
        do {
            randomIntruderPage = Math.floor(Math.random() * 604) + 1;
        } while (currentPageNumbers.includes(randomIntruderPage));

        const intruders = await api.fetchPageData(randomIntruderPage);
        if (intruders && intruders.length > 0) {
            intruderAyahsForThisQuestion = intruders;
        }
    }

    let questionObject = null;
    let attempts = 0;

    while (!questionObject && attempts < shuffledGenerators.length) {
        const generator = shuffledGenerators[attempts];
        try {
            questionObject = await Promise.resolve(generator(state.pageAyahs, intruderAyahsForThisQuestion, state.selectedQari, handleResult));
        } catch (error) {
            console.error(`فشل المولد في المحاولة ${attempts + 1}:`, error);
        }
        if (!questionObject) {
            console.warn(`فشل المولد ${generator.name || 'غير معروف'} في توليد سؤال، سيتم تجربة مولد آخر.`);
        }
        attempts++;
    }

    if (questionObject) {
        state.currentQuestionHTML = questionObject.questionHTML;
        ui.questionArea.innerHTML = questionObject.questionHTML;
        await Promise.resolve(questionObject.setupListeners(ui.questionArea));
    } else {
        ui.questionArea.innerHTML = '<p style="color: red;">عذرًا، حدث خطأ غير متوقع أثناء تحضير السؤال. قد تكون هذه الصفحة قصيرة جدًا. يرجى محاولة العودة والبدء من جديد.</p>';
        console.error("فشل كارثي: لم يتم العثور على أي مولد أسئلة مناسب للبيانات الحالية.");
    }
}

function handleResult(isCorrect, correctAnswerText, clickedElement, questionType) {
    ui.disableQuestionInteraction();
    ui.markAnswer(clickedElement, isCorrect);

    // تطبيق مهارة "فرصة ثانية"
    const errorForgivenessCount = skills.getSkillEffect('error_forgiveness');
    if (!isCorrect && errorForgivenessCount > 0 && !state.firstErrorForgiven) {
        state.firstErrorForgiven = true;
        isCorrect = true; // اعتبرها إجابة صحيحة
        ui.showFeedback(false, `إجابة خاطئة، ولكن تم التغاضي عنها بفضل مهارتك! الإجابة الصحيحة: ${correctAnswerText}`);
    } else {
        ui.showFeedback(isCorrect, correctAnswerText);
    }

    if (isCorrect) {
        state.score++;
        const rules = progression.getGameRules();
        let xpPerAnswer = rules.xp_per_correct_answer || 5;
        
        // تطبيق مهارة "حكمة الحافظ"
        const xpModifier = skills.getSkillEffect('xp_modifier');
        xpPerAnswer *= (1 + xpModifier);
        
        state.xpEarned += Math.round(xpPerAnswer);
        dispatch('question_answered_correctly');
    } else {
        state.errorLog.push({
            questionHTML: state.currentQuestionHTML,
            correctAnswer: correctAnswerText,
            question_id: questionType
        });
        dispatch('question_answered_wrongly');
    }

    state.currentQuestionIndex++;
    setTimeout(displayNextQuestion, 2500);
}

async function endQuiz() {
    const durationInSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    const rules = progression.getGameRules();
    const isPerfect = state.score === state.totalQuestions;

    player.playerData.total_quizzes_completed = (player.playerData.total_quizzes_completed || 0) + 1;
    player.playerData.total_play_time_seconds = (player.playerData.total_play_time_seconds || 0) + durationInSeconds;
    player.playerData.total_correct_answers = (player.playerData.total_correct_answers || 0) + state.score;
    player.playerData.total_questions_answered = (player.playerData.total_questions_answered || 0) + state.totalQuestions;

    if (isPerfect) {
        let perfectBonus = rules.xp_bonus_all_correct || 50;
        // تطبيق مهارة "نور الإتقان"
        perfectBonus += skills.getSkillEffect('perfect_bonus_xp');
        state.xpEarned += perfectBonus;
    }

    // --- منطق المبارزات ---
    if (state.testMode.type === 'duel') {
        const duel = state.testMode.duel;
        const isChallenger = duel.challenger_id === player.playerData.id;
        const scoreField = isChallenger ? 'challenger_score' : 'opponent_score';
        
        // التحقق من الفائز
        const opponentScore = isChallenger ? duel.opponent_score : duel.challenger_score;
        if (opponentScore !== null) { // إذا كان الخصم قد لعب بالفعل
            if (state.score > opponentScore) {
                duel.winner_id = player.playerData.id;
                // تطبيق مهارة "شرف المبارزة"
                state.xpEarned += skills.getSkillEffect('duel_win_bonus_xp');
            } else if (opponentScore > state.score) {
                duel.winner_id = isChallenger ? duel.opponent_id : duel.challenger_id;
            } else {
                duel.winner_id = 'draw'; // تعادل
            }
            duel.status = 'completed';
        }
        
        await api.updateDuel(duel.id, { [scoreField]: state.score, status: duel.status, winner_id: duel.winner_id });
    }
    // --- نهاية منطق المبارزات ---

    const oldXp = player.playerData.xp;
    player.playerData.xp += state.xpEarned;
    player.playerData.seasonal_xp = (player.playerData.seasonal_xp || 0) + state.xpEarned;

    const levelUpInfo = progression.checkForLevelUp(oldXp, player.playerData.xp);
    if (levelUpInfo) {
        player.playerData.diamonds += levelUpInfo.reward;
        dispatch('level_up', { newLevel: levelUpInfo.level });
    }

    // إرسال حدث إكمال الاختبار مع معلومات إضافية للغزوات
    dispatch('quiz_completed', { 
        isPerfect, 
        pageNumber: state.pageNumber,
        score: state.score,
        totalQuestions: state.totalQuestions
    });

    if (isPerfect) {
        dispatch('perfect_quiz');
    }
    if (state.xpEarned > 0) {
        dispatch('xp_earned', { amount: state.xpEarned });
    }

    if (state.testMode.type === 'special_challenge') {
        dispatch('special_challenge_completed', { challengeId: state.testMode.challengeId });
    }

    if (state.pageNumber > 0) {
        if (typeof player.playerData.page_high_scores !== 'object' || player.playerData.page_high_scores === null) {
            player.playerData.page_high_scores = {};
        }
        
        const currentHighScore = player.playerData.page_high_scores[state.pageNumber] || 0;
        const currentScorePercentage = (state.score / state.totalQuestions) * 100;

        if (currentScorePercentage > currentHighScore) {
            player.playerData.page_high_scores[state.pageNumber] = Math.round(currentScorePercentage);
            console.log(`تم تسجيل درجة عالية جديدة للصفحة ${state.pageNumber}: ${Math.round(currentScorePercentage)}%`);
        }
    }

    const resultToSave = {
        pageNumber: state.pageNumber,
        score: state.score,
        totalQuestions: state.totalQuestions,
        xpEarned: state.xpEarned,
        errorLog: state.errorLog
    };
    
    await player.savePlayer();
    if (resultToSave.pageNumber > 0 && state.testMode.type !== 'duel') { // لا نحفظ نتائج المبارزات في الجدول العام
        await api.saveResult(resultToSave);
    }
    
    ui.updateSaveMessage(true);

    if (state.errorLog.length > 0) {
        ui.displayErrorReview(state.errorLog);
    } else {
        const finalLevelUpInfo = progression.checkForLevelUp(player.playerData.xp - state.xpEarned, player.playerData.xp);
        ui.displayFinalResult(state, finalLevelUpInfo);
    }
}

export function getCurrentState() {
    return state;
}
