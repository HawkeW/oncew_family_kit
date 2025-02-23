# Oncew Family Kit

## 项目简介

一个家庭健康记录工具，帮助家庭成员记录和追踪健康相关数据。

## 功能特点

- 更多功能开发中...

## 环境要求

- Node.js 18.0 或更高版本
- npm 或其他包管理器（如 yarn、pnpm、bun）

## 快速开始

### 1. 克隆项目

```bash
git clone [项目地址]
cd oncew_family_kit
```

### 2. 安装依赖

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

### 3. 启动开发服务器

开发服务器将在 `http://localhost:3000` 启动：

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## 技术栈

- [Nuxt 3](https://nuxt.com) - Vue.js 全栈框架
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的 CSS 框架
- [shadcn-vue](https://www.shadcn-vue.com/) - 可重用的 Vue 组件库

## 生产环境

### 构建应用

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

### 本地预览生产构建

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## 项目结构

```
├── assets/          # 静态资源
├── components/      # Vue 组件
├── layouts/         # 布局组件
├── pages/           # 页面组件
├── public/          # 公共文件
├── server/          # 服务端 API
└── lib/            # 工具函数
```

## 开发指南

1. 遵循 Vue 3 组合式 API 的编写风格
2. 使用 TypeScript 进行类型检查
3. 使用 Tailwind CSS 进行样式开发
4. API 端点位于 `server/api` 目录

更多开发相关信息，请参考 [Nuxt 3 文档](https://nuxt.com/docs/getting-started/introduction)。
