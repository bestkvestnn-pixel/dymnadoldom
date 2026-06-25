import { caseFile } from "./case-data.js";
import { createAgentRuntime } from "./agent-engine.js";
import { canon } from "./canon-data.js";
import { createCanonKeeper } from "./canon-keeper.js";
import { createScenarioWriter } from "./scenario-writer.js";
import { createChapterArchitect } from "./chapter-architect.js";
import { createClueConstructor } from "./clue-constructor.js";
import { createDocumentPackageBuilder } from "./document-package-builder.js";
import { createDocumentGenerator } from "./document-generator.js";
import { createRealismEditor } from "./realism-editor.js";
import { createPlayerDocumentTester } from "./player-document-tester.js";
import { createInvestigationLogicAuditor } from "./investigation-logic-auditor.js";

const nodes = {
  caseTitle: document.querySelector("#caseTitle"),
  caseIntro: document.querySelector("#caseIntro"),
  caseTime: document.querySelector("#caseTime"),
  suspectCount: document.querySelector("#suspectCount"),
  suspectList: document.querySelector("#suspectList"),
  characterCount: document.querySelector("#characterCount"),
  characterList: document.querySelector("#characterList"),
  evidenceCount: document.querySelector("#evidenceCount"),
  evidenceList: document.querySelector("#evidenceList"),
  agentProfile: document.querySelector("#agentProfile"),
  dialogue: document.querySelector("#dialogue"),
  questionForm: document.querySelector("#questionForm"),
  questionInput: document.querySelector("#questionInput"),
  accuseSelect: document.querySelector("#accuseSelect"),
  accuseButton: document.querySelector("#accuseButton"),
  verdict: document.querySelector("#verdict"),
  resetGame: document.querySelector("#resetGame"),
  viewTabs: document.querySelectorAll("[data-view-tab]"),
  canonStatus: document.querySelector("#canonStatus"),
  canonAudit: document.querySelector("#canonAudit"),
  canonNodes: document.querySelector("#canonNodes"),
  canonLinks: document.querySelector("#canonLinks"),
  canonTheories: document.querySelector("#canonTheories"),
  writerStatus: document.querySelector("#writerStatus"),
  writerFoundation: document.querySelector("#writerFoundation"),
  writerChapters: document.querySelector("#writerChapters"),
  writerChain: document.querySelector("#writerChain"),
  writerSelfCheck: document.querySelector("#writerSelfCheck"),
  architectStatus: document.querySelector("#architectStatus"),
  architectQuestions: document.querySelector("#architectQuestions"),
  architectSuspicion: document.querySelector("#architectSuspicion"),
  architectMaterials: document.querySelector("#architectMaterials"),
  architectChecks: document.querySelector("#architectChecks"),
  clueStatus: document.querySelector("#clueStatus"),
  clueByChapter: document.querySelector("#clueByChapter"),
  clueFalseAndKey: document.querySelector("#clueFalseAndKey"),
  clueRevealMap: document.querySelector("#clueRevealMap"),
  clueQuality: document.querySelector("#clueQuality"),
  documentStatus: document.querySelector("#documentStatus"),
  documentPackages: document.querySelector("#documentPackages"),
  documentHiddenFacts: document.querySelector("#documentHiddenFacts"),
  documentTable: document.querySelector("#documentTable"),
  documentChecks: document.querySelector("#documentChecks"),
  generatorStatus: document.querySelector("#generatorStatus"),
  generatedDocuments: document.querySelector("#generatedDocuments"),
  generatedText: document.querySelector("#generatedText"),
  generatedHiddenFacts: document.querySelector("#generatedHiddenFacts"),
  generatedChecks: document.querySelector("#generatedChecks"),
  realismStatus: document.querySelector("#realismStatus"),
  realismDocuments: document.querySelector("#realismDocuments"),
  realismProblems: document.querySelector("#realismProblems"),
  realismChapters: document.querySelector("#realismChapters"),
  realismImprovements: document.querySelector("#realismImprovements"),
  playerTesterStatus: document.querySelector("#playerTesterStatus"),
  playerTesterNotes: document.querySelector("#playerTesterNotes"),
  playerTesterVersions: document.querySelector("#playerTesterVersions"),
  playerTesterSuspects: document.querySelector("#playerTesterSuspects"),
  playerTesterProblems: document.querySelector("#playerTesterProblems"),
  playerTesterRevealability: document.querySelector("#playerTesterRevealability"),
  logicStatus: document.querySelector("#logicStatus"),
  logicProofChain: document.querySelector("#logicProofChain"),
  logicSuspects: document.querySelector("#logicSuspects"),
  logicFalseVersions: document.querySelector("#logicFalseVersions"),
  logicAttack: document.querySelector("#logicAttack"),
  logicFinalAudit: document.querySelector("#logicFinalAudit")
};

