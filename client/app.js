const socket = io();

let currentView = 'welcome';
let selectedAnswer = null;
let currentQuestionIndex = 0;
let quizData = null;
let timerInterval = null;
let userId = null;
let userName = null;
let quizId = null;
let serverTimeOffset = 0;
let questionStartTime = 0;
let questionDuration = 0;

const app = document.getElementById('app');
const urlParams = new URLSearchParams(window.location.search);
const defaultQuizId = urlParams.get('quiz') || 'QUIZ-ABC123';

// Send heartbeat every 10 seconds
setInterval(() => {
  if (quizId && userId) {
    socket.emit('heartbeat', { quizId, userId });
  }
}, 10000);

function syncServerTime(serverTime) {
  serverTimeOffset = serverTime - Date.now();
  console.log('⏱️ Server time synced, offset:', serverTimeOffset);
}

function getClientServerTime() {
  return Date.now() + serverTimeOffset;
}

function render(view) {
  currentView = view;
  console.log('Rendering view:', view);
  
  switch (view) {
    case 'welcome':
      renderWelcome();
      break;
    case 'joining':
      renderJoining();
      break;
    case 'waiting':
      renderWaiting();
      break;
    case 'question':
      renderQuestion();
      break;
    case 'results':
      renderResults();
      break;
    default:
      renderWelcome();
  }
}

function renderWelcome() {
  app.innerHTML = `
    <div class="container">
      <div class="welcome-header">
        <h1>Sage</h1>
        <p class="tagline">Grow your mind, one quiz at a time.</p>
      </div>
      <form onsubmit="event.preventDefault(); joinQuiz();">
        <div class="form-group">
          <label for="userName">Full Name</label>
          <input type="text" id="userName" placeholder="Enter your full name" required autofocus>
        </div>
        <div class="form-group">
          <label for="quizId">Quiz Number</label>
          <input type="text" id="quizId" placeholder="Enter quiz number" value="${defaultQuizId}" required>
        </div>
        <button type="submit">Join Quiz</button>
      </form>
    </div>
  `;
  
  setTimeout(() => {
    const nameInput = document.getElementById('userName');
    if (nameInput) nameInput.focus();
  }, 100);
}

function renderWaiting() {
  app.innerHTML = `
    <div class="container">
      <div class="welcome-header">
        <h1>Sage</h1>
        <p class="tagline">Grow your mind, one quiz at a time.</p>
      </div>
      <div class="waiting-content">
        <p>Welcome, <strong>${userName}</strong>!</p>
        <p>You have successfully joined the quiz.</p>
        <p>Waiting for the admin to start the contest...</p>
        <div class="spinner"></div>
      </div>
    </div>
  `;
}

function renderQuestion() {
  if (!quizData || currentQuestionIndex >= quizData.questions.length) {
    render('results');
    return;
  }

  const question = quizData.questions[currentQuestionIndex];
  app.innerHTML = `
    <div class="container">
      <div class="question-header">
        <h2>Question ${currentQuestionIndex + 1} of ${quizData.questions.length}</h2>
      </div>
      <div class="timer-display">
        <span id="timer">15</span>s
      </div>
      <div class="question-card">
        <h3>${question.question}</h3>
      </div>
      <div class="options" id="options"></div>
    </div>
  `;

  const optionsDiv = document.getElementById('options');
  if (question.options && question.options.length > 0) {
    question.options.forEach((option, index) => {
      const optionDiv = document.createElement('div');
      optionDiv.className = 'option';
      optionDiv.textContent = option;
      optionDiv.onclick = () => selectOption(option, optionDiv);
      optionsDiv.appendChild(optionDiv);
    });
  }

  startSynchronizedTimer();
}

function renderResults() {
  app.innerHTML = `
    <div class="container">
      <div class="welcome-header">
        <h1>Sage</h1>
        <p class="tagline">Grow your mind, one quiz at a time.</p>
      </div>
      <div class="results-content">
        <p>Quiz Completed!</p>
        <p>Waiting for final results...</p>
        <div class="spinner"></div>
      </div>
    </div>
  `;
}

function renderJoining() {
  app.innerHTML = `
    <div class="container">
      <div class="welcome-header">
        <h1>Sage</h1>
        <p class="tagline">Grow your mind, one quiz at a time.</p>
      </div>
      <div class="joining-content">
        <p>Connecting to quiz...</p>
        <div class="spinner"></div>
      </div>
    </div>
  `;
}

