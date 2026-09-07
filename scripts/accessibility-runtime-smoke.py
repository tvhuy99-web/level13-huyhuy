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

    if not all(module_state[k] for k in ('requirejs', 'initializer', 'accessibility', 'finalAudit')):
        print_browser_logs(driver)
        raise RuntimeError('Required game/accessibility modules did not initialize')

    severe = []
    for entry in print_browser_logs(driver):
        message = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('127.0.0.1:8000' in message or 'Uncaught' in message or 'ReferenceError' in message or 'TypeError' in message):
            severe.append(message)
    if severe:
        raise RuntimeError('Browser console errors:\n' + '\n'.join(severe))

    print('Browser runtime smoke test passed: game left Loading state and accessibility modules initialized.')
finally:
    driver.quit()
