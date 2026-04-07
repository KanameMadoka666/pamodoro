# Pamodoro 番茄钟 — 技术选型 & 分步需求文档

> 当前日期：2026-04-05  
> 目标：可打包运行在 Windows 上，后期兼容 Mac / Linux

---

## 一、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 桌面壳 | **Electron** | 原生窗口置顶/通知，跨平台 Win/Mac/Linux |
| 前端框架 | **React 18 + TypeScript** | 组件化，TS 保障代码质量 |
| 构建工具 | **electron-vite** | Vite 极速热更，专为 Electron 优化 |
| 样式系统 | **Tailwind CSS + CSS Variables** | 主题切换只需切换 CSS 变量集合 |
| 状态管理 | **Zustand** | 轻量，比 Redux 简单，TS 友好 |
| 数据持久化 | **better-sqlite3** (SQLite) | 跨平台本地 DB，零配置，离线可用 |
| 图表 | **Recharts** | React 原生，声明式，主题定制方便 |
| 音频 | **Howler.js** | 跨平台音频，支持淡入淡出，循环播放 |
| 拖拽排序 | **dnd-kit** | 轻量现代，支持键盘无障碍 |
| CSV 导出 | **papaparse** | 简单易用的 CSV 处理库 |
| 打包 | **electron-builder** | 生成 `.exe` 安装包 / NSIS |

---

## 二、数据模型

```sql
-- 活动清单（Backlog）
CREATE TABLE activity (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT,           -- 工作/学习/生活/其他
  priority         INTEGER,        -- 1高 2中 3低
  estimated_pomodoros INTEGER DEFAULT 1,
  status           TEXT DEFAULT 'active', -- active/archived
  created_at       TEXT
);

-- 今日计划
CREATE TABLE today_task (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  activity_id         INTEGER REFERENCES activity(id),
  date                TEXT,         -- YYYY-MM-DD
  sort_order          INTEGER,
  estimated_pomodoros INTEGER DEFAULT 1,
  actual_pomodoros    INTEGER DEFAULT 0,
  status              TEXT DEFAULT 'pending', -- pending/in_progress/completed/incomplete
  notes               TEXT
);

-- 番茄会话
CREATE TABLE pomodoro_session (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id    INTEGER REFERENCES today_task(id),
  start_time TEXT,
  end_time   TEXT,
  type       TEXT,   -- work/short_break/long_break
  result     TEXT    -- completed/interrupted
);

-- 工作记录（自动生成）
CREATE TABLE work_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             TEXT,
  start_time       TEXT,
  end_time         TEXT,
  task_id          INTEGER,
  task_type        TEXT,
  task_description TEXT,
  pomodoro_count   INTEGER DEFAULT 1,
  notes            TEXT
);

-- 应用设置（单行KV or 单行JSON）
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
```

---

## 三、目录结构

```
pamodoro/
├── src/
│   ├── main/                        # Electron 主进程
│   │   ├── index.ts                 # 主进程入口
│   │   ├── database/
│   │   │   ├── schema.ts            # 建表 SQL
│   │   │   └── dao/                 # 各表的增删改查
│   │   │       ├── activityDao.ts
│   │   │       ├── todayTaskDao.ts
│   │   │       ├── pomodoroDao.ts
│   │   │       ├── workLogDao.ts
│   │   │       └── settingsDao.ts
│   │   ├── ipc/                     # IPC 事件处理器
│   │   │   ├── activityIpc.ts
│   │   │   ├── timerIpc.ts
│   │   │   └── settingsIpc.ts
│   │   └── notify.ts                # 前台弹窗逻辑
│   ├── preload/
│   │   └── index.ts                 # 暴露安全 contextBridge API
│   └── renderer/                    # React 前端
│       ├── components/
│       │   ├── Timer/               # 番茄计时器
│       │   ├── ActivityList/        # 活动清单
│       │   ├── TodayPlan/           # 今日计划
│       │   ├── WorkLog/             # 工作记录
│       │   ├── Analytics/           # 数据分析
│       │   └── Settings/            # 设置
│       ├── stores/                  # Zustand store
│       │   ├── timerStore.ts
│       │   ├── activityStore.ts
│       │   └── settingsStore.ts
│       ├── themes/                  # CSS 变量主题定义
│       │   └── themes.ts
│       ├── hooks/
│       └── App.tsx
├── assets/
│   ├── sounds/                      # 内置音效和白噪音
│   └── icons/
├── electron-builder.config.ts
└── vite.config.ts
```

---

## 四、功能模块详细需求

### 模块 1：番茄计时器

- [ ] 三段式循环：工作(25min) → 短休息(5min) → 每4个番茄后长休息(15min)
- [ ] 所有时长在设置中可自定义
- [ ] 圆形进度条倒计时显示，标题栏同步显示剩余时间
- [ ] 操作按钮：开始 / 暂停 / 重置 / 跳过
- [ ] **时间到后强制前台弹窗**（`alwaysOnTop + focus`）
- [ ] 弹窗内操作：标记完成 ✅ / 标记未完成 ❌ / 再来一个 🍅
- [ ] 桌面系统通知作为辅助（Notification API）
- [ ] 提示音效（可配置，可静音）
- [ ] 当前关联任务显示在计时器上方

---

### 模块 2：活动清单（Backlog）

- [ ] 添加任务：标题、描述、分类、优先级（高/中/低）、预估番茄数
- [ ] 列表展示，按优先级或创建时间排序
- [ ] 编辑 / 删除 / 归档
- [ ] 文字搜索、分类筛选、优先级筛选
- [ ] 一键「加入今日计划」按钮

