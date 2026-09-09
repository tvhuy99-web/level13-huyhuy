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
        const s = document.getElementById('out-desc');
        const label = s ? (s.getAttribute('aria-label') || '') : '';
        return !!(s && s.getAttribute('aria-hidden') !== 'true' && s.getAttribute('tabindex') === '0' && /Vị trí\.\s*Tầng\s+\d+\.\s*X\s+/i.test(label));
    """))

    state = driver.execute_script(r"""
        function norm(v) { return String(v || '').replace(/\s+/g, ' ').trim(); }
        const helper = window.__sectorFocusHelper;
        const target = document.getElementById('out-desc');
        const coords = document.getElementById('accessibility-location-coordinates');
        const position = document.getElementById('out-position-indicator');
        const distance = document.getElementById('out-distance-indicator');
        const movement = document.getElementById('accessibility-movement-status');
        const legacySummary = document.getElementById('accessibility-sector-summary');

        const beforeNode = target;
        const before = norm(target && target.getAttribute('aria-label'));
        const wasVisible = !!(target && (target.offsetWidth || target.offsetHeight || target.getClientRects().length));
        if (wasVisible) target.focus();
        const focusedBefore = wasVisible ? document.activeElement === target : null;

        target.innerHTML = [
            '<p>Khu vực kiểm thử động đã thay đổi.</p>',
            '<p>Có dấu hiệu nguy hiểm mới.</p>',
            '<p>Đã lục lọi: 37%</p>',
            '<p>Tài nguyên tìm thấy: nước hiếm, kim loại phổ biến</p>'
        ].join('');
        helper.refresh();

        const afterNode = document.getElementById('out-desc');
        const after = norm(afterNode && afterNode.getAttribute('aria-label'));
        const descendants = afterNode ? Array.from(afterNode.querySelectorAll('*')) : [];

        return {
            summaryLabel: after,
            summaryBefore: before,
            sameNode: beforeNode === afterNode,
            targetVisible: wasVisible,
            focusedBefore: focusedBefore,
            focusedAfter: wasVisible ? document.activeElement === afterNode : null,
            targetHidden: afterNode && afterNode.getAttribute('aria-hidden'),
            targetTabIndex: afterNode && afterNode.getAttribute('tabindex'),
            targetRole: afterNode && afterNode.getAttribute('role'),
            targetLive: afterNode && afterNode.getAttribute('aria-live'),
            singleFocus: afterNode && afterNode.getAttribute('data-a11y-single-focus'),
            descendantCount: descendants.length,
            descendantsHidden: descendants.every(el => el.getAttribute('aria-hidden') === 'true' && el.getAttribute('tabindex') === null),
            coordinatesPresent: !!coords,
            coordinatesHidden: coords && coords.getAttribute('aria-hidden'),
            positionHidden: position && position.getAttribute('aria-hidden'),
            distanceHidden: distance && distance.getAttribute('aria-hidden'),
            movementHidden: movement && movement.getAttribute('aria-hidden'),
            legacySummaryHidden: legacySummary && legacySummary.getAttribute('aria-hidden')
        };
    """)

    print('Visible-block single-focus state:', state)

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

    if state['targetTabIndex'] != '0' or state['targetHidden'] == 'true':
        raise RuntimeError('Visible sector description is not exposed as the single focus stop')
    if state['singleFocus'] != '1':
        raise RuntimeError('Visible sector description is missing its single-focus marker')
    if not state['sameNode']:
        raise RuntimeError('Visible sector description node was replaced during dynamic update')
    if state['descendantCount'] < 1 or not state['descendantsHidden']:
        raise RuntimeError('Visible sector descendants are still independently exposed to TalkBack')
    if state['targetRole'] is not None or state['targetLive'] is not None:
        raise RuntimeError('Single-focus sector target should not add a noisy role or live region')
    if state['targetVisible'] and (not state['focusedBefore'] or not state['focusedAfter']):
        raise RuntimeError('Visible sector target could not receive or retain browser focus during refresh')

    required_hidden = {
        'positionHidden': '0E/0S position indicator',
        'distanceHidden': 'distance-to-camp indicator',
        'movementHidden': 'redundant movement-status summary'
    }
    for key, label in required_hidden.items():
        if state[key] != 'true':
            raise RuntimeError(label + ' is still exposed to TalkBack: ' + repr(state[key]))

    if state['coordinatesPresent'] and state['coordinatesHidden'] != 'true':
        raise RuntimeError('Legacy coordinate summary is still exposed separately to TalkBack')
    if state['legacySummaryHidden'] not in (None, 'true'):
        raise RuntimeError('Legacy synthetic sector summary is still exposed')
finally:
    driver.quit()

print('Visible-block single-focus compression passed: #out-desc itself is one TalkBack focus with Tầng/X/Y plus dynamic sector details, while descendants and redundant summaries are hidden.')
