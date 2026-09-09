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
        "return !!(window.requirejs && window.requirejs.defined('game/helpers/ui/AccessibilitySectorFocusCompressionHelper'));"
    ))
    WebDriverWait(driver, 45).until(lambda d: d.execute_script(
        "return getComputedStyle(document.getElementById('unit-main')).display !== 'none';"
    ))

    WebDriverWait(driver, 20).until(lambda d: click_visible_button(d, ['Tiếp tục', 'Continue']))
    WebDriverWait(driver, 20).until(lambda d: click_visible_button(d, ['Đứng dậy', 'Đứng lên', 'Stand up', 'Get up']))

    WebDriverWait(driver, 30).until(lambda d: d.execute_script(r"""
        const s = document.getElementById('accessibility-sector-summary');
        return !!(s && s.getAttribute('aria-hidden') !== 'true' && /Vị trí\.\s*Tầng/i.test(s.textContent || ''));
    """))

    state = driver.execute_script(r"""
        function norm(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
        const summary = document.getElementById('accessibility-sector-summary');
        const coords = document.getElementById('accessibility-location-coordinates');
        const desc = document.getElementById('out-desc');
        const position = document.getElementById('out-position-indicator');
        const distance = document.getElementById('out-distance-indicator');
        const movement = document.getElementById('accessibility-movement-status');
        return {
            summaryText: norm(summary && summary.textContent),
            coordinateText: norm(coords && coords.textContent),
            descriptionText: norm(desc && (desc.innerText || desc.textContent)),
            summaryHidden: summary && summary.getAttribute('aria-hidden'),
            summaryTabIndex: summary && summary.getAttribute('tabindex'),
            summaryRole: summary && summary.getAttribute('role'),
            summaryLive: summary && summary.getAttribute('aria-live'),
            coordinatesHidden: coords && coords.getAttribute('aria-hidden'),
            descriptionHidden: desc && desc.getAttribute('aria-hidden'),
            positionHidden: position && position.getAttribute('aria-hidden'),
            distanceHidden: distance && distance.getAttribute('aria-hidden'),
            movementHidden: movement && movement.getAttribute('aria-hidden')
        };
    """)

    print('Focus compression state:', state)

    if not state['coordinateText'] or not state['coordinateText'].startswith('Vị trí.'):
        raise RuntimeError('Coordinate source missing or no longer uses the compact Tầng/X/Y wording')
    if state['coordinateText'] not in state['summaryText']:
        raise RuntimeError('Combined sector summary lost the Tầng/X/Y coordinates')
    if not state['descriptionText']:
        raise RuntimeError('Dynamic sector description is empty in focus compression test')

    description_words = [w for w in state['descriptionText'].split(' ') if len(w) >= 5][:6]
    missing = [w for w in description_words if w not in state['summaryText']]
    if missing:
        raise RuntimeError('Combined sector summary is missing dynamic sector description content: ' + ', '.join(missing))

    required_hidden = {
        'coordinatesHidden': 'old coordinate summary',
        'descriptionHidden': 'original sector description',
        'positionHidden': '0E/0S position indicator',
        'distanceHidden': 'distance-to-camp indicator',
        'movementHidden': 'redundant movement-status summary'
    }
    for key, label in required_hidden.items():
        if state[key] != 'true':
            raise RuntimeError(label + ' is still exposed to TalkBack: ' + repr(state[key]))

    if state['summaryHidden'] == 'true':
        raise RuntimeError('Combined sector summary is hidden from TalkBack')
    if state['summaryTabIndex'] is not None or state['summaryRole'] is not None or state['summaryLive'] is not None:
        raise RuntimeError('Combined sector summary should be plain readable text, not a synthetic live/focus control')
finally:
    driver.quit()

print('Second-pass focus compression passed: Tầng/X/Y plus dynamic sector details are one TalkBack reading unit and redundant sources are hidden.')
