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
        return {
            readyState: document.readyState,
            requirejs: !!req,
            initializer: !!(req && req.defined('game/GameGlobalsInitializer')),
            accessibility: !!(req && req.defined('game/helpers/ui/AccessibilityHelper')),
            mobileExperience: !!(req && req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper')),
            finalAudit: !!(req && req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            loadingDisplay: loading ? getComputedStyle(loading).display : 'missing',
            mainDisplay: main ? getComputedStyle(main).display : 'missing'
        };
    """)

def accessibility_state(driver):
    return driver.execute_script("""
        const visuallyVisible = e => {
            if (!e || !e.isConnected) return false;
            for (let x=e; x && x!==document.documentElement; x=x.parentElement) {
                const s=getComputedStyle(x);
                if (s.display==='none' || s.visibility==='hidden' || x.hidden) return false;
            }
            return true;
        };
        const inactive = e => !!(e && e.closest('[data-a11y-layout-inactive="1"]'));
        const activeStats = Array.from(document.querySelectorAll('.player-stats-container')).find(e => visuallyVisible(e) && !inactive(e)) || null;
        const summaryFor = source => {
            if (!source || !source.id || !source.parentElement) return null;
            return Array.from(source.parentElement.querySelectorAll(':scope > [data-a11y-summary-for]')).find(s => s.getAttribute('data-a11y-summary-for') === source.id) || null;
        };
        const playerSummary = summaryFor(activeStats);
        const statusSummary = document.querySelector('#mobile-header-status > [data-a11y-summary-key="status-mobile"]');
        const mobilePerks = document.getElementById('player-perks-list-mobile');
        const regularPerks = document.getElementById('player-perks-list-regular');
        const equipmentSide = document.getElementById('container-equipment-stats-side');
        const headerSide = document.getElementById('header-side');
        const mainHeader = document.getElementById('grid-main-header');
        const summaries = Array.from(document.querySelectorAll('[data-a11y-summary="1"]')).filter(s => !inactive(s));
        const silentCalloutStops = Array.from(document.querySelectorAll('.info-callout-target[tabindex="0"]')).filter(t => {
            const c=t.closest('.callout-container');
            const d=c && c.querySelector('.info-callout');
            if (!d) return false;
            return !d.querySelector("button,input,select,textarea,a[href],[role='button'],[role='radio'],[role='option']");
        });
        const movementStatus=document.getElementById('accessibility-movement-status');
        const north=document.getElementById('out-action-move-north');
        const compass=document.getElementById('out-container-compass-actions');
        return {
            smallLayout: document.body.classList.contains('layout-small'),
            oldCompactCount: document.querySelectorAll('[data-a11y-compact="1"]').length,
            summaryCount: summaries.length,
            summaryTexts: summaries.slice(0, 16).map(s => (s.textContent || '').trim()),
            summaryTabindexCount: summaries.filter(s => s.hasAttribute('tabindex')).length,
            summaryAriaLabelCount: summaries.filter(s => s.hasAttribute('aria-label')).length,
            emptySummaryCount: summaries.filter(s => !(s.textContent || '').trim()).length,
            playerSummaryText: playerSummary ? playerSummary.textContent.trim() : '',
            playerSummaryTabindex: playerSummary ? playerSummary.getAttribute('tabindex') : null,
            playerSummaryAriaLabel: playerSummary ? playerSummary.getAttribute('aria-label') : null,
            playerVisualHidden: activeStats ? activeStats.getAttribute('aria-hidden') : null,
            playerVisualInert: activeStats ? activeStats.hasAttribute('inert') : null,
            playerVisualTabindex: activeStats ? activeStats.getAttribute('tabindex') : null,
            statusSummaryText: statusSummary ? statusSummary.textContent.trim() : '',
            statusSummaryTabindex: statusSummary ? statusSummary.getAttribute('tabindex') : null,
            mobilePerksHidden: mobilePerks ? mobilePerks.getAttribute('aria-hidden') : null,
            mobilePerksInert: mobilePerks ? mobilePerks.hasAttribute('inert') : null,
            mobilePerksTabindex: mobilePerks ? mobilePerks.getAttribute('tabindex') : null,
            regularPerksHidden: regularPerks ? regularPerks.getAttribute('aria-hidden') : null,
            regularPerksInert: regularPerks ? regularPerks.hasAttribute('inert') : null,
            regularPerksTabindex: regularPerks ? regularPerks.getAttribute('tabindex') : null,
            headerSideHidden: headerSide ? headerSide.getAttribute('aria-hidden') : null,
            headerSideInert: headerSide ? headerSide.hasAttribute('inert') : null,
            mainHeaderHidden: mainHeader ? mainHeader.getAttribute('aria-hidden') : null,
            mainHeaderInert: mainHeader ? mainHeader.hasAttribute('inert') : null,
            equipmentSideInInactiveTree: !!(equipmentSide && equipmentSide.closest('[inert]')),
            equipmentSideTabindex: equipmentSide ? equipmentSide.getAttribute('tabindex') : null,
            silentCalloutStopCount: silentCalloutStops.length,
            noteCount: document.querySelectorAll('.info-callout-target[role="note"]').length,
            movementStatusText: movementStatus ? movementStatus.textContent.trim() : '',
            northLabel: north ? north.getAttribute('aria-label') : null,
            compassLabel: compass ? compass.getAttribute('aria-label') : null
        };
    """)

def ax_names(driver):
    tree = driver.execute_cdp_cmd('Accessibility.getFullAXTree', {})
    names = []
    for node in tree.get('nodes', []):
        if node.get('ignored'):
            continue
        name = (node.get('name') or {}).get('value')
        if name:
            names.append(str(name).strip())
    return names

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
        WebDriverWait(driver,12).until(lambda d: (
            accessibility_state(d)['smallLayout'] and
            bool(accessibility_state(d)['playerSummaryText']) and
            bool(accessibility_state(d)['statusSummaryText']) and
            accessibility_state(d)['headerSideInert'] and
            accessibility_state(d)['northLabel']=='Move north'
        ))
    except TimeoutException:
        print('A11Y TIMEOUT:', json.dumps(accessibility_state(driver), sort_keys=True)); browser_logs(driver); raise

    a=accessibility_state(driver)
    print('TalkBack DOM state:', json.dumps(a, sort_keys=True))

    if a['oldCompactCount'] != 0:
        raise RuntimeError('Old tabindex + aria-label compact model is still present')
    if a['summaryTabindexCount'] != 0 or a['summaryAriaLabelCount'] != 0 or a['emptySummaryCount'] != 0:
        raise RuntimeError('Real-text summaries are focusable, synthetic, or empty')
    if not a['playerSummaryText'].startswith('Player status.'):
        raise RuntimeError('Player status real-text summary is missing')
    if a['playerSummaryTabindex'] is not None or a['playerSummaryAriaLabel'] is not None:
        raise RuntimeError('Player status summary still relies on focus/aria-label')
    if a['playerVisualHidden'] != 'true' or not a['playerVisualInert'] or a['playerVisualTabindex'] is not None:
        raise RuntimeError('Visual player-stat icons remain exposed to TalkBack')
    if not a['statusSummaryText'].startswith('Status effects.'):
        raise RuntimeError('Status effects real-text summary is missing')
    if a['statusSummaryTabindex'] is not None:
        raise RuntimeError('Status effects summary is incorrectly focusable')
    if a['mobilePerksHidden'] != 'true' or not a['mobilePerksInert'] or a['mobilePerksTabindex'] is not None:
        raise RuntimeError('Mobile status icon list remains exposed')
    if a['regularPerksHidden'] != 'true' or not a['regularPerksInert'] or a['regularPerksTabindex'] is not None:
        raise RuntimeError('player-perks-list-regular is still reachable on phone')
    if a['headerSideHidden'] != 'true' or not a['headerSideInert']:
        raise RuntimeError('Desktop side header is still reachable on phone')
    if a['mainHeaderHidden'] != 'true' or not a['mainHeaderInert']:
        raise RuntimeError('Desktop main header is still reachable on phone')
    if not a['equipmentSideInInactiveTree'] or a['equipmentSideTabindex'] is not None:
        raise RuntimeError('container-equipment-stats-side is still reachable on phone')
    if a['silentCalloutStopCount'] != 0 or a['noteCount'] != 0:
        raise RuntimeError('Silent information-only callout stops remain')
    if not a['movementStatusText'] or a['compassLabel'] != 'Movement and travel actions':
        raise RuntimeError('Movement accessibility regression')

    names = ax_names(driver)
    relevant = [n for n in names if n.startswith('Player status.') or n.startswith('Status effects.')]
    print('AX real-text summaries:', json.dumps(relevant[:10]))
    if not any(n.startswith('Player status.') for n in names):
        raise RuntimeError('Chrome accessibility tree does not expose Player status text')
    if not any(n.startswith('Status effects.') for n in names):
        raise RuntimeError('Chrome accessibility tree does not expose Status effects text')

    severe=[]
    for entry in browser_logs(driver):
        m=entry.get('message','')
        if entry.get('level')=='SEVERE' and ('127.0.0.1:8000' in m or 'Uncaught' in m or 'ReferenceError' in m or 'TypeError' in m): severe.append(m)
    if severe: raise RuntimeError('Browser console errors:\n'+'\n'.join(severe))

    print('Real-text TalkBack regression test passed.')
finally:
    driver.quit()
