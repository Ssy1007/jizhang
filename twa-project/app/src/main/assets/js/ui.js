/* ===================================
   记账APP - UI 渲染与交互
   所有 DOM 操作集中在这里
   =================================== */

/* ---- 全局状态 ---- */
var currentTxType = 'expense';        // 当前记一笔类型
var selectedCategory = null;          // 当前选中分类
var homePeriod = 'month';             // 首页时间维度
var statsPeriod = 'month';            // 统计页时间维度
var currentEditId = null;             // 正在编辑的记录ID（null=新增模式）
var expandedTxId = null;              // 当前展开详情的记录ID
var expandedCats = [];               // 已展开的一级分类列表
var expandedItems = [];              // 已展开的二级分类标识 "cat::item"

/* ---- 物品名称图标映射 ---- */
var ITEM_ICONS = {
  '外卖': '🛵', '咖啡': '☕', '奶茶': '🧋', '公交': '🚌', '地铁': '🚇',
  '打车': '🚗', '午餐': '🍱', '晚餐': '🍽', '早餐': '🥐', '零食': '🍿',
  '水果': '🍎', '衣服': '👕', '鞋子': '👟', '化妆品': '💄', '书': '📖',
  '游戏': '🎮', '电影': '🎬', '话费': '📱', '房租': '🏠', '水电': '💡',
  '买菜': '🥬', '药品': '💊', '宠物': '🐱', '健身': '🏃', '理发': '💇',
  '加油': '⛽', '快递': '📦', '保险': '🛡', '学习': '📚', '旅行': '✈'
};

/* 根据名称获取图标 */
function getItemIcon(name) {
  if (!name) return '🏷';
  return ITEM_ICONS[name] || '🏷';
}

/* ===================================
   首页渲染
   =================================== */

function renderHomePage() {
  renderHomeSummary();
  bindHomePeriodTabs();
  renderHomeCategoryBreakdown();
  renderHomeContent();
}

/* 首页主体内容 */
function renderHomeContent() {
  var allTx = getTransactions();
  var range = getPeriodRange(homePeriod, new Date());

  // 筛选支出
  var expenseList = allTx.filter(function (tx) {
    return tx.type === 'expense' && tx.date >= range.start && tx.date <= range.end;
  });

  var container = document.getElementById('home-transaction-list');

  if (expenseList.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">还没有记录，点击下方 + 开始记一笔吧</div></div>';
    return;
  }

  // 按一级分类汇总
  var cats = getCategories();
  var catMap = {};
  expenseList.forEach(function (tx) {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
  });

  var totalAll = 0;
  cats.forEach(function (cat) { totalAll += (catMap[cat.name] || 0); });

  var daysInPeriod = getPeriodDays(range);
  var html = '';

  cats.forEach(function (cat) {
    var amount = catMap[cat.name] || 0;
    if (amount === 0) return;
    var pct = Math.round(amount / totalAll * 100);
    var dailyAvg = (daysInPeriod > 0) ? formatMoney(amount / daysInPeriod) : formatMoney(amount);

    var isExpanded = (expandedCats.indexOf(cat.name) !== -1);
    html += '<div class="card cat-card" style="margin-bottom:8px;">' +
      '<div class="cat-header" data-cat="' + cat.name + '" style="cursor:pointer;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<span style="font-size:24px;">' + cat.icon + '</span>' +
            '<div>' +
              '<div style="font-size:15px;font-weight:600;">' + cat.name + '</div>' +
              '<div style="font-size:11px;color:var(--text-secondary);">日均 ¥' + dailyAvg + ' · ' + (isExpanded ? '▲ 收起' : '▼ 展开') + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:18px;font-weight:700;color:var(--expense);">¥' + formatMoney(amount) + '</div>' +
            '<div style="font-size:11px;color:var(--text-secondary);">' + pct + '%</div>' +
          '</div>' +
        '</div>' +
        '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + pct + '%;background:' + cat.color + ';"></div></div>' +
      '</div>';

    // 如果展开，显示二级分类
    if (isExpanded) {
      html += '<div class="cat-items" style="margin-top:8px;padding-left:8px;border-left:3px solid ' + cat.color + ';">';

      // 按名称分组
      var nameMap = {};
      var nameTxs = {};
      var noNameTotal = 0;
      expenseList.forEach(function (tx) {
        if (tx.category !== cat.name) return;
        if (tx.itemName) {
          nameMap[tx.itemName] = (nameMap[tx.itemName] || 0) + tx.amount;
          if (!nameTxs[tx.itemName]) nameTxs[tx.itemName] = [];
          nameTxs[tx.itemName].push(tx);
        } else {
          noNameTotal += tx.amount;
          if (!nameTxs['']) nameTxs[''] = [];
          nameTxs[''].push(tx);
        }
      });

      var names = Object.keys(nameMap).sort(function (a, b) { return nameMap[b] - nameMap[a]; });

      // 有名称的项目
      names.forEach(function (name) {
        var nAmount = nameMap[name];
        var nPct = Math.round(nAmount / amount * 100);
        var nDailyAvg = (daysInPeriod > 0) ? formatMoney(nAmount / daysInPeriod) : formatMoney(nAmount);
        var itemKey = cat.name + '::' + name;
        var itemExpanded = (expandedItems.indexOf(itemKey) !== -1);

        html += '<div class="item-block" style="margin-bottom:6px;background:var(--bg);border-radius:8px;padding:8px 10px;">' +
          '<div class="item-header" data-item="' + name + '" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:600;">' + getItemIcon(name) + ' ' + escapeHtml(name) + '</div>' +
              '<div style="font-size:11px;color:var(--text-secondary);">日均 ¥' + nDailyAvg + ' · ' + (itemExpanded ? '▲ 收起' : '▼ 展开') + '</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div style="font-size:15px;font-weight:600;color:var(--expense);">¥' + formatMoney(nAmount) + '</div>' +
              '<div style="font-size:11px;color:var(--text-secondary);">' + nPct + '%</div>' +
            '</div>' +
          '</div>' +
          '<div style="height:4px;background:var(--divider);border-radius:2px;margin-top:4px;overflow:hidden;">' +
            '<div style="height:100%;width:' + nPct + '%;background:' + cat.color + ';border-radius:2px;"></div>' +
          '</div>';

        // 如果展开，显示具体交易（使用完整详情模板）
        if (itemExpanded) {
          var txs = nameTxs[name] || [];
          txs.sort(function (a, b) { return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt); });
          txs.forEach(function (tx) {
            html += buildTransactionItemHtml(tx);
          });
        }

        html += '</div>';
      });

      // 无名称的
      if (noNameTotal > 0) {
        var nPct = Math.round(noNameTotal / amount * 100);
        var nDailyAvg = (daysInPeriod > 0) ? formatMoney(noNameTotal / daysInPeriod) : formatMoney(noNameTotal);
        var otherKey = cat.name + '::';
        var itemExpanded = (expandedItems.indexOf(otherKey) !== -1);

        html += '<div class="item-block" style="margin-bottom:6px;background:var(--bg);border-radius:8px;padding:8px 10px;">' +
          '<div class="item-header" data-item="" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;">' +
            '<div>' +
              '<div style="font-size:14px;font-weight:600;">🏷 其他</div>' +
              '<div style="font-size:11px;color:var(--text-secondary);">日均 ¥' + nDailyAvg + ' · ' + (itemExpanded ? '▲ 收起' : '▼ 展开') + '</div>' +
            '</div>' +
            '<div style="text-align:right;">' +
              '<div style="font-size:15px;font-weight:600;color:var(--expense);">¥' + formatMoney(noNameTotal) + '</div>' +
              '<div style="font-size:11px;color:var(--text-secondary);">' + nPct + '%</div>' +
            '</div>' +
          '</div>';

        if (itemExpanded) {
          var txs2 = nameTxs[''] || [];
          txs2.sort(function (a, b) { return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt); });
          txs2.forEach(function (tx) {
            html += buildTransactionItemHtml(tx);
          });
        }

        html += '</div>';
      }

      html += '</div>';
    }

    html += '</div>';
  });

  container.innerHTML = html;

  // 绑定分类头点击
  container.querySelectorAll('.cat-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var cat = header.getAttribute('data-cat');
      var idx = expandedCats.indexOf(cat);
      if (idx !== -1) {
        expandedCats.splice(idx, 1);
        // 同时移除该分类下所有展开的二级
        expandedItems = expandedItems.filter(function (key) { return key.indexOf(cat + '::') !== 0; });
      } else {
        expandedCats.push(cat);
      }
      expandedTxId = null;
      renderHomeContent();
    });
  });

  // 绑定二级分类头点击
  container.querySelectorAll('.item-header').forEach(function (header) {
    header.addEventListener('click', function (e) {
      e.stopPropagation();
      var item = header.getAttribute('data-item');
      var parentCat = header.closest('.cat-card').querySelector('.cat-header').getAttribute('data-cat');
      var key = parentCat + '::' + (item || '');
      var idx = expandedItems.indexOf(key);
      if (idx !== -1) {
        expandedItems.splice(idx, 1);
      } else {
        expandedItems.push(key);
      }
      expandedTxId = null;
      renderHomeContent();
    });
  });

  // 绑定交易记录的点击和按钮（编辑/删除/数量加减）
  bindTransactionClicks(container);

  // 展开当前已展开的记录
  if (expandedTxId) {
    showTxDetail(expandedTxId);
  }
}

