# CLAUDE.md - 记账APP项目工作指引

## 项目简介
这是一个面向编程小白的个人记账PWA项目。用户不会写代码，所有开发工作由Claude完成。目标是在安卓/iOS手机上通过浏览器使用，可添加到桌面。

## 用户画像
- 不会编程，需要你用通俗语言解释每一步
- 每个阶段完成后需要验收确认，再进入下一阶段
- 偏好简洁直观的UI设计

## 关键文件路径

### 项目标准文档
| 文件 | 内容 | 用途 |
|------|------|------|
| [docs/requirements.md](docs/requirements.md) | 需求文档 | 所有功能需求和非功能需求的详细描述 |
| [docs/tech-spec.md](docs/tech-spec.md) | 技术规范 | 技术栈、数据模型、localStorage设计、编码规范 |
| [docs/design-spec.md](docs/design-spec.md) | 设计规范 | 配色方案、字体、页面布局、交互规范 |
| [docs/dev-plan.md](docs/dev-plan.md) | 开发执行步骤 | 9个Phase的详细任务拆解和验收标准 |

### 开发日志
| 目录 | 用途 |
|------|------|
| [dev-logs/](dev-logs/) | 每天自动记录完成事项和待办事项 |
| [dev-logs/TEMPLATE.md](dev-logs/TEMPLATE.md) | 日志模板 |

### 源代码
| 目录/文件 | 用途 |
|-----------|------|
| [src/](src/) | 所有源代码根目录 |
| [src/index.html](src/index.html) | 主页面（唯一HTML文件） |
| [src/css/style.css](src/css/style.css) | 样式文件 |
| [src/js/](src/js/) | JavaScript模块目录 |
| [src/manifest.json](src/manifest.json) | PWA清单文件 |
| [src/sw.js](src/sw.js) | Service Worker离线缓存 |

## 工作约定

### 开发原则
1. **分阶段推进**：严格按照 dev-plan.md 的9个Phase顺序开发，不跳步、不并行
2. **每阶段验收**：一个Phase完成后，向用户展示效果并等待确认，再开始下一Phase
3. **零依赖**：不使用任何第三方框架或库，纯HTML+CSS+JS
4. **中文注释**：代码中添加充足的中文注释，方便用户未来找人维护
5. **移动优先**：所有UI以手机屏幕为设计基准（375px-414px宽度）

### 每日流程
- 每次开始开发时，在 [dev-logs/](dev-logs/) 创建当天的日志文件（格式 YYYY-MM-DD.md）
- 记录当天完成的任务和待办事项
- 更新 [docs/dev-plan.md](docs/dev-plan.md) 中对应Phase的勾选状态

### 代码规范
- 所有金额保留两位小数
- 金额输入使用数字键盘（inputmode="decimal"）
- 不使用 innerHTML（防XSS）
- localStorage 读写集中在 js/storage.js
- 所有DOM操作集中在 js/ui.js

### 与用户沟通
- 避免使用技术术语，用比喻和日常语言解释
- 展示成果时用截图描述（你无法真正截图，但可以描述界面样子）
- 用户的"好的""可以""行"都代表同意进入下一步

## 当前项目状态
- **当前Phase**：Phase 0 - 项目初始化 ✅
- **下一步**：Phase 1 - 项目骨架搭建
- **最后更新**：2026-05-16