function joinQuiz() {
  userName = document.getElementById('userName').value.trim();
  quizId = document.getElementById('quizId').value.trim();

  if (!userName || !quizId) {
    alert('Please fill in all fields');
    return;
  }

  userId = socket.id || 'user_' + Math.random().toString(36).substr(2, 9);
  localStorage.setItem('quizId', quizId);
  localStorage.setItem('userName', userName);
  
  console.log('📝 Joining quiz:', { userId, userName, quizId });
  render('joining');
  
  setTimeout(() => {
    socket.emit('join-quiz', { userId, userName, quizId });
  }, 500);
}

function selectOption(option, element) {
  document.querySelectorAll('.option').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');
  selectedAnswer = option;
}

function startSynchronizedTimer() {
  const timerEl = document.getElementById('timer');
  if (!timerEl) return;

  if (timerInterval) clearInterval(timerInterval);
  
  // Update timer every 100ms for smooth countdown
  timerInterval = setInterval(() => {
    const clientServerTime = getClientServerTime();
    const remaining = Math.max(0, questionStartTime + questionDuration - clientServerTime);
    const seconds = Math.ceil(remaining / 1000);
    
    if (timerEl) {
      timerEl.textContent = seconds;
    }
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      submitAnswer();
      socket.emit('question-expired', {
        quizId,
        questionIndex: currentQuestionIndex
      });
    }
  }, 100);
}

function submitAnswer() {
  console.log('📊 Submitting answer:', selectedAnswer);
  socket.emit('submit-answer', {
    userId,
    questionId: quizData.questions[currentQuestionIndex].id,
    answer: selectedAnswer || null,
    quizId
  });

  selectedAnswer = null;
  currentQuestionIndex++;
}

// Socket event listeners
socket.on('connect', () => {
  console.log('✅ Connected to server with ID:', socket.id);
});

socket.on('user-joined', (data) => {
  console.log('👤 User joined event received:', data);
  render('waiting');
});

socket.on('quiz-started', (data) => {
  console.log('▶️ Quiz started event received:', data);
  
  if (data.questions && data.questions.length > 0) {
    quizData = {
      id: data.quizId,
      title: data.title || 'Quiz',
      questions: data.questions
    };
    currentQuestionIndex = 0;
    selectedAnswer = null;
    
    // Sync with server time for first question
    if (data.firstQuestion) {
      syncServerTime(data.firstQuestion.serverTime);
      questionStartTime = getClientServerTime();
      questionDuration = data.firstQuestion.duration;
    }
    
    console.log('📚 Quiz data loaded, rendering first question');
    render('question');
  } else {
    console.warn('⚠️ No questions in quiz-started data');
    render('waiting');
  }
});

socket.on('sync-question', (data) => {
  console.log('🔄 Syncing to current question:', data);
  
  syncServerTime(data.serverTime);
  questionStartTime = getClientServerTime();
  questionDuration = 15000;
  currentQuestionIndex = data.questionIndex;
  selectedAnswer = null;
  
  render('question');
});

socket.on('next-question', (data) => {
  console.log('➡️ Moving to next question:', data);
  
  if (!quizData) return;
  
  // Sync timing with server
  syncServerTime(data.serverTime);
  questionStartTime = getClientServerTime();
  questionDuration = data.duration;
  
  currentQuestionIndex = data.questionIndex;
  selectedAnswer = null;
  
  // Update quizData with new question
  quizData.questions[data.questionIndex] = data.question;
  
  render('question');
});

socket.on('quiz-complete', (data) => {
  console.log('✅ Quiz completed:', data);
  render('results');
});

socket.on('leaderboard-published', (leaderboard) => {
  console.log('🏆 Leaderboard received:', leaderboard);
  
  app.innerHTML = `
    <div class="container">
      <div class="welcome-header">
        <h1>Sage</h1>
        <p class="tagline">Grow your mind, one quiz at a time.</p>
      </div>
      <h3 style="margin: 20px 0; text-align: center; color: #2a5298;">Final Results</h3>
      <div id="leaderboard"></div>
      <footer style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 13px; color: #999;">
        <p>Made with ❤️ by</p>
        <p>Prabin Kumar Tiwary</p>
      </footer>
    </div>
  `;

  const leaderboardDiv = document.getElementById('leaderboard');
  if (leaderboard && leaderboard.length > 0) {
    leaderboard.forEach((entry, index) => {
      const entryDiv = document.createElement('div');
      entryDiv.className = 'leaderboard-entry';
      entryDiv.innerHTML = `<span class="rank">#${index + 1}</span> <span class="name">${entry.name}</span> <span class="score">${entry.score}/${entry.totalQuestions || 3}</span>`;
      leaderboardDiv.appendChild(entryDiv);
    });
  }
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('error', (error) => {
  console.error('🔴 Socket error:', error);
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM loaded, rendering welcome screen');
  render('welcome');
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    render('welcome');
  });
} else {
  render('welcome');
}