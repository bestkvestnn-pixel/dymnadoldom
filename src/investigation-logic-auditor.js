export function createInvestigationLogicAuditor({
  canon,
  scenarioWriter,
  clueConstructor,
  documentPackageBuilder,
  playerDocumentTester
}) {
  return {
    name: "Аудитор логики расследования",
    auditProofChain: () => auditProofChain(scenarioWriter, documentPackageBuilder, playerDocumentTester),
    auditSuspects: () => auditSuspects(canon, scenarioWriter, clueConstructor, playerDocumentTester),
    auditFalseVersions: () => auditFalseVersions(scenarioWriter, playerDocumentTester),
    auditTimeline: () => auditTimeline(scenarioWriter, canon),
    attackInvestigation: () => attackInvestigation(playerDocumentTester),
    auditFinalAccusation: () => auditFinalAccusation(canon, scenarioWriter, playerDocumentTester),
    runFinalAudit: () => runFinalAudit(canon, scenarioWriter, documentPackageBuilder, playerDocumentTester)
  };
}

export function auditProofChain(scenarioWriter, documentPackageBuilder, playerDocumentTester) {
  const deductionChain = scenarioWriter.buildDeductionChain();
  const packages = documentPackageBuilder.buildPackages();
  const playerChapters = playerDocumentTester.testChapters();
  const playerText = JSON.stringify(playerChapters).toLowerCase();

  return deductionChain.map((step) => {
    const sources = findSourcesForStep(step, packages);
    const playerCanReach =
      containsAny(playerText, keywords(step.conclusion)) || containsAny(playerText, keywords(step.nextConclusion));
    const hasIndependentSources = sources.length >= 2;
    const alternative = alternativeForStep(step);
    const tooBold = !playerCanReach || !hasIndependentSources || Boolean(alternative);

    return {
      fact: step.clue,
      clue: step.clue,
      documents: sources,
      conclusion: step.conclusion,
      nextConclusion: step.nextConclusion,
      enoughEvidence: hasIndependentSources && playerCanReach,
      alternativeExplanation: alternative || "существенной альтернативы нет",
      tooBold,
      status: hasIndependentSources && playerCanReach && !alternative ? "доказано" : "слабое звено"
    };
  });
}

export function auditSuspects(canon, scenarioWriter, clueConstructor, playerDocumentTester = null) {
  const matrix = scenarioWriter.buildSuspectMatrix();
  const clueMatrix = clueConstructor.buildSuspectClueMatrix();
  const trueCulprit = canon.characters.find((character) => character.id === "viktor");
  const revealability = playerDocumentTester?.testRevealability();

  return matrix.map((suspect) => {
    const clues = clueMatrix.find((item) => item.name === suspect.suspect) || { against: [], inFavor: [] };
    const isTrueCulprit = suspect.suspect === trueCulprit.fullName;
    const hasAuthorSideAccusation =
      isTrueCulprit &&
      hasConcrete(suspect.motive) &&
      hasConcrete(suspect.opportunity) &&
      hasConcrete(suspect.means) &&
      clues.against.length >= 3;
    const canAccuse =
      hasAuthorSideAccusation &&
      (!isTrueCulprit ||
        (Boolean(revealability?.canNameKiller) &&
          Boolean(revealability?.canExplainMotive) &&
          Boolean(revealability?.canExplainMethod) &&
          Boolean(revealability?.canExplainAllImportantClues)));

    return {
      suspect: suspect.suspect,
      against: clues.against,
      inFavor: clues.inFavor,
      canExclude: !isTrueCulprit && clues.inFavor.length >= 2,
      canAccuse,
      motive: suspect.motive,
      opportunity: suspect.opportunity,
      means: suspect.means,
      alibi: suspect.alibi,
      status: isTrueCulprit
        ? canAccuse
          ? "обвинение возможно"
          : "не хватает элемента обвинения"
        : clues.inFavor.length >= 2
          ? "можно ослабить подозрение"
          : "остается мутным"
    };
  });
}

