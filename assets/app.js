const HISTORY_KEY = 'ckv_history';

const tagKeywords = {
    action:     ['shoot', 'gun', 'battle', 'war', 'combat', 'fight', 'doom', 'kill', 'ultrakill', 'hotline', 'buckshot', 'counter', 'sniper', 'fps', 'rampage', 'assault'],
    puzzle:     ['puzzle', '2048', 'tetris', 'match', 'merge', 'logic', 'block', 'rope', 'escape', 'brain', 'color', 'colour'],
    racing:     ['car', 'race', 'drift', 'drive', 'truck', 'moto', 'rider', 'speed', 'stunt', 'rally', 'kart'],
    sports:     ['soccer', 'football', 'basketball', 'tennis', 'baseball', 'golf', 'bowling', 'pool', 'volleyball', 'cricket', 'rugby', 'ping pong', 'archery'],
    io:         ['.io', 'agar', 'slither', 'krunker', 'shellshock', 'ev.io', 'paper.io'],
    horror:     ['fnaf', 'freddy', 'backroom', 'nightmare', 'scary', 'amanda', 'baldi', 'horror', 'abandoned', 'arthurs', "arthur's"],
    idle:       ['clicker', 'idle', 'capitalist', 'cookie', 'tycoon', 'incremental', 'miner', 'factory'],
    platformer: ['dash', 'geometry', 'mario', 'platform', 'sonic', 'celeste', 'climb', 'jump king', 'getting over'],
    rpg:        ['rpg', 'quest', 'adventure', 'tale', 'crossing', 'pokemon', 'zelda', 'dungeon', 'academytale'],
    sandbox:    ['minecraft', 'terraria', 'build', 'craft', 'playground', 'people'],
    multiplayer:['2 player', '1v1', 'among us', 'battle royale', '1 on 1', 'duo', 'tag'],
};

function getTagsForTitle(title) {
    const lower = title.toLowerCase();
    const found = [];
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        if (keywords.some(kw => lower.includes(kw))) found.push(tag);
    }
    return found;
}

function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
}

function recordPlay(href, title) {
    const history = getHistory();
    const idx = history.findIndex(g => g.href === href);
    if (idx !== -1) history.splice(idx, 1);
    history.unshift({ href, title });
    if (history.length > 60) history.length = 60;
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }
    catch {}
}

function parseGames() {
    const div = document.createElement('div');
    div.innerHTML = games;
    return Array.from(div.querySelectorAll('.game-link')).map(a => ({
        href: a.getAttribute('href') || '',
        title: a.querySelector('div')?.textContent?.trim() || '',
        img: a.querySelector('img')?.getAttribute('src') || '',
        alt: a.querySelector('img')?.getAttribute('alt') || '',
    }));
}

