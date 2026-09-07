import json
import time
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
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

def a11y_diagnostics(driver):
    return driver.execute_script("""
        function details(el) {
            if (!el) return null;
            const cs = getComputedStyle(el);
            return {
                id: el.id || null,
                tag: el.tagName,
                text: (el.innerText || el.textContent || '').trim(),
                role: el.getAttribute('role'),
                ariaHidden: el.getAttribute('aria-hidden'),
                ariaLabel: el.getAttribute('aria-label'),
                description: el.getAttribute('description'),
                display: cs.display,
                visibility: cs.visibility
            };
        }
        const perkLists = ['player-perks-list-mobile','player-perks-list-regular'].map(id => {
            const list = document.getElementById(id);
            return {
                list: details(list),
                items: list ? Array.from(list.querySelectorAll(':scope > li')).map(li => ({
                    li: details(li),
                    child: details(li.querySelector('.info-callout-target')),
                    imgAlt: li.querySelector('img') ? li.querySelector('img').getAttribute('alt') : null
                })) : []
            };
        });
        const movement = Array.from(document.querySelectorAll('[id^="out-action-move-"]')).map(details);
        const compass = details(document.getElementById('out-container-compass-actions'));
        const getUp = details(document.getElementById('out-action-get-up'));
        const continueButton = Array.from(document.querySelectorAll('#dialogue-popup button, .popup button')).find(b => (b.innerText || '').trim().toLowerCase() === 'continue');
        return { perkLists, movement, compass, getUp, continueButton: details(continueButton) };
    """)

def click_visible_by_text(driver, text):
    text = text.lower()
    return driver.execute_script("""
        const target = arguments[0];
        const candidates = Array.from(document.querySelectorAll('button'));
        const button = candidates.find(b => {
            const label = (b.innerText || b.textContent || '').trim().toLowerCase();
            const cs = getComputedStyle(b);
            return label === target && cs.display !== 'none' && cs.visibility !== 'hidden' && !b.disabled;
        });
        if (!button) return false;
        button.click();
        return true;
    """, text)

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
    print('A11Y before intro actions:', json.dumps(a11y_diagnostics(driver), ensure_ascii=False, sort_keys=True), flush=True)

    if not all(state[k] for k in ('requirejs', 'initializer', 'accessibility', 'finalAudit')):
        browser_logs(driver)
        raise RuntimeError('Deployed Pages build is missing required modules')

    clicked_continue = click_visible_by_text(driver, 'continue')
    print('Clicked continue:', clicked_continue, flush=True)
    time.sleep(1)
    clicked_get_up = click_visible_by_text(driver, 'get up')
    print('Clicked get up:', clicked_get_up, flush=True)
    time.sleep(2)
    print('A11Y after intro actions:', json.dumps(a11y_diagnostics(driver), ensure_ascii=False, sort_keys=True), flush=True)

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
