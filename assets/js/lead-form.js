(() => {
  const titles = {general:'Обсудим вашу задачу',partner:'Заявка на партнёрство',delivery:'Доставка и самовывоз',estimate:'Получить расчёт',installation:'Заказать монтаж',callback:'Заказать обратный звонок',order:'Обсудить заказ'};
  document.body.insertAdjacentHTML('beforeend', `<dialog class="modal lead-modal" id="lead-modal" aria-labelledby="lead-title" aria-describedby="lead-description"><div class="modal-inner"><div class="modal-head"><h2 id="lead-title">Обсудим вашу задачу</h2><button class="close-btn" type="button" data-close-lead aria-label="Закрыть форму">×</button></div><p id="lead-description">Оставьте контакты. Проект, чертёж или техническая документация помогут уточнить детали.</p><form id="lead-form" enctype="multipart/form-data"><input type="hidden" name="request_type"><input type="hidden" name="subject"><input type="hidden" name="context"><input type="hidden" name="page"><div class="form-grid"><label class="field"><span>Ваше имя *</span><input name="name" autocomplete="name" placeholder="Как к вам обращаться" maxlength="100" required></label><label class="field"><span>Номер телефона *</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (999) 000-00-00" maxlength="30" required></label><label class="field field-full"><span>Населённый пункт *</span><input name="locality" autocomplete="address-level2" placeholder="Город, посёлок или деревня" maxlength="180" required></label><label class="field partner-field" hidden><span>Тип деятельности *</span><select name="activity" disabled><option value="Строительная компания">Строительная компания</option><option value="Строительный рынок">Строительный рынок</option><option value="Частный монтажник">Частный монтажник</option><option value="Другое">Другое</option></select></label><label class="field partner-field" hidden><span>Планируемый объём</span><input name="volume" placeholder="Например, 100 свай в месяц" maxlength="100" disabled></label></div><div class="attachment-field"><label for="lead-files">Приложить документацию <span>необязательно</span></label><p id="attachment-help">Проект, чертежи, спецификация или фотографии. До 5 файлов, не более 20 МБ суммарно.</p><input id="lead-files" name="files" type="file" multiple aria-describedby="attachment-help attachment-error"><p class="attachment-error" id="attachment-error" role="alert"></p><ul class="attachment-list" id="attachment-list"></ul></div><p class="lead-service-note" id="lead-service-note">Отправка на сайте пока не подключена. Позвоните <a href="tel:+79263020007">+7 (926) 302-00-07</a> или отправьте документы на <a href="mailto:info@mnogosvay.ru">info@mnogosvay.ru</a>.</p><button class="btn lead-submit" type="submit">Проверить заявку <span class="arrow" aria-hidden="true">↗</span></button><p class="feedback" role="status" aria-live="polite"></p></form></div></dialog>`);
  const modal = document.getElementById('lead-modal');
  const form = document.getElementById('lead-form');
  const files = form.elements.files;
  const feedback = form.querySelector('.feedback');
  const endpoint = window.SVAI_LEAD_ENDPOINT;
  let opener;
  let sending = false;
  const submit = form.querySelector('[type="submit"]');
  if (endpoint) {
    submit.firstChild.textContent = 'Отправить заявку ';
    document.getElementById('lead-service-note').textContent = 'Используем указанные контакты для ответа на вашу заявку.';
  }
  function openLead(kind='general', options={}) {
    opener = options.opener || document.activeElement;
    document.querySelectorAll('dialog[open]').forEach(item => item.close());
    const partner = kind === 'partner';
    form.querySelectorAll('.partner-field').forEach(label => {
      label.hidden = !partner;
      label.querySelector('input,select').disabled = !partner;
    });
    form.elements.activity.required = partner;
    form.elements.activity.value = options.activity || 'Строительная компания';
    form.elements.request_type.value = kind;
    form.elements.page.value = location.pathname;
    form.elements.context.value = options.context || '';
    document.getElementById('lead-title').textContent = titles[kind] || titles.general;
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
    if (trigger.dataset.lead === 'order') context = document.getElementById('cart-content').innerText;
    openLead(trigger.dataset.lead, {opener:trigger,activity:trigger.dataset.activity,context});
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
  const validatePhone = () => {
    const input = form.elements.phone;
    const value = input.value.trim();
    const digits = value.replace(/\D/g, '');
    input.setCustomValidity(/^[+\d\s().-]+$/.test(value) && digits.length >= 10 && digits.length <= 15 ? '' : 'Введите номер телефона: от 10 до 15 цифр.');
  };
  form.elements.phone.addEventListener('input', validatePhone);
  ['name','locality'].forEach(name => form.elements[name].addEventListener('input', () => form.elements[name].setCustomValidity(form.elements[name].value.trim() ? '' : 'Заполните это поле.')));
  function validateFiles() {
    const selected = Array.from(files.files);
    const error = selected.length > 5 ? 'Можно приложить не более 5 файлов.' : selected.reduce((sum,file) => sum + file.size,0) > 20 * 1024 * 1024 ? 'Общий размер файлов превышает 20 МБ. Удалите лишние файлы.' : '';
    files.setCustomValidity(error);
    document.getElementById('attachment-error').textContent = error;
    return !error;
  }
  function renderFiles() {
    const list = document.getElementById('attachment-list');
    list.replaceChildren();
    Array.from(files.files).forEach((file,index) => {
      const row = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${file.name} · ${(file.size / 1024 / 1024).toLocaleString('ru-RU',{maximumFractionDigits:2})} МБ`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Удалить файл ${file.name}`);
      remove.addEventListener('click', () => {
        const transfer = new DataTransfer();
        Array.from(files.files).filter((_,i) => i !== index).forEach(item => transfer.items.add(item));
        files.files = transfer.files;
        renderFiles();
        files.focus();
      });
      row.append(name,remove);
      list.append(row);
    });
    validateFiles();
    feedback.textContent = '';
  }
  files.addEventListener('change',renderFiles);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    validatePhone();
    ['name','locality'].forEach(name => form.elements[name].setCustomValidity(form.elements[name].value.trim() ? '' : 'Заполните это поле.'));
    validateFiles();
    if (!form.reportValidity()) return;
    form.elements.subject.value = form.elements.request_type.value === 'partner' ? `Заявка на партнерство: ${form.elements.activity.value}` : titles[form.elements.request_type.value] || titles.general;
    if (!endpoint) {
      feedback.textContent = 'Поля заполнены корректно. Заявка и файлы не отправлены: отправка пока не подключена. Свяжитесь с нами по телефону или почте выше.';
      return;
    }
    sending = true;
    submit.disabled = true;
    feedback.textContent = 'Отправляем заявку…';
    try {
      const response = await fetch(endpoint,{method:'POST',body:new FormData(form),signal:AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error('Request failed');
      const metadata = Object.fromEntries(['request_type','subject','context','page'].map(name => [name,form.elements[name].value]));
      form.reset();
      Object.entries(metadata).forEach(([name,value]) => { form.elements[name].value = value; });
      renderFiles();
      feedback.textContent = 'Заявка отправлена. Мы свяжемся с вами по указанному телефону.';
    } catch {
      feedback.textContent = 'Не удалось отправить заявку. Данные сохранены в форме — попробуйте ещё раз или позвоните нам.';
    } finally {
      sending = false;
      submit.disabled = false;
    }
  });
})();
