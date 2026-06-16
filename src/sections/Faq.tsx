import { FAQS } from '../data/faqs';
import { SectionHeading } from '../components/SectionHeading';
import { colors } from '../theme/tokens';
import './faq.css';

/**
 * FAQ accordion built from native <details>, so it works with zero JavaScript
 * (this page ships none) and keeps every answer in the DOM for search engines and
 * AI agents. The first item starts open, matching the previous default.
 */
export function Faq() {
  return (
    <section
      aria-labelledby="faq-title"
      className="tw-section"
      style={{ background: colors.bgContainer, borderTop: `1px solid ${colors.borderSecondary}` }}
    >
      <div className="tw-container" style={{ maxWidth: 760 }}>
        <SectionHeading id="faq-title" eyebrow="Questions" title="Good to know" align="center" />
        <div className="tw-faq">
          {FAQS.map((faq, i) => (
            <details key={faq.q} className="tw-faq__item" open={i === 0}>
              <summary className="tw-faq__q">{faq.q}</summary>
              <p className="tw-faq__a">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
