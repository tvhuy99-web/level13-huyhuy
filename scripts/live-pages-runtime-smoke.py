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

def simple_state(driver):
    return driver.execute_script("""
        function state(id) {
            const el = document.getElementById(id);
            if (!el) return null;
            const cs = getComputedStyle(el);
            return { id, display: cs.display, visibility: cs.visibility, disabled: !!el.disabled, text: (el.innerText || el.textContent || '').trim(), ariaLabel: el.getAttribute('aria-label') };
        }
        return {
            getUp: state('out-action-get-up'),
            scout: state('out-action-scout'),
            compass: state('out-container-compass-actions'),
            north: state('out-action-move-north'),
            east: state('out-action-move-east'),
            south: state('out-action-move-south'),
            west: state('out-action-move-west')
        };
    """)

def perk_diagnostics(driver):
    return driver.execute_script("""
        function d(el) {
            if (!el) return null;
            return {tag: el.tagName, role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label'), ariaDescribedby: el.getAttribute('aria-describedby'), ariaHidden: el.getAttribute('aria-hidden'), text: (el.innerText || el.textContent || '').trim(), description: el.getAttribute('description')};
        }
        return ['player-perks-list-mobile','player-perks-list-regular'].map(id => {
            const list = document.getElementById(id);
            return { id, display: list ? getComputedStyle(list).display : 'missing', items: list ? Array.from(list.querySelectorAll(':scope > li')).map(li => ({li:d(li), target:d(li.querySelector('.info-callout-target')), callout:d(li.querySelector('.info-callout')), imgAlt: li.querySelector('img') ? li.querySelector('img').getAttribute('alt') : null})) : [] };
        });
    """)

def click_visible(driver, text):
    return driver.execute_script("""
        const target = arguments[0].toLowerCase();
        const button = Array.from(document.querySelectorAll('button')).find(b => {
            const cs = getComputedStyle(b);
            return (b.innerText || b.textContent || '').trim().toLowerCase() === target && cs.display !== 'none' && cs.visibility !== 'hidden' && !b.disabled;
        });
        if (!button) return false;
        button.click();
        return true;
    """, text)

def is_hidden(driver, element_id):
    return driver.execute_script("""
        const el = document.getElementById(arguments[0]);
        if (!el) return true;
        const cs = getComputedStyle(el);
        return cs.display === 'none' || cs.visibility === 'hidden';
    """, element_id)

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
    print('PERKS initial:', json.dumps(perk_diagnostics(driver), ensure_ascii=False, sort_keys=True), flush=True)
    print('MOVEMENT initial:', json.dumps(simple_state(driver), ensure_ascii=False, sort_keys=True), flush=True)

    if not all(state[k] for k in ('requirejs', 'initializer', 'accessibility', 'finalAudit')):
        raise RuntimeError('Deployed Pages build is missing required modules')

    print('Clicked continue:', click_visible(driver, 'continue'), flush=True)
    time.sleep(0.5)
    print('Clicked get up:', click_visible(driver, 'get up'), flush=True)
    try:
        WebDriverWait(driver, 20).until(lambda d: is_hidden(d, 'out-action-get-up'))
        print('Get up action completed.', flush=True)
    except TimeoutException:
        print('Get up still visible after 20 seconds.', flush=True)
    print('MOVEMENT after get up completes/waits:', json.dumps(simple_state(driver), ensure_ascii=False, sort_keys=True), flush=True)

    scout = simple_state(driver).get('scout')
    if scout and scout['display'] != 'none' and scout['visibility'] != 'hidden' and not scout['disabled']:
        print('Clicked scout:', click_visible(driver, scout['text'] or 'scout'), flush=True)
        try:
            WebDriverWait(driver, 20).until(lambda d: not is_hidden(d, 'out-container-compass-actions'))
            print('Compass became visible after scout.', flush=True)
        except TimeoutException:
            print('Compass still hidden after scout wait.', flush=True)
    print('MOVEMENT final:', json.dumps(simple_state(driver), ensure_ascii=False, sort_keys=True), flush=True)

    severe = []
    for entry in browser_logs(driver):
        msg = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('tvhuy99-web.github.io' in msg or 'Uncaught' in msg or 'ReferenceError' in msg or 'TypeError' in msg):
            severe.append(msg)
    if severe:
        raise RuntimeError('Deployed Pages browser errors:\n' + '\n'.join(severe))

    print('Live GitHub Pages runtime diagnostic passed.', flush=True)
finally:
    driver.quit()
