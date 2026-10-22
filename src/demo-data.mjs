export const CATALOG = Object.freeze({
  tags: { automation:'Automatización', analytics:'Analítica de datos', security:'Ciberseguridad', design:'Diseño de producto', growth:'Crecimiento', marketing:'Marketing', finance:'Finanzas', ai:'Inteligencia artificial' },
  sectors:{ technology:'Tecnología', creative:'Servicios creativos', business:'Servicios empresariales', commerce:'Comercio' },
  companyTypes:{ agency:'Agencia', software:'Tecnológica', retail:'Comercio', consultancy:'Consultoría' },
  interests:{ running:'Running', books:'Lectura', music:'Música', hiking:'Senderismo', cooking:'Cocina', photography:'Fotografía' },
});
export function makeDemoData() {
  const events=[{id:'demo-madrid',name:'Conexiones que importan',city:'Madrid',date:'2026-11-12',time:'18:30',timezone:'Europe/Madrid'},{id:'demo-bilbao',name:'Ideas junto a la ría',city:'Bilbao',date:'2026-11-19',time:'18:00',timezone:'Europe/Madrid'}];
  const names=['Alex Vega','Noa Soler','Dani Marín','Cris Prado','Sam Robles','Ari Luna','Pau Sierra','Val Río','Eli Costa'];
  const companies=['Nube Demo','Estudio Prisma','Taller Faro','Órbita Demo','Ladera Labs','Brújula Demo','Cobalto Studio','Luz Norte','Río Digital'];
  const roles=['Producto y estrategia','Consultoría de negocio','Dirección creativa','Operaciones','Desarrollo de negocio','Marketing y datos','Fundador/a','Innovación','Alianzas'];
  const participants=[],contacts=new Map();
  for(const [ei,event] of events.entries()) for(let i=0;i<9;i++){
    const id='demo-'+(ei===0?'mad':'bil')+'-'+(i+1);
    const offers=[['automation','analytics','ai'],['security','automation'],['design','marketing'],['analytics','security'],['growth','ai'],['marketing','analytics'],['security','design'],['automation','growth'],['ai','finance']][i];
    const needs=[['security','marketing'],['automation','analytics'],['analytics','security'],['design','automation'],['analytics','marketing'],['automation','security'],['growth','analytics'],['security','marketing'],['automation','analytics']][i];
    const companyType=Object.keys(CATALOG.companyTypes)[i%4];
    participants.push({id,eventId:event.id,status:'active',synthetic:true,name:names[i]+(ei?' · B':''),role:roles[i],company:companies[i],sector:Object.keys(CATALOG.sectors)[i%4],companyType,offers,needs,buyerTypes:['agency','software','consultancy'],interests:[Object.keys(CATALOG.interests)[i%6],i%2?'books':'running']});
    contacts.set(id,{email:id+'@example.test'});
  }
  return {events,participants,contacts};
}
export function matchingProfile(p){const {id,eventId,status,synthetic,offers,needs,buyerTypes,companyType,interests}=p;return {id,eventId,status,synthetic,offers,needs,buyerTypes,companyType,interests};}
