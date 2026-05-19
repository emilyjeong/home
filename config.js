/**
 * ─────────────────────────────────────────────
 * home 대시보드 — 설정
 * 각 위젯이 fetch할 GAS endpoint 모음
 * 다른 모듈 config.js의 GAS_URL 그대로 가져와서 채우면 됨
 * ─────────────────────────────────────────────
 */

window.HOME_CONFIG = {
  ENDPOINTS: {
    // 1. 순자산 (이미 채워둠 — 아까 받은 거)
    totalAsset:      'https://script.google.com/macros/s/AKfycby6Yqyt5bjnTM2XRO_hMY5W6AK6iwjULcY6H2UN4xnmyQ-Mx2Yho48iI2AWbyw6LKZ6/exec',

    // 2. 부부 주식 + 5. 연금 (둘 다 같은 GAS 사용)
    familyPortfolio: '',

    // 4. 주식 수량 목표 (family_portfolio와 같은 GAS면 동일 URL)
    target:          '',

    // 2. 가계부 (whooing)
    cashflow:        '',

    // 6. BTC
    btc:             ''
  }
};