const game = {
  selectedAgentId: caseFile.agents[0].id,
  runtimes: new Map(),
  openedEvidence: new Set(),
  canonKeeper: createCanonKeeper(canon),
  scenarioWriter: createScenarioWriter(canon),
  chapterArchitect: createChapterArchitect(canon),
  clueConstructor: null,
  documentPackageBuilder: null,
  documentGenerator: null,
  realismEditor: null,
  playerDocumentTester: null,
  investigationLogicAuditor: null
};

game.clueConstructor = createClueConstructor(canon, game.chapterArchitect);
game.documentPackageBuilder = createDocumentPackageBuilder(canon, game.clueConstructor);
game.documentGenerator = createDocumentGenerator(game.documentPackageBuilder);
game.realismEditor = createRealismEditor(game.documentGenerator);
game.playerDocumentTester = createPlayerDocumentTester(game.documentGenerator);
game.investigationLogicAuditor = createInvestigationLogicAuditor({
  canon,
  scenarioWriter: game.scenarioWriter,
  clueConstructor: game.clueConstructor,
  documentPackageBuilder: game.documentPackageBuilder,
  playerDocumentTester: game.playerDocumentTester
});

function boot() {
  caseFile.agents.forEach((agent) => {
    game.runtimes.set(agent.id, createAgentRuntime(agent, caseFile));
  });

  nodes.caseTitle.textContent = caseFile.title;
  nodes.caseIntro.textContent = caseFile.intro;
  nodes.caseTime.textContent = caseFile.time;
  nodes.suspectCount.textContent = `${caseFile.agents.length} агентов`;
  nodes.characterCount.textContent = `${canon.characters.length} персонажей`;
  nodes.evidenceCount.textContent = `${caseFile.evidence.length} улик`;

  renderCharacters();
  renderSuspects();
  renderEvidence();
  renderAccuseOptions();
  renderCanonKeeper();
  renderScenarioWriter();
  renderChapterArchitect();
  renderClueConstructor();
  renderDocumentPackageBuilder();
  renderDocumentGenerator();
  renderRealismEditor();
  renderPlayerDocumentTester();
  renderInvestigationLogicAuditor();
  switchView("investigation");
  selectAgent(game.selectedAgentId, true);
}

function renderCharacters() {
  nodes.characterList.replaceChildren(
    ...canon.characters.map((character) => {
      const article = document.createElement("article");
      article.className = "character-card";
      article.innerHTML = `
        <img src="${character.portrait}" alt="${character.fullName}" />
        <div class="character-content">
          <div>
            <p class="eyebrow">${character.status}</p>
            <h3>${character.fullName}</h3>
            <p class="character-meta">${character.age} лет · ${character.dateOfBirth}</p>
          </div>
          <p>${character.profession}</p>
          <p>${character.character}</p>
          <div class="character-facts">
            ${character.biography.slice(0, 4).map((fact) => `<span>${fact}</span>`).join("")}
          </div>
          <div class="character-links">
            ${renderCharacterConnections(character)}
          </div>
        </div>
      `;
      return article;
    })
  );
}

function renderCharacterConnections(character) {
  if (!character.connections?.length) return "<span>Связи пока не закреплены</span>";

  return character.connections
    .slice(0, 5)
    .map((connection) => {
      const target = canon.characters.find((item) => item.id === connection.targetId);
      const targetName = target?.fullName || connection.targetId;
      return `<span>${connection.type}: ${targetName}</span>`;
    })
    .join("");
}

