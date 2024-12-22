// Pantalla 1
let currentUser = null;

const init = () => {
  document.body.innerHTML = `
    <div id="screen1" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <h1>Bienvenido, pulsa control + F10 o espera 5 segundos</h1>
    </div>
  `;

  // Esperar 5 segundos para mostrar el campo de usuario
  setTimeout(showUserField, 5000);

  // Detectar pulsación de Ctrl + F10
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "F10") {
      showUserField();
    }
  });
};

const showUserField = () => {
  const screen1 = document.getElementById("screen1");
  screen1.innerHTML = `
    <label for="email">Usuario:</label>
    <input type="text" id="email" placeholder="Introduce tu correo electrónico">
    <p id="error" style="color: red; display: none;">Correo incorrecto</p>
    <button id="validateButton">Entrar</button>
  `;

  const emailInput = document.getElementById("email");
  const errorMsg = document.getElementById("error");
  const validateButton = document.getElementById("validateButton");

  emailInput.addEventListener("blur", () => {
    validateEmail(emailInput, errorMsg);
  });

  validateButton.addEventListener("click", () => {
    if (validateEmail(emailInput, errorMsg)) {
      const lastVisit = saveUser(emailInput.value);
      currentUser = emailInput.value; // Establecer el usuario actual
      showScreen2(emailInput.value, lastVisit);
    }
  });
};

const validateEmail = (emailInput, errorMsg) => {
  const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
  if (!emailPattern.test(emailInput.value)) {
    errorMsg.style.display = "block";
    emailInput.select();
    return false;
  } else {
    errorMsg.style.display = "none";
    return true;
  }
};

const saveUser = (email) => {
  const now = new Date().toLocaleString();
  const usersData = JSON.parse(getCookie("users") || "{}");
  let lastVisit;

  if (usersData[email]) {
    lastVisit = 'La última vez que entró fue el ' + usersData[email];
  } else {
    lastVisit = 'Es la primera vez que entra';
  }

  // Actualizar datos del usuario
  usersData[email] = now;

  // Guardar los datos actualizados en la cookie
  document.cookie = `users=${encodeURIComponent(JSON.stringify(usersData))}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
  return lastVisit;
};

const showScreen2 = (email, lastVisit) => {
  document.body.innerHTML = `
    <div id="screen2" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <h1>Hola ${email}. ${lastVisit}.</h1>
      <button id="questionsButton">Preguntas</button>
    </div>
  `;

  document.getElementById("questionsButton").addEventListener("click", showScreen3);
};

const getCookie = (name) => {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

const showScreen3 = () => {
  document.body.innerHTML = `
    <div style="display: flex; justify-content: space-between; padding: 20px;">
      <div id="formContainer" style="width: 40%;">
        <label for="questionInput">Pregunta:</label>
        <input type="text" id="questionInput" style="width: 100%; margin-bottom: 10px;">

        <div style="margin-bottom: 10px;">
          <label>
            <input type="checkbox" name="answer" value="true"> Verdadero
          </label>
          <label>
            <input type="checkbox" name="answer" value="false"> Falso
          </label>
        </div>

        <label for="scoreInput">Puntuación:</label>
        <input type="text" id="scoreInput" style="width: 100%; margin-bottom: 10px;" maxlength="1">

        <div style="margin-top: 10px;">
          <button id="backButton">Atrás</button>
          <button id="saveButton" disabled>Grabar</button>
        </div>
      </div>

      <div id="questionsContainer" style="width: 55%;">
        <p id="loadingMessage">Cargando preguntas...</p>
        <table id="questionsTable" border="1" style="width: 100%; display: none;">
          <thead>
            <tr>
              <th>Pregunta</th>
              <th>Respuesta</th>
              <th>Puntuación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  `;

  loadQuestions(true);
  initializeFormHandlers();
};

const loadQuestions = (withDelay = false) => {
  const loadingMessage = document.getElementById("loadingMessage");
  const questionsTable = document.getElementById("questionsTable");

  const load = () => {
    const allQuestions = JSON.parse(getCookie("questions") || "{}");
    const userQuestions = allQuestions[currentUser] || [];
    const tableBody = questionsTable.querySelector("tbody");

    tableBody.innerHTML = userQuestions.map((q) => `
      <tr>
        <td>${q.question}</td>
        <td>${q.answer}</td>
        <td>${q.score}</td>
        <td>${q.status}</td>
      </tr>
    `).join("");

    loadingMessage.style.display = "none";
    questionsTable.style.display = "table";
  };

  if (withDelay) {
    setTimeout(load, 5000);
  } else {
    load();
  }
};

const initializeFormHandlers = () => {
  const questionInput = document.getElementById("questionInput");
  const scoreInput = document.getElementById("scoreInput");
  const saveButton = document.getElementById("saveButton");
  const backButton = document.getElementById("backButton");

  document.querySelectorAll("input[name='answer']").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      document.querySelectorAll("input[name='answer']").forEach((cb) => {
        if (cb !== e.target) cb.checked = false;
      });
    });
  });

  scoreInput.addEventListener("keypress", (e) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  });

  const validateForm = () => {
    const question = questionInput.value.trim();
    const answer = Array.from(document.querySelectorAll("input[name='answer']")).some(cb => cb.checked);
    const score = scoreInput.value.trim();
    saveButton.disabled = !(question && answer && score);
  };

  questionInput.addEventListener("input", validateForm);
  scoreInput.addEventListener("input", validateForm);
  document.querySelectorAll("input[name='answer']").forEach((cb) => cb.addEventListener("change", validateForm));

  saveButton.addEventListener("click", async () => {
    const question = questionInput.value.trim();
    const answer = document.querySelector("input[name='answer']:checked").value;
    const score = scoreInput.value.trim();

    const newQuestion = { question, answer, score, status: "Guardando..." };
    const allQuestions = JSON.parse(getCookie("questions") || "{}");
    const userQuestions = allQuestions[currentUser] || [];

    userQuestions.push(newQuestion);
    allQuestions[currentUser] = userQuestions;

    updateQuestionsTable(userQuestions);
    questionInput.value = "";
    scoreInput.value = "";
    document.querySelectorAll("input[name='answer']").forEach(cb => cb.checked = false);
    validateForm();
    backButton.disabled = true;

    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      newQuestion.status = "OK";
      document.cookie = `questions=${encodeURIComponent(JSON.stringify(allQuestions))}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
    } catch {
      newQuestion.status = "ERROR";
    } finally {
      updateQuestionsTable(userQuestions);
      if (!userQuestions.some(q => q.status === "Guardando...")) {
        backButton.disabled = false;
      }
    }
  });

  backButton.addEventListener("click", init);
};

const updateQuestionsTable = (userQuestions) => {
  const tableBody = document.getElementById("questionsTable").querySelector("tbody");
  tableBody.innerHTML = userQuestions.map((q) => `
    <tr>
      <td>${q.question}</td>
      <td>${q.answer}</td>
      <td>${q.score}</td>
      <td>${q.status}</td>
    </tr>
  `).join("");
};

// Inicializar la aplicación

init();
