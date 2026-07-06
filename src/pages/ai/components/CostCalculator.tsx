import { useMemo, useState } from 'react';
import { CALC, TIERS } from '../data';
import { c, type Copy } from '../i18n';

type CostCalculatorProps = {
  tx: (copy: Copy) => string;
};

const COPY = {
  images: c('Finished images', 'Fertige Bilder'),
  looks: c('Looks / products', 'Looks / Produkte'),
  model: c('On-model shots', 'On-Model-Aufnahmen'),
  motion: c('Motion loops', 'Motion-Loops'),
  traditional: c('Traditional production', 'Traditionelle Produktion'),
  ours: c('With Maria Bordiuh AI', 'Mit Maria Bordiuh AI'),
  savings: c('You keep', 'Sie sparen'),
  perImageNote: c('per finished image', 'pro fertigem Bild'),
  cta: c('Start with a free test shoot', 'Mit kostenlosem Test-Shooting starten'),
  customQuote: c('Custom scope — priced on inquiry', 'Individueller Umfang — Preis auf Anfrage'),
  estimate: c('estimated', 'geschätzt'),
  yes: c('Yes', 'Ja'),
  no: c('No', 'Nein'),
};

const formatEuro = (value: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);

export const CostCalculator = ({ tx }: CostCalculatorProps) => {
  const [images, setImages] = useState(15);
  const [looks, setLooks] = useState(1);
  const [withModel, setWithModel] = useState(true);
  const [motionLoops, setMotionLoops] = useState(0);

  const result = useMemo(() => {
    const shootDays = Math.max(1, Math.ceil(looks / CALC.looksPerDay));
    const traditional =
      shootDays * (CALC.photographerDay + CALC.studioDay + CALC.stylingDay) +
      (withModel ? shootDays * CALC.modelDay : 0) +
      images * CALC.postPerImage +
      (motionLoops > 0 ? CALC.motionProduction : 0);

    const starter = TIERS.find((tier) => tier.id === 'starter');
    const campaign = TIERS.find((tier) => tier.id === 'campaign');

    let ours: number | null = null;
    if (images <= 15 && looks <= 1 && motionLoops === 0 && starter?.price.founding != null) {
      ours = starter.price.founding + motionLoops * 90;
    } else if (images <= 40 && looks <= 4 && campaign?.price.founding != null) {
      ours = campaign.price.founding + Math.max(0, motionLoops - 2) * 90;
    }

    return { traditional, ours };
  }, [images, looks, withModel, motionLoops]);

  const savings = result.ours != null ? Math.max(0, result.traditional - result.ours) : null;
  const savingsPct = savings != null && result.traditional > 0 ? Math.round((savings / result.traditional) * 100) : null;

  return (
    <div className="ai-calc">
      <div className="ai-calc__controls">
        <label className="ai-calc__control">
          <span className="ai-calc__label">
            {tx(COPY.images)}: <strong>{images}</strong>
          </span>
          <input
            type="range"
            min={5}
            max={60}
            step={5}
            value={images}
            onChange={(event) => setImages(Number(event.target.value))}
          />
        </label>
        <label className="ai-calc__control">
          <span className="ai-calc__label">
            {tx(COPY.looks)}: <strong>{looks}</strong>
          </span>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={looks}
            onChange={(event) => setLooks(Number(event.target.value))}
          />
        </label>
        <div className="ai-calc__control">
          <span className="ai-calc__label">{tx(COPY.model)}</span>
          <div className="ai-calc__toggle" role="group" aria-label={tx(COPY.model)}>
            <button type="button" className={withModel ? 'is-active' : ''} onClick={() => setWithModel(true)}>
              {tx(COPY.yes)}
            </button>
            <button type="button" className={!withModel ? 'is-active' : ''} onClick={() => setWithModel(false)}>
              {tx(COPY.no)}
            </button>
          </div>
        </div>
        <label className="ai-calc__control">
          <span className="ai-calc__label">
            {tx(COPY.motion)}: <strong>{motionLoops}</strong>
          </span>
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={motionLoops}
            onChange={(event) => setMotionLoops(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="ai-calc__result">
        <div className="ai-calc__row ai-calc__row--traditional">
          <span>{tx(COPY.traditional)}</span>
          <strong>
            {formatEuro(result.traditional)} <em>({tx(COPY.estimate)})</em>
          </strong>
        </div>
        <div className="ai-calc__row ai-calc__row--ours">
          <span>{tx(COPY.ours)}</span>
          <strong>{result.ours != null ? formatEuro(result.ours) : tx(COPY.customQuote)}</strong>
        </div>
        {savings != null && savingsPct != null && savingsPct > 0 ? (
          <div className="ai-calc__savings">
            {tx(COPY.savings)} <strong>{formatEuro(savings)}</strong> (−{savingsPct}%)
          </div>
        ) : null}
        <a className="ai-button ai-button--solid" href="#ai-test-shoot">
          {tx(COPY.cta)}
        </a>
        <p className="ai-calc__disclaimer">{tx(CALC.disclaimer)}</p>
      </div>
    </div>
  );
};
