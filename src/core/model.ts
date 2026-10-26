import type {
  AppData,
  AutoInactiveRule,
  Group,
  GroupRule,
  Settings,
  Task,
  TaskStatus,
} from './types';
import { GROUP_COLORS, SCHEMA_VERSION } from './types';

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const DEFAULT_RULE: GroupRule = {
  autoInactiveDays: 7,
  countFrom: 'created',
  maxActive: null,
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function createGroup(name: string, index: number, rule: GroupRule = DEFAULT_RULE): Group {
  const stamp = nowIso();
  return {
    id: newId(),
    name,
    color: GROUP_COLORS[index % GROUP_COLORS.length],
    createdAt: stamp,
    order: index,
    rule: { ...rule },
  };
}

export function createTask(groupId: string, title: string, order: number, note = ''): Task {
  const stamp = nowIso();
  return {
    id: newId(),
    groupId,
    title,
    note,
    status: 'active',
    createdAt: stamp,
    activatedAt: stamp,
    statusChangedAt: stamp,
    completedAt: null,
    restartedAt: null,
    rule: null,
    order,
    updatedAt: stamp,
  };
}

export function defaultSettings(): Settings {
  return { lastGroupId: null, defaultRule: { ...DEFAULT_RULE } };
}

export function createInitialData(): AppData {
  const groups = [
    createGroup('工作', 0, { autoInactiveDays: 7, countFrom: 'created', maxActive: 5 }),
    createGroup('生活', 1, { autoInactiveDays: 14, countFrom: 'activated', maxActive: null }),
  ];
  const tasks: Task[] = [
    createTask(groups[0].id, '把「鲸鱼待办」的桌面版跑起来', 0, '双击即可运行，数据存在本地。'),
    createTask(groups[0].id, '给分组配一个自动沉淀天数', 1, '分组设置里可以调整。'),
    createTask(groups[1].id, '买米，本鲸鱼娘要吃米饭', 0),
  ];
  return {
    schemaVersion: SCHEMA_VERSION,
    groups,
    tasks,
    settings: { ...defaultSettings(), lastGroupId: groups[0].id },
  };
}

function normalizeDays(input: unknown): number | null {
  return typeof input === 'number' && input > 0 ? Math.min(365, Math.round(input)) : null;
}

/** 事项级条件：null 表示没有单独设置（继承分组） */
function normalizeTaskRule(input: unknown): AutoInactiveRule | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Partial<AutoInactiveRule>;
  return {
    autoInactiveDays: normalizeDays(raw.autoInactiveDays),
    countFrom: raw.countFrom === 'activated' ? 'activated' : 'created',
  };
}

function normalizeMaxActive(input: unknown): number | null {
  return typeof input === 'number' && input > 0 ? Math.min(999, Math.round(input)) : null;
}

/** 防御性归一化：兼容手工改坏 / 旧版本文件，缺字段就补默认值 */
export function normalizeData(input: unknown): AppData {
  const raw = (input ?? {}) as Partial<AppData>;
  const base = createInitialData();
  const groupsRaw = Array.isArray(raw.groups) ? raw.groups : null;
  const tasksRaw = Array.isArray(raw.tasks) ? raw.tasks : null;
  if (!groupsRaw || !tasksRaw) return base;

  const groups: Group[] = groupsRaw
    .filter((g): g is Group => !!g && typeof g.id === 'string' && typeof g.name === 'string')
    .map((g, i) => ({
      id: g.id,
      name: g.name,
      color:
        typeof g.color === 'string' && g.color ? g.color : GROUP_COLORS[i % GROUP_COLORS.length],
      createdAt: g.createdAt ?? nowIso(),
      order: typeof g.order === 'number' ? g.order : i,
      rule: {
        autoInactiveDays: normalizeDays(g.rule?.autoInactiveDays),
        countFrom: g.rule?.countFrom === 'activated' ? 'activated' : 'created',
        maxActive: normalizeMaxActive(g.rule?.maxActive),
      },
    }));

  const groupIds = new Set(groups.map((g) => g.id));
  const tasks: Task[] = tasksRaw
    .filter((t): t is Task => !!t && typeof t.id === 'string' && groupIds.has(t.groupId))
    .map((t, i) => {
      const status: TaskStatus =
        t.status === 'done' || t.status === 'inactive' ? t.status : 'active';
      return {
        id: t.id,
        groupId: t.groupId,
        title: typeof t.title === 'string' ? t.title : '未命名事项',
        note: typeof t.note === 'string' ? t.note : '',
        status,
        createdAt: t.createdAt ?? nowIso(),
        activatedAt: t.activatedAt ?? t.createdAt ?? nowIso(),
        statusChangedAt: t.statusChangedAt ?? t.createdAt ?? nowIso(),
        completedAt: status === 'done' ? t.completedAt ?? t.statusChangedAt ?? nowIso() : null,
        restartedAt: typeof t.restartedAt === 'string' ? t.restartedAt : null,
        rule: normalizeTaskRule(t.rule),
        order: typeof t.order === 'number' ? t.order : i,
        updatedAt: t.updatedAt ?? nowIso(),
      };
    });

  const settings: Settings = {
    lastGroupId:
      typeof raw.settings?.lastGroupId === 'string' && groupIds.has(raw.settings.lastGroupId)
        ? raw.settings.lastGroupId
        : groups[0]?.id ?? null,
    defaultRule: {
      autoInactiveDays: normalizeDays(raw.settings?.defaultRule?.autoInactiveDays),
      countFrom: raw.settings?.defaultRule?.countFrom === 'activated' ? 'activated' : 'created',
      maxActive: normalizeMaxActive(raw.settings?.defaultRule?.maxActive),
    },
  };

  return { schemaVersion: SCHEMA_VERSION, groups, tasks, settings };
}