export function auditFalseVersions(scenarioWriter, playerDocumentTester) {
  const falseVersions = scenarioWriter.buildFalseVersions();
  const playerChapters = playerDocumentTester.testChapters();
  const chapterText = JSON.stringify(playerChapters).toLowerCase();

  return falseVersions.map((version) => {
    const disproofKeywords = keywords(version.playerCanDisproveBy);
    const canDisprove = containsAny(chapterText, disproofKeywords);

    return {
      title: version.title,
      whyPlayerBelieves: version.whyLooksLogical,
      disproof: version.playerCanDisproveBy,
      canDisprove,
      when: canDisprove ? "после сопоставления доступных документов" : "пока недоступно по сгенерированному пакету",
      status: canDisprove ? "правдоподобная и опровержимая" : "правдоподобная, но пока нечестная"
    };
  });
}

export function auditTimeline(scenarioWriter, canon) {
  const timeline = scenarioWriter.buildCaseFoundation().hiddenTimeline;
  const suspects = ["sergey", "viktor", "pavel", "tikhonov", "kristina"].map((id) => {
    const character = canon.characters.find((item) => item.id === id);
    return {
      character: character.fullName,
      location: timelineLocationFor(id),
      action: timelineActionFor(id),
      confirmation: timelineConfirmationFor(id),
      problem: timelineProblemFor(id)
    };
  });

  return {
    fullTimeline: timeline.map((item) => ({
      period: item.period,
      event: item.truth,
      cause: causeForPeriod(item.period),
      consequence: consequenceForPeriod(item.period),
      status: item.status,
      logicProblem: item.status.includes("требует") ? "событие еще не превращено в проверяемый документ" : "логика допустима"
    })),
    suspects,
    impossibleMovements: suspects.filter((item) => item.problem.includes("не закреплено")).map((item) => item.character),
    verdict:
      suspects.some((item) => item.problem.includes("не закреплено")) || timeline.some((item) => item.status.includes("требует"))
        ? "временная логика частично не доказана"
        : "временная логика выдержана"
  };
}

export function attackInvestigation(playerDocumentTester) {
  const chapters = playerDocumentTester.testChapters();
  const revealability = playerDocumentTester.testRevealability();
  const finalSuspects = chapters.at(-1).suspects;
  const bestAlternative = finalSuspects.find((suspect) => suspect.name !== "Иванов Виктор Иванович");

  return {
    alternativeCulprit: bestAlternative?.name || "Левин Павел Евгеньевич",
    alternativeVersion:
      "взломанная калитка и кража шарфа могут выглядеть как преступление Павла, не обязательно как путь Виктора",
    reinterpretations: [
      "рецепт Иванова может быть обычным медицинским контактом",
      "CRM связывает клинику с Морозовым, но не доказывает серийность",
      "взломанная калитка может вести к Павлу, но не объясняет серию",
      "Сергей остается эмоционально сильным подозреваемым из-за Вероники"
    ],
    strongerThanAuthorVersion: !revealability.canNameKiller,
    result: revealability.canNameKiller
      ? "альтернатива слабее авторской версии"
      : "альтернатива временно убедительнее, потому что авторская версия не доказана документами"
  };
}

export function auditFinalAccusation(canon, scenarioWriter, playerDocumentTester) {
  const revealability = playerDocumentTester.testRevealability();
  const viktor = canon.characters.find((character) => character.id === "viktor");
  const foundation = scenarioWriter.buildCaseFoundation();
  const accusationStrength = scoreFinalAccusation(revealability);

  return {
    accusation: `${viktor.fullName} является наиболее сильной версией по убийству Анны Акуниной и требует нового официального расследования.`,
    evidence: [
      "рецепт связывает Морозова с Ивановым",
      "CRM связывает ProЗрение с Морозовым и Анной",
      "акт осмотра калитки показывает путь входа, созданный Павлом",
      "нож с террасы закрепляет способ убийства Анны",
      "уголок рыбного корма, реклама и фото кабинета связывают ошибку с Виктором",
      "расписание ProЗрение показывает окно возможности Виктора, но не его местонахождение",
      "канон фиксирует KAPNOS как серийный маркер"
    ],
    missingProof: revealability.missingInformation,
    motive: foundation.crime.why,
    method: foundation.crime.method,
    defenseArguments: [
      "мотив Виктора в видимых документах не раскрыт",
      "KAPNOS-сводка не попала в сгенерированный пакет документов",
      "рецепт сам по себе доказывает контакт, но не убийство",
      "взломанная калитка сама по себе ведет к Павлу и требует сопоставления с ножом, кормом и расписанием"
    ],
    strength: accusationStrength,
    status: accusationStrength >= 8 ? "сильная версия для нового расследования" : accusationStrength >= 5 ? "версия требует дополнительной проверки" : "версия недостаточно обоснована"
  };
}

