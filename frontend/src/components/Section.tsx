import { PropsWithChildren } from 'react';

interface SectionProps {
  title: string;
  description?: string;
}

export const Section = ({ title, description, children }: PropsWithChildren<SectionProps>) => {
  return (
    <section className="section">
      <div className="section__header">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      <div className="section__body">{children}</div>
    </section>
  );
};
