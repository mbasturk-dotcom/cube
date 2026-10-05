/**
 * Turkish stays in the HTML, so the page is readable with no JavaScript.
 * English is applied by key. Attribute originals are captured once, before
 * the first switch, and put back when the reader returns to Turkish.
 */

const en = {
  'meta.title': 'Mehmet Alp Baştürk — Lead Software Engineer',
  'meta.description':
    'Mehmet Alp Baştürk, lead software engineer in Ankara. Eight years in high-traffic microservices, five years in the United States. A turning cube in six parts: about, experience, impact, skills, education, and contact.',
  skip: 'Skip to content',
  pdf: 'Download PDF',
  'view.list': 'View as list',
  'view.cube': 'View as cube',
  'stage.aria': 'Spinning cube. Drag, or use the arrow keys, to turn it.',
  'nav.aria': 'Sections',
  'lang.group': 'Language',
  'roll.help': 'How the number is produced',
  'roll.note':
    'This number is not the browser’s Math.random. RANDOM.ORG draws a true random integer from atmospheric noise. The integer is divided by 6; the remainder selects the die face. A remainder of 0 is face six.',
  'roll.fail': 'RANDOM.ORG did not respond.',
  'panel.close': 'Close',

  'about.label': 'About',
  'about.eyebrow': '01 — About',
  'about.lede':
    'Lead software engineer. Eight years in high-traffic microservices; AI-assisted development.',
  'about.hook1': 'Five years of industry experience in the United States.',
  'about.hook2': 'Design of high-traffic, low-latency systems.',
  'about.hook3': 'Faster delivery without giving up code quality.',
  'about.p1':
    'Lead software engineer with eight years of experience in high-traffic, low-latency microservice architectures and a strong practice in AI-assisted development. Five years of industry experience in the United States, and an M.S. in Computer Science completed there. Speeds up coding, refactoring, test automation, and documentation with AI tools such as Cursor IDE and Claude Code, and raises delivery speed without compromising code quality.',
  'about.p2':
    'Designs and builds scalable services with Spring Boot, and sets up event-driven data flows with Kafka and RabbitMQ to create fault-tolerant, highly available systems. Runs cloud environments on AWS and Kubernetes, tunes CI/CD, and strengthens continuity with observability tools such as Datadog. Works effectively on Agile teams, coordinates across teams and with offshore teams, and mentors junior engineers.',

  'experience.label': 'Experience',
  'experience.eyebrow': '02 — Experience',
  'experience.title': 'Experience',
  'experience.lede': 'Telecom, DeFi, e-learning, cybersecurity, testing, and mobile.',
  'experience.charter.role': 'Lead Software Engineer',
  'experience.charter.meta': 'Charter Communications (Spectrum Mobile), USA · 2023 — 2026',
  'experience.charter.1':
    'Designed and built Java 17 / Spring Boot microservices that process millions of transactions a day for the Spectrum Mobile Network Service Layer.',
  'experience.charter.2':
    'Sped up development, refactoring, test generation, and documentation with AI tools such as Cursor IDE and Claude Code.',
  'experience.charter.3':
    'Built event-driven queue services with Kafka and RabbitMQ, cutting processing latency by 30% and raising throughput.',
  'experience.charter.4':
    'Ran deployment and production support on AWS EKS/Kubernetes, and held availability at 99.99% with Datadog and ELK monitoring.',
  'experience.charter.5':
    'Led defect and incident management through Jira and Datadog, reducing recurring problems and improving release stability.',
  'experience.charter.6':
    'Kept API documentation current in Swagger and Jira so services stayed aligned with changing business and technical requirements.',
  'experience.charter.7':
    'Worked with cross-functional and offshore teams, mentored junior engineers, and raised internal-tool delivery speed with no-code/low-code solutions.',
  'experience.charter.stack':
    'Java 17, Spring Boot, Kafka, RabbitMQ, REST APIs, AWS (EKS, S3, CloudWatch), Kubernetes, Docker, GitLab CI, Jenkins, Datadog, ELK, Swagger, Jira, Cursor IDE, Claude Code',
  'experience.bumerang.role': 'Lead Software Engineer',
  'experience.bumerang.1':
    'Led a team of four building Java / Spring Boot backend services for DeFi protocols, including AMMs (Automated Market Makers) and liquidity pools.',
  'experience.bumerang.2':
    'Designed smart contracts in Solidity on Binance Smart Chain. Enabled token swaps and the creation of liquidity-provider (LP) tokens.',
  'experience.bumerang.3':
    'Ran requirements analysis, architecture, and sprint delivery. Raised on-time feature delivery by 25%.',
  'experience.bumerang.4':
    'Coordinated testing, troubleshooting, and optimization; cut the defect rate by 30% and strengthened platform security.',
  'experience.bumerang.5':
    'Mentored junior developers, introduced Git-based workflows, and improved PostgreSQL integrations to raise development efficiency.',
  'experience.enocta.role': 'Software Quality Assurance Engineer',
  'experience.enocta.1':
    'Designed and ran regression and automation test scenarios for the Enocta Learning Platform, helping keep performance consistent and reliable for thousands of active users.',
  'experience.enocta.2':
    'Automated regression tests with Jenkins and Selenium, raising test efficiency by 35% and shortening release cycles.',
  'experience.enocta.3':
    'Debugged and optimized existing tests to improve accuracy; cut the false-positive rate by 20%.',
  'experience.enocta.4':
    'Documented QA processes and wrote knowledge-sharing guides so the test team followed a standard, consistent practice.',
  'experience.enocta.5':
    'Worked closely with developers to find missing test scenarios and reduce post-release defects.',
  'experience.mobile.role': 'Mobile Application Developer',
  'experience.mobile.1':
    'Designed and built cross-platform mobile apps with React Native and Spring Boot, and shipped 2 production-ready apps under tight deadlines.',
  'experience.mobile.2':
    'Made UI/UX improvements that raised engagement and responsiveness; session length increased by 20%.',
  'experience.mobile.3':
    'Owned the end-to-end process, including coding, testing, and release to the app stores.',
  'experience.mobile.4':
    'Worked closely with designers and backend engineers to smooth out API integrations and optimize performance on iOS and Android.',
  'experience.biznet.role': 'Software Engineer',
  'experience.biznet.1':
    'Contributed to PDF e-signature software and supported compliance with cybersecurity and reliability standards.',
  'experience.biznet.2': 'Wrote unit tests and applied debugging workflows.',
  'experience.biznet.3':
    'Improved thread-pool management with thread synchronization, raising application stability and scalability.',
  'experience.biznet.4':
    'Worked closely with senior engineers to build secure, high-performance modules under tight deadlines.',

  'impact.label': 'Impact',
  'impact.eyebrow': '03 — Impact',
  'impact.title': 'Impact',
  'impact.lede': 'The difference measured in production.',
  'impact.p1': 'Millions of transactions a day',
  'impact.p2': 'Latency down 30%',
  'impact.p3': '99.99% availability on EKS',
  'impact.p4': 'On-time delivery up 25%',
  'impact.p5': 'Defects down 30%',
  'impact.scale': 'Scale and reliability',
  'impact.scale.1':
    'Java 17 / Spring Boot microservices on Spectrum Mobile’s network layer carried millions of transactions a day.',
  'impact.scale.2':
    'Kafka and RabbitMQ queues cut processing latency by 30% and raised throughput.',
  'impact.scale.3':
    'Availability on AWS EKS/Kubernetes was held at 99.99% with Datadog and ELK.',
  'impact.delivery': 'Delivery',
  'impact.delivery.1':
    'Architecture and sprint structure raised on-time feature delivery by 25%.',
  'impact.delivery.2':
    'Two apps shipped on a tight deadline; session length grew by 20%.',
  'impact.delivery.3':
    'Led a team of four: a Git workflow went in, and junior developers grew.',
  'impact.quality': 'Quality',
  'impact.quality.1': 'Systematic testing and optimization cut the defect rate by 30%.',
  'impact.quality.2':
    'Jenkins and Selenium regression sped up by 35%, and the release cycle shortened.',
  'impact.quality.3': 'False positives fell by 20%; post-release defects fell as well.',

  'skills.label': 'Skills',
  'skills.eyebrow': '04 — Skills',
  'skills.title': 'Skills',
  'skills.ai': 'Artificial intelligence',
  'skills.lang': 'Languages and programming',
  'skills.backend': 'Backend frameworks and libraries',
  'skills.arch': 'Architecture and services',
  'skills.arch.body': 'Microservice architectures, event-driven systems, RESTful APIs',
  'skills.msg': 'Messaging and streaming',
  'skills.db': 'Databases',
  'skills.cloud': 'Cloud platforms and DevOps',
  'skills.obs': 'Monitoring and observability',
  'skills.qa': 'Testing and quality assurance',
  'skills.practice': 'Practices and design approaches',
  'skills.practice.body':
    'OOP, algorithms and data structures, design patterns (Singleton, Observer, Strategy, Factory, Adapter, Proxy, State, Template), Agile/Scrum',
  'skills.tools': 'Tools',

  'education.label': 'Education',
  'education.eyebrow': '05 — Education',
  'education.title': 'Education',
  'education.ms': 'Computer Science, M.S. · 2024',
  'education.ms.school': 'Maharishi International University, USA',
  'education.bs': 'Computer Engineering, B.S. · 2020',
  'education.bs.school': 'TOBB University of Economics and Technology, Ankara',
  'education.ms.role': 'Computer Science, M.S.',
  'education.ms.meta': 'Maharishi International University · United States · 2024',
  'education.bs.role': 'Computer Engineering, B.S.',
  'education.bs.meta': 'TOBB University of Economics and Technology · Ankara, Turkey · 2020',

  'contact.label': 'Contact',
  'contact.eyebrow': '06 — Contact',
  'contact.title': 'Contact',
  'contact.lede': 'For lead software engineer roles.',
  'contact.place': 'Ankara, Turkey',
  'contact.qr': 'Contact card for Mehmet Alp Baştürk. Phone, email, and LinkedIn.',
  'contact.save': 'Save contact',

  more: 'Read more',
};

