const categoryTabs = document.querySelector("#categoryTabs");
const subtagTabs = document.querySelector("#subtagTabs");
const gallery = document.querySelector("#gallery");
const resultCount = document.querySelector("#resultCount");
const galleryMode = document.querySelector("#galleryMode");
const emptyState = document.querySelector("#emptyState");

const collectionModal = document.querySelector("#collectionModal");
const collectionTitle = document.querySelector("#collectionTitle");
const collectionDescription = document.querySelector("#collectionDescription");
const collectionMeta = document.querySelector("#collectionMeta");
const collectionTags = document.querySelector("#collectionTags");
const collectionImages = document.querySelector("#collectionImages");

const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxTitle = document.querySelector("#lightboxTitle");
const lightboxDate = document.querySelector("#lightboxDate");
const lightboxDescription = document.querySelector("#lightboxDescription");
const lightboxTags = document.querySelector("#lightboxTags");
const downloadSingleButton = document.querySelector("#downloadSingle");
const prevButton = document.querySelector("#prevWork");
const nextButton = document.querySelector("#nextWork");

const categories = [
  { id: "All", label: "全部", english: "All", icon: "▦" },
  { id: "Cover", label: "封面", english: "Cover", icon: "▰" },
  { id: "Collage", label: "拼接图", english: "Collage", icon: "▧" },
  { id: "Wallpaper", label: "壁纸", english: "Wallpaper", icon: "▱" },
  { id: "Daily", label: "日常番外", english: "Daily", icon: "✿" },
  { id: "Collection", label: "收集图集", english: "Collection", icon: "▣" },
];

const subtags = {
  Cover: ["Citrus", "Citrus+", "单画封面", "特装版", "特典封面", "杂志封面", "周年纪念"],
  Collage: ["对视", "拥抱", "亲吻", "牵手", "依靠", "背影", "并肩"],
  Wallpaper: ["竖屏", "横屏", "锁屏", "桌面", "高清", "4K"],
  Daily: ["校园", "日常", "番外", "约会", "家庭", "夏天", "节日"],
  Collection: ["官方插图", "杂志图", "宣传图", "稀有图", "网络整理"],
};

let collections = [];
let visibleCollections = [];
let activeCategory = "All";
let activeSubtag = "全部";
let activeCollection = null;
let activeImageIndex = 0;

async function initGallery() {
  renderCategories();

  try {
    const response = await fetch("data/collections.json");
    if (!response.ok) throw new Error("collections.json 加载失败");
    collections = await response.json();
    renderSubtags();
    renderGallery();
  } catch (error) {
    gallery.innerHTML = `
      <p class="load-error">
        图集数据暂时无法加载。请检查 <strong>data/collections.json</strong>，或使用
        <strong>python3 -m http.server 8000</strong> 后访问 <strong>http://localhost:8000</strong>。
        直接用 file:// 打开页面时，浏览器可能会限制读取本地 JSON。
      </p>
    `;
    emptyState.hidden = true;
    console.error(error);
  }
}

function renderCategories() {
  categoryTabs.innerHTML = categories
    .map(
      (category) => `
        <button class="category-button${category.id === activeCategory ? " is-active" : ""}" type="button" data-category="${category.id}">
          <span class="category-icon" aria-hidden="true">${escapeHtml(category.icon)}</span>
          <span class="category-copy">
            <strong>${escapeHtml(category.label)}</strong>
            <small>${escapeHtml(category.english)}</small>
          </span>
        </button>
      `,
    )
    .join("");
}

function renderSubtags() {
  const tags =
    activeCategory === "All"
      ? [...new Set(Object.values(subtags).flat())]
      : subtags[activeCategory] || [];

  subtagTabs.innerHTML = ["全部", ...tags]
    .map(
      (tag) => `
        <button class="subtag-button${tag === activeSubtag ? " is-active" : ""}" type="button" data-subtag="${escapeHtml(tag)}">
          ${escapeHtml(tag)}
        </button>
      `,
    )
    .join("");
}

function renderGallery() {
  visibleCollections = collections
    .filter((collection) => {
      const categoryMatch =
        activeCategory === "All" || collection.category === activeCategory;
      const tagMatch =
        activeSubtag === "全部" || collection.tags?.includes(activeSubtag);
      return categoryMatch && tagMatch;
    })
    .sort(sortCollections);

  gallery.innerHTML = visibleCollections.map(renderCollectionCard).join("");
  resultCount.textContent = `${visibleCollections.length} 个图集`;
  galleryMode.textContent =
    activeCategory === "All"
      ? "精选图集 · 最新更新 · 推荐收藏"
      : `${getCategoryLabel(activeCategory)} · ${activeSubtag === "全部" ? "全部标签" : activeSubtag}`;
  emptyState.hidden = visibleCollections.length > 0;
}

function sortCollections(a, b) {
  if (activeCategory === "All" && a.featured !== b.featured) {
    return a.featured ? -1 : 1;
  }

  return new Date(b.updatedAt) - new Date(a.updatedAt);
}

