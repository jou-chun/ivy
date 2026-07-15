const questions = [
  { title: "我希望大家怎麼稱呼我？", options: ["佳玲", "我的綽號", "其他稱呼"] },
  { title: "我覺得自己的個性比較像哪一種？", options: ["樂觀、愛笑", "有自己的想法", "喜歡關心別人、和別人聊天"] },
  { title: "平常什麼事情最容易讓我開心？", options: ["和別人聊天、有人陪伴", "使用手機、聽音樂或看影片", "聞香氣、使用精油或參加活動"] },
  { title: "我最喜歡自己哪一個地方？", options: ["我很樂觀", "我有自己的想法", "我遇到事情會想辦法"] },
  { title: "我最希望別人認識真正的我哪一面？", options: ["我不只有情緒不好的時候", "我也有開心、樂觀的一面", "我有自己的想法和選擇"] }
];

const methods = ["我自己看題目並回答", "小水滴老師念題目，我回答數字", "我回答，小水滴老師幫我記錄"];
const activity = { id: "day-1-introduction", day: 1, title: "我是佳玲｜我的自我介紹", version: 1 };
const submitUrl = window.APP_CONFIG?.submitUrl?.trim() || "";
const state = { current: 0, answers: Array(5).fill(null), supplements: Array(5).fill("") };
const $ = (id) => document.getElementById(id);
const screens = ["welcomeScreen", "questionScreen", "reviewScreen", "doneScreen"];