---

### 模块 3：今日计划

- [ ] 从活动清单选择/拖入任务，生成当天计划
- [ ] 拖拽调整顺序（dnd-kit）
- [ ] 每个任务显示预估番茄数 vs 已完成番茄数进度条
- [ ] **点击「开始」** → 绑定该任务并启动计时器
- [ ] 计时结束后自动更新该任务的实际番茄数
- [ ] 任务状态：未开始 / 进行中 / 已完成 / 未完成
- [ ] 跨日未完成任务滚动提示

---

### 模块 4：工作记录表

- [ ] 每次番茄结束自动写入一条记录（无需手动）
- [ ] 字段：日期 | 开始时间 | 结束时间 | 任务类型 | 任务描述 | 番茄数 | 备注
- [ ] 支持手动新增 / 编辑 / 删除记录
- [ ] 按日期范围筛选
- [ ] 导出 CSV 功能（papaparse）

---

### 模块 5：数据分析

| 图表类型 | 说明 |
|----------|------|
| 折线图 | 近 7/30 天每日番茄完成数趋势 |
| 柱状图 | 本周各天工作时长对比 |
| 饼图 | 任务类型分布（工作/学习/生活/其他） |
| 热力图 | 类似 GitHub contribution 的年度番茄热力图 |
| 统计卡片 | 今日/本周/总计：番茄数、专注时长、任务完成率 |

- [ ] 时间范围选择器（今日/本周/本月/自定义）
- [ ] 图表使用 Recharts 实现，支持主题跟随

---

### 模块 6：个性化设置

**主题**
- [ ] 5套预设主题：晨雾白、深夜蓝、抹茶绿、暖橙秋、暗夜紫
- [ ] 跟随系统深色/浅色模式

**背景**
- [ ] 纯色选色器
- [ ] 本地图片上传（存储文件路径到 settings 表）

**背景音乐**
- [ ] 内置3种白噪音：雨声 / 咖啡馆 / 森林
- [ ] 支持导入本地音频文件（MP3/OGG/WAV）
- [ ] 独立音量控制：音效音量 / 背景音乐音量

**计时器参数**
- [ ] 工作时长（默认 25 分钟）
- [ ] 短休息时长（默认 5 分钟）
- [ ] 长休息时长（默认 15 分钟）
- [ ] 长休息间隔（默认每 4 个番茄）

**其他**
- [ ] 开机自启开关（electron auto-launch）
- [ ] 最小化到系统托盘

---

## 五、开发阶段规划

### Phase 1 — 项目骨架
- [ ] 使用 `electron-vite` 初始化项目
- [ ] 配置 TypeScript + Tailwind CSS
- [ ] 创建 SQLite 数据库，完成 schema 建表
- [ ] 实现 contextBridge preload，搭建 IPC 通信层
- [ ] 完成主窗口框架 + 侧边导航路由（React Router）
- [ ] 打通主进程 ↔ 渲染进程数据流

### Phase 2 — 核心计时 + 任务管理
- [ ] Zustand timerStore（状态机：idle/running/paused/break）
- [ ] 圆形进度条计时器 UI 组件
- [ ] 活动清单 CRUD（ActivityList 组件 + activityDao）
- [ ] 今日计划（TodayPlan 组件 + todayTaskDao）
- [ ] 拖拽排序（dnd-kit）
- [ ] 任务绑定计时器，开始/暂停/重置/跳过

### Phase 3 — 完成弹窗 + 自动记录
- [ ] 番茄完成前台弹窗（alwaysOnTop BrowserWindow）
- [ ] 弹窗内完成/未完成/继续选择
- [ ] 计时结束后自动写入 work_log
- [ ] 工作记录表 UI + 手动编辑 + CSV 导出

### Phase 4 — 数据分析
- [ ] 统计卡片（今日/本周/总计）
- [ ] 折线图：番茄趋势
- [ ] 柱状图：工作时长对比
- [ ] 饼图：任务类型分布
- [ ] 热力图：年度番茄贡献图

### Phase 5 — 个性化 & 音频
- [ ] 主题系统（CSS Variables 切换）
- [ ] 背景色/图片设置
- [ ] Howler.js 背景音乐播放器
- [ ] 音效配置（计时开始/结束/休息）
- [ ] 设置页面 UI

### Phase 6 — 打包 & 收尾
- [ ] electron-builder 配置
- [ ] Windows NSIS 安装包
- [ ] 应用图标（.ico）
- [ ] 开机自启（auto-launch）
- [ ] 系统托盘（Tray）
- [ ] 最终测试 & bug 修复

---

## 六、关键技术要点备忘

### IPC 通信约定
```
主进程暴露：window.api.xxx()
渲染进程调用：await window.api.getActivities()
```

### 前台弹窗实现
```ts
// 主进程
const win = new BrowserWindow({ alwaysOnTop: true, ... })
win.focus()
win.moveTop()
```

### 主题切换
```ts
// 切换主题只需在 <html> 上切换 data-theme 属性
document.documentElement.setAttribute('data-theme', 'dark-blue')
// CSS 中用 [data-theme="dark-blue"] { --bg-primary: #1a1a2e; ... }
```

### SQLite 路径（跨平台）
```ts
import { app } from 'electron'
const dbPath = path.join(app.getPath('userData'), 'pamodoro.db')
// Windows: C:\Users\{user}\AppData\Roaming\pamodoro\
// Mac:     ~/Library/Application Support/pamodoro/
// Linux:   ~/.config/pamodoro/
```

---

*按 Phase 顺序逐步实现，每个 Phase 完成后可独立测试。*