export function runFinalAudit(canon, scenarioWriter, documentPackageBuilder, playerDocumentTester) {
  const proofChain = auditProofChain(scenarioWriter, documentPackageBuilder, playerDocumentTester);
  const revealability = playerDocumentTester.testRevealability();
  const finalAccusation = auditFinalAccusation(canon, scenarioWriter, playerDocumentTester);
  const weakLinks = proofChain.filter((step) => step.status !== "доказано");
  const criticalErrors = [
    !revealability.canNameKiller ? "Игрок не может логически назвать убийцу по текущим документам." : null,
    !revealability.canExplainMotive ? "Мотив Виктора остается известен автору, но не доказан игроку." : null,
    proofChain.some((step) => step.fact.includes("KAPNOS") && step.status !== "доказано")
      ? "Серийный маркер KAPNOS не подтвержден достаточным сгенерированным пакетом."
      : null
  ].filter(Boolean);
  const seriousErrors = [
    !revealability.canExplainAllImportantClues ? "Не все ключевые улики объяснимы из доступных документов." : null,
    weakLinks.length > 0 ? `Слабые звенья цепочки: ${weakLinks.map((step) => step.fact).join("; ")}.` : null,
    finalAccusation.strength < 8 ? "Версия Виктора пока недостаточно сильна, чтобы обосновать новое расследование." : null
  ].filter(Boolean);
  const minorErrors = [
    "Некоторые временные элементы существуют как канон, но еще не имеют отдельного игрового документа.",
    "Часть алиби персонажей помечена как требующая уточнения."
  ];
  const strengths = [
    "Есть честные ложные версии: Сергей, Кристина, Павел, Крылов.",
    "Игрок-тестировщик фиксирует реальные изменения мнения по главам.",
    "Документы выглядят достоверно и не обращаются к игроку напрямую.",
    "Сергей отделен как виновный в другом преступлении, а не простой ложный подозреваемый."
  ];
  const score = Math.max(0, 100 - criticalErrors.length * 22 - seriousErrors.length * 10 - weakLinks.length * 4);

  return {
    revealability: revealability.canNameKiller
      ? revealability.canExplainAllImportantClues
        ? "Раскрываемо"
        : "Частично раскрываемо"
      : "Нераскрываемо",
    criticalErrors,
    seriousErrors,
    minorErrors,
    strengths,
    score,
    difficulty: revealability.canNameKiller ? "сложная" : "несправедливая",
    verdict: verdictFor(score, criticalErrors.length, revealability),
    mainQuestionAnswer: revealability.canNameKiller
      ? "виновность можно вывести частично"
      : "виновность нельзя доказать без дополнительных материалов"
  };
}

function findSourcesForStep(step, packages) {
  const text = `${step.clue} ${step.conclusion} ${step.nextClue} ${step.nextConclusion}`.toLowerCase();
  return packages.flatMap((pkg) =>
    pkg.documents
      .filter((doc) => {
        const docText = `${doc.title} ${doc.visibleText} ${doc.hiddenFacts.join(" ")} ${doc.linksTo.join(" ")}`.toLowerCase();
        return keywords(text).some((keyword) => docText.includes(keyword));
      })
      .map((doc) => doc.title)
  );
}

