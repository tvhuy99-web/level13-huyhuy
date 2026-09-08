import os
import time
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


def click_visible_button(driver, labels):
    return driver.execute_script("""
        const labels = arguments[0];
        const buttons = Array.from(document.querySelectorAll('button')).filter(b => {
            if (b.disabled) return false;
            const s = getComputedStyle(b);
            const r = b.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
        });
        const button = buttons.find(b => {
            const text = (b.textContent || '').replace(/\s+/g, ' ').trim();
            const aria = (b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
            return labels.includes(text) || labels.includes(aria);
        });
        if (!button) return false;
        button.click();
        return true;
    """, labels)


def scout_state(driver):
    return driver.execute_script("""
        const scout = document.querySelector("button[action='scout']");
        const scoutContainer = scout ? scout.closest('.container-btn-action') : null;
        const build = document.querySelector("button[action='build_out_collector_water']");
        const buildCallout = build && build.closest('.callout-container') ? build.closest('.callout-container').querySelector('.btn-disabled-reason') : null;
        return {
            patch: !!(window.requirejs && window.requirejs.defined('game/helpers/ui/AccessibilityScoutActionablePatch')),
            scoutExists: !!scout,
            scoutDisabled: !!(scout && scout.disabled),
            scoutContainerRole: scoutContainer ? scoutContainer.getAttribute('role') : null,
            scoutContainerTabIndex: scoutContainer ? scoutContainer.getAttribute('tabindex') : null,
            scoutContainerAriaDisabled: scoutContainer ? scoutContainer.getAttribute('aria-disabled') : null,
            scoutContainerActionable: scoutContainer ? scoutContainer.getAttribute('data-a11y-scout-actionable') : null,
            scoutContainerLabel: scoutContainer ? (scoutContainer.getAttribute('aria-label') || '') : '',
            buildReason: buildCallout ? (buildCallout.textContent || '').replace(/\s+/g, ' ').trim() : '',
        };
    """)


driver = make_driver()
try:
    driver.get(BASE_URL)
    WebDriverWait(driver, 45).until(lambda d: d.execute_script("return !!(window.requirejs && window.requirejs.defined('game/GameGlobals'));"))
    WebDriverWait(driver, 45).until(lambda d: d.execute_script("return getComputedStyle(document.getElementById('unit-main')).display !== 'none';"))

    WebDriverWait(driver, 20).until(lambda d: click_visible_button(d, ['Tiếp tục', 'Continue']))
    WebDriverWait(driver, 20).until(lambda d: click_visible_button(d, ['Đứng dậy', 'Đứng lên', 'Stand up', 'Get up']))
    time.sleep(1)

    prepared = driver.execute_script("""
        const req = window.requirejs;
        if (!req || !req.defined('game/GameGlobals') || !req.defined('game/GlobalSignals') || !req.defined('game/components/sector/SectorStatusComponent')) return false;
        const GameGlobals = req('game/GameGlobals');
        const GlobalSignals = req('game/GlobalSignals');
        const SectorStatusComponent = req('game/components/sector/SectorStatusComponent');
        const node = GameGlobals.playerActionFunctions && GameGlobals.playerActionFunctions.playerLocationNodes ? GameGlobals.playerActionFunctions.playerLocationNodes.head : null;
        if (!node || !node.entity) return false;
        const status = node.entity.get(SectorStatusComponent);
        if (!status) return false;
        if (GameGlobals.playerActionFunctions.playerStatsNodes && GameGlobals.playerActionFunctions.playerStatsNodes.head && GameGlobals.playerActionFunctions.playerStatsNodes.head.vision) {
            GameGlobals.playerActionFunctions.playerStatsNodes.head.vision.value = 100;
        }
        status.scouted = true;
        if (GlobalSignals.visionChangedSignal) GlobalSignals.visionChangedSignal.dispatch();
        GlobalSignals.sectorScoutedSignal.dispatch();
        return true;
    """)
    if not prepared:
        raise RuntimeError('Could not prepare scouted-sector state for Scout accessibility test')

    def state_is_fixed(d):
        state = scout_state(d)
        reason = state['buildReason'].lower()
        stale_not_scouted = 'chưa được thám sát' in reason or 'chưa được trinh sát' in reason or 'not scouted' in reason
        return (
            state['patch']
            and state['scoutExists']
            and state['scoutDisabled']
            and state['scoutContainerRole'] == 'button'
            and state['scoutContainerTabIndex'] == '0'
            and state['scoutContainerAriaDisabled'] is None
            and state['scoutContainerActionable'] == '1'
            and 'không khả dụng' not in state['scoutContainerLabel'].lower()
            and not stale_not_scouted
        )

    WebDriverWait(driver, 10).until(state_is_fixed)
    state = scout_state(driver)
    print('Scout actionable state:', state)
finally:
    driver.quit()

print('Scout stays TalkBack-actionable after scouting, and dependent build actions no longer keep a stale not-scouted reason.')
