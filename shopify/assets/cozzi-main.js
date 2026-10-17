// The Cozzi first scroll on Shopify: pack picker, sticky Add to cart and a bag drawer on the AJAX cart API.
(function () {
  var d = document, root = d.documentElement;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  var form = $('[data-product-form]'); if (!form) return;
  var cart = $('#cart'), scrim = $('.scrim'), list = $('.cart__items', cart), last = null;
  var money = function (cents) {
    return (cents / 100).toLocaleString(d.documentElement.lang || 'en-US', { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD' });
  };

  function syncPrice() {
    var v = $('input[name="id"]:checked', form);
    if (v) $$('[data-price]').forEach(function (el) { el.textContent = v.getAttribute('data-money'); });
  }

  function render(c) {
    var n = c.item_count, badge = $('.bag-count');
    if (badge) { badge.textContent = n; badge.hidden = !n; }
    list.innerHTML = '';
    c.items.forEach(function (it) {
      var li = d.createElement('li'); li.className = 'line';
      li.innerHTML = '<img src="' + (it.image ? it.image + '&width=128' : '') + '" width="64" height="64" alt="">' +
        '<div><div class="line__name"></div><div class="line__meta"></div>' +
        '<div class="qty"><button type="button" aria-label="One fewer" data-qty="' + (it.quantity - 1) + '">−</button>' +
        '<output aria-live="polite">' + it.quantity + '</output>' +
        '<button type="button" aria-label="One more" data-qty="' + (it.quantity + 1) + '">+</button></div></div>' +
        '<span class="line__price">' + money(it.final_line_price) + '</span>';
      $('.line__name', li).textContent = it.product_title;
      $('.line__meta', li).textContent = it.variant_title || '';
      $$('[data-qty]', li).forEach(function (b) { b.setAttribute('data-key', it.key); });
      list.appendChild(li);
    });
    $('[data-subtotal]', cart).textContent = money(c.total_price);
    $('.cart__empty', cart).hidden = !!n;
    $('.cart__foot', cart).hidden = !n;
  }

  function getCart() { return fetch('/cart.js', { headers: { Accept: 'application/json' } }).then(function (r) { return r.json(); }); }

  function open() {
    last = d.activeElement; cart.hidden = false; scrim.hidden = false; root.classList.add('lock');
    void cart.offsetWidth; cart.classList.add('is-open'); scrim.classList.add('is-open');
    $('.icon-btn', cart).focus();
  }
  function close() {
    cart.classList.remove('is-open'); scrim.classList.remove('is-open'); root.classList.remove('lock');
    setTimeout(function () { cart.hidden = true; scrim.hidden = true; }, 260);
    if (last && last.focus) last.focus();
  }

  function add() {
    var btn = $('.btn-add', form); btn.disabled = true;
    return fetch('/cart/add.js', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then(function (r) { if (!r.ok) throw r; return getCart(); })
      .then(function (c) { render(c); open(); })
      .catch(function () { form.submit(); })
      .finally(function () { btn.disabled = false; });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); add(); });
  form.addEventListener('change', syncPrice);
  $$('[data-add]').forEach(function (b) { b.addEventListener('click', add); });
  $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', function () { getCart().then(render).then(open); }); });
  $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', close); });
  list.addEventListener('click', function (e) {
    var t = e.target; if (!t.hasAttribute('data-key')) return;
    fetch('/cart/change.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: t.getAttribute('data-key'), quantity: +t.getAttribute('data-qty') }) })
      .then(function (r) { return r.json(); }).then(render);
  });
  d.addEventListener('keydown', function (e) { if (!cart.hidden && e.key === 'Escape') close(); });

  var sticky = $('.sticky-buy'), sBtn = sticky && $('button', sticky);
  if (sticky && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      var on = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      sticky.classList.toggle('is-on', on); sticky.setAttribute('aria-hidden', String(!on)); sBtn.tabIndex = on ? 0 : -1;
    }).observe($('.btn-add', form));
  }
  syncPrice();
})();