/* 获取时间段天数 */
function getPeriodDays(range) {
  var d1 = new Date(range.start + 'T00:00:00');
  var d2 = new Date(range.end + 'T00:00:00');
  var days = Math.ceil((d2 - d1) / 86400000) + 1;
  return Math.max(1, days);
}

/* 首页汇总卡片 */
function renderHomeSummary() {
  var allTx = getTransactions();
  var now = new Date();

  // 根据时间维度计算筛选范围
  var range = getPeriodRange(homePeriod, now);

  // 筛选当前时间段的记录
  var periodTx = allTx.filter(function (tx) {
    return tx.date >= range.start && tx.date <= range.end;
  });

  // 计算总支出和总收入
  var totalExpense = 0;
  var totalIncome = 0;
  periodTx.forEach(function (tx) {
    if (tx.type === 'expense') totalExpense += tx.amount;
    else totalIncome += tx.amount;
  });

  document.getElementById('summary-expense').textContent = '¥' + formatMoney(totalExpense);
  document.getElementById('summary-income').textContent = '¥' + formatMoney(totalIncome);
  document.getElementById('summary-balance').textContent = '¥' + formatMoney(totalIncome - totalExpense);

  // 更新月份标签
  var labels = { day: '今日', week: '本周', month: '本月', year: '本年' };
  document.getElementById('home-month-label').textContent = labels[homePeriod] || '本月';

  // 预算进度（仅月视图显示当月预算）
  if (homePeriod === 'month') {
    var budget = getBudget();
    if (budget.amount > 0) {
      var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      var monthTx = allTx.filter(function (tx) {
        return tx.type === 'expense' && tx.date.startsWith(currentMonth);
      });
      var monthExpense = 0;
      monthTx.forEach(function (tx) { monthExpense += tx.amount; });

      var percent = Math.min(100, Math.round((monthExpense / budget.amount) * 100));
      document.getElementById('budget-bar-wrap').style.display = 'block';
      document.getElementById('budget-bar-fill').style.width = percent + '%';
      document.getElementById('budget-text').textContent =
        '预算 ¥' + formatMoney(monthExpense) + ' / ¥' + formatMoney(budget.amount) + ' (' + percent + '%)';

      if (monthExpense > budget.amount && budget.alertEnabled) {
        document.getElementById('budget-bar-fill').style.background = '#FFCDD2';
      } else {
        document.getElementById('budget-bar-fill').style.background = '#FFFFFF';
      }
      return;
    }
  }
  document.getElementById('budget-bar-wrap').style.display = 'none';
  document.getElementById('budget-text').textContent = '';
}

