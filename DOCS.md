# 家政服务小程序 - 技术文档

## 1. 架构说明 (Architecture)

本项目采用 **单页应用 (SPA)** 架构，基于 React 框架构建。

### 核心设计原则：
*   **组件化 (Component-Based)**: 界面拆分为高度可复用的 UI 组件（如 `ServiceCard`, `Carousel`）。
*   **按需加载 (Lazy Loading)**: 使用 `React.lazy` 和 `Suspense` 对页面级组件进行代码分割，减少首屏加载时间。
*   **状态提升 (State Lifting)**: 核心业务状态（如当前页面、日期选择）维护在 `App.tsx` 中，通过 Props 下发。
*   **性能隔离 (Performance Isolation)**: 
    *   将高频更新的逻辑（如轮播图定时器）封装在独立组件中，避免触发整个应用树的重绘。
    *   使用 `React.memo` 优化静态或低频更新的组件。

---

## 2. 技术栈 (Tech Stack)

*   **前端框架**: React 18+ (TypeScript)
*   **构建工具**: Vite (提供极速的热更新和构建体验)
*   **样式处理**: Tailwind CSS (原子化 CSS，确保样式一致性且包体积小)
*   **动画库**: Motion (原 Framer Motion，处理页面切换和交互动画)
*   **图标库**: Lucide React (轻量级 SVG 图标)
*   **路由/导航**: 自定义状态驱动导航 (WeChat 小程序风格)

---

## 3. 性能优化点 (Optimizations)

1.  **轮播图优化**: 将定时器和图片状态从 `App.tsx` 移至 `Carousel.tsx`，防止每 4 秒触发一次全量渲染。
2.  **组件缓存**: 对 `ServiceCard` 等列表项使用 `React.memo`，避免不必要的 DOM 操作。
3.  **本地缓存**: 轮播图数据和页面状态部分持久化于 `localStorage`，提升二次访问速度。
4.  **图片策略**: 使用 `referrerPolicy="no-referrer"` 确保跨域图片正常加载，并配合 Tailwind 的 `aspect-ratio` 防止布局抖动。

---

## 4. 编译与部署 (Build & Compilation)

### 开发环境启动：
```bash
npm run dev
```
该命令会启动 Vite 开发服务器，监听 `3000` 端口。

### 生产环境编译：
```bash
npm run build
```
编译产物将输出至 `/dist` 目录，包含压缩后的静态资源。

### 代码校验：
```bash
npm run lint
```
使用 TypeScript 进行类型检查，确保代码健壮性。