function renderCollectionCard(collection, index) {
  const tags = (collection.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="collection-card">
      <button class="collection-cover" type="button" data-collection-index="${index}" aria-label="查看 ${escapeHtml(collection.title)}">
        <img src="${escapeAttribute(collection.cover)}" alt="${escapeAttribute(collection.title)}" loading="lazy">
        ${collection.featured ? '<span class="featured-badge">精选</span>' : ""}
      </button>
      <div class="collection-body">
        <div class="collection-card-top">
          <span>${escapeHtml(getCategoryLabel(collection.category))}</span>
          <time datetime="${escapeAttribute(collection.updatedAt)}">${escapeHtml(formatDate(collection.updatedAt))}</time>
        </div>
        <h3>${escapeHtml(collection.title)}</h3>
        <p>${escapeHtml(collection.description)}</p>
        <div class="collection-card-tags">${tags}</div>
        <div class="collection-card-footer">
          <span>${Number(collection.count || collection.images?.length || 0)} 张图片</span>
          <button type="button" data-collection-index="${index}">查看图集</button>
        </div>
      </div>
    </article>
  `;
}

function openCollection(index) {
  activeCollection = visibleCollections[index];
  if (!activeCollection) return;

  collectionTitle.textContent = activeCollection.title;
  collectionDescription.textContent = activeCollection.description || "";
  collectionMeta.textContent = `${getCategoryLabel(activeCollection.category)} · ${formatDate(activeCollection.updatedAt)} · ${activeCollection.count || activeCollection.images?.length || 0} 张图片`;
  collectionTags.innerHTML = (activeCollection.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");
  collectionImages.innerHTML = (activeCollection.images || [])
    .map(
      (image, index) => `
        <button class="collection-image-button" type="button" data-image-index="${index}" aria-label="查看第 ${index + 1} 张图片">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(`${activeCollection.title} ${index + 1}`)}" loading="lazy">
        </button>
      `,
    )
    .join("");

  collectionModal.classList.add("is-open");
  collectionModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox");
}

function closeCollection() {
  collectionModal.classList.remove("is-open");
  collectionModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("has-lightbox");
}

function openImage(index) {
  if (!activeCollection) return;
  activeImageIndex = index;
  updateLightbox();
  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox");
  downloadSingleButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  if (!collectionModal.classList.contains("is-open")) {
    document.body.classList.remove("has-lightbox");
  }
}

function updateLightbox() {
  const image = activeCollection?.images?.[activeImageIndex];
  if (!activeCollection || !image) return;

  lightboxImage.src = image;
  lightboxImage.alt = `${activeCollection.title} ${activeImageIndex + 1}`;
  lightboxTitle.textContent = activeCollection.title;
  lightboxDate.textContent = `${activeImageIndex + 1} / ${activeCollection.images.length}`;
  lightboxDescription.textContent = "手机端可长按图片保存。";
  lightboxTags.innerHTML = (activeCollection.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");
}

function showRelativeImage(direction) {
  if (!activeCollection?.images?.length) return;
  activeImageIndex =
    (activeImageIndex + direction + activeCollection.images.length) %
    activeCollection.images.length;
  updateLightbox();
}

async function downloadSingle() {
  const image = activeCollection?.images?.[activeImageIndex];
  if (!image) return;

  const fileName = `${safeFileName(activeCollection.title)}-${activeImageIndex + 1}${getFileExtension(image)}`;
  try {
    await downloadUrlAsFile(image, fileName);
  } catch (error) {
    alert("下载失败，请长按图片保存。");
    console.error(error);
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

function getCategoryLabel(categoryId) {
  return categories.find((category) => category.id === categoryId)?.label || categoryId;
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
  return String(value || "citrus-collection")
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

categoryTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  activeSubtag = "全部";
  renderCategories();
  renderSubtags();
  renderGallery();
});

subtagTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-subtag]");
  if (!button) return;
  activeSubtag = button.dataset.subtag;
  renderSubtags();
  renderGallery();
});

gallery.addEventListener("click", (event) => {
  const button = event.target.closest("[data-collection-index]");
  if (!button) return;
  openCollection(Number(button.dataset.collectionIndex));
});

collectionModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-collection]")) closeCollection();

  const imageButton = event.target.closest("[data-image-index]");
  if (imageButton) openImage(Number(imageButton.dataset.imageIndex));
});

lightbox.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-lightbox]")) closeLightbox();
});

prevButton.addEventListener("click", () => showRelativeImage(-1));
nextButton.addEventListener("click", () => showRelativeImage(1));
downloadSingleButton.addEventListener("click", downloadSingle);

document.addEventListener("keydown", (event) => {
  if (lightbox.classList.contains("is-open")) {
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") showRelativeImage(-1);
    if (event.key === "ArrowRight") showRelativeImage(1);
    return;
  }

  if (collectionModal.classList.contains("is-open") && event.key === "Escape") {
    closeCollection();
  }
});

initGallery();
