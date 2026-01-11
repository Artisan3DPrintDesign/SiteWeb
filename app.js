async function loadProjects() {
  try {
    const res = await fetch("projects.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return data.projects || [];
  } catch (e) {
    console.warn("Chargement projects.json impossible.", e);
    // Si tu ouvres en file://, certains navigateurs bloquent fetch().
    // Sur GitHub Pages ça marche. En local, utilise un petit serveur (Live Server / python -m http.server).
    return [];
  }
}

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


async function loadTimelapses() {
  try {
    const res = await fetch("timelaps.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return data.timelapses || [];
  } catch (e) {
    console.warn("Chargement timelaps.json impossible.", e);
    return [];
  }
}

async function renderTimelapsPage() {
  const root = document.querySelector("[data-timelaps-root]");
  if (!root) return;

  const items = await loadTimelapses();
  if (!items.length) {
    root.innerHTML = `<section class="card">
      <h2>Timelaps</h2>
      <p style="color: var(--text-dim);">
        Impossible de charger <strong>timelaps.json</strong>.<br>
        ✅ Sur GitHub Pages ça marche automatiquement.<br>
        🔧 En local, lance un serveur (Live Server / python -m http.server).
      </p>
    </section>`;
    return;
  }

  root.innerHTML = `
    <section class="card">
      <h2>Timelaps</h2>
      <p class="timelaps-intro">Retrouve ici des timelaps d’impressions 3D.</p>
      <div class="timelaps-grid">
        ${items.map(t => `
          <div class="timelaps-card">
            <h3>${escapeHtml(t.title || "Timelaps")}</h3>
            ${t.subtitle ? `<p>${escapeHtml(t.subtitle)}</p>` : ``}
            <div class="video-container ${t.rotate===90?"video-rotate-90":t.rotate===270?"video-rotate-270":""}"
     style="width:${(t.width||260)}px;">
  <iframe
    allow="fullscreen;autoplay"
    allowfullscreen
    style="transform: translate(-50%, -50%) rotate(${t.rotate===90?90:t.rotate===270?270:0}deg) scale(${(t.scale||1)})"
    src="${escapeHtml(t.embedUrl)}"></iframe>
</div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

async function renderGallery() {
  const grid = document.querySelector("[data-gallery-grid]");
  if (!grid) return;

  const projects = await loadProjects();
  if (!projects.length) {
    grid.innerHTML = `<p style="color: var(--text-dim); text-align:center;">
      Impossible de charger <strong>projects.json</strong>.<br>
      ✅ Sur GitHub Pages ça marche automatiquement.<br>
      🔧 En local, lance un serveur (ex: Live Server / python -m http.server).
    </p>`;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <a href="projet.html?id=${encodeURIComponent(p.id)}" class="creation-card" title="${escapeHtml(p.title)}">
      <img src="${escapeHtml(p.coverImage)}" alt="${escapeHtml(p.title)}">
    </a>
  `).join("");
}

function renderProjectSections(sections = []) {
  return sections.map(sec => {
    if (sec.type === "list") {
      const items = (sec.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join("");
      return `<h3>${escapeHtml(sec.h3)}</h3><ul>${items}</ul>`;
    }
    const paras = (sec.content || []).map(p => `<p>${escapeHtml(p)}</p>`).join("");
    return `<h3>${escapeHtml(sec.h3)}</h3>${paras}`;
  }).join("");
}

async function renderProjectPage() {
  const root = document.querySelector("[data-project-root]");
  if (!root) return;

  const projects = await loadProjects();
  if (!projects.length) {
    root.innerHTML = `<section class="card"><p style="color: var(--text-dim);">
      Impossible de charger <strong>projects.json</strong>.<br>
      ✅ Sur GitHub Pages ça marche automatiquement.<br>
      🔧 En local, lance un serveur (Live Server / python -m http.server).
    </p></section>`;
    return;
  }

  const id = qs("id") || projects[0].id;
  const project = projects.find(p => p.id === id) || projects[0];

  const subtitleEl = document.querySelector("[data-header-subtitle]");
  if (subtitleEl) subtitleEl.textContent = project.subtitle || "Projet 🌟";

  const mainImage = (project.images && project.images[0]) ? project.images[0] : { src: project.coverImage, alt: project.title };

  const videoHtml = project.video?.embedUrl ? `
    <div class="project-card">
      <h3>${escapeHtml(project.video.title || "Vidéo")}</h3>
      <div class="video-container">
        <iframe allow="fullscreen;autoplay" allowfullscreen src="${escapeHtml(project.video.embedUrl)}"></iframe>
      </div>
    </div>
  ` : "";

  const ctaHtml = project.cta?.email ? `
    <div class="contact-project">
      <h3>${escapeHtml(project.cta.title || "Contact")}</h3>
      <p>${escapeHtml(project.cta.text || "")}</p>
      <p><strong>Pour me contacter, cliquez sur le logo Gmail :</strong></p>
      <a class="contact-mail" href="mailto:${escapeHtml(project.cta.email)}" target="_blank" rel="noopener">
        <img src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/gmail.svg" alt="Gmail" class="gmail-logo">
      </a>
      <p>Ou par l'adresse : ${escapeHtml(project.cta.email)}</p>
    </div>
  ` : "";

  root.innerHTML = `
    <section class="card project-section">
      <h2>${escapeHtml(project.title)}</h2>

      <div class="project-wrapper">
        <article class="project-description">
          ${renderProjectSections(project.sections)}
          ${ctaHtml}
        </article>

        <div class="project-right-col">
          <div class="project-card project-main-image">
            <h3>Résultat final</h3>
            <img src="${escapeHtml(mainImage.src)}" alt="${escapeHtml(mainImage.alt || project.title)}">
          </div>
          ${videoHtml}
        </div>
      </div>
    </section>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderGallery();
  await renderProjectPage();
  await renderTimelapsPage();
});
