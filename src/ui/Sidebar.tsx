import { useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { describeRule } from './format';
import { IconPlus } from './icons';

interface Props {
  activeGroupId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ activeGroupId, onSelect }: Props) {
  const { data, dispatch, saveState, dataPath } = useStore();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');

  const counts = useMemo(() => {
    const map = new Map<string, { active: number; total: number }>();
    for (const g of data.groups) map.set(g.id, { active: 0, total: 0 });
    for (const t of data.tasks) {
      const c = map.get(t.groupId);
      if (!c) continue;
      c.total += 1;
      if (t.status === 'active') c.active += 1;
    }
    return map;
  }, [data.groups, data.tasks]);

  const commit = () => {
    const name = draft.trim();
    if (name) {
      // 新分组会被 reducer 选中，这里只负责收尾
      dispatch({ type: 'addGroup', name });
    }
    setDraft('');
    setCreating(false);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__logo">🐳</span>
        <div>
          <p className="sidebar__title">鲸鱼待办</p>
          <p className="sidebar__subtitle">把今天的事，捞出来</p>
        </div>
      </div>

      <div className="sidebar__section-label">
        <span>分组</span>
        <span className="sidebar__count">{data.groups.length}</span>
      </div>

      <nav className="sidebar__groups">
        {data.groups.map((g) => {
          const c = counts.get(g.id) ?? { active: 0, total: 0 };
          const selected = g.id === activeGroupId;
          return (
            <button
              key={g.id}
              type="button"
              className={`group-item ${selected ? 'group-item--active' : ''}`}
              onClick={() => onSelect(g.id)}
              title={describeRule(g.rule)}
            >
              <span className="group-item__dot" style={{ background: g.color }} />
              <span className="group-item__name">{g.name}</span>
              <span className={`group-item__badge ${c.active === 0 ? 'group-item__badge--muted' : ''}`}>
                {c.active}
              </span>
            </button>
          );
        })}
      </nav>

      {creating ? (
        <div className="sidebar__new">
          <input
            autoFocus
            className="input input--sm"
            value={draft}
            placeholder="分组名称"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft('');
                setCreating(false);
              }
            }}
          />
        </div>
      ) : (
        <button type="button" className="btn btn--dashed" onClick={() => setCreating(true)}>
          <IconPlus width={14} height={14} />
          新建分组
        </button>
      )}

      <div className="sidebar__foot">
        <span className={`save-dot save-dot--${saveState}`} />
        <span className="sidebar__foot-text">
          {saveState === 'saving' && '正在保存…'}
          {saveState === 'saved' && '已保存到本地'}
          {saveState === 'error' && '保存失败'}
          {saveState === 'idle' && '数据存于本地'}
        </span>
        {dataPath && <span className="sidebar__path" title={dataPath}>{dataPath}</span>}
      </div>
    </aside>
  );
}
