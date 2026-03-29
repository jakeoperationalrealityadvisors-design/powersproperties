
const DEFAULT_SETTINGS = {
  heroTitle: "Powers Construction & Properties",
  heroSubtitle: "Renovations • Builds • Property Management",
  primaryPhone: "(902) 432-4571",
  secondaryPhone: "",
  email: "dustinpowers719@gmail.com",
  secondaryEmail: "",
  location: "Baltic, PEI",
  showPrimaryPhone: true,
  showSecondaryPhone: false,
  showEmail: true,
  showSecondaryEmail: false,
  showLocation: true,
  showAboutSection: true,
  showEventSection: true,
  showBottomSection: true,
  showTeamSection: true,
  aboutTitle: "About Powers",
  aboutBody: "Local construction and property work handled directly, with straight answers, reliable timelines, and quality work that lasts.",
  aboutImage: "assets/branding/banner-main.png",
  eventTitle: "Featured Event / Update",
  eventBody: "Show current work, announcements, or seasonal updates here from the admin page.",
  eventImages: ["assets/branding/banner-alt.png"],
  bottomTitle: "More From Powers",
  bottomBody: "Upload more homepage images here to fill the lower section of the main page.",
  bottomImages: ["assets/branding/banner-main.png","assets/branding/banner-alt.png"],
  teamTitle: "Meet Our Team",
  teamBody: "Add team members from the admin panel with a photo and a short write-up.",
  teamProfiles: []
};
const DEFAULT_DATA = { rentals: [], projects: [], content: [], settings: DEFAULT_SETTINGS };

