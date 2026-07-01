import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { caseFile } from "../src/case-data.js";
import { createAgentRuntime, detectIntent } from "../src/agent-engine.js";
import { canon } from "../src/canon-data.js";
import { createCanonKeeper } from "../src/canon-keeper.js";
import { createScenarioWriter } from "../src/scenario-writer.js";
import { createChapterArchitect } from "../src/chapter-architect.js";
import { createClueConstructor } from "../src/clue-constructor.js";
import { createDocumentPackageBuilder } from "../src/document-package-builder.js";
import { createDocumentGenerator } from "../src/document-generator.js";
import { createRealismEditor } from "../src/realism-editor.js";
import { createPlayerDocumentTester } from "../src/player-document-tester.js";
import { createInvestigationLogicAuditor } from "../src/investigation-logic-auditor.js";
import {
  createMachiningTechnologistAgent,
  detectMode as detectMachiningMode
} from "../src/machining-technologist-agent.js";

assert.equal(detectIntent("Где вы были во время отключения?"), "alibi");
assert.equal(detectIntent("Зачем вам был нужен мотив?"), "motive");
assert.equal(detectIntent("Что вы знаете про KAPNOS и рецепт?"), "evidence");
assert.equal(detectIntent("Вы лжете, признайтесь"), "pressure");

const machiningAgent = createMachiningTechnologistAgent();
assert.equal(machiningAgent.name, "Инженер-технолог цеха механической обработки");
assert.ok(machiningAgent.systemPrompt.includes("не выдумывай точные размеры"));
assert.ok(machiningAgent.systemPrompt.includes("Используй только инструмент"));
assert.ok(machiningAgent.allowedToolCatalogs.some((catalog) => catalog.file.includes("К 20-43-87")));
assert.equal(detectMachiningMode("создай ии агента"), "data-request");
assert.equal(detectMachiningMode("Сделай технологию для детали 100×60×20 мм из стали 45"), "full-process");
assert.equal(detectMachiningMode("Подбери режимы резания для сверления отверстия Ø8"), "cutting-modes");
assert.equal(detectMachiningMode("Оформи комплект документов по ГОСТ для детали 100х60х20 мм"), "gost-document-set");

const machiningDataRequest = machiningAgent.buildResponsePlan("нужно что-то изготовить");
assert.equal(machiningDataRequest.mode, "data-request");
assert.ok(machiningDataRequest.questions.some((question) => question.includes("габаритные размеры")));

const machiningFullPlan = machiningAgent.buildResponsePlan("Сделай технологию для плиты 100х60х20 мм");
assert.equal(machiningFullPlan.mode, "full-process");
assert.ok(machiningFullPlan.requiredSections.includes("Маршрутная карта"));
assert.ok(machiningFullPlan.requiredSections.includes("Карта контроля"));

const machiningGostPlan = machiningAgent.buildResponsePlan("Сделай по форме как в примерах для детали 100х60х20 мм");
assert.equal(machiningGostPlan.mode, "gost-document-set");
assert.ok(machiningGostPlan.requiredSections.includes("Маршрутная карта со строками А/Б/О/Т/Р"));

