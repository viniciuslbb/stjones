function openPopup(id){
  var el = document.getElementById(id);
  if(!el) return;
  // Reset contato form if needed
  if(id==='popupContato'){
    document.getElementById('contatoForm').style.display='block';
    document.getElementById('contatoSuccess').style.display='none';
  }
  // Load quem somos content
  if(id==='popupQuemSomos'){
    var d = S.popups && S.popups.quemsomos ? S.popups.quemsomos : {};
    var tag = document.getElementById('qs-tag-display');
    var title = document.getElementById('qs-title-display');
    var text = document.getElementById('qs-text-display');
    if(tag) tag.textContent = d.tag || 'Nossa história';
    if(title) title.textContent = d.title || 'Quem Somos';
    if(text) text.textContent = d.text || 'Somos a St. Jones, uma hamburgueria artesanal com paixão por smash burgers de qualidade.';
  }
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePopup(id, e){
  if(e && e.target !== document.getElementById(id)) return;
  var el = document.getElementById(id);
  if(el) el.classList.remove('open');
  document.body.style.overflow = '';
}

function enviarContato(){
  var nome = document.getElementById('ct-nome').value.trim();
  var email = document.getElementById('ct-email').value.trim();
  var msg = document.getElementById('ct-msg').value.trim();
  if(!nome || !email || !msg){ alert('Preencha nome, e-mail e mensagem.'); return; }
  var tel = document.getElementById('ct-tel').value.trim();
  var texto = 'Contato pelo site St. Jones' +
    String.fromCharCode(10) + String.fromCharCode(10) +
    'Nome: ' + nome +
    String.fromCharCode(10) + 'Email: ' + email +
    (tel ? String.fromCharCode(10) + 'Telefone: ' + tel : '') +
    String.fromCharCode(10) + 'Mensagem: ' + msg;
  document.getElementById('contatoForm').style.display = 'none';
  document.getElementById('contatoSuccess').style.display = 'block';
  setTimeout(function(){
    window.open('https://wa.me/5511994440000?text=' + encodeURIComponent(texto), '_blank');
  }, 600);
}

// ─── IMAGE EDITOR ─────────────────────────────────────────────────
var _ie = {
  img: null, zoom: 100, rotate: 0, bright: 0,
  offsetX: 0, offsetY: 0, dragging: false,
  lastX: 0, lastY: 0, shape: 'rect',
  callback: null, callbackKey: null,
  cropW: 320, cropH: 240, cropX: 160, cropY: 40
};

function openImgEditor(file, callbackFn, callbackKey, shape){
  _ie.shape = shape || 'rect';
  _ie.callback = callbackFn;
  _ie.callbackKey = callbackKey;
  _ie.zoom = 100; _ie.rotate = 0; _ie.bright = 0;
  _ie.offsetX = 0; _ie.offsetY = 0;
  document.getElementById('ieZoom').value = 100;
  document.getElementById('ieRotate').value = 0;
  document.getElementById('ieBright').value = 0;
  setCropShape(_ie.shape);
  var reader = new FileReader();
  reader.onload = function(e){
    var img = new Image();
    img.onload = function(){
      _ie.img = img;
      _ie.offsetX = 0; _ie.offsetY = 0;
      updateEditor();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  document.getElementById('imgEditorOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setupEditorDrag();
}

function closeImgEditor(){
  document.getElementById('imgEditorOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function setCropShape(shape){
  _ie.shape = shape;
  ['shapeRect','shapeSquare','shapeCircle','shapeWide'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.classList.remove('active');
  });
  var btn = document.getElementById('shape' + shape.charAt(0).toUpperCase() + shape.slice(1));
  if(btn) btn.classList.add('active');
  var cw = 640, ch = 320;
  if(shape==='square')  {_ie.cropW=240;_ie.cropH=240;_ie.cropX=(cw-240)/2;_ie.cropY=(ch-240)/2;}
  else if(shape==='circle'){_ie.cropW=240;_ie.cropH=240;_ie.cropX=(cw-240)/2;_ie.cropY=(ch-240)/2;}
  else if(shape==='wide') {_ie.cropW=580;_ie.cropH=200;_ie.cropX=(cw-580)/2;_ie.cropY=(ch-200)/2;}
  else                    {_ie.cropW=380;_ie.cropH=260;_ie.cropX=(cw-380)/2;_ie.cropY=(ch-260)/2;}
  updateCropGuide();
  updateEditor();
}

function updateCropGuide(){
  var x=_ie.cropX, y=_ie.cropY, w=_ie.cropW, h=_ie.cropH;
  var rx = (_ie.shape==='circle') ? Math.min(w,h)/2 : 0;
  var hole = document.getElementById('cropHole');
  var border = document.getElementById('cropBorder');
  if(hole){hole.setAttribute('x',x);hole.setAttribute('y',y);hole.setAttribute('width',w);hole.setAttribute('height',h);hole.setAttribute('rx',rx);}
  if(border){border.setAttribute('x',x);border.setAttribute('y',y);border.setAttribute('width',w);border.setAttribute('height',h);border.setAttribute('rx',rx);}
  var lines = document.querySelectorAll('#imgGuide line');
  if(lines[0]){lines[0].setAttribute('x1',x+w/3);lines[0].setAttribute('x2',x+w/3);lines[0].setAttribute('y1',y);lines[0].setAttribute('y2',y+h);}
  if(lines[1]){lines[1].setAttribute('x1',x+2*w/3);lines[1].setAttribute('x2',x+2*w/3);lines[1].setAttribute('y1',y);lines[1].setAttribute('y2',y+h);}
  if(lines[2]){lines[2].setAttribute('x1',x);lines[2].setAttribute('x2',x+w);lines[2].setAttribute('y1',y+h/3);lines[2].setAttribute('y2',y+h/3);}
  if(lines[3]){lines[3].setAttribute('x1',x);lines[3].setAttribute('x2',x+w);lines[3].setAttribute('y1',y+2*h/3);lines[3].setAttribute('y2',y+2*h/3);}
}

function updateEditor(){
  if(!_ie.img) return;
  var zoom = parseInt(document.getElementById('ieZoom').value);
  var rot  = parseInt(document.getElementById('ieRotate').value);
  var bright = parseInt(document.getElementById('ieBright').value);
  _ie.zoom=zoom; _ie.rotate=rot; _ie.bright=bright;
  document.getElementById('ieZoomVal').textContent = zoom+'%';
  document.getElementById('ieRotateVal').textContent = rot+'°';
  document.getElementById('ieBrightVal').textContent = bright;
  var canvas = document.getElementById('imgEditorCanvas');
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,640,320);
  ctx.save();
  ctx.filter = 'brightness('+(100+bright)+'%)';
  ctx.translate(320 + _ie.offsetX, 160 + _ie.offsetY);
  ctx.rotate(rot * Math.PI / 180);
  var scale = zoom / 100;
  var w = _ie.img.width * scale;
  var h = _ie.img.height * scale;
  ctx.drawImage(_ie.img, -w/2, -h/2, w, h);
  ctx.restore();
  updatePreviews(canvas);
}

function updatePreviews(srcCanvas){
  var x=_ie.cropX, y=_ie.cropY, w=_ie.cropW, h=_ie.cropH;
  function drawPreview(id, pw, ph, circle){
    var pc = document.getElementById(id);
    if(!pc) return;
    var pctx = pc.getContext('2d');
    pctx.clearRect(0,0,pw,ph);
    if(circle){ pctx.save(); pctx.beginPath(); pctx.arc(pw/2,ph/2,Math.min(pw,ph)/2,0,Math.PI*2); pctx.clip(); }
    pctx.drawImage(srcCanvas, x, y, w, h, 0, 0, pw, ph);
    if(circle) pctx.restore();
  }
  drawPreview('prevCircle', 52, 52, true);
  drawPreview('prevSquare', 64, 64, false);
  drawPreview('prevRect', 120, 64, false);
}

function applyEditedImg(){
  if(!_ie.img) return;
  var x=_ie.cropX, y=_ie.cropY, w=_ie.cropW, h=_ie.cropH;
  var srcCanvas = document.getElementById('imgEditorCanvas');
  var out = document.createElement('canvas');
  out.width = w; out.height = h;
  var octx = out.getContext('2d');
  if(_ie.shape==='circle'){
    octx.save(); octx.beginPath();
    octx.arc(w/2,h/2,Math.min(w,h)/2,0,Math.PI*2); octx.clip();
  }
  octx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h);
  if(_ie.shape==='circle') octx.restore();
  var dataUrl = out.toDataURL('image/png');
  if(_ie.callback) _ie.callback(dataUrl, _ie.callbackKey);
  closeImgEditor();
}

function setupEditorDrag(){
  var canvas = document.getElementById('imgEditorCanvas');
  if(canvas._dragSetup) return;
  canvas._dragSetup = true;
  canvas.addEventListener('mousedown', function(e){ _ie.dragging=true; _ie.lastX=e.clientX; _ie.lastY=e.clientY; });
  canvas.addEventListener('touchstart', function(e){ _ie.dragging=true; _ie.lastX=e.touches[0].clientX; _ie.lastY=e.touches[0].clientY; },{passive:true});
  function onMove(x,y){
    if(!_ie.dragging) return;
    _ie.offsetX += x - _ie.lastX; _ie.offsetY += y - _ie.lastY;
    _ie.lastX=x; _ie.lastY=y;
    updateEditor();
  }
  window.addEventListener('mousemove', function(e){ onMove(e.clientX, e.clientY); });
  window.addEventListener('touchmove', function(e){ onMove(e.touches[0].clientX, e.touches[0].clientY); },{passive:true});
  window.addEventListener('mouseup', function(){ _ie.dragging=false; });
  window.addEventListener('touchend', function(){ _ie.dragging=false; });
}

// Override prevImg to open the editor instead of directly using the file
function prevImg(e, prevId, imgKey){
  var file = e.target.files[0];
  if(!file) return;
  // Determine shape based on context
  var shape = 'rect';
  if(prevId.toLowerCase().indexOf('logo') >= 0) shape = 'square';
  if(prevId.toLowerCase().indexOf('cat') >= 0) shape = 'circle';
  if(prevId.toLowerCase().indexOf('social') >= 0) shape = 'square';
  if(prevId.toLowerCase().indexOf('benef') >= 0) shape = 'circle';
  openImgEditor(file, function(dataUrl, key){
    window[key] = dataUrl;
    var prev = document.getElementById(prevId);
    if(prev){
      prev.innerHTML = '<img src="'+dataUrl+'" style="max-width:100%;max-height:80px;border-radius:8px;margin-top:.5rem;object-fit:contain">';
    }
  }, imgKey, shape);
}

function openFranquiasModal(){
  document.getElementById('franquiasModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeFranquiasModalBtn(){
  document.getElementById('franquiasModal').classList.remove('open');
  document.body.style.overflow='';
  document.getElementById('franquiasForm').style.display='block';
  document.getElementById('franquiasSuccess').style.display='none';
}
function closeFranquiasModal(e){
  if(e.target===document.getElementById('franquiasModal')) closeFranquiasModalBtn();
}
function enviarFranquia(){
  var nome=document.getElementById('fq-nome').value.trim();
  var email=document.getElementById('fq-email').value.trim();
  var tel=document.getElementById('fq-tel').value.trim();
  var cidade=document.getElementById('fq-cidade').value.trim();
  var capitalEl=document.querySelector('input[name="capital"]:checked');
  if(!nome||!email||!tel||!cidade){alert('Preencha nome, e-mail, telefone e cidade.');return;}
  if(!capitalEl){alert('Selecione o capital disponivel.');return;}
  var capital=capitalEl.value;
  var msg=document.getElementById('fq-msg').value.trim();
  var texto='Novo interesse em franquia St. Jones'+
    String.fromCharCode(10)+String.fromCharCode(10)+'Nome: '+nome+
    String.fromCharCode(10)+'Email: '+email+
    String.fromCharCode(10)+'Telefone: '+tel+
    String.fromCharCode(10)+'Cidade: '+cidade+
    String.fromCharCode(10)+'Capital: '+capital+
    (msg ? String.fromCharCode(10)+'Mensagem: '+msg : '');
  document.getElementById('franquiasForm').style.display='none';
  document.getElementById('franquiasSuccess').style.display='block';
  setTimeout(function(){
    window.open('https://wa.me/5511994440000?text='+encodeURIComponent(texto),'_blank');
  },800);
}

