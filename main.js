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
const downloadAllButton = document.querySelector(".download-actions .download-button.primary");
const prevButton = document.querySelector("#prevWork");
const nextButton = document.querySelector("#nextWork");
const IMAGE_BATCH_SIZE = 12;

const categories = [
  { id: "All", label: "全部", english: "All", icon: "▦" },
  { id: "Cover", label: "封面", english: "Cover", icon: "▰" },
  { id: "Collage", label: "拼接图", english: "Collage", icon: "▧" },
  { id: "Wallpaper", label: "壁纸", english: "Wallpaper", icon: "▱" },
  { id: "Daily", label: "日常番外", english: "Daily", icon: "✿" },
  { id: "Collection", label: "收集图集", english: "Collection", icon: "▣" },
];

const subtags = {
  Cover: ["Citrus", "Citrus+", "单面封面", "单画封面", "特装版", "特典封面", "杂志封面", "周年纪念"],
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
let visibleCollectionImageCount = IMAGE_BATCH_SIZE;

async function initGallery() {
  renderCategories();
  prepareDownloadAllButton();

  try {
    const response = await fetch("data/collections.json");
    if (!response.ok) throw new Error("collections.json 加载失败");
    const rawCollections = await response.json();
    collections = rawCollections.map(normalizeCollection);
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
      const categoryMatch = matchesActiveCategory(collection);
      const tagMatch =
        activeSubtag === "全部" || matchesCollectionText(collection, activeSubtag);
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
  const cover = collection.cover || collection.coverImage || collection.images?.[0]?.thumb || collection.images?.[0]?.src || "";
  if (!cover) console.warn("封面加载失败", collection.id, cover);
  const tags = (collection.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");

  return `
    <article class="collection-card">
      <button class="collection-cover" type="button" data-collection-index="${index}" aria-label="查看 ${escapeHtml(collection.title)}">
        ${
          cover
            ? `<img src="${escapeAttribute(cover)}" alt="${escapeAttribute(collection.title)}" loading="lazy" decoding="async" data-cover-id="${escapeAttribute(collection.id)}" data-cover-path="${escapeAttribute(cover)}" onerror="this.hidden=true; this.nextElementSibling.hidden=false; console.warn('封面加载失败：路径错误', this.dataset.coverId, this.dataset.coverPath);">`
            : ""
        }
        <span class="cover-fallback"${cover ? " hidden" : ""}>封面加载失败：路径错误</span>
        <span class="featured-badge">精选</span>
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
          <div class="card-actions">
            <button type="button" data-collection-index="${index}">查看图集</button>
            <button class="secondary-action" type="button" data-download-collection-index="${index}">下载图集</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function normalizeCollection(collection) {
  const images = (collection.images || []).map(normalizeImage);
  const cover = collection.cover || collection.coverImage || images[0]?.thumb || images[0]?.src || "";
  const searchableText = [
    collection.title,
    collection.id,
    cover,
    ...images.flatMap((image) => [image.thumb, image.src]),
  ]
    .join(" ")
    .toLowerCase();
  const tags = [...(collection.tags || [])];

  appendTagIfMatched(tags, searchableText, "citrus+", "Citrus+");
  appendTagIfMatched(tags, searchableText, "citrus", "Citrus");
  appendTagIfMatched(tags, searchableText, "拼接", "拼接图");
  appendTagIfMatched(tags, searchableText, "封面", "单面封面");
  appendTagIfMatched(tags, searchableText, "特典", "特典封面");
  appendTagIfMatched(tags, searchableText, "壁纸", "壁纸");
  appendTagIfMatched(tags, searchableText, "竖屏", "竖屏");
  appendTagIfMatched(tags, searchableText, "横屏", "横屏");

  return {
    ...collection,
    cover,
    images,
    category: collection.category || inferCategory(searchableText),
    tags: [...new Set(tags)],
    count: collection.count || images.length || 0,
    updatedAt: collection.updatedAt || collection.date || "",
  };
}

function normalizeImage(image) {
  if (typeof image === "string") {
    return { thumb: image, src: image };
  }

  const src = image?.src || image?.original || image?.thumb || "";
  return {
    ...image,
    thumb: image?.thumb || src,
    src,
  };
}

function appendTagIfMatched(tags, text, keyword, tag) {
  if (text.includes(keyword) && !tags.includes(tag)) tags.push(tag);
}

function inferCategory(text) {
  if (text.includes("拼接")) return "Collage";
  if (text.includes("封面")) return "Cover";
  if (text.includes("壁纸")) return "Wallpaper";
  if (text.includes("番外") || text.includes("日常")) return "Daily";
  return "Collection";
}

function getSearchableText(collection) {
  return [
    collection.title,
    collection.id,
    collection.cover,
    collection.coverImage,
    ...(collection.tags || []),
    ...(collection.images || []).flatMap((image) => [image.thumb, image.src]),
  ]
    .join(" ")
    .toLowerCase();
}

function matchesCollectionText(collection, keyword) {
  if (!keyword || keyword === "全部") return true;
  const tags = collection.tags || [];
  if (tags.includes(keyword)) return true;

  const text = getSearchableText(collection);
  const normalizedKeyword = keyword.toLowerCase();
  if (text.includes(normalizedKeyword)) return true;

  const aliases = {
    拼接图: ["拼接"],
    特典封面: ["特典"],
    单行本封面: ["单行本"],
    单面封面: ["单行本", "封面"],
    封面: ["封面"],
  };

  return (aliases[keyword] || []).some((alias) => text.includes(alias.toLowerCase()));
}

function matchesActiveCategory(collection) {
  if (activeCategory === "All") return true;
  if (collection.category === activeCategory) return true;

  const text = getSearchableText(collection);
  const tags = collection.tags || [];

  const categoryMatchers = {
    Cover: () =>
      tags.some((tag) => ["单行本封面", "单面封面", "单画封面", "特典封面", "杂志封面"].includes(tag)) ||
      text.includes("封面") ||
      text.includes("单行本") ||
      text.includes("特典"),
    Collage: () => tags.includes("拼接图") || text.includes("拼接"),
    Wallpaper: () => tags.includes("壁纸") || text.includes("壁纸") || text.includes("竖屏") || text.includes("横屏"),
    Daily: () => tags.some((tag) => ["日常", "番外", "校园", "约会"].includes(tag)) || text.includes("日常") || text.includes("番外"),
    Collection: () =>
      tags.some((tag) => ["官方插图", "杂志图", "宣传图", "稀有图", "网络整理"].includes(tag)) ||
      text.includes("官方") ||
      text.includes("杂志") ||
      text.includes("宣传") ||
      text.includes("稀有"),
  };

  return categoryMatchers[activeCategory]?.() || false;
}

function openCollection(index) {
  activeCollection = visibleCollections[index];
  if (!activeCollection) return;
  visibleCollectionImageCount = IMAGE_BATCH_SIZE;

  collectionTitle.textContent = activeCollection.title;
  collectionDescription.textContent = activeCollection.description || "";
  collectionMeta.textContent = `${getCategoryLabel(activeCollection.category)} · ${formatDate(activeCollection.updatedAt)} · ${activeCollection.count || activeCollection.images?.length || 0} 张图片`;
  collectionTags.innerHTML = (activeCollection.tags || [])
    .map((tag) => `<span class="tag-chip">${escapeHtml(tag)}</span>`)
    .join("");
  renderCollectionImages();

  collectionModal.classList.add("is-open");
  collectionModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("has-lightbox");
}

function renderCollectionImages() {
  const images = activeCollection?.images || [];
  const visibleImages = images.slice(0, visibleCollectionImageCount);
  const hasMore = visibleCollectionImageCount < images.length;

  collectionImages.innerHTML = visibleImages
    .map(
      (image, index) => `
        <div class="collection-image-item">
          <button class="collection-image-button" type="button" data-image-index="${index}" aria-label="查看第 ${index + 1} 张图片">
            <img src="${escapeAttribute(getImageThumb(image))}" alt="${escapeAttribute(`${activeCollection.title} ${index + 1}`)}" loading="lazy" decoding="async">
          </button>
          <button class="image-download-button" type="button" data-download-image-index="${index}">下载</button>
        </div>
      `,
    )
    .join("") +
    (hasMore
      ? `<button class="load-more-images" type="button" data-load-more-images>加载更多</button>`
      : "");
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
  const imageSrc = getImageSrc(image);
  if (!activeCollection || !image) return;

  lightboxImage.src = imageSrc;
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
  const downloadSrc = getDownloadSrc(activeCollection, activeImageIndex);
  if (!downloadSrc) return;

  const fileName = `${safeFileName(activeCollection.title)}-${activeImageIndex + 1}${getFileExtension(downloadSrc)}`;
  try {
    await downloadUrlAsFile(downloadSrc, fileName);
  } catch (error) {
    alert("下载失败，请长按图片保存。");
    console.error(error);
  }
}

async function downloadCollectionImage(index, triggerButton) {
  const downloadSrc = getDownloadSrc(activeCollection, index);
  if (!activeCollection || !downloadSrc) return;

  const originalText = triggerButton?.textContent;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = "下载中";
  }

  try {
    const fileName = `${safeFileName(activeCollection.title)}-${index + 1}${getFileExtension(downloadSrc)}`;
    await downloadUrlAsFile(downloadSrc, fileName);
  } catch (error) {
    alert("下载失败，请右键或长按图片保存。");
    console.error(error);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = originalText || "下载";
    }
  }
}

async function downloadCollection(collection, triggerButton) {
  const downloads = collection?.downloads || [];
  if (!collection || !downloads.length) return;

  const originalText = triggerButton?.textContent;
  if (triggerButton) {
    triggerButton.disabled = true;
    triggerButton.textContent = `打包中 0/${downloads.length}...`;
  }

  try {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    for (let index = 0; index < downloads.length; index += 1) {
      const downloadSrc = getDownloadSrc(collection, index);
      if (!downloadSrc) continue;

      const response = await fetch(downloadSrc);
      if (!response.ok) throw new Error(`${downloadSrc} 下载失败`);

      const fileName = `${safeFileName(collection.title)}-${index + 1}${getFileExtension(downloadSrc)}`;
      zip.file(fileName, await response.blob());

      if (triggerButton) {
        triggerButton.textContent = `打包中 ${index + 1}/${downloads.length}...`;
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    await triggerBlobDownload(blob, `${safeFileName(collection.title)}.zip`);
  } catch (error) {
    alert("下载失败，请重试");
    console.error(error);
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
      triggerButton.textContent = originalText || "下载图集";
    }
  }
}

function prepareDownloadAllButton() {
  if (!downloadAllButton) return;
  downloadAllButton.disabled = false;
  downloadAllButton.textContent = "下载全部";
  downloadAllButton.addEventListener("click", () => downloadCollection(activeCollection, downloadAllButton));
}

async function loadJSZip() {
  if (window.JSZip) return window.JSZip;

  const jszipModule = await import("./vendor/jszip.min.js");
  return window.JSZip || jszipModule.default || jszipModule.JSZip;
}

function getImageThumb(image) {
  return typeof image === "string" ? image : image?.thumb || image?.src || "";
}

function getImageSrc(image) {
  return typeof image === "string" ? image : image?.src || image?.original || image?.thumb || "";
}

function getDownloadSrc(collection, index) {
  const download = collection?.downloads?.[index];
  if (typeof download === "string") return download;
  return download?.src || download?.original || "";
}

async function downloadUrlAsFile(url, fileName) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} 下载失败`);
  const blob = await response.blob();
  await triggerBlobDownload(blob, fileName);
}

function triggerBlobDownload(blob, fileName) {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);

    window.setTimeout(() => {
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      resolve();
    }, 100);
  });
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
  const downloadButton = event.target.closest("[data-download-collection-index]");
  if (downloadButton) {
    const collection = visibleCollections[Number(downloadButton.dataset.downloadCollectionIndex)];
    downloadCollection(collection, downloadButton);
    return;
  }

  const button = event.target.closest("[data-collection-index]");
  if (!button) return;
  openCollection(Number(button.dataset.collectionIndex));
});

collectionModal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-collection]")) closeCollection();

  if (event.target.closest("[data-load-more-images]")) {
    visibleCollectionImageCount += IMAGE_BATCH_SIZE;
    renderCollectionImages();
    return;
  }

  const imageButton = event.target.closest("[data-image-index]");
  if (imageButton) openImage(Number(imageButton.dataset.imageIndex));

  const downloadButton = event.target.closest("[data-download-image-index]");
  if (downloadButton) downloadCollectionImage(Number(downloadButton.dataset.downloadImageIndex), downloadButton);
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
