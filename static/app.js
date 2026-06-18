/**
 * ═══════════════════════════════════════════════════════
 *  Masal Makinesi – Ana Uygulama JavaScript
 *  TTS motoru, masal oluşturma, soru sistemi, arşiv
 * ═══════════════════════════════════════════════════════
 */

// ── State ──
const state = {
    selectedTopic: null,
    characters: [],
    currentStory: null,
    topics: [],
    ageGroups: [],
    answeredQuestions: 0,
    correctAnswers: 0,
    totalQuestions: 3,
    storySaved: false
};

// ── DOM Elements ──
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

// ──────────────────────────────────────
// Stars Background
// ──────────────────────────────────────
function initStars() {
    const canvas = $('stars-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let stars = [];
    const STAR_COUNT = 120;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: Math.random() * 1.5 + 0.3,
                alpha: Math.random(),
                da: (Math.random() - 0.5) * 0.015,
                color: ['#fbbf24', '#a78bfa', '#22d3ee', '#ffffff'][Math.floor(Math.random() * 4)]
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (const s of stars) {
            s.alpha += s.da;
            if (s.alpha <= 0.1 || s.alpha >= 1) s.da *= -1;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = s.color;
            ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
    }

    resize();
    createStars();
    draw();
    window.addEventListener('resize', () => { resize(); createStars(); });
}

// ──────────────────────────────────────
// Toast Notifications
// ──────────────────────────────────────
function showToast(message, type = 'success') {
    const container = $('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ──────────────────────────────────────
// Confetti Effect
// ──────────────────────────────────────
function fireConfetti() {
    const colors = ['#fbbf24', '#a78bfa', '#22d3ee', '#fb7185', '#34d399', '#f97316'];
    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
        confetti.style.animationDelay = Math.random() * 0.5 + 's';
        confetti.style.width = (Math.random() * 8 + 4) + 'px';
        confetti.style.height = (Math.random() * 8 + 4) + 'px';
        document.body.appendChild(confetti);
        setTimeout(() => confetti.remove(), 4000);
    }
}

// ──────────────────────────────────────
// Navigation Tabs
// ──────────────────────────────────────
function initNavigation() {
    $$('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            $$('.nav-tab').forEach(t => t.classList.remove('active'));
            $$('.section').forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const section = $(`section-${tab.dataset.tab}`);
            if (section) section.classList.add('active');

            // Arşiv sekmesine geçildiğinde yenile
            if (tab.dataset.tab === 'archive') loadArchive();
            if (tab.dataset.tab === 'nicknames') loadNicknamePool();
        });
    });
}

// ──────────────────────────────────────
// Topics
// ──────────────────────────────────────
async function loadTopics() {
    try {
        const res = await fetch('/api/topics');
        const data = await res.json();
        state.topics = data.topics;
        state.ageGroups = data.age_groups;
        renderTopics();
        renderAgeGroups();
    } catch (e) {
        console.error('Konular yüklenemedi:', e);
    }
}

function renderTopics() {
    const grid = $('topic-grid');
    grid.innerHTML = state.topics.map(t => `
        <div class="topic-card" data-topic-id="${t.id}" tabindex="0" role="button" aria-label="${t.name}">
            <span class="topic-icon">${t.icon}</span>
            <span class="topic-name">${t.name}</span>
        </div>
    `).join('');

    grid.querySelectorAll('.topic-card').forEach(card => {
        card.addEventListener('click', () => {
            grid.querySelectorAll('.topic-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.selectedTopic = card.dataset.topicId;
            updateGenerateButton();
        });
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                card.click();
            }
        });
    });
}

function renderAgeGroups() {
    const select = $('age-group-select');
    select.innerHTML = state.ageGroups.map(ag =>
        `<option value="${ag.id}" ${ag.id === 'ilkokul' ? 'selected' : ''}>${ag.name}</option>`
    ).join('');
}

