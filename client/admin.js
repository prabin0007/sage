const socket = io();
const adminContent = document.getElementById('admin-content');

let isLoggedIn = false;
let adminPassword = '1234';
let currentQuiz = null;
let participants = [];
let currentQuizId = null;

function renderLoginScreen() {
  adminContent.innerHTML = `
    <div class="login-screen">
      <h2>Admin Login</h2>
      <div class="form-group">
        <label for="adminPassword">Admin Password</label>
        <input type="password" id="adminPassword" placeholder="Enter admin password">
      </div>
      <button class="login-btn" onclick="loginAdmin()">Login</button>
    </div>
  `;
  document.getElementById('adminPassword').focus();
}

function loginAdmin() {
  const password = document.getElementById('adminPassword').value;
  if (password === adminPassword) {
    isLoggedIn = true;
    renderDashboard();
  } else {
    alert('Invalid password');
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminPassword').focus();
  }
}

function renderDashboard() {
  adminContent.innerHTML = `
    <div class="admin-header">
      <div>
        <h1>Sage Admin Panel</h1>
        <p class="tagline">Manage quizzes and monitor participants</p>
      </div>
      <div class="admin-nav">
        <button onclick="createNewQuiz()">Create Quiz</button>
        <button onclick="logoutAdmin()">Logout</button>
      </div>
    </div>

    <div class="admin-container">
      <div class="dashboard">
        <!-- Quiz Info Card -->
        <div class="card">
          <h3>Active Quiz</h3>
          <div id="quiz-info">
            <p style="color: #999; text-align: center;">Loading quiz...</p>
          </div>
        </div>

        <!-- Participants Card -->
        <div class="card">
          <h3>Live Participants (<span id="participant-count">0</span>)</h3>
          <div class="participant-list" id="participant-list">
            <p style="color: #999; text-align: center;">Waiting for participants...</p>
          </div>
        </div>

        <!-- Questions Card -->
        <div class="card questions-section">
          <h3>Quiz Questions</h3>
          <div id="questions-list">
            <p style="color: #999; text-align: center;">No questions added</p>
          </div>
        </div>

        <!-- Leaderboard Card -->
        <div class="card leaderboard">
          <h3>Hidden Leaderboard (Real-Time)</h3>
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Participant Name</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody id="leaderboard-body">
              <tr>
                <td colspan="3" style="text-align: center; color: #999;">No scores yet</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Controls Card -->
        <div class="card" style="grid-column: 1 / -1;">
          <h3>Contest Controls</h3>
          <div class="controls">
            <button class="btn btn-primary" id="start-btn" onclick="startQuiz()" disabled>Start Contest</button>
            <button class="btn btn-success" id="publish-btn" onclick="publishLeaderboard()" disabled>Publish Leaderboard</button>
            <button class="btn btn-danger" onclick="endQuiz()">End Quiz</button>
            <button class="btn" style="background: #95a5a6;" onclick="resetQuiz()">Reset Quiz</button>
          </div>
        </div>
      </div>
    </div>
  `;

  loadSampleQuiz();
}

function createNewQuiz() {
  const quizTitle = prompt('Enter quiz title:');
  if (!quizTitle) return;

  const quizNumber = 'QUIZ-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  
  currentQuiz = {
    id: quizNumber,
    title: quizTitle,
    questions: [],
    status: 'inactive'
  };

  currentQuizId = quizNumber;
  updateQuizInfo();
  alert('Quiz created! Share Quiz Number: ' + quizNumber);
}

function loadSampleQuiz() {
  currentQuiz = {
    id: 'QUIZ-ABC123',
    title: 'General Knowledge Quiz',
    questions: [
      {
        id: '1',
        question: 'What is the capital of France?',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 'Paris'
      },
      {
        id: '2',
        question: 'Which planet is known as the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 'Mars'
      },
      {
        id: '3',
        question: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4'
      }
    ],
    status: 'inactive'
  };

  currentQuizId = currentQuiz.id;
  
  console.log('🔌 Admin joining quiz room:', currentQuizId);
  socket.emit('join-admin', { quizId: currentQuizId });
}

function updateQuizInfo() {
  if (!currentQuiz) return;
  
  const quizInfo = document.getElementById('quiz-info');
  quizInfo.innerHTML = `
    <div class="quiz-info">
      <p><strong>Quiz Title:</strong> ${currentQuiz.title}</p>
      <p><strong>Quiz Number:</strong> <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${currentQuiz.id}</span></p>
      <p><strong>Status:</strong> <span style="color: ${currentQuiz.status === 'active' ? '#27ae60' : '#e74c3c'}">${currentQuiz.status.toUpperCase()}</span></p>
      <p><strong>Total Questions:</strong> ${currentQuiz.questions.length}</p>
      <p><strong>Participants Joined:</strong> <strong style="color: #2a5298;">${participants.length}</strong></p>
    </div>
  `;

  const startBtn = document.getElementById('start-btn');
  if (currentQuiz.questions.length > 0 && currentQuiz.status === 'inactive') {
    startBtn.disabled = false;
  }
}

function updateParticipantsList() {
  const list = document.getElementById('participant-list');
  const count = document.getElementById('participant-count');
  
  count.textContent = participants.length;
  console.log(`🎯 Updating participants list: ${participants.length} participants`);
  
  if (participants.length === 0) {
    list.innerHTML = '<p style="color: #999; text-align: center;">Waiting for participants...</p>';
    return;
  }

  list.innerHTML = participants.map((p, idx) => `
    <div class="participant" style="animation: slideIn 0.3s ease-in;">
      <span class="participant-name">${p.name}</span>
      <span class="participant-badge">Connected</span>
    </div>
  `).join('');
}

