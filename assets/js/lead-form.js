(() => {
  const titles = {
    general: 'Обсудим вашу задачу', partner: 'Заявка на партнёрство',
    delivery: 'Доставка и самовывоз', estimate: 'Получить расчёт',
    installation: 'Заказать монтаж', callback: 'Заказать обратный звонок',
    order: 'Обсудить заказ'
  };

  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="modal lead-modal" id="lead-modal" aria-labelledby="lead-title" aria-describedby="lead-description">
      <div class="modal-inner">
        <div class="modal-head">
          <h2 id="lead-title">Обсудим вашу задачу</h2>
          <button class="close-btn" type="button" data-close-lead aria-label="Закрыть форму">×</button>
        </div>
        <p id="lead-description">Укажите контакты, чтобы подготовить письмо.</p>
        <form id="lead-form">
          <div class="form-grid">
            <label class="field"><span>Ваше имя *</span><input name="name" autocomplete="name" placeholder="Как к вам обращаться" maxlength="100" required></label>
            <label class="field"><span>Номер телефона *</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (999) 000-00-00" maxlength="30" required></label>
            <label class="field field-full" id="lead-locality-field"><span>Населённый пункт *</span><input name="locality" autocomplete="address-level2" placeholder="Город, посёлок или деревня" maxlength="180" required></label>
          </div>
          <p class="lead-service-note">Откроется письмо в вашем почтовом приложении. Проверьте его и отправьте вручную. Можно также позвонить: <a href="tel:+79263020007">+7 (926) 302-00-07</a>.</p>
          <button class="btn lead-submit" type="submit">Открыть почту <span class="arrow" aria-hidden="true">↗</span></button>
          <p class="feedback" role="status" aria-live="polite"></p>
        </form>
      </div>
    </dialog>`);

  const modal = document.getElementById('lead-modal');
  const form = document.getElementById('lead-form');
  const localityField = document.getElementById('lead-locality-field');
  const feedback = form.querySelector('.feedback');
  let opener;
  let request = {};

  function openLead(kind = 'general', options = {}) {
    opener = options.opener || document.activeElement;
    document.querySelectorAll('dialog[open]').forEach(item => item.close());
    request = {kind, activity: options.activity || '', context: options.context || ''};
    const partner = kind === 'partner';
    localityField.hidden = partner;
    form.elements.locality.disabled = partner;
    form.elements.locality.required = !partner;
    document.getElementById('lead-title').textContent = titles[kind] || titles.general;
    document.getElementById('lead-description').textContent = partner
      ? 'Оставьте имя и номер телефона, чтобы обсудить сотрудничество.'
      : 'Укажите контакты, чтобы подготовить письмо.';
    feedback.textContent = '';
    modal.showModal();
    document.documentElement.classList.add('has-lead-modal');
    form.elements.name.focus();
  }

  window.openSvaiLead = openLead;
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-lead]');
    if (!trigger || trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return;
    event.preventDefault();
    let context = '';
    if (trigger.dataset.lead === 'installation') context = trigger.closest('.install-summary')?.innerText || '';
    if (trigger.dataset.lead === 'order') context = document.getElementById('cart-content')?.innerText || '';
    openLead(trigger.dataset.lead, {opener: trigger, activity: trigger.dataset.activity, context});
  });

  modal.querySelector('[data-close-lead]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', event => {
    const bounds = modal.getBoundingClientRect();
    if (event.target === modal && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) modal.close();
  });
  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('has-lead-modal');
    if (opener?.isConnected && !opener.closest('dialog:not([open])')) opener.focus();
    else document.getElementById('cart-open')?.focus();
  });

  form.elements.phone.addEventListener('input', () => form.elements.phone.setCustomValidity(''));
  form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
  form.elements.locality.addEventListener('input', () => form.elements.locality.setCustomValidity(''));
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = form.elements.name.value.trim();
    const phone = form.elements.phone.value.trim();
    const digits = phone.replace(/\D/g, '');
    form.elements.name.setCustomValidity(name ? '' : 'Укажите ваше имя.');
    form.elements.phone.setCustomValidity(/^[+\d\s().-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15 ? '' : 'Введите номер телефона: от 10 до 15 цифр.');
    if (!form.elements.locality.disabled) form.elements.locality.setCustomValidity(form.elements.locality.value.trim() ? '' : 'Укажите населённый пункт.');
    if (!form.reportValidity()) return;

    const subject = request.kind === 'partner'
      ? `Заявка на партнёрство${request.activity ? `: ${request.activity}` : ''}`
      : titles[request.kind] || titles.general;
    const lines = [`Имя: ${name}`, `Телефон: ${phone}`];
    if (!form.elements.locality.disabled) lines.push(`Населённый пункт: ${form.elements.locality.value.trim()}`);
    if (request.context) lines.push('', `Детали: ${request.context}`);
    lines.push('', `Страница: ${location.href}`);
    const mailto = `mailto:info@mnogosvay.ru?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    feedback.textContent = 'Откройте почтовое приложение и отправьте подготовленное письмо.';
    window.location.href = mailto;
  });
})();