const trChrome = {
  'meta.title': 'Mehmet Alp Baştürk — Lider Yazılım Mühendisi',
  'meta.description':
    'Mehmet Alp Baştürk, Ankara’da lider yazılım mühendisi. Yüksek trafikli mikroservislerde 8 yıl, ABD’de 5 yıl. Altı bölümden oluşan dönen bir küp: hakkımda, deneyim, etki, yetenekler, eğitim ve iletişim.',
  'view.list': 'Liste olarak gör',
  'view.cube': 'Küp olarak gör',
  'roll.fail': 'RANDOM.ORG yanıt vermedi.',
};

const ATTRS = [
  ['i18nLabel', 'data-label'],
  ['i18nTitle', 'data-detail-title'],
  ['i18nAria', 'aria-label'],
];

export function createI18n(doc = document) {
  const textNodes = [...doc.querySelectorAll('[data-i18n]')];
  const originals = new Map(textNodes.map((el) => [el, el.textContent]));
  const attrNodes = ATTRS.map(([dataKey, attr]) => {
    const nodes = [...doc.querySelectorAll(`[data-${dataKey.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}]`)];
    return {
      dataKey,
      attr,
      nodes,
      saved: new Map(nodes.map((el) => [el, el.getAttribute(attr)])),
    };
  });

  let lang = 'tr';

  function textFor(key) {
    if (lang === 'en') return en[key];
    return trChrome[key];
  }

  function apply(next) {
    lang = next === 'en' ? 'en' : 'tr';
    doc.documentElement.lang = lang;

    textNodes.forEach((el) => {
      const value = lang === 'en' ? en[el.dataset.i18n] : originals.get(el);
      if (value == null) return;
      el.textContent = value;
    });

    attrNodes.forEach(({ dataKey, attr, nodes, saved }) => {
      nodes.forEach((el) => {
        const key = el.dataset[dataKey];
        const value = lang === 'en' ? en[key] : saved.get(el);
        if (value == null) return;
        el.setAttribute(attr, value);
      });
    });

    doc.title = textFor('meta.title');
    const description = doc.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', textFor('meta.description'));

    doc.querySelectorAll('.lang__option').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });
  }

  return {
    apply,
    t(key) {
      return textFor(key) ?? en[key] ?? key;
    },
    get lang() {
      return lang;
    },
  };
}

export function storedLang() {
  try {
    return localStorage.getItem('cube-lang') === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
}

export function rememberLang(lang) {
  try {
    localStorage.setItem('cube-lang', lang);
  } catch {
    /* private mode */
  }
}
