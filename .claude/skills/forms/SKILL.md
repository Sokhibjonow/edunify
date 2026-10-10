---
name: forms
description: Use when building or editing any form, input validation, or submit flow.
---

# Forms

## Rules
1. zod is the single source of truth: one schema per form in `src/schemas`, type via `z.infer`.
2. Schema error messages are i18n **keys** (`'forms.required'`), translated at render with `t()`.
3. Simple forms: controlled inputs + `useState`. `react-hook-form` only for complex flows AND only with approval.
4. Always `<form onSubmit>` + `preventDefault`. Validate with `safeParse` before submitting.
5. Submit through a React Query mutation hook. Disable submit while `isPending`.
6. Show field-level errors under each input and a form-level error above the submit button.
7. Server errors → form-level error via `getErrorKey` (see `error-handling`). Server field errors are not part of the MVP contract.
8. On success: reset the form (or navigate) and show a success toast.
9. Every input has a `<label htmlFor>`; errors linked with `aria-describedby`.
10. Auth forms use `email` + `password` only. Never `uniqueId` or `phone`.

## Template

```ts
// src/schemas/createClassFormSchema.ts
import { z } from 'zod';

export const createClassFormSchema = z.object({
  name: z.string().trim().min(1, 'forms.required').max(60, 'forms.tooLong'),
});

export type CreateClassForm = z.infer<typeof createClassFormSchema>;
```

```tsx
// src/components/classes/CreateClassForm.tsx
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createClassFormSchema, type CreateClassForm as FormValues } from '@/schemas/createClassFormSchema';
import { useCreateClass } from '@/hooks/useCreateClass';
import { useToastStore } from '@/stores/toastStore';
import { getErrorKey } from '@/utils/getErrorKey';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';

type Errors = Partial<Record<keyof FormValues, string>>;

const initial: FormValues = { name: '' };

export function CreateClassForm() {
  const { t } = useTranslation();
  const toast = useToastStore((s) => s.show);
  const { mutate, isPending } = useCreateClass();
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsed = createClassFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    mutate(parsed.data, {
      onSuccess: () => {
        setValues(initial);
        toast({ type: 'success', messageKey: 'classes.created' });
      },
      onError: (err) => setFormError(getErrorKey(err)),
    });
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2.5">
      <Field
        id="class-name"
        label={t('classes.form.name')}
        value={values.name}
        onChange={(name) => setValues((v) => ({ ...v, name }))}
        error={errors.name && t(errors.name)}
      />

      {formError && (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {t(formError)}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}
```

```tsx
// src/components/ui/Field.tsx
type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
};

export function Field({ id, label, value, onChange, error, type = 'text' }: Props) {
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--color-text)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="rounded-lg border border-[var(--color-line)] bg-(--color-surface) p-2.5 text-[15px] text-[var(--color-text)]"
      />
      {error && (
        <p id={errorId} className="text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
```
`--color-danger` must exist in `src/theme.ts`. Add it there if missing; never hardcode red.
