
const SESSION_KEY = "powersAdminSession";
const STORAGE_KEY = "powersData";
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
  showEventSection: false,
  showBottomSection: true,
  showTeamSection: false,
  aboutTitle: "About Powers Construction",
  aboutBody: "Local construction and property work handled directly, with straight answers, reliable timelines, and quality work that lasts.",
  aboutImage: "assets/branding/banner-main.png",
  eventTitle: "Featured Event / Update",
  eventBody: "Show current work, announcements, or seasonal updates here from the admin page.",
  eventImages: ["assets/branding/banner-alt.png"],
  bottomTitle: "More From Powers Construction",
  bottomBody: "Upload more homepage images here to fill the lower section of the main page.",
  bottomImages: ["assets/branding/banner-main.png", "assets/branding/banner-alt.png"],
  teamTitle: "",
  teamBody: "",
  teamProfiles: []
};

const RENTAL_AMENITIES = [
  "Lawn care", "Snow removal", "Utilities included", "Pet-friendly",
  "Feed-only", "Lights-only", "Septic", "Well", "Parking", "Laundry",
  "Furnished", "Internet included"
];

const TARGET_DEFINITIONS = {
  homepageAboutImage: { label: "Homepage → About image", multiple: false },
  homepageEventImages: { label: "Homepage → Event images", multiple: true },
  homepageBottomImages: { label: "Homepage → Bottom images", multiple: true },
  teamProfilePhoto: { label: "Homepage → Team profile photo", multiple: false },
  rentalUploads: { label: "Rentals → Listing gallery", multiple: true },
  projectBeforeImage: { label: "Projects → Before image", multiple: false },
  projectAfterImage: { label: "Projects → After image", multiple: false },
  projectGalleryImages: { label: "Projects → Gallery images", multiple: true }
};

let data = normalizeData(seedData());
let state = {
  workspace: "dashboard",
  editingRentalId: "",
  editingProjectId: "",
  editingContentId: "",
  editingTeamId: "",
  rentalUploads: [],
  projectBeforeImage: "",
  projectAfterImage: "",
  projectGalleryImages: [],
  homepageAboutImage: "",
  homepageEventImages: [],
  homepageBottomImages: [],
  teamProfilePhoto: "",
  uploader: {
    open: false,
    target: "homepageAboutImage",
    files: [],
    uploaded: []
  }
};

document.addEventListener("DOMContentLoaded", bootstrap);

async function bootstrap(){
  bindAuth();
  bindWorkspaceNav();
  bindButtons();
  bindUploader();
  renderAmenities();
  hydrateFromCache();
  const authenticated = await hasSession();
  if(authenticated){
    showApp();
    await refreshData();
  } else {
    showGate();
  }
}

function seedData(){
  return {
    rentals: [
      {
        id: "unit1",
        title: "Baltic Unit",
        description: "Fresh renovation, modern finish",
        details: "Fully renovated unit with updated flooring, kitchen, and fixtures. Designed for comfort and long-term living.",
        images: ["assets/rentals/unit1-1.jpg", "assets/rentals/unit1-2.jpg"],
        available: true,
        price: "",
        location: "Baltic, PEI",
        featured: true,
        amenities: ["Parking", "Laundry"]
      }
    ],
    projects: [
      {
        id: "proj1",
        title: "Full Interior Renovation",
        description: "Complete gut and rebuild",
        details: "Full demolition and rebuild including kitchen, flooring, drywall, and finishing work.",
        images: ["assets/projects/project1-before.jpg", "assets/projects/project1-after.jpg"],
        status: "in-progress"
      }
    ],
    content: [],
    settings: { ...DEFAULT_SETTINGS }
  };
}

function normalizeData(source){
  return {
    rentals: Array.isArray(source?.rentals) ? source.rentals.map(item => ({
      ...item,
      id: String(item.id || "").trim(),
      title: item.title || "",
      description: item.description || "",
      details: item.details || "",
      images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
      available: typeof item.available === "boolean" ? item.available : true,
      featured: !!item.featured,
      amenities: Array.isArray(item.amenities) ? item.amenities : [],
      price: item.price || "",
      location: item.location || ""
    })) : [],
    projects: Array.isArray(source?.projects) ? source.projects.map(item => ({
      ...item,
      id: String(item.id || "").trim(),
      title: item.title || "",
      description: item.description || "",
      details: item.details || "",
      images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
      status: item.status || "completed"
    })) : [],
    content: Array.isArray(source?.content) ? source.content.map(item => ({
      ...item,
      id: item.id || cryptoId(),
      target: item.target || "home",
      title: item.title || "",
      body: item.body || "",
      details: item.details || "",
      status: item.status || "published",
      updatedAt: item.updatedAt || new Date().toISOString()
    })) : [],
    settings: {
      ...DEFAULT_SETTINGS,
      ...(source?.settings || {}),
      eventImages: Array.isArray(source?.settings?.eventImages) ? source.settings.eventImages.filter(Boolean) : [...DEFAULT_SETTINGS.eventImages],
      bottomImages: Array.isArray(source?.settings?.bottomImages) ? source.settings.bottomImages.filter(Boolean) : [...DEFAULT_SETTINGS.bottomImages],
      teamProfiles: Array.isArray(source?.settings?.teamProfiles) ? source.settings.teamProfiles.map(profile => ({
        id: profile.id || cryptoId(),
        name: profile.name || "",
        role: profile.role || "",
        bio: profile.bio || "",
        photo: profile.photo || ""
      })) : []
    }
  };
}

