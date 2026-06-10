import { Info } from "lucide-react";

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  helpText?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ icon, title, description, helpText, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {helpText && (
        <div className="flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{helpText}</p>
        </div>
      )}
    </div>
  );
}
