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


def overview_state(driver):
    return driver.execute_script("""
        const req = window.requirejs;
        const player = document.getElementById('accessibility-player-overview');
        const inventory = document.getElementById('accessibility-inventory-camp-overview');
        return {
            patch: !!(req && req.defined('game/helpers/ui/AccessibilityOverviewRefreshPatch')),
            playerText: player ? (player.textContent || '').replace(/\\s+/g, ' ').trim() : '',
            inventoryText: inventory ? (inventory.textContent || '').replace(/\\s+/g, ' ').trim() : '',
            playerHidden: player ? player.getAttribute('aria-hidden') === 'true' : True,
            inventoryHidden: inventory ? inventory.getAttribute('aria-hidden') === 'true' : True,
            playerReady: player ? player.getAttribute('data-a11y-overview-ready') === '1' : False,
            inventoryReady: inventory ? inventory.getAttribute('data-a11y-overview-ready') === '1' : False,
        };
    """)


def summaries_ready(state):
    return (
        state['patch']
        and state['playerText'].startswith('Tổng quan người chơi.')
        and 'Chưa có thông tin trạng thái người chơi' not in state['playerText']
        and state['inventoryText'].startswith('Tổng quan túi đồ và trại.')
        and 'Chưa có thông tin về túi đồ hoặc trại' not in state['inventoryText']
        and not state['playerHidden']
        and not state['inventoryHidden']
        and state['playerReady']
        and state['inventoryReady']
    )


driver = make_driver()
try:
    driver.get(BASE_URL)
    WebDriverWait(driver, 45).until(lambda d: summaries_ready(overview_state(d)))
    before = overview_state(driver)

    dispatched = driver.execute_script("""
        const req = window.requirejs;
        if (!req || !req.defined('game/GlobalSignals')) return false;
        const player = document.getElementById('accessibility-player-overview');
        const inventory = document.getElementById('accessibility-inventory-camp-overview');
        if (!player || !inventory) return false;
        player.textContent = 'Tổng quan người chơi. Chưa có thông tin trạng thái người chơi.';
        inventory.textContent = 'Tổng quan túi đồ và trại. Chưa có thông tin về túi đồ hoặc trại.';
        req('game/GlobalSignals').updateButtonsSignal.dispatch();
        return true;
    """)
    if not dispatched:
        raise RuntimeError('Could not dispatch updateButtonsSignal for overview refresh test')

    WebDriverWait(driver, 10).until(lambda d: summaries_ready(overview_state(d)))
    after = overview_state(driver)

    if after['playerText'] == before['playerText'] and after['inventoryText'] == before['inventoryText']:
        print('Overview summaries recovered their previous real data after a forced stale fallback.')
    else:
        print('Overview summaries refreshed to current real data after a forced stale fallback.')
finally:
    driver.quit()