// ──────────────────────────────────────
// Tag Input (Character Names)
// ──────────────────────────────────────
function initTagInput() {
    const input = $('tag-input');
    const container = $('tag-input-container');

    container.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addCharacter(input.value);
        }
        if (e.key === 'Backspace' && input.value === '' && state.characters.length > 0) {
            removeCharacter(state.characters.length - 1);
        }
    });

    // Ayrıca input'tan çıkınca da ekle
    input.addEventListener('blur', () => {
        if (input.value.trim()) addCharacter(input.value);
    });
}

function addCharacter(name) {
    name = name.replace(/,/g, '').trim();
    if (!name || state.characters.includes(name)) return;
    if (state.characters.length >= 8) {
        showToast('En fazla 8 kahraman ekleyebilirsiniz.', 'error');
        return;
    }

    state.characters.push(name);
    renderTags();
    $('tag-input').value = '';
    updateGenerateButton();
    updateNicknamePoolHighlights();
}

function removeCharacter(index) {
    state.characters.splice(index, 1);
    renderTags();
    updateGenerateButton();
    updateNicknamePoolHighlights();
}

function renderTags() {
    const container = $('tag-input-container');
    const input = $('tag-input');

    // Mevcut tag'leri temizle
    container.querySelectorAll('.tag').forEach(t => t.remove());

    // Tag'leri ekle
    state.characters.forEach((name, i) => {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = `${name} <button class="tag-remove" data-index="${i}" aria-label="${name} kaldır">✕</button>`;
        container.insertBefore(tag, input);
    });

    // Kaldır butonları
    container.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeCharacter(parseInt(btn.dataset.index));
        });
    });
}

// ──────────────────────────────────────
// Generate Button State
// ──────────────────────────────────────
function updateGenerateButton() {
    const btn = $('btn-generate');
    btn.disabled = !(state.selectedTopic && state.characters.length > 0);
}

// ──────────────────────────────────────
// Story Generation
// ──────────────────────────────────────
async function generateStory() {
    const apiKey = localStorage.getItem('gemini_api_key') || '';
    if (!apiKey) {
        showToast('Lütfen önce Ayarlar sekmesinden Gemini API anahtarınızı girin.', 'error');
        const settingsTab = $('tab-settings');
        if (settingsTab) settingsTab.click();
        return;
    }

    const btn = $('btn-generate');
    const loading = $('loading-overlay');
    const storyContainer = $('story-container');

    btn.disabled = true;
    loading.classList.add('active');
    storyContainer.classList.remove('active');

    // Scroll to loading
    loading.scrollIntoView({ behavior: 'smooth', block: 'center' });

    try {
        const res = await fetch('/api/generate-story', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({
                topic_id: state.selectedTopic,
                age_group_id: $('age-group-select').value,
                characters: state.characters
            })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.error || 'Bir hata oluştu.', 'error');
            loading.classList.remove('active');
            btn.disabled = false;
            return;
        }

        state.currentStory = data;
        state.storySaved = false;
        state.answeredQuestions = 0;
        state.correctAnswers = 0;

        displayStory(data);
        loading.classList.remove('active');
        storyContainer.classList.add('active');

        // Scroll to story
        setTimeout(() => {
            storyContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);

    } catch (e) {
        showToast('Bağlantı hatası. Lütfen tekrar deneyin.', 'error');
        console.error(e);
    } finally {
        loading.classList.remove('active');
        btn.disabled = false;
    }
}

function displayStory(data) {
    // Title
    $('story-title').textContent = data.title;

    // Meta badges
    const topic = state.topics.find(t => t.id === data.topic.id);
    $('story-meta').innerHTML = `
        <span class="story-meta-badge">${topic ? topic.icon : '📚'} ${data.topic.name}</span>
        <span class="story-meta-badge">👦 ${data.characters.join(', ')}</span>
        <span class="story-meta-badge">🎯 ${data.age_group.name}</span>
    `;

    // Story text with typewriter effect
    typewriterEffect($('story-text'), data.story);

    // Questions
    renderQuestions(data.questions, 'questions-list', 'score-display');

    // Reset save button
    const saveBtn = $('btn-save-story');
    saveBtn.classList.remove('saved');
    saveBtn.innerHTML = '💾 Arşive Kaydet';
}

