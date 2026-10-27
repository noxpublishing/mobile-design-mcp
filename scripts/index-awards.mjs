import { Store } from '../dist/store.js';
import { refreshAppleAwards } from '../dist/awards.js';
import { refreshGooglePlayAwards } from '../dist/google-awards.js';
import { dataRoot } from '../dist/mobbin.js';
const store=new Store(dataRoot());
try {
 const results=[];
 for(const [name,refresh] of [['apple',refreshAppleAwards],['google',refreshGooglePlayAwards]]){
  try{
   const result=await refresh();store.upsertApps(result.apps);
   const status={count:result.apps.length,sourceUrl:result.sourceUrl,observedAt:result.observedAt,warnings:result.warnings};
   store.setMeta('refresh:'+name,status);results.push({provider:name,...status});
  }catch(error){results.push({provider:name,error:error.message});process.exitCode=1;}
 }
 console.log(JSON.stringify({root:store.root,counts:store.counts(),results},null,2));
}finally{store.close();}
