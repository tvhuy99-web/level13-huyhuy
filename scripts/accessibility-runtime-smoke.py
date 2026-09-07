import json
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

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
        return {
            requirejs:!!req,
            initializer:!!(req&&req.defined('game/GameGlobalsInitializer')),
            accessibility:!!(req&&req.defined('game/helpers/ui/AccessibilityHelper')),
            mobileExperience:!!(req&&req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper')),
            finalAudit:!!(req&&req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            loadingDisplay:loading?getComputedStyle(loading).display:'missing',
            mainDisplay:main?getComputedStyle(main).display:'missing'
        };
    """)

def state(driver):
    return driver.execute_script("""
        const vv=e=>{if(!e||!e.isConnected)return false;for(let x=e;x&&x!==document.documentElement;x=x.parentElement){const s=getComputedStyle(x);if(s.display==='none'||s.visibility==='hidden'||x.hidden)return false;}return true;};
        const inactive=e=>!!(e&&e.closest('[data-a11y-layout-inactive="1"]'));
        const stats=Array.from(document.querySelectorAll('.player-stats-container')).find(e=>vv(e)&&!inactive(e))||null;
        const summaryFor=source=>{if(!source||!source.id||!source.parentElement)return null;return Array.from(source.parentElement.querySelectorAll(':scope > [data-a11y-summary-for]')).find(s=>s.getAttribute('data-a11y-summary-for')===source.id)||null;};
        const ps=summaryFor(stats);
        const ss=document.querySelector('#mobile-header-status > [data-a11y-summary-key="status-mobile"]');
        const mp=document.getElementById('player-perks-list-mobile');
        const rp=document.getElementById('player-perks-list-regular');
        const hs=document.getElementById('header-side');
        const mh=document.getElementById('grid-main-header');
        const eq=document.getElementById('container-equipment-stats-side');
        const summaries=Array.from(document.querySelectorAll('[data-a11y-summary="1"]')).filter(s=>!inactive(s));
        const silent=Array.from(document.querySelectorAll('.info-callout-target[tabindex="0"]')).filter(t=>{const c=t.closest('.callout-container');const d=c&&c.querySelector('.info-callout');return d&&!d.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']");});
        const movement=document.getElementById('accessibility-movement-status');
        const north=document.getElementById('out-action-move-north');
        const compass=document.getElementById('out-container-compass-actions');
        return {
            small:document.body.classList.contains('layout-small'),
            oldCompact:document.querySelectorAll('[data-a11y-compact="1"]').length,
            summaryCount:summaries.length,
            summaryTexts:summaries.map(s=>(s.textContent||'').trim()).slice(0,16),
            badSummaryFocus:summaries.filter(s=>s.hasAttribute('tabindex')||s.hasAttribute('aria-label')||!(s.textContent||'').trim()).length,
            playerText:ps?ps.textContent.trim():'',
            playerSummaryTabindex:ps?ps.getAttribute('tabindex'):null,
            playerSummaryAriaLabel:ps?ps.getAttribute('aria-label'):null,
            playerVisualHidden:stats?stats.getAttribute('aria-hidden'):null,
            playerVisualInert:stats?stats.hasAttribute('inert'):false,
            playerVisualTabindex:stats?stats.getAttribute('tabindex'):null,
            statusText:ss?ss.textContent.trim():'',
            statusSummaryTabindex:ss?ss.getAttribute('tabindex'):null,
            mobilePerksHidden:mp?mp.getAttribute('aria-hidden'):null,
            mobilePerksInert:mp?mp.hasAttribute('inert'):false,
            mobilePerksTabindex:mp?mp.getAttribute('tabindex'):null,
            regularPerksHidden:rp?rp.getAttribute('aria-hidden'):null,
            regularPerksInert:rp?rp.hasAttribute('inert'):false,
            regularPerksTabindex:rp?rp.getAttribute('tabindex'):null,
            headerSideHidden:hs?hs.getAttribute('aria-hidden'):null,
            headerSideInert:hs?hs.hasAttribute('inert'):false,
            mainHeaderHidden:mh?mh.getAttribute('aria-hidden'):null,
            mainHeaderInert:mh?mh.hasAttribute('inert'):false,
            equipmentSideInert:!!(eq&&eq.closest('[inert]')),
            equipmentSideTabindex:eq?eq.getAttribute('tabindex'):null,
            silentCallouts:silent.length,
            notes:document.querySelectorAll('.info-callout-target[role="note"]').length,
            movementText:movement?movement.textContent.trim():'',
            northLabel:north?north.getAttribute('aria-label'):null,
            compassLabel:compass?compass.getAttribute('aria-label'):null
        };
    """)

def expose_background_for_ax_probe(driver):
    driver.execute_script("""
        document.querySelectorAll('.popup').forEach(p=>p.style.display='none');
        document.querySelectorAll('.hidden-by-popups').forEach(e=>{
            e.removeAttribute('aria-hidden');
            e.removeAttribute('inert');
            try{e.inert=false;}catch(err){}
        });
    """)
    time.sleep(0.25)

def ax_names(driver):
    tree=driver.execute_cdp_cmd('Accessibility.getFullAXTree',{})
    out=[]
    for node in tree.get('nodes',[]):
        if node.get('ignored'): continue
        name=(node.get('name') or {}).get('value')
        if name: out.append(str(name).strip())
    return out

def logs(driver):
    xs=driver.get_log('browser')
    for x in xs: print(f"BROWSER {x.get('level')}: {x.get('message')}")
    return xs

driver=webdriver.Chrome(options=options)
try:
    driver.get('http://127.0.0.1:8000/')
    try:
        WebDriverWait(driver,45).until(lambda d:snapshot(d)['loadingDisplay']=='none' and snapshot(d)['mainDisplay']!='none')
        WebDriverWait(driver,12).until(lambda d:state(d)['small'] and bool(state(d)['playerText']) and bool(state(d)['statusText']) and state(d)['headerSideInert'])
    except TimeoutException:
        print('TIMEOUT',json.dumps(state(driver),sort_keys=True));logs(driver);raise

    m=snapshot(driver)
    a=state(driver)
    print('Runtime state:',json.dumps(m,sort_keys=True))
    print('TalkBack DOM state:',json.dumps(a,sort_keys=True))
    if not all(m[k] for k in ('requirejs','initializer','accessibility','mobileExperience','finalAudit')): raise RuntimeError('Required modules did not initialize')
    if a['oldCompact']!=0: raise RuntimeError('Old tabindex + aria-label compact model remains')
    if a['badSummaryFocus']!=0: raise RuntimeError('Summary is focusable, synthetic, or empty')
    if not a['playerText'].startswith('Player status.'): raise RuntimeError('Player status real text missing')
    if a['playerSummaryTabindex'] is not None or a['playerSummaryAriaLabel'] is not None: raise RuntimeError('Player summary still synthetic/focusable')
    if a['playerVisualHidden']!='true' or not a['playerVisualInert'] or a['playerVisualTabindex'] is not None: raise RuntimeError('Player icon subtree remains reachable')
    if not a['statusText'].startswith('Status effects.') or a['statusSummaryTabindex'] is not None: raise RuntimeError('Status summary is missing or focusable')
    if a['mobilePerksHidden']!='true' or not a['mobilePerksInert'] or a['mobilePerksTabindex'] is not None: raise RuntimeError('Mobile status icon list remains reachable')
    if a['regularPerksHidden']!='true' or not a['regularPerksInert'] or a['regularPerksTabindex'] is not None: raise RuntimeError('player-perks-list-regular remains reachable on phone')
    if a['headerSideHidden']!='true' or not a['headerSideInert']: raise RuntimeError('Desktop side header remains reachable on phone')
    if a['mainHeaderHidden']!='true' or not a['mainHeaderInert']: raise RuntimeError('Desktop main header remains reachable on phone')
    if not a['equipmentSideInert'] or a['equipmentSideTabindex'] is not None: raise RuntimeError('container-equipment-stats-side remains reachable on phone')
    if a['silentCallouts']!=0 or a['notes']!=0: raise RuntimeError('Silent callout stops remain')
    if not a['movementText'] or a['northLabel']!='Move north' or a['compassLabel']!='Movement and travel actions': raise RuntimeError('Movement accessibility regression')

    # Intro dialogue is modal and correctly hides background content from AX. For
    # this probe only, remove modal isolation and verify the actual paragraph text.
    expose_background_for_ax_probe(driver)
    names=ax_names(driver)
    relevant=[n for n in names if n.startswith('Player status.') or n.startswith('Status effects.')]
    print('AX real-text summaries:',json.dumps(relevant[:10]))
    if not any(n.startswith('Player status.') for n in names): raise RuntimeError('AX tree does not expose Player status real text')
    if not any(n.startswith('Status effects.') for n in names): raise RuntimeError('AX tree does not expose Status effects real text')

    severe=[]
    for x in logs(driver):
        msg=x.get('message','')
        if x.get('level')=='SEVERE' and ('127.0.0.1:8000' in msg or 'Uncaught' in msg or 'ReferenceError' in msg or 'TypeError' in msg): severe.append(msg)
    if severe: raise RuntimeError('Browser console errors:\n'+'\n'.join(severe))
    print('Real-text TalkBack regression test passed.')
finally:
    driver.quit()