function typewriterEffect(element, text, speed = 8) {
    element.textContent = '';
    let i = 0;

    function type() {
        if (i < text.length) {
            // Her seferinde bir chunk ekle (daha hızlı)
            const chunk = text.substring(i, Math.min(i + 3, text.length));
            element.textContent += chunk;
            i += 3;
            setTimeout(type, speed);
        }
    }

    type();
}

// ──────────────────────────────────────
// Questions System
// ──────────────────────────────────────
function renderQuestions(questions, containerId, scoreId) {
    const container = $(containerId);
    if (!questions || questions.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Sorular yüklenemedi.</p>';
        return;
    }

    // Score state for this specific question set
    let answered = 0;
    let correct = 0;

    container.innerHTML = questions.map((q, qi) => `
        <div class="question-card" id="q-${containerId}-${qi}">
            <div class="question-text">
                <span class="question-number">${qi + 1}</span>
                <span>${q.question}</span>
            </div>
            <ul class="options-list">
                ${q.options.map((opt, oi) => `
                    <li>
                        <button class="option-btn"
                                data-question="${qi}"
                                data-option="${oi}"
                                data-correct="${q.correct}"
                                data-container="${containerId}"
                                data-score="${scoreId}">
                            ${opt}
                        </button>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');

    // Event listeners
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const qIdx = parseInt(btn.dataset.question);
            const oIdx = parseInt(btn.dataset.option);
            const correctIdx = parseInt(btn.dataset.correct);
            const cId = btn.dataset.container;
            const sId = btn.dataset.score;

            // Bu sorunun butonlarını devre dışı bırak
            const questionCard = btn.closest('.question-card');
            questionCard.querySelectorAll('.option-btn').forEach(b => {
                b.disabled = true;
                if (parseInt(b.dataset.option) === correctIdx) {
                    b.classList.add('correct');
                }
            });

            if (oIdx === correctIdx) {
                btn.classList.add('correct');
                correct++;
            } else {
                btn.classList.add('wrong');
            }

            answered++;

            // Toplam soru kontrolü
            if (answered === questions.length) {
                showScore(correct, questions.length, sId);
                if (correct === questions.length) {
                    fireConfetti();
                }
            }
        });
    });
}

function showScore(correct, total, scoreId) {
    const scoreDisplay = $(scoreId);
    if (!scoreDisplay) return;

    let emoji, text;
    if (correct === total) {
        emoji = '🏆';
        text = 'Harika! Tüm soruları doğru bildiniz!';
    } else if (correct >= total * 0.66) {
        emoji = '🌟';
        text = 'Çok iyi! Neredeyse hepsini bildiniz!';
    } else {
        emoji = '💪';
        text = 'İyi deneme! Masalı tekrar okuyup deneyebilirsiniz.';
    }

    $(`${scoreId.replace('score-display', 'score-emoji')}`) ?
        ($(scoreId.replace('-display', '-emoji')) || scoreDisplay.querySelector('.score-emoji')).textContent = emoji : null;

    // Direct element access
    const emojiEl = scoreDisplay.querySelector('.score-emoji') || $('score-emoji');
    const textEl = scoreDisplay.querySelector('.score-text') || $('score-text');
    const detailEl = scoreDisplay.querySelector('.score-detail') || $('score-detail');

    if (emojiEl) emojiEl.textContent = emoji;
    if (textEl) textEl.textContent = text;
    if (detailEl) detailEl.textContent = `${correct} / ${total} doğru cevap`;

    scoreDisplay.classList.add('active');
}

