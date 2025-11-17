import { InputHTMLAttributes } from 'react';
import { InputField } from './InputField';

interface TimeFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const TimeField = ({ label, ...props }: TimeFieldProps) => {
  return <InputField label={label} type="datetime-local" {...props} />;
};
