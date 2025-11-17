import { InputHTMLAttributes, useId } from 'react';

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const InputField = ({ label, id, ...props }: InputFieldProps) => {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <label className="input-field" htmlFor={fieldId}>
      <span className="input-field__label">{label}</span>
      <input id={fieldId} {...props} />
    </label>
  );
};
