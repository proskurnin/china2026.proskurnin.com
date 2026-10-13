import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const guides=JSON.parse(readFileSync('data/place-guides.json','utf8'));
const ids=new Set();
const https=url=>{const u=new URL(url);assert.equal(u.protocol,'https:');return u;};
for(const guide of guides){
 assert.ok(guide.placeId&&!ids.has(guide.placeId),'Duplicate or missing place ID');ids.add(guide.placeId);
 const sources=new Set();
 for(const source of guide.sources){assert.ok(source.id&&!sources.has(source.id));sources.add(source.id);https(source.url);assert.match(source.checkedAt,/^\d{4}-\d{2}-\d{2}$/);}
 for(const key of ['overview','highlights','tips','practical','reviews'])for(const paragraph of guide[key]){
  assert.ok(paragraph.text?.trim());assert.ok(paragraph.sourceIds.length,'Unsourced text');
  for(const id of paragraph.sourceIds)assert.ok(sources.has(id),`Unknown source ${id}`);
 }
 for(const photo of guide.photos){https(photo.pageUrl);if(photo.url){https(photo.url);assert.ok(photo.author&&photo.license&&photo.licenseUrl,'Embedded photo requires attribution');https(photo.licenseUrl);}}
 for(const video of guide.videos){const u=https(video.url);assert.ok((u.hostname==='www.youtube.com'||u.hostname==='youtube.com')&&u.pathname==='/watch'&&/^[\w-]{11}$/.test(u.searchParams.get('v')||'')||u.hostname==='youtu.be'&&/^\/[\w-]{11}$/.test(u.pathname),'A specific YouTube video is required');assert.match(video.checkedAt,/^\d{4}-\d{2}-\d{2}$/);}
}
console.log(`Checked ${guides.length} place guides: references, dates, photo attribution and video URLs`);
