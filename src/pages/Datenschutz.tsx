import { LegalPageShell } from '../components/LegalPageShell';

type PrivacySection = {
  title: string;
  body: string[];
  bullets?: string[];
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    title: '1. Verantwortliche Stelle',
    body: [
      'Verantwortlich für die Datenverarbeitung auf dieser Website ist:',
      'Mariia Bordiuh, Bei der Hammer Kirche 5, 20535 Hamburg, Deutschland. E-Mail: mariabordiuh@gmail.com. Telefon: +49 162 2057749.',
    ],
  },
  {
    title: '2. Allgemeine Hinweise',
    body: [
      'Der Schutz Ihrer personenbezogenen Daten ist mir wichtig. Ich verarbeite personenbezogene Daten vertraulich und entsprechend der Datenschutz-Grundverordnung (DSGVO), dem Bundesdatenschutzgesetz (BDSG) sowie dem Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz (TDDDG).',
      'Diese Datenschutzerklärung erklärt, welche Daten beim Besuch meiner Website verarbeitet werden, zu welchen Zwecken das geschieht und welche Rechte Sie haben.',
    ],
  },
  {
    title: '3. Hosting, technische Bereitstellung und Portfolio-Daten',
    body: [
      'Diese Website wird mit Google Firebase bzw. Google Cloud bereitgestellt. Anbieter ist Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.',
      'Beim Aufruf der Website sowie beim Laden von Bildern, öffentlichen Projektinhalten oder Videos können technisch notwendige Daten verarbeitet werden, um die Website stabil und sicher auszuliefern.',
      'Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Mein berechtigtes Interesse liegt im sicheren Betrieb, in der stabilen Auslieferung und in der nutzerfreundlichen Darstellung meines Portfolios.',
      'Dabei kann es auch zu einer Verarbeitung durch verbundene Google-Unternehmen in Drittländern, insbesondere in den USA, kommen.',
    ],
    bullets: [
      'IP-Adresse',
      'Datum und Uhrzeit des Zugriffs',
      'aufgerufene Seiten / angeforderte Dateien',
      'Browsertyp und Browserversion',
      'Betriebssystem',
      'Referrer-URL',
      'sonstige technische Verbindungsdaten',
    ],
  },
  {
    title: '4. Consent-Banner, Local Storage und Session Storage',
    body: [
      'Diese Website verwendet ein Consent-Banner, damit Sie selbst entscheiden können, ob einfache Analysedaten erhoben werden dürfen.',
      'Dabei wird Ihre Auswahl lokal im Browser gespeichert. Zusätzlich nutzt die Website an einigen Stellen Session Storage, um Ladezustände, Caches oder kleine UI-Zustände innerhalb einer Sitzung zu halten.',
      'Rechtsgrundlage für technisch erforderliche Speicherungen ist § 25 Abs. 2 Nr. 2 TDDDG. Die datenschutzrechtliche Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Soweit Analysefunktionen nur nach Einwilligung aktiviert werden, ist Rechtsgrundlage Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG.',
    ],
  },
  {
    title: '5. Google Analytics 4',
    body: [
      'Soweit Sie eingewilligt haben, nutzt diese Website Google Analytics 4, einen Webanalysedienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.',
      'Google Analytics hilft mir zu verstehen, welche Inhalte tatsächlich geöffnet werden, welche Seiten besonders relevant sind und wie Besucher sich grundsätzlich auf der Website bewegen. Ich nutze Google Analytics nicht für Werbung, Profiling oder Remarketing.',
      'Die Verarbeitung erfolgt ausschließlich auf Grundlage Ihrer Einwilligung. Rechtsgrundlage ist Art. 6 Abs. 1 lit. a DSGVO in Verbindung mit § 25 Abs. 1 TDDDG.',
      'Google kann Daten auch in Drittländern, insbesondere in den USA, verarbeiten. Weitere Informationen finden Sie in den Datenschutzinformationen von Google unter https://policies.google.com/privacy.',
    ],
    bullets: [
      'Seitenaufrufe',
      'Geräte- und Browser-Informationen',
      'ungefähre Herkunft der Besucher',
      'Interaktionen auf der Website',
      'technische Nutzungsdaten',
    ],
  },
  {
    title: '6. Kontakt per E-Mail oder Telefon',
    body: [
      'Wenn Sie mich per E-Mail oder Telefon kontaktieren, verarbeite ich die von Ihnen übermittelten Angaben ausschließlich zur Bearbeitung Ihrer Anfrage und für eventuelle Rückfragen.',
      'Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, wenn Ihre Anfrage auf vorvertragliche Maßnahmen oder einen möglichen Auftrag gerichtet ist. In allen übrigen Fällen ist Rechtsgrundlage Art. 6 Abs. 1 lit. f DSGVO.',
    ],
  },
  {
    title: '7. Eingebettete oder extern geöffnete Videos',
    body: [
      'Auf der Website können Videoinhalte über YouTube im erweiterten Datenschutzmodus (youtube-nocookie.com) oder über Vimeo geöffnet werden.',
      'Sobald Sie einen solchen Inhalt aktiv öffnen, kann eine Verbindung zu den Servern des jeweiligen Anbieters hergestellt werden. Dabei können insbesondere Ihre IP-Adresse und technische Nutzungsdaten an den jeweiligen Anbieter übertragen werden.',
      'Bitte beachten Sie, dass für die weitere Datenverarbeitung ab diesem Zeitpunkt die Datenschutzhinweise des jeweiligen Anbieters gelten.',
    ],
  },
  {
    title: '8. Externe Links',
    body: [
      'Diese Website enthält externe Links, zum Beispiel zu LinkedIn. Wenn Sie einen solchen Link anklicken, verlassen Sie meine Website. Für die Datenverarbeitung auf der verlinkten Seite ist ausschließlich der jeweilige Anbieter verantwortlich.',
    ],
  },
  {
    title: '9. Speicherdauer',
    body: [
      'Ich speichere personenbezogene Daten nur so lange, wie dies für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.',
      'Kontaktanfragen lösche ich, sobald sie abschließend bearbeitet sind und keine gesetzlichen Gründe für eine weitere Aufbewahrung bestehen. Analysedaten werden nur im Rahmen des jeweils genutzten Dienstes bzw. meiner technischen Systeme gespeichert.',
    ],
  },
  {
    title: '10. Ihre Rechte',
    body: [
      'Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit, Widerspruch sowie den Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft.',
      'Außerdem haben Sie das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.',
    ],
    bullets: [
      'Art. 15 DSGVO – Auskunft',
      'Art. 16 DSGVO – Berichtigung',
      'Art. 17 DSGVO – Löschung',
      'Art. 18 DSGVO – Einschränkung der Verarbeitung',
      'Art. 20 DSGVO – Datenübertragbarkeit',
      'Art. 21 DSGVO – Widerspruch',
      'Art. 7 Abs. 3 DSGVO – Widerruf einer Einwilligung',
    ],
  },
  {
    title: '11. Zuständige Aufsichtsbehörde',
    body: [
      'Der Hamburgische Beauftragte für Datenschutz und Informationsfreiheit, Ludwig-Erhard-Straße 22, 20459 Hamburg, https://datenschutz-hamburg.de/.',
    ],
  },
  {
    title: '12. SSL- bzw. TLS-Verschlüsselung',
    body: [
      'Diese Website nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung.',
    ],
  },
  {
    title: '13. Änderungen dieser Datenschutzerklärung',
    body: [
      'Ich passe diese Datenschutzerklärung an, wenn sich technische Funktionen, rechtliche Anforderungen oder die tatsächliche Nutzung meiner Website ändern.',
      'Stand: Mai 2026.',
    ],
  },
];

export const Datenschutz = () => (
  <LegalPageShell
    eyebrow="Legal"
    title="Datenschutz"
    intro="Diese Version beschreibt nur die Dienste, die auf mariabordiuh.com tatsächlich genutzt werden: Firebase / Google Cloud, Google Analytics nach Einwilligung, E-Mail-Kontakt sowie externe Video- und Link-Ziele."
  >
    <div className="space-y-6">
      {PRIVACY_SECTIONS.map((section) => (
        <article
          key={section.title}
          className="rounded-[1.7rem] border border-white/10 bg-white/[0.02] p-6 md:p-8"
        >
          <h2 className="font-mono text-[11px] uppercase tracking-[0.28em] text-brand-accent">
            {section.title}
          </h2>

          <div className="mt-4 space-y-4">
            {section.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-white/72">
                {paragraph}
              </p>
            ))}
          </div>

          {section.bullets?.length ? (
            <ul className="mt-5 space-y-2 text-sm leading-relaxed text-white/68">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-[0.45rem] h-1.5 w-1.5 flex-none rounded-full bg-brand-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  </LegalPageShell>
);
