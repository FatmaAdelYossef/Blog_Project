import { createContext, useCallback, useContext, useId, useState } from 'react';
import { cn } from '../../lib/cn';

const TabsContext = createContext(null);

function useTabsContext(component) {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error(`${component} must be used inside <Tabs>.`);
  }

  return context;
}

function idPart(value) {
  return encodeURIComponent(String(value));
}

/**
 * Tabs root. Use with `TabsList`, `TabsTrigger`, and `TabsPanel`.
 *
 * Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 *
 * @param {object} props
 * @param {string} [props.value]
 * @param {string} [props.defaultValue]
 * @param {(value: string) => void} [props.onChange]
 * @param {'horizontal' | 'vertical'} [props.orientation]
 */
export function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  className,
  children,
  ...props
}) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;
  const baseId = useId();

  const select = useCallback(
    (nextValue) => {
      if (!isControlled) setUncontrolledValue(nextValue);
      if (nextValue !== currentValue) onChange?.(nextValue);
    },
    [currentValue, isControlled, onChange],
  );

  return (
    <TabsContext.Provider
      value={{
        currentValue,
        select,
        baseId,
        orientation,
      }}
    >
      <div className={cn('flex flex-col gap-4', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

/**
 * `role="tablist"` container. Handles roving focus with Arrow keys and Home/End.
 *
 * @param {object} props
 * @param {string} [props['aria-label']]
 */
export function TabsList({ className, children, ref, ...props }) {
  const { orientation } = useTabsContext('TabsList');

  const handleKeyDown = (event) => {
    const tabs = Array.from(
      event.currentTarget.querySelectorAll('[role="tab"]:not([disabled])'),
    );

    if (tabs.length === 0) return;

    const activeTab = event.target.closest('[role="tab"]');
    const currentIndex = tabs.indexOf(activeTab);

    if (currentIndex === -1) return;

    let nextIndex = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    tabs[nextIndex].focus();
    tabs[nextIndex].click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn('flex flex-wrap items-center gap-1 border-b border-line', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * `role="tab"` trigger. Selected tab has `tabIndex={0}`; the rest are `-1`.
 *
 * @param {object} props
 * @param {string} props.value
 * @param {boolean} [props.disabled]
 */
export function TabsTrigger({ value, disabled = false, className, children, ref, ...props }) {
  const { currentValue, select, baseId } = useTabsContext('TabsTrigger');
  const selected = currentValue === value;
  const part = idPart(value);

  return (
    <button
      ref={ref}
      type="button"
      role="tab"
      id={`${baseId}-tab-${part}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${part}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      onClick={() => select(value)}
      className={cn(
        '-mb-px inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-t-md border-b-2 border-transparent px-3 py-2 text-sm font-medium text-ink-muted transition-colors',
        'hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:pointer-events-none disabled:opacity-50',
        selected && 'border-accent text-accent',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * `role="tabpanel"` panel. Kept mounted but hidden when not selected so local
 * state survives tab switches.
 *
 * @param {object} props
 * @param {string} props.value
 */
export function TabsPanel({ value, className, children, ref, ...props }) {
  const { currentValue, baseId } = useTabsContext('TabsPanel');
  const selected = currentValue === value;
  const part = idPart(value);

  return (
    <div
      ref={ref}
      role="tabpanel"
      id={`${baseId}-panel-${part}`}
      aria-labelledby={`${baseId}-tab-${part}`}
      tabIndex={0}
      hidden={!selected}
      className={cn(
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
