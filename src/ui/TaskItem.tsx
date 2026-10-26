import { useEffect, useRef, useState } from 'react';
import type { Group, Task } from '../core/types';
import { formatRemaining, msUntilInactive, resolveTaskRule } from '../core/rules';
import { isActiveFull, useStore } from '../state/store';
import { formatRelative } from './format';
import { useToast } from './Toast';
import { IconArrowDown, IconArrowUp, IconPencil, IconSliders, IconTrash } from './icons';

interface Props {
  task: Task;
  group: Group;
  isFirst: boolean;
  isLast: boolean;
  onOpenSettings: (taskId: string) => void;
}

const STATUS_TEXT: Record<Task['status'], string> = {
  active: '活跃',
  inactive: '不活跃',
  done: '已完成',
};

export function TaskItem({ task, group, isFirst, isLast, onOpenSettings }: Props) {
  const { data, dispatch } = useStore();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const [draftNote, setDraftNote] = useState(task.note);
  const [confirming, setConfirming] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraftTitle(task.title);
      setDraftNote(task.note);
      requestAnimationFrame(() => titleRef.current?.focus());
    }
  }, [editing, task.title, task.note]);

  useEffect(() => {
    if (!confirming) return;
    const id = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(id);
  }, [confirming]);

  const save = () => {
    dispatch({ type: 'updateTask', id: task.id, patch: { title: draftTitle, note: draftNote } });
    setEditing(false);
  };

  const cancel = () => {
    setEditing(false);
    setConfirming(false);
  };

  const rule = resolveTaskRule(task, group);
  const remaining = msUntilInactive(task, rule, Date.now());
  const limit = group.rule.maxActive;
  const full = limit != null && limit > 0 && isActiveFull(data, group.id, task.id);

  let meta = '';
  if (task.status === 'done') {
    meta = formatRelative(task.completedAt) + '完成';
  } else if (task.status === 'inactive') {
    meta = formatRelative(task.statusChangedAt) + '转为不活跃';
  } else if (remaining == null) {
    meta = '活跃中 · 不会自动沉淀';
  } else {
    meta = formatRemaining(remaining);
  }

  let pillTitle = '点击改为活跃（重新计时）';
  if (task.status === 'done') {
    pillTitle = '已完成，点左侧勾选框可撤销';
  } else if (task.status === 'active') {
    pillTitle = '点击改为不活跃';
  } else if (full) {
    pillTitle = `活跃已满（${limit} 个）`;
  }

  const activate = () => {
    if (full) {
      toast(`活跃已满（${limit} 个），先处理或停用一个再放进来`, 'warn');
      return;
    }
    dispatch({ type: 'setTaskStatus', id: task.id, status: 'active' });
  };

  const onToggleStatus = () => {
    if (task.status === 'active') {
      dispatch({ type: 'setTaskStatus', id: task.id, status: 'inactive' });
    } else {
      activate();
    }
  };

  return (
    <li className={`task task--${task.status}`} data-editing={editing || undefined}>
      <button
        type="button"
        className="task__check"
        aria-label={task.status === 'done' ? '标记为未完成' : '标记为已完成'}
        title={task.status === 'done' ? '标记为未完成' : '标记为已完成'}
        onClick={() => {
          if (task.status === 'done' && full) {
            toast(`活跃已满（${limit} 个），已放回不活跃`, 'warn');
          }
          dispatch({ type: 'toggleDone', id: task.id });
        }}
      />

      <div className="task__body">
        {editing ? (
          <div className="task__editor">
            <input
              ref={titleRef}
              className="task__title-input"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') cancel();
              }}
              placeholder="事项标题"
            />
            <textarea
              className="task__note-input"
              value={draftNote}
              rows={2}
              onChange={(e) => setDraftNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save();
                if (e.key === 'Escape') cancel();
              }}
              placeholder="备注（可选），Ctrl+Enter 保存"
            />
            <div className="task__editor-actions">
              <button type="button" className="btn btn--primary btn--sm" onClick={save}>
                保存
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={cancel}>
                取消
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="task__headline">
              <button
                type="button"
                className={`status-pill status-pill--${task.status}`}
                title={pillTitle}
                disabled={task.status === 'done'}
                onClick={onToggleStatus}
              >
                {STATUS_TEXT[task.status]}
              </button>
              <p className="task__title" onDoubleClick={() => setEditing(true)} title="双击编辑">
                {task.title}
              </p>
            </div>
            {task.note && <p className="task__note">{task.note}</p>}
            <p className="task__meta">
              {meta}
              {task.rule && <span className="meta-tag">自定义条件</span>}
            </p>
          </>
        )}
      </div>

      {!editing && (
        <div className="task__actions">
          <button
            type="button"
            className="icon-btn"
            title="上移"
            aria-label="上移"
            disabled={isFirst}
            onClick={() => dispatch({ type: 'moveTask', id: task.id, dir: -1 })}
          >
            <IconArrowUp />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="下移"
            aria-label="下移"
            disabled={isLast}
            onClick={() => dispatch({ type: 'moveTask', id: task.id, dir: 1 })}
          >
            <IconArrowDown />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="编辑标题"
            aria-label="编辑标题"
            onClick={() => setEditing(true)}
          >
            <IconPencil />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="事项设置（条件 / 状态）"
            aria-label="事项设置"
            onClick={() => onOpenSettings(task.id)}
          >
            <IconSliders />
          </button>
          <button
            type="button"
            className={`icon-btn ${confirming ? 'icon-btn--danger-solid' : 'icon-btn--danger'}`}
            title={confirming ? '再点一次删除' : '删除'}
            aria-label={confirming ? '确认删除' : '删除'}
            onClick={() => {
              if (confirming) {
                dispatch({ type: 'deleteTask', id: task.id });
              } else {
                setConfirming(true);
              }
            }}
            onBlur={() => setConfirming(false)}
          >
            {confirming ? <span className="confirm-text">删除?</span> : <IconTrash />}
          </button>
        </div>
      )}
    </li>
  );
}
