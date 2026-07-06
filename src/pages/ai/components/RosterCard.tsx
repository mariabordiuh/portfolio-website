import { CUSTOM_IDENTITY, type RosterIdentity } from '../data';
import { c, type Copy } from '../i18n';
import { SmartImage } from './SmartImage';

const COPY = {
  available: c('Available', 'Verfügbar'),
  booked: c('Booked out', 'Ausgebucht'),
  select: c('Use for my brand', 'Für meine Marke wählen'),
  selected: c('Selected — continue below', 'Ausgewählt — unten fortfahren'),
  customCta: c('Inquire about a custom identity', 'Custom Identity anfragen'),
};

type RosterCardProps = {
  identity: RosterIdentity;
  active: boolean;
  onSelect: () => void;
  tx: (copy: Copy) => string;
};

export const RosterCard = ({ identity, active, onSelect, tx }: RosterCardProps) => (
  <article className={`ai-roster-card ${active ? 'is-active' : ''}`}>
    <div className="ai-roster-card__media">
      <SmartImage
        src={`/ai/roster/${identity.id}-portrait.jpg`}
        alt={`${identity.name} — ${tx(identity.rosterTitle)}`}
        className="ai-roster-card__img"
        placeholderClassName="ai-placeholder--roster"
        label={identity.name}
      />
      <span className={`ai-roster-card__availability ${identity.available ? 'is-available' : 'is-booked'}`}>
        {tx(identity.available ? COPY.available : COPY.booked)}
      </span>
    </div>
    <div className="ai-roster-card__header">
      <div>
        <p className="ai-roster-card__eyebrow">{tx(identity.badge)}</p>
        <h3 className="ai-roster-card__title">{identity.name}</h3>
      </div>
      <p className="ai-roster-card__subtitle">{tx(identity.rosterTitle)}</p>
    </div>
    <dl className="ai-roster-card__specs">
      {identity.stats.map((stat) => (
        <div key={stat.term.en} className="ai-roster-card__spec">
          <dt>{tx(stat.term)}</dt>
          <dd>{tx(stat.value)}</dd>
        </div>
      ))}
    </dl>
    <button type="button" className="ai-roster-card__action" onClick={onSelect}>
      {tx(active ? COPY.selected : COPY.select)}
    </button>
  </article>
);

export const CustomRosterCard = ({ tx }: { tx: (copy: Copy) => string }) => (
  <article className="ai-roster-card ai-roster-card--custom">
    <div className="ai-roster-card__media">
      <div aria-hidden="true" className="ai-placeholder ai-placeholder--roster ai-placeholder--custom">
        <span className="ai-placeholder__label">?</span>
      </div>
    </div>
    <div className="ai-roster-card__header">
      <div>
        <p className="ai-roster-card__eyebrow">{tx(CUSTOM_IDENTITY.badge)}</p>
        <h3 className="ai-roster-card__title">{tx(CUSTOM_IDENTITY.name)}</h3>
      </div>
    </div>
    <p className="ai-roster-card__custom-body">{tx(CUSTOM_IDENTITY.short)}</p>
    <a className="ai-roster-card__action" href="#ai-book">
      {tx(COPY.customCta)}
    </a>
  </article>
);
