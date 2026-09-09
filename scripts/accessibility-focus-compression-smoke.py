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

    driver.execute_script(r"""
        const Helper = window.requirejs('game/helpers/ui/AccessibilitySectorFocusCompressionHelper');
        const helper = new Helper();
        if (helper.observer) helper.observer.disconnect();
        window.__sectorFocusHelper = helper;
        const desc = document.getElementById('out-desc');
        desc.innerHTML = [
            '<p>Khu vực kiểm thử động.</p>',
            '<p>Có vẻ xung quanh không có gì thù địch.</p>',
            '<p>Đã lục lọi: 18%</p>',
            '<p>Tài nguyên tìm thấy: thức ăn phổ biến, kim loại dồi dào</p>'
        ].join('');
        helper.refresh();
    """)

    WebDriverWait(driver, 10).until(lambda d: d.execute_script(r"""
        const s = document.getElementById('accessibility-sector-summary');
        const label = s ? (s.getAttribute('aria-label') || '') : '';
        return !!(s && s.getAttribute('aria-hidden') !== 'true' && s.getAttribute('tabindex') === '0' && /Vị trí\.\s*Tầng\s+\d+\.\s*X\s+/i.test(label));
    """))

    state = driver.execute_script(r"""
        function norm(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
        const helper = window.__sectorFocusHelper;
        const summary = document.getElementById('accessibility-sector-summary');
        const coords = document.getElementById('accessibility-location-coordinates');
        const desc = document.getElementById('out-desc');
        const position = document.getElementById('out-position-indicator');
        const distance = document.getElementById('out-distance-indicator');
        const movement = document.getElementById('accessibility-movement-status');

        const beforeNode = summary;
        const before = norm(summary && summary.getAttribute('aria-label'));
        summary.focus();
        const focusedBefore = document.activeElement === summary;

        desc.innerHTML = [
            '<p>Khu vực kiểm thử động đã thay đổi.</p>',
            '<p>Có dấu hiệu nguy hiểm mới.</p>',
            '<p>Đã lục lọi: 37%</p>',
            '<p>Tài nguyên tìm thấy: nước hiếm, kim loại phổ biến</p>'
        ].join('');
        helper.refresh();

        const afterNode = document.getElementById('accessibility-sector-summary');
        const after = norm(afterNode && afterNode.getAttribute('aria-label'));

        return {
            summaryLabel: after,
            summaryBefore: before,
            summaryText: norm(afterNode && afterNode.textContent),
            summaryChildCount: afterNode ? afterNode.childNodes.length : -1,
            sameNode: beforeNode === afterNode,
            focusedBefore: focusedBefore,
            focusedAfter: document.activeElement === afterNode,
            descriptionText: norm(desc && (desc.innerText || desc.textContent)),
            summaryHidden: afterNode && afterNode.getAttribute('aria-hidden'),
            summaryTabIndex: afterNode && afterNode.getAttribute('tabindex'),
            summaryRole: afterNode && afterNode.getAttribute('role'),
            summaryLive: afterNode && afterNode.getAttribute('aria-live'),
            singleFocus: afterNode && afterNode.getAttribute('data-a11y-single-focus'),
            coordinatesPresent: !!coords,
            coordinatesHidden: coords && coords.getAttribute('aria-hidden'),
            descriptionHidden: desc && desc.getAttribute('aria-hidden'),
            positionHidden: position && position.getAttribute('aria-hidden'),
            distanceHidden: distance && distance.getAttribute('aria-hidden'),
            movementHidden: movement && movement.getAttribute('aria-hidden')
        };
    """)

    print('Single-focus compression state:', state)

    if not state['summaryLabel'].startswith('Vị trí. Tầng '):
        raise RuntimeError('Single-focus sector label lost the Tầng/X/Y coordinates')
    if '. X ' not in state['summaryLabel'] or '. Y ' not in state['summaryLabel']:
        raise RuntimeError('Single-focus sector label does not contain both X and Y coordinates')
    if 'Đã lục lọi: 37%' not in state['summaryLabel']:
        raise RuntimeError('Single-focus sector label did not update the dynamic scavenging percentage')
    if 'nước hiếm' not in state['summaryLabel'] or 'kim loại phổ biến' not in state['summaryLabel']:
        raise RuntimeError('Single-focus sector label did not update dynamic found resources')
    if state['summaryBefore'] == state['summaryLabel'] or '18%' in state['summaryLabel']:
        raise RuntimeError('Single-focus sector label kept stale dynamic sector text')

    if state['summaryTabIndex'] != '0':
        raise RuntimeError('Combined sector summary is not a real focus stop')
    if state['summaryText'] or state['summaryChildCount'] != 0:
        raise RuntimeError('Combined sector summary still has navigable text descendants instead of one aria-label')
    if state['singleFocus'] != '1':
        raise RuntimeError('Combined sector summary is missing its single-focus marker')
    if not state['sameNode']:
        raise RuntimeError('Combined sector summary node was replaced during dynamic update')
    if not state['focusedBefore'] or not state['focusedAfter']:
        raise RuntimeError('Keyboard/accessibility focus is not retained on the combined sector summary during refresh')

    required_hidden = {
        'descriptionHidden': 'original sector description',
        'positionHidden': '0E/0S position indicator',
        'distanceHidden': 'distance-to-camp indicator',
        'movementHidden': 'redundant movement-status summary'
    }
    for key, label in required_hidden.items():
        if state[key] != 'true':
            raise RuntimeError(label + ' is still exposed to TalkBack: ' + repr(state[key]))

    if state['coordinatesPresent'] and state['coordinatesHidden'] != 'true':
        raise RuntimeError('Legacy coordinate summary is still exposed separately to TalkBack')

    if state['summaryHidden'] == 'true':
        raise RuntimeError('Combined sector summary is hidden from TalkBack')
    if state['summaryRole'] is not None or state['summaryLive'] is not None:
        raise RuntimeError('Combined sector summary should not add a noisy role or live region')
finally:
    driver.quit()

print('Single-focus sector compression passed: one focusable aria-label contains Tầng/X/Y plus dynamic sector details, updates in place, and keeps focus stable.')
