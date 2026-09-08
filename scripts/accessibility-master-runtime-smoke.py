import json
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = 'http://127.0.0.1:8000/'


def make_driver(width, height):
    options = Options()
    options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument(f'--window-size={width},{height}')
    options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})
    return webdriver.Chrome(options=options)


def snapshot(driver):
    return driver.execute_script("""
        const req = window.requirejs;
        const player = document.getElementById('accessibility-player-overview');
        const inventory = document.getElementById('accessibility-inventory-camp-overview');
        const headers = ['mobile-header','header-side','grid-main-header'].map(id => document.getElementById(id));
        const loading = document.querySelector('.loading-content');
        const main = document.getElementById('unit-main');
        const visiblePopupText = Array.from(document.querySelectorAll('.popup')).filter(p => {
            const s = getComputedStyle(p);
            return s.display !== 'none' && s.visibility !== 'hidden';
        }).map(p => (p.textContent || '').replace(/\\s+/g, ' ').trim()).join(' | ');
        return {
            requirejs: !!req,
            initializer: !!(req && req.defined('game/GameGlobalsInitializer')),
            accessibility: !!(req && req.defined('game/helpers/ui/AccessibilityHelper')),
            mobileExperience: !!(req && req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper')),
            overviewCleanup: !!(req && req.defined('game/helpers/ui/AccessibilityOverviewCleanupPatch')),
            finalAudit: !!(req && req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            playerText: player ? (player.textContent || '').trim() : '',
            inventoryText: inventory ? (inventory.textContent || '').trim() : '',
            playerSynthetic: !!(player && (player.hasAttribute('tabindex') || player.hasAttribute('aria-label') || player.hasAttribute('role'))),
            inventorySynthetic: !!(inventory && (inventory.hasAttribute('tabindex') || inventory.hasAttribute('aria-label') || inventory.hasAttribute('role'))),
            headersHidden: headers.every(h => !h || h.getAttribute('aria-hidden') === 'true'),
            headersInert: headers.every(h => !h || h.hasAttribute('inert')),
            loadingDisplay: loading ? getComputedStyle(loading).display : 'missing',
            mainDisplay: main ? getComputedStyle(main).display : 'missing',
            visiblePopupText,
            silentTabStops: Array.from(document.querySelectorAll('[tabindex="0"]')).filter(e => {
                const r = (e.getAttribute('role') || '').toLowerCase();
                if (e.matches('button,input,select,textarea,a[href]')) return false;
                if (['button','tab','radio','option','checkbox','switch','slider','menuitem','treeitem'].includes(r)) return false;
                const text = (e.textContent || '').replace(/\\s+/g, ' ').trim();
                const label = (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || '').trim();
                return !text && !label;
            }).length
        };
    """)


def is_player_overview_ready(text):
    return text.startswith('Player overview.') or text.startswith('Tổng quan người chơi.')


def is_inventory_overview_ready(text):
    return text.startswith('Inventory and camp overview.') or text.startswith('Tổng quan túi đồ và trại.')


def run_case(width, height):
    driver = make_driver(width, height)
    try:
        driver.get(BASE_URL)
        WebDriverWait(driver, 45).until(lambda d: all(snapshot(d)[k] for k in (
            'requirejs', 'initializer', 'accessibility', 'mobileExperience', 'overviewCleanup', 'finalAudit'
        )))
        WebDriverWait(driver, 45).until(lambda d: snapshot(d)['loadingDisplay'] == 'none' and snapshot(d)['mainDisplay'] != 'none')
        WebDriverWait(driver, 25).until(lambda d: is_player_overview_ready(snapshot(d)['playerText']) and is_inventory_overview_ready(snapshot(d)['inventoryText']))

        state = snapshot(driver)
        print(f'Accessibility browser state {width}x{height}:', json.dumps(state, ensure_ascii=False, sort_keys=True))

        if 'Đã xảy ra lỗi!' in state['visiblePopupText'] or "You've found a bug!" in state['visiblePopupText']:
            raise RuntimeError('Fresh startup opened the fatal JavaScript error popup')
        if state['playerSynthetic'] or state['inventorySynthetic']:
            raise RuntimeError('Read-only TalkBack summaries became synthetic focus stops')
        if not state['headersHidden'] or not state['headersInert']:
            raise RuntimeError('Visual headers remain reachable by TalkBack')
        if state['silentTabStops'] != 0:
            raise RuntimeError(f"Silent tabindex=0 stops remain: {state['silentTabStops']}")

        local_severe = []
        for entry in driver.get_log('browser'):
            msg = entry.get('message', '')
            if entry.get('level') == 'SEVERE' and ('127.0.0.1:8000' in msg or 'Uncaught' in msg or 'TypeError' in msg or 'ReferenceError' in msg):
                local_severe.append(msg)

        if local_severe:
            raise RuntimeError('Browser console errors:\n' + '\n'.join(local_severe))
    finally:
        driver.quit()


run_case(390, 844)
run_case(980, 844)
print('Fresh Vietnamese startup and accessibility compatibility passed in phone and wide viewport modes.')
