type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

type JsonLdProps = {
  data: JsonLdValue;
  id?: string;
};

export const JsonLd = ({ data, id }: JsonLdProps) => (
  <script
    {...(id ? { id } : {})}
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);
