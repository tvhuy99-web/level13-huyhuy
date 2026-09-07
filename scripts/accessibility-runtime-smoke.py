import json
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
        const loading = document.querySelector('.loading-content');
        const main = document.getElementById('unit-main');
        const req = window.requirejs;
        const defined = req && req.s && req.s.contexts && req.s.contexts._ ? Object.keys(req.s.contexts._.defined) : [];
        return {
            readyState: document.readyState,
            requirejs: !!req,
            initializer: !!(req && req.defined('game/GameGlobalsInitializer')),
            accessibility: !!(req && req.defined('game/helpers/ui/AccessibilityHelper')),
            mobileExperience: !!(req && req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper')),
            finalAudit: !!(req && req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            definedCount: defined.length,
            loadingDisplay: loading ? getComputedStyle(loading).display : 'missing',
            mainDisplay: main ? getComputedStyle(main).display : 'missing'
        };
    """)

def accessibility_state(driver):
    return driver.execute_script("""
        const visible = e => {
            if (!e || !e.isConnected) return false;
            for (let x=e; x && x!==document.documentElement; x=x.parentElement) {
                const s=getComputedStyle(x);
                if (s.display==='none' || s.visibility==='hidden' || x.hidden) return false;
            }
            return true;
        };
        const body=document.body;
        const small=!!(body && body.classList.contains('layout-small'));
        const activePerks=document.getElementById(small ? 'player-perks-list-mobile' : 'player-perks-list-regular');
        const inactivePerks=document.getElementById(small ? 'player-perks-list-regular' : 'player-perks-list-mobile');
        const playerStats=Array.from(document.querySelectorAll('.player-stats-container')).find(visible) || null;
        const compactVisible=Array.from(document.querySelectorAll('[data-a11y-compact="1"]')).filter(visible);
        const silentCalloutStops=Array.from(document.querySelectorAll('.info-callout-target[tabindex="0"]')).filter(t => {
            const c=t.closest('.callout-container');
            const d=c && c.querySelector('.info-callout');
            if (!d) return false;
            return !d.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']");
        });
        const compactWithFocusableChildren=compactVisible.filter(e => e.querySelector("button,input,select,textarea,a[href],[tabindex='0'],[role='button'],[role='radio'],[role='option']"));
        const activePerkChildren=activePerks ? Array.from(activePerks.children) : [];
        const activePerkCompactChildren=activePerks ? Array.from(activePerks.querySelectorAll(':scope > [data-a11y-compact="1"]')) : [];
        const movementStatus=document.getElementById('accessibility-movement-status');
        const north=document.getElementById('out-action-move-north');
        const compass=document.getElementById('out-container-compass-actions');
        return {
            smallLayout: small,
            compactCount: compactVisible.length,
            compactLabels: compactVisible.slice(0, 12).map(e => e.getAttribute('aria-label')),
            silentCalloutStopCount: silentCalloutStops.length,
            compactWithFocusableChildrenCount: compactWithFocusableChildren.length,
            playerStatsCompact: !!(playerStats && playerStats.getAttribute('data-a11y-compact') === '1'),
            playerStatsTabIndex: playerStats ? playerStats.getAttribute('tabindex') : null,
            playerStatsLabel: playerStats ? playerStats.getAttribute('aria-label') : null,
            playerStatsVisibleChildCount: playerStats ? Array.from(playerStats.children).filter(c => c.getAttribute('aria-hidden') !== 'true').length : null,
            activePerksCompact: !!(activePerks && activePerks.getAttribute('data-a11y-compact') === '1'),
            activePerksTabIndex: activePerks ? activePerks.getAttribute('tabindex') : null,
            activePerksLabel: activePerks ? activePerks.getAttribute('aria-label') : null,
            activePerkVisibleChildCount: activePerkChildren.filter(c => c.getAttribute('aria-hidden') !== 'true').length,
            activePerkCompactChildCount: activePerkCompactChildren.length,
            inactivePerksHidden: inactivePerks ? inactivePerks.getAttribute('aria-hidden') : null,
            noteCount: document.querySelectorAll('.info-callout-target[role="note"]').length,
            movementStatusText: movementStatus ? movementStatus.textContent.trim() : '',
            northLabel: north ? north.getAttribute('aria-label') : null,
            compassLabel: compass ? compass.getAttribute('aria-label') : null
        };
    """)

def browser_logs(driver):
    logs=driver.get_log('browser')
    for entry in logs:
        print(f"BROWSER {entry.get('level')}: {entry.get('message')}")
    return logs

driver=webdriver.Chrome(options=options)
try:
    driver.get('http://127.0.0.1:8000/')
    try:
        WebDriverWait(driver,45).until(lambda d: snapshot(d)['loadingDisplay']=='none' and snapshot(d)['mainDisplay']!='none')
    except TimeoutException:
        print('TIMEOUT:', json.dumps(snapshot(driver), sort_keys=True)); browser_logs(driver); raise

    module_state=snapshot(driver)
    print('Runtime state:', json.dumps(module_state, sort_keys=True))
    if not all(module_state[k] for k in ('requirejs','initializer','accessibility','mobileExperience','finalAudit')):
        browser_logs(driver); raise RuntimeError('Required modules did not initialize')

    try:
        WebDriverWait(driver,10).until(lambda d: (
            accessibility_state(d)['playerStatsCompact'] and
            accessibility_state(d)['activePerksCompact'] and
            accessibility_state(d)['northLabel']=='Move north'
        ))
    except TimeoutException:
        print('A11Y TIMEOUT:', json.dumps(accessibility_state(driver), sort_keys=True)); browser_logs(driver); raise

    a=accessibility_state(driver)
    print('Accessibility state:', json.dumps(a, sort_keys=True))
    if a['silentCalloutStopCount'] != 0:
        raise RuntimeError(f"Found {a['silentCalloutStopCount']} information-only callout focus stops")
    if a['noteCount'] != 0:
        raise RuntimeError(f"Found {a['noteCount']} role=note callout stops")
    if a['compactWithFocusableChildrenCount'] != 0:
        raise RuntimeError(f"Found {a['compactWithFocusableChildrenCount']} compact read-only groups containing interactive focus stops")
    if a['playerStatsTabIndex'] != '0' or not a['playerStatsLabel']:
        raise RuntimeError('Player stats are not exposed as one labelled focus stop')
    if a['playerStatsVisibleChildCount'] != 0:
        raise RuntimeError('Player stats still expose child swipe stops')
    if a['activePerksTabIndex'] != '0' or not a['activePerksLabel']:
        raise RuntimeError('Status effects are not exposed as one labelled focus stop')
    if a['activePerkVisibleChildCount'] != 0 or a['activePerkCompactChildCount'] != 0:
        raise RuntimeError('Status effects still expose or compact individual child swipe stops')
    if a['inactivePerksHidden'] != 'true':
        raise RuntimeError('Inactive desktop/mobile status copy is exposed')
    if not a['movementStatusText'] or a['compassLabel'] != 'Movement and travel actions':
        raise RuntimeError('Movement accessibility regression')

    severe=[]
    for entry in browser_logs(driver):
        m=entry.get('message','')
        if entry.get('level')=='SEVERE' and ('127.0.0.1:8000' in m or 'Uncaught' in m or 'ReferenceError' in m or 'TypeError' in m): severe.append(m)
    if severe: raise RuntimeError('Browser console errors:\n'+'\n'.join(severe))
    print('Compact focus runtime test passed.')
finally:
    driver.quit()
