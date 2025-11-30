/* --- 設定データ --- */
let currentSelectedDate = null;
// シフトデータを保持するオブジェクト (day -> shiftName)
let shiftData = {};
let targetYear = 0;
let targetMonth = 0;

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
});

function initCalendar() {
    const today = new Date();
    // 翌月の1日を計算
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    targetYear = nextMonthDate.getFullYear();
    targetMonth = nextMonthDate.getMonth() + 1;

    // タイトルの更新
    document.getElementById('shift-title').textContent = `${targetMonth}月のシフト希望`;
    document.getElementById('calendar-month-year').textContent = `${targetYear}年 ${targetMonth}月`;

    generateCalendarGrid(targetYear, targetMonth);
}

function generateCalendarGrid(year, month) {
    const gridElement = document.getElementById('calendar-grid');
    gridElement.innerHTML = "";

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        gridElement.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.id = `day-${day}`;
        
        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = day;

        const shiftLabel = document.createElement('div');
        shiftLabel.className = 'shift-label';
        shiftLabel.id = `shift-label-${day}`;
        shiftLabel.textContent = "-";

        cell.appendChild(dayNum);
        cell.appendChild(shiftLabel);

        // データ初期化
        shiftData[day] = null;

        cell.addEventListener('click', function() {
            openShiftModal(day);
        });

        gridElement.appendChild(cell);
    }
}

/* --- シフト選択モーダル --- */
function openShiftModal(day) {
    currentSelectedDate = day;
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-date-display');
    title.textContent = `${day}日のシフトを選択`;
    modal.style.display = 'flex';
}

function closeShiftModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    currentSelectedDate = null;
}

function selectShift(shiftName) {
    if (!currentSelectedDate) return;

    // 画面更新
    const cell = document.getElementById(`day-${currentSelectedDate}`);
    const label = document.getElementById(`shift-label-${currentSelectedDate}`);
    label.textContent = shiftName;
    cell.setAttribute('data-shift', shiftName);
    
    // データ保存
    shiftData[currentSelectedDate] = shiftName;

    closeShiftModal();
}

/* --- 確認画面モーダル関連 --- */

// 「入力内容を確認する」ボタンで呼ばれる
function showConfirmation() {
    // 1. 必須項目のチェック
    const name = document.getElementById('username').value.trim();
    const birth = document.getElementById('birthdate').value.trim();

    if (!name || !birth) {
        alert("氏名と誕生日は必須です。");
        return;
    }

    // 2. ユーザー情報の表示
    const email = document.getElementById('email').value.trim() || "(未入力)";
    const userInfoHtml = `
        <div class="confirm-info-row"><strong>氏名:</strong> ${name}</div>
        <div class="confirm-info-row"><strong>誕生日:</strong> ${birth}</div>
        <div class="confirm-info-row"><strong>Email:</strong> ${email}</div>
    `;
    document.getElementById('confirm-user-info').innerHTML = userInfoHtml;

    // 3. 確認用カレンダーの生成（メインカレンダーと同じロジックだが、イベントなし）
    const confirmGrid = document.getElementById('confirm-calendar-grid');
    confirmGrid.innerHTML = ""; // クリア

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const firstDayIndex = new Date(targetYear, targetMonth - 1, 1).getDay();

    // 空白セル
    for (let i = 0; i < firstDayIndex; i++) {
        confirmGrid.appendChild(document.createElement('div'));
    }

    // 日付セル
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell'; // スタイルはCSSで confirm-grid-style 内で調整
        
        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = day;

        const shiftLabel = document.createElement('div');
        shiftLabel.className = 'shift-label';
        
        // 保存されたシフトデータを適用
        const selectedShift = shiftData[day];
        if (selectedShift) {
            shiftLabel.textContent = selectedShift;
            cell.setAttribute('data-shift', selectedShift);
        } else {
            shiftLabel.textContent = "-";
        }

        cell.appendChild(dayNum);
        cell.appendChild(shiftLabel);

        // ※確認画面なのでクリックイベントは付与しない

        confirmGrid.appendChild(cell);
    }

    // 4. モーダルを表示
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

// 本当の送信処理（仮）
function submitData() {
    alert("送信しました！\n（実際にはここでメールアプリを起動したり、サーバーへ送信します）");
    closeConfirmModal();
}

/* --- モーダル外クリックで閉じる処理 --- */
window.onclick = function(event) {
    const shiftModal = document.getElementById('modal-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    
    if (event.target == shiftModal) {
        closeShiftModal();
    }
    if (event.target == confirmModal) {
        closeConfirmModal();
    }
}
