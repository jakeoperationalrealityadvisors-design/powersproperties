
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const DEFAULT_DATA = { rentals: [], projects: [], content: [], settings: {} };

function normalizeData(source){
  return {
    rentals: Array.isArray(source?.rentals) ? source.rentals.map(item => ({
      ...item,
      available: typeof item.available === "boolean" ? item.available : true,
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      images: Array.isArray(item.images) && item.images.length ? item.images : ["assets/ui/placeholder.jpg"]
    })) : [],
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


function renderAmenitiesList(amenities = []){
  if(!amenities.length) return "";
  return `<div class="amenity-list">${amenities.map(item => `<span class="amenity-pill">${escapeHtml(item)}</span>`).join("")}</div>`;
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
  const property=(data.rentals || []).find(item => item.id === id) || (data.rentals || [])[0];
  if(!property){
    document.getElementById("property").innerHTML = "<div class='empty-state'>Property not found.</div>";
    return;
  }
  const images=property.images || ["assets/ui/placeholder.jpg"];
  document.getElementById("heroImage").style.backgroundImage = `url('${images[0]}')`;
  const thumbs=images.map((src, index) => `<button type="button" class="gallery-thumb ${index===0?'active':''}" onclick="setPropertySlide(${index})"><img src="${src}" alt="${escapeHtml(property.title)} thumbnail ${index+1}"></button>`).join("");
  document.getElementById("property").innerHTML = `
    <h1>${escapeHtml(property.title)}</h1>
    <p class="property-meta">${escapeHtml(property.location || "Baltic, PEI")}${property.price ? " • " + escapeHtml(property.price) : ""} • ${property.available ? "Available" : "Rented"}</p>
    <p>${escapeHtml(property.description || "")}</p>
    ${renderAmenitiesList(property.amenities)}
    ${property.details ? `<div style="margin-top:20px;"><h3>Details</h3><p style="color:var(--text-dim);">${escapeHtml(property.details).split("\n").join("<br>")}</p></div>` : ""}
    <div class="property-gallery-shell">
      <div class="property-gallery-stage">
        <img id="propertyStageImage" src="${images[0]}" alt="${escapeHtml(property.title)}" onclick="openLightbox(this.src)">
        ${images.length > 1 ? `<button type="button" class="carousel-control prev" aria-label="Previous photo" onclick="stepPropertySlide(-1)">‹</button><button type="button" class="carousel-control next" aria-label="Next photo" onclick="stepPropertySlide(1)">›</button>` : ""}
      </div>
      ${images.length > 1 ? `<div class="gallery-thumbs">${thumbs}</div>` : ""}
    </div>
    <br>
    <div class="contact-cta-row">
      <a href="mailto:${(data.settings && data.settings.email) || 'dustinpowers719@gmail.com'}" class="btn">Apply / Book Viewing</a>
      <a href="rentals.html" class="btn secondary">Back to Rentals</a>
    </div>`;
  window.__propertyImages = images;
  window.__propertyIndex = 0;
  const posts=(data.content || []).filter(post => (post.status || "published")==="published" && post.target==="property" && (!post.link || post.link===property.id));
  document.getElementById('dynamicContent').innerHTML = posts.map(post => `
    <div class="social-post">
      <div class="social-post-head"><div class="composer-avatar">P</div><div><strong>Powers Properties</strong><p>Property Update • ${escapeHtml(property.id)}</p></div></div>
      <div class="social-post-body"><h3>${escapeHtml(post.title)}</h3><p>${escapeHtml(post.body || "").split("\n").join("<br>")}</p>${post.details ? `<div class="social-post-details">${escapeHtml(post.details).split("\n").join("<br>")}</div>` : ""}</div>
    </div>`).join("");
}
function setPropertySlide(index){
  const images=window.__propertyImages || [];
  if(!images.length) return;
  const bounded=(index + images.length) % images.length;
  window.__propertyIndex=bounded;
  const stage=document.getElementById("propertyStageImage");
  if(stage) stage.src=images[bounded];
  document.querySelectorAll(".gallery-thumb").forEach((thumb, thumbIndex) => thumb.classList.toggle("active", thumbIndex===bounded));
}
function stepPropertySlide(step){ setPropertySlide((window.__propertyIndex || 0) + step); }
function openLightbox(src){ const lightbox=document.getElementById("lightbox"); const img=document.getElementById("lightboxImg"); if(lightbox && img){ img.src=src; lightbox.style.display="flex"; }}
function closeLightbox(){ const lightbox=document.getElementById("lightbox"); if(lightbox) lightbox.style.display="none"; }


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
