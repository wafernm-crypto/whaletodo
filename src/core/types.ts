/**
 * 领域模型（纯 TypeScript，不依赖 DOM / Node）
 * 未来移植到移动端、接入云同步时，这一层可以整体复用。
 */

/** 待办事项的状态：活跃 / 不活跃（沉淀）/ 已完成 */
export type TaskStatus = 'active' | 'inactive' | 'done';

/** 自动沉淀规则的计时起点 */
export type RuleCountFrom = 'created' | 'activated';

/** 自动沉淀条件：分组与单个事项共用同一套形状 */
export interface AutoInactiveRule {
  /** 多少天后自动转为不活跃；null 表示关闭自动沉淀 */
  autoInactiveDays: number | null;
  /** 计时起点：创建时间 / 最近一次被激活的时间 */
  countFrom: RuleCountFrom;
}

/** 分组级规则：自动沉淀 + 活跃上限 */
export interface GroupRule extends AutoInactiveRule {
  /** 同时允许的活跃事项上限；null 表示不限 */
  maxActive: number | null;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  /** 侧栏排序权重，越小越靠上 */
  order: number;
  rule: GroupRule;
}

export interface Task {
  id: string;
  groupId: string;
  title: string;
  note: string;
  status: TaskStatus;
  createdAt: string;
  /** 最近一次进入「活跃」状态的时间（手动置为活跃也会刷新） */
  activatedAt: string;
  /** 最近一次状态变更时间 */
  statusChangedAt: string;
  /** 最近一次完成时间；未完成时为 null */
  completedAt: string | null;
  /**
   * 最近一次「手动重新激活」的时间。
   * 有值时自动沉淀的计时从此刻重新算起，避免手动捞回来后立刻又被分组条件压下去。
   */
  restartedAt: string | null;
  /** 事项自己的自动沉淀条件；null 表示继承分组设置 */
  rule: AutoInactiveRule | null;
  /** 组内排序权重，越小越靠上（仅在各自状态区块内生效） */
  order: number;
  updatedAt: string;
}

export interface Settings {
  /** 上次打开的分组，启动时恢复 */
  lastGroupId: string | null;
  /** 新建分组时使用的默认规则 */
  defaultRule: GroupRule;
}

export interface AppData {
  schemaVersion: number;
  groups: Group[];
  tasks: Task[];
  settings: Settings;
}

export const SCHEMA_VERSION = 2;

export const GROUP_COLORS = [
  '#3D7EA6',
  '#2E9E86',
  '#C98A3B',
  '#B05A78',
  '#6C63A8',
  '#8A8F45',
] as const;

export const STATUS_LABEL: Record<TaskStatus, string> = {
  active: '活跃',
  inactive: '不活跃',
  done: '已完成',
};
