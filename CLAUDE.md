# CLAUDE.md - 记账APP项目工作指引

## 项目简介
这是一个面向编程小白的个人记账PWA项目。用户不会写代码，所有开发工作由Claude完成。目标是在安卓/iOS手机上通过浏览器使用，可添加到桌面。

## 用户画像
- 不会编程，需要你用通俗语言解释每一步
- 每个阶段完成后需要验收确认，再进入下一阶段
- 偏好简洁直观的UI设计

## 关键文件路径

### 项目标准文档（开发规范）
| 文件 | 内容 |
|------|------|
| [dev-docs/requirements.md](dev-docs/requirements.md) | 需求文档 |
| [dev-docs/tech-spec.md](dev-docs/tech-spec.md) | 技术规范 |
| [dev-docs/design-spec.md](dev-docs/design-spec.md) | 设计规范 |
| [dev-docs/dev-plan.md](dev-docs/dev-plan.md) | 开发执行步骤 |

### 开发日志
| 目录 | 用途 |
|------|------|
| [dev-logs/](dev-logs/) | 每天自动记录完成事项和待办事项 |

### 源代码（也是 GitHub Pages 部署目录）
| 目录/文件 | 用途 |
|-----------|------|
| [docs/](docs/) | Web 应用根目录 |
| [docs/index.html](docs/index.html) | 主页面 |
| [docs/css/style.css](docs/css/style.css) | 样式文件 |
| [docs/js/](docs/js/) | JavaScript 模块 |
| [docs/manifest.json](docs/manifest.json) | PWA 清单 |
| [docs/sw.js](docs/sw.js) | Service Worker 离线缓存 |

## 工作约定

### 开发原则
1. **分阶段推进**：严格按照 dev-plan.md 的 9 个 Phase 顺序开发
2. **每阶段验收**：一个 Phase 完成后，向用户展示效果并等待确认
3. **零依赖**：不使用任何第三方框架或库，纯 HTML+CSS+JS
4. **中文注释**：代码中添加充足的中文注释
5. **移动优先**：所有 UI 以手机屏幕为设计基准（375px-414px 宽度）

### 每日流程
- 每次开始开发时，在 [dev-logs/](dev-logs/) 创建当天日志（格式 YYYY-MM-DD.md）
- 记录完成的任务和待办事项
- 更新 [dev-docs/dev-plan.md](dev-docs/dev-plan.md) 中对应 Phase 的勾选状态

### 代码规范
- 所有金额保留两位小数
- 金额输入使用数字键盘（inputmode="decimal"）
- 不使用 innerHTML（防XSS）
- localStorage 读写集中在 js/storage.js
- 所有 DOM 操作集中在 js/ui.js

### 与用户沟通
- 避免使用技术术语，用比喻和日常语言解释
- 用户的"好的""可以""行"都代表同意进入下一步

## 当前项目状态
- **版本**：v2.0
- **Phase**：全部 12 个 Phase 开发完成
- **线上地址**：https://ssy1007.github.io/jizhang/
- **App名称**：Ai记
- **最后更新**：2026-05-17
