import { useMemo, useState } from 'react';
import type { Task, TaskStatus } from './core/types';
import { STATUS_LABEL } from './core/types';
import { useStore, compareOrder } from './state/store';
import { Sidebar } from './ui/Sidebar';
import { TaskComposer } from './ui/TaskComposer';
import { TaskItem } from './ui/TaskItem';
import { GroupSettingsPanel } from './ui/GroupSettingsPanel';
import { TaskSettingsPanel } from './ui/TaskSettingsPanel';
import { describeRule } from './ui/format';
import { IconSearch, IconSliders } from './ui/icons';

type Filter = 'all' | TaskStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: STATUS_LABEL.active },
  { key: 'inactive', label: STATUS_LABEL.inactive },
  { key: 'done', label: STATUS_LABEL.done },
];

const BLOCKS: { status: TaskStatus; title: string; hint: string }[] = [
  { status: 'active', title: '活跃', hint: '置顶处理' },
  { status: 'inactive', title: '不活跃', hint: '沉淀中，随时可以捞回来' },
  { status: 'done', title: '已完成', hint: '已归档' },
];

export default function App() {
  const { data, dispatch, error } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Partial<Record<TaskStatus, boolean>>>({});
  const [askClearDone, setAskClearDone] = useState(false);

  const groups = data.groups;
  const group = groups.find((g) => g.id === data.settings.lastGroupId) ?? groups[0] ?? null;

  const groupTasks = useMemo(
    () => (group ? data.tasks.filter((t) => t.groupId === group.id) : []),
    [data.tasks, group],
  );

  const byStatus = useMemo(() => {
    const base: Record<TaskStatus, Task[]> = { active: [], inactive: [], done: [] };
    for (const t of groupTasks) base[t.status].push(t);
    (Object.keys(base) as TaskStatus[]).forEach((k) => base[k].sort(compareOrder));
    return base;
  }, [groupTasks]);

  const keyword = query.trim().toLowerCase();
  const matches = (t: Task) =>
    !keyword ||
    t.title.toLowerCase().includes(keyword) ||
    t.note.toLowerCase().includes(keyword);

  const visibleBlocks = BLOCKS.filter((b) => filter === 'all' || filter === b.status).filter(
    (b) => filter !== 'all' || b.status === 'active' || byStatus[b.status].some(matches),
  );

  const selectGroup = (id: string) => {
    dispatch({ type: 'selectGroup', id });
    setQuery('');
    setFilter('all');
  };

  if (!group) {
    return (
      <div className="app">
        <Sidebar activeGroupId={null} onSelect={selectGroup} />
        <main className="main">
          <div className="empty empty--page">
            <div className="empty__mark">🐳</div>
            <h2>还没建立任何分组</h2>
            <p>先在左边新建一个分组，比如「工作」或「生活」，然后往里丢待办。</p>
          </div>
        </main>
      </div>
    );
  }

  const activeCount = byStatus.active.length;
  const inactiveCount = byStatus.inactive.length;
  const doneCount = byStatus.done.length;
  const totalCount = groupTasks.length;
  const limit = group.rule.maxActive;
  const editingTask = editingTaskId
    ? data.tasks.find((t) => t.id === editingTaskId) ?? null
    : null;

  return (
    <div className="app">
      <Sidebar activeGroupId={group.id} onSelect={selectGroup} />

      <main className="main">
        <header className="topbar">
          <div className="topbar__title">
            <p className="eyebrow">
              <span className="eyebrow__dot" style={{ background: group.color }} />
              分组
            </p>
            <h1>{group.name}</h1>
            <p className="topbar__rule">{describeRule(group.rule)}</p>
          </div>

          <div className="topbar__right">
            <div className="stats">
              <span
                className={`stat stat--active ${limit != null && activeCount >= limit ? 'stat--full' : ''}`}
              >
                {activeCount}
                {limit != null ? `/${limit}` : ''} 活跃
              </span>
              <span className="stat stat--inactive">{inactiveCount} 不活跃</span>
              <span className="stat stat--done">{doneCount} 已完成</span>
            </div>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setSettingsOpen(true)}
            >
              <IconSliders width={15} height={15} />
              分组设置
            </button>
          </div>
        </header>

        <TaskComposer group={group} />

        <div className="toolbar">
          <div className="chips chips--filters">
            {FILTERS.map((f) => {
              const count = f.key === 'all' ? totalCount : byStatus[f.key as TaskStatus].length;
              return (
                <button
                  key={f.key}
                  type="button"
                  className={`chip ${filter === f.key ? 'chip--on' : ''}`}
                  onClick={() => setFilter(f.key)}
                >
                  {f.label}
                  <span className="chip__count">{count}</span>
                </button>
              );
            })}
          </div>
          <label className="search">
            <IconSearch width={15} height={15} />
            <input
              value={query}
              placeholder="搜索事项…"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search__clear"
                onClick={() => setQuery('')}
                aria-label="清空搜索"
              >
                ×
              </button>
            )}
          </label>
        </div>

        {error && <div className="banner banner--error">保存出错：{error}</div>}

        <div className="lists">
          {visibleBlocks.map((block) => {
            const tasks = byStatus[block.status].filter(matches);
            const isCollapsed = !!collapsed[block.status];
            const empty = tasks.length === 0;
            return (
              <section key={block.status} className={`block block--${block.status}`}>
                <header className="block__head">
                  <button
                    type="button"
                    className="block__toggle"
                    onClick={() =>
                      setCollapsed((prev) => ({ ...prev, [block.status]: !prev[block.status] }))
                    }
                    aria-expanded={!isCollapsed}
                  >
                    <span className={`block__caret ${isCollapsed ? 'is-collapsed' : ''}`}>▾</span>
                    <h2>{block.title}</h2>
                    <span className="block__count">{tasks.length}</span>
                    <span className="block__hint">
                      {block.status === 'active' && limit != null
                        ? `置顶处理 · 上限 ${limit}`
                        : block.hint}
                    </span>
                  </button>

                  {block.status === 'done' && doneCount > 0 && (
                    <button
                      type="button"
                      className={`btn btn--tiny ${askClearDone ? 'btn--danger-solid' : 'btn--ghost'}`}
                      onClick={() => {
                        if (!askClearDone) {
                          setAskClearDone(true);
                          setTimeout(() => setAskClearDone(false), 3000);
                          return;
                        }
                        dispatch({ type: 'clearDone', groupId: group.id });
                        setAskClearDone(false);
                      }}
                    >
                      {askClearDone ? '确认清空？' : '清空已完成'}
                    </button>
                  )}
                </header>

                {!isCollapsed &&
                  (empty ? (
                    <p className="block__empty">
                      {block.status === 'active'
                        ? keyword
                          ? '没搜到活跃事项。'
                          : '这里是空的，加一件事开始吧。'
                        : block.status === 'inactive'
                          ? '还没有沉淀下来的事项。'
                          : '还没有完成的事项。'}
                    </p>
                  ) : (
                    <ul className="task-list">
                      {tasks.map((t, i) => (
                        <TaskItem
                          key={t.id}
                          task={t}
                          group={group}
                          isFirst={i === 0}
                          isLast={i === tasks.length - 1}
                          onOpenSettings={(id) => setEditingTaskId(id)}
                        />
                      ))}
                    </ul>
                  ))}

                {block.status === 'inactive' && !empty && !isCollapsed && (
                  <p className="block__foot">
                    不活跃事项不会自动消失，点左侧「不活跃」标签就能捞回活跃区并重新计时。
                  </p>
                )}
              </section>
            );
          })}

          {keyword &&
            visibleBlocks.every((b) => byStatus[b.status].filter(matches).length === 0) && (
              <div className="empty empty--search">
                <div className="empty__mark">🐟</div>
                <p>没有找到「{query}」，换个词试试？</p>
              </div>
            )}
        </div>
      </main>

      {settingsOpen && (
        <GroupSettingsPanel group={group} onClose={() => setSettingsOpen(false)} />
      )}

      {editingTask && (
        <TaskSettingsPanel
          task={editingTask}
          group={group}
          onClose={() => setEditingTaskId(null)}
        />
      )}
    </div>
  );
}
