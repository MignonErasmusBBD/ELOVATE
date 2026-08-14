type AdminPageHeaderProps = {
  title: string;
  description: string;
};

export function AdminPageHeader({ title, description }: AdminPageHeaderProps) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight text-ink md:text-4xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-base text-text-secondary">
        {description}
      </p>
    </header>
  );
}
