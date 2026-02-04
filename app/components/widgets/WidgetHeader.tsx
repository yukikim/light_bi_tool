type Props = {
  title: string;
  onRefresh?: () => void;
};

export function WidgetHeader({ title, onRefresh }: Props) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-800 dark:text-zinc-100">
      <span>{title}</span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          再実行
        </button>
      )}
    </div>
  );
}
