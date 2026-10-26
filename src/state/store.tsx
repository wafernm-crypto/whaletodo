import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Dispatch, ReactNode } from 'react';
import type {
  AppData,
  AutoInactiveRule,
  Group,
  GroupRule,
  Settings,
  Task,
  TaskStatus,
} from '../core/types';
import { normalizeData, createInitialData, createGroup, createTask, nowIso } from '../core/model';
import { planAutoInactive } from '../core/rules';
import type { StorageBridge } from '../core/storage';
import { createStorage } from '../core/storage';

export type Action =
  | { type: 'addGroup'; name: string }
  | { type: 'updateGroup'; id: string; patch: Partial<Pick<Group, 'name' | 'color' | 'rule'>> }
  | { type: 'deleteGroup'; id: string }
  | { type: 'selectGroup'; id: string }
  | { type: 'addTask'; groupId: string; title: string; note?: string }
  | { type: 'updateTask'; id: string; patch: Partial<Pick<Task, 'title' | 'note'>> }
  | { type: 'setTaskStatus'; id: string; status: TaskStatus }
  | { type: 'setTaskRule'; id: string; rule: AutoInactiveRule | null }
  | { type: 'toggleDone'; id: string }
  | { type: 'moveTask'; id: string; dir: -1 | 1 }
  | { type: 'deleteTask'; id: string }
  | { type: 'clearDone'; groupId: string }
  | { type: 'ruleTick'; now: number }
  | { type: 'setDefaultRule'; rule: GroupRule }
  | { type: 'replaceAll'; data: AppData };