function hydrateFromCache(){
  try {
    const local = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if(local){
      data = normalizeData(local);
    }
  } catch (error) {
    console.warn("Could not hydrate admin cache", error);
  }
  primeDraftsFromData();
  renderAll();
}

function primeDraftsFromData(){
  const settings = data.settings || DEFAULT_SETTINGS;
  state.homepageAboutImage = settings.aboutImage || "";
  state.homepageEventImages = Array.isArray(settings.eventImages) ? [...settings.eventImages] : [];
  state.homepageBottomImages = Array.isArray(settings.bottomImages) ? [...settings.bottomImages] : [];
  state.teamProfilePhoto = "";
  resetRentalForm(false);
  resetProjectForm(false);
  resetContentForm(false);
  resetTeamForm(false);
}

function bindAuth(){
  const loginForm = document.getElementById("loginForm");
  const logoutButton = document.getElementById("logoutButton");
  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("loginError");
    errorEl.textContent = "";
    setHealth("Logging in...");
    const result = await window.PowersAPI.login(username, password);
    if(!result.ok){
      errorEl.textContent = result.error || "Login failed.";
      setHealth("Login failed");
      return;
    }
    showApp();
    await refreshData();
    toast("Logged in successfully.", "success");
  });
  logoutButton?.addEventListener("click", async () => {
    await window.PowersAPI.logout();
    showGate();
    toast("Logged out.", "success");
  });
}

function bindWorkspaceNav(){
  document.querySelectorAll(".admin-nav-button").forEach(button => {
    button.addEventListener("click", () => {
      state.workspace = button.dataset.workspace;
      renderWorkspaceNav();
    });
  });
}

function bindButtons(){
  document.getElementById("refreshButton")?.addEventListener("click", async () => {
    await refreshData();
    toast("Refreshed from live data source.", "success");
  });

  document.getElementById("homeSaveButton")?.addEventListener("click", saveHomepage);
  document.getElementById("homeResetButton")?.addEventListener("click", () => {
    fillHomepageForm(data.settings || DEFAULT_SETTINGS);
    state.homepageAboutImage = data.settings?.aboutImage || "";
    state.homepageEventImages = Array.isArray(data.settings?.eventImages) ? [...data.settings.eventImages] : [];
    state.homepageBottomImages = Array.isArray(data.settings?.bottomImages) ? [...data.settings.bottomImages] : [];
    resetTeamForm(false);
    renderMediaPreviews();
    toast("Homepage form reset to saved values.", "success");
  });

  document.getElementById("teamSaveButton")?.addEventListener("click", saveTeamProfile);
  document.getElementById("teamResetButton")?.addEventListener("click", () => resetTeamForm(true));

  document.getElementById("rentalSaveButton")?.addEventListener("click", saveRental);
  document.getElementById("rentalResetButton")?.addEventListener("click", () => resetRentalForm(true));

  document.getElementById("projectSaveButton")?.addEventListener("click", saveProject);
  document.getElementById("projectResetButton")?.addEventListener("click", () => resetProjectForm(true));

  document.getElementById("contentSaveButton")?.addEventListener("click", saveContentEntry);
  document.getElementById("contentResetButton")?.addEventListener("click", () => resetContentForm(true));

  document.getElementById("openUploaderButton")?.addEventListener("click", () => openUploader("homepageAboutImage"));
  document.querySelectorAll("[data-upload-target]").forEach(button => {
    button.addEventListener("click", () => openUploader(button.dataset.uploadTarget));
  });
}

function bindUploader(){
  const modal = document.getElementById("uploaderModal");
  const closeButton = document.getElementById("uploaderCloseButton");
  const attachButton = document.getElementById("uploaderAttachButton");
  const input = document.getElementById("uploaderInput");
  const targetSelect = document.getElementById("uploaderTargetSelect");

  targetSelect.innerHTML = Object.entries(TARGET_DEFINITIONS).map(([value, config]) => `<option value="${value}">${escapeHtml(config.label)}</option>`).join("");

  targetSelect.addEventListener("change", () => {
    state.uploader.target = targetSelect.value;
    updateUploaderSubtitle();
    renderUploaderQueue();
  });

  input.addEventListener("change", async () => {
    const files = Array.from(input.files || []);
    if(!files.length) return;
    await uploadFilesForCurrentTarget(files);
    input.value = "";
  });

  closeButton?.addEventListener("click", closeUploader);
  modal?.addEventListener("click", (event) => {
    if(event.target === modal){
      closeUploader();
    }
  });

  attachButton?.addEventListener("click", () => {
    attachUploadedFilesToTarget();
    closeUploader();
  });

  renderUploaderTargets();
}

async function hasSession(){
  if(window.PowersAPI?.hasSession){
    return window.PowersAPI.hasSession();
  }
  return sessionStorage.getItem(SESSION_KEY) === "ok";
}

