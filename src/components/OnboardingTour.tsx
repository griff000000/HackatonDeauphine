import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { ArrowRight, ArrowLeft, X, Rocket, MousePointerClick } from 'lucide-react';
import './OnboardingTour.css';

/* ═══════════════════════════════════════════════════════════════════
   Step definitions
   ═══════════════════════════════════════════════════════════════════ */

interface TourStep {
  target: string;
  title: string;
  body: string;
  route?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    type: 'click' | 'input' | 'role' | 'navigate';
    hint: string;
    waitForRoute?: string;
    expectedRole?: 'client' | 'freelance' | 'arbiter';
    autoFill?: string;
  };
}

const futureDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const STEPS: TourStep[] = [
  /* ══ Phase 1 : Dashboard ══ */
  {
    target: '[data-tour="stats"]',
    title: '📊 Vos statistiques',
    body: 'Vue d\'ensemble de votre activité : escrows actifs, volume verrouillé, missions terminées et litiges.',
    route: '/app',
    position: 'bottom',
  },
  {
    target: '[data-tour="filters"]',
    title: '🏷️ Filtrez vos escrows',
    body: 'Utilisez les onglets pour filtrer par statut : tous, en cours, terminés ou litiges.',
    route: '/app',
    position: 'bottom',
  },
  {
    target: '[data-tour="escrow-card"]',
    title: '💳 Carte d\'escrow',
    body: 'Chaque carte résume un escrow : statut, montant, deadline, votre rôle et la contrepartie.',
    route: '/app',
    position: 'right',
  },
  {
    target: '[data-tour="create-btn"]',
    title: '➕ Créons votre premier escrow !',
    body: 'Cliquez ici pour lancer la création et vivre le processus complet.',
    route: '/app',
    position: 'bottom',
    action: {
      type: 'navigate',
      hint: 'Cliquez sur « Créer un Escrow »',
      waitForRoute: '/app/create',
    },
  },

  /* ══ Phase 2 : Création — Étape 1 (Détails) ══ */
  {
    target: '[data-tour="step-progress"]',
    title: '📝 Formulaire en 3 étapes',
    body: 'La création se fait en 3 étapes : détails de la mission, conditions financières, puis confirmation.',
    route: '/app/create',
    position: 'bottom',
  },
  {
    target: '[data-tour="input-title"]',
    title: '🏷️ Titre de la mission',
    body: 'Donnez un titre à votre mission. Tapez quelque chose — ou attendez 3s pour le remplissage auto !',
    route: '/app/create',
    position: 'bottom',
    action: {
      type: 'input',
      hint: 'Saisissez un titre',
      autoFill: 'Audit Smart Contract DeFi',
    },
  },
  {
    target: '[data-tour="input-description"]',
    title: '📄 Description du projet',
    body: 'Décrivez le travail attendu. C\'est optionnel mais très recommandé.',
    route: '/app/create',
    position: 'bottom',
    action: {
      type: 'input',
      hint: 'Ajoutez une description',
      autoFill: 'Audit complet du contrat de lending avec rapport de vulnérabilités',
    },
  },
  {
    target: '[data-tour="input-freelance"]',
    title: '👤 Adresse du freelance',
    body: 'L\'adresse wallet Alephium du freelance qui recevra les fonds.',
    route: '/app/create',
    position: 'bottom',
    action: {
      type: 'input',
      hint: 'Entrez une adresse wallet',
      autoFill: '0x9b4c2e7f1d8a3f6c5e0b',
    },
  },
  {
    target: '[data-tour="input-arbiter"]',
    title: '⚖️ Arbitre (optionnel)',
    body: 'Un tiers de confiance désigné pour trancher en cas de litige. On peut le laisser vide.',
    route: '/app/create',
    position: 'top',
  },
  {
    target: '[data-tour="step1-next"]',
    title: '➡️ Passons aux conditions',
    body: 'Tous les champs obligatoires sont remplis. Cliquez « Suivant » pour définir le montant et la deadline.',
    route: '/app/create',
    position: 'top',
    action: {
      type: 'click',
      hint: 'Cliquez « Suivant »',
    },
  },

  /* ══ Phase 3 : Création — Étape 2 (Conditions financières) ══ */
  {
    target: '[data-tour="input-amount"]',
    title: '💰 Montant à déposer',
    body: 'Le montant en ALPH qui sera verrouillé dans le smart contract. Entrez un montant !',
    route: '/app/create',
    position: 'bottom',
    action: {
      type: 'input',
      hint: 'Entrez le montant (ex : 250)',
      autoFill: '250',
    },
  },
  {
    target: '[data-tour="input-deadline"]',
    title: '📅 Deadline de livraison',
    body: 'La date limite pour la livraison. Passé ce délai, le freelance pourra réclamer les fonds.',
    route: '/app/create',
    position: 'bottom',
    action: {
      type: 'input',
      hint: 'Choisissez une date',
      autoFill: futureDate,
    },
  },
  {
    target: '[data-tour="step2-next"]',
    title: '➡️ Récapitulatif',
    body: 'Parfait ! Les conditions sont définies. Passons au récapitulatif avant de confirmer.',
    route: '/app/create',
    position: 'top',
    action: {
      type: 'click',
      hint: 'Cliquez « Suivant »',
    },
  },

  /* ══ Phase 4 : Création — Étape 3 (Confirmation) ══ */
  {
    target: '[data-tour="recap-grid"]',
    title: '📋 Vérifiez les détails',
    body: 'Vérifiez toutes les informations avant de confirmer. Le montant sera débité de votre wallet.',
    route: '/app/create',
    position: 'right',
  },
  {
    target: '[data-tour="confirm-checkbox"]',
    title: '✅ Acceptez les conditions',
    body: 'Cochez la case pour confirmer que vous comprenez le fonctionnement de l\'escrow.',
    route: '/app/create',
    position: 'top',
    action: {
      type: 'click',
      hint: 'Cochez la case',
    },
  },
  {
    target: '[data-tour="confirm-btn"]',
    title: '🚀 Confirmez la création !',
    body: 'Tout est prêt ! Cliquez pour créer l\'escrow. Après la transaction, vous serez redirigé.',
    route: '/app/create',
    position: 'top',
    action: {
      type: 'navigate',
      hint: 'Confirmez, puis revenez au dashboard',
      waitForRoute: '/app',
    },
  },

  /* ══ Phase 5 : Explorer un escrow existant ══ */
  {
    target: '[data-tour="escrow-card"]',
    title: '🔍 Explorons un escrow',
    body: 'Bravo, votre escrow est créé ! 🎉 Cliquez maintenant sur une carte pour voir les interactions possibles.',
    route: '/app',
    position: 'right',
    action: {
      type: 'navigate',
      hint: 'Cliquez sur une carte escrow',
      waitForRoute: '/app/escrow/',
    },
  },
  {
    target: '[data-tour="detail-timeline"]',
    title: '📜 Timeline on-chain',
    body: 'Chaque événement est tracé : création, dépôt, acceptation, livraison, libération. Tout est transparent.',
    position: 'right',
  },
  {
    target: '[data-tour="detail-info"]',
    title: '📋 Informations du contrat',
    body: 'Montant verrouillé, adresses des parties, deadline, frais — toutes les données du smart contract.',
    position: 'left',
  },
  {
    target: '[data-tour="detail-actions"]',
    title: '🎮 Actions selon votre rôle',
    body: 'Les boutons changent selon votre rôle. Essayez de basculer en « Freelance » !',
    position: 'left',
  },

  /* ══ Phase 6 : Changement de rôle ══ */
  {
    target: '[data-tour="role-switcher"]',
    title: '🔄 Changez de perspective',
    body: 'Basculez en « Freelance » pour voir les actions du prestataire !',
    position: 'bottom',
    action: {
      type: 'role',
      hint: 'Cliquez sur « Freelance »',
      expectedRole: 'freelance',
    },
  },
  {
    target: '[data-tour="detail-actions"]',
    title: '🎯 Actions du Freelance',
    body: 'En tant que Freelance : accepter, livrer, réclamer. Les actions changent selon le rôle et le statut.',
    position: 'left',
  },

  /* ══ Fin ══ */
  {
    target: '[data-tour="guide-btn"]',
    title: '✅ Tour terminé !',
    body: 'Bravo ! Vous maîtrisez les bases d\'AlphTrust. Relancez ce guide à tout moment. 🚀',
    position: 'bottom',
  },
];

