import { useState } from 'react';
import type { Group } from '../core/types';
import { isActiveFull, useStore } from '../state/store';
import { useToast } from './Toast';
import { IconPlus } from './icons';

export function TaskComposer({ group }: { group: Group }) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);

  const limit = group.rule.maxActive;
  const full = limit != null && limit > 0 && isActiveFull(data, group.id);

  const submit = () => {
    if (!title.trim()) return;
    dispatch({ type: 'addTask', groupId: group.id, title, note });
    if (full) {
      toast(`活跃已满（${limit} 个），新事项已放进不活跃区`, 'warn');
    }
    setTitle('');
    setNote('');
    setExpanded(false);
  };

  return (
    <div className="composer">
      <div className="composer__row">
        <span className="composer__mark">
          <IconPlus width={15} height={15} />
        </span>
        <input
          className="composer__input"
          value={title}
          placeholder={
            full ? '活跃已满，新事项会先放进不活跃区…' : '添加一件事，按 Enter 保存'
          }
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
            if (e.key === 'Escape') {
              setTitle('');
              setNote('');
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={submit}
          disabled={!title.trim()}
        >
          添加
        </button>
      </div>
      {expanded && (
        <textarea
          className="composer__note"
          value={note}
          rows={2}
          placeholder="备注（可选）"
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
          }}
        />
      )}
    </div>
  );
}