function showGate(){
  document.getElementById("authGate")?.classList.remove("admin-hidden");
  document.getElementById("appShell")?.classList.add("admin-hidden");
}

function showApp(){
  document.getElementById("authGate")?.classList.add("admin-hidden");
  document.getElementById("appShell")?.classList.remove("admin-hidden");
  renderWorkspaceNav();
}

async function refreshData(){
  setHealth("Refreshing...");
  try {
    const payload = await window.PowersAPI.getSiteData({ allowBrowserCache: true, allowSeedFallback: true });
    data = normalizeData(payload || seedData());
    primeDraftsFromData();
    renderAll();
    setHealth("Ready");
    return data;
  } catch (error) {
    console.error(error);
    setHealth("Refresh failed");
    toast("Could not refresh live data. You are still viewing the last locally cached draft.", "error");
    renderAll();
    return data;
  }
}

function renderAll(){
  renderWorkspaceNav();
  renderMetrics();
  fillHomepageForm(data.settings || DEFAULT_SETTINGS);
  renderMediaPreviews();
  renderRentalsList();
  renderProjectsList();
  renderContentList();
  renderTeamProfiles();
  renderRecentStatus();
  renderUploaderTargets();
}

function renderWorkspaceNav(){
  document.querySelectorAll(".admin-nav-button").forEach(button => {
    button.classList.toggle("active", button.dataset.workspace === state.workspace);
  });
  document.querySelectorAll("[data-workspace-panel]").forEach(panel => {
    panel.classList.toggle("admin-hidden", panel.dataset.workspacePanel !== state.workspace);
  });
}

function renderMetrics(){
  const metrics = [
    { label: "Rentals", value: data.rentals.length, note: "Feeds rentals.html + property.html" },
    { label: "Projects", value: data.projects.length, note: "Feeds projects.html" },
    { label: "Team profiles", value: data.settings.teamProfiles.length, note: "Feeds homepage team section" },
    { label: "Page entries", value: data.content.length, note: "Legacy supporting content" }
  ];
  const wrap = document.getElementById("dashboardMetrics");
  wrap.innerHTML = metrics.map(item => `
    <div class="admin-metric">
      <h3>${escapeHtml(item.label)}</h3>
      <strong>${item.value}</strong>
      <div class="admin-subtext">${escapeHtml(item.note)}</div>
    </div>
  `).join("");
}

function renderRecentStatus(){
  const wrap = document.getElementById("recentStatus");
  const items = [
    { title: "Homepage", body: `${data.settings.heroTitle} / Event: ${data.settings.showEventSection ? "on" : "off"} / Team: ${data.settings.showTeamSection ? "on" : "off"}` },
    { title: "Featured rentals", body: `${data.rentals.filter(item => item.featured).length} listing(s) currently featured on the homepage` },
    { title: "Media coverage", body: `${countImages()} image URL(s) currently attached across homepage, rentals, projects, and team` }
  ];
  wrap.innerHTML = items.map(item => `<div class="admin-list-card"><strong>${escapeHtml(item.title)}</strong><div class="admin-subtext">${escapeHtml(item.body)}</div></div>`).join("");
}

function countImages(){
  const settings = data.settings || DEFAULT_SETTINGS;
  const teamImages = (settings.teamProfiles || []).filter(item => item.photo).length;
  const projectImages = data.projects.reduce((sum, project) => sum + (Array.isArray(project.images) ? project.images.length : 0), 0);
  const rentalImages = data.rentals.reduce((sum, rental) => sum + (Array.isArray(rental.images) ? rental.images.length : 0), 0);
  return rentalImages + projectImages + teamImages + (settings.aboutImage ? 1 : 0) + (settings.eventImages || []).length + (settings.bottomImages || []).length;
}

function renderAmenities(selected = []){
  const wrap = document.getElementById("rentalAmenities");
  wrap.innerHTML = RENTAL_AMENITIES.map(label => `
    <label class="admin-switch-row" style="justify-content:flex-start;gap:12px;">
      <input type="checkbox" value="${escapeHtml(label)}" ${selected.includes(label) ? "checked" : ""}/>
      <span>${escapeHtml(label)}</span>
    </label>
  `).join("");
}

