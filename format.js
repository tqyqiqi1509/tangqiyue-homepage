'use strict';
window.textFormat={
 render(target,value){
  target.replaceChildren();
  function append(parent,text,depth=0){
   if(depth>8){parent.append(document.createTextNode(text));return;}
   const pattern=/\*\*([\s\S]+?)\*\*|_([^_\n]+?)_|\[large\]([\s\S]+?)\[\/large\]|\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|\[highlight\]([\s\S]+?)\[\/highlight\]|\[blue\]([\s\S]+?)\[\/blue\]/g;
   let start=0;
   for(const match of text.matchAll(pattern)){
    parent.append(document.createTextNode(text.slice(start,match.index)));
    if(match[4]!==undefined){
     const anchor=document.createElement('a');
     anchor.href=match[5];
     anchor.textContent=match[4];
     parent.append(anchor);
     start=match.index+match[0].length;
     continue;
    }
    const node=document.createElement(match[1]!==undefined?'strong':match[2]!==undefined?'em':'span');
    if(match[3]!==undefined)node.className='text-large';
    if(match[6]!==undefined)node.className='text-highlight';
    if(match[7]!==undefined)node.className='text-blue';
    append(node,match[1]??match[2]??match[3]??match[6]??match[7],depth+1);parent.append(node);start=match.index+match[0].length;
   }
   parent.append(document.createTextNode(text.slice(start)));
  }
  append(target,String(value||''));
 },
 attach(field){
  if(field.dataset.formatReady)return;field.dataset.formatReady='1';
  const box=document.createElement('div');box.className='format-controls';
  const toolbar=document.createElement('div');toolbar.className='format-toolbar';toolbar.setAttribute('role','group');toolbar.setAttribute('aria-label','Text formatting');
  const preview=document.createElement('div');preview.className='format-preview';preview.setAttribute('aria-label','Formatted preview');
  const hint=document.createElement('p');hint.className='hint';hint.textContent='Select text, then choose a format. Preview below.';
  for(const [label,before,after] of [['Bold','**','**'],['Italic','_','_'],['Larger','[large]','[/large]'],['Clear formatting','','']]){
   const button=document.createElement('button');button.type='button';button.textContent=label;
   button.addEventListener('mousedown',e=>e.preventDefault());
   button.addEventListener('click',()=>{
    let start=field.selectionStart,end=field.selectionEnd;const selected=field.value.slice(start,end);
    if(!selected){hint.textContent='Select the words you want to format first.';field.focus();return;}
    let replacement;
    if(!before)replacement=selected.replace(/\*\*|\[\/?large\]|_/g,'');
    else if(selected.startsWith(before)&&selected.endsWith(after))replacement=selected.slice(before.length,-after.length);
    else if(field.value.slice(Math.max(0,start-before.length),start)===before&&field.value.slice(end,end+after.length)===after){start-=before.length;end+=after.length;replacement=selected;}
    else replacement=before+selected+after;
    if(field.maxLength>=0&&field.value.length-(end-start)+replacement.length>field.maxLength){hint.textContent='This field is too long to add formatting.';return;}
    field.setRangeText(replacement,start,end,'select');field.focus();field.dispatchEvent(new Event('input',{bubbles:true}));hint.textContent='Select text, then choose a format. Preview below.';
   });toolbar.append(button);
  }
  box.append(toolbar,hint,preview);field.closest('label').after(box);
  const refresh=()=>window.textFormat.render(preview,field.value);field.addEventListener('input',refresh);refresh();
 }
};

