import json
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

options = Options()
options.add_argument('--headless=new')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('--window-size=390,844')
options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=options)
try:
    driver.get('http://127.0.0.1:8000/')

    def game_started(d):
        return d.execute_script("""
            const loading = document.querySelector('.loading-content');
            const main = document.getElementById('unit-main');
            if (!loading || !main) return false;
            const loadingHidden = getComputedStyle(loading).display === 'none' || loading.hidden;
            const mainVisible = getComputedStyle(main).display !== 'none';
            return loadingHidden && mainVisible;
        """)

    WebDriverWait(driver, 45).until(game_started)

    module_state = driver.execute_script("""
        return {
            requirejs: !!window.requirejs,
            initializer: !!(window.requirejs && requirejs.defined('game/GameGlobalsInitializer')),
            accessibility: !!(window.requirejs && requirejs.defined('game/helpers/ui/AccessibilityHelper')),
            finalAudit: !!(window.requirejs && requirejs.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            loadingDisplay: getComputedStyle(document.querySelector('.loading-content')).display,
            mainDisplay: getComputedStyle(document.getElementById('unit-main')).display
        };
    """)
    print('Runtime state:', json.dumps(module_state, sort_keys=True))

    if not all(module_state[k] for k in ('requirejs', 'initializer', 'accessibility', 'finalAudit')):
        raise RuntimeError('Required game/accessibility modules did not initialize')

    severe = []
    for entry in driver.get_log('browser'):
        message = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('127.0.0.1:8000' in message or 'Uncaught' in message or 'ReferenceError' in message or 'TypeError' in message):
            severe.append(message)
    if severe:
        raise RuntimeError('Browser console errors:\n' + '\n'.join(severe))

    print('Browser runtime smoke test passed: game left Loading state and accessibility modules initialized.')
finally:
    driver.quit()
