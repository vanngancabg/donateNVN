const BANK = {
  accountNumber: '101601626628',
  bankName: 'VietinBank',
  accountName: 'NGUYEN VAN NGAN'
};

const SUPABASE_URL = 'https://mjtfqvmnyhfdgydnvlti.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7-3VYFlyYd45ii43R0bi7A_5UEDnR20';
const DONATION_TABLE = 'donation_logs';

const popup = document.getElementById('popup');
const overlay = document.getElementById('overlay');
const qrImage = document.getElementById('qrImage');
const qrDownload = document.getElementById('qrDownload');
const popupDonorName = document.getElementById('popupDonorName');
const popupAmount = document.getElementById('popupAmount');
const popupInfo = document.getElementById('popupInfo');
const customAmountInput = document.getElementById('customAmount');
const customNameInput = document.getElementById('customName');
const customInfoInput = document.getElementById('customInfo');
const customDonateBtn = document.getElementById('customDonateBtn');
const formattedAmount = document.getElementById('formattedAmount');
const toast = document.getElementById('toast');
const tableBody = document.querySelector('#donateTable tbody');
const lastUpdate = document.getElementById('lastUpdate');
const totalAmount = document.getElementById('totalAmount');
const totalCount = document.getElementById('totalCount');
const topDonor = document.getElementById('topDonor');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');


async function fetchHistory() {
  const url = `${SUPABASE_URL}/rest/v1/${DONATION_TABLE}?select=id,created_at,name,amount,info&order=created_at.desc&limit=50`;

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error('Không tải được lịch sử dùng chung.');
  }

  return response.json();
}

async function insertHistory(entry) {
  const url = `${SUPABASE_URL}/rest/v1/${DONATION_TABLE}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      Prefer: 'return=representation'
    },
    body: JSON.stringify([entry])
  });

  if (!response.ok) {
    throw new Error('Không lưu được dữ liệu lên server.');
  }

  const rows = await response.json();
  return rows[0];
}


function formatMoney(amount) {
  return Number(amount).toLocaleString('vi-VN') + ' VND';
}


function animateValue(element, endValue, suffix = '') {
  const safeEnd = Number(endValue) || 0;
  const duration = 700;
  const startTime = performance.now();

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.floor(progress * safeEnd);
    element.textContent = value.toLocaleString('vi-VN') + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = safeEnd.toLocaleString('vi-VN') + suffix;
    }
  }

  requestAnimationFrame(update);
}

async function renderHistory() {
  tableBody.innerHTML = '<tr><td colspan="4">Đang tải dữ liệu...</td></tr>';

  try {
    const history = await fetchHistory();
    tableBody.innerHTML = '';

    if (!history.length) {
      tableBody.innerHTML = '<tr><td colspan="4">Chưa có dữ liệu dùng chung.</td></tr>';
      totalAmount.textContent = '0 VND';
      totalCount.textContent = '0';
      topDonor.textContent = 'Chưa có dữ liệu';
      lastUpdate.textContent = 'Chưa có dữ liệu';
      return;
    }

    const total = history.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const latest = history[0];

    animateValue(totalAmount, total, ' VND');
    totalCount.textContent = String(history.length);
    topDonor.textContent = latest.name
      ? `${latest.name} (${formatMoney(latest.amount)})`
      : formatMoney(latest.amount);

    lastUpdate.textContent = 'Cập nhật: ' + new Date().toLocaleString('vi-VN');

    history.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(item.created_at).toLocaleString('vi-VN')}</td>
        <td>${escapeHtml(item.name || 'Ẩn danh')}</td>
        <td>${formatMoney(item.amount)}</td>
        <td>${escapeHtml(item.info)}</td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    tableBody.innerHTML = '<tr><td colspan="4">Không tải được dữ liệu dùng chung.</td></tr>';
    totalAmount.textContent = '0 VND';
    totalCount.textContent = '0';
    topDonor.textContent = 'Lỗi tải dữ liệu';
    lastUpdate.textContent = 'Không thể kết nối server';
    showToast('Không tải được dữ liệu dùng chung.');
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function openPopup(qrLink, donorName, amount, info) {
  qrImage.src = qrLink;
  qrDownload.href = qrLink;
  popupDonorName.textContent = donorName;
  popupAmount.textContent = formatMoney(amount);
  popupInfo.textContent = info;
  popup.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closePopup() {
  popup.classList.add('hidden');
  overlay.classList.add('hidden');
  qrImage.src = '';
  qrDownload.href = '#';
  popupDonorName.textContent = '---';
  popupAmount.textContent = '---';
  popupInfo.textContent = '---';
}

function buildTransferInfo(defaultInfo) {
  const typedInfo = customInfoInput.value.trim();
  if (!typedInfo) {
    return defaultInfo;
  }

  const hasVietnameseMarks = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(typedInfo);
  if (hasVietnameseMarks) {
  alert('Nội dung chuyển khoản không được có dấu tiếng Việt. Ví dụ đúng: ung ho Nguyen Van Ngan');
  return null;
}

  return typedInfo;
}

async function createQr(amount, defaultInfo) {
  const safeAmount = Number(amount);
  const name = customNameInput.value.trim() || 'Ẩn danh';
  const info = buildTransferInfo(defaultInfo);

  if (!info) {
    return;
  }

  if (!safeAmount || safeAmount < 10000) {
    alert('Số tiền tối thiểu là 10,000 VND.');
    return;
  }

  const qrLink = `https://img.vietqr.io/image/${BANK.bankName}-${BANK.accountNumber}-compact2.jpg?amount=${safeAmount}&addInfo=${encodeURIComponent(info)}&accountName=${encodeURIComponent(BANK.accountName)}`;

  try {
    await insertHistory({
      name,
      amount: safeAmount,
      info
    });

    await renderHistory();
    openPopup(qrLink, name, safeAmount, info);
  } catch (error) {
    showToast('Không lưu được dữ liệu dùng chung.');
    openPopup(qrLink, name, safeAmount, info);
  }
}