function switchView(view) {
  const activeView = view === "characters" ? "characters" : "investigation";
  const directSections = document.querySelectorAll(".case-board > section");

  directSections.forEach((section) => {
    const isCharacters = section.classList.contains("characters-panel");
    section.hidden = activeView === "characters" ? !isCharacters : isCharacters;
  });

  nodes.viewTabs.forEach((tab) => {
    const isActive = tab.dataset.viewTab === activeView;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

nodes.viewTabs.forEach((tab) => {
  tab.addEventListener("click", () => switchView(tab.dataset.viewTab));
});

function renderSuspects() {
  nodes.suspectList.replaceChildren(
    ...caseFile.agents.map((agent) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "suspect-card";
      button.dataset.agentId = agent.id;
      button.innerHTML = `
        <span class="avatar">${agent.portrait ? `<img src="${agent.portrait}" alt="${agent.name}" />` : agent.name.slice(0, 1)}</span>
        <span>
          <strong>${agent.name}</strong>
          <small>${agent.role}</small>
        </span>
      `;
      button.addEventListener("click", () => selectAgent(agent.id));
      return button;
    })
  );
}

function renderEvidence() {
  nodes.evidenceList.replaceChildren(
    ...caseFile.evidence.map((item) => {
      const article = document.createElement("article");
      article.className = "evidence-card";
      article.tabIndex = 0;
      article.innerHTML = `
        ${item.preview ? `<img src="${item.preview}" alt="${item.title}" />` : ""}
        <h3>${item.title}</h3>
        <p>${item.detail}</p>
        <div>${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        ${item.asset ? `<a href="${item.asset}" target="_blank" rel="noreferrer">${item.assetLabel}</a>` : ""}
      `;
      article.addEventListener("click", () => {
        game.openedEvidence.add(item.id);
        article.classList.add("opened");
      });
      return article;
    })
  );
}

function renderAccuseOptions() {
  nodes.accuseSelect.replaceChildren(
    ...caseFile.agents.map((agent) => {
      const option = document.createElement("option");
      option.value = agent.id;
      option.textContent = agent.name;
      return option;
    })
  );
}

function selectAgent(agentId, opening = false) {
  game.selectedAgentId = agentId;
  const agent = getAgent(agentId);
  const state = game.runtimes.get(agentId).getState();

  document.querySelectorAll(".suspect-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.agentId === agentId);
  });

  nodes.agentProfile.innerHTML = `
    ${agent.portrait ? `<img class="profile-portrait" src="${agent.portrait}" alt="${agent.name}" />` : ""}
    <div>
      <p class="eyebrow">ИИ-агент</p>
      <h2>${agent.name}</h2>
      <p>${agent.role}. ${agent.temperament}.</p>
    </div>
    <div class="meters">
      <label>Напряжение <span data-meter="stress">${state.stress}%</span><progress max="100" value="${state.stress}"></progress></label>
      <label>Подозрение <span data-meter="suspicion">${state.suspicion}%</span><progress max="100" value="${state.suspicion}"></progress></label>
    </div>
  `;

  nodes.dialogue.replaceChildren();
  if (state.memory.length === 0 || opening) {
    askAgent(caseFile.openingQuestion, true);
  } else {
    state.memory.forEach((entry) => {
      addLine("detective", entry.question);
      addLine("agent", entry.reply);
    });
  }

  nodes.questionInput.focus();
}

function askAgent(question, silentQuestion = false) {
  const agent = getAgent(game.selectedAgentId);
  const result = game.runtimes.get(agent.id).answer(question);

  if (!silentQuestion) {
    addLine("detective", question);
  }
  addLine("agent", result.reply, result.tell);
  updateMeters(result.stress, result.suspicion);
}

function addLine(author, text, tell = null) {
  const line = document.createElement("article");
  line.className = `line ${author}`;
  line.innerHTML = `
    <strong>${author === "detective" ? "Детектив" : getAgent(game.selectedAgentId).name}</strong>
    <p>${text}</p>
    ${tell ? `<small>Поведенческая зацепка: ${tell}.</small>` : ""}
  `;
  nodes.dialogue.append(line);
  nodes.dialogue.scrollTop = nodes.dialogue.scrollHeight;
}

function updateMeters(stress, suspicion) {
  nodes.agentProfile.querySelectorAll("progress")[0].value = stress;
  nodes.agentProfile.querySelectorAll("progress")[1].value = suspicion;
  nodes.agentProfile.querySelector('[data-meter="stress"]').textContent = `${stress}%`;
  nodes.agentProfile.querySelector('[data-meter="suspicion"]').textContent = `${suspicion}%`;
}

function getAgent(agentId) {
  return caseFile.agents.find((agent) => agent.id === agentId);
}

function normalizePersonName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9]+/g, " ")
    .trim();
}

function findPersonByName(name) {
  const normalized = normalizePersonName(name);
  if (!normalized) return null;

  const people = [
    ...caseFile.agents.map((agent) => ({ name: agent.name, portrait: agent.portrait })),
    ...canon.characters.map((character) => ({ name: character.fullName, portrait: character.portrait }))
  ];

  return people.find((person) => {
    const personName = normalizePersonName(person.name);
    return personName === normalized || personName.includes(normalized) || normalized.includes(personName);
  });
}

function personCell(name) {
  const person = findPersonByName(name);
  if (!person?.portrait) return name;

  return `
    <span class="person-cell">
      <img src="${person.portrait}" alt="${name}" />
      <span>${name}</span>
    </span>
  `;
}

nodes.questionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const question = nodes.questionInput.value.trim();
  if (!question) return;

  askAgent(question);
  nodes.questionInput.value = "";
});

