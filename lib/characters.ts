export type Language = "en" | "it" | "es" | "fr" | "de";

export interface Character {
  names: Record<Language, string>;
  role: Record<Language, string>;
  openingMessage: Record<Language, string>;
}

export interface LocationCharacter extends Character {
  slug: string;
  locationName: string;
}

const characters: Record<string, Character> = {
  restaurant: {
    names: {
      en: "Chris",
      it: "Carlo",
      es: "Carlos",
      fr: "Christophe",
      de: "Christian",
    },
    role: {
      en: "waiter",
      it: "cameriere",
      es: "camarero",
      fr: "serveur",
      de: "Kellner",
    },
    openingMessage: {
      en: "Welcome to our restaurant! I'm Chris, and I'll be your waiter today. What can I get for you?",
      it: "Benvenuto al nostro ristorante! Sono Carlo, sarò il vostro cameriere oggi. Cosa posso portarvi?",
      es: "¡Bienvenido a nuestro restaurante! Soy Carlos, seré su camarero hoy. ¿Qué puedo traerle?",
      fr: "Bienvenue dans notre restaurant ! Je suis Christophe, je serai votre serveur aujourd'hui. Que puis-je vous apporter ?",
      de: "Willkommen in unserem Restaurant! Ich bin Christian, ich werde heute Ihr Kellner sein. Was kann ich Ihnen bringen?",
    },
  },
  bakery: {
    names: {
      en: "Alice",
      it: "Alessia",
      es: "Alicia",
      fr: "Alice",
      de: "Alina",
    },
    role: {
      en: "baker",
      it: "fornaia",
      es: "panadera",
      fr: "boulangère",
      de: "Bäckerin",
    },
    openingMessage: {
      en: "Good morning! I'm Alice, welcome to our bakery. Everything is freshly baked this morning. What would you like?",
      it: "Buongiorno! Sono Alessia, benvenuto nella nostra panetteria. Tutto è appena sfornato stamattina. Cosa desidera?",
      es: "¡Buenos días! Soy Alicia, bienvenido a nuestra panadería. Todo está recién horneado esta mañana. ¿Qué desea?",
      fr: "Bonjour ! Je suis Alice, bienvenue dans notre boulangerie. Tout est fraîchement cuit ce matin. Que désirez-vous ?",
      de: "Guten Morgen! Ich bin Alina, willkommen in unserer Bäckerei. Alles ist heute Morgen frisch gebacken. Was möchten Sie?",
    },
  },
  school: {
    names: {
      en: "Tom",
      it: "Tommaso",
      es: "Tomás",
      fr: "Thomas",
      de: "Thomas",
    },
    role: {
      en: "teacher",
      it: "insegnante",
      es: "profesor",
      fr: "professeur",
      de: "Lehrer",
    },
    openingMessage: {
      en: "Hello there! I'm Tom, one of the teachers here. Are you new to our school? Let me show you around!",
      it: "Ciao! Sono Tommaso, uno degli insegnanti qui. Sei nuovo nella nostra scuola? Lascia che ti mostri in giro!",
      es: "¡Hola! Soy Tomás, uno de los profesores aquí. ¿Eres nuevo en nuestra escuela? ¡Déjame mostrarte el lugar!",
      fr: "Bonjour ! Je suis Thomas, l'un des professeurs ici. Êtes-vous nouveau dans notre école ? Laissez-moi vous faire visiter !",
      de: "Hallo! Ich bin Thomas, einer der Lehrer hier. Bist du neu an unserer Schule? Lass mich dir alles zeigen!",
    },
  },
  bank: {
    names: {
      en: "Sarah",
      it: "Sara",
      es: "Sara",
      fr: "Sarah",
      de: "Sarah",
    },
    role: {
      en: "bank teller",
      it: "cassiera di banca",
      es: "cajera de banco",
      fr: "guichetière",
      de: "Bankangestellte",
    },
    openingMessage: {
      en: "Good afternoon! I'm Sarah, how may I assist you with your banking needs today?",
      it: "Buon pomeriggio! Sono Sara, come posso aiutarla con le sue esigenze bancarie oggi?",
      es: "¡Buenas tardes! Soy Sara, ¿cómo puedo ayudarle con sus necesidades bancarias hoy?",
      fr: "Bon après-midi ! Je suis Sarah, comment puis-je vous aider avec vos besoins bancaires aujourd'hui ?",
      de: "Guten Tag! Ich bin Sarah, wie kann ich Ihnen heute bei Ihren Bankgeschäften behilflich sein?",
    },
  },
  hotel: {
    names: {
      en: "Martin",
      it: "Matteo",
      es: "Martín",
      fr: "Martin",
      de: "Martin",
    },
    role: {
      en: "concierge",
      it: "concierge",
      es: "conserje",
      fr: "concierge",
      de: "Concierge",
    },
    openingMessage: {
      en: "Hi, welcome to Lingua Towers! I'm Martin, the concierge. How can I help you today?",
      it: "Ciao, benvenuto a Lingua Towers! Sono Matteo, il concierge. Come posso aiutarla oggi?",
      es: "¡Hola, bienvenido a Lingua Towers! Soy Martín, el conserje. ¿Cómo puedo ayudarle hoy?",
      fr: "Bonjour, bienvenue à Lingua Towers ! Je suis Martin, le concierge. Comment puis-je vous aider aujourd'hui ?",
      de: "Hallo, willkommen in Lingua Towers! Ich bin Martin, der Concierge. Wie kann ich Ihnen heute helfen?",
    },
  },
  "grocery-store": {
    names: {
      en: "Claire",
      it: "Chiara",
      es: "Clara",
      fr: "Claire",
      de: "Klara",
    },
    role: {
      en: "store clerk",
      it: "commessa",
      es: "dependienta",
      fr: "vendeuse",
      de: "Verkäuferin",
    },
    openingMessage: {
      en: "Hi there! I'm Claire. Welcome to our grocery store! Looking for anything in particular today?",
      it: "Ciao! Sono Chiara. Benvenuto nel nostro negozio di alimentari! Cerca qualcosa in particolare oggi?",
      es: "¡Hola! Soy Clara. ¡Bienvenido a nuestra tienda de comestibles! ¿Busca algo en particular hoy?",
      fr: "Bonjour ! Je suis Claire. Bienvenue dans notre épicerie ! Vous cherchez quelque chose en particulier aujourd'hui ?",
      de: "Hallo! Ich bin Klara. Willkommen in unserem Lebensmittelgeschäft! Suchen Sie heute etwas Bestimmtes?",
    },
  },
};

export function getCharacter(slug: string, language: Language = "en"): LocationCharacter | null {
  const character = characters[slug];
  if (!character) return null;

  return {
    ...character,
    slug,
    locationName: formatLocationName(slug),
  };
}

export function getCharacterName(slug: string, language: Language = "en"): string {
  const character = characters[slug];
  return character?.names[language] ?? "";
}

export function getCharacterRole(slug: string, language: Language = "en"): string {
  const character = characters[slug];
  return character?.role[language] ?? "";
}

export function getOpeningMessage(slug: string, language: Language = "en"): string {
  const character = characters[slug];
  return character?.openingMessage[language] ?? "";
}

export function formatLocationName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Acknowledgment responses for simple echo mode
export const acknowledgmentResponses = [
  "I see, tell me more!",
  "That's interesting!",
  "Oh, I understand.",
  "Really? Go on...",
  "That sounds great!",
  "Mm-hmm, and then?",
  "How wonderful!",
  "I appreciate you sharing that.",
];

export function getRandomAcknowledgment(): string {
  return acknowledgmentResponses[Math.floor(Math.random() * acknowledgmentResponses.length)];
}



