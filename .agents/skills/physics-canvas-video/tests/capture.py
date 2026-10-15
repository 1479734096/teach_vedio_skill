"""实际浏览器像素与生产裁剪采集对照；保留像素和结构证据。"""
from pathlib import Path
import argparse,json,uuid
from playwright.sync_api import sync_playwright
SKILL=Path(__file__).resolve().parents[1]
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out',required=True);a=ap.parse_args();folder=Path(a.out).resolve()/('capture_'+uuid.uuid4().hex[:10]);folder.mkdir(parents=True);rows=[]
    candidates=[Path('C:/Program Files/Google/Chrome/Application/chrome.exe'),Path('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe')];exe=next((str(x) for x in candidates if x.is_file()),None)
    cases=[('离屏源图裁剪',False,False,False),('裁剪叠加最终平移',True,False,False),('整条路径被裁掉',True,True,False),('原生圆形裁剪',True,False,True)]
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True,executable_path=exe)
        for name,clip,hidden,circle in cases:
            page=browser.new_page();page.set_content('<canvas id="c" width="300" height="150"></canvas>');page.add_script_tag(path=str(SKILL/'scripts/engine/audit_capture.js'))
            result=page.evaluate('''([doClip,hidden,circle])=>{
             const c=document.getElementById('c'),ctx=c.getContext('2d');window.__canvas=c;window.auditBegin(0);
             const s=document.createElement('canvas');s.width=200;s.height=100;const g=s.getContext('2d');window.auditTag(g,'probe',{model:'probe'});g.strokeStyle='#00FF00';g.lineWidth=4;g.beginPath();g.moveTo(0,10);g.lineTo(100,10);g.stroke();
             ctx.save();if(doClip){ctx.beginPath();if(circle)ctx.arc(120,50,20,0,2*Math.PI);else ctx.rect(hidden?220:110,40,hidden?10:40,20);ctx.clip();}ctx.drawImage(s,40,0,40,30,100,40,80,30);ctx.restore();window.auditEnd();
             const point=[120,50],pixel=Array.from(ctx.getImageData(...point,1,1).data),shape=window.auditFrames[0].plot_shapes[0];return {pixel,shape,point};
            }''',[clip,hidden,circle]);shape=result['shape'];points=shape['visible_screen_points'];expected_visible=not hidden;passed=(result['pixel'][1]>200)==expected_visible and bool(points)==expected_visible and all(100<=x<=180 and 40<=y<=70 for x,y in points)
            page.screenshot(path=str(folder/(name+'.png')));rows.append({'case':name,'passed':passed,'expected_visible':expected_visible,'evidence':result});page.close()
        browser.close()
    (folder/'report.json').write_text(json.dumps({'cases':rows,'passed':sum(r['passed'] for r in rows),'total':len(rows)},ensure_ascii=False,indent=2),encoding='utf-8');print([(r['case'],r['passed']) for r in rows]);print(folder/'report.json');return 0 if all(r['passed'] for r in rows) else 1
if __name__=='__main__':raise SystemExit(main())
