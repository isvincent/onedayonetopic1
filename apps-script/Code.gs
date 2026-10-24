// 只讀指定資料夾；不變更 Drive 檔案或分享權限。
const FOLDER_ID = '1jHUYvmvffKufDLmjG7FVmtcYuzXnEkYu';
function parseName_(name) {
  const m = name.match(/(\d{4})[-_.年]?(\d{2})[-_.月]?(\d{2})日?/);
  let date = '';
  if (m) {
    const candidate = m[1]+'-'+m[2]+'-'+m[3];
    const d = new Date(candidate+'T00:00:00Z');
    if (!isNaN(d) && d.toISOString().slice(0,10) === candidate) date=candidate;
  }
  return {date:date,title:name.replace(/\.html?$/i,'').replace(m ? m[0] : /$^/,'').replace(/^[\s_-]+|[\s_-]+$/g,'') || name};
}
function list_() {
  const files=DriveApp.getFolderById(FOLDER_ID).getFiles(),items=[];
  while(files.hasNext()) {
    const f=files.next();
    if(!/\.html?$/i.test(f.getName()) || f.isTrashed())continue;
    const parsed=parseName_(f.getName());
    items.push({id:f.getId(),name:f.getName(),title:parsed.title,date:parsed.date,modified:f.getLastUpdated().toISOString()});
  }
  items.sort((a,b)=>b.date.localeCompare(a.date)||a.title.localeCompare(b.title));
  return {updatedAt:new Date().toISOString(),items:items};
}
function doGet(e) {
  const p=(e&&e.parameter)||{},callback=p.callback;
  if(callback&&!/^daily_cb_[A-Za-z0-9_]+$/.test(callback))return ContentService.createTextOutput('{"error":"Invalid callback"}').setMimeType(ContentService.MimeType.JSON);
  let result;
  try {
    if(p.action==='html') {
      if(!/^[\w-]+$/.test(p.id||''))throw Error('Invalid id');
      const f=DriveApp.getFileById(p.id),parents=f.getParents();let allowed=false;
      while(parents.hasNext())if(parents.next().getId()===FOLDER_ID)allowed=true;
      if(!allowed||f.isTrashed()||!/\.html?$/i.test(f.getName()))throw Error('Not allowed');
      result={id:f.getId(),html:f.getBlob().getDataAsString('UTF-8')};
    }else if(!p.action||p.action==='list')result=list_();
    else throw Error('Unknown action');
  }catch(err){result={error:'Unable to read folder or HTML. Check deployment and folder permissions.'};}
  const json=JSON.stringify(result).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return ContentService.createTextOutput(callback?callback+'('+json+');':json).setMimeType(callback?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}
function testFolder(){const r=list_();console.log(JSON.stringify(r));return r;}
