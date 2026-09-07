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
            finalAudit: !!(req && req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            definedCount: defined.length,
            loadingDisplay: loading ? getComputedStyle(loading).display : 'missing',
            mainDisplay: main ? getComputedStyle(main).display : 'missing',
            bodyTextStart: document.body ? document.body.innerText.slice(0, 500) : ''
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

    def game_started(d):
        state = snapshot(d)
        return state['loadingDisplay'] == 'none' and state['mainDisplay'] != 'none'

    try:
        WebDriverWait(driver, 45).until(game_started)
    except TimeoutException:
        print('LIVE TIMEOUT:', json.dumps(snapshot(driver), sort_keys=True), flush=True)
        browser_logs(driver)
        raise

    state = snapshot(driver)
    print('LIVE Runtime state:', json.dumps(state, sort_keys=True), flush=True)
    if not all(state[k] for k in ('requirejs', 'initializer', 'accessibility', 'finalAudit')):
        browser_logs(driver)
        raise RuntimeError('Deployed Pages build is missing required modules')

    severe = []
    for entry in browser_logs(driver):
        msg = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('tvhuy99-web.github.io' in msg or 'Uncaught' in msg or 'ReferenceError' in msg or 'TypeError' in msg):
            severe.append(msg)
    if severe:
        raise RuntimeError('Deployed Pages browser errors:\n' + '\n'.join(severe))

    print('Live GitHub Pages runtime smoke test passed.', flush=True)
finally:
    driver.quit()
