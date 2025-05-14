export function createAccessibleImage(src, alt, options = {}) {
  if (!alt && !options.decorative) {
    console.warn(`Acessibilidade: Imagem sem texto alternativo: ${src}`);
  }

  const img = document.createElement('img');
  img.src = src;

  if (options.decorative) {
    img.alt = '';
    img.setAttribute('role', 'presentation');
  } else {
    img.alt = alt || '';
  }

  if (options.className) {
    img.className = options.className;
  }

  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      img.setAttribute(key, value);
    });
  }

  if (options.events) {
    Object.entries(options.events).forEach(([event, handler]) => {
      img.addEventListener(event, handler);
    });
  }

  return img;
}

export function auditImagesAccessibility() {
  const images = document.querySelectorAll('img');
  let issuesFound = 0;

  images.forEach((img, index) => {
    const src = img.src || 'sem-src';
    const hasAlt = img.hasAttribute('alt');
    const isPresentational = img.getAttribute('role') === 'presentation';

    if (!hasAlt && !isPresentational) {
      console.warn(
        `Acessibilidade: Imagem #${index + 1} (${src}) não possui atributo alt`
      );
      issuesFound++;
    } else if (img.alt === '' && !isPresentational) {
      console.warn(
        `Acessibilidade: Imagem #${index + 1} (${src}) possui alt vazio, mas não está marcada como decorativa`
      );
      issuesFound++;
    }
  });

  if (issuesFound === 0) {
    /* Nenhuma ação necessária se não houver problemas */ void 0;
  } else {
    console.warn(
      `Acessibilidade: Encontrados ${issuesFound} problemas com textos alternativos de imagens.`
    );
  }

  return issuesFound === 0;
}

export function setupLogoAccessibility() {
  const logoImg = document.querySelector('img[src*="logo.jpeg"]');
  if (logoImg && !logoImg.hasAttribute('alt')) {
    logoImg.alt = 'Logotipo do Torneio de Sinuca LASCMMG';
  }

  document.querySelectorAll('img[src*="logo"]').forEach((img) => {
    if (!img.hasAttribute('alt')) {
      img.alt = 'Logotipo do Torneio de Sinuca LASCMMG';
    }
  });
}

export function initImageUtils() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupLogoAccessibility);
  } else {
    setupLogoAccessibility();
  }

  setTimeout(auditImagesAccessibility, 1000);
}

initImageUtils();
