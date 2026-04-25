// --- DOM ELEMENTS ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const menuIconOpen = document.getElementById('menu-icon-open');
const menuIconClose = document.getElementById('menu-icon-close');
const tabFuture = document.getElementById('tab-future');
const tabPast = document.getElementById('tab-past');
const futureContainer = document.getElementById('future-events-container');
const pastContainer = document.getElementById('past-events-container');
const contactForm = document.getElementById('contact-form');
const contactSuccess = document.getElementById('contact-success');

// Default Google Form URL for join requests - replace with your form link
const joinFormUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSdPeQCVel3VL_6kfFlUK4VdT3aC5kJqm5q2kiCgV-GPtWM2gw/viewform';

// Public Google Sheet CSV URL for future games (replace ID/gid if needed)
const SHEET_FUTURE_GAMES_CSV_URL = 'https://docs.google.com/spreadsheets/d/1_FUgtBgOJOmxYNM67BVxpkDKDVuYGhmqm3dN--rYzls/gviz/tq?tqx=out:csv&gid=0';

/*
 Load future games from a public Google Sheet exported as CSV.
 Expected headers include: Date, Start time, End Time, Day, Pitch, Google maps link
 The function returns an array of event objects compatible with renderFutureEvents()
*/
function loadFutureGamesFromSheet(url) {
    return fetch(url, { cache: 'no-cache' }).then(res => {
        if (!res.ok) throw new Error('Sheet fetch failed');
        return res.text();
    }).then(text => {
        // Robust CSV parser that handles quoted fields with commas and CRLFs
        function parseCSV(text) {
            const rows = [];
            let cur = '';
            let row = [];
            let inQuotes = false;
            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (ch === '"') {
                    if (inQuotes && text[i + 1] === '"') { cur += '"'; i++; }
                    else { inQuotes = !inQuotes; }
                } else if (ch === ',' && !inQuotes) {
                    row.push(cur); cur = '';
                } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
                    // handle CRLF
                    if (ch === '\r' && text[i + 1] === '\n') continue;
                    row.push(cur); cur = '';
                    rows.push(row); row = [];
                } else {
                    cur += ch;
                }
            }
            // push last
            if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
            return rows.map(r => r.map(c => String(c || '').replace(/^\s+|\s+$/g, '').replace(/^"|"$/g, '').replace(/""/g, '"')));
        }

        const rows = parseCSV(text).filter(r => r.length > 0);
        if (!rows.length) return [];
        const headers = rows.shift().map(h => String(h || '').toLowerCase());
        const objects = rows.map(cols => {
            const obj = {};
            headers.forEach((h, i) => obj[h] = (cols[i] || '').trim());
            return obj;
        });

        return objects.map(r => {
            const date = r['date'] || r['day'] || '';
            const start = r['start time'] || r['start_time'] || r['start'] || '';
            const end = r['end time'] || r['end_time'] || r['end'] || '';
            const time = start && end ? `${start} - ${end}` : (start || end || '');
            const pitch = r['pitch'] || r['location'] || r['place'] || '';
            const maps = r['google maps link'] || r['google maps'] || r['maps'] || '';
            const title = pitch ? `Match at ${pitch}` : (date ? `Match — ${date}` : 'Match');
            return {
                type: 'Match',
                title,
                date,
                time,
                // keep raw name and maps link separate so rendering can create a highlighted clickable link
                location: pitch || '',
                mapsLink: maps || '',
                joinForm: joinFormUrl
            };
        });
    });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // FETCH DATA FROM JSON FILE
    fetch('data.json')
        .then(response => response.json())
        .then(async (data) => {
            // Try loading additional future games from the Google Sheet and merge
            let sheetEvents = [];
            try {
                sheetEvents = await loadFutureGamesFromSheet(SHEET_FUTURE_GAMES_CSV_URL);
            } catch (err) {
                console.warn('Could not load future games sheet:', err);
            }

            const combinedFuture = [ ...(data.futureEvents || []), ...sheetEvents ];

            // Render the data to the screen (with sheet events merged)
            renderFutureEvents(combinedFuture);
            renderPastEvents(data.pastEvents);
            renderNews(data.news);

            // Initialize icons AFTER the new HTML is injected
            lucide.createIcons();
            // Load leaderboard if the container exists
            if (document.getElementById('leaderboard-container')) {
                try { if (typeof loadLeaderboard === 'function') loadLeaderboard(); } catch (e) { /* load later */ }
                const btn = document.getElementById('reload-leaderboard');
                if (btn) btn.addEventListener('click', () => { try { loadLeaderboard(); } catch(e){} });
            }
        })
        .catch(error => {
            console.error("Error loading club data:", error);
            // Optional: You could inject a fallback message into your containers here if the fetch fails
        });
});

