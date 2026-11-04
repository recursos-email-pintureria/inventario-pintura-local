export function TipoTitular({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={`font-display text-3xl md:text-5xl font-black leading-[0.92] tracking-tight ${className}`}
    >
      {children}
    </h1>
  );
}
export function TipoCuerpo({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={`font-sans text-base md:text-lg leading-relaxed text-ink ${className}`}>
      {children}
    </p>
  );
}
export function TipoMono({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-mono text-xs md:text-sm tracking-tight ${className}`}>{children}</span>
  );
}
export function TipoLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-sans text-[10px] font-bold uppercase tracking-widest text-ink/60 ${className}`}
    >
      {children}
    </span>
  );
}
