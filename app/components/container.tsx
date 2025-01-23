import type { ReactNode } from "react";

export function Container({
  children,
  title,
}: {
  children?: ReactNode;
  title?: string;
}) {
  return (
    <div className="my-auto flex h-full flex-col items-center">
      <div className="h-full w-full rounded-b-2xl bg-white px-8 pb-8 pt-2 md:my-8 md:max-w-[140ch] md:rounded-t-2xl">
        {title && (
          <h1 className="mb-4 mt-4 border-b-2 border-neutral-100 pb-4 text-center text-4xl font-bold text-cyan-600">
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  );
}
