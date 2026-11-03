document.querySelectorAll('.install-calc').forEach(calc => {
  const get = name => calc.querySelector(`[data-calc="${name}"]`);
  const controls = {
    mode: calc.querySelectorAll('[data-mode]'), object: get('object'),
    length: get('length'), width: get('width'), step: get('step'),
    count: get('count'), manualDiameter: get('manual-diameter'), pileLength: get('pile-length'),
    binding: get('binding'), meters: get('meters')
  };
  const rates = {1.5:1300, 2:1400, 2.5:1600, 3:1800, 3.5:2000, 4:2200};
  const format = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  let mode = 'object';
  let lastObject = controls.object.value;

  function update() {
    const preset = controls.object.selectedOptions[0];
    if (mode === 'object' && controls.object.value !== lastObject) {
      controls.step.value = preset.dataset.step;
      lastObject = controls.object.value;
    }
    const length = Number(controls.length.value);
    const width = Number(controls.width.value);
    const step = Number(controls.step.value);
    const count = mode === 'object'
      ? (length > 0 && width > 0 && step > 0 ? 2 * Math.ceil(length / step) + 2 * Math.ceil(width / step) : 0)
      : Math.floor(Number(controls.count.value));
    const pileLength = Number(controls.pileLength.value);
    const diameter = mode === 'object' ? Number(preset.dataset.diameter) : Number(controls.manualDiameter.value);
    const pricedProducts = (window.svaiProducts || []).filter(item => Number.isFinite(item.price));
    const product = pricedProducts.find(item => item.dia === diameter && item.length === pileLength * 1000);
    const nearest = product || pricedProducts.slice().sort((a, b) =>
      Math.abs(a.dia - diameter) - Math.abs(b.dia - diameter) ||
      Math.abs(a.length - pileLength * 1000) - Math.abs(b.length - pileLength * 1000)
    )[0];
    const pilePrice = nearest ? nearest.price : null;
    const estimatedPilePrice = !product && !!nearest;
    const bindingRate = Number(controls.binding.value);
    const meters = Number(controls.meters.value);
    const dimensionsValid = mode === 'manual' || (length >= 0.5 && length <= 100 && width >= 0.5 && width <= 100 && step >= 0.5 && step <= 6);
    const valid = dimensionsValid && Number.isFinite(count) && count >= 1 && count <= 9999 && Number.isFinite(meters) && meters >= 0 && meters <= 10000 && (!bindingRate || meters > 0);
    const installation = valid ? count * rates[pileLength] : 0;
    const binding = valid ? bindingRate * meters : 0;
    const knownCost = installation + binding;
    const total = knownCost + (pilePrice === null ? 0 : count * pilePrice);
    const warning = get('warning');
    const action = get('action');

    get('quantity').textContent = valid ? `${count} шт.` : '—';
    get('pile-quantity').textContent = valid ? `${count} шт.` : '—';
    get('pile-label').textContent = `Сваи Ø${diameter} мм, ${String(pileLength).replace('.', ',')} м`;
    get('pile-total').textContent = valid ? (pilePrice === null ? 'По запросу' : `${estimatedPilePrice ? '≈ ' : ''}${format(count * pilePrice)}`) : '—';
    get('install-total').textContent = valid ? format(installation) : '—';
    get('binding-row').hidden = !bindingRate;
    get('binding-quantity').textContent = `${meters || 0} м`;
    get('binding-total').textContent = valid ? format(binding) : '—';
    get('total-label').textContent = pilePrice === null ? 'Известная часть сметы' : 'Итого без доставки';
    get('total').textContent = valid ? (pilePrice === null ? `${format(knownCost)} + сваи по запросу` : `${estimatedPilePrice ? '≈ ' : ''}${format(total)}`) : '—';
    get('total').classList.toggle('is-partial', pilePrice === null);
    get('price-note').hidden = !estimatedPilePrice;
    get('price-note').textContent = estimatedPilePrice ? `Для этого размера нет отдельной цены. Взят ориентир по свае Ø${nearest.dia} × ${String(nearest.length / 1000).replace('.', ',')} м — ${format(nearest.price)}/шт. Точную цену подтвердим при заказе.` : '';
    get('per-pile').textContent = valid && count ? `Монтаж одной сваи — ${format(rates[pileLength])}` : '';
    get('diameter').textContent = mode === 'object' ? `Рекомендуемый диаметр — Ø${diameter} мм. Уточним по проекту и грунту.` : 'Диаметр и длину свай уточним по проекту и грунту.';
    warning.hidden = valid && count >= 10;
    warning.textContent = valid ? 'Для выезда техники требуется минимум 10 свай.' : 'Укажите корректные размеры, количество свай и метраж обвязки.';
    action.setAttribute('aria-disabled', String(!valid || count < 10));
    action.tabIndex = valid && count >= 10 ? 0 : -1;
    controls.meters.disabled = !bindingRate;
  }

  controls.mode.forEach(button => button.addEventListener('click', () => {
    mode = button.dataset.mode;
    controls.mode.forEach(item => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    get('object-fields').hidden = mode !== 'object';
    get('manual-fields').hidden = mode !== 'manual';
    update();
  }));
  calc.querySelectorAll('input,select').forEach(input => input.addEventListener('input', update));
  if (document.createElement) {
    calc.querySelectorAll('.install-field select').forEach((select, index) => {
      const host = document.createElement('div');
      const trigger = document.createElement('button');
      const list = document.createElement('ul');
      const label = select.closest('.install-field').querySelector('span').textContent;
      const options = Array.from(select.options);
      const items = options.map(option => {
        const item = document.createElement('li');
        item.setAttribute('role', 'option');
        item.tabIndex = -1;
        item.textContent = option.textContent;
        item.addEventListener('click', () => {
          select.value = option.value;
          select.dispatchEvent(new Event('input', {bubbles: true}));
          close();
          trigger.focus();
        });
        list.append(item);
        return item;
      });
      host.className = 'install-dropdown';
      trigger.className = 'install-dropdown-trigger';
      trigger.type = 'button';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', label);
      list.className = 'install-dropdown-list';
      list.id = `install-dropdown-${index}`;
      list.setAttribute('role', 'listbox');
      list.hidden = true;
      trigger.setAttribute('aria-controls', list.id);
      host.append(trigger, list);
      select.after(host);
      select.hidden = true;

      function sync() {
        const selected = select.selectedIndex;
        trigger.textContent = options[selected]?.textContent || '';
        trigger.setAttribute('aria-label', `${label}: ${trigger.textContent}`);
        items.forEach((item, i) => item.setAttribute('aria-selected', String(i === selected)));
      }
      function close() {
        list.hidden = true;
        host.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      function open(focusIndex = select.selectedIndex) {
        list.hidden = false;
        host.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        items[Math.max(0, focusIndex)]?.focus();
      }
      trigger.addEventListener('click', () => list.hidden ? open() : close());
      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          open(event.key === 'ArrowUp' ? items.length - 1 : select.selectedIndex);
        }
      });
      list.addEventListener('keydown', event => {
        const current = items.indexOf(document.activeElement);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items[next].focus();
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          items[Math.max(0, current)].click();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          close();
          trigger.focus();
        } else if (event.key === 'Tab') close();
      });
      document.addEventListener('click', event => { if (!host.contains(event.target)) close(); });
      controls.mode.forEach(button => button.addEventListener('click', close));
      select.addEventListener('input', sync);
      sync();
    });
  }
  get('action').addEventListener('click', event => {
    if (get('action').getAttribute('aria-disabled') === 'true') event.preventDefault();
  });
  update();
});
