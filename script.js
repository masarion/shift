/* --- 設定データ --- */
// 選択中の日付を一時保存する変数
let currentSelectedDate = null;

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
});

function initCalendar() {
    const today = new Date();
    // 翌月の1日を計算
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    const year = nextMonthDate.getFullYear();
    const month = nextMonthDate.getMonth() + 1; // 表示用(1-12)

    // タイトルの更新
    document.getElementById('shift-title').textContent = `${month}月のシフト希望`;
    document.getElementById('calendar-month-year').textContent = `${year}年 ${month}月`;

    generateCalendarGrid(year, month);
}

function generateCalendarGrid(year, month) {
    const gridElement = document.getElementById('calendar-grid');
    gridElement.innerHTML = ""; // リセット

    // その月の日数（0を指定すると前月の最終日＝今月の末日が得られるテクニック）
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // その月の1日の曜日 (0:日, 1:月 ... 6:土)
    // monthは0始まりのDateオブジェクト用に -1 する
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    // 1日の前の空白セルを埋める
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyCell = document.createElement('div');
        // 枠線だけあってもいいが、今回は空白のまま
        gridElement.appendChild(emptyCell);
    }

    // 日付セルを生成
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        cell.id = `day-${day}`; // 後で特定できるようにIDを付与
        
        // 日付数字
        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = day;

        // シフト表示部分（最初は空）
        const shiftLabel = document.createElement('div');
        shiftLabel.className = 'shift-label';
        shiftLabel.id = `shift-label-${day}`;
        shiftLabel.textContent = "-"; // 未選択状態

        cell.appendChild(dayNum);
        cell.appendChild(shiftLabel);

        // タップ時のイベント
        cell.addEventListener('click', function() {
            openModal(day);
        });

        gridElement.appendChild(cell);
    }
}

/* --- モーダル操作 --- */
function openModal(day) {
    currentSelectedDate = day;
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-date-display');
    
    title.textContent = `${day}日のシフトを選択`;
    modal.style.display = 'flex'; // 表示
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    modal.style.display = 'none'; // 非表示
    currentSelectedDate = null;
}

/* --- シフト選択処理 --- */
function selectShift(shiftName) {
    if (!currentSelectedDate) return;

    // カレンダーのセルを更新
    const cell = document.getElementById(`day-${currentSelectedDate}`);
    const label = document.getElementById(`shift-label-${currentSelectedDate}`);

    // テキスト更新
    label.textContent = shiftName;
    
    // 色属性を更新（CSSで色が変わる）
    cell.setAttribute('data-shift', shiftName);

    // モーダルを閉じる
    closeModal();
}

// モーダルの背景をクリックしたら閉じる便利機能
document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});