const sergey = caseFile.agents.find((agent) => agent.id === "sergey");
assert.ok(caseFile.agents.every((agent) => agent.portrait?.startsWith("./public/assets/")));
assert.ok(
  caseFile.agents.every((agent) =>
    fs.existsSync(path.join(process.cwd(), agent.portrait.replace(/^\.\//, "")))
  )
);
assert.equal(caseFile.agents.find((agent) => agent.id === "viktor").portrait, "./public/assets/viktor-ivanov.png");
assert.equal(caseFile.agents.find((agent) => agent.id === "pavel").portrait, "./public/assets/pavel-levin.jpg");
assert.equal(caseFile.agents.find((agent) => agent.id === "kristina").portrait, "./public/assets/kristina-fomina.png");
const runtime = createAgentRuntime(sergey, caseFile);

const calmAnswer = runtime.answer("Где вы были?");
assert.ok(calmAnswer.reply.includes("главном убийстве"));
assert.equal(calmAnswer.memory.length, 1);

const pressuredAnswer = runtime.answer("Вероника, рубашка, Тихонов, Анна. Вы лжете?");
assert.ok(pressuredAnswer.stress > calmAnswer.stress);
assert.ok(pressuredAnswer.suspicion > calmAnswer.suspicion);

const keeper = createCanonKeeper(canon);
assert.ok(canon.constitution.coreIdea.includes("ложных связей"));
assert.equal(canon.constitution.truthLevels.length, 3);
assert.ok(canon.constitution.materialGate.some((rule) => rule.includes("абсолютное алиби")));
assert.equal(canon.accessMap.levels.length, 5);
assert.ok(canon.accessMap.canonAdaptation.includes("калитку"));
assert.ok(canon.accessMap.keyTable.some((item) => item.code === "1-Ф" && item.material.includes("Вероники")));
assert.ok(canon.accessMap.keyTable.some((item) => item.code === "2И" && item.material.includes("наклейка")));
assert.ok(canon.accessMap.chapters[1].finalQuestions.some((question) => question.includes("немедленного осуждения Виктора")));
assert.equal(canon.characters.length, 24);
assert.ok(canon.characters.every((character) => Number.isInteger(character.age) || character.age === null));
assert.ok(canon.characters.every((character) => /^\d{2}\.\d{2}\.\d{4}$/.test(character.dateOfBirth) || character.dateOfBirth === "не закреплена"));
assert.ok(canon.characters.every((character) => character.fullName.trim().split(/\s+/).length >= 2));
assert.ok(canon.characters.every((character) => !character.portrait || character.portrait.startsWith("./public/assets/")));
assert.ok(canon.characters.some((character) => character.fullName === "Акунина Анна Петровна" && character.dateOfBirth === "17.05.1983"));
assert.ok(canon.characters.some((character) => character.fullName === "Иванов Виктор Ильич" && character.dateOfBirth === "08.01.1988"));
assert.ok(canon.characters.some((character) => character.fullName === "Кристина Денисовна Орлова"));
assert.ok(canon.characters.some((character) => character.fullName === "Соколов Олег Петрович"));
assert.ok(canon.characters.some((character) => character.fullName === "Инна Валерьевна Белова"));
assert.ok(canon.characters.some((character) => character.fullName === "Дмитрий Павлович Назаров"));
assert.ok(canon.characters.some((character) => character.fullName === "Илья Лонцов" && character.age === null));
assert.ok(canon.characters.some((character) => character.fullName === "Николай Иванов" && character.age === null));
assert.ok(canon.characters.some((character) => character.fullName === "Оксана Иванова" && character.age === null));
assert.ok(canon.investigationPersonnel.some((person) => person.fullName === "Пётр Андреевич Железнов"));
assert.ok(canon.forensicCases.some((item) => item.victim === "Алексей Сергеевич Морозов" && item.deathDate === "13.04.2025"));
assert.ok(canon.forensicCases.some((item) => item.victim === "Анна Петровна Акунина" && item.deathDate === "03.09.2025"));
const audit = keeper.audit();
assert.ok(Array.isArray(audit.critical));
assert.ok(!audit.potential.some((item) => item.title.includes("Возраст")));

const board = keeper.buildBoard();
assert.ok(board.nodes.some((node) => node.label === "Сергей Андреевич Акунин"));
assert.ok(board.nodes.some((node) => node.label === "Иванов Виктор Ильич"));
assert.equal(board.nodes.find((node) => node.id === "viktor").portrait, "./public/assets/viktor-ivanov.png");
assert.ok(board.theories.some((theory) => theory.id === "viktor-serial-killer"));
assert.ok(board.redHerrings.some((trail) => trail.id === "krylov-series"));

const sergeyAnswer = keeper.answerQuestion("Какие улики ведут к Сергею?");
assert.ok(sergeyAnswer.some((line) => line.includes("burned-shirt")));

const writer = createScenarioWriter(canon);
const foundation = writer.buildCaseFoundation();
assert.equal(foundation.crime.culprit, "Иванов Виктор Ильич.");
assert.ok(foundation.hiddenTimeline.some((item) => item.truth.includes("рассказ Натальи")));

const chapters = writer.buildChapterPlan();
assert.equal(chapters.length, 3);
assert.ok(chapters[0].newVersions.includes("Сергей убил Анну"));
assert.ok(chapters[2].newVersions.some((version) => version.includes("нового расследования")));

const chain = writer.buildDeductionChain();
assert.ok(chain.some((step) => step.conclusion.includes("серийный маркер")));

const selfCheck = writer.runSelfCheck();
assert.ok(selfCheck.some((item) => item.answer === "требует доработки"));

const architect = createChapterArchitect(canon);
const architectures = architect.buildArchitectures();
assert.equal(architectures.length, 3);
assert.equal(architectures[0].mainQuestion, "Сергей убил Анну или скрывает другое преступление?");
assert.ok(architectures[0].suspicion.some((row) => row[0] === "Сергей"));
assert.ok(architectures[1].materials.some((item) => item.name === "Рецепт на очки"));
assert.ok(architectures.every((chapter) => chapter.nextChapter.questions.length >= 1));
assert.ok(architectures.flatMap((chapter) => chapter.check).every((check) => check.passed));

const clueConstructor = createClueConstructor(canon, architect);
const clueSystem = clueConstructor.buildClueSystem();
assert.equal(clueSystem.length, 3);
assert.ok(clueSystem[1].keyClues.includes("Рецепт на очки с подписью Иванов В.И."));
assert.ok(clueSystem[1].falseClues.some((clue) => clue.title === "Сигарета у Крылова"));
assert.ok(clueSystem[2].revealMap.some((step) => step.clue === "Сводка KAPNOS"));

const suspectClues = clueConstructor.buildSuspectClueMatrix();
assert.ok(suspectClues.every((suspect) => suspect.against.length >= 3));
assert.ok(suspectClues.every((suspect) => suspect.inFavor.length >= 2));

const clueQuality = clueConstructor.runQualityCheck();
assert.ok(clueQuality.every((item) => item.status === "рабочая"));

const documentBuilder = createDocumentPackageBuilder(canon, clueConstructor);
const packages = documentBuilder.buildPackages();
assert.equal(packages.length, 3);
assert.ok(packages[0].documents.some((doc) => doc.title === "Реестр материалов, переданных стороне защиты"));
assert.ok(packages[1].documents.some((doc) => doc.title === "Рецепт на очки Морозова"));
assert.ok(packages[2].documents.some((doc) => doc.title === "Показания Натальи об отпуске Виктора"));
assert.ok(packages.every((pkg) => pkg.hiddenFacts.every((fact) => fact.sources.length >= 2)));
assert.ok(packages[2].crossLinks.some((link) => link.includes("Акт осмотра взломанной калитки")));

const placementOptions = documentBuilder.buildPlacementOptions();
assert.ok(placementOptions.some((item) => item.clue === "Подпись Виктора Иванова на рецепте" && item.variants.length >= 5));

const packageChecks = documentBuilder.runPackageChecks();
assert.ok(packageChecks.every((item) => item.status === "готов"));

const documentGenerator = createDocumentGenerator(documentBuilder);
const generatedPackages = documentGenerator.generateDocuments();
assert.equal(generatedPackages.length, 3);
const sergeyInterrogation = generatedPackages[0].documents.find((doc) => doc.title === "Протокол первого допроса Сергея Акунина");
assert.ok(sergeyInterrogation.body.includes("ПРОТОКОЛ ДОПРОСА"));

const generatedDocuments = generatedPackages.flatMap((pkg) => pkg.documents);
const prescription = generatedDocuments.find((doc) => doc.title === "Рецепт на очки Морозова");
assert.ok(prescription);
assert.ok(prescription.body.includes("Иванов В.И."));
assert.ok(generatedDocuments.every((doc) => !doc.body.toLowerCase().includes("игрок")));
assert.ok(generatedDocuments.every((doc) => !doc.body.toLowerCase().includes("убийца")));

const generatedChecks = documentGenerator.runDocumentChecks();
assert.ok(generatedChecks.every((item) => item.status === "готов"));

const realismEditor = createRealismEditor(documentGenerator);
const realismReports = realismEditor.auditDocuments();
assert.equal(realismReports.length, generatedDocuments.length);
assert.ok(realismReports.every((report) => report.score >= 8));
assert.ok(realismReports.some((report) => report.document === "Протокол первого допроса Сергея Акунина" && report.formRealism));
assert.ok(realismReports.some((report) => report.document === "Рецепт на очки Морозова" && report.languageRealism));

const chapterRealism = realismEditor.auditChapters();
assert.equal(chapterRealism.length, 3);
assert.ok(chapterRealism.every((report) => ["Отлично", "Хорошо"].includes(report.verdict)));

const artificiality = realismEditor.findArtificiality();
assert.ok(Array.isArray(artificiality));

const playerTester = createPlayerDocumentTester(documentGenerator);
const playerDocumentNotes = playerTester.testDocuments();
assert.equal(playerDocumentNotes.length, generatedDocuments.length);
assert.ok(playerDocumentNotes.every((note) => note.playerLimits.includes("скрытые факты")));
assert.ok(playerDocumentNotes.some((note) => note.document === "Рецепт на очки Морозова" && note.questions.some((question) => question.includes("Иванов"))));

const playerChapters = playerTester.testChapters();
assert.equal(playerChapters.length, 3);
assert.ok(playerChapters[0].versions.main.includes("Сергей"));
assert.ok(playerChapters[1].suspects.some((suspect) => suspect.name === "Иванов Виктор Ильич"));
assert.ok(playerChapters[2].stuckPoints.some((point) => point.includes("недостающего документа")));

const revealability = playerTester.testRevealability();
assert.equal(revealability.canExplainMotive, false);
assert.ok(revealability.missingInformation.some((item) => item.includes("мотив")));

const logicAuditor = createInvestigationLogicAuditor({
  canon,
  scenarioWriter: writer,
  clueConstructor,
  documentPackageBuilder: documentBuilder,
  playerDocumentTester: playerTester
});
const proofChainAudit = logicAuditor.auditProofChain();
assert.ok(proofChainAudit.some((step) => step.status === "слабое звено"));

const suspectAudit = logicAuditor.auditSuspects();
assert.ok(suspectAudit.some((suspect) => suspect.suspect === "Иванов Виктор Ильич" && suspect.status === "не хватает элемента обвинения"));

const finalAccusation = logicAuditor.auditFinalAccusation();
assert.ok(finalAccusation.strength < 8);
assert.ok(finalAccusation.defenseArguments.some((argument) => argument.includes("мотив")));

const attack = logicAuditor.attackInvestigation();
assert.equal(attack.strongerThanAuthorVersion, true);

const finalLogicAudit = logicAuditor.runFinalAudit();
assert.equal(finalLogicAudit.revealability, "Нераскрываемо");
assert.equal(finalLogicAudit.verdict, "Выпуск невозможен");
assert.ok(finalLogicAudit.criticalErrors.length >= 1);

console.log("Agent engine tests passed");
