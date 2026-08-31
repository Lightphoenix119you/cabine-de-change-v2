export interface TutorialContent {
  title: string;
  body: string;
}

export const TUTORIALS: Record<string, TutorialContent> = {
  accueil: {
    title: 'Bienvenue sur Singularité',
    body: "Ici, retrouvez le convertisseur en direct, les statistiques du marché et les derniers taux publiés par les cabines de change de Kinshasa.",
  },
  bureaux: {
    title: 'Comparez les bureaux',
    body: "Recherchez, filtrez par commune et triez les bureaux de change. Le badge « Vérifié » signale une cabine confirmée par un administrateur — les autres sont des signalements de la communauté, à prendre avec prudence.",
  },
  carte: {
    title: 'Autour de vous',
    body: "Activez votre position pour voir la distance jusqu'à chaque bureau et boutique, trier par proximité, et obtenir un itinéraire en un tap.",
  },
  notes: {
    title: 'Notes & Mises à jour',
    body: "Retrouvez ici les annonces et informations publiées par la direction de la plateforme.",
  },
  signaler: {
    title: 'Signaler un taux',
    body: "Vous avez repéré un bureau ou un taux qui manque ? Signalez-le ici — il sera vérifié avant d'apparaître comme fiable pour les autres utilisateurs.",
  },
};