function updateQuestionsList() {
  if (!currentQuiz) return;
  
  const list = document.getElementById('questions-list');
  if (currentQuiz.questions.length === 0) {
    list.innerHTML = '<p style="color: #999; text-align: center;">No questions added</p>';
    return;
  }

  list.innerHTML = currentQuiz.questions.map((q, idx) => `
    <div class="question-item">
      <h4>Q${idx + 1}: ${q.question}</h4>
      <p><strong>Correct Answer:</strong> ${q.correctAnswer}</p>
      <p><strong>Options:</strong> ${q.options.join(', ')}</p>
    </div>
  `).join('');
}

function updateLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  
  if (!participants || participants.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">No participants yet</td></tr>';
    return;
  }

  const sorted = [...participants].sort((a, b) => (b.score || 0) - (a.score || 0));

  tbody.innerHTML = sorted.map((p, idx) => `
    <tr>
      <td>#${idx + 1}</td>
      <td>${p.name}</td>
      <td style="font-weight: bold; color: #2a5298;">${p.score || 0}/${currentQuiz?.questions.length || 0}</td>
    </tr>
  `).join('');
}

function startQuiz() {
  if (!currentQuiz || currentQuiz.questions.length === 0) {
    alert('Please add questions first');
    return;
  }

  currentQuiz.status = 'active';
  
  console.log('🚀 Emitting start-quiz event:', {
    quizId: currentQuiz.id,
    questions: currentQuiz.questions
  });
  
  socket.emit('start-quiz', { 
    quizId: currentQuiz.id,
    questions: currentQuiz.questions,
    title: currentQuiz.title
  });
  
  updateQuizInfo();
  document.getElementById('start-btn').disabled = true;
  document.getElementById('publish-btn').disabled = false;
  alert('✅ Quiz started! All participants will see the first question.');
}

function publishLeaderboard() {
  if (!currentQuiz) return;
  
  console.log('📊 Publishing leaderboard for quiz:', currentQuiz.id);
  
  socket.emit('end-quiz', { 
    quizId: currentQuiz.id
  });
  
  alert('✅ Leaderboard published to all participants!');
}

function endQuiz() {
  if (!currentQuiz) return;
  
  if (confirm('Are you sure you want to end this quiz?')) {
    currentQuiz.status = 'completed';
    socket.emit('end-quiz', { quizId: currentQuiz.id });
    updateQuizInfo();
    alert('Quiz ended');
  }
}

function resetQuiz() {
  if (!currentQuiz) return;
  
  if (confirm('Are you sure you want to reset this quiz? All participant data will be cleared.')) {
    currentQuiz.status = 'inactive';
    participants = [];
    socket.emit('reset-quiz', { quizId: currentQuiz.id });
    updateQuizInfo();
    updateParticipantsList();
    updateLeaderboard();
    alert('Quiz reset successfully');
  }
}

function logoutAdmin() {
  isLoggedIn = false;
  currentQuizId = null;
  participants = [];
  renderLoginScreen();
}

// ============ SOCKET.IO EVENT LISTENERS ============

socket.on('connect', () => {
  console.log('✅ Admin connected to server:', socket.id);
});

socket.on('user-joined', (data) => {
  console.log('👤 USER-JOINED event:', data);
  console.log('   Payload participants:', data.participants);
  
  // Always sync with server's participant list
  if (data.participants && Array.isArray(data.participants)) {
    participants = data.participants.map(p => ({ 
      name: p.name, 
      score: p.score || 0 
    }));
  }
  
  console.log('   Updated local participants:', participants);
  updateParticipantsList();
  updateQuizInfo();
  updateLeaderboard();
});

socket.on('user-disconnected', (data) => {
  console.log('\n🔔 USER-DISCONNECTED event received');
  console.log('   Disconnected user:', data.userName);
  console.log('   Payload participants:', data.participants);
  console.log('   Total remaining:', data.totalUsers);
  
  // Update participants from server
  if (data.participants && Array.isArray(data.participants)) {
    participants = data.participants.map(p => ({ 
      name: p.name, 
      score: p.score || 0 
    }));
    console.log('   ✅ Participants synced:', participants);
  }
  
  updateParticipantsList();
  updateQuizInfo();
  updateLeaderboard();
});

socket.on('quiz-info-updated', (data) => {
  console.log('📊 QUIZ-INFO-UPDATED event:', data);
  
  if (data.participants && Array.isArray(data.participants)) {
    // If this is existing participants from admin login, merge them
    if (data.existingParticipants) {
      participants = data.participants.map(p => ({ 
        name: p.name, 
        score: p.score || 0 
      }));
      console.log('✅ Synced existing participants from server:', participants);
    } else {
      // Update from participants array
      participants = data.participants.map(p => ({ 
        name: p.name, 
        score: p.score || 0 
      }));
    }
  }
  
  updateParticipantsList();
  updateQuizInfo();
  updateLeaderboard();
});

socket.on('answer-recorded', (data) => {
  console.log('📝 Answer recorded:', data);
});

socket.on('leaderboard-updated', (data) => {
  console.log('🏆 LEADERBOARD-UPDATED event:', data);
  
  if (data.participants && Array.isArray(data.participants)) {
    participants = data.participants.map(p => ({
      name: p.name,
      score: p.score || 0
    }));
    console.log('🏆 Leaderboard synced:', participants);
    updateLeaderboard();
  }
});

socket.on('quiz-reset', (data) => {
  console.log('🔄 Quiz reset received');
  participants = [];
  updateParticipantsList();
  updateLeaderboard();
});

socket.on('disconnect', () => {
  console.log('❌ Admin disconnected from server');
});

socket.on('error', (error) => {
  console.error('🔴 Socket error:', error);
});

if (!isLoggedIn) {
  renderLoginScreen();
}