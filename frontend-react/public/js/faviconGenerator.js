/**
 * Favicon Generator
 * Gera um favicon simples para o site
 */

(function () {
  // Função para gerar o favicon
  function generateFavicon() {
    // Criar um elemento canvas
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;

    const ctx = canvas.getContext('2d');

    // Definir cores baseadas no tema verde escuro
    const bgColor = '#1e3a1e';
    const fgColor = '#8bc34a';

    // Desenhar o fundo
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 32, 32);

    // Desenhar um símbolo simples (um troféu estilizado)
    ctx.fillStyle = fgColor;

    // Base do troféu
    ctx.fillRect(10, 24, 12, 4);
    ctx.fillRect(14, 28, 4, 3);

    // Corpo do troféu
    ctx.fillRect(14, 10, 4, 14);

    // Topo do troféu
    ctx.beginPath();
    ctx.arc(16, 10, 8, 0, Math.PI, true);
    ctx.fill();

    // Alças do troféu
    ctx.beginPath();
    ctx.arc(8, 12, 4, 0, Math.PI * 2, false);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(24, 12, 4, 0, Math.PI * 2, false);
    ctx.fill();

    // Converter o canvas para uma URL de dados
    const dataUrl = canvas.toDataURL('image/png');

    // Criar um elemento link para o favicon
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    // Definir o href do link para a URL de dados
    link.href = dataUrl;
    link.type = 'image/png';
  }

  // Executar a função quando o DOM estiver carregado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', generateFavicon);
  } else {
    generateFavicon();
  }
})();