/* ═══════════════════════════════════════════════════════════════════
   Positioning helpers
   ═══════════════════════════════════════════════════════════════════ */

function getRect(el: Element): DOMRect {
  return el.getBoundingClientRect();
}

interface TooltipPos { top: number; left: number; arrowSide: 'top' | 'bottom' | 'left' | 'right'; }

function computeTooltipPos(
  rect: DOMRect, pos: 'top' | 'bottom' | 'left' | 'right', tw: number, th: number
): TooltipPos {
  const GAP = 14;
  let top = 0, left = 0;
  switch (pos) {
    case 'bottom': top = rect.bottom + GAP; left = rect.left + rect.width / 2 - tw / 2; break;
    case 'top':    top = rect.top - th - GAP; left = rect.left + rect.width / 2 - tw / 2; break;
    case 'right':  top = rect.top + rect.height / 2 - th / 2; left = rect.right + GAP; break;
    case 'left':   top = rect.top + rect.height / 2 - th / 2; left = rect.left - tw - GAP; break;
  }
  const vw = window.innerWidth, vh = window.innerHeight;
  if (left < 12) left = 12;
  if (left + tw > vw - 12) left = vw - tw - 12;
  if (top < 12) top = 12;
  if (top + th > vh - 12) top = vh - th - 12;

  return { top, left, arrowSide: pos === 'bottom' ? 'top' : pos === 'top' ? 'bottom' : pos === 'right' ? 'left' : 'right' };
}