function fillHomepageForm(settings){
  document.getElementById("settingHeroTitle").value = settings.heroTitle || "";
  document.getElementById("settingHeroSubtitle").value = settings.heroSubtitle || "";
  document.getElementById("settingPrimaryPhone").value = settings.primaryPhone || "";
  document.getElementById("settingSecondaryPhone").value = settings.secondaryPhone || "";
  document.getElementById("settingEmail").value = settings.email || "";
  document.getElementById("settingSecondaryEmail").value = settings.secondaryEmail || "";
  document.getElementById("settingLocation").value = settings.location || "";
  document.getElementById("showPrimaryPhone").checked = settings.showPrimaryPhone !== false;
  document.getElementById("showSecondaryPhone").checked = !!settings.showSecondaryPhone;
  document.getElementById("showEmail").checked = settings.showEmail !== false;
  document.getElementById("showSecondaryEmail").checked = !!settings.showSecondaryEmail;
  document.getElementById("showLocation").checked = settings.showLocation !== false;
  document.getElementById("showAboutSection").checked = settings.showAboutSection !== false;
  document.getElementById("showEventSection").checked = !!settings.showEventSection;
  document.getElementById("showBottomSection").checked = settings.showBottomSection !== false;
  document.getElementById("showTeamSection").checked = !!settings.showTeamSection;
  document.getElementById("settingAboutTitle").value = settings.aboutTitle || "";
  document.getElementById("settingAboutBody").value = settings.aboutBody || "";
  document.getElementById("settingEventTitle").value = settings.eventTitle || "";
  document.getElementById("settingEventBody").value = settings.eventBody || "";
  document.getElementById("settingBottomTitle").value = settings.bottomTitle || "";
  document.getElementById("settingBottomBody").value = settings.bottomBody || "";
  document.getElementById("settingTeamTitle").value = settings.teamTitle || "";
  document.getElementById("settingTeamBody").value = settings.teamBody || "";
}

function collectHomepageSettings(){
  return {
    heroTitle: value("settingHeroTitle") || DEFAULT_SETTINGS.heroTitle,
    heroSubtitle: value("settingHeroSubtitle") || DEFAULT_SETTINGS.heroSubtitle,
    primaryPhone: value("settingPrimaryPhone") || DEFAULT_SETTINGS.primaryPhone,
    secondaryPhone: value("settingSecondaryPhone"),
    email: value("settingEmail") || DEFAULT_SETTINGS.email,
    secondaryEmail: value("settingSecondaryEmail"),
    location: value("settingLocation") || DEFAULT_SETTINGS.location,
    showPrimaryPhone: checked("showPrimaryPhone"),
    showSecondaryPhone: checked("showSecondaryPhone"),
    showEmail: checked("showEmail"),
    showSecondaryEmail: checked("showSecondaryEmail"),
    showLocation: checked("showLocation"),
    showAboutSection: checked("showAboutSection"),
    showEventSection: checked("showEventSection"),
    showBottomSection: checked("showBottomSection"),
    showTeamSection: checked("showTeamSection"),
    aboutTitle: value("settingAboutTitle") || DEFAULT_SETTINGS.aboutTitle,
    aboutBody: value("settingAboutBody") || DEFAULT_SETTINGS.aboutBody,
    aboutImage: state.homepageAboutImage || DEFAULT_SETTINGS.aboutImage,
    eventTitle: value("settingEventTitle") || DEFAULT_SETTINGS.eventTitle,
    eventBody: value("settingEventBody") || DEFAULT_SETTINGS.eventBody,
    eventImages: [...state.homepageEventImages],
    bottomTitle: value("settingBottomTitle") || DEFAULT_SETTINGS.bottomTitle,
    bottomBody: value("settingBottomBody") || DEFAULT_SETTINGS.bottomBody,
    bottomImages: [...state.homepageBottomImages],
    teamTitle: value("settingTeamTitle"),
    teamBody: value("settingTeamBody"),
    teamProfiles: Array.isArray(data.settings.teamProfiles) ? [...data.settings.teamProfiles] : []
  };
}

async function saveHomepage(){
  const next = collectHomepageSettings();
  next.teamTitle = data.settings.teamTitle || "";
  next.teamBody = data.settings.teamBody || "";
  next.teamProfiles = Array.isArray(data.settings.teamProfiles) ? [...data.settings.teamProfiles] : [];
  data.settings = next;
  await saveData("Homepage saved to live site.");
}

function resetRentalForm(showToast = false){
  state.editingRentalId = "";
  document.getElementById("rentalId").value = "";
  document.getElementById("rentalTitle").value = "";
  document.getElementById("rentalLocation").value = "";
  document.getElementById("rentalPrice").value = "";
  document.getElementById("rentalDescription").value = "";
  document.getElementById("rentalDetails").value = "";
  document.getElementById("rentalAvailable").checked = true;
  document.getElementById("rentalFeatured").checked = false;
  state.rentalUploads = [];
  renderAmenities([]);
  renderMediaPreviews();
  document.getElementById("rentalValidation").textContent = "";
  if(showToast) toast("Rental form cleared.", "success");
}

async function saveRental(){
  const validation = document.getElementById("rentalValidation");
  validation.textContent = "";
  const id = slugify(value("rentalId") || value("rentalTitle"));
  if(!id){
    validation.textContent = "Rental id or title is required.";
    return;
  }
  const title = value("rentalTitle");
  if(!title){
    validation.textContent = "Rental headline is required.";
    return;
  }
  const rental = {
    id,
    title,
    description: value("rentalDescription"),
    details: value("rentalDetails"),
    images: [...state.rentalUploads],
    available: checked("rentalAvailable"),
    featured: checked("rentalFeatured"),
    price: value("rentalPrice"),
    location: value("rentalLocation"),
    amenities: getSelectedAmenities()
  };
  const index = data.rentals.findIndex(item => item.id === state.editingRentalId || item.id === id);
  if(index >= 0){
    data.rentals[index] = rental;
  } else {
    data.rentals.unshift(rental);
  }
  state.editingRentalId = rental.id;
  document.getElementById("rentalId").value = rental.id;
  await saveData("Rental saved to rentals and property pages.");
  renderRentalsList();
}