// ──────────────────────────────────────
// TTS Engine
// ──────────────────────────────────────
const tts = {
    synth: window.speechSynthesis,
    utterance: null,
    isPaused: false,
    currentText: '',

    getVoice() {
        const voices = this.synth.getVoices();
        // Türkçe ses ara
        let voice = voices.find(v => v.lang.startsWith('tr'));
        if (!voice) voice = voices.find(v => v.lang.startsWith('tr-TR'));
        if (!voice) voice = voices[0]; // fallback
        return voice;
    },

    speak(text) {
        this.stop();
        this.currentText = text;

        // Cümlelere ayır ve sıralı oku
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        let index = 0;

        const speakNext = () => {
            if (index >= sentences.length) {
                $('btn-tts-play')?.classList.remove('speaking');
                return;
            }

            const utterance = new SpeechSynthesisUtterance(sentences[index].trim());
            utterance.voice = this.getVoice();
            utterance.rate = parseFloat($('speed-slider')?.value || 0.9);
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => {
                index++;
                speakNext();
            };

            utterance.onerror = (e) => {
                if (e.error !== 'canceled') {
                    console.error('TTS hatası:', e);
                }
            };

            this.utterance = utterance;
            this.synth.speak(utterance);
        };

        $('btn-tts-play')?.classList.add('speaking');
        this.isPaused = false;
        speakNext();
    },

    pause() {
        if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            this.isPaused = true;
            $('btn-tts-play')?.classList.remove('speaking');
        }
    },

    resume() {
        if (this.synth.paused) {
            this.synth.resume();
            this.isPaused = false;
            $('btn-tts-play')?.classList.add('speaking');
        }
    },

    stop() {
        this.synth.cancel();
        this.isPaused = false;
        this.utterance = null;
        $('btn-tts-play')?.classList.remove('speaking');
    }
};

function initTTS() {
    // Seslerin yüklenmesini bekle
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => tts.getVoice();
    }

    // Ana sayfa TTS kontrolleri
    $('btn-tts-play')?.addEventListener('click', () => {
        if (tts.isPaused) {
            tts.resume();
        } else if (state.currentStory) {
            tts.speak(state.currentStory.story);
        }
    });

    $('btn-tts-pause')?.addEventListener('click', () => tts.pause());
    $('btn-tts-stop')?.addEventListener('click', () => tts.stop());

    // Hız slider
    $('speed-slider')?.addEventListener('input', (e) => {
        $('speed-value').textContent = parseFloat(e.target.value).toFixed(1) + 'x';
    });

    // Modal TTS kontrolleri
    $('modal-btn-tts-play')?.addEventListener('click', () => {
        const text = $('modal-story-text')?.textContent;
        if (text) {
            if (tts.isPaused) {
                tts.resume();
            } else {
                tts.speak(text);
            }
        }
    });

    $('modal-btn-tts-pause')?.addEventListener('click', () => tts.pause());
    $('modal-btn-tts-stop')?.addEventListener('click', () => tts.stop());
}

// ──────────────────────────────────────
// Save Story
// ──────────────────────────────────────
async function saveStory() {
    if (!state.currentStory || state.storySaved) return;

    try {
        const res = await fetch('/api/archive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: state.currentStory.title,
                topic_id: state.currentStory.topic.id,
                topic_name: state.currentStory.topic.name,
                age_group: state.currentStory.age_group.name,
                characters: state.currentStory.characters,
                story_text: state.currentStory.story,
                questions: state.currentStory.questions
            })
        });

        const data = await res.json();
        if (res.ok) {
            state.storySaved = true;
            const saveBtn = $('btn-save-story');
            saveBtn.classList.add('saved');
            saveBtn.innerHTML = '✅ Kaydedildi!';
            showToast(data.message);
        } else {
            showToast(data.error || 'Kaydetme hatası.', 'error');
        }
    } catch (e) {
        showToast('Bağlantı hatası.', 'error');
    }
}

// ──────────────────────────────────────
// Archive
// ──────────────────────────────────────
async function loadArchive() {
    try {
        const res = await fetch('/api/archive');
        const data = await res.json();
        renderArchive(data.stories);
    } catch (e) {
        console.error('Arşiv yüklenemedi:', e);
    }
}