// --- MOBILE MENU LOGIC ---
function toggleMenu() {
    const isHidden = mobileMenu.classList.contains('hidden');
    if (isHidden) {
        mobileMenu.classList.remove('hidden');
        setTimeout(() => mobileMenu.classList.remove('opacity-0'), 10);
        document.body.style.overflow = 'hidden';
        mobileMenuBtn.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
        // focus first link for keyboard users
        setTimeout(() => {
            const first = mobileMenu.querySelector('.mobile-link');
            if (first) first.focus();
        }, 220);
    } else {
        mobileMenu.classList.add('opacity-0');
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            mobileMenu.setAttribute('aria-hidden', 'true');
        }, 300);
    }
    menuIconOpen.classList.toggle('hidden');
    menuIconClose.classList.toggle('hidden');
}

mobileMenuBtn.addEventListener('click', toggleMenu);
document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
        if (!mobileMenu.classList.contains('hidden')) toggleMenu();
    });
});

// Close mobile menu with ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) toggleMenu();
});


// --- TABS LOGIC ---
if (tabFuture) {
    tabFuture.addEventListener('click', () => {
        tabFuture.classList.add('bg-white', 'text-bfc-blue', 'shadow-sm');
        tabFuture.classList.remove('text-slate-500');
        if (tabPast) {
            tabPast.classList.remove('bg-white', 'text-bfc-blue', 'shadow-sm');
            tabPast.classList.add('text-slate-500');
        }

        if (futureContainer) futureContainer.classList.remove('hidden');
        if (pastContainer) pastContainer.classList.add('hidden');
    });
}

if (tabPast) {
    tabPast.addEventListener('click', () => {
        tabPast.classList.add('bg-white', 'text-bfc-blue', 'shadow-sm');
        tabPast.classList.remove('text-slate-500');
        if (tabFuture) {
            tabFuture.classList.remove('bg-white', 'text-bfc-blue', 'shadow-sm');
            tabFuture.classList.add('text-slate-500');
        }

        if (pastContainer) pastContainer.classList.remove('hidden');
        if (futureContainer) futureContainer.classList.add('hidden');
    });
}

// --- CONTACT FORM LOGIC ---
document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const success = document.getElementById('contact-success');
    success.classList.remove('hidden');
    e.target.reset();
    setTimeout(() => success.classList.add('hidden'), 4000);
});

