// ------------------------------------------
// 定数定義
// ------------------------------------------
const SHIFTS = {
    '早番': 'shift-早番',
    '早番6:30': 'shift-早番630',
    '中番': 'shift-中番',
    '遅番': 'shift-遅番',
    '遅番22:30': 'shift-遅番2230',
    '休み': 'shift-休み'
};

const SHIFT_NAMES = Object.keys(SHIFTS);
const modal = document.getElementById('shiftModal');
const closeBtn = document.querySelector('.close-btn');
const optionsContainer = document.getElementById('shiftOptionsContainer');
const titleElement = document.getElementById('modalDateTitle');

let currentCell = null; 

// ------------------------------------------
// タイトルとカレンダーの生成ロジック
// ------------------------------------------
function generateNextMonthCalendar() {
    const today = new Date();
    // 翌月の1日を取得
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const year = nextMonthDate.getFullYear();
    const month = nextMonthDate.getMonth(); 
    const monthName = (month + 1);
    // 翌月の日数を取得
    const lastDay = new Date(year, month + 1, 0).getDate();

    // 1. タイトルと見出しを更新
    const titleText = `${monthName}月のシフト希望`;
    document.getElementById('formTitle').textContent = titleText;
    document.getElementById('mainHeading').textContent = titleText;
    document.getElementById('currentMonth').textContent = `${year}年${monthName}月 (希望提出月)`;


    const calendarGrid = document.querySelector('.calendar-grid');
    // 曜日ラベルのDOMを取得して一旦保持
    const dayLabels = Array.from(calendarGrid.querySelectorAll('.day-label'));
    calendarGrid.innerHTML = '';
    // 保持した曜日ラベルを戻す
    dayLabels.forEach(label => calendarGrid.appendChild(label));

    // 1日の曜日を取得 (0=日, 6=土)
    const firstDayOfWeek = nextMonthDate.getDay();

    // 翌月1日の位置まで空セルを挿入
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('date-cell');
        emptyCell.setAttribute('data-date', ''); // 空セルであることを明示
        calendarGrid.appendChild(emptyCell);
    }

    // 翌月の日付セルを生成
    for (let i = 1; i <= lastDay; i++) {
        const dateStr = `${year}-${String(monthName).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dateCell = document.createElement('div');
        const dayOfWeek = new Date(year, month, i).getDay();

        dateCell.classList.add('date-cell');
        dateCell.setAttribute('data-date', dateStr);
        dateCell.setAttribute('data-shift-value', '');
        
        // 日付セルの日曜・土曜の色付けはCSSで行うため、クラスやスタイルはここでは不要

        dateCell.innerHTML = `
            <div class="date-number">${i}</div>
            <div class="shift-display empty-shift" id="shift-display-${dateStr}">未選択</div>
            <input type="hidden" name="shift_${dateStr.replace(/-/g, '_')}" id="input-${dateStr}" value="" required>
        `;
        // 日曜と土曜のセルの色を調整
        if (dayOfWeek === 0) {
            dateCell.style.color = 'red'; 
        } else if (dayOfWeek === 6) {
            dateCell.style.color = 'blue'; 
        }
        calendarGrid.appendChild(dateCell);
    }
}

// ------------------------------------------
// シフト選択ダイアログのロジック
// ------------------------------------------

// ダイアログ表示
function showShiftDialog(cell) {
    currentCell = cell;
    const date = cell.getAttribute('data-date');
    const dateParts = date.split('-');
    titleElement.textContent = `${dateParts[0]}年 ${dateParts[1]}月 ${dateParts[2]}日 のシフトを選択`;
    
    optionsContainer.innerHTML = ''; 

    // シフト選択ボタンを生成
    SHIFT_NAMES.forEach(shiftName => {
        const button = document.createElement('button');
        button.classList.add('shift-option-btn', SHIFTS[shiftName]);
        button.textContent = shiftName;
        button.setAttribute('data-shift', shiftName);
        button.type = 'button'; 
        button.addEventListener('click', selectShift);
        optionsContainer.appendChild(button);
    });

    modal.style.display = 'block';
}

// シフト選択処理
function selectShift(event) {
    const selectedShift = event.target.getAttribute('data-shift');
    const date = currentCell.getAttribute('data-date');
    
    const shiftDisplay = document.getElementById(`shift-display-${date}`);
    shiftDisplay.textContent = selectedShift;
    
    // 既存のシフトクラスを削除し、新しいクラスを適用（色分け）
    Object.values(SHIFTS).forEach(className => {
        shiftDisplay.classList.remove(className);
    });
    shiftDisplay.classList.remove('empty-shift');
    shiftDisplay.classList.add(SHIFTS[selectedShift]);
    
    // 隠しフィールドの値を更新
    const hiddenInput = document.getElementById(`input-${date}`);
    hiddenInput.value = selectedShift;
    
    // モーダルを閉じる
    modal.style.display = 'none';
    currentCell = null;
}

// ------------------------------------------
// イベントリスナーの設定
// ------------------------------------------
function setupShiftSelection() {
    // カレンダーの日付セルにイベントを設定
    document.querySelector('.calendar-grid').addEventListener('click', (e) => {
        let cell = e.target.closest('.date-cell');
        // 空セルを無視
        if (cell && cell.getAttribute('data-date') !== "") {
            showShiftDialog(cell);
        }
    });

    // モーダルを閉じる処理
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        currentCell = null;
    }

    // モーダル外クリックで閉じる
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            currentCell = null;
        }
    }
}

// フォーム送信時のチェック
document.getElementById('shiftForm').addEventListener('submit', function(e) {
    let allShiftsSelected = true;
    document.querySelectorAll('.calendar-container input[type="hidden"][required]').forEach(input => {
        if (input.value === "") {
            allShiftsSelected = false;
        }
    });

    if (!allShiftsSelected) {
        e.preventDefault();
        alert("?? 全ての日付のシフト選択が必要です。カレンダーを確認してください。");
        return;
    }
    
    // 実際には e.preventDefault() してAJAX送信処理に移ります
});

// ページロード時に実行
document.addEventListener('DOMContentLoaded', () => {
    generateNextMonthCalendar();
    setupShiftSelection();
});