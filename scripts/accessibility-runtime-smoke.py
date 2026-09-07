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
            overviewCleanup:!!(req&&req.defined('game/helpers/ui/AccessibilityOverviewCleanupPatch')),
            finalAudit:!!(req&&req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            loadingDisplay:loading?getComputedStyle(loading).display:'missing',
            mainDisplay:main?getComputedStyle(main).display:'missing'
        };
    """)


def state(driver):
    return driver.execute_script("""
        const overview=document.getElementById('accessibility-player-overview');
        const inventoryOverview=document.getElementById('accessibility-inventory-camp-overview');
        const headers=['mobile-header','header-side','grid-main-header'].map(id=>document.getElementById(id));
        const rp=document.getElementById('player-perks-list-regular');
        const mp=document.getElementById('player-perks-list-mobile');
        const eq=document.getElementById('container-equipment-stats-side');
        const summaries=Array.from(document.querySelectorAll('[data-a11y-summary="1"]'));
        const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
        const labelOf=e=>norm(e&&e.querySelector('.label')&&e.querySelector('.label').textContent)||norm(e&&e.querySelector('img[alt]')&&e.querySelector('img[alt]').getAttribute('alt'));
        const numbers=s=>(String(s||'').replace(/,/g,'.').match(/-?\d+(?:\.\d+)?/g)||[]).map(Number).filter(n=>!Number.isNaN(n));
        const isZeroValue=e=>{
            const v=e&&e.querySelector('.value');
            const ns=numbers(v&&v.textContent);
            return ns.length>0&&ns.every(n=>Math.abs(n)<=0.000001);
        };
        const firstNumber=e=>{
            const v=e&&e.querySelector('.value');
            const ns=numbers(v&&v.textContent);
            return ns.length?ns[0]:null;
        };
        const overviewText=overview?norm(overview.textContent):'';
        const inventoryOverviewText=inventoryOverview?norm(inventoryOverview.textContent):'';
        const overviewLower=overviewText.toLowerCase();
        const inventoryLower=inventoryOverviewText.toLowerCase();
        const equipmentIndex=overviewText.indexOf('Equipment stats.');
        const equipmentText=equipmentIndex>=0?overviewText.slice(equipmentIndex+'Equipment stats.'.length).toLowerCase():'';
        const zeroOptionalPlayerLabels=Array.from(document.querySelectorAll('.stat-indicator-scavenge-bonus')).filter(isZeroValue).map(labelOf).filter(x=>x&&overviewLower.includes(x.toLowerCase()));
        const zeroEquipmentLabels=Array.from(document.querySelectorAll('.container-equipment-stats .stat-indicator')).filter(isZeroValue).map(labelOf).filter(x=>x&&equipmentText.includes(x.toLowerCase()));
        const neutralMovementLabels=Array.from(document.querySelectorAll('.container-equipment-stats .stats-equipment-movement')).filter(e=>firstNumber(e)===1).map(labelOf).filter(x=>x&&equipmentText.includes(x.toLowerCase()));
        const zeroResourceLabels=Array.from(document.querySelectorAll("[id^='resources-bag-'],[id^='resources-camp-']")).filter(isZeroValue).map(labelOf).filter(x=>x&&inventoryLower.includes(x.toLowerCase()));
        const tribeIndicators=Array.from(document.querySelectorAll('.statsbar-tribe-stats .stat-indicator'));
        const tribeAllZero=tribeIndicators.length>0&&tribeIndicators.every(isZeroValue);
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
            overviewText,
            overviewTabindex:overview?overview.getAttribute('tabindex'):null,
            overviewAriaLabel:overview?overview.getAttribute('aria-label'):null,
            overviewRole:overview?overview.getAttribute('role'):null,
            overviewInsideVisualHeader:!!(overview&&overview.closest('#mobile-header,#header-side,#grid-main-header')),
            overviewClean:!!(overview&&inventoryOverview&&overview.getAttribute('data-a11y-overview-clean')==='1'&&inventoryOverview.getAttribute('data-a11y-overview-clean')==='1'),
            inventoryOverviewText,
            inventoryOverviewTabindex:inventoryOverview?inventoryOverview.getAttribute('tabindex'):null,
            inventoryOverviewAriaLabel:inventoryOverview?inventoryOverview.getAttribute('aria-label'):null,
            inventoryOverviewRole:inventoryOverview?inventoryOverview.getAttribute('role'):null,
            inventoryOverviewInsideVisualHeader:!!(inventoryOverview&&inventoryOverview.closest('#mobile-header,#header-side,#grid-main-header')),
            zeroOptionalPlayerLabels,
            zeroEquipmentLabels,
            neutralMovementLabels,
            zeroResourceLabels,
            tribeAllZero,
            tribeSectionPresent:inventoryOverviewText.includes('Tribe stats.'),
            campBareZero:/\bCamp\.\s*0(?:\.|$)/.test(inventoryOverviewText),
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
    player_text=a['overviewText']
    inventory_text=a['inventoryOverviewText']
    return (
        a['headersInert']
        and a['overviewClean']
        and player_text.startswith('Player overview.')
        and 'Player status.' in player_text
        and 'Status effects.' in player_text
        and inventory_text.startswith('Inventory and camp overview.')
        and 'Inventory.' in inventory_text
    )


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

        if not all(m[k] for k in ('requirejs','initializer','accessibility','mobileExperience','overviewCleanup','finalAudit')): raise RuntimeError('Required modules did not initialize')
        if not a['overviewClean']: raise RuntimeError('Overview cleanup patch did not mark both summaries')
        if not a['overviewText'].startswith('Player overview.'): raise RuntimeError('Player overview real-text node missing')
        if 'Player status.' not in a['overviewText'] or 'Status effects.' not in a['overviewText']: raise RuntimeError('Player overview does not contain core status information')
        if 'Inventory.' in a['overviewText']: raise RuntimeError('Inventory leaked back into Player overview')
        if a['zeroOptionalPlayerLabels']: raise RuntimeError(f"Zero-value optional player stats leaked into overview: {a['zeroOptionalPlayerLabels']}")
        if a['zeroEquipmentLabels']: raise RuntimeError(f"Zero-value equipment stats leaked into overview: {a['zeroEquipmentLabels']}")
        if a['neutralMovementLabels']: raise RuntimeError(f"Neutral movement-cost stats leaked into overview: {a['neutralMovementLabels']}")
        if not a['inventoryOverviewText'].startswith('Inventory and camp overview.'): raise RuntimeError('Inventory and camp overview real-text node missing')
        if 'Inventory.' not in a['inventoryOverviewText']: raise RuntimeError('Inventory and camp overview does not contain inventory information')
        if a['zeroResourceLabels']: raise RuntimeError(f"Zero-value resource names leaked into inventory/camp overview: {a['zeroResourceLabels']}")
        if a['tribeAllZero'] and a['tribeSectionPresent']: raise RuntimeError('All-zero Tribe stats section should be omitted')
        if a['campBareZero']: raise RuntimeError('Camp overview contains an unlabeled bare zero')
        if a['overviewTabindex'] is not None or a['overviewAriaLabel'] is not None or a['overviewRole'] is not None: raise RuntimeError('Player overview is still synthetic/focusable')
        if a['inventoryOverviewTabindex'] is not None or a['inventoryOverviewAriaLabel'] is not None or a['inventoryOverviewRole'] is not None: raise RuntimeError('Inventory and camp overview is still synthetic/focusable')
        if a['overviewInsideVisualHeader'] or a['inventoryOverviewInsideVisualHeader']: raise RuntimeError('An accessibility overview is inside a visual header')
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
        player_overview_names=[n for n in names if n.startswith('Player overview.')]
        inventory_overview_names=[n for n in names if n.startswith('Inventory and camp overview.')]
        print(f'AX player overview {width}x{height}:',json.dumps(player_overview_names[:3]))
        print(f'AX inventory overview {width}x{height}:',json.dumps(inventory_overview_names[:3]))
        if len(player_overview_names)!=1: raise RuntimeError(f'Expected exactly one Player overview AX node, found {len(player_overview_names)}')
        if len(inventory_overview_names)!=1: raise RuntimeError(f'Expected exactly one Inventory and camp overview AX node, found {len(inventory_overview_names)}')
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
print('Clean two-overview TalkBack regression test passed in phone and wide viewport modes.')
