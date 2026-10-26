import type { RuleCountFrom } from '../core/types';

export function formatRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const diff = now - t;
  if (diff < 60_000) return '刚刚';
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const date = new Date(t);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface RuleLike {
  autoInactiveDays: number | null;
  countFrom: RuleCountFrom;
  maxActive?: number | null;
}

/** 规则摘要文案：侧栏、标题区和设置面板共用 */
export function describeRule(rule: RuleLike): string {
  const parts: string[] = [];
  if (rule.autoInactiveDays != null && rule.autoInactiveDays > 0) {
    const from = rule.countFrom === 'activated' ? '最近一次激活' : '创建';
    parts.push(`活跃 ${rule.autoInactiveDays} 天后自动转为不活跃（从${from}算起）`);
  } else {
    parts.push('不会自动沉淀');
  }
  if (rule.maxActive != null && rule.maxActive > 0) {
    parts.push(`同时最多 ${rule.maxActive} 个活跃`);
  }
  return parts.join(' · ');
}
