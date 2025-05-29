import React from 'react';
import { Link } from 'react-router-dom';
import './TermsOfService.css';

const TermsOfService: React.FC = () => {
  return (
    <div className="terms-container">
      <header className="terms-header">
        <Link to="/" className="back-link">← Retour au jeu</Link>
        <h1>Conditions Générales d'Utilisation</h1>
      </header>
      
      <div className="terms-content">
        <section className="terms-section">
          <h2>1. Présentation du Service</h2>
          <p>
            Grizip est un jeu de puzzle quotidien développé par l'équipe <strong>ON'Dev</strong>, 
            composée de <strong>Rabah NINI</strong>, <strong>Jawad BENJABIR</strong> et <strong>Houssam BOUFARACHAN</strong>.
          </p>
          <p>
            Le service est accessible gratuitement à l'adresse web fournie et propose des puzzles 
            quotidiens de type "zip game" où les utilisateurs doivent résoudre des grilles logiques.
          </p>
        </section>

        <section className="terms-section">
          <h2>2. Acceptation des Conditions</h2>
          <p>
            En accédant et en utilisant Grizip, vous acceptez d'être lié par ces conditions générales 
            d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </p>
        </section>

        <section className="terms-section">
          <h2>3. Utilisation du Service</h2>
          <h3>3.1 Utilisation Autorisée</h3>
          <ul>
            <li>Le service est destiné à un usage personnel et non commercial</li>
            <li>Vous pouvez jouer aux puzzles quotidiens et sauvegarder vos progrès localement</li>
            <li>Vous pouvez partager vos résultats avec d'autres utilisateurs</li>
          </ul>
          
          <h3>3.2 Utilisation Interdite</h3>
          <ul>
            <li>Utiliser le service à des fins commerciales sans autorisation</li>
            <li>Tenter de contourner les mécanismes de sécurité</li>
            <li>Reproduire, distribuer ou modifier le contenu sans permission</li>
            <li>Utiliser des bots ou scripts automatisés</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>4. Propriété Intellectuelle</h2>
          <p>
            Tous les droits de propriété intellectuelle relatifs à Grizip, incluant mais ne se limitant pas 
            au code source, aux algorithmes de génération de puzzles, au design et aux contenus, 
            appartiennent à l'équipe ON'Dev.
          </p>
          <p>
            Ce site n'est pas affilié à LinkedIn®. LinkedIn est une marque déposée de LinkedIn Corporation.
          </p>
        </section>

        <section className="terms-section">
          <h2>5. Données Personnelles et Confidentialité</h2>
          <h3>5.1 Collecte de Données</h3>
          <p>
            Grizip utilise uniquement le stockage local de votre navigateur pour sauvegarder :
          </p>
          <ul>
            <li>Vos progrès dans les puzzles</li>
            <li>Vos préférences de jeu</li>
            <li>L'historique de vos parties</li>
          </ul>
          
          <h3>5.2 Cookies et Technologies Similaires</h3>
          <p>
            Le site peut utiliser des cookies pour améliorer l'expérience utilisateur et pour 
            l'affichage de publicités pertinentes via Google AdSense.
          </p>
          
          <h3>5.3 Publicités</h3>
          <p>
            Ce site utilise Google AdSense pour afficher des publicités. Google peut utiliser 
            des cookies pour personnaliser les annonces en fonction de vos visites précédentes 
            sur ce site et d'autres sites web.
          </p>
        </section>

        <section className="terms-section">
          <h2>6. Disponibilité du Service</h2>
          <p>
            Nous nous efforçons de maintenir le service disponible 24h/24 et 7j/7, mais nous ne 
            garantissons pas une disponibilité continue. Le service peut être temporairement 
            indisponible pour maintenance ou pour des raisons techniques.
          </p>
        </section>

        <section className="terms-section">
          <h2>7. Limitation de Responsabilité</h2>
          <p>
            L'équipe ON'Dev ne peut être tenue responsable de :
          </p>
          <ul>
            <li>La perte de données sauvegardées localement</li>
            <li>Les interruptions de service</li>
            <li>Les dommages indirects liés à l'utilisation du service</li>
          </ul>
        </section>

        <section className="terms-section">
          <h2>8. Modifications des Conditions</h2>
          <p>
            Nous nous réservons le droit de modifier ces conditions générales à tout moment. 
            Les modifications prendront effet dès leur publication sur cette page. Il est de 
            votre responsabilité de consulter régulièrement ces conditions.
          </p>
        </section>

        <section className="terms-section">
          <h2>9. Droit Applicable</h2>
          <p>
            Ces conditions générales sont régies par le droit français. Tout litige sera soumis 
            à la compétence des tribunaux français.
          </p>
        </section>

        <section className="terms-section">
          <h2>10. Contact</h2>
          <p>
            Pour toute question concernant ces conditions générales, vous pouvez nous contacter 
            via notre site web <a href="https://on-dev.fr" target="_blank" rel="noopener noreferrer">ON'Dev</a>.
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

export default TermsOfService; 