function renderArchive(stories) {
    const list = $('archive-list');
    const empty = $('archive-empty');

    if (!stories || stories.length === 0) {
        empty.style.display = 'block';
        list.innerHTML = '';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = stories.map(s => {
        const chars = typeof s.characters === 'string' ? JSON.parse(s.characters) : s.characters;
        const date = new Date(s.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        const topic = state.topics.find(t => t.id === s.topic_id);
        const icon = topic ? topic.icon : '📖';

        return `
            <div class="archive-card" data-story-id="${s.id}">
                <span class="archive-card-icon">${icon}</span>
                <div class="archive-card-info" data-action="open">
                    <div class="archive-card-title">${s.title}</div>
                    <div class="archive-card-meta">
                        <span>📅 ${date}</span>
                        <span>👦 ${chars.join(', ')}</span>
                        <span>🎯 ${s.age_group || ''}</span>
                    </div>
                </div>
                <div class="archive-card-actions">
                    <button class="archive-btn ${s.is_favorite ? 'fav-active' : ''}"
                            data-action="fav" data-id="${s.id}" title="Favori">
                        ${s.is_favorite ? '★' : '☆'}
                    </button>
                    <button class="archive-btn delete-btn"
                            data-action="delete" data-id="${s.id}" title="Sil">
                        🗑
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Event listeners
    list.querySelectorAll('.archive-card').forEach(card => {
        // Masal açma
        card.querySelector('[data-action="open"]')?.addEventListener('click', () => {
            openStoryModal(card.dataset.storyId);
        });

        // Favori
        card.querySelector('[data-action="fav"]')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            try {
                const res = await fetch(`/api/archive/${id}/favorite`, { method: 'POST' });
                if (res.ok) loadArchive();
            } catch (err) { console.error(err); }
        });

        // Silme
        card.querySelector('[data-action="delete"]')?.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            if (confirm('Bu masalı silmek istediğinize emin misiniz?')) {
                try {
                    const res = await fetch(`/api/archive/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast('Masal silindi.');
                        loadArchive();
                    }
                } catch (err) { console.error(err); }
            }
        });
    });
}

async function openStoryModal(storyId) {
    try {
        const res = await fetch(`/api/archive/${storyId}`);
        const story = await res.json();

        if (res.ok) {
            $('modal-story-title').textContent = story.title;

            const chars = typeof story.characters === 'string'
                ? JSON.parse(story.characters) : story.characters;
            const questions = typeof story.questions_json === 'string'
                ? JSON.parse(story.questions_json) : story.questions_json;

            $('modal-story-meta').innerHTML = `
                <span class="story-meta-badge">📚 ${story.topic_name}</span>
                <span class="story-meta-badge">👦 ${chars.join(', ')}</span>
                <span class="story-meta-badge">🎯 ${story.age_group}</span>
            `;

            $('modal-story-text').textContent = story.story_text;

            // Soruları render et
            if (questions && questions.length > 0) {
                $('modal-questions-container').style.display = 'block';
                renderQuestions(questions, 'modal-questions-list', 'modal-score-display');
            } else {
                $('modal-questions-container').style.display = 'none';
            }

            $('story-modal').classList.add('active');
        }
    } catch (e) {
        showToast('Masal yüklenemedi.', 'error');
    }
}

function initModal() {
    $('modal-close')?.addEventListener('click', () => {
        $('story-modal').classList.remove('active');
        tts.stop();
    });

    $('story-modal')?.addEventListener('click', (e) => {
        if (e.target === $('story-modal')) {
            $('story-modal').classList.remove('active');
            tts.stop();
        }
    });
}

// ──────────────────────────────────────
// Nickname Pool
// ──────────────────────────────────────
async function loadNicknamePool() {
    try {
        const res = await fetch('/api/nicknames');
        const data = await res.json();
        renderNicknamePoolInCreate(data.nicknames);
        renderNicknamePoolManagement(data.nicknames);
    } catch (e) {
        console.error('Takma adlar yüklenemedi:', e);
    }
}

