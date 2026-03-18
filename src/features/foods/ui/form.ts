import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext, useFieldContext, useFormContext } from '@/features/foods/ui/form.context';

export const { useAppForm, withForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});

export { useFieldContext, useFormContext };
