import { useEffect, useState } from 'react';
import type { Group, RuleCountFrom } from '../core/types';
import { GROUP_COLORS } from '../core/types';
import { useStore } from '../state/store';
import { IconX } from './icons';

interface Props {
  group: Group;
  onClose: () => void;
}

const DAY_PRESETS = [1, 3, 7, 14, 30];
const MAX_PRESETS = [1, 2, 3, 5, 8];

export function GroupSettingsPanel({ group, onClose }: Props) {
  const { data, dispatch } = useStore();
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState(group.color);
  const [auto, setAuto] = useState(group.rule.autoInactiveDays != null);
  const [days, setDays] = useState(String(group.rule.autoInactiveDays ?? 7));
  const [countFrom, setCountFrom] = useState<RuleCountFrom>(group.rule.countFrom);
  const [maxActive, setMaxActive] = useState(
    group.rule.maxActive == null ? '' : String(group.rule.maxActive),
  );
  const [askDelete, setAskDelete] = useState(false);

  useEffect(() => {
    setName(group.name);
    setColor(group.color);
    setAuto(group.rule.autoInactiveDays != null);
    setDays(String(group.rule.autoInactiveDays ?? 7));
    setCountFrom(group.rule.countFrom);
    setMaxActive(group.rule.maxActive == null ? '' : String(group.rule.maxActive));
    setAskDelete(false);
  }, [group]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const total = data.tasks.filter((t) => t.groupId === group.id).length;
  const activeCount = data.tasks.filter(
    (t) => t.groupId === group.id && t.status === 'active',
  ).length;

  const save = () => {
    const parsed = Math.max(1, Math.min(365, Math.round(Number(days) || 0)));
    const parsedMax = Math.round(Number(maxActive) || 0);
    dispatch({
      type: 'updateGroup',
      id: group.id,
      patch: {
        name,
        color,
        rule: {
          autoInactiveDays: auto ? parsed : null,
          countFrom,
          maxActive: parsedMax > 0 ? Math.min(999, parsedMax) : null,
        },
      },
    });
    onClose();
  };

  return (
    <div className="drawer-layer" role="dialog" aria-modal="true" aria-label="分组设置">
      <div className="drawer__scrim" onClick={onClose} />
      <div className="drawer">
        <header className="drawer__head">
          <div>
            <p className="eyebrow">分组设置</p>
            <h2>{group.name}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="关闭">
            <IconX />
          </button>
        </header>

        <div className="drawer__body">
          <label className="field">
            <span className="field__label">分组名称</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：工作"
            />
          </label>

          <div className="field">
            <span className="field__label">标记颜色</span>
            <div className="swatches">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`swatch ${c === color ? 'swatch--on' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`选择颜色 ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <div className="field__row">
              <span className="field__label">活跃上限</span>
              <span className="field__counter">
                当前活跃 {activeCount}
                {maxActive && Number(maxActive) > 0 ? ` / ${maxActive}` : ' · 不限'}
              </span>
            </div>
            <div className="chips">
              <button
                type="button"
                className={`chip ${!maxActive || Number(maxActive) <= 0 ? 'chip--on' : ''}`}
                onClick={() => setMaxActive('')}
              >
                不限
              </button>
              {MAX_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${Number(maxActive) === n ? 'chip--on' : ''}`}
                  onClick={() => setMaxActive(String(n))}
                >
                  {n} 个
                </button>
              ))}
              <input
                className="input input--sm input--days"
                type="number"
                min={1}
                max={999}
                value={maxActive}
                placeholder="自定义"
                onChange={(e) => setMaxActive(e.target.value)}
                aria-label="自定义活跃上限"
              />
            </div>
            <p className="field__hint">
              达到上限后，新加的事项会直接进入不活跃区，手动激活也会被拦下；勾选完成不受影响。
            </p>
          </div>

          <div className="field">
            <div className="field__row">
              <span className="field__label">自动沉淀</span>
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
            <p className="field__hint">
              开启后，活跃事项满足天数条件会自动变为不活跃；不活跃事项随时可以手动重新激活。
            </p>
          </div>

          {auto && (
            <div className="field field--inset">
              <span className="field__label">活跃超过多少天转为不活跃</span>
              <div className="chips">
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

              <span className="field__label" style={{ marginTop: 14 }}>
                计时起点
              </span>
              <div className="radio-row">
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
            </div>
          )}

          <p className="field__hint" style={{ marginTop: 18 }}>
            单个事项可以在「事项设置」里推翻这里的条件。
          </p>
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
              dispatch({ type: 'deleteGroup', id: group.id });
              onClose();
            }}
          >
            {askDelete ? `确认删除（${total} 个事项）` : '删除分组'}
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