function getSuggestions(allGames) {
    const history = getHistory();
    if (history.length < 2) return [];

    const tagCounts = {};
    history.slice(0, 20).forEach(g => {
        getTagsForTitle(g.title).forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const played = new Set(history.map(g => g.href));
    return allGames
        .filter(g => !played.has(g.href))
        .map(g => ({
            ...g,
            score: getTagsForTitle(g.title).reduce((n, t) => n + (tagCounts[t] || 0), 0),
        }))
        .filter(g => g.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
}

function buildCard(game) {
    if (game.isRandom) {
        const div = document.createElement('div');
        div.className = 'game-link random-game';
        div.id = 'random-btn';
        const img = document.createElement('img');
        img.id = 'random-preview';
        img.src = game.img;
        img.alt = game.alt;
        const label = document.createElement('div');
        label.textContent = game.title;
        div.appendChild(img);
        div.appendChild(label);
        div.addEventListener('click', () => {
            const random = allGames[Math.floor(Math.random() * (allGames.length - 1)) + 1];
            window.location.href = random.href;
        });
        return div;
    }
    const a = document.createElement('a');
    a.className = 'game-link';
    a.href = game.href;
    const img = document.createElement('img');
    img.src = game.img;
    img.alt = game.alt;
    img.loading = 'lazy';
    const label = document.createElement('div');
    label.textContent = game.title;
    a.appendChild(img);
    a.appendChild(label);
    a.addEventListener('click', () => recordPlay(game.href, game.title));
    return a;
}

const allGames = parseGames();
const randomGame = {
    href: '#',
    title: 'Random Game',
    img: allGames[0]?.img || 'favicon.png',
    alt: 'Random Game Cover',
    isRandom: true
};
allGames.unshift(randomGame);
allGames.sort((a, b) => {
    if (a.isRandom) return -1;
    if (b.isRandom) return 1;
    return a.title.localeCompare(b.title, undefined, { numeric: true });
});

const grid          = document.getElementById('game-grid');
const searchEl      = document.getElementById('search');
const tagFiltersEl  = document.getElementById('tag-filters');
const noResults     = document.getElementById('no-results');
const forYouSection = document.getElementById('for-you');
const suggestionsRow = document.getElementById('suggestions-row');

let activeTag    = 'all';
let searchQuery  = '';

searchEl.placeholder = `search ${allGames.length} games...`;

const fragment = document.createDocumentFragment();
allGames.forEach(g => fragment.appendChild(buildCard(g)));
grid.appendChild(fragment);

const randomImg = document.getElementById('random-preview');
const gameImages = [...allGames.slice(1)].map(g => g.img).sort(() => Math.random() - 0.5);
let imgIndex = 0;
setInterval(() => {
    imgIndex = (imgIndex + 1) % gameImages.length;
    randomImg.src = gameImages[imgIndex];
}, 200);

function filterGames() {
    const q = searchQuery.trim().toLowerCase();
    let visible = 0;
    grid.querySelectorAll('.game-link:not(.random-game)').forEach(a => {
        const title = (a.querySelector('div')?.textContent || '').toLowerCase();
        const titleOk = !q || title.includes(q);
        const tagOk   = activeTag === 'all' || getTagsForTitle(a.querySelector('div')?.textContent || '').includes(activeTag);
        const show    = titleOk && tagOk;
        a.style.display = show ? '' : 'none';
        if (show) visible++;
    });
    noResults.style.display = visible === 0 ? 'block' : 'none';
}

searchEl.addEventListener('input', () => {
    searchQuery = searchEl.value;
    filterGames();
    const q = searchEl.value.trim().toLowerCase();
    if (q === 'end') window.open('https://youtu.be/eVTXPUF4Oz4?si=fJegVrBYO1yf0I80');
    if (q === 'chicken') document.querySelector('.wordmark img').classList.add('spinning');
    if (q === 'ckv') {
        const msg = document.createElement('div');
        msg.textContent = 'hey';
        msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:96px;font-weight:900;color:var(--accent);pointer-events:none;z-index:9999;animation:fadepop 1.4s forwards';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 1400);
    }
});

searchEl.addEventListener('keydown', e => {
    if (e.key === 'Escape') { searchEl.value = ''; searchQuery = ''; filterGames(); }
});

tagFiltersEl.addEventListener('click', e => {
    const btn = e.target.closest('.tag-btn');
    if (!btn) return;
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTag = btn.dataset.tag;
    filterGames();
});

const suggestions = getSuggestions(allGames);
if (suggestions.length >= 3) {
    suggestions.forEach(g => suggestionsRow.appendChild(buildCard(g)));
    forYouSection.style.display = 'block';
}

const randomBtnLabels = ['random game', 'another one?', 'still looking?', 'just pick already', 'fine, here'];
let randomBtnIdx = 0;
let randomBtnReset = null;

document.getElementById('random-btn').addEventListener('click', () => {
    const visible = allGames.filter(g => {
        const tagOk   = activeTag === 'all' || getTagsForTitle(g.title).includes(activeTag);
        const titleOk = !searchQuery || g.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
        return tagOk && titleOk;
    });
    if (!visible.length) return;
    const pick = visible[Math.floor(Math.random() * visible.length)];
    const preview = document.getElementById('random-preview');
    preview.innerHTML = '';
    preview.appendChild(buildCard(pick));

    clearTimeout(randomBtnReset);
    randomBtnIdx = Math.min(randomBtnIdx + 1, randomBtnLabels.length - 1);
    document.getElementById('random-btn').textContent = randomBtnLabels[randomBtnIdx];
    randomBtnReset = setTimeout(() => {
        randomBtnIdx = 0;
        document.getElementById('random-btn').textContent = randomBtnLabels[0];
    }, 8000);
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
}

(function quirks() {
    const konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let konamiPos = 0;
    document.addEventListener('keydown', e => {
        konamiPos = e.key === konamiSeq[konamiPos] ? konamiPos + 1 : (e.key === konamiSeq[0] ? 1 : 0);
        if (konamiPos === konamiSeq.length) {
            konamiPos = 0;
            grid.classList.add('rainbow-mode');
            setTimeout(() => grid.classList.remove('rainbow-mode'), 5000);
        }
    });

    const logoImg = document.querySelector('.wordmark img');
    let logoTaps = [];
    logoImg.addEventListener('click', e => {
        e.preventDefault();
        const now = Date.now();
        logoTaps = logoTaps.filter(t => now - t < 700);
        logoTaps.push(now);
        if (logoTaps.length >= 3) {
            logoTaps = [];
            logoImg.classList.add('spinning');
            logoImg.addEventListener('animationend', () => logoImg.classList.remove('spinning'), { once: true });
        }
    });

    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 4) {
        document.querySelector('.wordmark').setAttribute('title', 'go to sleep');
    }

    const played = getHistory().length;
    if (played > 0) {
        const fp = document.querySelector('.site-footer p');
        if (fp) {
            const badge = document.createElement('span');
            badge.style.color = 'var(--text-muted)';
            badge.textContent = ` — ${played} game${played !== 1 ? 's' : ''} played`;
            fp.appendChild(badge);
        }
    }
}());