function normalizeData(source){
  return {
    rentals: Array.isArray(source?.rentals) ? source.rentals.map(item => ({
      ...item,
      images: Array.isArray(item.images) && item.images.length ? item.images : ["assets/ui/placeholder.jpg"]
    })) : [],
    projects: Array.isArray(source?.projects) ? source.projects : [],
    content: Array.isArray(source?.content) ? source.content : [],
    settings: { ...DEFAULT_SETTINGS, ...(source?.settings || {}) }
  };
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


function contactDefaults(){
  return {
    primaryPhone: "(902) 432-4571",
    secondaryPhone: "",
    email: "dustinpowers719@gmail.com",
    secondaryEmail: "",
    location: "Baltic, PEI",
    showPrimaryPhone: true,
    showSecondaryPhone: false,
    showEmail: true,
    showSecondaryEmail: false,
    showLocation: true
  };
}

function digitsOnly(value){
  return String(value || "").replace(/[^\d+]/g, "");
}

function getFirstById(){
  for(let i = 0; i < arguments.length; i += 1){
    const el = document.getElementById(arguments[i]);
    if(el) return el;
  }
  return null;
}

function applyGlobalContact(settings = {}){
  const merged = { ...contactDefaults(), ...(settings || {}) };

  const primaryCard = getFirstById("globalPrimaryPhoneCard", "primaryPhoneChip");
  const primaryText = getFirstById("globalPrimaryPhoneText", "primaryPhoneLink");
  if(primaryCard && primaryText){
    primaryText.textContent = merged.primaryPhone || contactDefaults().primaryPhone;
    if(primaryText.tagName === "A"){
      primaryText.href = "tel:" + digitsOnly(merged.primaryPhone || contactDefaults().primaryPhone);
    }
    if(primaryCard.tagName === "A"){
      primaryCard.href = "tel:" + digitsOnly(merged.primaryPhone || contactDefaults().primaryPhone);
    }
    primaryCard.classList.toggle("hidden", !merged.showPrimaryPhone);
  }

  const secondCard = getFirstById("globalSecondaryPhoneCard", "secondaryPhoneChip");
  const secondText = getFirstById("globalSecondaryPhoneText", "secondaryPhoneLink");
  if(secondCard && secondText){
    const hasSecond = !!merged.secondaryPhone;
    secondText.textContent = merged.secondaryPhone || "";
    if(secondText.tagName === "A"){
      secondText.href = hasSecond ? "tel:" + digitsOnly(merged.secondaryPhone) : "#";
    }
    if(secondCard.tagName === "A"){
      secondCard.href = hasSecond ? "tel:" + digitsOnly(merged.secondaryPhone) : "#";
    }
    secondCard.classList.toggle("hidden", !(merged.showSecondaryPhone && hasSecond));
  }

  const emailCard = getFirstById("globalEmailCard", "emailChip");
  const emailText = getFirstById("globalEmailText", "emailLink");
  if(emailCard && emailText){
    emailText.textContent = merged.email || contactDefaults().email;
    if(emailText.tagName === "A"){
      emailText.href = "mailto:" + (merged.email || contactDefaults().email);
    }
    if(emailCard.tagName === "A"){
      emailCard.href = "mailto:" + (merged.email || contactDefaults().email);
    }
    emailCard.classList.toggle("hidden", !merged.showEmail);
  }

  const email2Card = getFirstById("globalSecondaryEmailCard", "secondaryEmailChip");
  const email2Text = getFirstById("globalSecondaryEmailText", "secondaryEmailLink");
  if(email2Card && email2Text){
    const hasEmail2 = !!merged.secondaryEmail;
    email2Text.textContent = merged.secondaryEmail || "";
    if(email2Text.tagName === "A"){
      email2Text.href = hasEmail2 ? "mailto:" + merged.secondaryEmail : "#";
    }
    if(email2Card.tagName === "A"){
      email2Card.href = hasEmail2 ? "mailto:" + merged.secondaryEmail : "#";
    }
    email2Card.classList.toggle("hidden", !(merged.showSecondaryEmail && hasEmail2));
  }

  const locationCard = getFirstById("globalLocationCard", "locationChip");
  const locationText = getFirstById("globalLocationText", "locationText");
  if(locationCard && locationText){
    locationText.textContent = merged.location || contactDefaults().location;
    locationCard.classList.toggle("hidden", !merged.showLocation);
  }

  const aboutCallBtn = document.getElementById("aboutCallBtn");
  if(aboutCallBtn){
    aboutCallBtn.href = "tel:" + digitsOnly(merged.primaryPhone || contactDefaults().primaryPhone);
  }
  const aboutEmailBtn = document.getElementById("aboutEmailBtn");
  if(aboutEmailBtn){
    aboutEmailBtn.href = "mailto:" + (merged.email || contactDefaults().email);
  }
}

function renderCardCarousel(images, label, badgeMarkup = "", idPrefix = "carousel"){
  const list = Array.isArray(images) && images.length ? images : ["assets/ui/placeholder.jpg"];
  const slides = list.map((src, index) => `
    <img src="${src}" alt="${escapeHtml(label)} ${index + 1}" class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
  `).join("");
  const thumbs = list.length > 1 ? `<div class="carousel-dots">${list.map((_, index) => `<button type="button" class="carousel-dot ${index === 0 ? 'active' : ''}" aria-label="View image ${index + 1}" data-index="${index}" onclick="jumpCarousel(this, ${index})"></button>`).join("")}</div>` : "";
  const controls = list.length > 1 ? `
    <button type="button" class="carousel-control prev" aria-label="Previous photo" onclick="moveCarousel(this, -1)">‹</button>
    <button type="button" class="carousel-control next" aria-label="Next photo" onclick="moveCarousel(this, 1)">›</button>
  ` : "";
  return `
    <div class="img-wrap carousel-wrap" data-carousel-id="${idPrefix}" data-active-index="0">
      <div class="carousel-track">${slides}</div>
      ${badgeMarkup}
      ${controls}
      ${thumbs}
    </div>
  `;
}

function updateCarousel(root, nextIndex){
  if(!root) return;
  const slides = Array.from(root.querySelectorAll(".carousel-slide"));
  const dots = Array.from(root.querySelectorAll(".carousel-dot"));
  if(!slides.length) return;
  const bounded = (nextIndex + slides.length) % slides.length;
  slides.forEach((slide, index) => slide.classList.toggle("active", index === bounded));
  dots.forEach((dot, index) => dot.classList.toggle("active", index === bounded));
  root.dataset.activeIndex = String(bounded);
}

function moveCarousel(button, step){
  const root = button.closest(".carousel-wrap");
  const current = Number(root?.dataset.activeIndex || 0);
  updateCarousel(root, current + step);
}

function jumpCarousel(button, index){
  updateCarousel(button.closest(".carousel-wrap"), index);
}


function publishedContent(data, target){
  return (data.content || []).filter(item => (item.status || "published") === "published" && item.target === target);
}

function renderGalleryList(containerId, images, fallback){
  const container=document.getElementById(containerId);
  if(!container) return;
  const list=Array.isArray(images) && images.length ? images : [fallback];
  container.innerHTML = list.map((src, index) => `<div class="gallery-item"><img src="${src}" alt="Gallery image ${index + 1}"></div>`).join("");
}

function renderTeamGrid(settings){
  const section=document.getElementById("teamSection");
  if(section) section.style.display = settings.showTeamSection ? "" : "none";
    const teamTitleEl = getFirstById("teamSectionTitle", "teamTitle");
  const teamBodyEl = getFirstById("teamSectionBody", "teamBody");
  if(teamTitleEl) teamTitleEl.textContent = settings.teamTitle || DEFAULT_SETTINGS.teamTitle;
  if(teamBodyEl) teamBodyEl.textContent = settings.teamBody || DEFAULT_SETTINGS.teamBody;
  const profiles=Array.isArray(settings.teamProfiles) ? settings.teamProfiles : [];
  document.getElementById("teamGrid").innerHTML = profiles.length ? profiles.map(profile => `
    <div class="card team-card">
      <img src="${profile.photo || 'assets/branding/logo-stack.png'}" alt="${escapeHtml(profile.name || 'Team member')}">
      <div class="card-body">
        <h3>${escapeHtml(profile.name || 'Team Member')}</h3>
        <p class="team-role">${escapeHtml(profile.role || '')}</p>
        <p>${escapeHtml(profile.bio || '')}</p>
      </div>
    </div>`).join("") : '<div class="empty-state">Team profiles can be added from the admin page.</div>';
}



function applySettings(settings){
  const merged={...DEFAULT_SETTINGS, ...(settings || {})};
  applyGlobalContact(merged);
  document.getElementById("contactAboutTitle").textContent = merged.aboutTitle || DEFAULT_SETTINGS.aboutTitle;
  document.getElementById("contactAboutBody").textContent = merged.aboutBody || DEFAULT_SETTINGS.aboutBody;
  document.getElementById("contactAboutImage").src = merged.aboutImage || DEFAULT_SETTINGS.aboutImage;
  const callBtn = document.getElementById("contactCallBtn");
  const emailBtn = document.getElementById("contactEmailBtn");
  if(callBtn) callBtn.href = "tel:" + digitsOnly(merged.primaryPhone || contactDefaults().primaryPhone);
  if(emailBtn) emailBtn.href = "mailto:" + (merged.email || contactDefaults().email);
  renderTeamGrid({...merged, showTeamSection: true});
  const teamGrid = document.getElementById("teamGrid");
  const dest = document.getElementById("contactTeamGrid");
  if(teamGrid && dest){
    dest.innerHTML = teamGrid.innerHTML;
    teamGrid.innerHTML = "";
  }
}

function publishedContent(data, target){
  return (data.content || []).filter(item => (item.status || "published") === "published" && item.target === target);
}

function render(data){
  applySettings(data.settings || DEFAULT_SETTINGS);
  const posts = publishedContent(data, "contact");
  const dynamic = document.getElementById("dynamicContent");
  dynamic.innerHTML = posts.length ? posts.map(post => `
    <div class="social-post">
      <div class="social-post-head"><div class="composer-avatar">P</div><div><strong>Powers Properties</strong><p>Contact Update</p></div></div>
      <div class="social-post-body"><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.body || "").split("\n").join("<br>")}</p>${post.details ? `<div class="social-post-details">${escapeHtml(post.details).split("\n").join("<br>")}</div>` : ""}</div>
    </div>
  `).join("") : "";
}

async function loadSiteData(){
  try {
    const payload = await (window.PowersAPI ? window.PowersAPI.getSiteData() : fetch('data.json').then(r => r.json()));
    render(normalizeData(payload || DEFAULT_DATA));
  } catch (error) {
    console.error("Could not load site data", error);
    render(DEFAULT_DATA);
  }
}
loadSiteData();
window.addEventListener("storage", function(event){ if(!event.key || event.key === "powersData"){ loadSiteData(); } });
window.addEventListener("powersDataUpdated", loadSiteData);

(function(){
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('siteNav');
  if(!nav || !toggle || !menu) return;
  function closeMenu(){ nav.classList.remove('nav-open'); toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); }
  function openMenu(){ nav.classList.add('nav-open'); toggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); }
  toggle.addEventListener('click', function(){ nav.classList.contains('nav-open') ? closeMenu() : openMenu(); });
  menu.querySelectorAll('a').forEach(function(link){ link.addEventListener('click', closeMenu); });
  document.addEventListener('click', function(event){ if(window.innerWidth > 900) return; if(!nav.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', function(event){ if(event.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function(){ if(window.innerWidth > 900) closeMenu(); });
})();
