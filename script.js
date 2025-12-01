/* --- 設定データ --- */
// ★【重要】ここにGASのウェブアプリURLを貼り付けてください
const GAS_URL = "https://script.google.com/macros/s/ここにあなたのURLを貼り付け/exec"; 

let currentSelectedDate = null;
// 複数選択対応: { day: ["シフト名1", "シフト名2", ...] }
let shiftData = {}; 
let targetYear = 0;
let targetMonth = 0;

// GASから取得した設定情報を保持
let config = {}; 

// DOM読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    // 最初に設定を読み込む
    fetchConfig().then(() => {
        initCalendar();
        checkSubmissionStatus(); 
    }).catch(error => {
        console.error("設定の読み込みに失敗しました:", error);
        // エラー時は初期化を停止し、アラートを表示
        alert("設定ファイルの読み込みに失敗しました。管理者にご連絡ください。");
    });
});

// GASから設定情報を取得する
async function fetchConfig() {
    // GASのURLに ?action=getConfig を付けてGETリクエストを送信
    const response = await fetch(GAS_URL + "?action=getConfig");
    if (!response.ok) throw new Error("GASへの接続エラー");
    
    const data = await response.json();
    if (data.result === 'error') throw new Error(data.error);

    config = data;
}

// 動的な設定値を使用してカレンダーを初期化
function initCalendar() {
    const today = new Date();
    // 次月の情報を取得
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    targetYear = nextMonthDate.getFullYear();
    targetMonth = nextMonthDate.getMonth() + 1;

    // 設定シートの値を使用
    document.getElementById('shift-title').textContent = config.TITLE || `${targetMonth}月のシフト希望`;
    document.getElementById('calendar-month-year').textContent = `${targetYear}年 ${targetMonth}月`;
    
    // 管理者からのメッセージを反映
    document.getElementById('admin-message').innerHTML = config.MESSAGE_ADMIN || "メッセージが設定されていません。";
    document.querySelector('.calendar-instruction').textContent = config.MESSAGE_CALENDAR || "日付をタップしてください。";
    document.getElementById('notes').placeholder = (config.MESSAGE_NOTES_EXAMPLE ? `【管理者からのメッセージ】\n${config.MESSAGE_NOTES_EXAMPLE}` : "");
    
    // 確認ボタン上のメッセージを反映
    document.getElementById('submit-confirm-message').textContent = config.MESSAGE_SUBMIT_CONFIRM || "確認メッセージが設定されていません。";

    // 最終送信ボタン上のメッセージを反映
    document.getElementById('send-final-message').textContent = config.MESSAGE_SEND_FINAL || "最終メッセージが設定されていません。";


    generateCalendarGrid(targetYear, targetMonth);
    generateShiftModalButtons();
}

// 管理者のテスト用バイパス機能
function checkSubmissionStatus() {
    // URLに ?test=true が含まれている場合はチェックをスキップ
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('test') === 'true') {
        console.log("管理者テストモード: 送信済みチェックをバイパスします。");
        return;
    }

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

// 動的なシフトボタンを生成
function generateShiftModalButtons() {
    const options = document.querySelector('.shift-options');
    options.innerHTML = '';
    
    if (!config.shifts) return;

    config.shifts.forEach(shift => {
        const btn = document.createElement('button');
        btn.type = 'button';
        // CSSクラスを設定シートから読み込む
        btn.className = `shift-btn ${shift.class}`; 
        btn.textContent = shift.name;
        // 複数選択に対応するため、トグル機能に設定
        btn.onclick = () => toggleShiftSelection(shift.name); 
        
        options.appendChild(btn);
    });
}


function generateCalendarGrid(year, month) {
    const gridElement = document.getElementById('calendar-grid');
    gridElement.innerHTML = "";

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = new Date(year, month - 1, 1).getDay();

    for (let i = 0; i < firstDayIndex; i++) {
        gridElement.appendChild(document.createElement('div'));
    }

    // 祝日リストをSetに変換 (YYYYMMDD形式)
    const holidaySet = new Set(config.holidays || []);

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

        shiftData[day] = []; // 初期化：配列にする

        cell.addEventListener('click', function() {
            openShiftModal(day);
        });
        
        // 祝日色付け
        const dayStr = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
        if (holidaySet.has(dayStr)) {
            cell.classList.add('holiday');
        }

        gridElement.appendChild(cell);
    }
}

