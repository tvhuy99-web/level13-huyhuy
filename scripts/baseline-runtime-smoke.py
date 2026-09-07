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
            definedCount: defined.length,
            loadingDisplay: loading ? getComputedStyle(loading).display : 'missing',
            thinkingDisplay: thinking ? getComputedStyle(thinking).display : 'missing',
            mainDisplay: main ? getComputedStyle(main).display : 'missing',
            mobileDisplay: mobile ? getComputedStyle(mobile).display : 'missing',
            bodyTextStart: document.body ? document.body.innerText.slice(0, 500) : ''
        };
    """)

def print_browser_logs(driver):
    logs = driver.get_log('browser')
    print('Browser console entries:', len(logs), flush=True)
    for entry in logs:
        print(f"BROWSER {entry.get('level')}: {entry.get('message')}", flush=True)
    return logs

driver = webdriver.Chrome(options=options)
try:
    driver.get('http://127.0.0.1:8000/')

    def game_started(d):
        state = snapshot(d)
        return state['loadingDisplay'] == 'none' and state['mainDisplay'] != 'none'

    try:
        WebDriverWait(driver, 45).until(game_started)
    except TimeoutException:
        print('BASELINE TIMEOUT runtime state:', json.dumps(snapshot(driver), sort_keys=True), flush=True)
        print_browser_logs(driver)
        raise

    state = snapshot(driver)
    print('BASELINE Runtime state:', json.dumps(state, sort_keys=True), flush=True)
    logs = print_browser_logs(driver)
    severe = [x.get('message', '') for x in logs if x.get('level') == 'SEVERE' and ('127.0.0.1:8000' in x.get('message', '') or 'Uncaught' in x.get('message', '') or 'ReferenceError' in x.get('message', '') or 'TypeError' in x.get('message', ''))]
    if severe:
        raise RuntimeError('Browser console errors:\n' + '\n'.join(severe))
    print('Baseline browser runtime smoke test passed.', flush=True)
finally:
    driver.quit()
