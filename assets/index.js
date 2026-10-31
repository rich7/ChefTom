/* ==========================================================
   Tom de Ree – website scripts
   Laden met: <script src="script.js" defer></script>
   ========================================================== */

/* ---------- Instellingen ---------- */

// Web-app-URL van het Google Apps Script (contactformulier)
const CONTACT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyWKf0s4u9IANtEXFE80yiDC5r0-PByzRw3-JkN4jWHXg-tCg8IbPXGEWSDmsC-CXQL/exec';


/* ==========================================================
   1. NAVIGATIE
   ========================================================== */

const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

// Navigatiebalk krijgt een andere stijl zodra je gescrold hebt
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
});

// Mobiel menu openen/sluiten
navToggle.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

// Menu sluiten na een klik op een menu-link
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});


/* ==========================================================
   2. ANIMATIE BIJ SCROLLEN (.reveal)
   ========================================================== */

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // maar één keer animeren
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));


/* ==========================================================
   3. JAARTAL IN DE FOOTER
   ========================================================== */

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();


/* ==========================================================
   4. LIGHTBOX (foto's komen uit de HTML, niet uit dit bestand)
   Per .dish-card worden de <img>, de <h3> (titel) en de <p>
   (omschrijving) uitgelezen. Foto's wijzig je dus in de HTML.
   ========================================================== */

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

const dishCards = Array.from(document.querySelectorAll('.dish-card'));
let currentIndex = 0;

// Foto + bijschrift van de gekozen kaart in de lightbox zetten
function showCurrentDish() {
  const card = dishCards[currentIndex];
  const img = card.querySelector('img');
  const title = card.querySelector('h3');
  const sub = card.querySelector('p');

  lightboxImg.src = img.currentSrc || img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.innerHTML = '';
  if (title) lightboxCaption.append(title.textContent);
  if (sub) {
    const subEl = document.createElement('span');
    subEl.className = 'caption-sub';
    subEl.textContent = sub.textContent;
    lightboxCaption.append(subEl);
  }
}

// Laat de foto opnieuw "ronddraaiend en groeiend" verschijnen (animatie staat in de CSS)
function playSpin() {
  lightboxImg.classList.remove('spin');
  void lightboxImg.offsetWidth; // forceert herstart van de animatie
  lightboxImg.classList.add('spin');
}

function openLightbox(index) {
  currentIndex = index;
  showCurrentDish();
  lightbox.hidden = false;
  requestAnimationFrame(() => lightbox.classList.add('open'));
  playSpin();
  document.body.style.overflow = 'hidden'; // achtergrond niet laten scrollen
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => { lightbox.hidden = true; }, 400); // wacht tot de fade-out klaar is
}

function nextDish() {
  currentIndex = (currentIndex + 1) % dishCards.length;
  showCurrentDish();
  playSpin();
}

function prevDish() {
  currentIndex = (currentIndex - 1 + dishCards.length) % dishCards.length;
  showCurrentDish();
  playSpin();
}

// Klik op een foto opent de lightbox
dishCards.forEach((card, index) => {
  card.addEventListener('click', () => openLightbox(index));
});

lightboxClose.addEventListener('click', closeLightbox);
lightboxNext.addEventListener('click', nextDish);
lightboxPrev.addEventListener('click', prevDish);

// Klik naast de foto (op de donkere achtergrond) sluit de lightbox
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) closeLightbox();
});

// Toetsenbord: Esc = sluiten, pijltjes = vorige/volgende
document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextDish();
  if (e.key === 'ArrowLeft') prevDish();
});


/* ==========================================================
   5. CONTACTFORMULIER (verstuurt naar Google Sheets + e-mail)
   ========================================================== */

const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const successBox = document.getElementById('formSuccess');
const failBox = document.getElementById('formFail');

// Toon of verberg de foutmelding bij een veld (id "name" -> "nameError")
function setFieldError(fieldId, hasError) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const inputEl = document.getElementById(fieldId);
  errorEl.classList.toggle('show', hasError);
  inputEl.classList.toggle('invalid', hasError);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Als een veld als fout is gemarkeerd, controleer het opnieuw tijdens het typen
['name', 'email', 'message'].forEach(fieldId => {
  const input = document.getElementById(fieldId);
  input.addEventListener('input', () => {
    if (!input.classList.contains('invalid')) return;
    const isValid = fieldId === 'email'
      ? isValidEmail(input.value)
      : input.value.trim().length > 0;
    setFieldError(fieldId, !isValid);
  });
});

form.addEventListener('submit', async e => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  // Validatie
  const nameOk = name.length > 0;
  const emailOk = isValidEmail(email);
  const messageOk = message.length > 0;

  setFieldError('name', !nameOk);
  setFieldError('email', !emailOk);
  setFieldError('message', !messageOk);

  if (!(nameOk && emailOk && messageOk)) return;

  // Versturen
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';
  successBox.hidden = true;
  failBox.hidden = true;

  try {
    // Alle velden (inclusief het verborgen spamveld "website") gaan mee.
    // mode "no-cors": Google stuurt geen CORS-header terug, dus het antwoord
    // is niet leesbaar. Er komt alleen een fout als het netwerk zelf faalt.
    await fetch(CONTACT_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: new URLSearchParams(new FormData(form))
    });
    successBox.hidden = false;
    form.reset();
  } catch (err) {
    failBox.hidden = false;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;
  }
});
