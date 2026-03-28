type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="font-serif text-4xl tracking-tight text-slate-950">{title}</h1>
      {description ? <p className="mt-2 max-w-2xl text-slate-600">{description}</p> : null}
    </div>
  );
}
