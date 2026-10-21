type PageLoadingProps = {
  label?: string;
};

export function PageLoading({ label = 'Loading…' }: PageLoadingProps) {
  return (
    <div className="pageload" role="status" aria-live="polite">
      <span className="pageload-ring" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}
