
const DEFAULT_DATA = { rentals: [], projects: [], content: [], settings: {} };

function normalizeData(source){
  return {
    rentals: Array.isArray(source?.rentals) ? source.rentals : [],
    projects: Array.isArray(source?.projects) ? source.projects : [],
    content: Array.isArray(source?.content) ? source.content : [],
    settings: source?.settings || {}
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

function applyGlobalContact(settings = {}){
  const merged = { ...contactDefaults(), ...(settings || {}) };

  const primaryCard = document.getElementById("globalPrimaryPhoneCard");
  const primaryText = document.getElementById("globalPrimaryPhoneText");
  if(primaryCard && primaryText){
    primaryText.textContent = merged.primaryPhone || contactDefaults().primaryPhone;
    primaryCard.href = "tel:" + digitsOnly(merged.primaryPhone || contactDefaults().primaryPhone);
    primaryCard.classList.toggle("hidden", !merged.showPrimaryPhone);
  }

  const secondCard = document.getElementById("globalSecondaryPhoneCard");
  const secondText = document.getElementById("globalSecondaryPhoneText");
  if(secondCard && secondText){
    const hasSecond = !!merged.secondaryPhone;
    secondText.textContent = merged.secondaryPhone || "";
    secondCard.href = hasSecond ? "tel:" + digitsOnly(merged.secondaryPhone) : "#";
    secondCard.classList.toggle("hidden", !(merged.showSecondaryPhone && hasSecond));
  }

  const emailCard = document.getElementById("globalEmailCard");
  const emailText = document.getElementById("globalEmailText");
  if(emailCard && emailText){
    emailText.textContent = merged.email || contactDefaults().email;
    emailCard.href = "mailto:" + (merged.email || contactDefaults().email);
    emailCard.classList.toggle("hidden", !merged.showEmail);
  }

  const email2Card = document.getElementById("globalSecondaryEmailCard");
  const email2Text = document.getElementById("globalSecondaryEmailText");
  if(email2Card && email2Text){
    const hasEmail2 = !!merged.secondaryEmail;
    email2Text.textContent = merged.secondaryEmail || "";
    email2Card.href = hasEmail2 ? "mailto:" + merged.secondaryEmail : "#";
    email2Card.classList.toggle("hidden", !(merged.showSecondaryEmail && hasEmail2));
  }

  const locationCard = document.getElementById("globalLocationCard");
  const locationText = document.getElementById("globalLocationText");
  if(locationCard && locationText){
    locationText.textContent = merged.location || contactDefaults().location;
    locationCard.classList.toggle("hidden", !merged.showLocation);
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

function render(data){
  applyGlobalContact(data.settings || {});
  const items = (data.projects || []);
  const el = document.getElementById('projects');
  el.innerHTML = items.length ? items.map((project, index) => {
    const badgeClass = project.status === "in-progress" ? "available" : "rented";
    const badgeText = project.status === "in-progress" ? "In Progress" : "Completed";
    return `
      <div class="card project-card fade-in" style="animation-delay:${index * 0.05}s">
        ${renderCardCarousel(project.images, project.title, `<span class="badge ${badgeClass}">${badgeText}</span>`, 'project-' + (project.id || index))}
        <div class="card-body">
          <h3>${escapeHtml(project.title)}</h3>
          <p>${escapeHtml(project.description || "")}</p>
          ${project.details ? `<p style="color:var(--text-dim); margin-top:10px;">${escapeHtml(project.details).split("\n").join("<br>")}</p>` : ""}
          <div class="card-actions">
            <a href="mailto:${(data.settings && data.settings.email) || 'dustinpowers719@gmail.com'}" class="btn">Inquire</a>
          </div>
        </div>
      </div>`;
  }).join("") : '<div class="empty-state">No projects available yet.</div>';

  const posts = publishedContent(data, "projects");
  document.getElementById('dynamicContent').innerHTML = posts.map((post, index) => `
    <div class="social-post fade-in" style="animation-delay:${index * 0.05}s;">
      <div class="social-post-head">
        <div class="composer-avatar">P</div>
        <div><strong>Powers Construction</strong><p>Project Update</p></div>
      </div>
      <div class="social-post-body">
        <h3>${escapeHtml(post.title)}</h3>
        <p>${escapeHtml(post.body || "").split("\n").join("<br>")}</p>
        ${post.details ? `<div class="social-post-details">${escapeHtml(post.details).split("\n").join("<br>")}</div>` : ""}
      </div>
    </div>`).join("");
}


(function(){
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('siteNav');
  if(!nav || !toggle || !menu) return;

  function closeMenu(){
    nav.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }

  function openMenu(){
    nav.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
  }

  toggle.addEventListener('click', function(){
    if(nav.classList.contains('nav-open')){
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.querySelectorAll('a').forEach(function(link){
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', function(event){
    if(window.innerWidth > 900) return;
    if(!nav.contains(event.target)){
      closeMenu();
    }
  });

  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape'){
      closeMenu();
    }
  });

  window.addEventListener('resize', function(){
    if(window.innerWidth > 900){
      closeMenu();
    }
  });
})();
