/* Calendário de disponibilidade + pedido de orçamento (Casa Coral).
   Lê disponibilidade.json: {atualizado, ocupado:[[chegada,saida]], regras:{minimo, pacotes:[{nome,checkin,checkout}]}}
   Datas são noites: uma reserva ocupa de chegada (inclusive) até saída (exclusive). */
(function(){
var CFG=window.CC_CFG||{canal:'ig'};
var M=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
var hoje=new Date();hoje.setHours(0,0,0,0);
var occ=[],pac=[],minimo=2,ci=null,co=null;
var ano=Math.min(2027,Math.max(2026,hoje.getFullYear()));
var el=document.getElementById('cal'),bt=document.querySelectorAll('.calnav button'),info=document.getElementById('calinfo');
function d(s){var p=String(s).trim().split(/[-/]/);if(p.length!==3)return null;var y,m,dd;if(p[0].length===4){y=+p[0];m=+p[1];dd=+p[2];}else{dd=+p[0];m=+p[1];y=+p[2];}var r=new Date(y,m-1,dd);return isNaN(r)?null:r;}
function add(x,n){var r=new Date(x);r.setDate(r.getDate()+n);return r;}
function key(x){return x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate();}
function br(x){return String(x.getDate()).padStart(2,'0')+'/'+String(x.getMonth()+1).padStart(2,'0')+'/'+x.getFullYear();}
function nt(n){return n+(n===1?' noite':' noites');}
function noites(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/864e5);}
function busy(x){for(var i=0;i<occ.length;i++)if(x>=occ[i][0]&&x<occ[i][1])return true;return false;}
function pacDe(x){for(var i=0;i<pac.length;i++)if(x>=pac[i].a&&x<pac[i].b)return pac[i];return null;}
function livre(a,b){for(var x=new Date(a);x<b;x=add(x,1))if(busy(x))return false;return true;}
/* Valida um intervalo: devolve texto do problema ou '' */
function problema(a,b){
  if(!(b>a))return 'A saída precisa ser depois da chegada.';
  if(!livre(a,b))return 'Parte dessas datas já está reservada.';
  for(var i=0;i<pac.length;i++){var p=pac[i];if(a<p.b&&b>p.a&&!(a<=p.a&&b>=p.b))return 'No feriado de '+p.nome+' a casa só é alugada no pacote fechado: '+br(p.a)+' a '+br(p.b)+'.';}
  var cobre=pac.some(function(p){return a<=p.a&&b>=p.b;});
  if(!cobre&&noites(a,b)<minimo)return 'O mínimo é de '+minimo+' diárias.';
  return '';
}
function mes(y,m){
  var f=new Date(y,m,1),n=new Date(y,m+1,0).getDate(),h='<div class="mes"><h3>'+M[m]+' '+y+'</h3><table><thead><tr>';
  ['D','S','T','Q','Q','S','S'].forEach(function(w){h+='<th>'+w+'</th>';});h+='</tr></thead><tbody><tr>';
  for(var i=0;i<f.getDay();i++)h+='<td></td>';
  for(var dd=1;dd<=n;dd++){
    var x=new Date(y,m,dd),c=[],t='',p=pacDe(x),pode=x>=hoje;
    if(x<hoje)c.push('pa');else if(busy(x))c.push('oc');
    if(p&&!busy(x)&&x>=hoje)c.push('fe');
    if(+x===+hoje)c.push('hj');
    if(ci&&co&&x>=ci&&x<co)c.push('sel');
    if(ci&&+x===+ci)c.push('ini');
    if(ci&&!co&&x>ci&&x<add(ci,minimo)&&!pacDe(ci))c.push('min');
    if(c.indexOf('oc')>-1)t='Reservado';else if(p&&pode)t='Feriado de '+p.nome+': pacote fechado de '+br(p.a)+' a '+br(p.b);
    /* dia de saída de uma reserva ainda pode ser escolhido como saída; só bloqueia como chegada */
    var clicavel=pode&&(!busy(x)||(ci&&!co&&x>ci));
    h+='<td class="'+c.join(' ')+'"'+(t?' title="'+t+'"':'')+'>'+(clicavel?'<button type="button" data-d="'+key(x)+'" aria-label="'+br(x)+(t?', '+t:'')+'">'+dd+'</button>':dd)+'</td>';
    if((f.getDay()+dd)%7===0&&dd<n)h+='</tr><tr>';
  }
  return h+'</tr></tbody></table></div>';
}
function draw(){
  var h='',m0=(ano===hoje.getFullYear())?hoje.getMonth():0;for(var m=m0;m<12;m++)h+=mes(ano,m);el.innerHTML=h;
  for(var i=0;i<bt.length;i++)bt[i].setAttribute('aria-pressed',+bt[i].dataset.y===ano);
  resumo();
}
function resumo(msg){
  var a=document.getElementById('o-in'),b=document.getElementById('o-out');
  a.textContent=ci?br(ci):'Escolha no calendário';b.textContent=co?br(co)+' ('+nt(noites(ci,co))+')':(ci?'Agora toque no dia da saída':'—');
  var p=ci&&co?problema(ci,co):'';
  info.textContent=msg||p||(ci&&!co?(pacDe(ci)?'':'Mínimo de '+minimo+' diárias.'):'');
  info.className='calmsg'+((msg||p)?' erro':'');
  document.getElementById('o-btn').disabled=!(ci&&co&&!p);
}
el.addEventListener('click',function(e){
  var b=e.target.closest('button[data-d]');if(!b)return;
  var x=d(b.dataset.d.split('-').map(function(v){return v.padStart(2,'0');}).join('-')),p=pacDe(x);
  if(p&&(!ci||co||x<=ci)){ci=p.a<hoje?hoje:p.a;co=p.b;draw();resumo(problema(ci,co)||'Feriado de '+p.nome+': pacote fechado de '+nt(noites(ci,co))+'.');info.className='calmsg'+(problema(ci,co)?' erro':'');return;}
  if(!ci||co||x<=ci){if(busy(x))return;ci=x;co=null;draw();return;}
  co=x;draw();
});
for(var i=0;i<bt.length;i++)bt[i].onclick=function(){ano=+this.dataset.y;draw();};
document.getElementById('o-limpar').onclick=function(){ci=co=null;draw();};
document.getElementById('orc').addEventListener('submit',function(e){
  e.preventDefault();if(!(ci&&co)||problema(ci,co))return;
  var f=e.target,nome=f.nome.value.trim(),pes=f.pessoas.value,obs=f.obs.value.trim();
  var txt='Olá! Vi o site da Casa Coral e gostaria de um orçamento.\n'+(nome?'Nome: '+nome+'\n':'')+'Chegada: '+br(ci)+'\nSaída: '+br(co)+' ('+noites(ci,co)+' noites)\nPessoas: '+pes+(obs?'\nObservação: '+obs:'');
  if(CFG.canal==='wa'&&CFG.w){
    var n=CFG.w.map(function(c){return String.fromCharCode(c-7);}).reverse().join('');
    window.open('https://wa.me/'+n+'?text='+encodeURIComponent(txt),'_blank','noopener');
  }else{
    var ok=function(){window.open(CFG.dm,'_blank','noopener');};
    document.getElementById('o-copiado').hidden=false;
    if(navigator.clipboard)navigator.clipboard.writeText(txt).then(ok,ok);else ok();
  }
});
fetch('disponibilidade.json?v='+Date.now()).then(function(r){return r.json();}).then(function(j){
  (j.ocupado||[]).forEach(function(p){var a=d(p[0]),b=d(p[1]);if(a&&b&&b>a)occ.push([a,b]);});
  var r=j.regras||{};if(r.minimo)minimo=+r.minimo;
  (r.pacotes||[]).forEach(function(p){var a=d(p.checkin),b=d(p.checkout);if(a&&b&&b>a&&b>hoje)pac.push({nome:p.nome,a:a,b:b});});
  if(j.atualizado)document.getElementById('calup').textContent='Atualizado em '+j.atualizado;draw();
}).catch(function(){draw();});
})();