// --- RENDERING FUNCTIONS ---
function renderFutureEvents(events) {
    futureContainer.innerHTML = events.map(event => {
        // Build location HTML: if mapsLink is present, show highlighted clickable link
        let locationHtml = '';
        if (event.mapsLink) {
            const label = event.location || event.mapsLink;
            locationHtml = `<a href="${event.mapsLink}" target="_blank" rel="noopener" class="text-bfc-blue font-semibold hover:underline">${label}</a>`;
        } else if (event.location && /<a\s/i.test(String(event.location))) {
            locationHtml = event.location; // already an anchor/html
        } else if (event.location) {
            locationHtml = `<span>${event.location}</span>`;
        }

        return `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full mb-6">
            <div class="h-2 ${event.type === 'Tournament' ? 'bg-bfc-yellow' : 'bg-bfc-blue'} rounded-t-2xl"></div>
            <div class="p-5 md:p-6 flex-grow">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md mb-3 inline-block ${event.type === 'Tournament' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">${event.type}</span>
                <h3 class="text-xl font-bold text-slate-900 mb-4">${event.title}</h3>
                <div class="space-y-2.5 text-sm text-slate-600">
                    ${event.date ? `<div class="flex items-center"><i data-lucide="calendar" class="w-4 h-4 mr-3 text-slate-400"></i><span class="font-medium">${event.date}</span></div>` : ''}
                    ${event.time ? `<div class="flex items-center"><i data-lucide="clock" class="w-4 h-4 mr-3 text-slate-400"></i><span>${event.time}</span></div>` : ''}
                    ${locationHtml ? `<div class="flex items-center"><i data-lucide="map-pin" class="w-4 h-4 mr-3 text-slate-400"></i><span>${locationHtml}</span></div>` : ''}
                    ${event.type === 'Tournament' && event.fee ? `
                    <div class="flex items-center"><i data-lucide="ticket" class="w-4 h-4 mr-3 text-slate-400"></i><span>${event.fee}</span></div>
                    ` : ''}
                </div>
            <div class="p-4 bg-slate-50 border-t border-slate-100">
                <a href="${event.joinForm || joinFormUrl}" target="_blank" rel="noopener" class="w-full bg-white border border-slate-200 text-bfc-blue py-3 rounded-xl font-bold text-sm flex items-center justify-center hover:border-bfc-blue transition-colors">
                    I want to Join <i data-lucide="chevron-right" class="ml-1 w-4 h-4"></i>
                </a>
            </div>
        </div>
        `;
    }).join('');
}

