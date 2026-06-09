# Citrus 柑橘作品集网站

一个可部署到 GitHub Pages 的纯静态作品集网站，适合展示「柑橘味」摄影、插图与文字说明。网站不需要后端，也不需要构建工具。

## 文件结构

```text
citrus-gallery/
├── index.html
├── style.css
├── main.js
├── data/
│   └── works.json
├── images/
│   └── 图片文件放这里
└── README.md
```

## 日常更新流程

1. 把新图片上传到 `images/` 文件夹。
2. 在 `data/works.json` 里新增一条作品数据。

完成后网站会自动读取新数据，不需要修改 `index.html`、`style.css` 或 `main.js`。

## works.json 字段说明

```json
{
  "id": "unique-id",
  "title": "作品标题",
  "description": "完整文字说明，支持多行",
  "image": "images/cover.jpg",
  "images": ["images/cover.jpg", "images/detail-1.jpg"],
  "tags": ["橙子", "插图", "2024"],
  "date": "2024-03-18"
}
```

- `id`：唯一标识，建议使用英文、数字和短横线。
- `title`：作品标题。
- `description`：作品说明，支持换行。
- `image`：卡片封面和详情页主图路径。
- `images`：可选，打包下载时使用的图组路径数组。如果不填，会默认打包 `image`。
- `tags`：标签数组，用于首页筛选。
- `date`：发布日期，格式为 `YYYY-MM-DD`。

## 本地预览

由于浏览器直接打开 HTML 文件时可能限制 `fetch` 读取本地 JSON，建议在项目目录启动一个简单静态服务器：

```bash
python3 -m http.server 8000
```

然后访问 `http://localhost:8000`。

## 部署到 GitHub Pages

1. 创建名为 `citrus-gallery` 的 GitHub 仓库。
2. 上传本项目所有文件。
3. 在仓库页面进入 `Settings` -> `Pages`。
4. Source 选择 `Deploy from a branch`。
5. Branch 选择 `main` 和 `/(root)`，保存。
6. 等待 GitHub Pages 构建完成后访问页面链接。

## 说明

示例数据使用 `https://picsum.photos/seed/...` 占位图，正式发布前可以替换为 `images/` 里的真实图片路径。
