# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 React + Vite + spin-sdk 的 Web 应用项目，专门用于构建与 Spin（一个 WebAssembly 运行时）集成的现代 Web 界面。项目采用了卡通风格的界面设计，专注于数字货币交易相关功能。

## 常用开发命令

### 开发和构建
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

### 安装依赖
```bash
npm install
```

### 环境变量配置
项目使用 Vite 环境变量系统：

```bash
# 查看当前环境变量
cat .env

# 开发环境特定配置 (会被 git 忽略)
cp .env .env.local
# 然后编辑 .env.local 中的配置
```

**环境变量文件优先级**：
1. `.env.local` (本地覆盖，被 git 忽略)
2. `.env.development` / `.env.production` (环境特定)
3. `.env` (默认配置)

**在代码中使用**：
```javascript
import { config } from './config.js'
console.log(config.serverUrl) // https://pinata-server.spin.pet
```

## 项目架构

### 技术栈
- **前端框架**: React 19.1.1
- **构建工具**: Vite 7.1.2
- **编译器**: SWC (通过 @vitejs/plugin-react-swc)
- **运行时集成**: spin-sdk 0.1.1
- **代码质量**: ESLint 9.33.0
- **样式**: Tailwind CSS 4.1.13 + 自定义 CSS
- **UI 组件**: Headless UI 2.2.8
- **图标**: Heroicons 2.2.0
- **动画**: Framer Motion 12.23.12
- **工具库**: clsx 2.1.1

### 目录结构
```
src/
├── App.jsx               # 主应用组件
├── main.jsx              # 应用入口点
├── config.js             # 环境变量配置管理
├── App.css               # 应用样式
├── index.css             # 全局样式 (Tailwind + 自定义)
├── components/           # React 组件库
│   ├── Header/
│   │   └── Navigation.jsx    # 导航栏组件
│   ├── Card/
│   │   └── ProjectCard.jsx   # 项目卡片组件
│   ├── Search/
│   │   └── SearchAndFilters.jsx # 搜索筛选组件
│   └── Layout/
│       ├── Container.jsx     # 容器布局
│       └── HeroSection.jsx   # 主页Hero区域
├── pages/
│   └── HomePage.jsx          # 主页面组件
├── data/
│   └── mockData.js           # 模拟数据
└── assets/                   # 静态资源
    └── react.svg

example/             # HTML 示例和设计参考
├── home/           # 首页示例
└── trade/          # 交易页面示例

public/             # 公共静态资源
└── vite.svg
```

### 关键配置文件
- **vite.config.js**: Vite 配置，使用 SWC React 插件
- **tailwind.config.js**: Tailwind CSS 配置，包含自定义主题和卡通风格
- **postcss.config.js**: PostCSS 配置，集成 Tailwind CSS 和 Autoprefixer
- **eslint.config.js**: ESLint 配置，包含 React、React Hooks 和 React Refresh 规则
- **package.json**: 项目依赖和脚本配置

### Spin SDK 集成
项目集成了 `spin-sdk`，这是与 Spin WebAssembly 运行时交互的核心库。这使得应用能够：
- 与 WebAssembly 模块进行通信
- 利用 Spin 的边缘计算能力
- 实现高性能的 Web 应用

### 设计风格指南
基于 `example/` 目录中的示例文件，项目采用：
- **视觉风格**: 卡通风格界面 (Cartoon Style)
- **字体**: Comic Neue, Fredoka One
- **颜色主题**: 温暖色调，使用黄色、橙色、青色等亮色
- **UI 元素**: 带阴影的卡片式设计，圆角边框
- **交互**: 悬停效果，按钮按压动画

### 国际化
项目主要面向中文用户，界面元素和内容均使用简体中文。

## 组件设计原则

### 卡通风格主题
- **颜色方案**: 温暖色调，主要使用橙色(#FF8A65)、黄色、青色
- **字体**: Fredoka One (标题) + Inter (正文)
- **阴影效果**: 使用 `shadow-cartoon` 和 `shadow-cartoon-sm` 类
- **动画**: Framer Motion 实现悬停和过渡效果
- **交互**: 按钮按压效果，卡片悬停上升

### 组件复用性
- **ProjectCard**: 支持 `large` 和 `compact` 两种变体
- **Container**: 提供统一的页面容器和间距
- **动态筛选**: SearchAndFilters 组件支持实时搜索和排序

## 开发注意事项

1. **React 版本**: 使用 React 19.1.1，支持最新的 React 特性
2. **TypeScript**: 当前使用 JavaScript，但项目结构支持升级到 TypeScript
3. **模块格式**: 使用 ES 模块 (`"type": "module"`)
4. **热重载**: 通过 Vite 和 SWC 提供快速的热重载体验
5. **代码规范**: ESLint 配置包含 React、React Hooks 最佳实践检查
6. **环境变量**: 只有 `VITE_` 前缀的变量会暴露给客户端代码
7. **配置管理**: 使用 `src/config.js` 集中管理所有配置项
8. **样式系统**: Tailwind CSS + 自定义卡通风格类

## 构建和部署

项目使用 Vite 进行构建，输出目录为 `dist/`。构建产物针对现代浏览器进行了优化，支持：
- ES 模块
- 代码分割
- 资源优化
- 生产环境优化

## Spin 特定配置

由于项目集成了 Spin SDK，在开发时需要注意：
- 确保 Spin 运行时环境正确配置
- WebAssembly 模块的加载和通信
- 边缘计算功能的集成和测试