function renderRentalsList(){
  const wrap = document.getElementById("rentalsList");
  if(!data.rentals.length){
    wrap.innerHTML = `<div class="admin-empty">No rentals yet.</div>`;
    return;
  }
  wrap.innerHTML = data.rentals.map(item => `
    <div class="admin-list-card">
      <div class="admin-list-head">
        <div>
          <strong>${escapeHtml(item.title || item.id)}</strong>
          <div class="admin-subtext">${escapeHtml(item.location || "No location")}</div>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn secondary" type="button" onclick="editRental('${escapeJs(item.id)}')">Edit</button>
          <button class="admin-btn danger" type="button" onclick="removeRental('${escapeJs(item.id)}')">Delete</button>
        </div>
      </div>
      <div class="admin-meta">
        <span class="admin-pill ${item.available !== false ? "success" : "warning"}">${item.available !== false ? "Available" : "Unavailable"}</span>
        <span class="admin-pill">${item.featured ? "Featured" : "Standard"}</span>
        <span class="admin-pill">${(item.images || []).length} image(s)</span>
      </div>
      <div class="admin-subtext">${escapeHtml(item.description || "")}</div>
    </div>
  `).join("");
}

window.editRental = function(id){
  const rental = data.rentals.find(item => item.id === id);
  if(!rental) return;
  state.workspace = "rentals";
  state.editingRentalId = rental.id;
  document.getElementById("rentalId").value = rental.id || "";
  document.getElementById("rentalTitle").value = rental.title || "";
  document.getElementById("rentalLocation").value = rental.location || "";
  document.getElementById("rentalPrice").value = rental.price || "";
  document.getElementById("rentalDescription").value = rental.description || "";
  document.getElementById("rentalDetails").value = rental.details || "";
  document.getElementById("rentalAvailable").checked = rental.available !== false;
  document.getElementById("rentalFeatured").checked = !!rental.featured;
  state.rentalUploads = Array.isArray(rental.images) ? [...rental.images] : [];
  renderAmenities(rental.amenities || []);
  renderMediaPreviews();
  renderWorkspaceNav();
};

window.removeRental = async function(id){
  if(!confirm("Delete this rental?")) return;
  data.rentals = data.rentals.filter(item => item.id !== id);
  if(state.editingRentalId === id){
    resetRentalForm(false);
  }
  await saveData("Rental removed.");
  renderRentalsList();
};

function resetProjectForm(showToast = false){
  state.editingProjectId = "";
  document.getElementById("projectId").value = "";
  document.getElementById("projectTitle").value = "";
  document.getElementById("projectDescription").value = "";
  document.getElementById("projectDetails").value = "";
  document.getElementById("projectStatus").value = "completed";
  state.projectBeforeImage = "";
  state.projectAfterImage = "";
  state.projectGalleryImages = [];
  document.getElementById("projectValidation").textContent = "";
  renderMediaPreviews();
  if(showToast) toast("Project form cleared.", "success");
}

async function saveProject(){
  const validation = document.getElementById("projectValidation");
  validation.textContent = "";
  const id = slugify(value("projectId") || value("projectTitle"));
  const title = value("projectTitle");
  if(!id || !title){
    validation.textContent = "Project id and title are required.";
    return;
  }
  const images = [state.projectBeforeImage, state.projectAfterImage, ...state.projectGalleryImages].filter(Boolean);
  const project = {
    id,
    title,
    description: value("projectDescription"),
    details: value("projectDetails"),
    status: document.getElementById("projectStatus").value,
    images
  };
  const index = data.projects.findIndex(item => item.id === state.editingProjectId || item.id === id);
  if(index >= 0){
    data.projects[index] = project;
  } else {
    data.projects.unshift(project);
  }
  state.editingProjectId = project.id;
  document.getElementById("projectId").value = project.id;
  await saveData("Project saved to live site.");
  renderProjectsList();
}

function renderProjectsList(){
  const wrap = document.getElementById("projectsList");
  if(!data.projects.length){
    wrap.innerHTML = `<div class="admin-empty">No projects yet.</div>`;
    return;
  }
  wrap.innerHTML = data.projects.map(item => `
    <div class="admin-list-card">
      <div class="admin-list-head">
        <div>
          <strong>${escapeHtml(item.title || item.id)}</strong>
          <div class="admin-subtext">${escapeHtml(item.status || "completed")}</div>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn secondary" type="button" onclick="editProject('${escapeJs(item.id)}')">Edit</button>
          <button class="admin-btn danger" type="button" onclick="removeProject('${escapeJs(item.id)}')">Delete</button>
        </div>
      </div>
      <div class="admin-meta">
        <span class="admin-pill">${(item.images || []).length} image(s)</span>
      </div>
      <div class="admin-subtext">${escapeHtml(item.description || "")}</div>
    </div>
  `).join("");
}

