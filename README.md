# Citrus 柑橘作品集网站

一个可部署到 GitHub Pages 的纯静态图集网站，适合展示「Citrus / Citrus+」相关图片收藏。网站不需要后端，也不需要构建工具。

## 文件结构

```text
citrus-gallery/
├── index.html
├── style.css
├── main.js
├── data/
│   └── collections.json
├── images/
│   ├── avatar-meteor.jpg
│   └── hero-wedding.png
├── 图集文件夹/
│   └── 图片文件
└── README.md
```

## 日常更新流程

1. 把整理好的图集文件夹拖到项目根目录，或放到你指定的图集目录中。
2. 在 `data/collections.json` 里新增一条图集数据。
3. 提交并推送到 GitHub。

网站会自动读取 `collections.json`，不需要修改 `index.html`、`style.css` 或 `main.js`。

每个图集支持：

- 查看图集内所有图片
- 点击单图查看大图
- 单张下载
- 下载全部图片为 `.zip`

## collections.json 字段说明

```json
{
  "id": "cover-citrus-1-10",
  "title": "citrus 历代封面 1-10",
  "description": "整理 citrus 单行本 1-10 卷封面，适合收藏与封面美学参考。",
  "category": "Cover",
  "tags": ["Citrus", "单画封面"],
  "cover": "单行本1-10拼接封面原图/截屏2026-06-06 00.53.30.png",
  "images": [
    "单行本1-10拼接封面原图/截屏2026-06-06 00.53.30.png",
    "单行本1-10拼接封面原图/截屏2026-06-06 00.54.12.png"
  ],
  "count": 2,
  "updatedAt": "2026-06-09",
  "featured": true
}
```

- `category`：一级分类，可用 `Cover`、`Collage`、`Wallpaper`、`Daily`、`Collection`。
- `tags`：二级标签，需要和页面里的标签体系对应。
- `cover`：图集卡片封面图。
- `images`：图集内所有图片路径。
- `count`：图片数量。
- `updatedAt`：更新时间，格式为 `YYYY-MM-DD`。
- `featured`：是否在「全部」页优先展示。

## 本地预览

不要直接用 `file://` 打开 `index.html` 预览，因为浏览器可能会限制读取本地 JSON，导致出现“图集数据暂时无法加载”。

请在项目目录启动本地服务器：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 同步到 GitHub

```bash
cd /Users/meteoryu/Documents/citrus图集
git add .
git commit -m "Update citrus gallery"
git push origin main
```

推送成功后，GitHub Pages 通常会在几十秒到几分钟内更新。