/* --- シフト選択モーダル --- */
function openShiftModal(day) {
    currentSelectedDate = day;
    const modal = document.getElementById('modal-overlay');
    const title = document.getElementById('modal-date-display');
    title.textContent = `${day}日のシフトを選択 (複数可)`;
    
    // 現在選択済みのシフトボタンにハイライトを付ける
    const selectedShifts = shiftData[day] || [];
    document.querySelectorAll('.shift-btn').forEach(btn => {
        const shiftName = btn.textContent.trim();
        if (selectedShifts.includes(shiftName)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    modal.style.display = 'flex';
}

function closeShiftModal() {
    document.getElementById('modal-overlay').style.display = 'none';
    currentSelectedDate = null;
}

// 複数選択に対応したトグル機能 (重複防止と排他制御を実装)
function toggleShiftSelection(shiftName) {
    if (!currentSelectedDate) return;

    // 現在のシフト情報を取得
    let selectedShifts = shiftData[currentSelectedDate];
    const index = selectedShifts.indexOf(shiftName);
    
    // 現在タップされたボタン要素を取得
    const btn = Array.from(document.querySelectorAll('.shift-btn')).find(b => b.textContent.trim() === shiftName);
    
    // --- 1. 排他制御ロジック (「休み」が絡む場合) ---
    const IS_YASUMI_SELECTED = selectedShifts.includes("休み");

    if (shiftName === "休み") {
        if (IS_YASUMI_SELECTED) {
            // 休みを再タップした場合 (解除/クリア): 配列を空にする
            selectedShifts = []; 
            // ボタンのハイライトを解除
            btn.classList.remove('selected');
            
        } else {
            // 休みを新規選択: 既存のシフトをすべてクリアし、「休み」のみ追加
            if (selectedShifts.length > 0) {
                alert("「休み」を選択する場合、他のシフトはすべて自動的にクリアされます。");
            }
            selectedShifts = ["休み"];
            // 他のボタンのハイライトをすべて解除
            document.querySelectorAll('.shift-btn.selected').forEach(b => {
                 if (b !== btn) b.classList.remove('selected');
            });
            btn.classList.add('selected');
        }
    } else {
        // --- 休み以外のシフトを選択する場合 ---
        if (IS_YASUMI_SELECTED) {
            // 既に「休み」が選択されている場合は無効
            alert("「休み」が選択されているため、他のシフトは選択できません。先に「休み」を解除してください。");
            return;
        }

        // --- 2. 重複防止ロジック ---
        if (index > -1) {
            // すでに選択されていれば削除 (重複防止)
            selectedShifts.splice(index, 1);
            btn.classList.remove('selected');
        } else {
            // 選択されていなければ追加
            selectedShifts.push(shiftName);
            btn.classList.add('selected');
        }
    }

    // データ保存: selectedShiftsの内容を上書き
    shiftData[currentSelectedDate] = selectedShifts;

    // 画面のセル表示を更新
    updateCellDisplay(currentSelectedDate);
    
    // 休みが選択された場合、他のボタンのハイライトをリセット
    if (shiftName === "休み" && !IS_YASUMI_SELECTED) {
        document.querySelectorAll('.shift-btn').forEach(b => {
            const name = b.textContent.trim();
            if (name !== "休み") {
                b.classList.remove('selected');
            }
        });
    }
}

// セル表示更新
function updateCellDisplay(day) {
    const cell = document.getElementById(`day-${day}`);
    const label = document.getElementById(`shift-label-${day}`);
    const selectedShifts = shiftData[day];

    // CSSクラスをリセット
    cell.removeAttribute('data-shift');
    config.shifts.forEach(s => cell.classList.remove(s.class));
    
    if (selectedShifts && selectedShifts.length > 0) {
        // 複数シフトを "/" で連結して表示
        label.textContent = selectedShifts.join(' / ');
        
        // セルに選択されたシフトのクラスをすべて付与
        const firstShift = config.shifts.find(s => s.name === selectedShifts[0]);
        if(firstShift) {
            cell.setAttribute('data-shift', firstShift.name);
            cell.classList.add(firstShift.class);
        }
    } else {
        label.textContent = "-";
    }
}

/* --- 確認画面と送信処理 --- */
function showConfirmation() {
    const name = document.getElementById('username').value.trim();
    const birth = document.getElementById('birthdate').value.trim();
    const notes = document.getElementById('notes').value.trim();

    // 必須入力チェック
    if (!name || !birth) {
        alert("氏名と誕生日は必須です。");
        return;
    }
    
    // 全日シフト選択チェック
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    let allDaysSelected = true;
    for (let day = 1; day <= daysInMonth; day++) {
        if (shiftData[day].length === 0) {
            allDaysSelected = false;
            break; 
        }
    }
    
    if (!allDaysSelected) {
        alert("すべての日付のシフト（早番、休みなど）を選択してください。未選択の日があります。");
        return; 
    }

    // ユーザー情報の表示 (変更なし)
    const email = document.getElementById('email').value.trim() || "(未入力)";
    const userInfoHtml = `
        <div class="confirm-info-row"><strong>氏名:</strong> ${name}</div>
        <div class="confirm-info-row"><strong>誕生日:</strong> ${birth}</div>
        <div class="confirm-info-row"><strong>Email:</strong> ${email}</div>
    `;
    document.getElementById('confirm-user-info').innerHTML = userInfoHtml;
    
    // 連絡事項の表示 (変更なし)
    const notesInfoHtml = `
        <strong>連絡事項・特記事項</strong>
        ${notes || "(入力なし)"}
    `;
    document.getElementById('confirm-notes-info').innerHTML = notesInfoHtml;

    // 確認用シフトリストの生成 (カレンダーからリスト形式に変更)
    const confirmListContainer = document.getElementById('confirm-shift-list-container');
    
    // ★微修正箇所★：以前のリスト要素があれば削除 (二重表示防止)
    const oldList = confirmListContainer.querySelector('.confirm-shift-list');
    if(oldList) oldList.remove();
    
    const listHtml = document.createElement('div');
    listHtml.className = 'confirm-shift-list';
    
    // 祝日リストをSetに変換
    const holidaySet = new Set(config.holidays || []);

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(targetYear, targetMonth - 1, day);
        const dayOfWeek = date.getDay(); // 0=日, 6=土
        const dayName = ["日", "月", "火", "水", "木", "金", "土"][dayOfWeek];
        
        const selectedShifts = shiftData[day];
        const shiftText = selectedShifts.join(' / ') || "-";

        let dayClass = '';
        if (dayOfWeek === 0 || holidaySet.has(`${targetYear}${String(targetMonth).padStart(2, '0')}${String(day).padStart(2, '0')}`)) {
            dayClass = 'sunday holiday';
        } else if (dayOfWeek === 6) {
            dayClass = 'saturday';
        }

        // 日付セル
        const dayDiv = document.createElement('div');
        dayDiv.className = `shift-list-day ${dayClass}`;
        dayDiv.textContent = `${day}日 (${dayName})`;
        listHtml.appendChild(dayDiv);

        // シフト内容セル
        const contentDiv = document.createElement('div');
        contentDiv.className = 'shift-list-content';
        contentDiv.textContent = shiftText;
        listHtml.appendChild(contentDiv);
    }
    
    // 新しいリストを挿入
    confirmListContainer.appendChild(listHtml);

    // モーダルを表示
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmModal() {
    document.getElementById('confirm-modal').style.display = 'none';
}

// 複数選択形式のデータをGASに送信
function submitData() {
    const submitBtn = document.querySelector('.action-btn.btn-primary');
    submitBtn.textContent = "送信中...";
    submitBtn.disabled = true;

    // shiftDataはすでに {1: ["早番", "遅番"], 2: ["休み"], ...} の形式
    const postData = {
        name: document.getElementById('username').value.trim(),
        birth: document.getElementById('birthdate').value.trim(),
        email: document.getElementById('email').value.trim(),
        notes: document.getElementById('notes').value.trim(),
        
        year: targetYear,
        month: targetMonth,
        shifts: shiftData // 複数シフトのデータ構造をそのままGASに渡す
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
            
            // テストモードでなければ提出履歴を保存
            const urlParams = new URLSearchParams(location.search);
            if (urlParams.get('test') !== 'true') {
                const currentTarget = `${targetYear}-${targetMonth}`;
                localStorage.setItem('lastSubmissionMonth', currentTarget);
            }
            
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