window.editProject = function(id){
  const project = data.projects.find(item => item.id === id);
  if(!project) return;
  state.workspace = "projects";
  state.editingProjectId = project.id;
  document.getElementById("projectId").value = project.id || "";
  document.getElementById("projectTitle").value = project.title || "";
  document.getElementById("projectDescription").value = project.description || "";
  document.getElementById("projectDetails").value = project.details || "";
  document.getElementById("projectStatus").value = project.status || "completed";
  state.projectBeforeImage = project.images?.[0] || "";
  state.projectAfterImage = project.images?.[1] || "";
  state.projectGalleryImages = Array.isArray(project.images) ? project.images.slice(2) : [];
  renderMediaPreviews();
  renderWorkspaceNav();
};

window.removeProject = async function(id){
  if(!confirm("Delete this project?")) return;
  data.projects = data.projects.filter(item => item.id !== id);
  if(state.editingProjectId === id){
    resetProjectForm(false);
  }
  await saveData("Project removed.");
  renderProjectsList();
};

function resetContentForm(showToast = false){
  state.editingContentId = "";
  document.getElementById("contentTarget").value = "home";
  document.getElementById("contentStatus").value = "published";
  document.getElementById("contentTitle").value = "";
  document.getElementById("contentBody").value = "";
  document.getElementById("contentDetails").value = "";
  document.getElementById("contentValidation").textContent = "";
  if(showToast) toast("Entry form cleared.", "success");
}

async function saveContentEntry(){
  const validation = document.getElementById("contentValidation");
  validation.textContent = "";
  const title = value("contentTitle");
  if(!title){
    validation.textContent = "Headline is required.";
    return;
  }
  const entry = {
    id: state.editingContentId || cryptoId(),
    target: document.getElementById("contentTarget").value,
    status: document.getElementById("contentStatus").value,
    title,
    body: value("contentBody"),
    details: value("contentDetails"),
    updatedAt: new Date().toISOString()
  };
  const index = data.content.findIndex(item => item.id === entry.id);
  if(index >= 0){
    data.content[index] = entry;
  } else {
    data.content.unshift(entry);
  }
  state.editingContentId = entry.id;
  await saveData("Page entry saved.");
  renderContentList();
}

function renderContentList(){
  const wrap = document.getElementById("contentList");
  if(!data.content.length){
    wrap.innerHTML = `<div class="admin-empty">No supporting page entries yet.</div>`;
    return;
  }
  wrap.innerHTML = data.content.map(item => `
    <div class="admin-list-card">
      <div class="admin-list-head">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <div class="admin-subtext">${escapeHtml(targetLabel(item.target))}</div>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn secondary" type="button" onclick="editContentEntry('${escapeJs(item.id)}')">Edit</button>
          <button class="admin-btn danger" type="button" onclick="removeContentEntry('${escapeJs(item.id)}')">Delete</button>
        </div>
      </div>
      <div class="admin-meta">
        <span class="admin-pill ${item.status === "published" ? "success" : "warning"}">${escapeHtml(item.status)}</span>
      </div>
      <div class="admin-subtext">${escapeHtml(item.body || "")}</div>
    </div>
  `).join("");
}

window.editContentEntry = function(id){
  const entry = data.content.find(item => item.id === id);
  if(!entry) return;
  state.workspace = "content";
  state.editingContentId = entry.id;
  document.getElementById("contentTarget").value = entry.target || "home";
  document.getElementById("contentStatus").value = entry.status || "published";
  document.getElementById("contentTitle").value = entry.title || "";
  document.getElementById("contentBody").value = entry.body || "";
  document.getElementById("contentDetails").value = entry.details || "";
  renderWorkspaceNav();
};

window.removeContentEntry = async function(id){
  if(!confirm("Delete this page entry?")) return;
  data.content = data.content.filter(item => item.id !== id);
  if(state.editingContentId === id){
    resetContentForm(false);
  }
  await saveData("Page entry removed.");
  renderContentList();
};

function resetTeamForm(showToast = false){
  state.editingTeamId = "";
  state.teamProfilePhoto = "";
  document.getElementById("teamName").value = "";
  document.getElementById("teamRole").value = "";
  document.getElementById("teamBio").value = "";
  document.getElementById("teamSaveButton").textContent = "Add team profile";
  renderMediaPreviews();
  if(showToast) toast("Team form cleared.", "success");
}

function renderTeamProfiles(){
  const wrap = document.getElementById("teamProfilesAdmin");
  const profiles = Array.isArray(data.settings.teamProfiles) ? data.settings.teamProfiles : [];
  if(!profiles.length){
    wrap.innerHTML = `<div class="admin-empty">No team profiles yet.</div>`;
    return;
  }
  wrap.innerHTML = profiles.map(profile => `
    <div class="admin-list-card">
      <div class="admin-list-head">
        <div>
          <strong>${escapeHtml(profile.name || "Team member")}</strong>
          <div class="admin-subtext">${escapeHtml(profile.role || "No role")}</div>
        </div>
        <div class="admin-list-actions">
          <button class="admin-btn secondary" type="button" onclick="editTeamProfile('${escapeJs(profile.id)}')">Edit</button>
          <button class="admin-btn danger" type="button" onclick="removeTeamProfile('${escapeJs(profile.id)}')">Delete</button>
        </div>
      </div>
      ${profile.photo ? `<div class="admin-preview-grid"><div class="admin-image-tile"><img src="${profile.photo}" alt="${escapeHtml(profile.name || "Team member")}"></div></div>` : ""}
      <div class="admin-subtext">${escapeHtml(profile.bio || "")}</div>
    </div>
  `).join("");
}

