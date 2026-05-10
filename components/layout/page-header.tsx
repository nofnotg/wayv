type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="mb-7">
      <h1 className="max-w-3xl font-serif text-4xl tracking-[-0.03em] text-[#18251f] md:text-5xl">
        {title}
      </h1>
      {description ? <p className="mt-3 max-w-2xl text-base leading-8 text-[#657267]">{description}</p> : null}
    </div>
  );
}