function showScreen(id) {
  screens.forEach((screen) => $(screen).hidden = screen !== id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderQuestion() {
  const q = questions[state.current];
  $("questionNumber").textContent = state.current + 1;
  $("questionTitle").textContent = q.title;
  $("progressText").textContent = `第 ${state.current + 1} 題，共 5 題`;
  $("progressBar").style.width = `${(state.current + 1) * 20}%`;
  $("backButton").textContent = state.current === 0 ? "← 回到開始" : "← 上一題";
  $("options").innerHTML = q.options.map((option, index) => `
    <button class="option-button ${state.answers[state.current] === index ? "selected" : ""}" data-option="${index}" type="button">
      <span class="option-number">${index + 1}</span><span>${option}</span>
    </button>`).join("");
  $("supplementInput").value = state.supplements[state.current];
  const hasSupplement = Boolean(state.supplements[state.current]);
  $("supplement").hidden = !hasSupplement;
  $("supplementToggle").setAttribute("aria-expanded", String(hasSupplement));
  $("supplementToggle").textContent = hasSupplement ? "－ 收起補充" : "＋ 我還想補充";
  $("selectionTip").textContent = state.answers[state.current] === null ? "選好答案後，會自動到下一題" : "已選好答案，可以重新選擇";
}

function chooseOption(index) {
  state.answers[state.current] = index;
  renderQuestion();
  setTimeout(() => {
    if (state.current < questions.length - 1) {
      state.current += 1;
      renderQuestion();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      renderReview();
      showScreen("reviewScreen");
    }
  }, 420);
}

function renderReview() {
  $("answerList").innerHTML = questions.map((q, index) => {
    const answerIndex = state.answers[index];
    const answer = answerIndex === null ? "尚未回答" : `${answerIndex + 1}．${q.options[answerIndex]}`;
    return `<div class="answer-item"><div class="answer-copy"><small>第 ${index + 1} 題｜${q.title}</small><strong>${answer}</strong>${state.supplements[index] ? `<small>補充：${escapeHtml(state.supplements[index])}</small>` : ""}</div><button class="edit-button" data-edit="${index}" type="button">修改</button></div>`;
  }).join("");
  $("methodOptions").innerHTML = methods.map((method, index) => `<label class="compact-option"><input type="radio" name="method" value="${index + 1}" /><span>${index + 1}．${method}</span></label>`).join("");
  const saved = loadSaved();
  if (saved?.method) document.querySelector(`input[name="method"][value="${saved.method}"]`)?.click();
  if (saved?.confirmation) document.querySelector(`input[name="confirmation"][value="${saved.confirmation}"]`)?.click();
  if (saved?.finalMessage && !$("finalMessage").value) $("finalMessage").value = saved.finalMessage;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function readCurrent() {
  if (!("speechSynthesis" in window)) return toast("這台裝置暫時無法朗讀");
  speechSynthesis.cancel();
  let text;
  if (!$("questionScreen").hidden) {
    const q = questions[state.current];
    text = `第 ${state.current + 1} 題。${q.title}。` + q.options.map((o, i) => `${i + 1}，${o}`).join("。");
  } else if (!$("reviewScreen").hidden) text = "五題都完成了。請慢慢看一次，想改哪一題都可以。";
  else text = "我是佳玲。我的自我介紹，第一天。這不是考試，也沒有標準答案。今天只回答五題。";
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.85;
  speechSynthesis.speak(utterance);
}

function toast(message) {
  $("toast").textContent = message;
  $("toast").classList.add("show");
  setTimeout(() => $("toast").classList.remove("show"), 2200);
}

function loadSaved() {
  try { return JSON.parse(localStorage.getItem("jialing-intro-day1")); } catch { return null; }
}

function buildAnswerText() {
  const savedData = loadSaved() || {};
  const lines = ["【我是佳玲｜我的自我介紹・第一天】", ""];
  questions.forEach((question, index) => {
    const answerIndex = state.answers[index];
    const answer = answerIndex === null ? "尚未回答" : `${answerIndex + 1}．${question.options[answerIndex]}`;
    lines.push(`${index + 1}．${question.title}`, `回答：${answer}`);
    if (state.supplements[index]) lines.push(`補充：${state.supplements[index]}`);
    lines.push("");
  });
  lines.push(`最想讓別人知道的一句話：${savedData.finalMessage || "未填寫"}`);
  lines.push(`今天的回答方式：${savedData.method ? `${savedData.method}．${methods[Number(savedData.method) - 1]}` : "未選擇"}`);
  lines.push(`作答日期：${new Intl.DateTimeFormat("zh-TW", { dateStyle: "long", timeZone: "Asia/Taipei" }).format(new Date(savedData.savedAt || Date.now()))}`);
  return lines.join("\n");
}

async function shareAnswers() {
  const text = buildAnswerText();
  if (navigator.share) {
    try {
      await navigator.share({ title: "佳玲的自我介紹回答", text });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast("答案已複製，請貼到 LINE 傳給老師");
  } catch {
    window.prompt("請複製以下答案，再貼到 LINE 傳給老師：", text);
  }
}

function buildSubmission(method, confirmation) {
  return {
    submissionId: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    participant: "佳玲",
    activity,
    submittedAt: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    answers: questions.map((question, index) => ({
      number: index + 1,
      question: question.title,
      choice: state.answers[index] + 1,
      answer: question.options[state.answers[index]],
      supplement: state.supplements[index] || ""
    })),
    finalMessage: $("finalMessage").value.trim(),
    method: { number: Number(method), label: methods[Number(method) - 1] },
    confirmation
  };
}

async function sendSubmission(submission) {
  if (!submitUrl) return { sent: false, reason: "not-configured" };
  const body = new URLSearchParams({ payload: JSON.stringify(submission) });
  await fetch(submitUrl, { method: "POST", mode: "no-cors", body });
  return { sent: true };
}

$("startButton").addEventListener("click", () => { renderQuestion(); showScreen("questionScreen"); });
$("readButton").addEventListener("click", readCurrent);
$("options").addEventListener("click", (event) => {
  const button = event.target.closest("[data-option]");
  if (button) chooseOption(Number(button.dataset.option));
});
$("backButton").addEventListener("click", () => {
  if (state.current === 0) showScreen("welcomeScreen");
  else { state.current -= 1; renderQuestion(); }
});
$("supplementToggle").addEventListener("click", () => {
  const willOpen = $("supplement").hidden;
  $("supplement").hidden = !willOpen;
  $("supplementToggle").setAttribute("aria-expanded", String(willOpen));
  $("supplementToggle").textContent = willOpen ? "－ 收起補充" : "＋ 我還想補充";
  if (willOpen) $("supplementInput").focus();
});
$("supplementInput").addEventListener("input", (event) => state.supplements[state.current] = event.target.value);
$("answerList").addEventListener("click", (event) => {
  const button = event.target.closest("[data-edit]");
  if (!button) return;
  state.current = Number(button.dataset.edit);
  renderQuestion();
  showScreen("questionScreen");
});
$("finishButton").addEventListener("click", async () => {
  const method = document.querySelector('input[name="method"]:checked')?.value;
  const confirmation = document.querySelector('input[name="confirmation"]:checked')?.value;
  if (!method) return toast("請選擇今天的回答方式");
  if (!confirmation) return toast("請完成最後確認");
  if (confirmation === "修改") { toast("請點選想修改的題目"); return; }
  const button = $("finishButton");
  const submission = buildSubmission(method, confirmation);
  localStorage.setItem("jialing-intro-day1", JSON.stringify({ ...state, method, confirmation, finalMessage: submission.finalMessage, savedAt: submission.submittedAt }));
  localStorage.setItem("jialing-pending-submission", JSON.stringify(submission));
  button.disabled = true;
  button.textContent = "正在傳送…";
  try {
    const result = await sendSubmission(submission);
    if (result.sent) {
      localStorage.removeItem("jialing-pending-submission");
      $("doneMessage").innerHTML = "答案已經傳送給老師，也保存在這台裝置裡。<br />今天辛苦了，可以休息囉。";
    } else {
      $("doneMessage").innerHTML = "答案已保存在這台裝置裡。<br />老師尚未連接紀錄表，答案暫時不會遺失。";
    }
    showScreen("doneScreen");
  } catch {
    $("doneMessage").innerHTML = "目前網路不穩，答案已安全保存在這台裝置裡。<br />請保留這個頁面，稍後可以再次傳送。";
    showScreen("doneScreen");
  } finally {
    button.disabled = false;
    button.textContent = "完成並傳送";
  }
});
$("editAgainButton").addEventListener("click", () => { renderReview(); showScreen("reviewScreen"); });
$("shareButton").addEventListener("click", shareAnswers);

const saved = loadSaved();
if (saved?.answers?.length === 5) {
  state.answers = saved.answers;
  state.supplements = saved.supplements || Array(5).fill("");
  $("finalMessage").value = saved.finalMessage || "";
}

if (!submitUrl) $("sendNote").textContent = "目前是測試模式：答案會先保存在這台裝置裡。";
