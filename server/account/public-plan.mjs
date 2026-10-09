// Public route data excludes the private budget, checklist and original document.
const financial=/(?:\d[\d\s.,–—-]*\s*(?:€|₽|\$|AMD|EUR|RUB|TRY|USD|руб)|[€₽$]\s*\d|стоимость|цена\s|средний чек)/iu;
const description=text=>typeof text==='string'?text.split(/(?<=[.!?])\s+|\n+/u).filter(part=>!financial.test(part)).join(' '):text;
export function publicPlan(plan){
 return {...plan,execution:plan.execution?{asOfDate:plan.execution.asOfDate,location:plan.execution.location}:undefined,sourceDocument:'',sourceTabs:[],expenses:[],checks:[],issues:[],
  days:plan.days.map(({sourceText,...day})=>({...day,sourceText:'',story:description(day.story),night:description(day.night)})),
  visits:plan.visits.map(({source,...visit})=>({...visit,description:description(visit.description),source:''}))};
}

export const applyRouteUpdates = plan => plan;
