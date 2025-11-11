"use client";

import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";

type Field = { name: string; value: string };

type DeleteLinkProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields?: Field[];
  formClassName?: string;
  className?: string;
  children: ReactNode;
};

export function DeleteLink({
  action,
  fields = [],
  formClassName,
  className,
  children,
}: DeleteLinkProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const form = formRef.current;
      if (!form) {
        return;
      }

      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.submit();
      }
    },
    [],
  );

  return (
    <form ref={formRef} action={action} className={formClassName}>
      {fields.map((field, index) => (
        <input
          key={`${field.name}-${index}`}
          type="hidden"
          name={field.name}
          value={field.value}
        />
      ))}
      <a href="#" onClick={handleClick} className={className}>
        {children}
      </a>
    </form>
  );
}
