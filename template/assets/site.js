/* =========================================================
   个人简历站  交互脚本（通用版，换内容无需修改本文件）
   单页应用：hash 路由 / 移动端侧边栏 / 进度条动画 / 气泡随鼠标公转
             / 页脚呼吸条点击翻页 / 简历 PDF blob 下载
   ========================================================= */
(function () {
  'use strict';

  var REDUCED = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. 页面切换（hash 路由） ---------- */
  var PAGES = ['home', 'work', 'path', 'about'];   // 与 section id 对应
  var NAV = document.querySelectorAll('[data-nav]');

  /** 显示指定页面并同步导航高亮 */
  function showPage(name) {
    if (PAGES.indexOf(name) === -1) name = 'home';

    // 切换 section 显隐
    PAGES.forEach(function (p) {
      var sec = document.getElementById('page-' + p);
      if (sec) sec.classList.toggle('active', p === name);
    });

    // 顶栏 + 侧边栏导航高亮
    NAV.forEach(function (a) {
      if (a.getAttribute('data-nav') === name) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });

    // 技能与教育页：触发进度条展开动画（先移除，下一帧再加回，保证重播）
    if (name === 'about') {
      var block = document.querySelector('[data-bars]');
      if (block) {
        block.classList.remove('bars-on');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { block.classList.add('bars-on'); });
        });
      }
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /** 从地址栏 hash 解析页面名 */
  function pageFromHash() {
    return (location.hash || '#home').replace('#', '');
  }

  window.addEventListener('hashchange', function () {
    showPage(pageFromHash());
  });
  showPage(pageFromHash());   // 首次进入

  /* ---------- 2. 页脚呼吸条：点击翻到下一页（循环） ---------- */
  var footBtn = document.getElementById('footNext');
  if (footBtn) {
    footBtn.addEventListener('click', function () {
      var cur = PAGES.indexOf(pageFromHash());
      if (cur === -1) cur = 0;
      location.hash = '#' + PAGES[(cur + 1) % PAGES.length];  // 触发 hashchange 切页
    });
  }

  /* ---------- 3. 移动端侧边栏抽屉 ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var sidebar = document.getElementById('sidebar');
  var scrim   = document.getElementById('scrim');

  function openSidebar() {
    sidebar.classList.add('open');
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('show'); });
    menuBtn.setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    scrim.classList.remove('show');
    menuBtn.setAttribute('aria-expanded', 'false');
    // 等淡出动画结束后再隐藏遮罩，避免闪断
    setTimeout(function () { scrim.hidden = true; }, 320);
  }

  menuBtn.addEventListener('click', function () {
    if (sidebar.classList.contains('open')) { closeSidebar(); } else { openSidebar(); }
  });
  scrim.addEventListener('click', closeSidebar);

  // 点击侧边栏链接：切页由 hashchange 处理，这里只负责关闭抽屉
  sidebar.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeSidebar);
  });

  // Esc 关闭抽屉
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
  });

  /* ---------- 4. 下载简历：blob 方式强制下载（避免浏览器内联打开 PDF） ---------- */
  var IS_WECHAT = /MicroMessenger/i.test(navigator.userAgent);
  var dlBtn = document.querySelector('a.btn.primary[href$=".pdf"]');
  var dlHint = document.getElementById('dlHint');
  if (dlBtn && dlHint && IS_WECHAT) {
    // 微信内置浏览器不支持 download 属性/blob 下载：展示长按保存提示，走浏览器默认打开
    dlHint.hidden = false;
  }
  if (dlBtn) {
    dlBtn.addEventListener('click', function (e) {
      // file:// 协议下 fetch 受限；微信内 blob 下载不可用，都交由浏览器默认行为
      if (location.protocol === 'file:' || IS_WECHAT) return;
      e.preventDefault();
      fetch(dlBtn.getAttribute('href'))
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.blob();
        })
        .then(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = dlBtn.getAttribute('download') || '';
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        })
        .catch(function () {
          location.href = dlBtn.getAttribute('href');   // 兜底：直接打开 PDF
        });
    });
  }

  /* ---------- 5. 首页：气泡随鼠标绕实况窗公转（轨道线条同步跟随） ---------- */
  var art = document.querySelector('.hero-art');
  if (art && !REDUCED && window.matchMedia('(pointer: fine)').matches) {
    var rot = 0;        // 当前角度（度）
    var target = 0;     // 目标角度（阻尼后）
    var raf = null;

    /** 缓动插值：逐渐逼近目标角度，收敛后停止，避免生硬跳动 */
    function orbitLoop() {
      raf = requestAnimationFrame(orbitLoop);
      rot += (target - rot) * 0.06;
      art.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      if (Math.abs(target - rot) < 0.05) {
        cancelAnimationFrame(raf);
        raf = null;
      }
    }

    // 鼠标相对实况窗中心的角度 → 乘阻尼系数作为公转目标角
    window.addEventListener('mousemove', function (e) {
      var r = art.getBoundingClientRect();
      var ang = Math.atan2(e.clientY - (r.top + r.height / 2),
                           e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
      target = ang * 0.3;             // 阻尼 0.3：最大约 ±54°，柔和跟随
      if (!raf) orbitLoop();
    });
  }

})();
