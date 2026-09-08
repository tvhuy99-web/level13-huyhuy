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


def click_visible_button(driver, labels):
    return driver.execute_script(r"""
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


driver = make_driver()
try:
    driver.get(BASE_URL)
    WebDriverWait(driver, 45).until(lambda d: d.execute_script(
        "return !!(window.requirejs && window.requirejs.defined('game/helpers/ui/AccessibilityMovementPositionHelper'));"
    ))
    WebDriverWait(driver, 45).until(lambda d: d.execute_script(
        "return getComputedStyle(document.getElementById('unit-main')).display !== 'none';"
    ))

    WebDriverWait(driver, 20).until(lambda d: click_visible_button(d, ['Tiếp tục', 'Continue']))
    WebDriverWait(driver, 20).until(lambda d: click_visible_button(d, ['Đứng dậy', 'Đứng lên', 'Stand up', 'Get up']))

    state = driver.execute_script(r"""
        const Helper = window.requirejs('game/helpers/ui/AccessibilityMovementPositionHelper');
        const helper = new Helper();
        if (helper.observer) helper.observer.disconnect();

        const actionHost = document.getElementById('container-tab-two-out-actions');
        const compass = document.getElementById('out-container-compass-actions');
        const table = document.getElementById('table-out-actions-movement');
        if (actionHost) { actionHost.style.display = 'block'; actionHost.style.visibility = 'visible'; }
        if (compass) { compass.style.display = 'block'; compass.style.visibility = 'visible'; }
        if (table) { table.style.display = 'table'; table.style.visibility = 'visible'; }

        const dirs = ['nw','north','ne','west','east','sw','south','se'];
        for (const dir of dirs) {
            const normal = document.getElementById('out-action-move-' + dir);
            const grit = document.getElementById('out-action-move-' + dir + '-grit');
            if (normal) normal.style.display = ['north','west','east'].includes(dir) ? 'inline-block' : 'none';
            if (grit) grit.style.display = 'none';
        }

        function forceState(dir, disabled, reasonText) {
            const button = document.getElementById('out-action-move-' + dir);
            if (!button) throw new Error('missing movement button: ' + dir);
            button.disabled = disabled;
            button.classList.toggle('btn-disabled', disabled);
            const callout = button.closest('.callout-container');
            const reason = callout ? callout.querySelector('.btn-disabled-reason') : null;
            if (!reason) throw new Error('missing disabled reason element: ' + dir);
            reason.textContent = reasonText || '';
            return button;
        }

        const north = forceState('north', false, '');
        const west = forceState('west', true, 'Currently unavailable');
        const east = forceState('east', true, 'Bị chặn: Không có gì ở đây.');

        helper.refresh();
        const region = document.getElementById('accessibility-movement-status');
        return {
            north: north.getAttribute('aria-label') || '',
            northState: north.getAttribute('data-a11y-movement-state'),
            west: west.getAttribute('aria-label') || '',
            westState: west.getAttribute('data-a11y-movement-state'),
            east: east.getAttribute('aria-label') || '',
            eastState: east.getAttribute('data-a11y-movement-state'),
            region: region ? (region.textContent || '').replace(/\s+/g, ' ').trim() : ''
        };
    """)

    print('Movement warning state:', state)

    if state['northState'] != 'available' or 'Có thể đi' not in state['north']:
        raise RuntimeError('Available direction no longer announces that it can be used')
    if state['westState'] != 'temporary' or 'Tạm thời không đi được' not in state['west']:
        raise RuntimeError('Temporary movement warning is missing')
    if state['eastState'] != 'blocked' or 'Không đi được' not in state['east'] or 'Không có gì ở đây' not in state['east']:
        raise RuntimeError('Blocked movement warning or concrete reason is missing')

    required_region = [
        'Trạng thái vị trí',
        'Đi được: bắc',
        'Tạm thời không đi được: tây',
        'Hướng bị chặn, không đi được: đông'
    ]
    for text in required_region:
        if text not in state['region']:
            raise RuntimeError('Position warning region missing: ' + text + ' | region=' + state['region'])
finally:
    driver.quit()

print('Movement position warnings passed: available, temporary, and blocked directions are all announced again.')
