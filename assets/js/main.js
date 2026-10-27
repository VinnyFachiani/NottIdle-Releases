// NottIdle — site oficial
// Sem dependências. Só busca a última release no GitHub e ajusta os links.

const REPO = 'VinnyFachiani/NottIdle-Releases';
const API_RELEASE = `https://api.github.com/repos/${REPO}/releases/latest`;
const FALLBACK_URL = `https://github.com/${REPO}/releases/latest`;

// Link da plataforma de apoio (Ko-fi, AlertPix, LivePix...).
// Trocar pelo link real antes de publicar.
const APOIO_URL = 'https://livepix.gg/montauro';

const CACHE_KEY = 'nottidle:ultima-release';
const CACHE_TTL = 10 * 60 * 1000;

function formatarTamanho(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1048576;
  return `${mb.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MB`;
}

function aplicarRelease(release) {
  const exe = (release.assets || []).find((a) => /\.exe$/i.test(a.name));
  const url = exe?.browser_download_url || release.html_url || FALLBACK_URL;

  document.querySelectorAll('[data-download]').forEach((el) => {
    el.href = url;
  });

  document.querySelectorAll('[data-version]').forEach((el) => {
    el.textContent = release.tag_name || 'última versão';
  });

  if (exe?.size) {
    document.querySelectorAll('[data-size]').forEach((el) => {
      el.textContent = formatarTamanho(exe.size);
    });
  }
}

async function carregarUltimaRelease() {
  try {
    const bruto = sessionStorage.getItem(CACHE_KEY);
    if (bruto) {
      const cache = JSON.parse(bruto);
      if (cache && Date.now() - cache.t < CACHE_TTL && cache.release) {
        aplicarRelease(cache.release);
        return;
      }
    }
  } catch {
    // sessionStorage indisponível: segue para a rede
  }

  try {
    const resposta = await fetch(API_RELEASE, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!resposta.ok) throw new Error(`GitHub API ${resposta.status}`);
    const release = await resposta.json();
    aplicarRelease(release);

    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), release }));
    } catch {
      // sem cache, sem problema
    }
  } catch (erro) {
    // Mantém os links de fallback (página da última release)
    console.warn('[NottIdle] Não foi possível consultar a última release:', erro.message);
  }
}

function configurarApoio() {
  if (!APOIO_URL) return;
  document.querySelectorAll('[data-apoio]').forEach((el) => {
    el.href = APOIO_URL;
    el.target = '_blank';
    el.rel = 'noopener';
  });
}

function configurarMenu() {
  const botao = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav');
  if (!botao || !menu) return;

  const fechar = () => {
    menu.dataset.open = 'false';
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-label', 'Abrir menu');
  };

  botao.addEventListener('click', () => {
    const aberto = botao.getAttribute('aria-expanded') === 'true';
    if (aberto) {
      fechar();
      return;
    }
    menu.dataset.open = 'true';
    botao.setAttribute('aria-expanded', 'true');
    botao.setAttribute('aria-label', 'Fechar menu');
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', fechar));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') fechar();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) fechar();
  });
}

function configurarReveal() {
  const elementos = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    elementos.forEach((el) => el.classList.add('in'));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('in');
        observador.unobserve(entrada.target);
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );

  elementos.forEach((el) => observador.observe(el));
}

function configurarAno() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
}

configurarMenu();
configurarApoio();
configurarReveal();
configurarAno();
carregarUltimaRelease();
