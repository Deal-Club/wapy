import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE_URL } from "@/lib/site";

/*
  Référence de l'API du pont. Écrite pour quelqu'un qui intègre, pas pour
  quelqu'un qui évalue : chaque section répond à une question qu'on se pose le
  clavier sous les mains. Les exemples sont complets et copiables — un extrait
  qui suppose un réglage non montré fait perdre plus de temps qu'il n'en gagne.
*/
const TITRE = "Documentation du pont WhatsApp";
const DESCRIPTION =
  "Envoyer un message WhatsApp depuis votre application : points d'entrée, authentification, idempotence, limites et codes d'erreur.";

export const metadata: Metadata = {
  title: `${TITRE} · Wapy`,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/developpeurs/documentation` },
  robots: { index: true, follow: true },
};

function Bloc({ titre, children }: { titre?: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl2 border border-line bg-ink/95">
      {titre && (
        <p className="border-b border-white/10 px-4 py-2 font-mono text-xs text-cream/60">{titre}</p>
      )}
      <pre className="px-4 py-3 text-[13px] leading-relaxed text-cream">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function Section({ id, titre, children }: { id: string; titre: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="font-display text-xl font-bold">{titre}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

const ERREURS: [string, string, string][] = [
  ["400", "Requête invalide", "Champ manquant, numéro illisible, message vide ou trop long, en-tête Idempotency-Key absent."],
  ["401", "Clé refusée", "Clé absente, inconnue, ou remplacée par une plus récente."],
  ["403", "Envoi interdit", "conditions-non-acceptees, compte-non-valide, compte-suspendu, aucune-cle, destinataire-desabonne."],
  ["429", "Limite atteinte", "trop-rapide, plafond-horaire, plafond-journalier, plafond-otp-destinataire. L'en-tête Retry-After indique le délai."],
  ["502", "WhatsApp injoignable", "Votre numéro n'a pas pu émettre : session déconnectée ou WhatsApp indisponible."],
];

export default function DocumentationPont() {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader lienSecondaire={{ href: "/developpeurs", libelle: "Espace développeurs" }} />

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-display text-[1.9rem] font-bold leading-tight md:text-[2.4rem]">{TITRE}</h1>
        <p className="mt-3 text-muted">
          Un appel HTTP, et le message part de votre propre numéro WhatsApp. Aucune bibliothèque à
          installer.
        </p>

        <Section id="demarrer" titre="Démarrer">
          <p>
            Créez un compte sur l&apos;
            <Link href="/developpeurs" className="text-brand underline">espace développeurs</Link>,
            acceptez les conditions, connectez un numéro dédié aux notifications, puis générez une
            clé. Votre compte doit ensuite être validé par nous avant d&apos;émettre — vous pouvez
            écrire toute votre intégration entre-temps, les erreurs vous diront exactement où vous
            en êtes.
          </p>
          <p>
            Adresse de base : <code className="font-mono text-ink">https://wapy.pro</code>. Toutes
            les requêtes sont en <code className="font-mono text-ink">application/json</code>.
          </p>
        </Section>

        <Section id="authentification" titre="Authentification">
          <p>
            La clé se transmet dans l&apos;en-tête <code className="font-mono text-ink">Authorization</code>,
            jamais dans l&apos;URL : une clé en chaîne de requête finit dans les journaux du serveur,
            dans l&apos;historique du navigateur et dans les référents sortants.
          </p>
          <Bloc>{`Authorization: Bearer wapy_pont_VOTRE_CLE`}</Bloc>
          <p>
            Gardez-la côté serveur. Elle ne doit jamais atteindre un navigateur ni une application
            mobile : quiconque la détient peut écrire depuis votre numéro. Nous n&apos;en conservons
            que l&apos;empreinte — perdue, elle se remplace, elle ne se retrouve pas. Générer une
            nouvelle clé coupe immédiatement la précédente.
          </p>
        </Section>

        <Section id="idempotence" titre="Idempotence : l'en-tête à ne pas oublier">
          <p>
            Chaque envoi exige un en-tête{" "}
            <code className="font-mono text-ink">Idempotency-Key</code> unique. Rejouer une requête
            portant la même clé ne produit <strong>jamais</strong> un second message : la réponse
            initiale est renvoyée, avec <code className="font-mono text-ink">rejeu: true</code>.
          </p>
          <p>
            Ce n&apos;est pas une formalité. Sans elle, un délai réseau suivi d&apos;une reprise
            annonce deux fois le même paiement au même parent. Utilisez un identifiant qui décrit
            l&apos;évènement, pas l&apos;instant : l&apos;identifiant de la transaction, pas un
            horodatage.
          </p>
        </Section>

        <Section id="message" titre="Envoyer un message">
          <p>
            <code className="font-mono text-ink">POST /pont/v1/messages</code> — pour un reçu, une
            confirmation, un rappel. Le champ{" "}
            <code className="font-mono text-ink">consentement</code> est obligatoire : une référence
            attestant que le destinataire a accepté d&apos;être contacté. Nous ne pouvons pas la
            vérifier ; elle engage votre responsabilité.
          </p>
          <Bloc titre="curl">{`curl -X POST https://wapy.pro/pont/v1/messages \\
  -H "Authorization: Bearer wapy_pont_VOTRE_CLE" \\
  -H "Idempotency-Key: paiement-2026-114" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destinataire": "+22990000001",
    "texte": "Paiement reçu : 50 000 FCFA pour le 2e trimestre. Merci.",
    "consentement": "inscription-2026-114"
  }'`}</Bloc>
          <Bloc titre="Réponse">{`{ "id": 1042, "statut": "envoye", "rejeu": false }`}</Bloc>
        </Section>

        <Section id="otp" titre="Envoyer un code de vérification">
          <p>
            <code className="font-mono text-ink">POST /pont/v1/otp</code> — le corps du message est
            composé par nous à partir d&apos;un gabarit fixe : vous fournissez le code, pas le
            texte. Cela garantit qu&apos;un point d&apos;entrée conçu pour l&apos;authentification
            ne serve pas à autre chose.
          </p>
          <p>
            Le code n&apos;est ni journalisé, ni stocké, ni renvoyé dans la réponse. Limite : deux
            codes par heure et par destinataire.
          </p>
          <Bloc titre="curl">{`curl -X POST https://wapy.pro/pont/v1/otp \\
  -H "Authorization: Bearer wapy_pont_VOTRE_CLE" \\
  -H "Idempotency-Key: otp-9f3c1a" \\
  -H "Content-Type: application/json" \\
  -d '{
    "destinataire": "+22990000001",
    "code": "482913",
    "service": "Mon École",
    "minutes": 10
  }'`}</Bloc>
          <p>Le destinataire reçoit :</p>
          <Bloc>{`Votre code de vérification Mon École est 482913.
Il expire dans 10 minutes. Ne le communiquez à personne.`}</Bloc>
          <p>
            <strong>Prévoyez toujours un second canal.</strong> Si votre utilisateur n&apos;a pas
            WhatsApp sur ce téléphone, un code envoyé ici est une porte fermée : gardez le SMS ou le
            courriel en repli.
          </p>
        </Section>

        <Section id="statut" titre="Consulter l'état du compte">
          <p>
            <code className="font-mono text-ink">GET /pont/v1/statut</code> — reste consultable même
            quand l&apos;émission est bloquée : c&apos;est là que vous lisez pourquoi.
          </p>
          <Bloc titre="Réponse">{`{
  "statut": "actif",
  "peut_emettre": true,
  "blocage": "",
  "conditions_acceptees": true,
  "limites": {
    "intervalle_min_s": 3,
    "envois_par_heure": 60,
    "envois_par_jour": 500,
    "otp_par_heure_et_destinataire": 2,
    "taille_max_message": 1000
  },
  "consommation": { "derniere_heure": 12, "dernier_jour": 87 }
}`}</Bloc>
        </Section>

        <Section id="erreurs" titre="Codes d'erreur">
          <p>
            Le champ <code className="font-mono text-ink">detail</code> nomme la cause exacte. Un
            envoi refusé est tracé : rejouer la même clé d&apos;idempotence après un refus renverra
            ce refus, pas un nouvel essai — changez de clé pour réessayer.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2">Code</th>
                  <th>Sens</th>
                  <th>Cas</th>
                </tr>
              </thead>
              <tbody>
                {ERREURS.map(([code, sens, cas]) => (
                  <tr key={code} className="border-t border-line align-top">
                    <td className="py-2 pr-3 font-mono font-bold">{code}</td>
                    <td className="pr-3">{sens}</td>
                    <td className="text-muted">{cas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="limites" titre="Limites et bon usage">
          <p>
            Un intervalle minimal sépare deux envois. Cinquante paiements encaissés à midi ne
            doivent pas produire cinquante messages en dix secondes : <strong>mettez vos envois en
            file d&apos;attente</strong> et respectez le{" "}
            <code className="font-mono text-ink">Retry-After</code> renvoyé sur un 429. C&apos;est
            ce qui protège votre numéro, pas seulement notre service.
          </p>
          <p>
            Un destinataire qui répond <strong>STOP</strong> cesse définitivement d&apos;être
            joignable depuis votre compte : les envois suivants renvoient 403{" "}
            <code className="font-mono text-ink">destinataire-desabonne</code>. Traitez ce code
            comme une désinscription dans votre base, pas comme une erreur passagère.
          </p>
        </Section>

        <Section id="exemples" titre="Exemples complets">
          <Bloc titre="Node.js">{`async function envoyerRecu(numero, montant, reference) {
  const r = await fetch("https://wapy.pro/pont/v1/messages", {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${process.env.WAPY_PONT_CLE}\`,
      "Idempotency-Key": \`paiement-\${reference}\`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destinataire: numero,
      texte: \`Paiement reçu : \${montant} FCFA. Merci.\`,
      consentement: reference,
    }),
  });
  if (r.status === 429) {
    const attente = Number(r.headers.get("Retry-After") || 5);
    throw new Error(\`Limite atteinte, réessayer dans \${attente}s\`);
  }
  if (!r.ok) throw new Error((await r.json()).detail);
  return r.json();
}`}</Bloc>
          <Bloc titre="PHP">{`function envoyer_recu(string $numero, int $montant, string $reference): array {
    $ch = curl_init("https://wapy.pro/pont/v1/messages");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . getenv("WAPY_PONT_CLE"),
            "Idempotency-Key: paiement-" . $reference,
            "Content-Type: application/json",
        ],
        CURLOPT_POSTFIELDS => json_encode([
            "destinataire" => $numero,
            "texte" => "Paiement reçu : {$montant} FCFA. Merci.",
            "consentement" => $reference,
        ], JSON_UNESCAPED_UNICODE),
    ]);
    $corps = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200) {
        throw new RuntimeException("Envoi refusé : " . $corps);
    }
    return json_decode($corps, true);
}`}</Bloc>
          <Bloc titre="Python">{`import os, requests

def envoyer_recu(numero: str, montant: int, reference: str) -> dict:
    r = requests.post(
        "https://wapy.pro/pont/v1/messages",
        headers={
            "Authorization": f"Bearer {os.environ['WAPY_PONT_CLE']}",
            "Idempotency-Key": f"paiement-{reference}",
        },
        json={
            "destinataire": numero,
            "texte": f"Paiement reçu : {montant} FCFA. Merci.",
            "consentement": reference,
        },
        timeout=20,
    )
    if r.status_code == 429:
        raise RuntimeError(f"Limite atteinte, réessayer dans {r.headers.get('Retry-After', '5')}s")
    r.raise_for_status()
    return r.json()`}</Bloc>
        </Section>

        <Section id="donnees" titre="Ce que nous conservons">
          <p>
            Aucun contenu de message, aucun code de vérification, aucun numéro en clair. Nous
            gardons des métadonnées d&apos;envoi — date, genre, taille, issue — pendant
            quatre-vingt-dix jours, puis elles sont effacées. Les destinataires n&apos;apparaissent
            que sous forme d&apos;empreinte irréversible, servant uniquement à appliquer les
            limites.
          </p>
          <p>
            Le détail des engagements est dans les{" "}
            <Link href="/developpeurs/conditions" className="text-brand underline">
              conditions d&apos;utilisation
            </Link>
            .
          </p>
        </Section>
      </main>

      <SiteFooter />
    </div>
  );
}
