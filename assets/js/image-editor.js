// Detecção de lojas abertas/fechadas no horário de Brasília
function timeToMinutes(value, fallback){
  if(typeof value === 'number'){
    const normalized = ((value % 24) + 24) % 24;
    return normalized * 60;
  }
  if(typeof value === 'string'){
    if(/^\d{1,2}:\d{2}$/.test(value)){
      const [h,m] = value.split(':').map(Number);
      return h * 60 + m;
    }
    if(/^\d+(?:\.\d+)?$/.test(value)){
      const n = Number(value);
      return Math.round((((n % 24) + 24) % 24) * 60);
    }
  }
  return fallback;
}

function timeForInput(value, fallback){
  const total = timeToMinutes(value, timeToMinutes(fallback, 0));
  const h = String(Math.floor(total / 60) % 24).padStart(2,'0');
  const m = String(total % 60).padStart(2,'0');
  return h + ':' + m;
}

function checkLojas(){
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const value = type => parts.find(part => part.type === type)?.value;
  const dayMap = {Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6};
  const day = dayMap[value('weekday')];
  const t = Number(value('hour')) * 60 + Number(value('minute'));

  function badge(open){
    return open
      ? '<span style="width:7px;height:7px;border-radius:50%;background:#16a34a;flex-shrink:0;display:inline-block"></span><span style="color:#16a34a">Aberto agora</span>'
      : '<span style="width:7px;height:7px;border-radius:50%;background:#dc2626;flex-shrink:0;display:inline-block"></span><span style="color:#dc2626">Fechado</span>';
  }

  function isOpen(openDays, openingMinutes, closingMinutes){
    if(openingMinutes === closingMinutes) return openDays.includes(day);
    if(closingMinutes > openingMinutes){
      return openDays.includes(day) && t >= openingMinutes && t < closingMinutes;
    }
    const previousDay = (day + 6) % 7;
    return (openDays.includes(day) && t >= openingMinutes)
      || (openDays.includes(previousDay) && t < closingMinutes);
  }

  const defaults = [
    {dias:[0,3,4,5,6], abre:'17:00', fecha:'23:00'},
    {dias:[0,1,2,3,4,5,6], abre:'13:00', fecha:'03:30'},
    {dias:[0,1,2,3,4,5,6], abre:'13:00', fecha:'22:00'}
  ];
  const ids = ['osasco','vilamariana','tatuape'];

  ids.forEach((id,index)=>{
    const saved = S && S.lojas && S.lojas[index] ? S.lojas[index] : {};
    const cfg = Object.assign({}, defaults[index], saved);
    const open = isOpen(
      Array.isArray(cfg.dias) ? cfg.dias : defaults[index].dias,
      timeToMinutes(cfg.abre, timeToMinutes(defaults[index].abre,0)),
      timeToMinutes(cfg.fecha, timeToMinutes(defaults[index].fecha,0))
    );
    const el = document.getElementById('status-'+id);
    if(el) el.innerHTML = badge(open);
  });
}

checkLojas();
setInterval(checkLojas, 60 * 1000);

