import { PropsWithChildren } from 'react';

interface MessageProps extends PropsWithChildren {
  variant?: 'info' | 'error' | 'success';
  title?: string;
}

export const Message = ({ variant = 'info', title, children }: MessageProps) => {
  return (
    <div className={`message message--${variant}`} role={variant === 'error' ? 'alert' : undefined}>
      {title && <strong>{title}</strong>}
      {children && <p>{children}</p>}
    </div>
  );
};
