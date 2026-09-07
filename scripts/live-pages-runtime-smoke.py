import json
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
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
        const loading = document.querySelector('.loading-content');
        const main = document.getElementById('unit-main');
        const req = window.requirejs;
        const defined = req && req.s && req.s.contexts && req.s.contexts._ ? Object.keys(req.s.contexts._.defined) : [];
        return {
            url: location.href,
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

def a11y_state(driver):
    return driver.execute_script("""
        const small = document.body.classList.contains('layout-small');
        const active = document.getElementById(small ? 'player-perks-list-mobile' : 'player-perks-list-regular');
        const inactive = document.getElementById(small ? 'player-perks-list-regular' : 'player-perks-list-mobile');
        const target = active ? active.querySelector('.info-callout-target') : null;
        const image = target ? target.querySelector('img') : null;
        const movement = document.getElementById('accessibility-movement-status');
        const north = document.getElementById('out-action-move-north');
        const compass = document.getElementById('out-container-compass-actions');
        return {
            noteCount: active ? active.querySelectorAll('.info-callout-target[role="note"]').length : -1,
            exposedTooltipCount: active ? active.querySelectorAll('.info-callout:not([aria-hidden="true"])').length : -1,
            firstLabel: target ? target.getAttribute('aria-label') : null,
            firstRole: target ? target.getAttribute('role') : null,
            firstImageAlt: image ? image.getAttribute('alt') : null,
            firstImageHidden: image ? image.getAttribute('aria-hidden') : null,
            inactiveHidden: inactive ? inactive.getAttribute('aria-hidden') : null,
            movementText: movement ? movement.textContent.trim() : '',
            northLabel: north ? north.getAttribute('aria-label') : null,
            compassLabel: compass ? compass.getAttribute('aria-label') : null
        };
    """)

def browser_logs(driver):
    logs = driver.get_log('browser')
    for entry in logs:
        print(f"BROWSER {entry.get('level')}: {entry.get('message')}", flush=True)
    return logs

driver = webdriver.Chrome(options=options)
try:
    print('Opening', URL, flush=True)
    driver.get(URL)
    WebDriverWait(driver, 45).until(lambda d: snapshot(d)['loadingDisplay'] == 'none' and snapshot(d)['mainDisplay'] != 'none')

    state = snapshot(driver)
    print('LIVE Runtime state:', json.dumps(state, sort_keys=True), flush=True)
    if not all(state[k] for k in ('requirejs', 'initializer', 'accessibility', 'mobileExperience', 'finalAudit')):
        raise RuntimeError('Deployed Pages build is missing required modules')

    WebDriverWait(driver, 8).until(lambda d: (
        a11y_state(d)['noteCount'] == 0 and
        a11y_state(d)['exposedTooltipCount'] == 0 and
        a11y_state(d)['northLabel'] == 'Move north' and
        bool(a11y_state(d)['movementText'])
    ))
    a11y = a11y_state(driver)
    print('LIVE Accessibility state:', json.dumps(a11y, sort_keys=True), flush=True)

    if a11y['firstRole'] == 'note' or a11y['firstLabel'] == 'More information':
        raise RuntimeError('Live status effect still exposes duplicate note semantics')
    if a11y['firstImageAlt'] not in ('', None) or a11y['firstImageHidden'] != 'true':
        raise RuntimeError('Live status image still duplicates the status name')
    if a11y['inactiveHidden'] != 'true':
        raise RuntimeError('Live inactive header copy remains exposed to screen readers')
    if a11y['compassLabel'] != 'Movement and travel actions':
        raise RuntimeError('Live movement controls are missing accessible grouping')

    severe = []
    for entry in browser_logs(driver):
        msg = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('tvhuy99-web.github.io' in msg or 'Uncaught' in msg or 'ReferenceError' in msg or 'TypeError' in msg):
            severe.append(msg)
    if severe:
        raise RuntimeError('Deployed Pages browser errors:\n' + '\n'.join(severe))

    print('Live GitHub Pages accessibility regression test passed.', flush=True)
finally:
    driver.quit()