/* 首页分类占比 - 圆形扇形图 */
function renderHomeCategoryBreakdown() {
  var container = document.getElementById('category-bars');
  var emptyEl = document.getElementById('category-empty');
  var allTx = getTransactions();
  var range = getPeriodRange(homePeriod, new Date());

  var expenseList = allTx.filter(function (tx) {
    return tx.type === 'expense' && tx.date >= range.start && tx.date <= range.end;
  });

  if (expenseList.length === 0) {
    container.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  var catMap = {};
  var total = 0;
  expenseList.forEach(function (tx) {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
    total += tx.amount;
  });

  var cats = getCategories();
  // 构建 conic-gradient
  var gradientParts = [];
  var legendHtml = '';
  var currentDeg = 0;
  var activeCats = cats.filter(function (c) { return (catMap[c.name] || 0) > 0; });

  activeCats.forEach(function (cat) {
    var amount = catMap[cat.name] || 0;
    var pct = Math.round((amount / total) * 100);
    var deg = (amount / total) * 360;
    var startDeg = Math.round(currentDeg);
    currentDeg += deg;
    var endDeg = Math.round(currentDeg);
    gradientParts.push(cat.color + ' ' + startDeg + 'deg ' + endDeg + 'deg');

    legendHtml += '<div style="display:flex;align-items:center;gap:6px;font-size:12px;">' +
      '<div style="width:10px;height:10px;border-radius:50%;background:' + cat.color + ';flex-shrink:0;"></div>' +
      '<span style="flex:1;">' + cat.icon + ' ' + cat.name + '</span>' +
      '<span style="font-weight:600;">' + pct + '%</span>' +
      '</div>';
  });

  // 处理剩余
  if (currentDeg < 360) {
    gradientParts.push('var(--bg) ' + Math.round(currentDeg) + 'deg 360deg');
  }

  var conicGradient = gradientParts.join(', ');
  container.innerHTML =
    '<div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;">' +
      '<div style="width:130px;height:130px;border-radius:50%;background:conic-gradient(' + conicGradient + ');flex-shrink:0;"></div>' +
      '<div style="display:flex;flex-direction:column;gap:4px;">' +
        '<div style="font-size:13px;font-weight:600;margin-bottom:2px;">总支出 ¥' + formatMoney(total) + '</div>' +
        legendHtml +
      '</div>' +
    '</div>';
}

/* 首页交易列表 */
function renderHomeTransactionList() {
  var container = document.getElementById('home-transaction-list');
  var allTx = getTransactions();

  if (allTx.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">还没有记录，点击下方 + 开始记一笔吧</div></div>';
    return;
  }

  // 只显示最近 30 条
  var recent = allTx.slice(0, 30);
  var html = '';

  // 按日期分组
  var currentDate = '';
  recent.forEach(function (tx) {
    if (tx.date !== currentDate) {
      currentDate = tx.date;
      html += '<div class="date-group-title">' + formatDateLabel(tx.date) + '</div>';
    }
    html += buildTransactionItemHtml(tx);
  });

  container.innerHTML = html;

  // 恢复展开状态
  if (expandedTxId) {
    showTxDetail(expandedTxId);
  }

  // 绑定点击事件
  bindTransactionClicks(container);
}

/* 首页时间维度切换 */

/* 构建单条交易记录的HTML */
function buildTransactionItemHtml(tx) {
  var cat = findCategoryByName(tx.category);
  var icon = (tx.itemName ? getItemIcon(tx.itemName) : (cat ? cat.icon : '💰'));
  var amountClass = tx.type === 'expense' ? 'expense' : 'income';
  var prefix = tx.type === 'expense' ? '-' : '+';
  var isExpanded = (expandedTxId === tx.id);

  var html = '<div class="transaction-item' + (isExpanded ? ' expanded' : '') + '" data-id="' + tx.id + '">' +
    '<div class="tx-icon">' + icon + '</div>' +
    '<div class="tx-info">' +
      '<div class="tx-category">' + (tx.itemName ? getItemIcon(tx.itemName) + ' ' + escapeHtml(tx.itemName) : (tx.category || '收入')) + '</div>' +
      (tx.itemName ? '<div class="tx-note">' + (tx.category || '') + (tx.note ? ' · ' + escapeHtml(tx.note) : '') + '</div>' : (tx.note ? '<div class="tx-note">' + escapeHtml(tx.note) + '</div>' : '')) +
    '</div>' +
    '<div class="tx-amount ' + amountClass + '">' + prefix + '¥' + formatMoney(tx.amount) + '</div>' +
  '</div>' +
  '<div class="tx-detail' + (isExpanded ? ' show' : '') + '" data-id="' + tx.id + '">' +
    '<div class="tx-detail-row"><span>日期</span><span>' + tx.date + '</span></div>' +
    '<div class="tx-detail-row"><span>类型</span><span>' + (tx.type === 'expense' ? '支出' : '收入') + '</span></div>' +
    '<div class="tx-detail-row"><span>价格</span><span>¥' + formatMoney(tx.amount) + '</span></div>' +
    (tx.note ? '<div class="tx-detail-row"><span>备注</span><span>' + escapeHtml(tx.note) + '</span></div>' : '');

  // 数量信息
  if (tx.quantity && tx.quantity > 0) {
    var remain = (tx.remaining != null) ? tx.remaining : tx.quantity;
    var days = daysSince(tx.date);
    var dailyAvg;
    if (days <= 0) {
      dailyAvg = '¥' + formatMoney(tx.amount);
    } else {
      dailyAvg = '¥' + formatMoney(tx.amount / days) + '/天';
    }

    html += '<div class="tx-detail-row"><span>总数量</span><span>' + tx.quantity + '</span></div>' +
      '<div class="tx-detail-row"><span>剩余数量</span><span style="font-weight:600;font-size:15px;">' + remain + '</span></div>' +
      '<div class="tx-detail-row"><span>日均成本</span><span>' + dailyAvg + '（' + (days > 0 ? days : 0) + '天）</span></div>' +
      '<div class="tx-detail-row"><span>使用</span><span class="qty-arrows">' +
        '<button class="qty-arrow-btn qty-down" data-action="qty-down" data-id="' + tx.id + '">−</button>' +
        '<span class="qty-remain">' + remain + '</span>' +
        '<button class="qty-arrow-btn qty-up" data-action="qty-up" data-id="' + tx.id + '">+</button>' +
      '</span></div>';
  }

  html += '<div class="tx-actions">' +
      '<button class="tx-action-btn edit-btn" data-action="edit" data-id="' + tx.id + '">✏ 编辑</button>' +
      '<button class="tx-action-btn delete-btn" data-action="delete" data-id="' + tx.id + '">🗑 删除</button>' +
    '</div>' +
  '</div>';

  return html;
}

/* 计算从某日期到今天的天数 */
function daysSince(dateStr) {
  var then = new Date(dateStr + 'T00:00:00');
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((now - then) / 86400000);
}

/* 绑定交易记录点击事件 */
function bindTransactionClicks(container) {
  // 点击交易项展开/收起详情
  container.querySelectorAll('.transaction-item').forEach(function (item) {
    item.addEventListener('click', function (e) {
      // 不拦截按钮点击
      if (e.target.closest('button')) return;
      var txId = item.getAttribute('data-id');
      toggleTxDetail(txId);
    });
  });

  // 编辑按钮
  container.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var txId = btn.getAttribute('data-id');
      openEditSheet(txId);
    });
  });

  // 删除按钮
  container.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var txId = btn.getAttribute('data-id');
      deleteTxHandler(txId);
    });
  });

  // 数量减少按钮
  container.querySelectorAll('[data-action="qty-down"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var txId = btn.getAttribute('data-id');
      changeQuantity(txId, -1);
    });
  });

  // 数量增加按钮
  container.querySelectorAll('[data-action="qty-up"]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var txId = btn.getAttribute('data-id');
      changeQuantity(txId, 1);
    });
  });
}

/* 切换详情展开/收起 */
function toggleTxDetail(txId) {
  if (expandedTxId === txId) {
    hideTxDetail(txId);
    expandedTxId = null;
  } else {
    if (expandedTxId) hideTxDetail(expandedTxId);
    showTxDetail(txId);
    expandedTxId = txId;
  }
}

/* 展开详情 */
function showTxDetail(txId) {
  var activePage = document.querySelector('.page.active');
  if (!activePage) return;
  var item = activePage.querySelector('.transaction-item[data-id="' + txId + '"]');
  var detail = activePage.querySelector('.tx-detail[data-id="' + txId + '"]');
  if (item) item.classList.add('expanded');
  if (detail) detail.classList.add('show');
}

/* 收起详情 */
function hideTxDetail(txId) {
  var activePage = document.querySelector('.page.active');
  if (!activePage) return;
  var item = activePage.querySelector('.transaction-item[data-id="' + txId + '"]');
  var detail = activePage.querySelector('.tx-detail[data-id="' + txId + '"]');
  if (item) item.classList.remove('expanded');
  if (detail) detail.classList.remove('show');
}

/* 删除交易记录 */
function deleteTxHandler(txId) {
  showConfirm('删除记录', '确定要删除这条记录吗？此操作不可恢复。', function () {
    deleteTransaction(txId);
    if (expandedTxId === txId) expandedTxId = null;
    renderHomePage();
    if (document.getElementById('page-search').classList.contains('active')) {
      performSearch();
    }
  });
}

/* 变更数量 */
function changeQuantity(txId, delta) {
  var allTx = getTransactions();
  var tx = null;
  for (var i = 0; i < allTx.length; i++) {
    if (allTx[i].id === txId) { tx = allTx[i]; break; }
  }
  if (!tx || !tx.quantity) return;

  var newRemain = (tx.remaining !== undefined ? tx.remaining : tx.quantity) + delta;
  if (newRemain < 0) newRemain = 0;
  if (newRemain > tx.quantity) newRemain = tx.quantity;

  updateTransaction(txId, { remaining: newRemain });
  renderHomePage();
  if (document.getElementById('page-search').classList.contains('active')) {
    performSearch();
  }
  if (document.getElementById('page-stats').classList.contains('active')) {
    renderStatsPage();
  }

  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}
function bindHomePeriodTabs() {
  var tabs = document.querySelectorAll('#home-period-tabs .period-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      homePeriod = tab.getAttribute('data-period');
      expandedTxId = null;
      expandedCats = [];
      expandedItems = [];
      renderHomePage();
    });
  });
}

