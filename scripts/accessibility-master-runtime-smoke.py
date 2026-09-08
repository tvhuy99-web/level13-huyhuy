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


def run_case(width, height):
    driver = make_driver(width, height)
    try:
        driver.get(BASE_URL)
        WebDriverWait(driver, 35).until(lambda d: all(snapshot(d)[k] for k in (
            'requirejs', 'initializer', 'accessibility', 'mobileExperience', 'overviewCleanup', 'finalAudit'
        )))
        WebDriverWait(driver, 20).until(lambda d: snapshot(d)['playerText'].startswith('Player overview.') and snapshot(d)['inventoryText'].startswith('Inventory and camp overview.'))
        state = snapshot(driver)
        print(f'Accessibility browser state {width}x{height}:', json.dumps(state, sort_keys=True))

        if state['playerSynthetic'] or state['inventorySynthetic']:
            raise RuntimeError('Read-only TalkBack summaries became synthetic focus stops')
        if not state['headersHidden'] or not state['headersInert']:
            raise RuntimeError('Visual headers remain reachable by TalkBack')
        if state['silentTabStops'] != 0:
            raise RuntimeError(f"Silent tabindex=0 stops remain: {state['silentTabStops']}")

        severe_accessibility = []
        known_master_world_error = []
        for entry in driver.get_log('browser'):
            if entry.get('level') != 'SEVERE':
                continue
            msg = entry.get('message', '')
            if 'WorldHelper.js' in msg and "Cannot read properties of null (reading 'version')" in msg:
                known_master_world_error.append(msg)
                continue
            if ('Accessibility' in msg or 'GameGlobalsInitializer.js' in msg or 'requirejs' in msg.lower()):
                severe_accessibility.append(msg)

        if severe_accessibility:
            raise RuntimeError('Accessibility browser errors:\n' + '\n'.join(severe_accessibility))
        if known_master_world_error:
            print('Known master 0.7.1 fresh-game WorldHelper issue observed and excluded from accessibility compatibility result.')
    finally:
        driver.quit()


run_case(390, 844)
run_case(980, 844)
print('Accessibility browser compatibility passed on master 0.7.1 in phone and wide viewport modes.')