window.editTeamProfile = function(id){
  const profiles = Array.isArray(data.settings.teamProfiles) ? data.settings.teamProfiles : [];
  const profile = profiles.find(item => item.id === id);
  if(!profile) return;
  state.workspace = "homepage";
  state.editingTeamId = profile.id;
  document.getElementById("teamName").value = profile.name || "";
  document.getElementById("teamRole").value = profile.role || "";
  document.getElementById("teamBio").value = profile.bio || "";
  state.teamProfilePhoto = profile.photo || "";
  document.getElementById("teamSaveButton").textContent = "Update team profile";
  renderMediaPreviews();
  renderWorkspaceNav();
};

window.removeTeamProfile = async function(id){
  if(!confirm("Delete this team profile?")) return;
  data.settings.teamProfiles = (data.settings.teamProfiles || []).filter(item => item.id !== id);
  if(state.editingTeamId === id){
    resetTeamForm(false);
  }
  await saveData("Team profile removed.");
  renderTeamProfiles();
};

async function saveTeamProfile(){
  const name = value("teamName");
  if(!name){
    toast("Team member name is required.", "error");
    return;
  }
  const profiles = Array.isArray(data.settings.teamProfiles) ? [...data.settings.teamProfiles] : [];
  const profile = {
    id: state.editingTeamId || cryptoId(),
    name,
    role: value("teamRole"),
    bio: value("teamBio"),
    photo: state.teamProfilePhoto || ""
  };
  const index = profiles.findIndex(item => item.id === profile.id);
  if(index >= 0){
    profiles[index] = profile;
  } else {
    profiles.unshift(profile);
  }
  data.settings = {
    ...collectHomepageSettings(),
    teamTitle: value("settingTeamTitle") || data.settings.teamTitle || "Meet the Team",
    teamBody: value("settingTeamBody") || data.settings.teamBody || "",
    teamProfiles: profiles
  };
  state.editingTeamId = profile.id;
  document.getElementById("teamSaveButton").textContent = "Update team profile";
  await saveData("Team profile saved.");
  renderTeamProfiles();
}

function renderMediaPreviews(){
  renderImageGroup("homepageAboutPreview", state.homepageAboutImage ? [state.homepageAboutImage] : [], "homepageAboutImage");
  renderImageGroup("homepageEventPreview", state.homepageEventImages, "homepageEventImages");
  renderImageGroup("homepageBottomPreview", state.homepageBottomImages, "homepageBottomImages");
  renderImageGroup("teamPhotoPreview", state.teamProfilePhoto ? [state.teamProfilePhoto] : [], "teamProfilePhoto");
  renderImageGroup("rentalImagePreview", state.rentalUploads, "rentalUploads");
  renderImageGroup("projectBeforePreview", state.projectBeforeImage ? [state.projectBeforeImage] : [], "projectBeforeImage");
  renderImageGroup("projectAfterPreview", state.projectAfterImage ? [state.projectAfterImage] : [], "projectAfterImage");
  renderImageGroup("projectGalleryPreview", state.projectGalleryImages, "projectGalleryImages");
}

function renderImageGroup(elementId, images, targetKey){
  const wrap = document.getElementById(elementId);
  if(!wrap) return;
  if(!images.length){
    wrap.innerHTML = `<div class="admin-empty">No media attached.</div>`;
    return;
  }
  wrap.innerHTML = images.map((src, index) => `
    <div class="admin-image-tile">
      <img src="${src}" alt="Attached media">
      <div class="admin-image-tile-footer">
        <span>${index + 1}</span>
        <button class="admin-image-remove" type="button" onclick="removeImageFromTarget('${targetKey}', ${index})">Remove</button>
      </div>
    </div>
  `).join("");
}

window.removeImageFromTarget = function(targetKey, index){
  if(targetKey === "homepageAboutImage"){
    state.homepageAboutImage = "";
  } else if(targetKey === "teamProfilePhoto"){
    state.teamProfilePhoto = "";
  } else if(targetKey === "projectBeforeImage"){
    state.projectBeforeImage = "";
  } else if(targetKey === "projectAfterImage"){
    state.projectAfterImage = "";
  } else if(Array.isArray(state[targetKey])){
    state[targetKey].splice(index, 1);
  }
  renderMediaPreviews();
};

function openUploader(defaultTarget){
  state.workspace = state.workspace === "uploader" ? state.workspace : state.workspace;
  state.uploader.open = true;
  state.uploader.target = defaultTarget || state.uploader.target;
  state.uploader.files = [];
  state.uploader.uploaded = [];
  document.getElementById("uploaderTargetSelect").value = state.uploader.target;
  document.getElementById("uploaderModal").classList.add("open");
  updateUploaderSubtitle();
  renderUploaderQueue();
}

function closeUploader(){
  state.uploader.open = false;
  document.getElementById("uploaderModal").classList.remove("open");
}