/* ===================================
   统计页渲染
   =================================== */

function renderStatsPage() {
  bindStatsPeriodTabs();
  bindStatsTypeTabs();
  renderStatsData();
}

function bindStatsPeriodTabs() {
  var tabs = document.querySelectorAll('#stats-period-tabs .period-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      statsPeriod = tab.getAttribute('data-period');
      renderStatsData();
    });
  });
}

var statsCurrentType = 'price';

function bindStatsTypeTabs() {
  var tabs = document.querySelectorAll('#stats-type-tabs .period-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      statsCurrentType = tab.getAttribute('data-stat-type');
      var priceCard = document.getElementById('stats-price-card');
      var qtyCard = document.getElementById('stats-quantity-card');
      if (statsCurrentType === 'price') {
        priceCard.style.display = 'block';
        qtyCard.style.display = 'none';
      } else {
        priceCard.style.display = 'none';
        qtyCard.style.display = 'block';
      }
      renderStatsData();
    });
  });
}

function renderStatsData() {
  var allTx = getTransactions();
  var range = getPeriodRange(statsPeriod, new Date());

  var periodTx = allTx.filter(function (tx) {
    return tx.date >= range.start && tx.date <= range.end;
  });

  var totalExpense = 0;
  var totalIncome = 0;

  periodTx.forEach(function (tx) {
    if (tx.type === 'expense') totalExpense += tx.amount;
    else totalIncome += tx.amount;
  });

  document.getElementById('stats-total-expense').textContent = '¥' + formatMoney(totalExpense);
  document.getElementById('stats-total-income').textContent = '¥' + formatMoney(totalIncome);
  document.getElementById('stats-balance').textContent = '¥' + formatMoney(totalIncome - totalExpense);

  // 价格归类
  renderPriceRanking(periodTx);
  // 数量归类
  renderQuantityRanking(periodTx);
}

