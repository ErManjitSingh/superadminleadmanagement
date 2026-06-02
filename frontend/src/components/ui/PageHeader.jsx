export default function PageHeader({ title, description, actions, breadcrumbs }) {
  return (
    <div className="mb-8 animate-fade-up">
      {breadcrumbs && (
        <nav className="text-xs text-content-muted mb-2 flex items-center gap-1.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-content-secondary font-medium' : ''}>
                {crumb}
              </span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-content-primary tracking-tight">{title}</h1>
          {description && <p className="text-sm text-content-secondary mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
