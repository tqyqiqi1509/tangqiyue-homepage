'use strict';
const $ = id => document.getElementById(id);
function selectSection(){
 const id=['about','publications','ai-results','ai-about'].includes(location.hash.slice(1))?location.hash.slice(1):'about';
 for(const section of document.querySelectorAll('main > section'))section.hidden=section.id!==id;
 for(const a of document.querySelectorAll('nav a')){if(a.hash==='#'+(id==='ai-about'?'ai-results':id))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
}
window.addEventListener('hashchange',selectSection);selectSection();
function el(tag,text,cls){const n=document.createElement(tag);n.textContent=text||'';if(cls)n.className=cls;return n;}
function link(text,url){if(!url)return null;try{if(!['https:','http:'].includes(new URL(url,location.origin).protocol))return null;}catch{return null;}const a=el('a',text);a.href=url;return a;}
function rich(tag,text,cls){const node=el(tag,'',cls);window.textFormat.render(node,text);return node;}
async function loadHomepage(){
 const response=await fetch('./content.json',{cache:'no-store'});if(!response.ok)throw new Error('Unable to load the homepage. Please refresh to try again.');
 const {content}=await response.json();
 for(const key of ['name','affiliation'])$(key).textContent=content[key]||'';
 window.textFormat.render($('short-bio'),content.shortBio);
 $('ai-about-heading').textContent=content.aiAboutTitle;
 for(const paragraph of content.aiAboutBody.split(/\n\s*\n/).filter(Boolean))$('ai-about-body').append(rich('p',paragraph));
 if(!content.aiAboutBody.trim())$('ai-about-body').append(el('p','An explanation will be added here.','empty'));
 $('footer-name').textContent=content.name;document.title=content.name+' | Mathematics';
 for(const p of content.biography)$('biography').append(rich('p',p));
 $('education-empty').hidden=!!(content.affiliation||content.biography.length);
 if(content.email){$('email').textContent=content.email;$('email').href='mailto:'+content.email;$('email').hidden=false;$('email-empty').hidden=true;}
 $('publication-empty').hidden=content.publications.length>0;
 for(const item of content.publications){
 const li=el('li');const id=item.arxivId||((item.url||'').match(/^https?:\/\/(?:www\.)?arxiv\.org\/abs\/(.+)$/)?.[1]||'');
 li.append(el('h3',item.title,'entry-title'));
 if(item.authors||item.details)li.append(el('p',[item.authors,item.details].filter(Boolean).join(' · '),'entry-meta'));
 if(id)li.append(link('arXiv:'+id,'https://arxiv.org/abs/'+id));
 if(item.description)li.append(rich('p',item.description,'entry-description'));$('publication-list').append(li);
 }
 $('ai-empty').hidden=content.aiResults.length>0;
 for(const [index,item] of content.aiResults.entries()){
 if(item.hexagonUrl){
   const paper=link('Hexagon: '+item.hexagonUrl.split('/').pop(),item.hexagonUrl);
   if(paper){
     const entry=el('article','','hexagon-result');
     const heading=el('h4','','hexagon-result-heading');
     heading.append(el('span',String(index+1).padStart(2,'0'),'result-number'),el('span',item.title,'entry-title'));
     const resources=el('p','','hexagon-result-link');
     resources.append(paper);
     entry.append(heading,resources);
     if(item.note)entry.append(rich('p','**Note:** '+item.note,'hexagon-result-note'));
     if(item.verification)entry.append(rich('p','**Verification:** '+item.verification,'hexagon-result-note'));
     $('ai-list').append(entry);
     continue;
   }
 }
 const details=el('details'),summary=el('summary');summary.append(el('span',String(index+1).padStart(2,'0'),'result-number'),el('span',item.title,'entry-title'));details.append(summary);
 const body=el('div','','result-body');
 if(item.authors||item.details)body.append(el('p',[item.authors,item.details].filter(Boolean).join(' · '),'entry-meta'));
 const links=el('div','','resource-links');for(const [label,url] of [['Paper / PDF',item.url],['Supplement',item.supplementUrl]]){const a=link(label,url);if(a)links.append(a);}if(links.children.length)body.append(links);
 for(const [label,value] of [['Abstract',item.description],['Verification status',item.verificationStatus||'Not fully verified by a human.']]){if(value)body.append(el('h4',label),rich('p',value,'entry-description'));}
 const versions=item.fileHistory||[];
 if(versions.length){
   const archive=el('details','','file-versions');archive.append(el('summary','Version history ('+versions.length+')'));const list=el('ol','','history-list');
   for(const [i,version] of versions.entries()){
     const record=el('li');record.append(el('strong','v'+(i+1)+' — '+(version.createdAt?version.createdAt.replace('T',' ').replace(/\.\d+Z$/,' UTC'):'Date not recorded')));
     const resources=el('div','','resource-links');for(const [caption,url] of [['Paper / PDF',version.url],['Supplement',version.supplementUrl]]){const a=link(caption,url);if(a)resources.append(a);}record.append(resources,rich('p',version.note,'entry-description'));list.prepend(record);
   }
   archive.append(list);body.append(archive);
 }
 const history=item.updateHistory||(item.updates?[{text:item.updates,createdAt:null}]:[]);
 if(history.length){
   body.append(el('h4','Update history'));const list=el('ol','','history-list');
   for(const update of [...history].reverse()){
     const record=el('li');record.append(el('strong',update.createdAt?update.createdAt.replace('T',' ').replace(/\.\d+Z$/,' UTC'):'Earlier update (date not recorded)'),rich('p',update.text,'entry-description'));for(const [caption,url] of [['Paper at this update',update.url],['Supplement',update.supplementUrl]]){const a=link(caption,url);if(a){a.className='update-file';record.append(a);}}list.append(record);
   }
   body.append(list);
 }
 details.append(body);$('ai-list').append(details);
 }
}
loadHomepage().catch(e=>{$('load-error').textContent=e.message;$('load-error').hidden=false;});

