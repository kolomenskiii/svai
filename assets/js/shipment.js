(() => {
  const form = document.getElementById('delivery-calculator');
  const distance = document.getElementById('delivery-distance');
  const total = document.getElementById('delivery-total');
  function update() {
    const region = form.elements.zone.value === 'region';
    distance.disabled = !region;
    document.getElementById('delivery-distance-field').hidden = !region;
    const valid = !region || distance.checkValidity();
    total.textContent = valid ? new Intl.NumberFormat('ru-RU').format(3000 + (region ? Number(distance.value) * 100 : 0)) + ' ₽' : 'Укажите расстояние';
  }
  form.addEventListener('input',update);
  form.addEventListener('submit',event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const context = form.elements.zone.value === 'region' ? `Московская область, ${distance.value} км от МКАД. Предварительно: ${total.textContent}` : 'Москва. Предварительно: 3 000 ₽';
    window.openSvaiLead('delivery',{context,opener:form.querySelector('[type="submit"]')});
  });
  document.querySelectorAll('.warehouse-card').forEach(card => card.addEventListener('click', event => {
    if (event.target.closest('a, button')) return;
    card.querySelector('[data-warehouse]').click();
  }));
  document.querySelectorAll('[data-warehouse]').forEach(button => button.addEventListener('click', () => {
    const {warehouseName: name,warehouseAddress: address,warehouseLon: lon,warehouseLat: lat} = button.dataset;
    if (!name || !address || !lon || !lat) return;
    document.querySelectorAll('[data-warehouse]').forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-pressed',String(selected));
      item.querySelector('.warehouse-select-label').textContent = selected ? 'Выбран на карте' : 'Показать на карте';
      item.closest('.warehouse-card').classList.toggle('is-selected',selected);
    });
    document.getElementById('warehouse-current-name').textContent = name;
    document.getElementById('warehouse-current-address').textContent = address;
    const map = document.getElementById('warehouse-map');
    map.title = `Склад — ${name}`;
    map.src = `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=16&pt=${lon}%2C${lat}%2Cpm2gnm&l=map`;
    const mapLink = document.getElementById('warehouse-map-link');
    mapLink.href = `https://yandex.ru/maps/?ll=${lon}%2C${lat}&z=16&pt=${lon}%2C${lat}%2Cpm2gnm&l=map`;
    mapLink.querySelector('.warehouse-map-link-label').textContent = `Открыть ${name} на Яндекс Картах`;
  }));
  update();
})();
