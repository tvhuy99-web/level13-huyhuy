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
        const loading = document.querySelector('.loading-content');
        const thinking = document.querySelector('.thinking-content');
        const main = document.getElementById('unit-main');
        const mobile = document.getElementById('mobile-overlay');
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
            accessibilityModules: defined.filter(x => x.indexOf('Accessibility') >= 0),
            loadingDisplay: loading ? getComputedStyle(loading).display : 'missing',
            thinkingDisplay: thinking ? getComputedStyle(thinking).display : 'missing',
            mainDisplay: main ? getComputedStyle(main).display : 'missing',
            mobileDisplay: mobile ? getComputedStyle(mobile).display : 'missing',
            bodyTextStart: document.body ? document.body.innerText.slice(0, 500) : ''
        };
    """)

def accessibility_state(driver):
    return driver.execute_script("""
        const body = document.body;
        const small = !!(body && body.classList.contains('layout-small'));
        const activePerks = document.getElementById(small ? 'player-perks-list-mobile' : 'player-perks-list-regular');
        const inactivePerks = document.getElementById(small ? 'player-perks-list-regular' : 'player-perks-list-mobile');
        const noteTargets = activePerks ? Array.from(activePerks.querySelectorAll('.info-callout-target[role="note"]')) : [];
        const exposedCallouts = activePerks ? Array.from(activePerks.querySelectorAll('.info-callout:not([aria-hidden="true"])')) : [];
        const firstTarget = activePerks ? activePerks.querySelector('.info-callout-target') : null;
        const firstImage = firstTarget ? firstTarget.querySelector('img') : null;
        const movementStatus = document.getElementById('accessibility-movement-status');
        const north = document.getElementById('out-action-move-north');
        const compass = document.getElementById('out-container-compass-actions');
        return {
            smallLayout: small,
            activePerksID: activePerks ? activePerks.id : null,
            activeNoteCount: noteTargets.length,
            activeExposedCalloutCount: exposedCallouts.length,
            firstPerkLabel: firstTarget ? firstTarget.getAttribute('aria-label') : null,
            firstPerkRole: firstTarget ? firstTarget.getAttribute('role') : null,
            firstPerkImageAlt: firstImage ? firstImage.getAttribute('alt') : null,
            firstPerkImageHidden: firstImage ? firstImage.getAttribute('aria-hidden') : null,
            inactivePerksHidden: inactivePerks ? inactivePerks.getAttribute('aria-hidden') : null,
            movementStatusExists: !!movementStatus,
            movementStatusText: movementStatus ? movementStatus.textContent.trim() : '',
            northLabel: north ? north.getAttribute('aria-label') : null,
            compassLabel: compass ? compass.getAttribute('aria-label') : null,
            compassHidden: compass ? compass.getAttribute('aria-hidden') : null
        };
    """)

def print_browser_logs(driver):
    logs = driver.get_log('browser')
    print('Browser console entries:', len(logs))
    for entry in logs:
        print(f"BROWSER {entry.get('level')}: {entry.get('message')}")
    return logs

driver = webdriver.Chrome(options=options)
try:
    driver.get('http://127.0.0.1:8000/')

    def game_started(d):
        state = snapshot(d)
        loading_hidden = state['loadingDisplay'] == 'none'
        main_visible = state['mainDisplay'] != 'none'
        return loading_hidden and main_visible

    try:
        WebDriverWait(driver, 45).until(game_started)
    except TimeoutException:
        print('TIMEOUT runtime state:', json.dumps(snapshot(driver), sort_keys=True))
        print_browser_logs(driver)
        raise

    module_state = snapshot(driver)
    print('Runtime state:', json.dumps(module_state, sort_keys=True))

    if not all(module_state[k] for k in ('requirejs', 'initializer', 'accessibility', 'mobileExperience', 'finalAudit')):
        print_browser_logs(driver)
        raise RuntimeError('Required game/accessibility modules did not initialize')

    try:
        WebDriverWait(driver, 8).until(lambda d: (
            accessibility_state(d)['movementStatusExists'] and
            accessibility_state(d)['activeNoteCount'] == 0 and
            accessibility_state(d)['activeExposedCalloutCount'] == 0 and
            accessibility_state(d)['northLabel'] == 'Move north'
        ))
    except TimeoutException:
        print('ACCESSIBILITY REGRESSION STATE:', json.dumps(accessibility_state(driver), sort_keys=True))
        print_browser_logs(driver)
        raise

    a11y = accessibility_state(driver)
    print('Accessibility state:', json.dumps(a11y, sort_keys=True))

    if a11y['firstPerkRole'] == 'note':
        raise RuntimeError('Status effect still exposes a duplicate role=note stop')
    if a11y['firstPerkLabel'] == 'More information':
        raise RuntimeError('Status effect still exposes generic More information label')
    if a11y['firstPerkImageAlt'] not in ('', None) or a11y['firstPerkImageHidden'] != 'true':
        raise RuntimeError('Status effect image still creates a duplicate accessible name')
    if a11y['inactivePerksHidden'] != 'true':
        raise RuntimeError('Inactive mobile/desktop status copy is still exposed')
    if not a11y['movementStatusText']:
        raise RuntimeError('Movement guidance region is empty')
    if a11y['compassLabel'] != 'Movement and travel actions':
        raise RuntimeError('Movement group is missing an accessible name')

    severe = []
    for entry in print_browser_logs(driver):
        message = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('127.0.0.1:8000' in message or 'Uncaught' in message or 'ReferenceError' in message or 'TypeError' in message):
            severe.append(message)
    if severe:
        raise RuntimeError('Browser console errors:\n' + '\n'.join(severe))

    print('Browser runtime smoke test passed: game booted and mobile status/movement accessibility regressions are fixed.')
finally:
    driver.quit()
