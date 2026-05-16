/* ===================================
   记账APP - 数据存储层
   所有 localStorage 读写操作集中在这里
   =================================== */

// ---- 默认支出分类 ----
var DEFAULT_CATEGORIES = [
  { id: 'cat_0', name: '日常',   color: '#4CAF50', icon: '🛒', isDefault: true },
  { id: 'cat_1', name: '社交',   color: '#2196F3', icon: '🎉', isDefault: true },
  { id: 'cat_2', name: '交通',   color: '#FF9800', icon: '🚌', isDefault: true },
  { id: 'cat_3', name: '餐饮',   color: '#F44336', icon: '🍔', isDefault: true },
  { id: 'cat_4', name: '网购',   color: '#9C27B0', icon: '📦', isDefault: true },
  { id: 'cat_5', name: '其他',   color: '#607D8B', icon: '💸', isDefault: true }
];

// ---- 通用工具 ----

/* 安全读取 localStorage */
function loadFromStorage(key, fallback) {
  try {
    var raw = localStorage.getItem('jizhang_' + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

/* 安全写入 localStorage */
function saveToStorage(key, value) {
  try {
    localStorage.setItem('jizhang_' + key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

// ---- 交易记录 ----

/* 获取所有交易记录（按日期降序排序） */
function getTransactions() {
  var list = loadFromStorage('transactions', []);
  list.sort(function (a, b) {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.createdAt.localeCompare(a.createdAt);
  });
  return list;
}

/* 保存一条交易记录 */
function saveTransaction(tx) {
  var list = loadFromStorage('transactions', []);
  list.push(tx);
  return saveToStorage('transactions', list);
}

/* 更新一条交易记录 */
function updateTransaction(id, updated) {
  var list = loadFromStorage('transactions', []);
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list[i] = Object.assign(list[i], updated);
      break;
    }
  }
  return saveToStorage('transactions', list);
}

/* 删除一条交易记录 */
function deleteTransaction(id) {
  var list = loadFromStorage('transactions', []);
  var filtered = list.filter(function (tx) { return tx.id !== id; });
  return saveToStorage('transactions', filtered);
}

/* 生成唯一ID */
function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

// ---- 分类管理 ----

/* 获取所有分类 */
function getCategories() {
  return loadFromStorage('categories', DEFAULT_CATEGORIES);
}

/* 添加自定义分类 */
function addCategory(name, color, icon) {
  var cats = getCategories();
  cats.push({
    id: 'cat_' + generateId(),
    name: name,
    color: color || '#607D8B',
    icon: icon || '🏷️',
    isDefault: false
  });
  return saveToStorage('categories', cats);
}

/* 删除分类 */
function removeCategory(id) {
  var cats = getCategories();
  var target = cats.find(function (c) { return c.id === id; });
  if (!target || target.isDefault) return false; // 默认分类不可删除
  var filtered = cats.filter(function (c) { return c.id !== id; });
  return saveToStorage('categories', filtered);
}

/* 根据名称查找分类 */
function findCategoryByName(name) {
  return getCategories().find(function (c) { return c.name === name; });
}

// ---- 关键词管理 ----

/* 获取所有关键词 */
function getKeywords() {
  return loadFromStorage('keywords', []);
}

/* 添加关键词 */
function addKeyword(keyword) {
  var list = getKeywords();
  if (list.indexOf(keyword) === -1) {
    list.push(keyword);
    return saveToStorage('keywords', list);
  }
  return false;
}

/* 删除关键词 */
function removeKeyword(keyword) {
  var list = getKeywords();
  var idx = list.indexOf(keyword);
  if (idx !== -1) {
    list.splice(idx, 1);
    return saveToStorage('keywords', list);
  }
  return false;
}

// ---- 预算 ----

/* 获取预算设置 */
function getBudget() {
  return loadFromStorage('budget', { amount: 0, alertEnabled: true });
}

/* 保存预算设置 */
function saveBudget(budget) {
  return saveToStorage('budget', budget);
}

// ---- 用户设置 ----

/* 获取用户设置 */
function getSettings() {
  return loadFromStorage('settings', { theme: 'green', currency: 'CNY' });
}

/* 保存用户设置 */
function saveSettings(settings) {
  return saveToStorage('settings', settings);
}

// ---- 初始化 ----

/* 首次运行时初始化默认数据 */
function initStorage() {
  if (!localStorage.getItem('jizhang_categories')) {
    saveToStorage('categories', DEFAULT_CATEGORIES);
  }
  if (!localStorage.getItem('jizhang_transactions')) {
    saveToStorage('transactions', []);
  }
  if (!localStorage.getItem('jizhang_budget')) {
    saveToStorage('budget', { amount: 0, alertEnabled: true });
  }
  if (!localStorage.getItem('jizhang_settings')) {
    saveToStorage('settings', { theme: 'green', currency: 'CNY' });
  }
  if (!localStorage.getItem('jizhang_keywords')) {
    saveToStorage('keywords', []);
  }
}