function renderPriceRanking(periodTx) {
  var catMap = {};
  var listMap = {};
  periodTx.forEach(function (tx) {
    if (tx.type === 'expense') {
      catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
      if (!listMap[tx.category]) listMap[tx.category] = [];
      listMap[tx.category].push(tx);
    }
  });

  var ranking = document.getElementById('stats-category-ranking');
  var emptyEl = document.getElementById('stats-empty');
  var cats = getCategories();

  var sorted = cats.map(function (cat) {
    return { name: cat.name, icon: cat.icon, color: cat.color, amount: catMap[cat.name] || 0, txs: listMap[cat.name] || [] };
  }).filter(function (item) { return item.amount > 0; })
    .sort(function (a, b) { return b.amount - a.amount; });

  if (sorted.length === 0) {
    ranking.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  var totalAmount = sorted.reduce(function (s, item) { return s + item.amount; }, 0);
  var maxAmount = sorted[0].amount;
  var html = '';
  sorted.forEach(function (item, index) {
    var percent = Math.round((item.amount / totalAmount) * 100);
    var barPercent = Math.round((item.amount / maxAmount) * 100);
    html += '<div class="category-bar-item stat-item-clickable" data-cat="' + item.name + '">' +
      '<span style="font-size:14px;font-weight:600;color:var(--text-secondary);width:20px;">' + (index + 1) + '</span>' +
      '<div class="category-bar-color" style="background:' + item.color + ';"></div>' +
      '<div class="category-bar-info">' +
        '<div class="category-bar-name"><span>' + item.icon + ' ' + item.name + '</span><span>¥' + formatMoney(item.amount) + ' <span style="font-size:11px;color:var(--text-secondary);">' + percent + '%</span></span></div>' +
        '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + barPercent + '%;background:' + item.color + ';"></div></div>' +
      '</div>' +
    '</div>';
  });
  ranking.innerHTML = html;

  // 绑定点击查看详情
  ranking.querySelectorAll('.stat-item-clickable').forEach(function (el) {
    el.addEventListener('click', function () {
      var catName = el.getAttribute('data-cat');
      openStatsDetail(catName);
    });
  });
}

function renderQuantityRanking(periodTx) {
  var qtyMap = {};
  var listMap = {};
  periodTx.forEach(function (tx) {
    if (tx.type === 'expense' && tx.quantity && tx.quantity > 0) {
      var remain = (tx.remaining !== undefined) ? tx.remaining : tx.quantity;
      qtyMap[tx.category] = (qtyMap[tx.category] || 0) + remain;
      if (!listMap[tx.category]) listMap[tx.category] = [];
      listMap[tx.category].push(tx);
    }
  });

  var ranking = document.getElementById('stats-quantity-ranking');
  var emptyEl = document.getElementById('stats-qty-empty');
  var cats = getCategories();

  var sorted = cats.map(function (cat) {
    return { name: cat.name, icon: cat.icon, color: cat.color, totalQty: qtyMap[cat.name] || 0, txs: listMap[cat.name] || [] };
  }).filter(function (item) { return item.totalQty > 0; })
    .sort(function (a, b) { return b.totalQty - a.totalQty; });

  if (sorted.length === 0) {
    ranking.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  var maxQty = sorted[0].totalQty;
  var html = '';
  sorted.forEach(function (item, index) {
    var barPercent = Math.round((item.totalQty / maxQty) * 100);
    html += '<div class="category-bar-item stat-item-clickable" data-cat="' + item.name + '">' +
      '<span style="font-size:14px;font-weight:600;color:var(--text-secondary);width:20px;">' + (index + 1) + '</span>' +
      '<div class="category-bar-color" style="background:' + item.color + ';"></div>' +
      '<div class="category-bar-info">' +
        '<div class="category-bar-name"><span>' + item.icon + ' ' + item.name + '</span><span>剩余 ' + item.totalQty + ' 件</span></div>' +
        '<div class="category-bar-track"><div class="category-bar-fill" style="width:' + barPercent + '%;background:' + item.color + ';"></div></div>' +
      '</div>' +
    '</div>';
  });
  ranking.innerHTML = html;

  ranking.querySelectorAll('.stat-item-clickable').forEach(function (el) {
    el.addEventListener('click', function () {
      var catName = el.getAttribute('data-cat');
      openStatsDetail(catName);
    });
  });
}

/* 打开统计详情 */
function openStatsDetail(catName) {
  var allTx = getTransactions();
  var range = getPeriodRange(statsPeriod, new Date());
  var txs = allTx.filter(function (tx) {
    return tx.category === catName && tx.date >= range.start && tx.date <= range.end;
  });

  document.getElementById('stats-detail-title').textContent = catName + ' - 明细';
  var list = document.getElementById('stats-detail-list');
  if (txs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-text">暂无记录</div></div>';
  } else {
    var html = '';
    txs.forEach(function (tx) {
      var remain = (tx.quantity) ? ((tx.remaining !== undefined) ? tx.remaining : tx.quantity) : null;
      var icon = findCategoryByName(tx.category);
      html += '<div class="transaction-item" style="cursor:default;">' +
        '<div class="tx-icon">' + (tx.itemName ? getItemIcon(tx.itemName) : (icon ? icon.icon : '💰')) + '</div>' +
        '<div class="tx-info">' +
          '<div class="tx-category">' + (tx.itemName ? getItemIcon(tx.itemName) + ' ' + escapeHtml(tx.itemName) : (tx.note || tx.category)) + '</div>' +
          '<div style="font-size:12px;color:var(--text-secondary);">' + tx.category + ' · ' + tx.date + (tx.note ? ' · ' + escapeHtml(tx.note) : '') + '</div>' +
        '</div>' +
        '<div class="tx-amount expense">-¥' + formatMoney(tx.amount) + '</div>' +
      '</div>';
      if (remain !== null) {
        html += '<div style="font-size:13px;color:var(--text-secondary);padding:0 0 4px 52px;">剩余数量：' + remain + ' / 总数：' + tx.quantity + '</div>';
      }
    });
    list.innerHTML = html;
  }

  document.getElementById('stats-detail-overlay').classList.add('show');
}

/* ===================================
   搜索页渲染
   =================================== */

function renderSearchPage() {
  renderSearchFilterTags();
  bindSearchEvents();
}

/* 渲染筛选标签 */
function renderSearchFilterTags() {
  var container = document.getElementById('search-filter-tags');
  var cats = getCategories();
  var html = '<div class="filter-tag active" data-category="all">全部</div>';
  cats.forEach(function (cat) {
    html += '<div class="filter-tag" data-category="' + cat.name + '">' + cat.icon + ' ' + cat.name + '</div>';
  });

  // 添加常用的二级名称作为筛选
  var allTx = getTransactions();
  var nameCount = {};
  allTx.forEach(function (tx) {
    if (tx.itemName) {
      nameCount[tx.itemName] = (nameCount[tx.itemName] || 0) + 1;
    }
  });
  var topNames = Object.keys(nameCount).sort(function (a, b) { return nameCount[b] - nameCount[a]; }).slice(0, 8);
  topNames.forEach(function (name) {
    html += '<div class="filter-tag" data-item="' + name + '">' + getItemIcon(name) + ' ' + name + '</div>';
  });

  container.innerHTML = html;

  // 绑定筛选点击
  container.querySelectorAll('.filter-tag').forEach(function (tag) {
    tag.addEventListener('click', function () {
      container.querySelectorAll('.filter-tag').forEach(function (t) { t.classList.remove('active'); });
      tag.classList.add('active');
      performSearch();
    });
  });
}

/* 绑定搜索事件 */
function bindSearchEvents() {
  var input = document.getElementById('search-input');
  input.addEventListener('input', function () {
    performSearch();
  });
}

/* 执行搜索 */
function performSearch() {
  var keyword = document.getElementById('search-input').value.trim().toLowerCase();
  var activeTag = document.querySelector('#search-filter-tags .filter-tag.active');
  var categoryFilter = activeTag ? activeTag.getAttribute('data-category') : 'all';
  var itemFilter = activeTag ? activeTag.getAttribute('data-item') : null;

  var results = document.getElementById('search-results');
  var emptyEl = document.getElementById('search-empty');

  var allTx = getTransactions();

  // 筛选
  var filtered = allTx.filter(function (tx) {
    // 分类筛选
    if (categoryFilter && categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
    // 二级名称筛选
    if (itemFilter && tx.itemName !== itemFilter) return false;
    // 关键字筛选
    if (!keyword) return true;
    return (tx.note && tx.note.toLowerCase().indexOf(keyword) !== -1) ||
           (tx.category && tx.category.toLowerCase().indexOf(keyword) !== -1) ||
           (tx.itemName && tx.itemName.toLowerCase().indexOf(keyword) !== -1) ||
           String(tx.amount).indexOf(keyword) !== -1;
  });

  if (filtered.length === 0) {
    results.innerHTML = '';
    emptyEl.style.display = 'block';
    if (keyword) {
      emptyEl.querySelector('.empty-text').textContent = '没有找到匹配的记录';
    } else {
      emptyEl.querySelector('.empty-text').textContent = '输入关键字搜索历史记录';
    }
    return;
  }
  emptyEl.style.display = 'none';

  var html = '';
  var currentDate = '';
  filtered.forEach(function (tx) {
    if (tx.date !== currentDate) {
      currentDate = tx.date;
      html += '<div class="date-group-title">' + formatDateLabel(tx.date) + '</div>';
    }
    html += buildTransactionItemHtml(tx);
  });
  results.innerHTML = html;

  // 恢复展开状态
  if (expandedTxId) {
    var stillExists = filtered.some(function (tx) { return tx.id === expandedTxId; });
    if (stillExists) showTxDetail(expandedTxId);
    else expandedTxId = null;
  }

  bindTransactionClicks(results);
}

/* ===================================
   设置页渲染
   =================================== */

function renderSettingsPage() {
  renderThemePicker();
  renderBudgetDisplay();
  bindSettingsEvents();
}

/* 主题选择器 */
function renderThemePicker() {
  var settings = getSettings();
  var dots = document.querySelectorAll('#theme-picker .theme-color-dot');
  dots.forEach(function (dot) {
    dot.classList.remove('selected');
    if (dot.getAttribute('data-theme') === settings.theme) {
      dot.classList.add('selected');
    }
  });
}

/* 预算显示 */
function renderBudgetDisplay() {
  var budget = getBudget();
  var display = document.getElementById('budget-display');
  if (budget.amount > 0) {
    display.textContent = '¥' + formatMoney(budget.amount) + ' ▶';
  } else {
    display.textContent = '未设置 ▶';
  }
}

/* 绑定设置页事件 */
function bindSettingsEvents() {
  // 主题切换
  document.querySelectorAll('#theme-picker .theme-color-dot').forEach(function (dot) {
    dot.addEventListener('click', function () {
      var theme = dot.getAttribute('data-theme');
      applyTheme(theme);
      var settings = getSettings();
      settings.theme = theme;
      saveSettings(settings);
      renderThemePicker();
    });
  });

  // 预算设置
  document.getElementById('settings-budget').addEventListener('click', openBudgetSheet);

  // 分类管理
  document.getElementById('settings-category').addEventListener('click', openCategorySheet);

  // 关键词管理
  document.getElementById('settings-keywords').addEventListener('click', openKeywordsSheet);

  // 数据管理
  document.getElementById('settings-data').addEventListener('click', openDataSheet);
}

/* ===================================
   记一笔弹窗
   =================================== */

function openAddSheet() {
  currentEditId = null;
  var overlay = document.getElementById('add-sheet-overlay');
  overlay.classList.add('show');

  // 更新弹窗标题
  document.querySelector('#add-sheet .sheet-title').textContent = '记一笔';

  // 隐藏编辑模式的删除按钮
  var deleteBtn = document.getElementById('sheet-delete-btn');
  if (deleteBtn) deleteBtn.style.display = 'none';

  // 设置默认日期为今天
  document.getElementById('input-date').value = getTodayStr();

  // 清空输入
  document.getElementById('input-amount').value = '';
  document.getElementById('input-note').value = '';
  document.getElementById('input-quantity').value = '';
  document.getElementById('input-item-name').value = '';

  // 默认支出
  currentTxType = 'expense';
  selectedCategory = null;
  updateTypeToggleUI();
  renderCategoryChips();

  // 金额输入聚焦
  setTimeout(function () {
    document.getElementById('input-amount').focus();
  }, 300);
}

/* 打开编辑弹窗 */
function openEditSheet(txId) {
  var allTx = getTransactions();
  var tx = null;
  for (var i = 0; i < allTx.length; i++) {
    if (allTx[i].id === txId) { tx = allTx[i]; break; }
  }
  if (!tx) return;

  currentEditId = txId;
  var overlay = document.getElementById('add-sheet-overlay');
  overlay.classList.add('show');

  document.querySelector('#add-sheet .sheet-title').textContent = '编辑记录';

  var deleteBtn = document.getElementById('sheet-delete-btn');
  if (deleteBtn) deleteBtn.style.display = 'block';

  document.getElementById('input-amount').value = tx.amount;
  document.getElementById('input-date').value = tx.date;
  document.getElementById('input-note').value = tx.note;
  document.getElementById('input-quantity').value = tx.quantity || '';
  document.getElementById('input-item-name').value = tx.itemName || '';

  currentTxType = tx.type;
  updateTypeToggleUI();

  if (tx.type === 'expense') {
    selectedCategory = findCategoryByName(tx.category);
    renderCategoryChips();
  }

  setTimeout(function () {
    document.getElementById('input-amount').focus();
  }, 300);
}

function closeAddSheet() {
  document.getElementById('add-sheet-overlay').classList.remove('show');
  currentEditId = null;
  selectedCategory = null;
}

/* 更新类型切换按钮 */
function updateTypeToggleUI() {
  var expenseBtn = document.querySelector('#type-toggle [data-type="expense"]');
  var incomeBtn = document.querySelector('#type-toggle [data-type="income"]');
  expenseBtn.classList.remove('active', 'expense-active');
  incomeBtn.classList.remove('active', 'income-active');

  if (currentTxType === 'expense') {
    expenseBtn.classList.add('active', 'expense-active');
    document.getElementById('category-select-group').style.display = 'block';
    document.getElementById('item-name-group').style.display = 'block';
    document.getElementById('quantity-row').style.display = 'inline';
  } else {
    incomeBtn.classList.add('active', 'income-active');
    document.getElementById('category-select-group').style.display = 'none';
    document.getElementById('item-name-group').style.display = 'none';
    document.getElementById('quantity-row').style.display = 'none';
  }
}

/* 渲染分类选择 */
function renderCategoryChips() {
  var container = document.getElementById('category-scroll');
  var cats = getCategories();
  var html = '';
  cats.forEach(function (cat) {
    var selectedClass = '';
    if (selectedCategory && selectedCategory.name === cat.name) {
      selectedClass = ' selected';
    }
    html += '<div class="category-chip' + selectedClass + '" data-category="' + cat.name + '">' +
      '<span class="chip-icon">' + cat.icon + '</span>' +
      '<span class="chip-name">' + cat.name + '</span>' +
    '</div>';
  });
  container.innerHTML = html;

  // 默认选中第一个
  if (!selectedCategory && cats.length > 0) {
    selectedCategory = cats[0];
    container.querySelector('.category-chip').classList.add('selected');
  }

  // 绑定点击
  container.querySelectorAll('.category-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      container.querySelectorAll('.category-chip').forEach(function (c) { c.classList.remove('selected'); });
      chip.classList.add('selected');
      var name = chip.getAttribute('data-category');
      selectedCategory = findCategoryByName(name);
    });
  });
}

