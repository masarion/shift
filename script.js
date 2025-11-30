/* --- 設定データ --- */
// ★ここにGASのウェブアプリURLを貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/AKfycbwbDIeOK_2s6U6iU3ePL13kQ-ajhbfUf4E7kVUMj1h4g-pd2hswhW43j_mHkEP0va5u/exec"; 

let currentSelectedDate = null;
let shiftData = {}; 
let targetYear = 0;
let targetMonth = 0;

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
    checkSubmissionStatus(); 
});

function initCalendar() {
    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    targetYear = nextMonthDate.getFullYear();
    targetMonth = nextMonthDate.getMonth() + 1;

    document.getElementById('shift-title').textContent = `${targetMonth}月のシフト希望`;
    document.getElementById('calendar-month-year').textContent = `${targetYear}年 ${targetMonth}月`;

    generateCalendarGrid(targetYear, targetMonth);
}

function checkSubmissionStatus() {
    const savedMonth = localStorage.getItem('lastSubmissionMonth');
    const currentTarget = `${targetYear}-${targetMonth}`;

    if (savedMonth === currentTarget) {
        alert("今月のシフトは既に提出済みです。修正が必要な場合は店長へ連絡してください。");
        disableForm();
    }
}

function disableForm() {
    const inputs = document.querySelectorAll('input, button, textarea');
    inputs.forEach(input => input.disabled = true);
    
    const grid = document.getElementById('calendar-grid');
    grid.style.pointerEvents = 'none';
    grid.style.opacity = '0.6';
    
    document.querySelector('.submit-btn').textContent = "提出済み";
    document.querySelector('.submit-btn').style.background = "#999";
}

function generateCalendarGrid(year, month) {
    const gridElement = document.getElementById('calendar-grid');
    gridElement.innerHTML = "";

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    for (let i = 0; i < firstDayIndex; i++) {
        gridElement.appendChild(document.createElement('div'));
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

    const cell = document.getElementById(`day-${currentSelectedDate}`);
    const label = document.getElementById(`shift-label-${currentSelectedDate}`);
    label.textContent = shiftName;
    cell.setAttribute('data-shift', shiftName);
    
    shiftData[currentSelectedDate] = shiftName;

    closeShiftModal();
}

/* --- 確認画面と送信処理 --- */
function showConfirmation() {
    const name = document.getElementById('username').value.trim();
    const birth = document.getElementById('birthdate').value.trim();
    const notes = document.getElementById('notes').value.trim();

    if (!name || !birth) {
        alert("氏名と誕生日は必須です。");
        return;
    }
    
    // ★★★ 修正・追加箇所：全日シフト選択チェック ★★★
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    let allDaysSelected = true;
    for (let day = 1; day <= daysInMonth; day++) {
        // shiftData[day]がnullの場合、未選択と判断
        if (shiftData[day] === null) {
            allDaysSelected = false;
            break; 
        }
    }
    
    if (!allDaysSelected) {
        alert("すべての日付のシフト（早番、休みなど）を選択してください。未選択の日があります。");
        return; // 未選択があればここで処理を中断
    }
    // ★★★ 修正・追加箇所 ここまで ★★★

    // ユーザー情報の表示
    const email = document.getElementById('email').value.trim() || "(未入力)";
    const userInfoHtml = `
        <div class="confirm-info-row"><strong>氏名:</strong> ${name}</div>
        <div class="confirm-info-row"><strong>誕生日:</strong> ${birth}</div>
        <div class="confirm-info-row"><strong>Email:</strong> ${email}</div>
    `;
    document.getElementById('confirm-user-info').innerHTML = userInfoHtml;
    
    // 連絡事項の表示
    const notesInfoHtml = `
        <strong>連絡事項・特記事項</strong>
        ${notes || "(入力なし)"}
    `;
    document.getElementById('confirm-notes-info').innerHTML = notesInfoHtml;

    // 確認用カレンダーの生成
    const confirmGrid = document.getElementById('confirm-calendar-grid');
    confirmGrid.innerHTML = "";

    const firstDayIndex = new Date(targetYear, targetMonth - 1, 1).getDay();

    for (let i = 0; i < firstDayIndex; i++) {
        confirmGrid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        
        const dayNum = document.createElement('div');
        dayNum.className = 'day-number';
        dayNum.textContent = day;

        const shiftLabel = document.createElement('div');
        shiftLabel.className = 'shift-label';
        
        const selectedShift = shiftData[day];
        // 全日選択チェックで通過しているため、selectedShiftは必ず値を持つ
        shiftLabel.textContent = selectedShift;
        cell.setAttribute('data-shift', selectedShift);

        cell.appendChild(dayNum);
        cell.appendChild(shiftLabel);
        confirmGrid.appendChild(cell);
    }
    
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

function submitData() {
    const submitBtn = document.querySelector('.action-btn.btn-primary');
    submitBtn.textContent = "送信中...";
    submitBtn.disabled = true;

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const shiftArray = [];
    for (let day = 1; day <= daysInMonth; day++) {
        // 全日チェックを通過しているので、ここでは必ず値が入る (null以外)
        shiftArray.push(shiftData[day] || "-"); 
    }

    const postData = {
        name: document.getElementById('username').value.trim(),
        birth: document.getElementById('birthdate').value.trim(),
        email: document.getElementById('email').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        
        year: targetYear,
        month: targetMonth,
        shifts: shiftArray 
    };

    fetch(GAS_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: JSON.stringify(postData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            alert("送信が完了しました！");
            
            const currentTarget = `${targetYear}-${targetMonth}`;
            localStorage.setItem('lastSubmissionMonth', currentTarget);
            
            closeConfirmModal();
            disableForm();
        } else {
            alert("送信に失敗しました: " + data.error);
            submitBtn.textContent = "送信する";
            submitBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert("通信エラーが発生しました。");
        submitBtn.textContent = "送信する";
        submitBtn.disabled = false;
    });
}

window.onclick = function(event) {
    const shiftModal = document.getElementById('modal-overlay');
    const confirmModal = document.getElementById('confirm-modal');
    if (event.target == shiftModal) closeShiftModal();
    if (event.target == confirmModal) closeConfirmModal();
}
