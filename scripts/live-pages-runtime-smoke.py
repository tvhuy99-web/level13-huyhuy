import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

URL='https://tvhuy99-web.github.io/level13-huyhuy/?talkback-probe='+str(int(time.time()))
options=Options()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=390,844')
options.set_capability('goog:loggingPrefs',{'browser':'ALL'})

def snap(d):
    return d.execute_script("""
      const loading=document.querySelector('.loading-content'),main=document.getElementById('unit-main'),req=window.requirejs;
      return {loading:loading?getComputedStyle(loading).display:'missing',main:main?getComputedStyle(main).display:'missing',requirejs:!!req,mobile:!!(req&&req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper'))};
    """)

def state(d):
    return d.execute_script("""
      const vv=e=>{if(!e)return false;for(let x=e;x&&x!==document.documentElement;x=x.parentElement){const s=getComputedStyle(x);if(s.display==='none'||s.visibility==='hidden'||x.hidden)return false;}return true;};
      const inactive=e=>!!(e&&e.closest('[data-a11y-layout-inactive="1"]'));
      const stats=Array.from(document.querySelectorAll('.player-stats-container')).find(e=>vv(e)&&!inactive(e))||null;
      const sumFor=e=>{if(!e||!e.id||!e.parentElement)return null;return Array.from(e.parentElement.querySelectorAll(':scope > [data-a11y-summary-for]')).find(s=>s.getAttribute('data-a11y-summary-for')===e.id)||null;};
      const ps=sumFor(stats),ss=document.querySelector('#mobile-header-status > [data-a11y-summary-key="status-mobile"]');
      const rp=document.getElementById('player-perks-list-regular'),mp=document.getElementById('player-perks-list-mobile'),hs=document.getElementById('header-side'),mh=document.getElementById('grid-main-header'),eq=document.getElementById('container-equipment-stats-side');
      const summaries=Array.from(document.querySelectorAll('[data-a11y-summary="1"]')).filter(s=>!inactive(s));
      return {
        small:document.body.classList.contains('layout-small'),oldCompact:document.querySelectorAll('[data-a11y-compact="1"]').length,
        badSummary:summaries.filter(s=>s.hasAttribute('tabindex')||s.hasAttribute('aria-label')||!(s.textContent||'').trim()).length,
        player:ps?ps.textContent.trim():'',status:ss?ss.textContent.trim():'',
        playerVisualHidden:stats?stats.getAttribute('aria-hidden'):null,playerVisualInert:stats?stats.hasAttribute('inert'):false,
        mobileHidden:mp?mp.getAttribute('aria-hidden'):null,mobileInert:mp?mp.hasAttribute('inert'):false,
        regularHidden:rp?rp.getAttribute('aria-hidden'):null,regularInert:rp?rp.hasAttribute('inert'):false,regularTab:rp?rp.getAttribute('tabindex'):null,
        headerHidden:hs?hs.getAttribute('aria-hidden'):null,headerInert:hs?hs.hasAttribute('inert'):false,
        mainHeaderHidden:mh?mh.getAttribute('aria-hidden'):null,mainHeaderInert:mh?mh.hasAttribute('inert'):false,
        equipmentInert:!!(eq&&eq.closest('[inert]')),equipmentTab:eq?eq.getAttribute('tabindex'):null,
        silent:document.querySelectorAll('.info-callout-target[role="note"]').length
      };
    """)

def ax_names(d):
    tree=d.execute_cdp_cmd('Accessibility.getFullAXTree',{})
    return [str((n.get('name') or {}).get('value')).strip() for n in tree.get('nodes',[]) if not n.get('ignored') and (n.get('name') or {}).get('value')]

def expose_for_probe(d):
    d.execute_script("""
      document.querySelectorAll('.popup').forEach(p=>p.style.display='none');
      document.querySelectorAll('.hidden-by-popups').forEach(e=>{e.removeAttribute('aria-hidden');e.removeAttribute('inert');try{e.inert=false;}catch(err){}});
    """)
    time.sleep(.25)

d=webdriver.Chrome(options=options)
try:
    print('Opening',URL,flush=True)
    d.get(URL)
    WebDriverWait(d,45).until(lambda x:snap(x)['loading']=='none' and snap(x)['main']!='none')
    WebDriverWait(d,12).until(lambda x:state(x)['small'] and bool(state(x)['player']) and bool(state(x)['status']) and state(x)['headerInert'])
    s=snap(d);a=state(d)
    print('LIVE runtime:',json.dumps(s,sort_keys=True),flush=True)
    print('LIVE TalkBack state:',json.dumps(a,sort_keys=True),flush=True)
    if not s['requirejs'] or not s['mobile']: raise RuntimeError('Live accessibility helper did not initialize')
    if a['oldCompact']!=0 or a['badSummary']!=0: raise RuntimeError('Live page still uses synthetic/focusable read-only summaries')
    if not a['player'].startswith('Player status.') or not a['status'].startswith('Status effects.'): raise RuntimeError('Live real-text summaries are missing')
    if a['playerVisualHidden']!='true' or not a['playerVisualInert']: raise RuntimeError('Live player icon subtree remains exposed')
    if a['mobileHidden']!='true' or not a['mobileInert']: raise RuntimeError('Live mobile status icons remain exposed')
    if a['regularHidden']!='true' or not a['regularInert'] or a['regularTab'] is not None: raise RuntimeError('player-perks-list-regular remains reachable on live phone layout')
    if a['headerHidden']!='true' or not a['headerInert'] or a['mainHeaderHidden']!='true' or not a['mainHeaderInert']: raise RuntimeError('Live desktop header copy remains reachable')
    if not a['equipmentInert'] or a['equipmentTab'] is not None: raise RuntimeError('container-equipment-stats-side remains reachable')
    if a['silent']!=0: raise RuntimeError('Live role=note stops remain')
    expose_for_probe(d)
    names=ax_names(d)
    relevant=[n for n in names if n.startswith('Player status.') or n.startswith('Status effects.')]
    print('LIVE AX summaries:',json.dumps(relevant[:10]),flush=True)
    if not any(n.startswith('Player status.') for n in names) or not any(n.startswith('Status effects.') for n in names): raise RuntimeError('Live AX tree does not expose real summary text')
    print('Live real-text TalkBack regression test passed.',flush=True)
finally:
    d.quit()