nodes.accuseButton.addEventListener("click", () => {
  const accusedId = nodes.accuseSelect.value;
  const isCorrect = accusedId === caseFile.culpritId;
  nodes.verdict.className = `verdict ${isCorrect ? "success" : "failure"}`;
  nodes.verdict.textContent = isCorrect
    ? "Верно. Анну убил Виктор Иванов. Сергей виновен в смерти Вероники, но не является убийцей Анны."
    : "Пока нет. У этого человека есть секрет, но цепочка улик не ведет к убийству.";
});

nodes.resetGame.addEventListener("click", () => {
  game.runtimes.clear();
  game.openedEvidence.clear();
  nodes.verdict.textContent = "";
  nodes.verdict.className = "verdict";
  boot();
});

boot();

function renderCanonKeeper() {
  const audit = game.canonKeeper.audit();
  const board = game.canonKeeper.buildBoard();
  const totalProblems = audit.critical.length + audit.medium.length + audit.potential.length;

  nodes.canonStatus.textContent =
    audit.critical.length > 0 ? `${audit.critical.length} критических` : `${totalProblems} замечаний`;

  nodes.canonAudit.replaceChildren(
    renderIssueGroup("Критические ошибки", audit.critical),
    renderIssueGroup("Средние ошибки", audit.medium),
    renderIssueGroup("Незначительные ошибки", audit.minor),
    renderIssueGroup("Потенциальные проблемы", audit.potential)
  );

  nodes.canonNodes.replaceChildren(
    table(
      ["Узел", "Тип", "Статус", "Краткое описание"],
      board.nodes.slice(0, 12).map((node) => [node.label, node.type, node.status, node.description])
    )
  );

  nodes.canonLinks.replaceChildren(
    table(
      ["Откуда", "Тип связи", "Куда", "Статус"],
      board.links.slice(0, 10).map((link) => [link.from, link.type, link.to, link.status])
    )
  );

  nodes.canonTheories.replaceChildren(
    ...board.theories.map((theory) => {
      const item = document.createElement("section");
      item.className = "canon-item";
      item.innerHTML = `
        <strong>${theory.title}</strong>
        <span>${theory.status}</span>
        <p>Подтверждает: ${theory.supports.join(", ")}.</p>
        <p>Мешает: ${theory.blockers.join(", ")}.</p>
      `;
      return item;
    }),
    ...board.redHerrings.map((trail) => {
      const item = document.createElement("section");
      item.className = "canon-item red-herring";
      item.innerHTML = `
        <strong>Ложный след: ${trail.title}</strong>
        <span>ведет к ${trail.leadsTo}</span>
        <p>${trail.whyWorks}</p>
        <p>Опровергается: ${trail.disprovedBy}</p>
      `;
      return item;
    })
  );
}

function renderIssueGroup(title, issues) {
  const group = document.createElement("section");
  group.className = "canon-item";
  const issueText =
    issues.length > 0
      ? issues.map((item) => `<li><strong>${item.source}</strong>: ${item.detail}</li>`).join("")
      : "<li>Нет замечаний.</li>";
  group.innerHTML = `<strong>${title}</strong><ul>${issueText}</ul>`;
  return group;
}

