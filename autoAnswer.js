let answerKey = {};

fetch(chrome.runtime.getURL('answers.json'))
  .then(response => response.json())
  .then(data => {
    answerKey = Object.fromEntries(
      Object.entries(data).map(([question, answers]) => [
        normalizeQuestion(question),
        answers.map(a => normalizeWhitespace(a))
      ])
    );
    waitUntilRendered();
  });

function normalizeWhitespace(text) {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ') 
    .replace(/\u200B/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeQuestion(text) {
  return normalizeWhitespace(
    text
      .replace(/[\s\u00A0\u202F\u200B]*[-–—]?\s*(please|будь ласка).*$/i, '')
      .replace(/\s*\([\s\S]*?\)$/i, '')
  );
}

function answerQuestion(question) {
  const qTextEl = question.querySelector('.qtext');
  if (!qTextEl) return false;

  const rawText = qTextEl.innerText.trim();
  const qText = normalizeQuestion(rawText);
  const correctAnswers = answerKey[qText];
  if (!correctAnswers) return false;

  let filled = false;
  question.querySelectorAll('div.answer input[type=checkbox], div.answer input[type=radio]').forEach(input => {
    const label = input.closest('label') || input.closest('div');
    if (!label) return;

    let labelText = label.innerText || '';
    labelText = labelText.trim();
    labelText = normalizeWhitespace(labelText.replace(/^[a-z]\.\s*/i, ''));

    if (correctAnswers.some(ans => normalizeWhitespace(ans) === labelText)) {
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      filled = true;
    }
  });
  return filled;
}

async function startAnswering() {
  const questions = document.querySelectorAll('div.que');
  if (!questions.length) return;

  const result = await chrome.storage.local.get(['slowFilling']);
  const isSlow = !!result.slowFilling;

  if (isSlow) {
    answerSequentially(Array.from(questions), 0);
  } else {
    questions.forEach(q => answerQuestion(q));
  }
}

function answerSequentially(questions, index) {
  if (index >= questions.length) return;
  
  answerQuestion(questions[index]);
  
  if (index < questions.length - 1) {
    setTimeout(() => {
      answerSequentially(questions, index + 1);
    }, 10000);
  }
}

function waitUntilRendered(retries = 20) {
  const questions = document.querySelectorAll('div.que');
  if (questions.length > 0) {
    startAnswering();
  } else if (retries > 0) {
    setTimeout(() => waitUntilRendered(retries - 1), 500);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'forceFill') {
    const questions = document.querySelectorAll('div.que');
    questions.forEach(q => answerQuestion(q));
  }
});

window.addEventListener('load', () => waitUntilRendered());