function handleCustomDonate() {
  createQr(customAmountInput.value, 'ung ho Nguyen Van Ngan');
}

function updateDonateButtonState() {
  const amount = Number(customAmountInput.value);
  const isValid = amount >= 10000;

  customDonateBtn.disabled = !isValid;
  customDonateBtn.classList.toggle('disabled', !isValid);
}


function updateFormattedAmount() {
  const value = customAmountInput.value;
  formattedAmount.textContent = value ? formatMoney(value) : '';
  updateDonateButtonState();
}

async function copyAccountNumber() {
  try {
    await navigator.clipboard.writeText(BANK.accountNumber);
    showToast('Đã copy số tài khoản!');
  } catch (error) {
    showToast('Không copy tự động được. Hãy copy thủ công nhé.');
  }
}

function registerEvents() {
  const amountButtons = document.querySelectorAll('.donate-buttons button');

  amountButtons.forEach((button) => {
    button.addEventListener('click', () => {
      amountButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');

      customAmountInput.value = button.dataset.amount;
      updateFormattedAmount();
      customAmountInput.focus();
    });
  });

  document.getElementById('customDonateBtn').addEventListener('click', handleCustomDonate);
  document.getElementById('copyAccountBtn').addEventListener('click', copyAccountNumber);
  document.getElementById('closePopupBtn').addEventListener('click', closePopup);
  refreshHistoryBtn.addEventListener('click', renderHistory);
  overlay.addEventListener('click', closePopup);

  customAmountInput.addEventListener('input', () => {
    amountButtons.forEach((item) => item.classList.remove('active'));
    updateFormattedAmount();
  });

  customInfoInput.addEventListener('input', updateDonateButtonState);
  customNameInput.addEventListener('input', updateDonateButtonState);
}

registerEvents();
renderHistory();
updateFormattedAmount();
updateDonateButtonState();