function renderNicknamePoolInCreate(nicknames) {
    const pool = $('nickname-pool');
    if (!nicknames || nicknames.length === 0) {
        pool.innerHTML = '';
        return;
    }

    pool.innerHTML = nicknames.map(n => {
        const inUse = state.characters.includes(n.name);
        return `<button class="nickname-pool-chip ${inUse ? 'in-use' : ''}"
                        data-name="${n.name}">${n.name}</button>`;
    }).join('');

    pool.querySelectorAll('.nickname-pool-chip:not(.in-use)').forEach(chip => {
        chip.addEventListener('click', () => {
            addCharacter(chip.dataset.name);
        });
    });
}

function updateNicknamePoolHighlights() {
    const chips = $$('#nickname-pool .nickname-pool-chip');
    chips.forEach(chip => {
        const inUse = state.characters.includes(chip.dataset.name);
        chip.classList.toggle('in-use', inUse);
    });
}

function renderNicknamePoolManagement(nicknames) {
    const container = $('pool-nickname-list');
    if (!nicknames || nicknames.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem;">Henüz takma ad eklenmemiş.</p>';
        return;
    }

    container.innerHTML = nicknames.map(n => `
        <span class="tag" style="background: var(--bg-card); border: 1px solid var(--glass-border); color: var(--text-primary);">
            ${n.name}
            <button class="tag-remove" data-nickname-id="${n.id}" aria-label="${n.name} sil">✕</button>
        </span>
    `).join('');

    container.querySelectorAll('.tag-remove').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.nicknameId;
            try {
                const res = await fetch(`/api/nicknames/${id}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('Takma ad silindi.');
                    loadNicknamePool();
                }
            } catch (e) {
                showToast('Silme hatası.', 'error');
            }
        });
    });
}

async function addPoolNickname() {
    const input = $('pool-nickname-input');
    const name = input.value.trim();
    if (!name) return;

    try {
        const res = await fetch('/api/nicknames', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });

        const data = await res.json();
        if (res.ok) {
            input.value = '';
            showToast(`"${name}" eklendi!`);
            loadNicknamePool();
        } else {
            showToast(data.error || 'Ekleme hatası.', 'error');
        }
    } catch (e) {
        showToast('Bağlantı hatası.', 'error');
    }
}

function initNicknamePool() {
    $('btn-add-pool-nickname')?.addEventListener('click', addPoolNickname);

    $('pool-nickname-input')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addPoolNickname();
        }
    });
}

// ──────────────────────────────────────
// New Story (Reset)
// ──────────────────────────────────────
function resetToCreate() {
    tts.stop();
    state.currentStory = null;
    state.storySaved = false;
    state.answeredQuestions = 0;
    state.correctAnswers = 0;

    $('story-container').classList.remove('active');
    $('loading-overlay').classList.remove('active');
    $('score-display').classList.remove('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ──────────────────────────────────────
// Event Bindings
// ──────────────────────────────────────
function initEventListeners() {
    $('btn-generate')?.addEventListener('click', generateStory);
    $('btn-save-story')?.addEventListener('click', saveStory);
    $('btn-new-story')?.addEventListener('click', resetToCreate);
}

// ──────────────────────────────────────
// Settings Management
// ──────────────────────────────────────
function initSettings() {
    const saveBtn = $('btn-save-api-key');
    const input = $('api-key-input');

    if (!saveBtn || !input) return;

    // Load saved API key on startup
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
        input.value = savedKey;
    }

    saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (!key) {
            localStorage.removeItem('gemini_api_key');
            showToast('Gemini API anahtarı temizlendi.', 'success');
        } else {
            localStorage.setItem('gemini_api_key', key);
            showToast('Gemini API anahtarı başarıyla kaydedildi!', 'success');
        }
    });
}

// ──────────────────────────────────────
// Initialize App
// ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    initStars();
    initNavigation();
    initTagInput();
    initTTS();
    initModal();
    initNicknamePool();
    initSettings();
    initEventListeners();

    await loadTopics();
    await loadNicknamePool();
});

// TTS'i sayfa kapatılırken durdur
window.addEventListener('beforeunload', () => tts.stop());
