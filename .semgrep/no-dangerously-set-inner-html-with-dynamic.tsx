const SPECULATION_RULES = JSON.stringify({ prerender: [] });

export function Dynamic({ html }: { html: string }) {
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Template({ name }: { name: string }) {
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <div dangerouslySetInnerHTML={{ __html: `<b>${name}</b>` }} />;
}

export function Concat({ name }: { name: string }) {
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <p dangerouslySetInnerHTML={{ __html: "<b>" + name + "</b>" }} />;
}

export function StringifyNoEscape({ data }: { data: object }) {
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function WeakReplace({ data }: { data: object }) {
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/>/g, "") }} />;
}

export function LowerCaseVariable({ data }: { data: object }) {
  const json = JSON.stringify(data);
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function WholeObject({ props }: { props: { __html: string } }) {
  // ruleid: no-dangerously-set-inner-html-with-dynamic
  return <div dangerouslySetInnerHTML={props} />;
}

export function Literal() {
  // ok: no-dangerously-set-inner-html-with-dynamic
  return <style dangerouslySetInnerHTML={{ __html: "body { margin: 0 }" }} />;
}

export function EscapedJsonLd({ data }: { data: object }) {
  // ok: no-dangerously-set-inner-html-with-dynamic
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function ConstantSpeculationRules() {
  // ok: no-dangerously-set-inner-html-with-dynamic
  return <script type="speculationrules" dangerouslySetInnerHTML={{ __html: SPECULATION_RULES }} />;
}

export function NoInnerHtml({ name }: { name: string }) {
  // ok: no-dangerously-set-inner-html-with-dynamic
  return <div className="x">{name}</div>;
}
