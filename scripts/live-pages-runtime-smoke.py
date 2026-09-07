import json
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

URL = 'https://tvhuy99-web.github.io/level13-huyhuy/?runtime-smoke=' + str(int(time.time()))

options = Options()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=390,844')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

def snapshot(driver):
    return driver.execute_script("""
        const loading=document.querySelector('.loading-content');
        const main=document.getElementById('unit-main');
        const req=window.requirejs;
        const defined=req&&req.s&&req.s.contexts&&req.s.contexts._?Object.keys(req.s.contexts._.defined):[];
        return {url:location.href,readyState:document.readyState,requirejs:!!req,initializer:!!(req&&req.defined('game/GameGlobalsInitializer')),accessibility:!!(req&&req.defined('game/helpers/ui/AccessibilityHelper')),mobileExperience:!!(req&&req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper')),finalAudit:!!(req&&req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),definedCount:defined.length,loadingDisplay:loading?getComputedStyle(loading).display:'missing',mainDisplay:main?getComputedStyle(main).display:'missing'};
    """)

def a11y_state(driver):
    return driver.execute_script("""
        const visual=e=>{if(!e||!e.isConnected)return false;for(let x=e;x&&x!==document.documentElement;x=x.parentElement){const s=getComputedStyle(x);if(s.display==='none'||s.visibility==='hidden'||x.hidden)return false;}return true;};
        const small=document.body.classList.contains('layout-small');
        const active=document.getElementById(small?'player-perks-list-mobile':'player-perks-list-regular');
        const inactive=document.getElementById(small?'player-perks-list-regular':'player-perks-list-mobile');
        const playerStats=Array.from(document.querySelectorAll('.player-stats-container')).find(visual)||null;
        const compact=Array.from(document.querySelectorAll('[data-a11y-compact="1"]')).filter(visual);
        const silent=Array.from(document.querySelectorAll('.info-callout-target[tabindex="0"]')).filter(t=>{const c=t.closest('.callout-container');const d=c&&c.querySelector('.info-callout');if(!d)return false;return !d.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']");});
        const compactWithActions=compact.filter(e=>e.querySelector("button,input,select,textarea,a[href],[tabindex='0'],[role='button'],[role='radio'],[role='option']"));
        const movement=document.getElementById('accessibility-movement-status');
        const north=document.getElementById('out-action-move-north');
        const compass=document.getElementById('out-container-compass-actions');
        return {
          silentCalloutStopCount:silent.length,
          noteCount:document.querySelectorAll('.info-callout-target[role="note"]').length,
          compactWithActionsCount:compactWithActions.length,
          compactCount:compact.length,
          compactLabels:compact.slice(0,12).map(e=>e.getAttribute('aria-label')),
          playerStatsCompact:!!(playerStats&&playerStats.getAttribute('data-a11y-compact')==='1'),
          playerStatsLabel:playerStats?playerStats.getAttribute('aria-label'):null,
          playerStatsVisibleChildren:playerStats?Array.from(playerStats.children).filter(c=>c.getAttribute('aria-hidden')!=='true').length:null,
          statusCompact:!!(active&&active.getAttribute('data-a11y-compact')==='1'),
          statusLabel:active?active.getAttribute('aria-label'):null,
          statusVisibleChildren:active?Array.from(active.children).filter(c=>c.getAttribute('aria-hidden')!=='true').length:null,
          statusCompactChildren:active?active.querySelectorAll(':scope > [data-a11y-compact="1"]').length:null,
          inactiveHidden:inactive?inactive.getAttribute('aria-hidden'):null,
          movementText:movement?movement.textContent.trim():'',
          northLabel:north?north.getAttribute('aria-label'):null,
          compassLabel:compass?compass.getAttribute('aria-label'):null
        };
    """)

def logs(driver):
    out=driver.get_log('browser')
    for e in out: print(f"BROWSER {e.get('level')}: {e.get('message')}", flush=True)
    return out

driver=webdriver.Chrome(options=options)
try:
    print('Opening',URL,flush=True)
    driver.get(URL)
    WebDriverWait(driver,45).until(lambda d:snapshot(d)['loadingDisplay']=='none' and snapshot(d)['mainDisplay']!='none')
    state=snapshot(driver)
    print('LIVE Runtime state:',json.dumps(state,sort_keys=True),flush=True)
    if not all(state[k] for k in ('requirejs','initializer','accessibility','mobileExperience','finalAudit')): raise RuntimeError('Deployed Pages build is missing required modules')
    WebDriverWait(driver,10).until(lambda d:a11y_state(d)['playerStatsCompact'] and a11y_state(d)['statusCompact'] and a11y_state(d)['northLabel']=='Move north')
    a=a11y_state(driver)
    print('LIVE Compact accessibility state:',json.dumps(a,sort_keys=True),flush=True)
    if a['silentCalloutStopCount']!=0: raise RuntimeError('Live page has information-only silent focus stops')
    if a['noteCount']!=0: raise RuntimeError('Live page has role=note swipe stops')
    if a['compactWithActionsCount']!=0: raise RuntimeError('A compact read-only group contains interactive controls')
    if not a['playerStatsLabel'] or a['playerStatsVisibleChildren']!=0: raise RuntimeError('Player status is not one focus stop')
    if not a['statusLabel'] or a['statusVisibleChildren']!=0 or a['statusCompactChildren']!=0: raise RuntimeError('Status effects are not one focus stop')
    if a['inactiveHidden']!='true': raise RuntimeError('Inactive mobile/desktop status copy is exposed')
    if not a['movementText'] or a['compassLabel']!='Movement and travel actions': raise RuntimeError('Movement accessibility regression')
    severe=[]
    for e in logs(driver):
        m=e.get('message','')
        if e.get('level')=='SEVERE' and ('tvhuy99-web.github.io' in m or 'Uncaught' in m or 'ReferenceError' in m or 'TypeError' in m): severe.append(m)
    if severe: raise RuntimeError('Deployed Pages browser errors:\n'+'\n'.join(severe))
    print('Live compact-focus regression test passed.',flush=True)
finally:
    driver.quit()