/* ═══════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════ */

interface Props { onComplete: () => void; }

export function OnboardingTour({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos | null>(null);
  const [ready, setReady] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const advancedRef = useRef(false); // prevents multiple advances per step
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole } = useApp();

  const current = STEPS[step];
  const isAction = !!current.action;
  const progress = ((step + 1) / STEPS.length) * 100;

  // Reset the guard every time the step changes
  useEffect(() => { advancedRef.current = false; }, [step]);

  /* ─── Navigate to required route ─── */
  // Don't force navigation for 'navigate' action steps — those WAIT for user-driven navigation
  useEffect(() => {
    const isNavigateAction = current.action?.type === 'navigate';
    if (current.route && location.pathname !== current.route && !isNavigateAction) {
      navigate(current.route);
    }
  }, [step, current.route, current.action, location.pathname, navigate]);

  /* ─── Find & highlight target ─── */
  useEffect(() => {
    setReady(false);
    setTargetRect(null);
    setTooltipPos(null);

    const findTarget = () => {
      const el = document.querySelector(current.target);
      if (!el) return false;
      const rect = getRect(el);
      if (rect.width === 0 && rect.height === 0) return false;

      setTargetRect(rect);
      const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!inView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => { setTargetRect(getRect(el)); setReady(true); }, 350);
      } else {
        setReady(true);
      }
      return true;
    };

    if (!findTarget()) {
      const t1 = setTimeout(() => {
        if (!findTarget()) {
          const t2 = setTimeout(() => findTarget(), 400);
          return () => clearTimeout(t2);
        }
      }, 200);
      return () => clearTimeout(t1);
    }
  }, [step, current.target, location.pathname]);

  /* ─── Position tooltip ─── */
  useEffect(() => {
    if (!ready || !targetRect || !tooltipRef.current) return;
    const tw = tooltipRef.current.offsetWidth;
    const th = tooltipRef.current.offsetHeight;
    setTooltipPos(computeTooltipPos(targetRect, current.position || 'bottom', tw, th));
  }, [ready, targetRect, current.position]);

  /* ─── Recalculate on resize ─── */
  useEffect(() => {
    const handleResize = () => {
      const el = document.querySelector(current.target);
      if (el) setTargetRect(getRect(el));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [current.target]);

  /* ═══════════════════════════════════════════════════════════════
     ACTION watchers
     ═══════════════════════════════════════════════════════════════ */

  // Watch route changes (for 'navigate' action type)
  useEffect(() => {
    if (!current.action || current.action.type !== 'navigate' || advancedRef.current) return;
    const expected = current.action.waitForRoute || '';
    if (location.pathname.startsWith(expected) && location.pathname !== (current.route || '')) {
      advancedRef.current = true;
      setStep((s) => s + 1);
    }
  }, [location.pathname, current, step]);

  // Watch role changes
  useEffect(() => {
    if (!current.action || current.action.type !== 'role' || advancedRef.current) return;
    if (currentRole === current.action.expectedRole) {
      advancedRef.current = true;
      setTimeout(() => setStep((s) => s + 1), 300);
    }
  }, [currentRole, current, step]);

  // Watch input changes
  useEffect(() => {
    if (!current.action || current.action.type !== 'input') return;

    const el = document.querySelector(current.target);
    if (!el) return;

    const inputEl = el.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
    if (!inputEl) return;

    setTimeout(() => inputEl.focus(), 300);

    let advanceTimer: ReturnType<typeof setTimeout> | null = null;

    const handleInput = () => {
      if (inputEl.value.trim().length >= 3 && !advancedRef.current) {
        advancedRef.current = true;
        if (advanceTimer) clearTimeout(advanceTimer);
        advanceTimer = setTimeout(() => setStep((s) => s + 1), 600);
      }
    };

    inputEl.addEventListener('input', handleInput);
    return () => {
      inputEl.removeEventListener('input', handleInput);
      if (advanceTimer) clearTimeout(advanceTimer);
    };
  }, [step, ready, current]);

  // Auto-fill helper for input action steps
  useEffect(() => {
    if (!current.action || current.action.type !== 'input' || !current.action.autoFill) return;
    if (!ready) return;

    const el = document.querySelector(current.target);
    if (!el) return;
    const inputEl = el.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
    if (!inputEl) return;

    const timer = setTimeout(() => {
      if (inputEl.value.trim().length < 3 && current.action?.autoFill) {
        const proto = inputEl.tagName === 'TEXTAREA'
          ? window.HTMLTextAreaElement.prototype
          : window.HTMLInputElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        nativeSetter?.call(inputEl, current.action.autoFill);
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [step, ready, current]);

  // Watch click events on target (for 'click' action type)
  useEffect(() => {
    if (!current.action || current.action.type !== 'click') return;
    if (!ready || advancedRef.current) return;

    const el = document.querySelector(current.target);
    if (!el) return;

    const handleClick = () => {
      if (advancedRef.current) return;
      advancedRef.current = true;
      setTimeout(() => setStep((s) => s + 1), 300);
    };
    el.addEventListener('click', handleClick, { once: true });
    return () => el.removeEventListener('click', handleClick);
  }, [step, ready, current]);

  /* ─── Navigation ─── */
  const handleNext = useCallback(() => {
    if (step >= STEPS.length - 1) onComplete();
    else setStep((s) => s + 1);
  }, [step, onComplete]);

  const handlePrev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  /* ─── Render ─── */
  const PAD = 8;
  const cutout = targetRect ? {
    x: targetRect.left - PAD, y: targetRect.top - PAD,
    w: targetRect.width + PAD * 2, h: targetRect.height + PAD * 2, r: 10,
  } : null;

  return (
    <div className={`spotlight-overlay ${isAction ? 'action-mode' : ''}`}>
      {/* SVG overlay */}
      <svg className="spotlight-svg">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {cutout && (
              <rect x={cutout.x} y={cutout.y} width={cutout.w} height={cutout.h} rx={cutout.r} fill="black" />
            )}
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.52)" mask="url(#spotlight-mask)" />
        {cutout && (
          <rect
            x={cutout.x} y={cutout.y} width={cutout.w} height={cutout.h}
            rx={cutout.r} fill="none" stroke="var(--brand)" strokeWidth="2"
            className="spotlight-ring"
          />
        )}
      </svg>

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {ready && tooltipPos && (
          <motion.div
            key={step}
            ref={tooltipRef}
            className={`spotlight-tooltip arrow-${tooltipPos.arrowSide}`}
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="spotlight-tooltip-header">
              <div className="spotlight-progress-bar">
                <motion.div className="spotlight-progress-fill" animate={{ width: `${progress}%` }} />
              </div>
              <span className="spotlight-counter">{step + 1}/{STEPS.length}</span>
              <button className="spotlight-close" onClick={onComplete}><X size={16} /></button>
            </div>

            <h3 className="spotlight-title">{current.title}</h3>
            <p className="spotlight-body">{current.body}</p>

            <div className="spotlight-nav">
              {isAction ? (
                <div className="spotlight-action-hint">
                  <MousePointerClick size={16} />
                  <span>{current.action!.hint}</span>
                </div>
              ) : (
                <>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={handlePrev}
                    disabled={step === 0}
                    style={{ opacity: step === 0 ? 0.3 : 1 }}
                  >
                    <ArrowLeft size={14} /> Précédent
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={handleNext}>
                    {step >= STEPS.length - 1
                      ? <>C'est compris <Rocket size={14} /></>
                      : <>Suivant <ArrowRight size={14} /></>
                    }
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden tooltip for measuring */}
      {!tooltipPos && ready && (
        <div ref={tooltipRef} className="spotlight-tooltip" style={{ visibility: 'hidden', position: 'fixed', top: 0, left: 0 }}>
          <div className="spotlight-tooltip-header">
            <div className="spotlight-progress-bar" /><span className="spotlight-counter">{step + 1}/{STEPS.length}</span>
          </div>
          <h3 className="spotlight-title">{current.title}</h3>
          <p className="spotlight-body">{current.body}</p>
          <div className="spotlight-nav">
            <button className="btn btn-ghost btn-sm"><ArrowLeft size={14} /> Précédent</button>
            <button className="btn btn-primary btn-sm">Suivant <ArrowRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