/* 绑定记一笔弹窗事件 */
function bindSheetEvents() {
  // 关闭按钮
  document.getElementById('sheet-close').addEventListener('click', closeAddSheet);
  // 点击遮罩关闭
  document.getElementById('add-sheet-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeAddSheet();
  });

  // 类型切换
  document.querySelectorAll('#type-toggle .type-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentTxType = btn.getAttribute('data-type');
      updateTypeToggleUI();
      if (currentTxType === 'expense') {
        renderCategoryChips();
      }
    });
  });

  // 保存按钮
  document.getElementById('btn-save').addEventListener('click', saveTransactionHandler);

  // 编辑模式删除按钮
  document.getElementById('sheet-delete-btn').addEventListener('click', function () {
    if (!currentEditId) return;
    deleteTxHandler(currentEditId);
    closeAddSheet();
  });

  // 预算弹窗
  document.getElementById('budget-sheet-close').addEventListener('click', closeBudgetSheet);
  document.getElementById('budget-sheet-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeBudgetSheet();
  });
  document.getElementById('btn-budget-save').addEventListener('click', saveBudgetHandler);

  // 分类弹窗
  document.getElementById('category-sheet-close').addEventListener('click', closeCategorySheet);
  document.getElementById('category-sheet-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeCategorySheet();
  });
  document.getElementById('btn-add-category').addEventListener('click', addCategoryHandler);

  // 数据弹窗
  document.getElementById('data-sheet-close').addEventListener('click', closeDataSheet);
  document.getElementById('data-sheet-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeDataSheet();
  });
  document.getElementById('btn-clear-data').addEventListener('click', function () {
    showConfirm('清除全部数据', '所有记账记录、分类、关键词和设置将被删除，此操作不可恢复。确定继续吗？', function () {
      localStorage.clear();
      initStorage();
      closeDataSheet();
      switchPage('home');
    });
  });

  // 关键词弹窗
  document.getElementById('keywords-sheet-close').addEventListener('click', closeKeywordsSheet);
  document.getElementById('keywords-sheet-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeKeywordsSheet();
  });
  document.getElementById('btn-add-keyword').addEventListener('click', addKeywordHandler);

  // 确认弹窗
  document.getElementById('confirm-cancel').addEventListener('click', closeConfirm);
  document.getElementById('confirm-overlay').addEventListener('click', function (e) {
    if (e.target === this) closeConfirm();
  });

  // 增强提醒弹窗
  document.getElementById('alert-cancel').addEventListener('click', function () {
    document.getElementById('alert-overlay').classList.remove('show');
  });
  document.getElementById('alert-overlay').addEventListener('click', function (e) {
    if (e.target === this) { document.getElementById('alert-overlay').classList.remove('show'); }
  });

  // 关键词第二弹
  document.getElementById('keyword2-overlay').addEventListener('click', function (e) {
    if (e.target === this) { document.getElementById('keyword2-overlay').classList.remove('show'); keywordConfirmData = null; }
  });

  // 统计详情弹窗
  document.getElementById('stats-detail-close').addEventListener('click', function () {
    document.getElementById('stats-detail-overlay').classList.remove('show');
  });
  document.getElementById('stats-detail-overlay').addEventListener('click', function (e) {
    if (e.target === this) { document.getElementById('stats-detail-overlay').classList.remove('show'); }
  });
}

/* 保存交易记录（新增或更新） */
function saveTransactionHandler() {
  var amountStr = document.getElementById('input-amount').value.trim();
  var date = document.getElementById('input-date').value;
  var note = document.getElementById('input-note').value.trim();
  var quantityStr = document.getElementById('input-quantity').value.trim();
  var itemName = document.getElementById('input-item-name').value.trim();

  // 验证金额
  var amount = parseFloat(amountStr);
  if (isNaN(amount) || amount <= 0) {
    shakeElement(document.getElementById('input-amount'));
    return;
  }
  amount = Math.round(amount * 100) / 100;

  // 支出必须有分类
  if (currentTxType === 'expense' && !selectedCategory) {
    return;
  }

  // 解析数量（可选，仅支出）
  var quantity = null;
  var remaining = null;
  if (currentTxType === 'expense' && quantityStr) {
    var q = parseInt(quantityStr, 10);
    if (!isNaN(q) && q > 0) {
      quantity = q;
      remaining = q;
    }
  }

  // 关键词匹配检查（仅新增、仅支出）
  if (!currentEditId && currentTxType === 'expense') {
    var keywords = getKeywords();
    var checkText = (selectedCategory ? selectedCategory.name : '') + ' ' + (itemName || '') + ' ' + note;
    var matched = null;
    for (var i = 0; i < keywords.length; i++) {
      if (checkText.indexOf(keywords[i]) !== -1) {
        matched = keywords[i];
        break;
      }
    }
    if (matched) {
      showKeywordConfirm1(matched, amount, date, note, quantity, remaining, itemName);
      return;
    }
  }

  doSaveTransaction(amount, date, note, quantity, remaining, itemName);
}

