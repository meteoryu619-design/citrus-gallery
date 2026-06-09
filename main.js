const gallery = document.querySelector("#gallery");
const tagFilters = document.querySelector("#tagFilters");
const resultCount = document.querySelector("#resultCount");
const emptyState = document.querySelector("#emptyState");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxDate = document.querySelector("#lightboxDate");
const lightboxDescription = document.querySelector("#lightboxDescription");
const lightboxTags = document.querySelector("#lightboxTags");
const downloadSingleButton = document.querySelector("#downloadSingle");
const downloadZipButton = document.querySelector("#downloadZip");
const prevButton = document.querySelector("#prevWork");
const nextButton = document.querySelector("#nextWork");

let works = [];
let filteredWorks = [];
let activeTag = "全部";
let activeIndex = 0;

async function initGallery() {
  try {
    const response = await fetch("data/works.json");
    if (!response.ok) throw new Error("works.json 加载失败");
    works = await response.json();
    filteredWorks = [...works];
    renderFilters();
    renderGallery();
  } catch (error) {
    gallery.innerHTML = `<p class="empty-state">作品数据暂时无法加载，请检查 data/works.json。</p>`;
    console.error(error);
  }
}

function renderFilters() {
  const tags = ["全部", ...new Set(works.flatMap((work) => work.tags || []))];
  tagFilters.innerHTML = tags
    .map(
      (tag) => `
        <button class="tag-button${tag === activeTag ? " is-active" : ""}" type="button" data-tag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `,
    )
    .join("");
}

function renderGallery() {
  filteredWorks =
    activeTag === "全部"
      ? [...works]
      : works.filter((work) => work.tags?.includes(activeTag));

  gallery.innerHTML = filteredWorks.map(renderCard).join("");
  resultCount.textContent = `${filteredWorks.length} 件作品`;
  emptyState.hidden = filteredWorks.length > 0;
}

function renderCard(work, index) {
  const description = work.description || "";
  const tags = (work.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <button class="work-card" type="button" data-index="${index}" aria-label="查看 ${escapeHtml(work.title)}">
      <img src="${escapeAttribute(work.image)}" alt="${escapeAttribute(work.title)}" loading="lazy">
      <span class="card-body">
        <strong class="card-title">${escapeHtml(work.title)}</strong>
        <span class="card-description">${escapeHtml(description)}</span>
        <span class="card-meta">
          ${tags}
          <span class="date-chip">${escapeHtml(formatDate(work.date))}</span>
        </span>
      </span>
    </button>
  `;
}

function openLightbox(index) {
  activeIndex = index;
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox");
  downloadSingleButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-lightbox");
}

function updateLightbox() {
  const work = filteredWorks[activeIndex];
  if (!work) return;

  lightboxImage.src = work.image;
  lightboxImage.alt = work.title;
  lightboxTitle.textContent = work.title;
  lightboxDate.textContent = formatDate(work.date);
  lightboxDescription.textContent = work.description || "";
  lightboxTags.innerHTML = (work.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");
}

function showRelativeWork(direction) {
  if (!filteredWorks.length) return;
  activeIndex = (activeIndex + direction + filteredWorks.length) % filteredWorks.length;
  updateLightbox();
}

async function downloadSingle() {
  const work = filteredWorks[activeIndex];
  if (!work) return;
  const fileName = `${safeFileName(work.title)}${getFileExtension(work.image)}`;
  await downloadUrlAsFile(work.image, fileName);
}

async function downloadZip() {
  const work = filteredWorks[activeIndex];
  if (!work) return;
  if (!window.JSZip) {
    alert("JSZip 没有加载成功，请检查网络后重试。");
    return;
  }

  const imageList = work.images?.length ? work.images : [work.image];
  const zip = new JSZip();
  const originalText = downloadZipButton.textContent;
  downloadZipButton.disabled = true;
  downloadZipButton.textContent = "打包中…";

  try {
    await Promise.all(
      imageList.map(async (imagePath, index) => {
        const response = await fetch(imagePath);
        if (!response.ok) throw new Error(`${imagePath} 下载失败`);
        const blob = await response.blob();
        zip.file(`${safeFileName(work.title)}-${index + 1}${getFileExtension(imagePath)}`, blob);
      }),
    );

    const zipBlob = await zip.generateAsync({ type: "blob" });
    triggerBlobDownload(zipBlob, `${safeFileName(work.title)}.zip`);
  } catch (error) {
    alert("打包下载失败，请稍后再试。");
    console.error(error);
  } finally {
    downloadZipButton.disabled = false;
    downloadZipButton.textContent = originalText;
  }
}

async function downloadUrlAsFile(url, fileName) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} 下载失败`);
  const blob = await response.blob();
  triggerBlobDownload(blob, fileName);
}

function triggerBlobDownload(blob, fileName) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${dateValue}T00:00:00`));
}

function getFileExtension(path) {
  const cleanPath = path.split("?")[0];
  const match = cleanPath.match(/\.[a-zA-Z0-9]+$/);
  return match ? match[0] : ".jpg";
}

function safeFileName(value) {
  return String(value || "citrus-work")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

tagFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tag]");
  if (!button) return;
  activeTag = button.dataset.tag;
  renderFilters();
  renderGallery();
});

gallery.addEventListener("click", (event) => {
  const card = event.target.closest("[data-index]");
  if (!card) return;
  openLightbox(Number(card.dataset.index));
});

lightbox.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-lightbox]")) closeLightbox();
});

prevButton.addEventListener("click", () => showRelativeWork(-1));
nextButton.addEventListener("click", () => showRelativeWork(1));
downloadSingleButton.addEventListener("click", downloadSingle);
downloadZipButton.addEventListener("click", downloadZip);

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showRelativeWork(-1);
  if (event.key === "ArrowRight") showRelativeWork(1);
});

initGallery();
