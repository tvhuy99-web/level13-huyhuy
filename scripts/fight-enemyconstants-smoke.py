import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.environ.get('LEVEL13_BASE_URL', 'http://127.0.0.1:8000/')


def make_driver():
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=390,844')
    return webdriver.Chrome(options=options)


driver = make_driver()
try:
    driver.get(BASE_URL)
    WebDriverWait(driver, 45).until(lambda d: d.execute_script(
        "return !!(window.requirejs && window.requirejs.defined('game/systems/ui/UIOutFightSystem'));"
    ))

    state = driver.execute_script(r"""
        const Text = window.requirejs('text/Text');
        const UIOutFightSystem = window.requirejs('game/systems/ui/UIOutFightSystem');
        const oldLanguage = Text.currentLanguage;
        Text.currentLanguage = 'VI_VN';
        let displayName = null;
        let error = null;
        try {
            const system = new UIOutFightSystem();
            displayName = system.getEnemyDisplayName({ name: 'cockroach' });
        } catch (e) {
            error = String(e && (e.stack || e.message || e));
        } finally {
            Text.currentLanguage = oldLanguage;
        }
        return {
            globalEnemyConstants: typeof window.EnemyConstants,
            displayName,
            error
        };
    """)

    print('Fight EnemyConstants state:', state)

    if state['globalEnemyConstants'] != 'object':
        raise RuntimeError('EnemyConstants is not available before fight UI execution')
    if state['error']:
        raise RuntimeError('getEnemyDisplayName threw: ' + state['error'])
    if state['displayName'] != 'gián':
        raise RuntimeError('Vietnamese enemy display name regression: ' + repr(state['displayName']))
finally:
    driver.quit()

print('Fight EnemyConstants regression passed: Vietnamese fight enemy naming executes without ReferenceError.')
