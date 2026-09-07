import json
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = 'http://127.0.0.1:8000/'


def make_driver(width, height):
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument(f'--window-size={width},{height}')
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    return webdriver.Chrome(options=options)


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
        const overview=document.getElementById('accessibility-player-overview');
        const headers=['mobile-header','header-side','grid-main-header'].map(id=>document.getElementById(id));
        const rp=document.getElementById('player-perks-list-regular');
        const mp=document.getElementById('player-perks-list-mobile');
        const eq=document.getElementById('container-equipment-stats-side');
        const summaries=Array.from(document.querySelectorAll('[data-a11y-summary="1"]'));
        const visible=e=>{
            if(!e||!e.isConnected)return false;
            for(let x=e;x&&x!==document.documentElement;x=x.parentElement){
                const s=getComputedStyle(x);
                if(s.display==='none'||s.visibility==='hidden'||x.hidden||x.getAttribute('aria-hidden')==='true'||x.hasAttribute('inert'))return false;
            }
            return true;
        };
        const silentCallouts=Array.from(document.querySelectorAll('.info-callout-target[tabindex="0"]')).filter(t=>{
            if(!visible(t))return false;
            const c=t.closest('.callout-container');
            const d=c&&c.querySelector('.info-callout');
            return d&&!d.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']");
        });
        const native='button,input,select,textarea,a[href]';
        const allowedRoles=['button','tab','radio','option','checkbox','switch','slider','menuitem','treeitem'];
        const genericSilent=Array.from(document.querySelectorAll('[tabindex="0"]')).filter(e=>{
            if(!visible(e)||e.matches(native))return false;
            const role=(e.getAttribute('role')||'').toLowerCase();
            if(allowedRoles.includes(role))return false;
            const labelled=(e.getAttribute('aria-label')||e.getAttribute('title')||'').trim();
            const labelledBy=(e.getAttribute('aria-labelledby')||'').trim();
            const text=(e.innerText||e.textContent||'').replace(/\s+/g,' ').trim();
            return !labelled&&!labelledBy&&!text;
        });
        const headerFocusable=headers.flatMap(h=>h?Array.from(h.querySelectorAll("button,input,select,textarea,a[href],[tabindex],[role='button'],[role='radio'],[role='option']")):[]).filter(e=>e.getAttribute('tabindex')!=='-1');
        const movement=document.getElementById('accessibility-movement-status');
        const north=document.getElementById('out-action-move-north');
        const compass=document.getElementById('out-container-compass-actions');
        return {
            layoutSmall:document.body.classList.contains('layout-small'),
            layoutRegular:document.body.classList.contains('layout-regular'),
            overviewText:overview?(overview.textContent||'').trim():'',
            overviewTabindex:overview?overview.getAttribute('tabindex'):null,
            overviewAriaLabel:overview?overview.getAttribute('aria-label'):null,
            overviewRole:overview?overview.getAttribute('role'):null,
            overviewInsideVisualHeader:!!(overview&&overview.closest('#mobile-header,#header-side,#grid-main-header')),
            badSummaryFocus:summaries.filter(s=>s.hasAttribute('tabindex')||s.hasAttribute('aria-label')||!(s.textContent||'').trim()).length,
            oldCompact:document.querySelectorAll('[data-a11y-compact="1"]').length,
            headersHidden:headers.every(h=>!h||h.getAttribute('aria-hidden')==='true'),
            headersInert:headers.every(h=>!h||h.hasAttribute('inert')),
            headerFocusableCount:headerFocusable.length,
            regularPerksInert:!!(rp&&rp.closest('[inert]')),
            regularPerksTabindex:rp?rp.getAttribute('tabindex'):null,
            mobilePerksInert:!!(mp&&mp.closest('[inert]')),
            mobilePerksTabindex:mp?mp.getAttribute('tabindex'):null,
            equipmentSideInert:!!(eq&&eq.closest('[inert]')),
            equipmentSideTabindex:eq?eq.getAttribute('tabindex'):null,
            silentCallouts:silentCallouts.length,
            genericSilentCount:genericSilent.length,
            genericSilentExamples:genericSilent.slice(0,10).map(e=>({id:e.id||'',cls:e.className||'',role:e.getAttribute('role')||''})),
            notes:document.querySelectorAll('.info-callout-target[role="note"]').length,
            movementText:movement?(movement.textContent||'').trim():'',
            northExists:!!north,
            northLabel:north?north.getAttribute('aria-label'):null,
            compassLabel:compass?compass.getAttribute('aria-label'):null
        };
    """)


def expose_background_for_ax_probe(driver):
    driver.execute_script("""
        document.querySelectorAll('.popup').forEach(p=>p.style.display='none');
        document.querySelectorAll('.hidden-by-popups').forEach(e=>{
            if(e.id==='mobile-header'||e.id==='header-side'||e.id==='grid-main-header')return;
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


def browser_logs(driver):
    xs=driver.get_log('browser')
    for x in xs: print(f"BROWSER {x.get('level')}: {x.get('message')}")
    return xs


def core_ready(driver):
    a=state(driver)
    text=a['overviewText']
    return a['headersInert'] and text.startswith('Player overview.') and 'Player status.' in text and 'Status effects.' in text


def run_case(width, height):
    driver=make_driver(width,height)
    try:
        driver.get(BASE_URL)
        try:
            WebDriverWait(driver,45).until(lambda d:snapshot(d)['loadingDisplay']=='none' and snapshot(d)['mainDisplay']!='none')
            # Header data is populated asynchronously by UIOutHeaderSystem. Do not
            # judge the accessibility tree on the first partial Inventory/Camp update.
            WebDriverWait(driver,25).until(core_ready)
        except TimeoutException:
            print('TIMEOUT',width,height,json.dumps(state(driver),sort_keys=True)); browser_logs(driver); raise

        m=snapshot(driver); a=state(driver)
        print(f'Runtime state {width}x{height}:',json.dumps(m,sort_keys=True))
        print(f'TalkBack state {width}x{height}:',json.dumps(a,sort_keys=True))

        if not all(m[k] for k in ('requirejs','initializer','accessibility','mobileExperience','finalAudit')): raise RuntimeError('Required modules did not initialize')
        if not a['overviewText'].startswith('Player overview.'): raise RuntimeError('Single Player overview real-text node missing')
        if 'Player status.' not in a['overviewText'] or 'Status effects.' not in a['overviewText']: raise RuntimeError('Player overview does not contain core status information')
        if a['overviewTabindex'] is not None or a['overviewAriaLabel'] is not None or a['overviewRole'] is not None: raise RuntimeError('Player overview is still synthetic/focusable')
        if a['overviewInsideVisualHeader']: raise RuntimeError('Player overview is inside a visual header')
        if a['badSummaryFocus']!=0 or a['oldCompact']!=0: raise RuntimeError('Read-only summaries still create synthetic swipe stops')
        if not a['headersHidden'] or not a['headersInert'] or a['headerFocusableCount']!=0: raise RuntimeError('A visual header remains reachable by TalkBack')
        if not a['regularPerksInert'] or a['regularPerksTabindex'] is not None: raise RuntimeError('player-perks-list-regular remains reachable')
        if not a['mobilePerksInert'] or a['mobilePerksTabindex'] is not None: raise RuntimeError('player-perks-list-mobile remains reachable')
        if not a['equipmentSideInert'] or a['equipmentSideTabindex'] is not None: raise RuntimeError('container-equipment-stats-side remains reachable')
        if a['silentCallouts']!=0 or a['notes']!=0: raise RuntimeError('Silent callout/note stops remain')
        if a['genericSilentCount']!=0: raise RuntimeError(f"Generic silent tabindex=0 stops remain: {a['genericSilentExamples']}")
        if not a['movementText'] or a['compassLabel']!='Movement and travel actions': raise RuntimeError('Movement accessibility regression')
        if a['northExists'] and a['northLabel']!='Move north': raise RuntimeError('North movement button exists without accessible name')

        expose_background_for_ax_probe(driver)
        names=ax_names(driver)
        overview_names=[n for n in names if n.startswith('Player overview.')]
        print(f'AX overview {width}x{height}:',json.dumps(overview_names[:3]))
        if len(overview_names)!=1: raise RuntimeError(f'Expected exactly one Player overview AX node, found {len(overview_names)}')
        if any(n in names for n in ('player-perks-list-regular','container-equipment-stats-side')): raise RuntimeError('Visual header IDs leaked into AX names')

        severe=[]
        for x in browser_logs(driver):
            msg=x.get('message','')
            if x.get('level')=='SEVERE' and ('127.0.0.1:8000' in msg or 'Uncaught' in msg or 'ReferenceError' in msg or 'TypeError' in msg): severe.append(msg)
        if severe: raise RuntimeError('Browser console errors:\n'+'\n'.join(severe))
    finally:
        driver.quit()


run_case(390,844)
run_case(980,844)
print('Single-overview TalkBack regression test passed in phone and wide viewport modes.')
