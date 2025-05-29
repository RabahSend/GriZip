import React from 'react';
import { Link } from 'react-router-dom';
import './TermsOfService.css';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="terms-container">
      <header className="terms-header">
        <Link to="/" className="back-link">← Retour au jeu</Link>
        <h1>Politique de Confidentialité</h1>
      </header>
      
      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Introduction</h2>
          <p>
            La présente politique de confidentialité décrit comment <strong>Grizip</strong>, 
            développé par l'équipe <strong>ON'Dev</strong> (Rabah NINI, Jawad BENJABIR, Houssam BOUFARACHAN), 
            collecte, utilise et protège vos informations personnelles.
          </p>
          <p>
            Nous nous engageons à protéger votre vie privée et à être transparents sur nos pratiques 
            de collecte et d'utilisation des données.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Informations que nous collectons</h2>
          
          <h3>2.1 Données collectées automatiquement</h3>
          <ul>
            <li><strong>Données de jeu :</strong> Vos progrès, scores et préférences de jeu (stockés localement)</li>
            <li><strong>Données techniques :</strong> Type de navigateur, système d'exploitation, adresse IP</li>
            <li><strong>Données d'utilisation :</strong> Pages visitées, temps passé sur le site, interactions</li>
          </ul>
          
          <h3>2.2 Cookies et technologies similaires</h3>
          <p>
            Nous utilisons des cookies et des technologies similaires pour :
          </p>
          <ul>
            <li>Améliorer votre expérience de jeu</li>
            <li>Sauvegarder vos préférences</li>
            <li>Analyser l'utilisation du site</li>
            <li>Afficher des publicités pertinentes via Google AdSense</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>3. Comment nous utilisons vos informations</h2>
          <p>
            Nous utilisons les informations collectées pour :
          </p>
          <ul>
            <li>Fournir et améliorer nos services de jeu</li>
            <li>Personnaliser votre expérience utilisateur</li>
            <li>Analyser les tendances d'utilisation</li>
            <li>Afficher des publicités pertinentes</li>
            <li>Assurer la sécurité et prévenir les abus</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Google AdSense et publicités</h2>
          <p>
            Ce site utilise Google AdSense pour afficher des publicités. Google AdSense peut :
          </p>
          <ul>
            <li>Utiliser des cookies pour personnaliser les annonces</li>
            <li>Collecter des informations sur vos visites sur ce site et d'autres sites</li>
            <li>Utiliser ces informations pour vous proposer des publicités ciblées</li>
          </ul>
          
          <h3>4.1 Contrôle des publicités</h3>
          <p>
            Vous pouvez contrôler les publicités personnalisées en visitant les 
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
               paramètres des annonces Google
            </a>.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Partage des informations</h2>
          <p>
            Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers, 
            sauf dans les cas suivants :
          </p>
          <ul>
            <li><strong>Partenaires publicitaires :</strong> Google AdSense (selon leurs propres politiques)</li>
            <li><strong>Obligations légales :</strong> Si requis par la loi ou pour protéger nos droits</li>
            <li><strong>Prestataires de services :</strong> Uniquement pour fournir nos services</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>6. Stockage et sécurité des données</h2>
          
          <h3>6.1 Stockage local</h3>
          <p>
            La plupart de vos données de jeu sont stockées localement dans votre navigateur 
            et ne sont pas transmises à nos serveurs.
          </p>
          
          <h3>6.2 Sécurité</h3>
          <p>
            Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations 
            contre l'accès non autorisé, la modification, la divulgation ou la destruction.
          </p>
          
          <h3>6.3 Conservation des données</h3>
          <p>
            Nous conservons vos informations aussi longtemps que nécessaire pour fournir nos services 
            ou comme requis par la loi.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Vos droits</h2>
          <p>
            Conformément au RGPD et aux lois applicables, vous avez le droit de :
          </p>
          <ul>
            <li><strong>Accès :</strong> Demander l'accès à vos données personnelles</li>
            <li><strong>Rectification :</strong> Corriger des données inexactes</li>
            <li><strong>Suppression :</strong> Demander la suppression de vos données</li>
            <li><strong>Portabilité :</strong> Recevoir vos données dans un format structuré</li>
            <li><strong>Opposition :</strong> Vous opposer au traitement de vos données</li>
            <li><strong>Limitation :</strong> Demander la limitation du traitement</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Cookies et choix de l'utilisateur</h2>
          
          <h3>8.1 Types de cookies utilisés</h3>
          <ul>
            <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site</li>
            <li><strong>Cookies de performance :</strong> Pour analyser l'utilisation du site</li>
            <li><strong>Cookies publicitaires :</strong> Pour afficher des publicités pertinentes</li>
          </ul>
          
          <h3>8.2 Gestion des cookies</h3>
          <p>
            Vous pouvez contrôler et supprimer les cookies via les paramètres de votre navigateur. 
            Notez que la désactivation de certains cookies peut affecter le fonctionnement du site.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Liens vers des sites tiers</h2>
          <p>
            Notre site peut contenir des liens vers des sites web tiers. Nous ne sommes pas 
            responsables des pratiques de confidentialité de ces sites. Nous vous encourageons 
            à lire leurs politiques de confidentialité.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Modifications de cette politique</h2>
          <p>
            Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. 
            Les modifications seront publiées sur cette page avec une date de mise à jour révisée.
          </p>
        </section>

        <section className="terms-section">
          <h2>11. Contact</h2>
          <p>
            Pour toute question concernant cette politique de confidentialité ou pour exercer 
            vos droits, contactez-nous via notre site web 
            <a href="https://on-dev.fr" target="_blank" rel="noopener noreferrer"> ON'Dev</a>.
          </p>
        </section>

        <div className="terms-footer">
          <p><strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}</p>
          <p><strong>Équipe de développement :</strong> ON'Dev - Rabah NINI, Jawad BENJABIR, Houssam BOUFARACHAN</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 