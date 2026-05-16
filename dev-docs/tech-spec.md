# 技术规范文档

## 技术栈
- **前端**：HTML5 + CSS3 + 原生 JavaScript (ES6+)
- **存储**：localStorage
- **离线**：Service Worker (PWA)
- **依赖**：零依赖，不引入任何第三方库

## 浏览器兼容性
最低支持：
- Chrome 80+
- Safari 13+ (iOS)
- Edge 80+
- Samsung Internet 13+

## 项目结构
```
jizhang/
├── src/
│   ├── index.html          # 主页面（唯一HTML文件）
│   ├── css/
│   │   └── style.css       # 样式文件
│   ├── js/
│   │   ├── app.js          # 主入口，初始化
│   │   ├── storage.js      # localStorage 数据操作
│   │   ├── ui.js           # UI渲染、页面切换
│   │   ├── transaction.js  # 收支记录逻辑
│   │   ├── category.js     # 分类管理逻辑
│   │   ├── budget.js       # 预算逻辑
│   │   ├── search.js       # 搜索逻辑
│   │   ├── theme.js        # 主题切换
│   │   └── stats.js        # 统计计算
│   ├── manifest.json       # PWA 清单
│   └── sw.js               # Service Worker
├── docs/
│   ├── requirements.md     # 需求文档
│   ├── tech-spec.md        # 技术规范（本文件）
│   ├── design-spec.md      # 设计规范
│   └── dev-plan.md         # 开发执行步骤
├── dev-logs/               # 开发日志
└── CLAUDE.md               # 项目工作指引
```

## 数据模型

### Transaction（交易记录）
```
{
  id: string,           // 唯一ID，时间戳+随机数
  type: 'expense' | 'income',
  amount: number,       // 金额，保留两位小数
  category: string,     // 分类名称，收入则为 'income'
  note: string,         // 备注
  date: string,         // 日期 YYYY-MM-DD
  createdAt: string     // 创建时间 ISO格式
}
```

### Category（分类）
```
{
  id: string,
  name: string,
  color: string,        // hex色值
  icon: string,         // emoji图标
  isDefault: boolean    // 是否默认分类，默认分类不可删除
}
```

### Budget（预算）
```
{
  month: string,        // YYYY-MM
  amount: number,       // 预算金额
  alertEnabled: boolean // 是否开启提醒
}
```

### Settings（设置）
```
{
  theme: string,        // 'green' | 'blue' | 'pink' | 'purple' | 'white'
  currency: string      // 默认 'CNY'
}
```

## localStorage Key 设计
| Key | 内容 |
|-----|------|
| `transactions` | JSON数组，所有交易记录 |
| `categories` | JSON数组，所有分类 |
| `budget` | JSON对象，当前预算设置 |
| `settings` | JSON对象，用户设置 |

## 编码规范
- 使用 ES6+ 语法（let/const、箭头函数、模板字符串）
- 函数命名使用 camelCase
- 所有 DOM 操作集中在 ui.js
- 数据操作集中在 storage.js
- 不允许使用 innerHTML（防止XSS），使用 textContent 或 createElement
- 金额格式化使用 toLocaleString