/* 实际执行保存 */
function doSaveTransaction(amount, date, note, quantity, remaining, itemName) {
  var txData = {
    type: currentTxType,
    amount: amount,
    category: currentTxType === 'income' ? '收入' : selectedCategory.name,
    note: note,
    date: date || getTodayStr()
  };
  if (itemName) txData.itemName = itemName;
  if (quantity !== null && quantity > 0) {
    txData.quantity = quantity;
    txData.remaining = remaining;
  }

  if (currentEditId) {
    updateTransaction(currentEditId, txData);
    if (expandedTxId === currentEditId) expandedTxId = null;
  } else {
    txData.id = generateId();
    txData.createdAt = new Date().toISOString();
    saveTransaction(txData);

    if (currentTxType === 'expense') {
      checkBudgetAlert();
    }
  }

  closeAddSheet();
  renderHomePage();

  if (document.getElementById('page-search').classList.contains('active')) {
    performSearch();
  }

  if (navigator.vibrate) {
    navigator.vibrate(15);
  }
}

/* 检查预算并提醒 */
function checkBudgetAlert() {
  var budget = getBudget();
  if (budget.amount <= 0 || !budget.alertEnabled) return;

  var now = new Date();
  var currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var allTx = getTransactions();
  var monthExpense = 0;
  allTx.forEach(function (tx) {
    if (tx.type === 'expense' && tx.date.startsWith(currentMonth)) {
      monthExpense += tx.amount;
    }
  });

  if (monthExpense > budget.amount) {
    setTimeout(function () {
      showBudgetAlert(budget.amount, monthExpense);
    }, 500);
  }
}

/* 增强预算超支提醒 */
function showBudgetAlert(budgetAmount, spentAmount) {
  var overlay = document.getElementById('alert-overlay');
  document.getElementById('alert-icon').textContent = '🚨';
  document.getElementById('alert-title').textContent = '预算超支！';
  document.getElementById('alert-text').textContent = '本月支出 ¥' + formatMoney(spentAmount) + ' 已超出预算 ¥' + formatMoney(budgetAmount) + '\n请注意控制消费！';
  document.getElementById('alert-cancel').style.display = 'none';
  document.getElementById('alert-ok').textContent = '我知道了';
  document.getElementById('alert-ok').className = 'btn btn-danger';
  overlay.classList.add('show');

  document.getElementById('alert-ok').onclick = function () {
    overlay.classList.remove('show');
  };
}

/* 关键词确认第一弹 */
var keywordConfirmData = null;

function showKeywordConfirm1(keyword, amount, date, note, quantity, remaining, itemName) {
  var overlay = document.getElementById('alert-overlay');
  document.getElementById('alert-icon').textContent = '⚠';
  document.getElementById('alert-title').textContent = '不买挑战提醒';
  document.getElementById('alert-text').textContent = '监测到【' + keyword + '】，该物品可能在不买挑战范围内，确定已经购买吗？';
  document.getElementById('alert-cancel').style.display = 'inline-block';
  document.getElementById('alert-cancel').textContent = '取消';
  document.getElementById('alert-cancel').className = 'btn btn-outline';
  document.getElementById('alert-ok').textContent = '确定';
  document.getElementById('alert-ok').className = 'btn btn-primary';
  overlay.classList.add('show');

  keywordConfirmData = { keyword: keyword, amount: amount, date: date, note: note, quantity: quantity, remaining: remaining, itemName: itemName };

  document.getElementById('alert-cancel').onclick = function () {
    overlay.classList.remove('show');
    keywordConfirmData = null;
    closeAddSheet();
  };
  document.getElementById('alert-ok').onclick = function () {
    overlay.classList.remove('show');
    showKeywordConfirm2();
  };
}

/* 关键词确认第二弹 */
function showKeywordConfirm2() {
  var overlay = document.getElementById('keyword2-overlay');
  overlay.classList.add('show');

  document.getElementById('keyword2-cancel').onclick = function () {
    overlay.classList.remove('show');
    keywordConfirmData = null;
    closeAddSheet();
  };
  document.getElementById('keyword2-ok').onclick = function () {
    overlay.classList.remove('show');
    if (keywordConfirmData) {
      var d = keywordConfirmData;
      doSaveTransaction(d.amount, d.date, d.note, d.quantity, d.remaining, d.itemName);
      keywordConfirmData = null;
    }
  };
}

/* ===================================
   预算弹窗
   =================================== */

function openBudgetSheet() {
  var budget = getBudget();
  document.getElementById('input-budget').value = budget.amount > 0 ? budget.amount : '';
  document.getElementById('budget-sheet-overlay').classList.add('show');
  setTimeout(function () {
    document.getElementById('input-budget').focus();
  }, 300);
}

function closeBudgetSheet() {
  document.getElementById('budget-sheet-overlay').classList.remove('show');
}

function saveBudgetHandler() {
  var amountStr = document.getElementById('input-budget').value.trim();
  var amount = parseFloat(amountStr);
  if (amountStr === '' || amountStr === '0') {
    amount = 0;
  } else if (isNaN(amount) || amount < 0) {
    shakeElement(document.getElementById('input-budget'));
    return;
  }

  saveBudget({ amount: Math.round(amount * 100) / 100, alertEnabled: true });
  closeBudgetSheet();
  renderBudgetDisplay();
  renderHomeSummary();
}

/* ===================================
   分类管理弹窗
   =================================== */

function openCategorySheet() {
  document.getElementById('category-sheet-overlay').classList.add('show');
  document.getElementById('input-new-category').value = '';
  renderCategoryManageList();
}

function closeCategorySheet() {
  document.getElementById('category-sheet-overlay').classList.remove('show');
}

/* 渲染分类管理列表 */
function renderCategoryManageList() {
  var container = document.getElementById('category-manage-list');
  var cats = getCategories();
  var html = '';
  cats.forEach(function (cat) {
    html += '<div class="category-list-item">' +
      '<div class="category-list-left">' +
        '<span class="category-list-icon">' + cat.icon + '</span>' +
        '<span class="category-list-name">' + cat.name + '</span>' +
        (cat.isDefault ? '<span style="font-size:11px;color:var(--text-secondary);">(默认)</span>' : '') +
      '</div>' +
      (!cat.isDefault ? '<button class="category-list-delete" data-id="' + cat.id + '">🗑️</button>' : '') +
    '</div>';
  });
  container.innerHTML = html;

  // 绑定删除按钮
  container.querySelectorAll('.category-list-delete').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var catId = btn.getAttribute('data-id');
      var cat = getCategories().find(function (c) { return c.id === catId; });
      if (!cat) return;

      showConfirm('删除分类', '确定要删除" ' + cat.name + ' "分类吗？已有记录不受影响。', function () {
        removeCategory(catId);
        renderCategoryManageList();
        if (selectedCategory && selectedCategory.id === catId) {
          selectedCategory = getCategories()[0];
        }
      });
    });
  });
}

