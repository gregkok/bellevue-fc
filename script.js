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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // FETCH DATA FROM JSON FILE
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Render the data to the screen
            renderFutureEvents(data.futureEvents);
            renderPastEvents(data.pastEvents);
            renderNews(data.news);

            // Initialize icons AFTER the new HTML is injected
            lucide.createIcons();
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
    futureContainer.innerHTML = events.map(event => `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full">
            <div class="h-2 ${event.type === 'Tournament' ? 'bg-bfc-yellow' : 'bg-bfc-blue'}"></div>
            <div class="p-5 md:p-6 flex-grow">
                <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md mb-3 inline-block ${event.type === 'Tournament' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
        }">${event.type}</span>
                <h3 class="text-xl font-bold text-slate-900 mb-4">${event.title}</h3>
                <div class="space-y-2.5 text-sm text-slate-600">
                    <div class="flex items-center"><i data-lucide="calendar" class="w-4 h-4 mr-3 text-slate-400"></i><span class="font-medium">${event.date}</span></div>
                    <div class="flex items-center"><i data-lucide="clock" class="w-4 h-4 mr-3 text-slate-400"></i><span>${event.time}</span></div>
                    <div class="flex items-center"><i data-lucide="map-pin" class="w-4 h-4 mr-3 text-slate-400"></i><span>${event.location}</span></div>
                ${event.type === 'Tournament' ? `
                    <div class="flex items-center"><i data-lucide="ticket" class="w-4 h-4 mr-3 text-slate-400"></i><span>${event.fee}</span></div>
                ` : ''}
                </div>
            <div class="p-4 bg-slate-50 border-t border-slate-100">
                <a href="${event.joinForm || joinFormUrl}" target="_blank" rel="noopener" class="w-full bg-white border border-slate-200 text-bfc-blue py-3 rounded-xl font-bold text-sm flex items-center justify-center hover:border-bfc-blue transition-colors">
                    I want to Join <i data-lucide="chevron-right" class="ml-1 w-4 h-4"></i>
                </a>
            </div>
        </div>
    `).join('');
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