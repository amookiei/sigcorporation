/* KR / EN 전환.
   한국어 원문은 index.html · content.js · app.js 에 그대로 두고, 영어를 고르면 화면에 나온 문구를 아래 사전으로 바꿔 보여줍니다.
   문구를 고치거나 추가했다면: 한국어 원문을 왼쪽에, 영어를 오른쪽에 같은 방식으로 추가하세요.
   (사전에 없는 한국어는 영어 화면에서도 한국어로 남습니다.) */
(() => {
  'use strict';
  const KEY = 'sig-lang';
  const param = new URLSearchParams(location.search).get('lang');
  let lang = 'ko';
  try { if (param === 'en' || param === 'ko') localStorage.setItem(KEY, param); lang = localStorage.getItem(KEY) || 'ko'; } catch (e) { if (param === 'en') lang = 'en'; }
  if (param === 'en' || param === 'ko') lang = param;
  window.SIG_LANG = lang;

  // ---------- 관리자 페이지의 '미리보기': 저장 전 내용을 이 탭에서만 보여준다 ----------
  if (new URLSearchParams(location.search).get('preview') === '1') {
    try { const draft = JSON.parse(sessionStorage.getItem('sig-preview') || 'null'); if (draft && draft.data) { window.SIG_CONTENT = draft.data; window.SIG_ASSET_URLS = draft.assets || {}; document.documentElement.classList.add('is-preview'); } } catch (e) {}
  }

  // ---------- 헤더 오른쪽 KR / EN 버튼 ----------
  const headerInner = document.querySelector('.header-inner');
  if (headerInner) {
    const box = document.createElement('div');
    box.className = 'lang-switch'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Language');
    box.innerHTML = '<button type="button" data-lang="ko" lang="ko" aria-label="한국어">KR</button><span aria-hidden="true">/</span><button type="button" data-lang="en" lang="en" aria-label="English">EN</button>';
    box.querySelectorAll('button').forEach(b => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on));
      b.addEventListener('click', () => {
        if (b.dataset.lang === lang) return;
        try { localStorage.setItem(KEY, b.dataset.lang); } catch (e) {}
        const url = new URL(location.href); url.searchParams.delete('lang');
        if (!canStore()) url.searchParams.set('lang', b.dataset.lang);
        if (url.href === location.href) location.reload(); else location.replace(url.href);
      });
    });
    headerInner.appendChild(box);
  }
  function canStore() { try { return localStorage.getItem(KEY) !== null; } catch (e) { return false; } }

  if (lang !== 'en') { document.documentElement.classList.remove('i18n-pending'); return; }
  document.documentElement.lang = 'en';

  // ---------- 사전 1: 줄바꿈·굵은 글씨가 섞인 문단(요소 단위로 통째 교체) ----------
  const HTML = {
    '돌봄의 사각지대를 없애다.': 'Closing the blind spots<br>in care.',
    '보이지 않는 생체신호를 데이터로 읽고, 필요한 순간의 돌봄을 연결하는 시니허그.': 'SeniHug reads invisible vital signs as data<br>and connects care at the moment it is needed.',
    '편안한 일상 속, 자연스러운 돌봄.': 'Natural care,<br>within everyday comfort.',
    '몸에 부착하지 않는 비접촉 센싱. 익숙한 잠자리에서 돌봄이 시작됩니다.': 'Contactless sensing with nothing to wear.<br>Care begins in a familiar bed.',
    '작은 변화까지, 돌봄으로 연결하다.': 'Even small changes,<br>connected to care.',
    '센싱에서 분석, 모니터링까지. 더 넓은 현장을 잇는 통합 케어 시스템.': 'From sensing to analysis and monitoring.<br>An integrated care system that links more sites.',
    '돌봄의 빈틈을, 기술로 연결합니다.': 'Bridging the gaps in care<br>with technology.',
    '시그코퍼레이션은 비접촉 생체신호 기술을 기반으로 하는 AIoT 헬스케어 기업입니다. 센싱과 데이터 분석, 통합 관제를 연결해 실제 주거·돌봄 환경에서 활용할 수 있는 솔루션을 개발합니다.': 'SIG Corporation is an AIoT healthcare company built on contactless vital-sign technology.<br>We connect sensing, data analysis and integrated monitoring to develop solutions that work in real homes and care settings.',
    '감지 장치 설치, 공기 충진, 압력 변화 측정, 심박수 예측, 보호자에게 상태 정보 전송으로 이어지는 건강 감지 방법에 관한 기술입니다.': 'A <strong>health detection method</strong> that runs from installing the sensing device and filling it with air, through measuring pressure changes and estimating heart rate, to sending status information to a guardian.',
    '매트리스에 접촉하는 공기 충진형 감지부와 압력센서 등을 이용해 수면 중 신체 움직임과 호흡에 따른 압력 변화를 측정하는 장치 구성에 관한 기술입니다.': 'A <strong>device configuration</strong> that uses an air-filled sensing unit in contact with the mattress and a pressure sensor to measure pressure changes caused by body movement and breathing during sleep.'
  };

  // ---------- 사전 2: 일반 문구 ('태그:문구' 로 쓰면 그 태그 안에서만 적용) ----------
  const TEXT = {
    // 공통 · 헤더 · 푸터
    '시그코퍼레이션': 'SIG Corporation', '주식회사 시그코퍼레이션': 'SIG Corporation Co., Ltd.', '시그코퍼레이션 | SIG Corporation': 'SIG Corporation',
    '돌봄의 빈틈을 기술로 연결합니다': 'Bridging the gaps in care with technology', '돌봄의 빈틈을, 기술로 연결합니다.': 'Bridging the gaps in care with technology.',
    '비접촉 생체신호 기술을 기반으로 하는 AIoT 헬스케어 기업, 시그코퍼레이션. 시니허그와 함께 돌봄의 사각지대를 줄여갑니다.': 'SIG Corporation is an AIoT healthcare company built on contactless vital-sign technology. With SeniHug, we are closing the blind spots in care.',
    '본문 바로가기': 'Skip to content', '메뉴 열기': 'Open menu', '메뉴 닫기': 'Close menu', '시그코퍼레이션 홈': 'SIG Corporation home', '주 메뉴': 'Main menu', '하단 메뉴': 'Footer menu', '맨 위로 이동': 'Back to top',
    // 메인 슬라이드
    '시니허그 소개': 'About SeniHug', '시니허그 알아보기': 'Discover SeniHug', '시니허그의 기술': "SeniHug's technology", '도입 문의하기': 'Ask about adoption',
    '이전 슬라이드': 'Previous slide', '다음 슬라이드': 'Next slide', '자동 재생 정지': 'Pause autoplay', '자동 재생 시작': 'Start autoplay',
    '잠든 시니어 곁에서 스마트폰으로 상태를 확인하는 돌봄 종사자와 시니허그 제품': 'A caregiver checking status on a smartphone beside a sleeping senior, with SeniHug products',
    '매트리스 아래에 설치하는 시니허그 센서와 심박·호흡 측정 화면': 'The SeniHug sensor installed under a mattress, with heart-rate and respiration readings',
    '시니허그 통합 모니터링 대시보드와 모바일 앱 화면': 'The SeniHug integrated monitoring dashboard and mobile app',
    // 사업영역
    '비접촉 생체신호 모니터링': 'Contactless Vital\nSign Monitoring', 'AI 생체데이터 분석': 'AI Biometric\nData Analysis', '통합 관제 플랫폼': 'Integrated\nMonitoring Platform', '보호자·관리자 알림': 'Guardian &\nManager Alerts',
    '공공 돌봄 솔루션': 'Public Care\nSolutions', '요양시설 모니터링': 'Care Facility\nMonitoring', '시니어 주거 연계': 'Senior Housing\nIntegration', '현장 실증·서비스 고도화': 'Field Trials &\nService Refinement',
    '몸에 장치를 부착하지 않고, 매트리스 아래의 센서를 통해 수면 중 생체신호를 확인합니다.': 'A sensor under the mattress checks vital signs during sleep, with no device attached to the body.',
    '수집한 생체신호를 분석해 일상의 변화를 살피고, 돌봄에 필요한 정보를 제공합니다.': 'We analyze the collected vital signs to watch for changes in daily life and provide the information care needs.',
    '여러 사용자의 상태를 한 화면에서 확인할 수 있도록 모니터링 환경을 연결합니다.': 'We connect monitoring environments so the status of many users can be seen on one screen.',
    '사용자의 상태 변화를 보호자와 관리자에게 전달해 필요한 돌봄으로 이어지도록 돕습니다.': "We pass changes in a user's condition to guardians and managers so the right care can follow.",
    '지역사회와 공공기관의 돌봄 환경에 맞춰 비접촉 모니터링의 활용 가능성을 넓혀갑니다.': 'We are widening the use of contactless monitoring to fit the care settings of communities and public institutions.',
    '시설 운영자가 여러 사용자의 상태를 살피고 관리할 수 있는 모니터링 환경을 연구합니다.': 'We are researching monitoring environments that let facility operators watch over and manage many users.',
    '익숙한 주거 공간에서 생활하면서 돌봄 정보를 연결할 수 있도록 주거 환경과 서비스를 연계합니다.': 'We link housing and services so care information stays connected while people live in familiar homes.',
    '실제 주거·돌봄 현장의 실증을 통해 기술과 서비스의 활용성을 확인하고 개선합니다.': 'Through trials in real homes and care settings, we verify and improve how our technology and services are used.',
    '시니허그 자세히 보기': 'Learn more about SeniHug', '상세 설명 닫기': 'Close details', '시니허그 제품': 'SeniHug product', '시니허그 제품 이미지': 'SeniHug product image',
    // 협력 기관
    '함께 만드는 돌봄의 미래': 'Building the future of care together', '투자·지원·기술 협력을 통해 더 넓은 현장으로 나아갑니다.': 'Through investment, support and technical partnerships, we are reaching more care settings.', '투자 및 협력 기관 로고': 'Logos of investors and partners',
    '현대건설': 'Hyundai E&C', '가톨릭대학교 서울성모병원': "The Catholic University of Korea Seoul St. Mary's Hospital", '서대문구청': 'Seodaemun-gu Office', '주식회사 하이': 'HAII Corp.', '중소벤처기업진흥공단': 'Korea SMEs and Startups Agency (KOSME)',
    '이마트': 'Emart', '신용보증기금': 'Korea Credit Guarantee Fund (KODIT)', '씨엔티테크': 'CNT Tech', '서울여자간호대학교': "Seoul Women's College of Nursing", '헥토헬스케어': 'Hecto Healthcare',
    // 기술 · 특허 · 인증
    '기술로 쌓아온 신뢰': 'Trust built on technology', '연구와 검증으로 완성하는 기술': 'Technology completed through research and validation', '특허와 인증을 바탕으로, 실제 돌봄 현장에 필요한 기술을 발전시킵니다.': 'Backed by patents and certifications, we advance the technology that real care settings need.',
    '등록 특허': 'Registered Patents', '등록 특허 목록': 'List of registered patents', '특허 명칭 및 번호': 'Patent title and number', '기관': 'Authority', '일자': 'Date', '구분': 'Status',
    '수면 상태 모니터링 결과를 활용한 건강 감지 방법': 'Health detection method using sleep-state monitoring results', '수면 상태 감지 장치 및 이를 활용한 건강 감지 방법': 'Sleep-state detection device and health detection method using the same',
    '지식재산처': 'Ministry of Intellectual Property', '특허청': 'Korean Intellectual Property Office', 'td:등록': 'Registered',
    '특허 핵심': 'Patent Highlights', '특허 핵심 내용': 'Patent highlights', '등록번호': 'Registration No.', '핵심 내용': 'Summary',
    'h3:인증': 'Certifications', 'td:인증': 'Certified', '인증 목록': 'List of certifications', '항목 및 번호': 'Item and number',
    '방송통신기자재등의 적합인증': 'Conformity certification of broadcasting and communications equipment (KC)', '국립전파연구원': 'National Radio Research Agency',
    '벤처기업 확인 — 벤처투자유형': 'Venture business confirmation (venture investment type)', '벤처기업협회': 'Korea Venture Business Association', '확인': 'Confirmed',
    '서울시 워라밸 포인트 기업 선정': 'Selected as a Seoul Work-Life Balance Point Company', '서울특별시': 'Seoul Metropolitan Government', '선정': 'Selected',
    '상표 출원': 'Trademark Applications', '상표 출원 목록': 'List of trademark applications', '상표 출원 번호': 'Application No.', '상품류': 'Class', '출원 분야 요약': 'Summary of goods and services',
    '비의료용 생체신호 측정기기·센서 및 모니터링 앱': 'Non-medical vital-sign measuring devices, sensors and monitoring apps', '생체신호·수면 분석 소프트웨어, SaaS 및 IoT 원격관리': 'Vital-sign and sleep analysis software, SaaS and IoT remote management',
    '의료 목적 원격 모니터링·건강관리 및 생체정보 분석': 'Remote monitoring for medical purposes, health management and biometric data analysis', '의료 경보 감시·긴급상황 알림 및 안전 모니터링': 'Medical alarm monitoring, emergency alerts and safety monitoring',
    '의료용 심박·호흡·생체신호 측정기기 및 환자 모니터링 장치': 'Medical heart-rate, respiration and vital-sign measuring devices and patient monitoring apparatus',
    '인증서': 'Certificates', '특허증': 'Patent Certificate', '직무발명보상 우수기업 인증서': 'Certificate of Excellent Company for Employee Invention Compensation', '기업부설연구소 인정서': 'Certificate of Corporate R&D Center',
    '벤처기업확인서': 'Certificate of Venture Business', '서울시 워라밸 포인트 기업 증서': 'Seoul Work-Life Balance Point Company Certificate', '인증서 닫기': 'Close certificate',
    // 연혁
    '꾸준한 실행이 만드는 성장': 'Growth built on steady execution', '기술과 경험으로 이어온 여정': 'A journey of technology and experience', '연혁 연도 선택': 'Select a year',
    '현장에서 검증하는 돌봄 기술': 'Care technology proven in the field', '기술의 가능성, 성장의 기반으로': 'Turning technical promise into a base for growth', '협력으로 넓혀가는 가능성': 'Expanding possibilities through partnership', '시그코퍼레이션의 시작': 'The beginning of SIG Corporation',
    '현대건설과 시니허그 현장 실증(PoC) 진행 중': 'SeniHug field trial (PoC) under way with Hyundai E&C', '개인 엔젤투자 유치': 'Secured angel investment', 'IP나래 프로그램 선정': 'Selected for the IP Narae Program',
    'SVC SEOUL 오픈이노베이션 프로그램(문제해결형) 선정': 'Selected for the SVC SEOUL Open Innovation Program (problem-solving track)', '아이쿱 업무협약 체결 · SVC SEOUL 글로벌 진출 프로그램 선정': 'Signed an MOU with iKooB · Selected for the SVC SEOUL Global Expansion Program',
    '딥테크창업사관학교 · 신용보증기금 리틀펭귄 선정 개인 엔젤투자 유치': 'Selected for the Deep Tech Startup Academy and KODIT Little Penguin\nSecured angel investment',
    'TIPS 선정': 'Selected for TIPS', '씨엔티테크 · 헥토이노베이션 투자 유치': 'Investment from CNT Tech and Hecto Innovation', '경기북부 청년창업사관학교 15기 선정': 'Selected for the 15th cohort of the Youth Startup Academy (Northern Gyeonggi)',
    '홍콩 PCB 전문 제조업체와 업무협약 체결': 'Signed an MOU with a Hong Kong PCB manufacturer', '서대문구 청년벤처 육성사업 선정 및 구청장상 수상': "Selected for Seodaemun-gu's Youth Venture Program and received the District Mayor's Award",
    '생애최초 예비창업 지원사업 최우수 기업으로 수료': "Completed the First-Time Founders' Pre-Startup Program as the top-rated company", '주식회사 시그코퍼레이션 설립': 'SIG Corporation Co., Ltd. founded',
    '예정된 현장 실증': 'Upcoming field trials', '서대문구청 시니허그 PoC': 'SeniHug PoC with Seodaemun-gu Office', '해남·공주 지역 시니허그 PoC': 'SeniHug PoC in Haenam and Gongju', '예정': 'Planned',
    // 뉴스
    '시그코퍼레이션의 최근 소식': 'Latest from SIG Corporation', '기업 소식 및 언론 보도': 'Company news and press coverage', '시그코퍼레이션의 기업 소식 및 언론 보도': 'Company news and press coverage from SIG Corporation', '뉴스 분류': 'News category',
    '전체': 'All', '기업 소식': 'Company News', '언론 보도': 'Press', '전자신문': 'ETNews', '상세 보기': 'View details', '원문 새 창으로 보기': 'Open the original article in a new window', '기사 대표 이미지': 'Article image',
    '현대건설과 시니허그 현장 실증 진행': 'SeniHug field trial under way with Hyundai E&C', '실제 주거 환경에서 돌봄 기술의 활용 가능성을 확인하고 있습니다.': 'We are verifying how our care technology can be used in real residential settings.',
    '시그코퍼레이션은 현대건설과 시니허그 현장 실증(PoC)을 진행하고 있습니다.': 'SIG Corporation is running a SeniHug proof of concept (PoC) with Hyundai E&C.',
    '실제 주거 환경에서 비접촉 생체신호 모니터링의 활용 가능성을 확인하고, 현장에서 얻은 경험을 바탕으로 서비스를 고도화해 나갑니다.': 'We are confirming how contactless vital-sign monitoring can be used in real residential settings, and will refine the service based on what we learn on site.',
    "시그코퍼레이션, 22억원 사업화 자금 확보…AIoT 센서 '시니허그' 상용화 속도": "SIG Corporation secures KRW 2.2 billion in commercialization funding, speeding up the launch of AIoT sensor 'SeniHug'",
    '사업화 자금 확보를 바탕으로 기술 고도화와 제품 검증, 공공기관 실증을 확대합니다.': 'With commercialization funding secured, we are expanding technology development, product validation and public-sector trials.',
    '시그코퍼레이션이 2026년 상반기 22억원 규모의 사업화 자금을 확보했다고 전자신문이 보도했습니다. SVC SEOUL 입소와 함께 제품의 사업화 및 해외 진출 기반도 넓혀가고 있습니다.': 'ETNews reported that SIG Corporation secured about KRW 2.2 billion in commercialization funding in the first half of 2026. Having joined SVC SEOUL, the company is also broadening its base for commercialization and overseas expansion.',
    '확보한 기반을 토대로 비접촉 생체신호 기술을 고도화하고, 제품 검증과 공공기관 현장 실증을 이어갈 계획입니다.': 'Building on this, the company plans to advance its contactless vital-sign technology and continue product validation and field trials with public institutions.',
    "시그코퍼레이션, 중소벤처기업부 '딥테크창업사관학교(수도권)' 1기 선정": "SIG Corporation selected for the first cohort of the Ministry of SMEs and Startups' Deep Tech Startup Academy (Seoul metropolitan area)",
    '기술 상용화와 시장 진출을 지원하는 딥테크창업사관학교 수도권 1기에 선정됐습니다.': 'We were selected for the first Seoul-area cohort of the Deep Tech Startup Academy, which supports technology commercialization and market entry.',
    '시그코퍼레이션이 중소벤처기업부의 딥테크창업사관학교 수도권 1기에 선정됐습니다. 이 프로그램은 디지털 헬스케어 등 신산업 분야 창업기업의 기술 상용화와 시장 진출을 지원합니다.': 'SIG Corporation was selected for the first Seoul metropolitan cohort of the Deep Tech Startup Academy run by the Ministry of SMEs and Startups. The program supports technology commercialization and market entry for startups in new industries such as digital healthcare.',
    '회사는 비접촉 생체신호 기술과 모니터링 서비스의 현장 활용성을 높이는 데 집중하고 있습니다.': 'The company is focused on making its contactless vital-sign technology and monitoring service more useful in the field.',
    "시그코퍼레이션, 테디스 어워즈 2025 후원사 참여…유경하 이화의료원장에 '희망과 감동상' 수여": "SIG Corporation sponsors the TEDIS Awards 2025, presenting the 'Hope and Inspiration Award' to Yoo Kyung-ha, head of Ewha Womans University Medical Center",
    '테디스 어워즈 2025에 브론즈 스폰서로 참여해 의료·사회 분야의 기여를 응원했습니다.': 'We took part in the TEDIS Awards 2025 as a bronze sponsor, supporting contributions in healthcare and society.',
    '시그코퍼레이션은 2025년 12월 3일 열린 테디스 어워즈 2025에 브론즈 스폰서로 참여했습니다.': 'SIG Corporation took part as a bronze sponsor in the TEDIS Awards 2025, held on December 3, 2025.',
    '행사에서 유경하 이화의료원장에게 희망과 감동상을 수여하며 의료·사회 분야의 기여를 응원했습니다.': 'At the event, the company presented the Hope and Inspiration Award to Yoo Kyung-ha, head of Ewha Womans University Medical Center, in support of contributions in healthcare and society.',
    "시그코퍼레이션, '헥토콘 2호 투자조합'서 시드투자 유치": "SIG Corporation raises seed investment from the 'Hectocon No. 2 Investment Fund'",
    '헥토그룹과 씨엔티테크가 공동 결성한 투자조합을 통해 시드 투자를 유치했습니다.': 'We raised seed investment through a fund jointly formed by Hecto Group and CNT Tech.',
    '시그코퍼레이션이 헥토콘 2호 투자조합으로부터 시드 투자를 유치했습니다. 이 투자조합은 헥토그룹과 스타트업 액셀러레이터 씨엔티테크가 함께 결성했습니다.': 'SIG Corporation raised seed investment from the Hectocon No. 2 Investment Fund, which was formed jointly by Hecto Group and startup accelerator CNT Tech.',
    '이번 투자는 AIoT 헬스케어 사업의 제품 상용화와 생체데이터 분석 기술 개발을 뒷받침하는 성장 기반이 됩니다.': "The investment provides a base for commercializing the company's AIoT healthcare products and developing its biometric data analysis technology.",
    "시그코퍼레이션, 중기부 '팁스(TIPS)' 최종 선정...AIoT 기반 비접촉 생체신호 감지 기술 인정받아": "SIG Corporation selected for the Ministry of SMEs and Startups' TIPS program, recognized for AIoT-based contactless vital-sign sensing",
    'TIPS 선정을 통해 비접촉 생체신호 감지 기술의 연구개발과 사업화를 이어갑니다.': 'Through TIPS, we continue R&D and commercialization of our contactless vital-sign sensing technology.',
    '시그코퍼레이션이 중소벤처기업부의 기술 창업 지원 프로그램 TIPS에 최종 선정됐습니다. 비접촉 생체신호 감지 기술을 바탕으로 연구개발과 사업화를 추진합니다.': "SIG Corporation was selected for TIPS, the Ministry of SMEs and Startups' support program for technology startups. The company will pursue R&D and commercialization based on its contactless vital-sign sensing technology.",
    '보도에 따르면 향후 2년 동안 연구개발 및 사업화에 최대 7억원 규모의 지원을 받을 수 있습니다.': 'According to the report, the company can receive up to KRW 700 million in support for R&D and commercialization over the next two years.',
    '← 소식 목록으로': '← Back to news', '소식 목록으로 ↗': 'Back to news ↗', '위 내용은 보도의 주요 내용을 요약한 것입니다. 전체 기사는 아래 원문에서 확인하실 수 있습니다.': 'This is a summary of the main points of the report. The full article is available at the original link below.',
    '전자신문 원문 보기': 'Read the original on ETNews (Korean)', '사업 협력 문의': 'Business inquiries',
    '소식을 찾을 수 없습니다': 'News not found', '소식을 찾을 수 없습니다.': 'News not found.', '주소를 확인하거나 소식 목록에서 다시 선택해 주세요.': 'Please check the address or choose again from the news list.',
    // 문의 · 오시는 길
    '더 나은 돌봄, 함께 시작합니다': 'Better care starts together', '공공기관·의료·요양시설·주거공간에 맞는 시니허그 도입과 사업 협력을 제안해 주세요.': 'Tell us about adopting SeniHug or partnering with us for public institutions, medical and care facilities, and residential spaces.',
    '도입 및 사업 협력 문의': 'Adoption and partnership inquiries', '문의하기': 'Contact us', '오시는 길': 'Location', '본사': 'Headquarters', '기업부설연구소': 'Corporate R&D Center',
    '서울특별시 서대문구 수색로 43, 208호': '208, 43 Susaek-ro, Seodaemun-gu, Seoul, Korea', '서울특별시 마포구 양화로 136, 402호': '402, 136 Yanghwa-ro, Mapo-gu, Seoul, Korea', '네이버 지도에서 보기 ↗': 'View on Naver Map ↗',
    '시그코퍼레이션 본사 위치 — 서울 서대문구 수색로 43': 'SIG Corporation headquarters — 43 Susaek-ro, Seodaemun-gu, Seoul', '시그코퍼레이션 기업부설연구소 위치 — 서울 마포구 양화로 136': 'SIG Corporation R&D center — 136 Yanghwa-ro, Mapo-gu, Seoul'
  };

  // ---------- 번호·건수처럼 형식이 정해진 문구 ----------
  const RULES = [
    [/^제(\d+)류$/, (m) => 'Class ' + m[1]],
    [/^제([\d-]+)호$/, (m) => 'No. ' + m[1]],
    [/^(.+) 제([\d-]+)호$/, (m, t) => (t(m[1]) || m[1]) + ' No. ' + m[2]],
    [/^출원번호 (.+)$/, (m) => 'Application No. ' + m[1]],
    [/^인증번호 (.+)$/, (m) => 'Certification No. ' + m[1]],
    [/^발급번호 제(.+)호$/, (m) => 'Issue No. ' + m[1]],
    [/^모델명 (.+)$/, (m) => 'Model ' + m[1]],
    [/^유효기간 (.+)$/, (m) => 'Valid ' + m[1]],
    [/^(.+) (\d+)건$/, (m, t) => (t(m[1]) || m[1]) + ' · ' + m[2] + (m[2] === '1' ? ' item' : ' items')],
    [/^(.+) 관련 시니허그 제품 화면$/, (m, t) => 'SeniHug product screen for ' + (t(m[1]) || m[1]).replace(/\s+/g, ' ')],
    [/^(.+) 원문 보기$/, (m, t) => 'Read the original on ' + (t(m[1]) || m[1]) + ' (Korean)'],
    [/^(.+) ·$/, (m, t) => (t(m[1]) || m[1]) + ' ·']
  ];
  const HAN = /[가-힣]/, norm = s => s.replace(/\s+/g, ' ').trim();
  const missing = window.SIG_I18N_MISSING = new Set();

  // ---------- content.js 의 영문(*_en) 값을 사전에 합친다. 관리자 페이지에서 입력한 번역이 위 사전보다 우선한다 ----------
  const escHtml = t => t.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function learn(ko, en) {
    if (typeof ko !== 'string' || typeof en !== 'string' || !en.trim() || !HAN.test(ko)) return;
    const key = norm(ko.replace(/\*\*/g, ''));
    TEXT[key] = en.replace(/\*\*/g, '');
    if (/\n|\*\*/.test(ko)) HTML[key] = escHtml(en).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }
  (function walk(o) {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') for (const k of Object.keys(o)) {
      if (!k.endsWith('_en')) { walk(o[k]); continue; }
      const ko = o[k.slice(0, -3)], en = o[k];
      if (Array.isArray(ko) && Array.isArray(en)) ko.forEach((x, i) => learn(x, en[i])); else learn(ko, en);
    }
  })(window.SIG_CONTENT || {});

  function translate(raw, tag) {
    const key = norm(raw);
    if (!HAN.test(key)) return null;
    const hit = TEXT[tag + ':' + key] ?? TEXT[key];
    if (hit != null) return hit;
    for (const [re, fn] of RULES) { const m = key.match(re); if (m) { const out = fn(m, s => translate(s, tag)); if (!HAN.test(out)) return out; } }
    for (const sep of [' | ', ' — ', ' · ']) if (key.includes(sep)) { const out = key.split(sep).map(part => translate(part, tag) ?? part).join(sep); if (!HAN.test(out)) return out; }
    missing.add(key); return null;
  }
  const keyOf = el => { let s = ''; (function walk(n) { n.childNodes.forEach(c => { if (c.nodeType === 3) s += c.nodeValue; else if (c.nodeName === 'BR') s += ' '; else if (c.nodeType === 1) walk(c); }); })(el); return norm(s); };
  const ATTRS = ['alt', 'aria-label', 'title', 'content', 'data-caption', 'placeholder'];

  function apply(root) {
    if (root.nodeType === 3) { textNode(root); return; }
    if (root.nodeType !== 1 || root.closest('.lang-switch,script,style,noscript')) return;
    const scope = [root, ...root.querySelectorAll('*')];
    scope.forEach(el => { if (el.firstElementChild && /^(H[1-4]|P|TD|DD|LI|FIGCAPTION)$/.test(el.tagName)) { const html = HTML[keyOf(el)]; if (html) el.innerHTML = html; } });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(textNode);
    [root, ...root.querySelectorAll('*')].forEach(attrs);
  }
  function textNode(node) {
    const parent = node.parentElement; if (!parent || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(parent.tagName) || parent.closest('.lang-switch')) return;
    const out = translate(node.nodeValue, parent.tagName.toLowerCase()); if (out == null) return;
    const lead = node.nodeValue.match(/^\s*/)[0], trail = node.nodeValue.match(/\s*$/)[0];
    node.nodeValue = lead + out + trail;
  }
  function attrs(el) {
    if (el.closest('.lang-switch')) return;
    for (const name of ATTRS) { const v = el.getAttribute(name); if (v && HAN.test(v)) { const out = translate(v, el.tagName.toLowerCase()); if (out != null) el.setAttribute(name, out.replace(/\s+/g, ' ')); } }
  }

  apply(document.documentElement);
  // app.js 가 나중에 그리는 내용(뉴스, 연혁, 사업영역, 팝업 등)도 나타나는 즉시 번역
  new MutationObserver(list => list.forEach(m => {
    if (m.type === 'childList') {
      // 이미 있던 요소의 내용만 바뀐 경우(예: 회사 소개 문단)도 문단 단위 번역을 먼저 시도한다
      const el = m.target;
      if (el.nodeType === 1 && el.firstElementChild && /^(H[1-4]|P|TD|DD|LI|FIGCAPTION)$/.test(el.tagName)) { const html = HTML[keyOf(el)]; if (html) { el.innerHTML = html; return; } }
      m.addedNodes.forEach(apply);
    }
    else if (m.type === 'characterData') textNode(m.target);
    else if (m.type === 'attributes') attrs(m.target);
  })).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  document.documentElement.classList.remove('i18n-pending');
})();