/* 添加分类 */
function addCategoryHandler() {
  var name = document.getElementById('input-new-category').value.trim();
  if (!name) { return; }

  var cats = getCategories();
  var exists = cats.some(function (c) { return c.name === name; });
  if (exists) {
    shakeElement(document.getElementById('input-new-category'));
    return;
  }

  var colors = ['#D49850', '#7B9CC8', '#C8869E', '#D07060', '#62A098', '#8E969F', '#A0B878'];
  var color = colors[Math.floor(Math.random() * colors.length)];

  addCategory(name, color, '🏷️');
  document.getElementById('input-new-category').value = '';
  renderCategoryManageList();
}

/* ===================================
   数据管理弹窗
   =================================== */

function openDataSheet() {
  var allTx = getTransactions();
  document.getElementById('data-count').textContent = '共 ' + allTx.length + ' 条记账记录';
  document.getElementById('data-sheet-overlay').classList.add('show');
}

function closeDataSheet() {
  document.getElementById('data-sheet-overlay').classList.remove('show');
}

/* ===================================
   关键词管理弹窗
   =================================== */

function openKeywordsSheet() {
  document.getElementById('keywords-sheet-overlay').classList.add('show');
  document.getElementById('input-new-keyword').value = '';
  renderKeywordsList();
}

function closeKeywordsSheet() {
  document.getElementById('keywords-sheet-overlay').classList.remove('show');
}

function renderKeywordsList() {
  var container = document.getElementById('keywords-list');
  var keywords = getKeywords();

  // 收集所有用过的二级名称
  var allTx = getTransactions();
  var usedNames = {};
  allTx.forEach(function (tx) {
    if (tx.itemName && keywords.indexOf(tx.itemName) === -1) {
      usedNames[tx.itemName] = true;
    }
  });
  var unusedNames = Object.keys(usedNames).sort();

  var html = '';

  // 已有关键词
  if (keywords.length > 0) {
    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">已添加</div>';
    html += '<div class="keywords-tag-list" style="margin-bottom:12px;">';
    keywords.forEach(function (kw) {
      html += '<div class="keyword-tag"><span>' + escapeHtml(kw) + '</span><span class="kw-delete" data-kw="' + escapeHtml(kw) + '">✕</span></div>';
    });
    html += '</div>';
  }

  // 可添加的物品名称
  if (unusedNames.length > 0) {
    html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;font-weight:600;">常用物品 · 点击添加</div>';
    html += '<div class="keywords-tag-list">';
    unusedNames.forEach(function (name) {
      html += '<div class="keyword-tag" style="cursor:pointer;background:var(--bg);" data-add="' + escapeHtml(name) + '">' + getItemIcon(name) + ' ' + escapeHtml(name) + '<span style="font-size:11px;color:var(--text-secondary);margin-left:2px;">+</span></div>';
    });
    html += '</div>';
  }

  if (!html) {
    html = '<div style="text-align:center;padding:16px;color:var(--text-secondary);font-size:14px;">暂无数据。记几笔支出后，物品名称会出现在这里</div>';
  }

  container.innerHTML = html;

  // 删除关键词
  container.querySelectorAll('.kw-delete').forEach(function (btn) {
    btn.addEventListener('click', function () {
      removeKeyword(btn.getAttribute('data-kw'));
      renderKeywordsList();
    });
  });

  // 点击添加
  container.querySelectorAll('[data-add]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      addKeyword(chip.getAttribute('data-add'));
      renderKeywordsList();
    });
  });
}

function addKeywordHandler() {
  var kw = document.getElementById('input-new-keyword').value.trim();
  if (!kw) return;
  if (!addKeyword(kw)) {
    shakeElement(document.getElementById('input-new-keyword'));
    return;
  }
  document.getElementById('input-new-keyword').value = '';
  renderKeywordsList();
}

/* ===================================
   确认弹窗
   =================================== */

var confirmCallback = null;

function showConfirm(title, text, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-text').textContent = text;
  document.getElementById('confirm-overlay').classList.add('show');
  confirmCallback = cb;
}

function closeConfirm() {
  document.getElementById('confirm-overlay').classList.remove('show');
  confirmCallback = null;
}

/* 确认按钮 */
document.addEventListener('DOMContentLoaded', function () {
  var confirmOk = document.getElementById('confirm-ok');
  if (confirmOk) {
    confirmOk.addEventListener('click', function () {
      var cb = confirmCallback;
      closeConfirm();
      if (cb) {
        cb();
      }
    });
  }
});

/* ===================================
   主题切换
   =================================== */

/* 主题定义 */
var THEMES = {
  green:  { primary: '#3D9E6B', primaryLight: '#EDF8F1', primaryDark: '#2B7A4E' },
  blue:   { primary: '#5B8DEF', primaryLight: '#EEF4FF', primaryDark: '#3D6FD4' },
  pink:   { primary: '#E06090', primaryLight: '#FFF0F5', primaryDark: '#C04070' },
  purple: { primary: '#7C5CE7', primaryLight: '#F4F0FF', primaryDark: '#5C3DC0' },
  white:  { primary: '#64748B', primaryLight: '#F1F5F9', primaryDark: '#475569' }
};

function applyTheme(themeName) {
  var theme = THEMES[themeName] || THEMES.green;
  var root = document.documentElement;
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--primary-light', theme.primaryLight);
  root.style.setProperty('--primary-dark', theme.primaryDark);

  // 更新 FAB 阴影颜色
  var fab = document.querySelector('.fab');
  if (fab) {
    fab.style.boxShadow = '0 4px 12px ' + theme.primary + '66';
  }

  // 更新 theme-color meta 标签
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute('content', theme.primary);
  }
}

/* ===================================
   工具函数
   =================================== */

/* 获取今天的日期字符串 */
function getTodayStr() {
  var now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

/* 获取时间段范围 */
function getPeriodRange(period, now) {
  var y = now.getFullYear();
  var m = now.getMonth();
  var d = now.getDate();
  var dayOfWeek = now.getDay() || 7; // 周日为7

  var start, end;
  switch (period) {
    case 'day':
      start = end = getTodayStr();
      break;
    case 'week':
      // 周一到周日
      var mon = new Date(y, m, d - dayOfWeek + 1);
      var sun = new Date(y, m, d - dayOfWeek + 7);
      start = formatDateObj(mon);
      end = formatDateObj(sun);
      break;
    case 'month':
      start = y + '-' + String(m + 1).padStart(2, '0') + '-01';
      end = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(new Date(y, m + 1, 0).getDate()).padStart(2, '0');
      break;
    case 'year':
      start = y + '-01-01';
      end = y + '-12-31';
      break;
    default:
      start = end = getTodayStr();
  }
  return { start: start, end: end };
}

/* Date 对象转日期字符串 */
function formatDateObj(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

/* 格式化金额（保留两位小数） */
function formatMoney(amount) {
  return amount.toFixed(2);
}

/* 格式化日期显示标签 */
function formatDateLabel(dateStr) {
  var today = getTodayStr();
  var yesterday = formatDateObj(new Date(Date.now() - 86400000));

  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';

  var parts = dateStr.split('-');
  return parseInt(parts[1], 10) + '月' + parseInt(parts[2], 10) + '日';
}

/* HTML 转义（防XSS） */
function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* 元素抖动（输入错误提示） */
function shakeElement(el) {
  el.style.animation = 'none';
  el.offsetHeight; // 回流重置
  el.style.animation = 'shake 0.3s ease';
  setTimeout(function () { el.style.animation = ''; }, 300);
}

// 抖动动画
var shakeStyle = document.createElement('style');
shakeStyle.textContent = '@keyframes shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-6px);} 75%{transform:translateX(6px);} }';
document.head.appendChild(shakeStyle);
