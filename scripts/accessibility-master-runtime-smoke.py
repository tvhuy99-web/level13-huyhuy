import json
import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = os.environ.get('LEVEL13_BASE_URL', 'http://127.0.0.1:8000/')


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
        let mapElements = null;
        try {
            mapElements = req && req.defined('utils/MapElements') ? req('utils/MapElements') : null;
        } catch (e) {}
        const iconEntries = mapElements ? Object.entries(mapElements.icons || {}) : [];
        return {
            requirejs: !!req,
            initializer: !!(req && req.defined('game/GameGlobalsInitializer')),
            accessibility: !!(req && req.defined('game/helpers/ui/AccessibilityHelper')),
            mobileExperience: !!(req && req.defined('game/helpers/ui/AccessibilityMobileExperienceHelper')),
            overviewCleanup: !!(req && req.defined('game/helpers/ui/AccessibilityOverviewCleanupPatch')),
            finalAudit: !!(req && req.defined('game/helpers/ui/AccessibilityFinalAuditHelper')),
            detailedErrorReporter: !!(req && req.defined('game/helpers/ui/AccessibilityDetailedErrorHelper')),
            mapIconPathFix: !!(req && req.defined('game/helpers/ui/AccessibilityMapIconPathFixHelper')),
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
            mapIconUrls: iconEntries.slice(0, 8).map(([key, img]) => [key, img && img.src ? img.src : '']),
            brokenMapIcons: iconEntries.filter(([key, img]) => img && img.complete && img.naturalWidth === 0).map(([key]) => key),
            loadedMapIcons: iconEntries.filter(([key, img]) => img && img.complete && img.naturalWidth > 0).length,
            totalMapIcons: iconEntries.length,
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


def click_popup_button(driver, labels):
    return driver.execute_script("""
        const labels = arguments[0];
        const popups = Array.from(document.querySelectorAll('.popup')).filter(p => {
            const s = getComputedStyle(p);
            return s.display !== 'none' && s.visibility !== 'hidden';
        });
        for (const popup of popups) {
            const button = Array.from(popup.querySelectorAll('button')).find(b => {
                if (b.disabled) return false;
                const label = (b.textContent || '').replace(/\\s+/g, ' ').trim();
                const aria = (b.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim();
                return labels.includes(label) || labels.includes(aria);
            });
            if (button) {
                button.click();
                return true;
            }
        }
        return false;
    """, labels)


def browser_errors(driver):
    result = []
    for entry in driver.get_log('browser'):
        msg = entry.get('message', '')
        if entry.get('level') == 'SEVERE' and ('127.0.0.1:8000' in msg or 'Uncaught' in msg or 'TypeError' in msg or 'ReferenceError' in msg or 'InvalidStateError' in msg):
            result.append(msg)
    return result


def has_fatal_popup(state):
    text = state['visiblePopupText']
    return 'Đã xảy ra lỗi!' in text or "You've found a bug!" in text


def assert_no_fatal(driver, phase):
    state = snapshot(driver)
    errors = browser_errors(driver)
    print(f'Accessibility browser state {phase}:', json.dumps(state, ensure_ascii=False, sort_keys=True))
    if has_fatal_popup(state):
        detail = json.dumps(state['detailedError'], ensure_ascii=False, sort_keys=True)
        console = '\n'.join(errors) if errors else '(no severe browser log captured)'
        raise RuntimeError(f'Fatal error {phase}. Detailed error: {detail}\nBrowser console:\n{console}')
    if errors:
        raise RuntimeError(f'Browser console errors {phase}:\n' + '\n'.join(errors))
    return state


def run_case(width, height):
    driver = make_driver(width, height)
    try:
        driver.get(BASE_URL)
        WebDriverWait(driver, 45).until(lambda d: all(snapshot(d)[k] for k in (
            'requirejs', 'initializer', 'accessibility', 'mobileExperience', 'overviewCleanup', 'finalAudit', 'detailedErrorReporter', 'mapIconPathFix'
        )))
        WebDriverWait(driver, 45).until(lambda d: snapshot(d)['loadingDisplay'] == 'none' and snapshot(d)['mainDisplay'] != 'none')
        WebDriverWait(driver, 25).until(lambda d: is_player_overview_ready(snapshot(d)['playerText']) and is_inventory_overview_ready(snapshot(d)['inventoryText']))

        state = assert_no_fatal(driver, f'before intro Continue {width}x{height}')
        if state['playerSynthetic'] or state['inventorySynthetic']:
            raise RuntimeError('Read-only TalkBack summaries became synthetic focus stops')
        if not state['headersHidden'] or not state['headersInert']:
            raise RuntimeError('Visual headers remain reachable by TalkBack')
        if state['silentTabStops'] != 0:
            raise RuntimeError(f"Silent tabindex=0 stops remain: {state['silentTabStops']}")

        WebDriverWait(driver, 20).until(lambda d: click_popup_button(d, ['Tiếp tục', 'Continue']))
        time.sleep(1)
        assert_no_fatal(driver, f'after intro Continue {width}x{height}')

        WebDriverWait(driver, 20).until(lambda d: click_popup_button(d, ['Đứng dậy', 'Đứng lên', 'Stand up', 'Get up']))
        time.sleep(3)

        post_state = assert_no_fatal(driver, f'after intro Stand up {width}x{height}')
        WebDriverWait(driver, 15).until(lambda d: snapshot(d)['totalMapIcons'] > 0 and snapshot(d)['loadedMapIcons'] == snapshot(d)['totalMapIcons'])
        post_state = snapshot(driver)
        if post_state['brokenMapIcons']:
            raise RuntimeError('Broken map icons after Stand up: ' + ', '.join(post_state['brokenMapIcons']))
        if '/level13-huyhuy/' in BASE_URL:
            wrong_prefix = 'http://127.0.0.1:8000/img/map/'
            wrong_urls = [url for _, url in post_state['mapIconUrls'] if url.startswith(wrong_prefix)]
            if wrong_urls:
                raise RuntimeError('Map icons escaped the GitHub Pages subpath: ' + ', '.join(wrong_urls))
    finally:
        driver.quit()


run_case(390, 844)
run_case(980, 844)
print('Fresh Vietnamese startup, Continue, Stand up, map icons, and accessibility compatibility passed in phone and wide viewport modes.')
