"use client";

type LoadingStateCardProps = {
  title: string;
  subtitle?: string;
  className?: string;
  spinnerClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export default function LoadingStateCard({
  title,
  subtitle,
  className = "",
  spinnerClassName = "",
  titleClassName = "",
  subtitleClassName = "",
}: LoadingStateCardProps) {
  const spinnerClasses =
    spinnerClassName.trim().length > 0
      ? spinnerClassName
      : "h-8 w-8 border-4 border-blue-600";

  return (
    <div className={`rounded-2xl border border-blue-200 bg-white p-12 shadow-lg ${className}`}>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`animate-spin rounded-full border-t-transparent ${spinnerClasses}`} />
        <div className="text-center">
          <h3 className={`mb-2 text-lg font-semibold text-gray-900 ${titleClassName}`}>{title}</h3>
          {subtitle ? (
            <p className={`text-gray-600 ${subtitleClassName}`}>{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