function table(headers, rows) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <table>
      <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  `;
  return wrapper.firstElementChild;
}

function renderScenarioWriter() {
  const foundation = game.scenarioWriter.buildCaseFoundation();
  const chapters = game.scenarioWriter.buildChapterPlan();
  const chain = game.scenarioWriter.buildDeductionChain();
  const selfCheck = game.scenarioWriter.runSelfCheck();
  const negativeChecks = selfCheck.filter((item) => !item.passed).length;

  nodes.writerStatus.textContent = negativeChecks > 0 ? `${negativeChecks} доработки` : "готово";

  nodes.writerFoundation.replaceChildren(
    card("Преступление", [
      `Что: ${foundation.crime.what}`,
      `Где: ${foundation.crime.where}`,
      `Когда: ${foundation.crime.when}`,
      `Способ: ${foundation.crime.method}`,
      `Виновен: ${foundation.crime.culprit}`,
      `Почему: ${foundation.crime.why}`
    ]),
    card(
      "Скрытая хронология",
      foundation.hiddenTimeline.map((item) => `${item.period}: ${item.truth} (${item.status})`)
    )
  );

  nodes.writerChapters.replaceChildren(
    ...chapters.map((chapter) =>
      card(chapter.title, [
        `Цель: ${chapter.goal}`,
        `Материалы: ${chapter.materials.join(", ")}`,
        `Новые факты: ${chapter.facts.join(", ")}`,
        `Новые версии: ${chapter.newVersions.join(", ")}`,
        `Разрушенные версии: ${chapter.brokenVersions.join(", ")}`,
        `К следующей главе: ${chapter.nextQuestions.join(" ")}`
      ])
    )
  );

  nodes.writerChain.replaceChildren(
    table(
      ["Улика", "Вывод", "Новая улика", "Новый вывод"],
      chain.map((item) => [item.clue, item.conclusion, item.nextClue, item.nextConclusion])
    )
  );

  nodes.writerSelfCheck.replaceChildren(
    ...selfCheck.map((item) => card(item.question, [`Ответ: ${item.answer}`, item.note]))
  );
}

function card(title, lines) {
  const item = document.createElement("section");
  item.className = "canon-item";
  item.innerHTML = `<strong>${title}</strong><ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul>`;
  return item;
}

function renderChapterArchitect() {
  const architectures = game.chapterArchitect.buildArchitectures();
  const failedChecks = architectures.flatMap((chapter) => chapter.check).filter((check) => !check.passed).length;

  nodes.architectStatus.textContent = failedChecks > 0 ? `${failedChecks} доработки` : "готово";

  nodes.architectQuestions.replaceChildren(
    ...architectures.map((chapter) =>
      card(chapter.title, [
        `Главный вопрос: ${chapter.mainQuestion}`,
        `Темп: ${chapter.tempo}`,
        `До главы: ${chapter.beforeAfter.before}`,
        `После главы: ${chapter.beforeAfter.after}`,
        `Открытие финала: ${chapter.finale.learned}`,
        `Два новых вопроса: ${chapter.nextChapter.questions.join(" ")}`
      ])
    )
  );

  nodes.architectSuspicion.replaceChildren(
    table(
      ["Глава", "Персонаж / версия", "До", "После"],
      architectures.flatMap((chapter) => chapter.suspicion.map((row) => [chapter.title, row[0], row[1], row[2]]))
    )
  );

  nodes.architectMaterials.replaceChildren(
    ...architectures.map((chapter) =>
      card(
        chapter.title,
        chapter.materials.map(
          (item) => `${item.name}: ${item.function}. Игрок видит: ${item.visibleFact} Скрытая функция: ${item.hiddenFunction}`
        )
      )
    )
  );

  nodes.architectChecks.replaceChildren(
    ...architectures.map((chapter) =>
      card(chapter.title, [
        `Подтверждения: ${chapter.informationBalance.confirmations.join(", ")}`,
        `Предположения: ${chapter.informationBalance.assumptions.join(", ")}`,
        `Неизвестное: ${chapter.informationBalance.unknowns.join(", ")}`,
        `Материалы следующей главы: ${chapter.nextChapter.materialsToCreate.join(", ")}`,
        `Проверка: ${chapter.check.map((check) => `${check.question} ${check.answer}`).join("; ")}`
      ])
    )
  );
}

function renderClueConstructor() {
  const clueSystem = game.clueConstructor.buildClueSystem();
  const suspectMatrix = game.clueConstructor.buildSuspectClueMatrix();
  const quality = game.clueConstructor.runQualityCheck();
  const failed = quality.filter((item) => item.status !== "рабочая").length;

  nodes.clueStatus.textContent = failed > 0 ? `${failed} доработки` : "готово";

  nodes.clueByChapter.replaceChildren(
    ...clueSystem.map((chapter) =>
      card(
        chapter.chapterTitle,
        chapter.clues.map(
          (clue) =>
            `${clue.title} (${clue.type}, ${clue.category}): сначала игрок думает: ${clue.firstThought}; позже понимает: ${clue.playerLaterUnderstands}`
        )
      )
    )
  );

  nodes.clueFalseAndKey.replaceChildren(
    ...clueSystem.map((chapter) =>
      card(chapter.chapterTitle, [
        `Ключевые: ${chapter.keyClues.join(", ")}`,
        `Ложные: ${chapter.falseClues.map((clue) => `${clue.title} → ${clue.leadsTo}; разоблачается: ${clue.playerCanKnowWhen}`).join(" | ")}`
      ])
    )
  );

  nodes.clueRevealMap.replaceChildren(
    table(
      ["Глава", "Улика", "Вывод", "Следующая улика", "Новый вывод"],
      clueSystem.flatMap((chapter) =>
        chapter.revealMap.map((step) => [
          chapter.chapterTitle,
          step.clue,
          step.conclusion,
          step.nextClue,
          step.newConclusion
        ])
      )
    )
  );

  nodes.clueQuality.replaceChildren(
    card(
      "Матрица подозреваемых",
      suspectMatrix.map(
        (suspect) =>
          `${personCell(suspect.name)} против — ${suspect.against.join(", ")}; в пользу — ${suspect.inFavor.join(", ")}; ложное подозрение — ${suspect.falseSuspicion}`
      )
    ),
    card(
      "Проверка качества",
      quality.slice(0, 10).map(
        (item) =>
          `${item.chapter} / ${item.clue}: ${item.status}; функция: ${item.hasFunction ? "да" : "нет"}; логический вывод: ${item.logicalInference ? "да" : "нет"}`
      )
    )
  );
}

function renderDocumentPackageBuilder() {
  const packages = game.documentPackageBuilder.buildPackages();
  const placements = game.documentPackageBuilder.buildPlacementOptions();
  const checks = game.documentPackageBuilder.runPackageChecks();
  const failed = checks.filter((item) => item.status !== "готов").length;

  nodes.documentStatus.textContent = failed > 0 ? `${failed} доработки` : "готово";

  nodes.documentPackages.replaceChildren(
    ...packages.map((pkg) =>
      card(pkg.chapterTitle, [
        `Цель: ${pkg.goal}`,
        `Ключевые: ${pkg.documents.filter((doc) => doc.role === "ключевой").map((doc) => doc.title).join(", ")}`,
        `Ложные: ${pkg.documents.filter((doc) => doc.role === "ложный").map((doc) => doc.title).join(", ") || "нет"}`,
        `Перекрестные связи: ${pkg.crossLinks.join(" | ")}`,
        `Истинные выводы: ${pkg.trueConclusions.join(", ")}`,
        `Ложные выводы: ${pkg.falseConclusions.join(", ")}`
      ])
    )
  );

  nodes.documentHiddenFacts.replaceChildren(
    ...packages.map((pkg) =>
      card(
        pkg.chapterTitle,
        pkg.hiddenFacts.map(
          (fact) =>
            `${fact.fact}: скрыт в "${fact.whereHidden}", заметность — ${fact.visibility}. Вывод игрока: ${fact.targetConclusion}`
        )
      )
    )
  );

  nodes.documentTable.replaceChildren(
    table(
      ["Глава", "Документ", "Тип", "Роль", "Автор", "Функция"],
      packages.flatMap((pkg) =>
        pkg.documents.map((doc) => [
          pkg.chapterTitle,
          doc.title,
          doc.type,
          doc.role,
          doc.author,
          doc.gameFunction
        ])
      )
    )
  );

  nodes.documentChecks.replaceChildren(
    card(
      "Варианты размещения ключевых улик",
      placements.map((item) => `${item.clue}: ${item.variants.join(", ")}`)
    ),
    card(
      "Самопроверка пакетов",
      checks.map(
        (item) =>
          `${item.chapter}: ${item.status}; функции: ${item.noFunctionlessDocuments ? "да" : "нет"}; 2+ источника: ${item.noSingleSourceKeyFacts ? "да" : "нет"}; связи: ${item.documentsCanBeLinked ? "да" : "нет"}`
      )
    )
  );
}

function renderDocumentGenerator() {
  const packages = game.documentGenerator.generateDocuments();
  const checks = game.documentGenerator.runDocumentChecks();
  const failed = checks.filter((item) => item.status !== "готов").length;
  const firstDocument = packages[0].documents[0];

  nodes.generatorStatus.textContent = failed > 0 ? `${failed} доработки` : "готово";

  nodes.generatedDocuments.replaceChildren(
    ...packages.map((pkg) =>
      card(
        pkg.chapterTitle,
        pkg.documents.map((doc) => `${doc.title}: ${doc.type}; автор — ${doc.author}; дата — ${doc.date}`)
      )
    )
  );

  nodes.generatedText.textContent = firstDocument.body;

  nodes.generatedHiddenFacts.replaceChildren(
    card(
      `${firstDocument.title}: скрытые факты`,
      firstDocument.hiddenFacts.map((item) => `${item.fact} (${item.visibility})`)
    ),
    card("Игровая функция", [firstDocument.gameFunction])
  );

  nodes.generatedChecks.replaceChildren(
    ...packages.map((pkg) =>
      card(
        pkg.chapterTitle,
        checks
          .filter((item) => item.chapter === pkg.chapterTitle)
          .map(
            (item) =>
              `${item.document}: ${item.status}; реалистичность: ${item.looksReal ? "да" : "нет"}; не подсказка: ${item.notAHint ? "да" : "нет"}; переосмысление: ${item.hasLaterReinterpretation ? "да" : "нет"}`
          )
      )
    )
  );
}

function renderRealismEditor() {
  const documentReports = game.realismEditor.auditDocuments();
  const chapterReports = game.realismEditor.auditChapters();
  const artificiality = game.realismEditor.findArtificiality();
  const averageScore = Math.round(documentReports.reduce((sum, report) => sum + report.score, 0) / documentReports.length);

  nodes.realismStatus.textContent = `${averageScore}/10`;

  nodes.realismDocuments.replaceChildren(
    table(
      ["Документ", "Оценка", "Вердикт", "Форма", "Язык", "Избыточность"],
      documentReports.map((report) => [
        report.document,
        `${report.score}/10`,
        report.verdict,
        report.formRealism ? "да" : "нет",
        report.languageRealism ? "да" : "нет",
        report.excessRealism ? "да" : "нет"
      ])
    )
  );

  nodes.realismProblems.replaceChildren(
    ...documentReports.map((report) =>
      card(report.document, [
        `Реалистично: ${report.realisticStrengths.join("; ")}`,
        `Искусственно: ${report.artificialProblems.length > 0 ? report.artificialProblems.join("; ") : "явных проблем нет"}`,
        `Что заметит игрок: ${report.playerMayNotice.join("; ")}`
      ])
    )
  );

  nodes.realismChapters.replaceChildren(
    ...chapterReports.map((report) =>
      card(report.chapter, [
        `Итоговая оценка главы: ${report.verdict} (${report.averageScore}/10)`,
        `Документы: ${report.documentRealism ? "реалистичны" : "требуют правки"}`,
        `Персонажи: ${report.characterRealism ? "голоса различимы" : "голоса похожи"}`,
        `Улики: ${report.clueRealism ? "могут существовать" : "есть искусственные связки"}`,
        `Расследование: ${report.investigationRealism ? "процессы правдоподобны" : "есть процессуальные вопросы"}`
      ])
    )
  );

  nodes.realismImprovements.replaceChildren(
    card(
      "Рекомендации",
      artificiality.length > 0
        ? artificiality.map((item) => `${item.document}: ${item.problem}. Лучше: ${item.alternative}`)
        : ["Критических авторских подсказок и игровых штампов не найдено."]
    ),
    ...documentReports.map((report) => card(`${report.document}: как улучшить`, report.improvements))
  );
}

function renderPlayerDocumentTester() {
  const chapterTests = game.playerDocumentTester.testChapters();
  const documentNotes = game.playerDocumentTester.testDocuments();
  const revealability = game.playerDocumentTester.testRevealability();
  const averageFairness = Math.round(
    chapterTests.reduce((sum, chapter) => sum + chapter.evaluation.fairness, 0) / chapterTests.length
  );

  nodes.playerTesterStatus.textContent = `${averageFairness}/10 справедливость`;

  nodes.playerTesterNotes.replaceChildren(
    ...documentNotes.slice(0, 6).map((note) =>
      card(note.document, [
        `Что понял: ${note.understood.join("; ")}`,
        `Что удивило: ${note.surprising.join("; ")}`,
        `Может быть важно: ${note.maybeImportant.join("; ") || "явных зацепок нет"}`,
        `Вопросы: ${note.questions.join("; ")}`
      ])
    )
  );

  nodes.playerTesterVersions.replaceChildren(
    ...chapterTests.map((chapter) =>
      card(chapter.chapterTitle, [
        `Основная версия: ${chapter.versions.main}`,
        `Альтернативы: ${chapter.versions.alternatives.join(" | ")}`,
        `Что понял: ${chapter.understood.join("; ")}`,
        `Что не понял: ${chapter.notUnderstood.join("; ") || "нет явного пробела"}`
      ])
    )
  );

  nodes.playerTesterSuspects.replaceChildren(
    table(
      ["Глава", "Персонаж", "Подозрительность", "Почему"],
      chapterTests.flatMap((chapter) =>
        chapter.suspects.slice(0, 4).map((suspect) => [
          chapter.chapterTitle,
          personCell(suspect.name),
          suspect.score,
          suspect.reason
        ])
      )
    )
  );

  nodes.playerTesterProblems.replaceChildren(
    ...chapterTests.map((chapter) =>
      card(chapter.chapterTitle, [
        `Где застрял: ${chapter.stuckPoints.join("; ") || "явного тупика нет"}`,
        `Слишком очевидно: ${chapter.evaluation.tooObvious.join("; ") || "нет"}`,
        `Слишком спрятано: ${chapter.evaluation.tooHidden.join("; ") || "нет"}`,
        `Ложные акценты: ${chapter.falseAccents.join("; ") || "нет"}`,
        `Полезные документы: ${chapter.usefulDocuments.join(", ") || "нет"}`,
        `Бесполезные документы: ${chapter.uselessDocuments.join(", ") || "нет"}`
      ])
    )
  );

  nodes.playerTesterRevealability.replaceChildren(
    card("Проверка раскрываемости", [
      `Могу назвать убийцу: ${revealability.canNameKiller ? "да" : "нет"}`,
      `Могу объяснить мотив: ${revealability.canExplainMotive ? "да" : "нет"}`,
      `Могу объяснить способ: ${revealability.canExplainMethod ? "да" : "нет"}`,
      `Могу объяснить все важные улики: ${revealability.canExplainAllImportantClues ? "да" : "нет"}`,
      `Недостает: ${revealability.missingInformation.join("; ")}`
    ]),
    ...chapterTests.map((chapter) =>
      card(`Оценка: ${chapter.chapterTitle}`, [
        `Интерес: ${chapter.evaluation.interest}/10`,
        `Понятность: ${chapter.evaluation.clarity}/10`,
        `Справедливость: ${chapter.evaluation.fairness}/10`,
        `Перегруженность: ${chapter.evaluation.overload}/10`,
        `Сложность: ${chapter.evaluation.difficulty}`,
        `Состояние игрока: ${chapter.savedState.currentVersion}; уверенность — ${chapter.savedState.confidence}`
      ])
    )
  );
}

function renderInvestigationLogicAuditor() {
  const proofChain = game.investigationLogicAuditor.auditProofChain();
  const suspects = game.investigationLogicAuditor.auditSuspects();
  const falseVersions = game.investigationLogicAuditor.auditFalseVersions();
  const timeline = game.investigationLogicAuditor.auditTimeline();
  const attack = game.investigationLogicAuditor.attackInvestigation();
  const finalAccusation = game.investigationLogicAuditor.auditFinalAccusation();
  const finalAudit = game.investigationLogicAuditor.runFinalAudit();

  nodes.logicStatus.textContent = `${finalAudit.score}/100`;

  nodes.logicProofChain.replaceChildren(
    table(
      ["Факт", "Документы", "Вывод", "Альтернатива", "Статус"],
      proofChain.map((step) => [
        step.fact,
        step.documents.join(", ") || "нет источников",
        step.conclusion,
        step.alternativeExplanation,
        step.status
      ])
    )
  );

  nodes.logicSuspects.replaceChildren(
    table(
      ["Подозреваемый", "Можно исключить", "Можно обвинить", "Статус"],
      suspects.map((suspect) => [
        personCell(suspect.suspect),
        suspect.canExclude ? "да" : "нет",
        suspect.canAccuse ? "да" : "нет",
        suspect.status
      ])
    )
  );

  nodes.logicFalseVersions.replaceChildren(
    ...falseVersions.map((version) =>
      card(version.title, [
        `Почему игрок верит: ${version.whyPlayerBelieves}`,
        `Что опровергает: ${version.disproof}`,
        `Когда: ${version.when}`,
        `Статус: ${version.status}`
      ])
    ),
    card("Временная логика", [
      `Вердикт: ${timeline.verdict}`,
      `Невозможные или незакрепленные перемещения: ${timeline.impossibleMovements.join(", ") || "нет"}`,
      `События: ${timeline.fullTimeline.map((item) => `${item.period}: ${item.logicProblem}`).join("; ")}`
    ])
  );

  nodes.logicAttack.replaceChildren(
    card("Режим атаки", [
      `Альтернативный виновный: ${attack.alternativeCulprit}`,
      `Альтернативная версия: ${attack.alternativeVersion}`,
      `Иные трактовки: ${attack.reinterpretations.join("; ")}`,
      `Результат: ${attack.result}`
    ]),
    card("Финальное обвинение", [
      finalAccusation.accusation,
      `Сила обвинения: ${finalAccusation.strength}/10`,
      `Статус: ${finalAccusation.status}`,
      `Слабые места защиты: ${finalAccusation.defenseArguments.join("; ")}`
    ])
  );

  nodes.logicFinalAudit.replaceChildren(
    card("Итоговый аудит", [
      `Раскрываемость: ${finalAudit.revealability}`,
      `Ответ на главный вопрос: ${finalAudit.mainQuestionAnswer}`,
      `Сложность: ${finalAudit.difficulty}`,
      `Вердикт: ${finalAudit.verdict}`,
      `Критические ошибки: ${finalAudit.criticalErrors.join("; ") || "нет"}`,
      `Серьезные ошибки: ${finalAudit.seriousErrors.join("; ") || "нет"}`,
      `Незначительные ошибки: ${finalAudit.minorErrors.join("; ") || "нет"}`,
      `Сильные стороны: ${finalAudit.strengths.join("; ")}`
    ])
  );
}
