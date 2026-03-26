const BANK = {
  accountNumber: '101601626628',
  bankName: 'VietinBank',
  accountName: 'NGUYEN VAN NGAN'
};

const STORAGE_KEY = 'donation_demo_history_v1';

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
const formattedAmount = document.getElementById('formattedAmount');
const toast = document.getElementById('toast');
const tableBody = document.querySelector('#donateTable tbody');
const lastUpdate = document.getElementById('lastUpdate');
const totalAmount = document.getElementById('totalAmount');
const totalCount = document.getElementById('totalCount');
const topDonor = document.getElementById('topDonor');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');


function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function clearHistory() {
  const confirmed = window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử trên máy này không?');
  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  showToast('Đã xóa lịch sử trên máy này.');
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

function renderHistory() {
  const history = readHistory().sort((a, b) => new Date(b.time) - new Date(a.time));
  tableBody.innerHTML = '';

  if (history.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4">Chưa có lịch sử trên máy này.</td></tr>';
    totalAmount.textContent = '0 VND';
    totalCount.textContent = '0';
    topDonor.textContent = '---';
    lastUpdate.textContent = 'Chưa có dữ liệu';
    return;
  }

  const total = history.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const latest = history[0];

  animateValue(totalAmount, total, ' VND');
  totalCount.textContent = String(history.length);
  topDonor.textContent = latest.name ? `${latest.name} (${formatMoney(latest.amount)})` : formatMoney(latest.amount);
  lastUpdate.textContent = 'Cập nhật: ' + new Date().toLocaleString('vi-VN');

  history.slice(0, 10).forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(item.time).toLocaleString('vi-VN')}</td>
      <td>${escapeHtml(item.name || 'Ẩn danh')}</td>
      <td>${formatMoney(item.amount)}</td>
      <td>${escapeHtml(item.info)}</td>
    `;
    tableBody.appendChild(row);
  });
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
    alert('Vui lòng nhập nội dung chuyển khoản không dấu.');
    return null;
  }

  return typedInfo;
}

function createQr(amount, defaultInfo) {
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

  const history = readHistory();
  history.push({
    time: new Date().toISOString(),
    name,
    amount: safeAmount,
    info
  });
  saveHistory(history);
  renderHistory();
  openPopup(qrLink, name, safeAmount, info);
}

function handleCustomDonate() {
  createQr(customAmountInput.value, 'ung ho Nguyen Van Ngan');
}

function updateFormattedAmount() {
  const value = customAmountInput.value;
  formattedAmount.textContent = value ? formatMoney(value) : '';
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
  clearHistoryBtn.addEventListener('click', clearHistory);
  overlay.addEventListener('click', closePopup);

  customAmountInput.addEventListener('input', () => {
    amountButtons.forEach((item) => item.classList.remove('active'));
    updateFormattedAmount();
  });
}


registerEvents();
renderHistory();
