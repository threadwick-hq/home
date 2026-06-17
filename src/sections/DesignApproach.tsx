import { Col, Row } from 'antd';
import { Check } from 'iconoir-react';
import { SectionHeading } from '../components/SectionHeading';
import { StitchLegend } from '../components/StitchLegend';
import { colors } from '../theme/tokens';
import './design-approach.css';

const points = [
  'Place stitches in the order you’d crochet them — the chart grows round by round as you go.',
  'No fiddly counting or symmetry math; Threadwick works out the spacing for you.',
  'Charts use the standard crochet symbols, so they’re easy for anyone to read.',
];

export function DesignApproach() {
  return (
    <section
      aria-labelledby="approach-title"
      className="tw-section"
      style={{ background: colors.bgContainer, borderBlock: `1px solid ${colors.borderSecondary}` }}
    >
      <div className="tw-container">
        {/* Text comes first in the DOM (mobile reads heading-first); on desktop the
            tiles are ordered to the left and the text to the right. */}
        <Row gutter={[48, 40]} align="middle">
          <Col xs={24} md={{ span: 11, order: 2 }}>
            <SectionHeading
              id="approach-title"
              eyebrow="Crochet · granny squares"
              title="Chart granny squares the way you crochet them"
              lead="Threadwick Studio starts with crochet granny squares. Build a chart stitch by stitch — it follows how you actually crochet and keeps every round lined up, with no graph-paper guesswork."
            />
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 14 }}>
              {points.map((p) => (
                <li key={p} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span
                    aria-hidden
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      flex: '0 0 auto',
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      background: colors.primary,
                      color: '#fff',
                      marginTop: 1,
                    }}
                  >
                    <Check width="1em" height="1em" />
                  </span>
                  <span style={{ color: colors.textSecondary, fontSize: 16 }}>{p}</span>
                </li>
              ))}
            </ul>
          </Col>

          <Col xs={24} md={{ span: 13, order: 1 }}>
            {/* US/UK terminology toggle with zero JavaScript: native radios drive
                which legend shows via CSS :has(). Both legends are rendered so the
                switch is instant and the content is in the DOM for crawlers. */}
            <div className="tw-region">
              <div className="tw-region__head">
                <h3 style={{ margin: 0, fontSize: 16, color: colors.text }}>The symbols you’ll see</h3>
                <fieldset className="tw-segmented">
                  <legend className="tw-visually-hidden">Choose crochet terminology</legend>
                  <input
                    className="tw-segmented__input"
                    type="radio"
                    name="tw-region"
                    id="tw-region-us"
                    defaultChecked
                  />
                  <label className="tw-segmented__label" htmlFor="tw-region-us">
                    US terms
                  </label>
                  <input
                    className="tw-segmented__input"
                    type="radio"
                    name="tw-region"
                    id="tw-region-uk"
                  />
                  <label className="tw-segmented__label" htmlFor="tw-region-uk">
                    UK terms
                  </label>
                </fieldset>
              </div>
              <div className="tw-region__legend tw-region__legend--us">
                <StitchLegend region="US" />
              </div>
              <div className="tw-region__legend tw-region__legend--uk">
                <StitchLegend region="UK" />
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </section>
  );
}
