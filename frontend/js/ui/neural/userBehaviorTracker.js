const INTERACTION_HISTORY_SIZE = 1000;
const INACTIVE_TIMEOUT = 60000;
const STORAGE_KEY = 'userBehaviorMetrics';
const SAMPLING_RATE = 0.1;

class UserBehaviorTracker {
  constructor() {
    this.metrics = {
      interactions: {
        clicks: 0,
        keyPresses: 0,
        scrolls: 0,
        hovers: 0,
        formSubmits: 0,
        navigationActions: 0,
      },

      timeSpent: {},

      frequentSections: {},
      frequentElements: {},

      interactionHistory: [],

      usageTimeDistribution: Array(24).fill(0),

      usageDayDistribution: Array(7).fill(0),

      sessionData: {
        count: 0,
        averageDuration: 0,
        totalTimeSpent: 0,
      },

      lastUpdated: new Date().toISOString(),
    };

    this.currentState = {
      sessionStart: new Date(),
      lastActivity: new Date(),
      currentSection: null,
      sectionEnterTime: null,
      isActive: true,
      mouseSampleCount: 0,
      lastScrollPosition: 0,
    };

    this.loadMetrics();

    this.initTrackers();
  }

  initTrackers() {
    this.startSession();

    this.trackClicks();
    this.trackKeyboard();
    this.trackScroll();
    this.trackMouseMovement();
    this.trackForms();
    this.trackNavigation();
    this.trackSectionViewing();
    this.trackInactivity();

    window.addEventListener('beforeunload', () => this.saveMetrics());

    const hour = new Date().getHours();
    this.metrics.usageTimeDistribution[hour]++;

    const day = new Date().getDay();
    this.metrics.usageDayDistribution[day]++;
  }

  startSession() {
    this.currentState.sessionStart = new Date();
    this.currentState.lastActivity = new Date();
    this.currentState.isActive = true;
    this.metrics.sessionData.count++;

    const pathName = window.location.pathname;
    const hash = window.location.hash;
    this.currentState.currentSection = this.identifyCurrentSection(
      pathName,
      hash
    );
    this.currentState.sectionEnterTime = new Date();
  }

  trackClicks() {
    document.addEventListener('click', (e) => {
      this.updateActivity();

      this.metrics.interactions.clicks++;

      const element = this.identifyElement(e.target);

      this.recordInteraction('click', element);

      this.updateFrequentElements(element);
    });
  }

  trackKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
        return;
      }

      this.updateActivity();

      this.metrics.interactions.keyPresses++;

      const context = this.identifyKeyboardContext(e);

      this.recordInteraction('keypress', context);
    });
  }

  trackScroll() {
    let scrollTimeout;

    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);

      scrollTimeout = setTimeout(() => {
        this.updateActivity();

        const currentPosition = window.scrollY;
        const direction =
          currentPosition > this.currentState.lastScrollPosition
            ? 'down'
            : 'up';
        const distance = Math.abs(
          currentPosition - this.currentState.lastScrollPosition
        );

        this.currentState.lastScrollPosition = currentPosition;

        if (distance > 50) {
          this.metrics.interactions.scrolls++;

          this.recordInteraction('scroll', { direction, distance });
        }
      }, 200);
    });
  }

  trackMouseMovement() {
    document.addEventListener('mousemove', (e) => {
      this.currentState.mouseSampleCount++;
      if (
        this.currentState.mouseSampleCount % Math.floor(1 / SAMPLING_RATE) !==
        0
      ) {
        return;
      }

      this.updateActivity();

      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (element) {
        const elementInfo = this.identifyElement(element);

        if (this.isInteractiveElement(element)) {
          this.metrics.interactions.hovers++;
          this.recordInteraction('hover', elementInfo);
        }
      }
    });
  }

  trackForms() {
    document.addEventListener('submit', (e) => {
      this.updateActivity();
      this.metrics.interactions.formSubmits++;

      const formId = e.target.id || e.target.name || 'unknown-form';
      this.recordInteraction('form_submit', { formId });
    });

    document.addEventListener('change', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        this.updateActivity();

        const fieldInfo = {
          type: e.target.type || e.target.tagName.toLowerCase(),
          id: e.target.id || e.target.name || 'unknown-field',
          formId: e.target.form
            ? e.target.form.id || e.target.form.name || 'unknown-form'
            : null,
        };

        this.recordInteraction('form_field_change', fieldInfo);
      }
    });
  }

  trackNavigation() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (link && link.href) {
        this.metrics.interactions.navigationActions++;

        const isInternal = link.href.startsWith(window.location.origin);
        const navInfo = {
          type: 'link',
          url: link.href,
          isInternal,
          text: link.textContent?.trim() || '',
        };

        this.recordInteraction('navigation', navInfo);
      }
    });

    window.addEventListener('hashchange', () => {
      this.metrics.interactions.navigationActions++;

      const navInfo = {
        type: 'hash_change',
        from: this.currentState.currentSection,
        to: this.identifyCurrentSection(
          window.location.pathname,
          window.location.hash
        ),
      };

      this.recordSectionExit();
      this.currentState.currentSection = navInfo.to;
      this.currentState.sectionEnterTime = new Date();

      this.recordInteraction('navigation', navInfo);
      this.updateFrequentSections(navInfo.to);
    });
  }

  trackSectionViewing() {
    setInterval(() => {
      if (!this.currentState.isActive) return;

      const pathName = window.location.pathname;
      const hash = window.location.hash;
      const currentSection = this.identifyCurrentSection(pathName, hash);

      if (this.currentState.currentSection !== currentSection) {
        this.recordSectionExit();
        this.currentState.currentSection = currentSection;
        this.currentState.sectionEnterTime = new Date();
        this.updateFrequentSections(currentSection);
      }
    }, 5000);
  }

  trackInactivity() {
    setInterval(
      () => {
        const now = new Date();
        const timeSinceLastActivity = now - this.currentState.lastActivity;

        if (timeSinceLastActivity > INACTIVE_TIMEOUT) {
          if (this.currentState.isActive) {
            this.currentState.isActive = false;
            this.recordSectionExit();
          }
        } else if (!this.currentState.isActive) {
          this.currentState.isActive = true;
          this.currentState.sectionEnterTime = now;
        }
      },
      Math.floor(INACTIVE_TIMEOUT / 2)
    );
  }

  updateActivity() {
    const now = new Date();
    this.currentState.lastActivity = now;

    if (!this.currentState.isActive) {
      this.currentState.isActive = true;
      this.currentState.sectionEnterTime = now;
    }
  }

  recordSectionExit() {
    if (
      !this.currentState.currentSection ||
      !this.currentState.sectionEnterTime ||
      !this.currentState.isActive
    ) {
      return;
    }

    const now = new Date();
    const timeSpentMs = now - this.currentState.sectionEnterTime;
    const timeSpentSec = Math.floor(timeSpentMs / 1000);

    if (timeSpentSec < 1) return;

    if (!this.metrics.timeSpent[this.currentState.currentSection]) {
      this.metrics.timeSpent[this.currentState.currentSection] = 0;
    }

    this.metrics.timeSpent[this.currentState.currentSection] += timeSpentSec;
  }

  identifyCurrentSection(pathName, hash) {
    if (pathName.includes('admin.html')) {
      if (hash) {
        return `admin:${hash.replace('#', '')}`;
      }
      return 'admin:dashboard';
    } else if (
      pathName.includes('index.html') ||
      pathName === '/' ||
      pathName === ''
    ) {
      if (hash) {
        return `main:${hash.replace('#', '')}`;
      }
      return 'main:home';
    }

    return pathName;
  }

  identifyElement(element) {
    if (!element) return { type: 'unknown' };

    const interactive = this.findClosestInteractive(element);
    const actualElement = interactive || element;

    const type = actualElement.tagName.toLowerCase();
    const id = actualElement.id || '';
    const classes = Array.from(actualElement.classList).join(' ');
    const text = actualElement.textContent?.trim().substring(0, 50) || '';
    const ariaLabel = actualElement.getAttribute('aria-label') || '';
    const dataAction = actualElement.dataset.action || '';

    const details = {};

    if (type === 'button' || actualElement.getAttribute('role') === 'button') {
      details.buttonType = actualElement.type || 'button';
    } else if (type === 'a') {
      details.href = actualElement.href || '';
      details.isExternal =
        actualElement.href &&
        !actualElement.href.startsWith(window.location.origin);
    } else if (type === 'input' || type === 'select' || type === 'textarea') {
      details.inputType = actualElement.type || type;
      details.name = actualElement.name || '';
      details.formId = actualElement.form ? actualElement.form.id || '' : '';
    }

    let identifier = '';
    if (id) identifier += `#${id}`;
    if (classes) identifier += `.${classes.replace(/\s+/g, '.')}`;
    if (!identifier && (dataAction || ariaLabel || text)) {
      identifier = `${type}[${dataAction || ariaLabel || text}]`;
    }
    if (!identifier) identifier = type;

    return {
      type,
      identifier,
      details,
    };
  }

  findClosestInteractive(element) {
    let current = element;

    while (current && current !== document.body) {
      if (this.isInteractiveElement(current)) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  }

  isInteractiveElement(element) {
    if (!element) return false;

    const tag = element.tagName.toLowerCase();
    const role = element.getAttribute('role');

    if (
      [
        'a',
        'button',
        'input',
        'select',
        'textarea',
        'details',
        'summary',
      ].includes(tag)
    ) {
      return true;
    }

    if (
      ['button', 'link', 'checkbox', 'menuitem', 'tab', 'radio'].includes(role)
    ) {
      return true;
    }

    if (
      element.onclick ||
      element.getAttribute('onclick') ||
      element.dataset.action
    ) {
      return true;
    }

    if (
      element.getAttribute('tabindex') &&
      element.getAttribute('tabindex') !== '-1'
    ) {
      return true;
    }

    return false;
  }

  identifyKeyboardContext(event) {
    const target = event.target;
    const key = event.key;
    const hasModifier =
      event.ctrlKey || event.altKey || event.metaKey || event.shiftKey;

    const isShortcut = hasModifier && key.length === 1;

    let contextType = 'general';
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      contextType = 'form_input';
    } else if (isShortcut) {
      contextType = 'shortcut';
    } else if (
      ['Enter', 'Space'].includes(key) &&
      this.isInteractiveElement(target)
    ) {
      contextType = 'activation';
    } else if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key)
    ) {
      contextType = 'navigation';
    }

    return {
      contextType,
      element: this.identifyElement(target),
      key,
      hasModifier,
      modifiers: {
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey,
        meta: event.metaKey,
      },
    };
  }

  recordInteraction(type, details) {
    const timestamp = new Date().toISOString();

    const interaction = {
      type,
      timestamp,
      details,
    };

    this.metrics.interactionHistory.unshift(interaction);
    if (this.metrics.interactionHistory.length > INTERACTION_HISTORY_SIZE) {
      this.metrics.interactionHistory.pop();
    }
  }

  updateFrequentElements(element) {
    if (!element || !element.identifier) return;

    const { identifier, type } = element;
    if (!this.metrics.frequentElements[identifier]) {
      this.metrics.frequentElements[identifier] = {
        count: 0,
        type,
        lastUsed: new Date().toISOString(),
      };
    }

    this.metrics.frequentElements[identifier].count++;
    this.metrics.frequentElements[identifier].lastUsed =
      new Date().toISOString();
  }

  updateFrequentSections(section) {
    if (!section) return;

    if (!this.metrics.frequentSections[section]) {
      this.metrics.frequentSections[section] = {
        count: 0,
        lastVisited: new Date().toISOString(),
      };
    }

    this.metrics.frequentSections[section].count++;
    this.metrics.frequentSections[section].lastVisited =
      new Date().toISOString();
  }

  loadMetrics() {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);

        if (parsed && typeof parsed === 'object') {
          if (parsed.interactions) {
            this.metrics.interactions = {
              ...this.metrics.interactions,
              ...parsed.interactions,
            };
          }

          if (parsed.timeSpent) this.metrics.timeSpent = parsed.timeSpent;
          if (parsed.frequentSections)
            this.metrics.frequentSections = parsed.frequentSections;
          if (parsed.frequentElements)
            this.metrics.frequentElements = parsed.frequentElements;
          if (parsed.usageTimeDistribution)
            this.metrics.usageTimeDistribution = parsed.usageTimeDistribution;
          if (parsed.usageDayDistribution)
            this.metrics.usageDayDistribution = parsed.usageDayDistribution;

          if (parsed.sessionData) {
            this.metrics.sessionData = {
              ...this.metrics.sessionData,
              ...parsed.sessionData,
            };
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar métricas de comportamento:', error);
    }
  }

  saveMetrics() {
    try {
      const sessionDuration =
        (new Date() - this.currentState.sessionStart) / 1000;

      this.recordSectionExit();

      const totalDuration =
        this.metrics.sessionData.totalTimeSpent + sessionDuration;
      const totalSessions = this.metrics.sessionData.count;

      this.metrics.sessionData.totalTimeSpent = totalDuration;
      this.metrics.sessionData.averageDuration =
        totalSessions > 0 ? totalDuration / totalSessions : 0;

      this.metrics.lastUpdated = new Date().toISOString();

      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Erro ao salvar métricas de comportamento:', error);
    }
  }

  getMetrics() {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  getMostFrequentSections(limit = 5) {
    const sections = Object.entries(this.metrics.frequentSections)
      .map(([section, data]) => ({
        section,
        count: data.count,
        lastVisited: data.lastVisited,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sections;
  }

  getMostFrequentElements(limit = 10) {
    const elements = Object.entries(this.metrics.frequentElements)
      .map(([identifier, data]) => ({
        identifier,
        type: data.type,
        count: data.count,
        lastUsed: data.lastUsed,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return elements;
  }

  getPeakUsageHours(limit = 3) {
    return this.metrics.usageTimeDistribution
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  clearAllData() {
    this.metrics = {
      interactions: {
        clicks: 0,
        keyPresses: 0,
        scrolls: 0,
        hovers: 0,
        formSubmits: 0,
        navigationActions: 0,
      },
      timeSpent: {},
      frequentSections: {},
      frequentElements: {},
      interactionHistory: [],
      usageTimeDistribution: Array(24).fill(0),
      usageDayDistribution: Array(7).fill(0),
      sessionData: {
        count: 0,
        averageDuration: 0,
        totalTimeSpent: 0,
      },
      lastUpdated: new Date().toISOString(),
    };

    localStorage.removeItem(STORAGE_KEY);

    this.startSession();
  }
}

const userBehaviorTracker = new UserBehaviorTracker();
export default userBehaviorTracker;