export function compareOrder(a: Task, b: Task): number {
  return (
    a.order - b.order ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

function sortedInStatus(tasks: Task[], groupId: string, status: TaskStatus): Task[] {
  return tasks.filter((t) => t.groupId === groupId && t.status === status).sort(compareOrder);
}

function moveTask(tasks: Task[], taskId: string, dir: -1 | 1, stamp: string): Task[] {
  const target = tasks.find((t) => t.id === taskId);
  if (!target) return tasks;
  const peers = sortedInStatus(tasks, target.groupId, target.status);
  const index = peers.findIndex((t) => t.id === taskId);
  const swapIndex = index + dir;
  if (swapIndex < 0 || swapIndex >= peers.length) return tasks;

  // 先把同区块的排序归一化成 0..n-1，再交换，避免 order 撞车后按钮失灵
  const orderMap = new Map<string, number>();
  peers.forEach((t, i) => orderMap.set(t.id, i));
  const a = peers[index];
  const b = peers[swapIndex];
  orderMap.set(a.id, swapIndex);
  orderMap.set(b.id, index);

  return tasks.map((t) => {
    const next = orderMap.get(t.id);
    if (next == null || next === t.order) return t;
    return { ...t, order: next, updatedAt: stamp };
  });
}

/** 该分组是否已经用满活跃额度（excludeTaskId 用于「自己已经在活跃里」的场景） */
export function isActiveFull(state: AppData, groupId: string, excludeTaskId?: string): boolean {
  const group = state.groups.find((g) => g.id === groupId);
  if (!group) return false;
  const limit = group.rule.maxActive;
  if (limit == null || limit <= 0) return false;
  let count = 0;
  for (const t of state.tasks) {
    if (t.groupId === groupId && t.status === 'active' && t.id !== excludeTaskId) count += 1;
  }
  return count >= limit;
}

export function reduce(state: AppData, action: Action): AppData {
  const stamp = nowIso();

  switch (action.type) {
    case 'addGroup': {
      const name = action.name.trim();
      if (!name) return state;
      const group = createGroup(name, state.groups.length, state.settings.defaultRule);
      return {
        ...state,
        groups: [...state.groups, group],
        settings: { ...state.settings, lastGroupId: group.id },
      };
    }

    case 'updateGroup': {
      const groups = state.groups.map((g) => {
        if (g.id !== action.id) return g;
        const next: Group = { ...g };
        if (typeof action.patch.name === 'string') {
          const name = action.patch.name.trim();
          if (name) next.name = name;
        }
        if (typeof action.patch.color === 'string') next.color = action.patch.color;
        if (action.patch.rule) next.rule = { ...action.patch.rule };
        return next;
      });
      return { ...state, groups };
    }

    case 'deleteGroup': {
      const groups = state.groups.filter((g) => g.id !== action.id);
      if (groups.length === state.groups.length) return state;
      const tasks = state.tasks.filter((t) => t.groupId !== action.id);
      const lastGroupId =
        state.settings.lastGroupId === action.id
          ? groups[0]?.id ?? null
          : state.settings.lastGroupId;
      return { ...state, groups, tasks, settings: { ...state.settings, lastGroupId } };
    }

    case 'selectGroup':
      return { ...state, settings: { ...state.settings, lastGroupId: action.id } };

    case 'addTask': {
      const title = action.title.trim();
      if (!title) return state;
      const siblings = state.tasks.filter((t) => t.groupId === action.groupId);
      const minOrder = siblings.reduce((m, t) => Math.min(m, t.order), 0);
      const task = createTask(action.groupId, title, minOrder - 1, action.note?.trim() ?? '');
      // 活跃额度已满：新事项直接落到不活跃区，不打断记录
      if (isActiveFull(state, action.groupId)) {
        task.status = 'inactive';
        task.statusChangedAt = stamp;
      }
      return { ...state, tasks: [task, ...state.tasks] };
    }

    case 'updateTask': {
      const tasks = state.tasks.map((t) => {
        if (t.id !== action.id) return t;
        const next: Task = { ...t, updatedAt: stamp };
        if (typeof action.patch.title === 'string' && action.patch.title.trim()) {
          next.title = action.patch.title.trim();
        }
        if (typeof action.patch.note === 'string') next.note = action.patch.note;
        return next;
      });
      return { ...state, tasks };
    }

    case 'setTaskRule': {
      const tasks = state.tasks.map((t) => {
        if (t.id !== action.id) return t;
        return { ...t, rule: action.rule ? { ...action.rule } : null, updatedAt: stamp };
      });
      return { ...state, tasks };
    }

    case 'setTaskStatus': {
      const tasks = state.tasks.map((t) => {
        if (t.id !== action.id || t.status === action.status) return t;
        // 往活跃区放人时守一次上限，超了就保持原状
        if (action.status === 'active' && isActiveFull(state, t.groupId, t.id)) return t;
        const next: Task = { ...t, status: action.status, statusChangedAt: stamp, updatedAt: stamp };
        if (action.status === 'active') {
          next.activatedAt = stamp;
          // 手动激活视为「重新开始计时」，避免立刻又被自动规则压回不活跃
          next.restartedAt = stamp;
        }
        if (action.status === 'done') {
          next.completedAt = stamp;
          // 完成的事项沉到已完成区底部
          const sameStatus = state.tasks.filter(
            (x) => x.groupId === t.groupId && x.status === 'done' && x.id !== t.id,
          );
          next.order = sameStatus.reduce((m, x) => Math.max(m, x.order), 0) + 1;
        } else {
          next.completedAt = null;
          if (t.status === 'done') {
            // 从已完成里捞回来，放回对应区块顶部
            const sameStatus = state.tasks.filter(
              (x) => x.groupId === t.groupId && x.status === action.status && x.id !== t.id,
            );
            next.order = sameStatus.reduce((m, x) => Math.min(m, x.order), 0) - 1;
          }
        }
        return next;
      });
      return { ...state, tasks };
    }

    case 'toggleDone': {
      const target = state.tasks.find((t) => t.id === action.id);
      if (!target) return state;
      if (target.status === 'done') {
        // 取消完成时如果活跃额度已满，就回到不活跃，不让分组越界
        const fallback: TaskStatus = isActiveFull(state, target.groupId, target.id)
          ? 'inactive'
          : 'active';
        return reduce(state, { type: 'setTaskStatus', id: action.id, status: fallback });
      }
      return reduce(state, { type: 'setTaskStatus', id: action.id, status: 'done' });
    }

    case 'moveTask':
      return { ...state, tasks: moveTask(state.tasks, action.id, action.dir, stamp) };

    case 'deleteTask':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };

    case 'clearDone': {
      const tasks = state.tasks.filter(
        (t) => !(t.groupId === action.groupId && t.status === 'done'),
      );
      return tasks.length === state.tasks.length ? state : { ...state, tasks };
    }

    case 'ruleTick': {
      const patches = planAutoInactive(state.groups, state.tasks, action.now);
      if (!patches.length) return state;
      const byId = new Map(patches.map((p) => [p.taskId, p]));
      const tasks = state.tasks.map((t) => {
        const patch = byId.get(t.id);
        if (!patch) return t;
        return {
          ...t,
          status: 'inactive' as const,
          statusChangedAt: patch.statusChangedAt,
          updatedAt: patch.updatedAt,
        };
      });
      return { ...state, tasks };
    }

    case 'setDefaultRule':
      return { ...state, settings: { ...state.settings, defaultRule: { ...action.rule } } };

    case 'replaceAll':
      return action.data;

    default:
      return state;
  }
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface StoreValue {
  data: AppData;
  dispatch: Dispatch<Action>;
  saveState: SaveState;
  dataPath: string;
  error: string | null;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storageRef = useRef<StorageBridge>(createStorage());
  const [data, setData] = useState<AppData | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [dataPath, setDataPath] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hydratedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<AppData | null>(null);

  // 启动：读盘 → 归一化 → 补算规则（关闭软件期间到期的，一开就沉淀）
  useEffect(() => {
    let alive = true;
    (async () => {
      const storage = storageRef.current;
      let loaded: AppData | null = null;
      try {
        loaded = await storage.load();
      } catch (err) {
        console.error('读取数据失败', err);
      }
      const base = loaded ? normalizeData(loaded) : createInitialData();
      const patches = planAutoInactive(base.groups, base.tasks, Date.now());
      let next = base;
      if (patches.length) {
        const stamp = new Date().toISOString();
        const ids = new Set(patches.map((p) => p.taskId));
        next = {
          ...base,
          tasks: base.tasks.map((t) =>
            ids.has(t.id)
              ? { ...t, status: 'inactive' as const, statusChangedAt: stamp, updatedAt: stamp }
              : t,
          ),
        };
      }
      if (!alive) return;
      hydratedRef.current = true;
      setData(next);
      if (storage.location) storage.location().then(setDataPath).catch(() => undefined);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 落盘：改动后 250ms 合并写入
  useEffect(() => {
    if (!data) return;
    latestRef.current = data;
    if (!hydratedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const payload = data;
    timerRef.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        await storageRef.current.save(payload);
        setSaveState('saved');
        setError(null);
      } catch (err) {
        setSaveState('error');
        setError(err instanceof Error ? err.message : String(err));
      }
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data]);

  // 关窗 / 切到后台时立刻同步落盘，避免防抖窗口内的改动丢掉
  useEffect(() => {
    const flush = () => {
      const payload = latestRef.current;
      if (payload && window.whaletodo?.saveSync) {
        try {
          window.whaletodo.saveSync(payload);
        } catch {
          // 关窗路径上没法再提示，安静失败
        }
      }
    };
    const onHidden = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onHidden);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onHidden);
    };
  }, []);

  // 每分钟补算一次自动沉淀
  useEffect(() => {
    if (!data) return;
    const tick = () => dispatch({ type: 'ruleTick', now: Date.now() });
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [data]);

  const dispatch = useCallback((action: Action) => {
    setData((prev) => {
      if (!prev) return prev;
      let next = reduce(prev, action);
      if (action.type !== 'ruleTick') next = reduce(next, { type: 'ruleTick', now: Date.now() });
      return next;
    });
  }, []);

  const value = useMemo<StoreValue>(
    () =>
      data
        ? { data, dispatch, saveState, dataPath, error }
        : { data: createInitialData(), dispatch, saveState: 'idle', dataPath: '', error },
    [data, dispatch, saveState, dataPath, error],
  );

  if (!data) {
    return (
      <div className="boot">
        <div className="boot-mark">🐳</div>
        <p>正在把数据从海里捞出来…</p>
      </div>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore 必须在 StoreProvider 内使用');
  return ctx;
}

export function useGroup(id: string | null): Group | null {
  const { data } = useStore();
  return data.groups.find((g) => g.id === id) ?? null;
}

export type { Settings };