function updateUploaderSubtitle(){
  const target = TARGET_DEFINITIONS[state.uploader.target];
  document.getElementById("uploaderSubtitle").textContent = target ? `Upload to ${target.label}.` : "Upload to a selected destination.";
}

async function uploadFilesForCurrentTarget(files){
  const targetConfig = TARGET_DEFINITIONS[state.uploader.target];
  const feedback = document.getElementById("uploaderFeedback");
  feedback.textContent = "";
  if(!targetConfig.multiple && files.length > 1){
    feedback.textContent = "This destination accepts one image at a time. Only the first file will be kept.";
    files = files.slice(0, 1);
  }
  setHealth("Uploading...");
  for(const file of files){
    const localId = cryptoId();
    const item = { id: localId, name: file.name, status: "uploading", url: "" };
    state.uploader.uploaded.push(item);
    renderUploaderQueue();
    try {
      const dataUrl = await fileToDataUrl(file);
      const url = await window.PowersAPI.uploadImage(dataUrl, file.name);
      item.status = "uploaded";
      item.url = url;
    } catch (error) {
      console.error(error);
      item.status = "error";
    }
    renderUploaderQueue();
  }
  setHealth("Ready");
}

function attachUploadedFilesToTarget(){
  const successful = state.uploader.uploaded.filter(item => item.status === "uploaded" && item.url);
  if(!successful.length){
    toast("Nothing uploaded yet.", "error");
    return;
  }
  const urls = successful.map(item => item.url);
  applyUrlsToTarget(state.uploader.target, urls);
  renderMediaPreviews();
  toast(`Attached ${urls.length} uploaded image${urls.length === 1 ? "" : "s"}.`, "success");
}

function applyUrlsToTarget(targetKey, urls){
  const target = TARGET_DEFINITIONS[targetKey];
  if(!target) return;
  if(target.multiple){
    state[targetKey] = [...(Array.isArray(state[targetKey]) ? state[targetKey] : []), ...urls];
  } else {
    state[targetKey] = urls[0] || "";
  }
  if(targetKey === "teamProfilePhoto"){
    renderMediaPreviews();
  }
}

function renderUploaderQueue(){
  const wrap = document.getElementById("uploaderQueue");
  const feedback = document.getElementById("uploaderFeedback");
  const items = state.uploader.uploaded;
  if(!items.length){
    wrap.innerHTML = `<div class="admin-empty">No files uploaded in this session.</div>`;
  } else {
    wrap.innerHTML = items.map(item => `
      <div class="admin-list-card">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="admin-pill ${item.status === "uploaded" ? "success" : item.status === "error" ? "warning" : ""}">${escapeHtml(item.status)}</span>
        ${item.url ? `<div class="admin-image-tile"><img src="${item.url}" alt="${escapeHtml(item.name)}"></div>` : ""}
      </div>
    `).join("");
  }
  const config = TARGET_DEFINITIONS[state.uploader.target];
  feedback.textContent = config?.multiple ? "" : "Single-image target. Uploading a new image will replace the current one when attached.";
}

function renderUploaderTargets(){
  const wrap = document.getElementById("uploaderTargets");
  wrap.innerHTML = Object.entries(TARGET_DEFINITIONS).map(([key, config]) => `
    <div class="admin-list-card">
      <div class="admin-list-head">
        <div>
          <strong>${escapeHtml(config.label)}</strong>
          <div class="admin-subtext">${config.multiple ? "Multiple images" : "Single image"}</div>
        </div>
        <button class="admin-btn secondary" type="button" onclick="openUploaderFromList('${key}')">Open</button>
      </div>
    </div>
  `).join("");
}
window.openUploaderFromList = function(key){ openUploader(key); };

async function saveData(successMessage){
  setHealth("Saving...");
  try {
    data = normalizeData(await window.PowersAPI.saveSiteData(data));
    primeDraftsFromData();
    renderAll();
    setHealth("Saved");
    toast(successMessage, "success");
  } catch (error) {
    console.error(error);
    setHealth("Save failed");
    toast("Save failed. Check API and browser console.", "error");
  }
}

function setHealth(label){
  const chip = document.getElementById("saveHealth");
  if(chip) chip.textContent = label;
}

function toast(message, tone = "success"){
  const wrap = document.getElementById("toastWrap");
  const node = document.createElement("div");
  node.className = `admin-toast ${tone}`;
  node.textContent = message;
  wrap.appendChild(node);
  setTimeout(() => {
    node.remove();
  }, 3200);
}

function value(id){ return document.getElementById(id)?.value.trim() || ""; }
function checked(id){ return !!document.getElementById(id)?.checked; }
function getSelectedAmenities(){
  return Array.from(document.querySelectorAll("#rentalAmenities input[type='checkbox']:checked")).map(input => input.value);
}

function targetLabel(value){
  return ({
    home: "Homepage",
    rentals: "Rentals page",
    property: "Property detail pages",
    projects: "Projects page",
    contact: "Contact page",
    team: "Team page"
  })[value] || value;
}

function slugify(value){
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function escapeHtml(value){
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeJs(value){
  return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function cryptoId(){
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
function fileToDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
