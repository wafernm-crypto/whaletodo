import { useEffect, useMemo, useState } from 'react';
import type { AutoInactiveRule, Group, RuleCountFrom, Task } from '../core/types';
import { describeRule } from './format';
import { isActiveFull, useStore } from '../state/store';
import { useToast } from './Toast';
import { IconX } from './icons';

interface Props {
  task: Task;
  group: Group;
  onClose: () => void;
}

const DAY_PRESETS = [1, 3, 7, 14, 30];

export function TaskSettingsPanel({ task, group, onClose }: Props) {
  const { data, dispatch } = useStore();
  const toast = useToast();

  const [title, setTitle] = useState(task.title);
  const [note, setNote] = useState(task.note);
  const [useOwnRule, setUseOwnRule] = useState(task.rule != null);
  const [auto, setAuto] = useState(task.rule?.autoInactiveDays != null);
  const [days, setDays] = useState(
    String(task.rule?.autoInactiveDays ?? group.rule.autoInactiveDays ?? 7),
  );
  const [countFrom, setCountFrom] = useState<RuleCountFrom>(
    task.rule?.countFrom ?? group.rule.countFrom,
  );
  const [askDelete, setAskDelete] = useState(false);

  useEffect(() => {
    setTitle(task.title);
    setNote(task.note);
    setUseOwnRule(task.rule != null);
    setAuto(task.rule?.autoInactiveDays != null);
    setDays(String(task.rule?.autoInactiveDays ?? group.rule.autoInactiveDays ?? 7));
    setCountFrom(task.rule?.countFrom ?? group.rule.countFrom);
    setAskDelete(false);
  }, [task, group]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const full = useMemo(
    () => isActiveFull(data, group.id, task.id),
    [data, group.id, task.id],
  );

  const save = () => {
    dispatch({ type: 'updateTask', id: task.id, patch: { title, note } });
    const parsed = Math.max(1, Math.min(365, Math.round(Number(days) || 7)));
    const rule: AutoInactiveRule | null = useOwnRule
      ? { autoInactiveDays: auto ? parsed : null, countFrom }
      : null;
    dispatch({ type: 'setTaskRule', id: task.id, rule });
    onClose();
  };

  const setStatus = (status: Task['status']) => {
    if (status === 'active' && task.status !== 'active' && full) {
      toast(`活跃已满（${group.rule.maxActive} 个），先腾一个位置`, 'warn');
      return;
    }
    dispatch({ type: 'setTaskStatus', id: task.id, status });
  };

  const effectiveRule: AutoInactiveRule = useOwnRule
    ? { autoInactiveDays: auto ? Math.max(1, Number(days) || 7) : null, countFrom }
    : { autoInactiveDays: group.rule.autoInactiveDays, countFrom: group.rule.countFrom };

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="事项设置">
      <div className="drawer__scrim" onClick={onClose} />
      <div className="drawer">
        <header className="drawer__head">
          <div>
            <p className="eyebrow">事项设置</p>
            <h2>{task.title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <IconX />
          </button>
        </header>

        <div className="drawer__body">
          <label className="field">
            <span className="field__label">标题</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label className="field">
            <span className="field__label">备注</span>
            <textarea
              className="input"
              rows={3}
              value={note}
              placeholder="补充点细节，可选"
              onChange={(e) => setNote(e.target.value)}
            />
          </label>

          <div className="field">
            <span className="field__label">状态</span>
            <div className="segmented">
              <button
                type="button"
                className={`segmented__item ${task.status === 'active' ? 'is-on' : ''}`}
                onClick={() => setStatus('active')}
              >
                活跃
              </button>
              <button
                type="button"
                className={`segmented__item ${task.status === 'inactive' ? 'is-on' : ''}`}
                onClick={() => setStatus('inactive')}
              >
                不活跃
              </button>
              <button
                type="button"
                className={`segmented__item ${task.status === 'done' ? 'is-on' : ''}`}
                onClick={() => setStatus('done')}
              >
                已完成
              </button>
            </div>
            <p className="field__hint">
              活跃事项置顶显示。手动改回活跃会重新开始计时，不会被自动条件立刻压回去。
              {full && task.status !== 'active' && ' 该分组活跃额度已满，暂时无法放入活跃区。'}
            </p>
          </div>

          <div className="field">
            <span className="field__label">自动沉淀条件</span>
            <div className="radio-row">
              <button
                type="button"
                className={`radio-card ${!useOwnRule ? 'radio-card--on' : ''}`}
                onClick={() => setUseOwnRule(false)}
              >
                <strong>跟随分组</strong>
                <span>{describeRule(group.rule)}</span>
              </button>
              <button
                type="button"
                className={`radio-card ${useOwnRule ? 'radio-card--on' : ''}`}
                onClick={() => setUseOwnRule(true)}
              >
                <strong>单独设置</strong>
                <span>只对这个事项生效</span>
              </button>
            </div>
          </div>

          {useOwnRule && (
            <div className="field field--inset">
              <div className="field__row">
                <span className="field__label">启用自动沉淀</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={auto}
                  className={`switch ${auto ? 'switch--on' : ''}`}
                  onClick={() => setAuto((v) => !v)}
                >
                  <span className="switch__knob" />
                </button>
              </div>

              {auto ? (
                <>
                  <div className="chips" style={{ marginTop: 12 }}>
                    {DAY_PRESETS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`chip ${Number(days) === d ? 'chip--on' : ''}`}
                        onClick={() => setDays(String(d))}
                      >
                        {d} 天
                      </button>
                    ))}
                    <input
                      className="input input--sm input--days"
                      type="number"
                      min={1}
                      max={365}
                      value={days}
                      onChange={(e) => setDays(e.target.value)}
                      aria-label="自定义天数"
                    />
                  </div>

                  <div className="radio-row" style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className={`radio-card ${countFrom === 'created' ? 'radio-card--on' : ''}`}
                      onClick={() => setCountFrom('created')}
                    >
                      <strong>从创建算起</strong>
                      <span>创建后 N 天没被处理就沉淀</span>
                    </button>
                    <button
                      type="button"
                      className={`radio-card ${countFrom === 'activated' ? 'radio-card--on' : ''}`}
                      onClick={() => setCountFrom('activated')}
                    >
                      <strong>从激活算起</strong>
                      <span>每次重新激活都刷新计时</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="field__hint" style={{ marginTop: 8 }}>
                  这个事项永远保持活跃，不受天数条件影响。
                </p>
              )}

              <p className="field__hint" style={{ marginTop: 12 }}>
                预览：{describeRule({ ...effectiveRule, maxActive: null })}
              </p>
            </div>
          )}

          <div className="field">
            <span className="field__label">时间</span>
            <ul className="meta-list">
              <li>
                <span>创建</span>
                <span>{new Date(task.createdAt).toLocaleString('zh-CN')}</span>
              </li>
              <li>
                <span>最近激活</span>
                <span>{new Date(task.activatedAt).toLocaleString('zh-CN')}</span>
              </li>
              <li>
                <span>状态变更</span>
                <span>{new Date(task.statusChangedAt).toLocaleString('zh-CN')}</span>
              </li>
            </ul>
          </div>
        </div>

        <footer className="drawer__foot">
          <button
            type="button"
            className={`btn btn--danger-ghost ${askDelete ? 'btn--danger-solid' : ''}`}
            onClick={() => {
              if (!askDelete) {
                setAskDelete(true);
                setTimeout(() => setAskDelete(false), 3000);
                return;
              }
              dispatch({ type: 'deleteTask', id: task.id });
              onClose();
            }}
          >
            {askDelete ? '确认删除？' : '删除事项'}
          </button>
          <div className="drawer__foot-right">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              取消
            </button>
            <button type="button" className="btn btn--primary" onClick={save}>
              保存
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
