export function Container({
  children,
  title,
}: {
  children?: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="my-8 w-full rounded-2xl bg-white px-9 py-2 md:w-5/6">
        {title && (
          <h1 className="m-3 text-center text-3xl text-[#3a87ad]">{title}</h1>
        )}
        {children}
      </div>
    </div>
  );
}
