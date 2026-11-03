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
  document.querySelectorAll('[data-warehouse]').forEach(button => button.addEventListener('click', () => {
    const warehouse = warehouses.find(item => item.id === button.dataset.warehouse);
    if (!warehouse) return;
    document.querySelectorAll('[data-warehouse]').forEach(item => {
      const selected = item === button;
      item.setAttribute('aria-pressed',String(selected));
      item.firstChild.textContent = selected ? 'Выбран на карте ' : 'Показать на карте ';
      item.closest('.warehouse-card').classList.toggle('is-selected',selected);
    });
    document.getElementById('warehouse-current-name').textContent = warehouse.name;
    document.getElementById('warehouse-current-address').textContent = warehouse.address;
    const map = document.getElementById('warehouse-map');
    map.title = `Склад — ${warehouse.name}`;
    map.src = `https://yandex.ru/map-widget/v1/?ll=${warehouse.lon}%2C${warehouse.lat}&z=16&pt=${warehouse.lon}%2C${warehouse.lat}%2Cpm2gnm&l=map`;
    const mapLink = document.getElementById('warehouse-map-link');
    mapLink.href = `https://yandex.ru/maps/?ll=${warehouse.lon}%2C${warehouse.lat}&z=16&pt=${warehouse.lon}%2C${warehouse.lat}%2Cpm2gnm&l=map`;
    mapLink.innerHTML = `Открыть ${warehouse.name} на Яндекс Картах <span class="arrow" aria-hidden="true">↗</span>`;
  }));
  update();
})();
