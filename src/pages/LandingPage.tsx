import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { Shield, Lock, Check, Unlock, Zap, Clock, Leaf, ArrowRight, Github, Twitter, FileText, ChevronDown } from 'lucide-react';
import './LandingPage.css';

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start * 10) / 10);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref} className="text-mono">{count}{suffix}</span>;
}

export function LandingPage() {
  const { isConnected, setShowWalletModal } = useApp();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (isConnected) {
      navigate('/app');
    } else {
      setShowWalletModal(true);
    }
  };

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="container-lg flex items-center justify-between" style={{ height: 64 }}>
          <div className="app-logo-landing">
            <Shield size={24} />
            <span>AlphTrust</span>
          </div>
          <button className="btn btn-primary" onClick={handleCTA}>
            {isConnected ? 'Ouvrir le Dashboard' : 'Connecter mon Wallet'}
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="hero-badge">
              <Shield size={14} /> Escrow décentralisé sur Alephium
            </div>
            <h1 className="hero-title">
              Paiements freelance en crypto.
              <br />
              <span className="hero-accent">Sans la confiance aveugle.</span>
            </h1>
            <p className="hero-subtitle">
              AlphTrust sécurise vos transactions avec un smart contract d'escrow sur Alephium.
              Le client dépose. Le freelance livre. Les fonds sont libérés. C'est tout.
            </p>

            <div className="hero-stat">
              <span className="hero-stat-number">$<AnimatedCounter target={9.9} suffix="B" /></span>
              <span className="hero-stat-label">volés en arnaques P2P en 2024</span>
            </div>

            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={handleCTA}>
                {isConnected ? 'Ouvrir le Dashboard' : 'Connecter mon Wallet'}
                <ArrowRight size={18} />
              </button>
              <a href="#how-it-works" className="btn btn-ghost btn-lg">
                Comment ça marche ? <ChevronDown size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="hero-card">
              <div className="hero-card-header">
                <span className="badge badge-active">🔵 En cours</span>
                <span className="text-sm text-secondary">#ESC-0042</span>
              </div>
              <h3>Refonte UI Dashboard DeFi</h3>
              <div className="hero-card-amount">
                <span className="text-mono" style={{ fontSize: 28, fontWeight: 600 }}>500 ALPH</span>
                <span className="text-secondary text-sm">≈ $39.50</span>
              </div>
              <div className="progress-bar" style={{ marginTop: 12 }}>
                <motion.div
                  className="progress-bar-fill"
                  style={{ background: 'var(--info)' }}
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ delay: 0.8, duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-sm text-secondary" style={{ marginTop: 6 }}>65% du temps écoulé</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="section how-it-works">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="section-title">Comment ça marche</h2>
            <p className="section-subtitle">3 étapes. Pas de compte à créer. Pas d'intermédiaire.</p>
          </motion.div>

          <div className="steps">
            {[
              { icon: <Lock size={28} />, title: 'Dépôt', desc: 'Le client crée un escrow et dépose les fonds. Ils sont verrouillés dans le smart contract.', num: '01' },
              { icon: <Check size={28} />, title: 'Livraison', desc: 'Le freelance travaille et livre. Le client vérifie le travail.', num: '02' },
              { icon: <Unlock size={28} />, title: 'Libération', desc: 'Le client valide → fonds libérés. Litige → un arbitre tranche.', num: '03' },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="step-card card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <div className="step-num">{step.num}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p className="text-secondary">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why AlphTrust */}
      <section className="section why-section">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="section-title">Pourquoi AlphTrust</h2>
          </motion.div>

          <div className="features-grid">
            {[
              { icon: <Zap size={24} />, title: '< 1% de frais', desc: 'Contre 15% sur les plateformes centralisées. Vos fonds restent les vôtres.' },
              { icon: <Shield size={24} />, title: 'Décentralisé', desc: 'Aucun intermédiaire ne contrôle vos fonds. Le smart contract est la loi.' },
              { icon: <Clock size={24} />, title: 'Deadline automatique', desc: 'Si le client disparaît, le freelance récupère ses fonds automatiquement.' },
              { icon: <Leaf size={24} />, title: 'Sur Alephium', desc: 'Rapide, pas cher, éco-responsable. 87% moins d\'énergie que Bitcoin.' },
            ].map((feat, i) => (
              <motion.div
                key={i}
                className="feature-card card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="feature-icon">{feat.icon}</div>
                <h3>{feat.title}</h3>
                <p className="text-secondary">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section comparison-section">
        <div className="container">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="section-title">Comparatif</h2>
            <p className="section-subtitle">AlphTrust vs les alternatives existantes</p>
          </motion.div>

          <motion.div
            className="comparison-table-wrapper"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <table className="comparison-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Virement direct</th>
                  <th>Upwork</th>
                  <th className="highlight-col">AlphTrust</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="feature-name">Protection acheteur</td>
                  <td><span className="comp-no">✕</span></td>
                  <td><span className="comp-yes">✓</span></td>
                  <td className="highlight-col"><span className="comp-yes">✓</span></td>
                </tr>
                <tr>
                  <td className="feature-name">Protection vendeur</td>
                  <td><span className="comp-no">✕</span></td>
                  <td><span className="comp-yes">✓</span></td>
                  <td className="highlight-col"><span className="comp-yes">✓</span></td>
                </tr>
                <tr>
                  <td className="feature-name">Frais</td>
                  <td>0%</td>
                  <td className="comp-bad">10-15%</td>
                  <td className="highlight-col"><strong style={{ color: 'var(--brand)' }}>&lt; 1%</strong></td>
                </tr>
                <tr>
                  <td className="feature-name">Décentralisé</td>
                  <td><span className="comp-neutral">—</span></td>
                  <td><span className="comp-no">✕</span></td>
                  <td className="highlight-col"><span className="comp-yes">✓</span></td>
                </tr>
                <tr>
                  <td className="feature-name">Deadline auto</td>
                  <td><span className="comp-no">✕</span></td>
                  <td><span className="comp-no">✕</span></td>
                  <td className="highlight-col"><span className="comp-yes">✓</span></td>
                </tr>
                <tr>
                  <td className="feature-name">Arbitrage</td>
                  <td><span className="comp-no">✕</span></td>
                  <td>Centralisé</td>
                  <td className="highlight-col"><strong style={{ color: 'var(--brand)' }}>Décentralisé</strong></td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta-section">
        <div className="container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2>Prêt à sécuriser vos paiements ?</h2>
            <p className="text-secondary" style={{ fontSize: 17 }}>
              Connectez votre wallet et créez votre premier escrow en moins de 2 minutes.
            </p>
            <button className="btn btn-primary btn-lg" onClick={handleCTA} style={{ marginTop: 8 }}>
              {isConnected ? 'Ouvrir le Dashboard' : 'Connecter mon Wallet'}
              <ArrowRight size={18} />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="app-logo-landing">
                <Shield size={20} />
                <span>AlphTrust</span>
              </div>
              <p className="text-secondary text-sm">Le PayPal de la crypto. Sans PayPal.</p>
            </div>
            <div className="footer-links">
              <a href="#" className="footer-link"><Github size={16} /> GitHub</a>
              <a href="#" className="footer-link"><FileText size={16} /> Docs</a>
              <a href="#" className="footer-link"><Twitter size={16} /> Twitter/X</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="text-secondary text-sm">Built on Alephium — Hackathon HACKIN'DAU 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
