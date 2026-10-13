export type GuideSource = {id:string;title:string;url:string;checkedAt:string;publishedAt?:string};
export type GuideParagraph = {text:string;sourceIds:string[]};
export type PlaceGuide = {
 placeId:string;
 title?:string;
 days?:number[];
 identityNote?:string;
 mediaNote?:string;
 overview:GuideParagraph[];
 highlights:GuideParagraph[];
 tips:GuideParagraph[];
 practical:GuideParagraph[];
 reviews:{text:string;sourceIds:string[];publishedAt?:string}[];
 photos:{url?:string;pageUrl:string;title:string;author?:string;license?:string;licenseUrl?:string}[];
 videos:{url:string;title:string;channel?:string;checkedAt:string;publishedAt?:string;note?:string}[];
 sources:GuideSource[];
};