function renderPastEvents(events) {
    pastContainer.innerHTML = events.map(event => `
        <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden w-full">
            <div class="p-5 md:p-8 border-b border-slate-100 flex flex-col gap-2">
                <div class="flex justify-between items-start">
                    <h3 class="text-2xl font-bold text-slate-900">${event.title}</h3>
                    <span class="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-md whitespace-nowrap ml-3">${event.date}</span>
                </div>
                <p class="text-sm text-slate-600">${event.description}</p>
            </div>
            
            <div class="p-5 md:p-8 bg-slate-50">
                <div class="flex items-center mb-4 text-slate-500 font-bold uppercase tracking-wider text-xs">
                    <i data-lucide="camera" class="w-4 h-4 mr-2"></i> Event Photos
                </div>
                <div class="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-3 pb-2 -mx-5 px-5 md:mx-0 md:px-0 md:grid md:grid-cols-4 md:gap-4">
                    ${event.images.map(img => `
                        <div class="w-56 h-56 md:w-full md:h-auto md:aspect-square flex-shrink-0 snap-center rounded-2xl overflow-hidden bg-slate-200">
                            <img src="${img}" loading="lazy" class="w-full h-full object-cover"/>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function renderNews(newsItems) {
    document.getElementById('news-container').innerHTML = newsItems.map(news => `
        <article class="w-[85vw] md:w-full flex-shrink-0 snap-center cursor-pointer group">
            <div class="h-48 md:h-56 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                <img src="https://images.unsplash.com/photo-${news.image}?auto=format&fit=crop&q=80&w=600" loading="lazy" class="w-full h-full object-cover"/>
                <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md text-bfc-blue">
                    ${news.category}
                </span>
            </div>
            <div class="flex items-center text-xs text-slate-500 mb-2">
                <i data-lucide="calendar" class="w-3 h-3 mr-1.5"></i> ${news.date}
            </div>
            <h3 class="text-lg font-bold text-slate-900 mb-2 line-clamp-1">${news.title}</h3>
            <p class="text-sm text-slate-600 line-clamp-2">${news.summary}</p>
        </article>
    `).join('');
}

// --- Leaderboard: fetch published CSV and render ---
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1-2pvyiVeqrsTjx1YQRRNbqB60qgv7TCpkmKLwJKhOko/gviz/tq?tqx=out:csv&gid=0';

function parseCSV(text) {
    const rows = text.trim().split(/\r?\n/).map(r => r.trim());
    if (!rows.length) return [];
    const headers = rows.shift().split(',').map(h => h.trim().toLowerCase());
    return rows.map(line => {
        const cols = line.split(',').map(c => c.trim());
        const obj = {};
        headers.forEach((h,i) => obj[h] = cols[i] ?? '');
        return obj;
    });
}

function normalizeRecord(r) {
    function cleanCell(s) { return String(s || '').replace(/^\s+|\s+$|^"+|"+$/g, '').trim(); }
    const player = cleanCell(r['player'] || r['player of the week'] || r['name'] || Object.values(r)[0] || '');
    const winsRaw = cleanCell(r['wins'] || r['numbers of wins'] || r['number of wins'] || r['tally'] || Object.values(r)[1] || '0');
    const wins = parseInt((winsRaw.match(/-?\d+/) || ['0'])[0], 10) || 0;
    return { player, wins };
}

async function loadLeaderboard(url = SHEET_CSV_URL) {
    const container = document.getElementById('leaderboard-container');
    const rest = document.getElementById('leaderboard-rest');
    if (!container) return;
    container.innerHTML = '<div class="col-span-full text-center py-8 text-slate-500">Loading…</div>';
    rest.innerHTML = '';
    try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error('Network error');
        const text = await res.text();
        const rows = parseCSV(text).map(normalizeRecord).filter(r => r.player);
        const sorted = rows.sort((a,b) => b.wins - a.wins || a.player.localeCompare(b.player));
        container.innerHTML = '';
        // ensure exactly three slots for podium (use placeholders if needed)
        const top = sorted.slice(0,3);
        while (top.length < 3) top.push({ player: '—', wins: 0 });

        const first = top[0];
        const second = top[1];
        const third = top[2];

        function initialsOf(name) {
            const cleaned = String(name || '').replace(/"/g,'').trim();
            if (!cleaned) return '?';
            const parts = cleaned.split(/\s+/).filter(Boolean);
            if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
            return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
        }

        const html = `
            <div class="w-full flex items-end justify-center gap-6 md:gap-8">
                <!-- Silver (2) -->
                <div class="flex-1 flex flex-col items-center">
                    <div class="text-sm text-slate-500 mb-2">#2</div>
                    <div class="w-20 h-20 rounded-full bg-slate-300 flex items-center justify-center text-xl font-bold text-slate-800">${initialsOf(second.player)}</div>
                    <div class="mt-3 text-sm font-bold text-slate-900">${second.player}</div>
                    <div class="text-xs text-slate-500">${second.wins} ${second.wins === 1 ? 'win' : 'wins'}</div>
                    <div class="mt-4 h-36 w-full bg-slate-100 rounded-t-xl"></div>
                </div>

                <!-- Gold (1) -->
                <div class="flex-1 flex flex-col items-center">
                    <div class="text-sm text-slate-500 mb-2">#1</div>
                    <div class="w-24 h-24 rounded-full bg-gradient-to-br from-bfc-yellow to-bfc-blue flex items-center justify-center text-2xl font-extrabold text-white">${initialsOf(first.player)}</div>
                    <div class="mt-3 text-lg font-bold text-slate-900">${first.player}</div>
                    <div class="text-sm text-slate-500">${first.wins} ${first.wins === 1 ? 'win' : 'wins'}</div>
                    <div class="mt-4 h-44 w-full bg-bfc-yellow rounded-t-xl shadow-md"></div>
                </div>

                <!-- Bronze (3) -->
                <div class="flex-1 flex flex-col items-center">
                    <div class="text-sm text-slate-500 mb-2">#3</div>
                    <div class="w-20 h-20 rounded-full bg-amber-700 flex items-center justify-center text-xl font-bold text-white">${initialsOf(third.player)}</div>
                    <div class="mt-3 text-sm font-bold text-slate-900">${third.player}</div>
                    <div class="text-xs text-slate-500">${third.wins} ${third.wins === 1 ? 'win' : 'wins'}</div>
                    <div class="mt-4 h-28 w-full bg-amber-200 rounded-t-xl"></div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div class="col-span-full text-center py-8 text-red-500">Error loading leaderboard</div>`;
        console.error('Leaderboard error:', err);
    }
}
