# Citrus 图集项目说明

## 项目概览
纯静态网站，部署于 GitHub Pages，供粉丝浏览和下载柑橘主题图文作品。
无后端，无构建工具，无框架。

## 文件结构
- index.html — 唯一页面，画廊主页
- style.css — 全局样式
- main.js — 所有交互逻辑
- vendor/jszip.min.js — 本地 JSZip，已存在，勿重新下载
- data/collections.json — 作品数据，网站自动读取
- images/ — 图片文件夹

## 技术约束（严格遵守）
- 不使用任何需要 npm / 构建的框架
- 不引入 CDN 外部库（GitHub Pages 环境可能拦截）
- JSZip 统一从 ./vendor/jszip.min.js 动态加载
- 不修改 collections.json 的数据结构
- CSS 变量统一在 style.css 顶部定义

## 修改原则
- 每次任务只修改指定文件，不要顺手改其他文件
- 不需要启动本地服务器验证
- 完成后只说已修改 X 文件，改动内容是什么
- 不需要在终端验证 UI 效果
# AGENTS.md

## Project Context
This is a static image gallery website for organizing and displaying Citrus-related image collections.

## Core Rule
Do not rewrite the whole project unless I explicitly ask.
Make the smallest possible change.
Before editing, explain which files you will change.

## File Rules
- Image paths must match the real folder and file names exactly.
- Do not rename image files unless I ask.
- Do not change folder structure unless I ask.
- Prefer standard names like cover_01.png, cover_02.png, merged_01.png.

## Coding Rules
- Preserve the current visual style unless I ask for redesign.
- Do not delete existing features.
- Do not add large dependencies.
- If a feature is complex, split it into small steps.

## Download Feature Rule
Do not implement full-folder ZIP download unless I explicitly ask.
First support:
1. image preview
2. right click / long press save
3. single image download button
Only after these are stable, consider ZIP download.

## After Coding
Always tell me:
1. What changed
2. Which files changed
3. How to test locally
4. How to commit and push

