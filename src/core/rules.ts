/**
 * 规则引擎：把「活跃」按条件自动沉淀为「不活跃」。
 * 纯函数，传入 now 便于测试与跨天补算。
 *
 * 条件解析优先级：事项自己的 rule（非 null）> 分组的 rule。
 */
import type { AutoInactiveRule, Group, Task } from './types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** 某个事项实际生效的自动沉淀条件 */
export function resolveTaskRule(task: Task, group: Group): AutoInactiveRule {
  if (task.rule) return task.rule;
  return {
    autoInactiveDays: group.rule.autoInactiveDays,
    countFrom: group.rule.countFrom,
  };
}

/**
 * 计时起点。
 * 手动重新激活过的事项从那一刻重新计时——否则用户刚捞回来的事项
 * 会立刻被分组条件（尤其是「从创建算起」）再次压下去。
 */
export function ruleBaseTime(task: Task, rule: AutoInactiveRule): number {
  if (task.restartedAt) {
    const restarted = Date.parse(task.restartedAt);
    if (!Number.isNaN(restarted)) return restarted;
  }
  const from = rule.countFrom === 'activated' ? task.activatedAt : task.createdAt;
  const parsed = Date.parse(from);
  return Number.isNaN(parsed) ? Date.parse(task.createdAt) : parsed;
}

/** 该活跃事项距离自动沉淀还剩多少毫秒（负数表示已超期）；条件关闭时返回 null */
export function msUntilInactive(task: Task, rule: AutoInactiveRule, now: number): number | null {
  const days = rule.autoInactiveDays;
  if (days == null || days <= 0) return null;
  const due = ruleBaseTime(task, rule) + days * DAY_MS;
  return due - now;
}

/** 该事项当前是否应当被自动沉淀 */
export function shouldAutoInactive(task: Task, group: Group, now: number): boolean {
  if (task.status !== 'active') return false;
  const remain = msUntilInactive(task, resolveTaskRule(task, group), now);
  return remain != null && remain <= 0;
}

export interface RulePatch {
  taskId: string;
  statusChangedAt: string;
  updatedAt: string;
}

/**
 * 扫描全部事项，返回需要被自动转为不活跃的补丁列表。
 * 使用 statusChangedAt 作为变更时间，保证「什么时候沉淀的」有据可查。
 */
export function planAutoInactive(groups: Group[], tasks: Task[], now: number): RulePatch[] {
  const byId = new Map(groups.map((g) => [g.id, g]));
  const patches: RulePatch[] = [];
  const stamp = new Date(now).toISOString();
  for (const task of tasks) {
    const group = byId.get(task.groupId);
    if (!group) continue;
    if (shouldAutoInactive(task, group, now)) {
      patches.push({ taskId: task.id, statusChangedAt: stamp, updatedAt: stamp });
    }
  }
  return patches;
}

/** 人类可读的剩余时间 */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '即将沉淀';
  const hours = ms / (60 * 60 * 1000);
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(ms / 60000));
    return `${minutes} 分钟后沉淀`;
  }
  if (hours < 24) return `${Math.ceil(hours)} 小时后沉淀`;
  return `${Math.ceil(hours / 24)} 天后沉淀`;
}

/** 某分组当前活跃事项数量 */
export function countActive(tasks: Task[], groupId: string): number {
  let n = 0;
  for (const t of tasks) if (t.groupId === groupId && t.status === 'active') n += 1;
  return n;
}

/** 该分组是否还能再容纳一个活跃事项 */
export function canActivateMore(tasks: Task[], group: Group): boolean {
  const limit = group.rule.maxActive;
  if (limit == null || limit <= 0) return true;
  return countActive(tasks, group.id) < limit;
}
