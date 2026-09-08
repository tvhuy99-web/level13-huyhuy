import json
import time
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
            detailedErrorReporter: !!(req && req.defined('game/helpers/ui/AccessibilityDetailedErrorHelper')),
            detailedError: window.__level13LastDetailedError || null,
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


def click_intro_continue(driver):
    return driver.execute_script("""
        const popups = Array.from(document.querySelectorAll('.popup')).filter(p => {
            const s = getComputedStyle(p);
            return s.display !== 'none' && s.visibility !== 'hidden';
        });
        for (const popup of popups) {
            const text = (popup.textContent || '').replace(/\\s+/g, ' ').trim();
            if (!text.includes('Bóng tối') && !text.includes('Darkness')) continue;
            const button = Array.from(popup.querySelectorAll('button')).find(b => {
                const label = (b.textContent || '').replace(/\\s+/g, ' ').trim();
                return label === 'Tiếp tục' || label === 'Continue';
            });
            if (button) {
                button.click();
                return true;
            }
        }
        return false;
    """)


def browser_errors(driver):
    result = []
    for entry in driver.get_log('browser'):
        msg = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('127.0.0.1:8000' in msg or 'Uncaught' in msg or 'TypeError' in msg or 'ReferenceError' in msg):
            result.append(msg)
    return result


def has_fatal_popup(state):
    text = state['visiblePopupText']
    return 'Đã xảy ra lỗi!' in text or "You've found a bug!" in text


def run_case(width, height):
    driver = make_driver(width, height)
    try:
        driver.get(BASE_URL)
        WebDriverWait(driver, 45).until(lambda d: all(snapshot(d)[k] for k in (
            'requirejs', 'initializer', 'accessibility', 'mobileExperience', 'overviewCleanup', 'finalAudit', 'detailedErrorReporter'
        )))
        WebDriverWait(driver, 45).until(lambda d: snapshot(d)['loadingDisplay'] == 'none' and snapshot(d)['mainDisplay'] != 'none')
        WebDriverWait(driver, 25).until(lambda d: is_player_overview_ready(snapshot(d)['playerText']) and is_inventory_overview_ready(snapshot(d)['inventoryText']))

        state = snapshot(driver)
        print(f'Accessibility browser state before intro continue {width}x{height}:', json.dumps(state, ensure_ascii=False, sort_keys=True))

        if has_fatal_popup(state):
            raise RuntimeError('Fresh startup opened the fatal JavaScript error popup before intro continue')
        if state['playerSynthetic'] or state['inventorySynthetic']:
            raise RuntimeError('Read-only TalkBack summaries became synthetic focus stops')
        if not state['headersHidden'] or not state['headersInert']:
            raise RuntimeError('Visual headers remain reachable by TalkBack')
        if state['silentTabStops'] != 0:
            raise RuntimeError(f"Silent tabindex=0 stops remain: {state['silentTabStops']}")

        WebDriverWait(driver, 20).until(click_intro_continue)
        WebDriverWait(driver, 15).until(lambda d: 'Bóng tối' not in snapshot(d)['visiblePopupText'] or has_fatal_popup(snapshot(d)))
        time.sleep(2)

        post_state = snapshot(driver)
        errors = browser_errors(driver)
        print(f'Accessibility browser state after intro continue {width}x{height}:', json.dumps(post_state, ensure_ascii=False, sort_keys=True))

        if has_fatal_popup(post_state):
            detail = json.dumps(post_state['detailedError'], ensure_ascii=False, sort_keys=True)
            console = '\n'.join(errors) if errors else '(no severe browser log captured)'
            raise RuntimeError('Fatal error after intro Continue. Detailed error: ' + detail + '\nBrowser console:\n' + console)
        if errors:
            raise RuntimeError('Browser console errors after intro Continue:\n' + '\n'.join(errors))
    finally:
        driver.quit()


run_case(390, 844)
run_case(980, 844)
print('Fresh Vietnamese startup, intro Continue, and accessibility compatibility passed in phone and wide viewport modes.')