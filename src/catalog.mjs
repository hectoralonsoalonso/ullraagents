// Closed catalogs. Sector and company-type lists are the client's own (briefing, 22/10/2026).
// Anything outside them is stored as "unclassified"; agents never invent new categories.
const SECTOR_LABELS = `Accounting · Airlines/Aviation · Alternative Dispute Resolution · Alternative Medicine · Animation · Apparel & Fashion · Architecture & Planning · Arts and Crafts · Automotive · Aviation & Aerospace · Banking · Biotechnology · Broadcast Media · Building Materials · Business Supplies and Equipment · Capital Markets · Chemicals · Civic & Social Organization · Civil Engineering · Commercial Real Estate · Computer & Network Security · Computer Games · Computer Hardware · Computer Networking · Computer Software · Construction · Consumer Electronics · Consumer Goods · Consumer Services · Cosmetics · Dairy · Defense & Space · Design · E-Learning · Education Management · Electrical/Electronic Manufacturing · Entertainment · Environmental Services · Events Services · Executive Office · Facilities Services · Farming · Financial Services · Fine Art · Fishery · Food & Beverages · Food Production · Fund-Raising · Furniture · Gambling & Casinos · Glass, Ceramics & Concrete · Government Administration · Government Relations · Graphic Design · Health, Wellness and Fitness · Higher Education · Hospital & Health Care · Hospitality · Human Resources · Import and Export · Individual & Family Services · Industrial Automation · Information Services · Information Technology and Services · Insurance · International Affairs · International Trade and Development · Internet · Investment Banking · Investment Management · Judiciary · Law Enforcement · Law Practice · Legal Services · Legislative Office · Leisure, Travel & Tourism · Libraries · Logistics and Supply Chain · Luxury Goods & Jewelry · Machinery · Management Consulting · Maritime · Market Research · Marketing and Advertising · Mechanical or Industrial Engineering · Media Production · Medical Devices · Medical Practice · Mental Health Care · Military · Mining & Metals · Mobile Games · Motion Pictures and Film · Museums and Institutions · Music · Nanotechnology · Newspapers · Non-Profit Organization Management · Oil & Energy · Online Media · Outsourcing/Offshoring · Package/Freight Delivery · Packaging and Containers · Paper & Forest Products · Performing Arts · Pharmaceuticals · Philanthropy · Photography · Plastics · Political Organization · Primary/Secondary Education · Printing · Professional Training & Coaching · Program Development · Public Policy · Public Relations and Communications · Public Safety · Publishing · Railroad Manufacture · Ranching · Real Estate · Recreational Facilities and Services · Religious Institutions · Renewables & Environment · Research · Restaurants · Retail · Security and Investigations · Semiconductors · Shipbuilding · Sporting Goods · Sports · Staffing and Recruiting · Supermarkets · Telecommunications · Textiles · Think Tanks · Tobacco · Translation and Localization · Transportation/Trucking/Railroad · Utilities · Venture Capital & Private Equity · Veterinary · Warehousing · Wholesale · Wine and Spirits · Wireless · Writing and Editing`.split(' · ');

export const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const sectors = Object.fromEntries(SECTOR_LABELS.map(l => [slugify(l), l]));
sectors.unclassified = 'Sin clasificar';

export const CATALOG = Object.freeze({
  sectors: Object.freeze(sectors),
  companyTypes: Object.freeze({ 'own-brand': 'Marca propia', manufacturer: 'Fabricante', retail: 'Retail', distributor: 'Operador o distribuidor', services: 'Servicios', unclassified: 'Sin clasificar' }),
  // What people offer / need. Shared list so offer→need can be matched exactly.
  tags: Object.freeze({
    ecommerce: 'Ecommerce y D2C', marketplaces: 'Marketplaces', 'retail-media': 'Retail media', 'paid-media': 'Paid media',
    seo: 'SEO y contenidos', crm: 'CRM y fidelización', analytics: 'Analítica y datos', ai: 'IA aplicada',
    logistics: 'Logística y fulfillment', internationalization: 'Internacionalización', branding: 'Marca y creatividad',
    pricing: 'Pricing y surtido', 'social-commerce': 'Social commerce', cx: 'Atención al cliente / CX',
    financing: 'Financiación', 'tech-platform': 'Plataforma tecnológica',
  }),
  // Off-topic themes the extractor may detect in public posts. Health, politics, religion,
  // family or other sensitive categories are deliberately absent.
  interests: Object.freeze({
    running: 'Running', padel: 'Pádel', cycling: 'Ciclismo', mountain: 'Montaña y senderismo', cooking: 'Cocina y gastronomía',
    photography: 'Fotografía', music: 'Música y conciertos', reading: 'Lectura', travel: 'Viajes', football: 'Fútbol',
    volunteering: 'Voluntariado', sailing: 'Vela y mar',
  }),
});

export const INTEREST_KEYWORDS = Object.freeze({
  running: ['running', 'correr', 'maraton', '10k', 'carrera popular', 'zancada'],
  padel: ['padel'],
  cycling: ['ciclismo', 'bici', 'gravel', 'puerto de montana en bici'],
  mountain: ['montana', 'senderismo', 'trekking', 'cumbre'],
  cooking: ['cocina', 'receta', 'gastronom', 'pintxo', 'restaurante'],
  photography: ['fotografia', 'foto ', 'fotos', 'camara', 'analogica'],
  music: ['concierto', 'musica', 'festival', 'vinilo', 'guitarra'],
  reading: ['libro', 'lectura', 'leyendo', 'lei '],
  travel: ['viaje', 'viajar', 'japon', 'escapada'],
  football: ['futbol', 'estadio', 'la liga'],
  volunteering: ['voluntariado', 'solidari', 'banco de alimentos'],
  sailing: ['regata', 'navegar', 'velero', 'vela ligera'],
});

// Conversation prompts per detected theme; used by the sniper when a post backs the topic.
export const INTEREST_PROMPTS = Object.freeze({
  running: '¿Qué carrera tienes marcada en el calendario?', padel: '¿Dónde sueles jugar?',
  cycling: '¿Qué ruta recomendarías a alguien que empieza?', mountain: '¿Cuál ha sido tu última ruta favorita?',
  cooking: '¿Qué sitio o receta recomendarías ahora mismo?', photography: '¿Qué estás fotografiando últimamente?',
  music: '¿Qué concierto te ha marcado este año?', reading: '¿Qué libro recomendarías y por qué?',
  travel: '¿Qué destino repetirías sin dudar?', football: '¿Cómo ves la temporada?',
  volunteering: '¿Cómo se puede echar una mano en esa iniciativa?', sailing: '¿Dónde sueles navegar?',
});

export const DEFAULT_NEUTRAL_QUESTIONS = Object.freeze([
  '¿Qué actividad te ayuda a desconectar del trabajo?',
  '¿Qué recomendación (libro, serie, podcast) te ha sorprendido últimamente?',
  '¿Qué lugar te gustaría descubrir este año?',
  '¿Qué habilidad fuera del trabajo te gustaría aprender?',
  '¿Qué plan recomendarías para un fin de semana en tu ciudad?',
]);

// Dated facts from a profile (attended, spoke, launched…). The sniper turns them into
// narrative icebreakers ("vi que estuviste en … la semana pasada, ¿qué tal fue?").
export const FACT_KINDS = Object.freeze({
  event: 'Asistió a un evento', talk: 'Dio una charla', achievement: 'Lanzamiento o logro', trip: 'Viaje', article: 'Escribió un artículo',
});
export const POST_KINDS = Object.freeze({ post: 'Publicación', repost: 'Republicación', ...FACT_KINDS });