function alternativeForStep(step) {
  const clue = step.clue.toLowerCase();
  if (clue.includes("рецепт")) return "рецепт доказывает контакт врача и пациента, но не преступление";
  if (clue.includes("калит")) return "след доступа может указывать на Павла как источник готового входа, а не на убийцу";
  if (clue.includes("рыб")) return "фрагмент корма без рекламы и фото кабинета может быть обычным мусором";
  if (clue.includes("нож")) return "следы Сергея на бытовом ноже могут быть прежним контактом, а не убийством";
  if (clue.includes("kapnos")) return "без сводки по всем эпизодам KAPNOS может быть бытовой привычкой или следом Тихонова";
  if (clue.includes("рубашка")) return "Сергей может быть виновен в другом, но это не доказывает непричастность к Анне";
  if (clue.includes("три настоящие жертвы")) return "список настоящих жертв должен быть доказан документами, а не назван каноном";
  return "";
}

function containsAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function keywords(text) {
  return String(text)
    .toLowerCase()
    .split(/[^а-яёa-z0-9]+/i)
    .filter((word) => word.length >= 5)
    .filter((word) => !["документ", "вывод", "игрок", "связать", "следующая"].includes(word));
}

function hasConcrete(text) {
  return Boolean(text) && !String(text).includes("требует уточнения");
}

function timelineLocationFor(id) {
  return {
    sergey: "рядом с семейной линией Анны; точное окно по Анне требует проверки",
    viktor: "связан с ProЗрение и серией; прямое физическое положение у места не закрепляется намеренно, проверяется окно вне смены",
    pavel: "дом Анны накануне через взлом и проникновение",
    tikhonov: "почтовая и мотивная линия до смерти Анны",
    kristina: "сначала «Золотой квадрат», затем ProЗрение; архивные действия в CRM после смерти Анны"
  }[id];
}

function timelineActionFor(id) {
  return {
    sergey: "скрывает смерть Вероники и выглядит очевидным подозреваемым",
    viktor: "по канону ведет серию и использует постановочные сигареты",
    pavel: "взламывает калитку и крадет шарф Анны с запахом духов",
    tikhonov: "передает компрометирующее фото и связан с KAPNOS",
    kristina: "после смерти Анны переходит в ProЗрение и работает с архивной картой Морозова"
  }[id];
}

function timelineConfirmationFor(id) {
  return {
    sergey: "допрос Сергея, рубашка, линия Вероники",
    viktor: "рецепт, CRM, расписание ProЗрение, уголок рыбного корма, будущая KAPNOS-сводка",
    pavel: "акт осмотра взломанной калитки",
    tikhonov: "письмо с вложением",
    kristina: "CRM ProЗрение + кадровая пометка о переходе"
  }[id];
}

function timelineProblemFor(id) {
  return {
    sergey: "мотив есть, но убийство Анны не доказано",
    viktor: "мотив KAPNOS/травма еще не закреплены отдельным документом",
    pavel: "взлом объясняет путь входа, но его связь с убийством не доказана",
    tikhonov: "нет доказанного физического участия",
    kristina: "рабочий контакт не равен преступлению"
  }[id];
}

function causeForPeriod(period) {
  if (period.includes("месяц")) return "формирование серийного паттерна Виктора";
  if (period.includes("неделю")) return "семейный конфликт и компромат создают ложный фокус";
  if (period.includes("сутки")) return "одержимость Павла приводит к взлому калитки";
  if (period.includes("День")) return "несколько линий совпадают в вечер убийства";
  return "следствие получает несколько конкурирующих версий";
}

function consequenceForPeriod(period) {
  if (period.includes("месяц")) return "серия должна быть доказана независимыми документами";
  if (period.includes("неделю")) return "Сергей становится сильной ложной версией";
  if (period.includes("сутки")) return "Павел становится альтернативным подозреваемым";
  if (period.includes("День")) return "нужны документы по времени, месту и перемещениям";
  return "игрок должен развести семейную и серийную логику";
}

function scoreFinalAccusation(revealability) {
  let score = 2;
  if (revealability.canNameKiller) score += 3;
  if (revealability.canExplainMethod) score += 2;
  if (revealability.canExplainMotive) score += 2;
  if (revealability.canExplainAllImportantClues) score += 1;
  return score;
}

function verdictFor(score, criticalCount, revealability) {
  if (criticalCount > 0 || !revealability.canNameKiller) return "Выпуск невозможен";
  if (score < 65) return "Требуется серьезная переработка";
  if (score < 85) return "Требуются небольшие правки";
  return "Одобрено";
}
