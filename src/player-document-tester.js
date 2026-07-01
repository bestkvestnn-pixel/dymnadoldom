export function createPlayerDocumentTester(documentGenerator) {
  return {
    name: "Игрок-тестировщик документов",
    testChapters: () => testChapters(documentGenerator.generateDocuments()),
    testDocuments: () => testDocuments(documentGenerator.generateDocuments()),
    testRevealability: () => testRevealability(documentGenerator.generateDocuments())
  };
}

export function testDocuments(generatedPackages) {
  return generatedPackages.flatMap((pkg) =>
    pkg.documents.map((document) => analyzeDocumentAsPlayer(document, pkg.chapterTitle))
  );
}

export function testChapters(generatedPackages) {
  const memory = {
    currentVersion: "пока нет версии",
    suspects: new Map(),
    openQuestions: []
  };

  return generatedPackages.map((pkg, index) => {
    const documentNotes = pkg.documents.map((document) => analyzeDocumentAsPlayer(document, pkg.chapterTitle));
    const discoveredClues = documentNotes.flatMap((note) => note.clues);
    const versions = buildPlayerVersions(discoveredClues, documentNotes, memory, index);
    const suspects = rankSuspects(discoveredClues, documentNotes, memory);
    const logicChecks = checkLogicJumps(discoveredClues, documentNotes, index);
    const deadEnds = findDeadEnds(versions, suspects, logicChecks, index);
    const falseAccents = findFalseAccents(documentNotes);
    const invisibleClues = findInvisibleClues(discoveredClues, logicChecks);
    const missing = missingForChapter(index, discoveredClues);
    const chapterScore = scoreChapter(documentNotes, logicChecks, deadEnds, missing);

    memory.currentVersion = versions.main;
    memory.suspects = new Map(suspects.map((suspect) => [suspect.name, suspect.score]));
    memory.openQuestions = documentNotes.flatMap((note) => note.questions).concat(missing);

    return {
      chapterId: pkg.chapterId,
      chapterTitle: pkg.chapterTitle,
      notes: documentNotes,
      versions,
      suspects,
      understood: understoodFrom(discoveredClues, documentNotes),
      notUnderstood: missing,
      stuckPoints: deadEnds,
      usefulDocuments: documentNotes.filter((note) => note.usefulness >= 7).map((note) => note.document),
      uselessDocuments: documentNotes.filter((note) => note.usefulness <= 4).map((note) => note.document),
      logicChecks,
      falseAccents,
      invisibleClues,
      evaluation: chapterScore,
      savedState: {
        currentVersion: memory.currentVersion,
        confidence: confidenceFor(suspects, logicChecks),
        openQuestions: memory.openQuestions.slice(0, 6)
      }
    };
  });
}

export function testRevealability(generatedPackages) {
  const chapters = testChapters(generatedPackages);
  const finalChapter = chapters.at(-1);
  const finalClues = chapters.flatMap((chapter) => chapter.notes.flatMap((note) => note.clues));
  const hasViktorName = finalClues.some((clue) => clue.text.includes("Иванов") || clue.text.includes("врача Иванова"));
  const hasSeries = finalClues.some((clue) => clue.text.includes("KAPNOS") || clue.text.includes("серии"));
  const hasMethod = finalClues.some((clue) =>
    clue.text.includes("нож") ||
    clue.text.includes("террас") ||
    clue.text.includes("калит")
  );

  return {
    canNameKiller: hasViktorName && hasSeries,
    canExplainMotive: false,
    canExplainMethod: hasMethod,
    canExplainAllImportantClues: hasViktorName && hasSeries && hasMethod,
    missingInformation: [
      !hasSeries ? "нужна явная сводка настоящей серии" : null,
      !hasViktorName ? "нужна более сильная связь Виктора с эпизодами" : null,
      "мотив Виктора по доступным документам пока не раскрыт",
      finalChapter.stuckPoints.length > 0 ? `тупики: ${finalChapter.stuckPoints.join("; ")}` : null
    ].filter(Boolean)
  };
}

function analyzeDocumentAsPlayer(document, chapterTitle) {
  const body = document.body;
  const clues = extractPlayerClues(body, document.title);
  const questions = questionsFrom(body, clues);
  const surprising = surprisingDetails(body, clues);
  const maybeImportant = clues.map((clue) => clue.text);
  const maybeBackground = backgroundDetails(document, clues);

  return {
    chapter: chapterTitle,
    document: document.title,
    understood: factsFrom(clues, body),
    surprising,
    maybeImportant,
    maybeBackground,
    questions,
    clues,
    usefulness: Math.min(10, 3 + clues.length * 2 + questions.length),
    playerLimits: "вижу только текст документа; скрытые факты и функции не использую"
  };
}

function extractPlayerClues(body, documentTitle) {
  const clues = [];
  addClue(clues, body, documentTitle, "Вероника", "упоминание Вероники", "может выглядеть как причина молчания Сергея, но само по себе не доказывает ее участие");
  addClue(clues, body, documentTitle, "Я не убивал Анну", "Сергей отдельно отрицает смерть Анны", "не доказывает его невиновность");
  addClue(clues, body, documentTitle, "виноват перед Вероникой", "Сергей признает отдельную вину перед Вероникой", "не объясняет, что именно произошло");
  addClue(clues, body, documentTitle, "блондин", "на фото есть неустановленная женщина", "не доказывает, что это Вероника");
  addClue(clues, body, documentTitle, "Т.", "письмо связано с неизвестным отправителем Т.", "не доказывает мотив отправителя");
  addClue(clues, body, documentTitle, "Иванов В.И.", "рецепт подписан Ивановым", "не доказывает причастность к смерти");
  addClue(clues, body, documentTitle, "Морозов", "Морозов связан с ProЗрение", "не доказывает, что клиника связана с Анной");
  addClue(clues, body, documentTitle, "Мия", "Мия появляется как новая жертва/линия рядом с делом Анны", "само имя не доказывает серию");
  addClue(clues, body, documentTitle, "левой рукой", "Мия была левшой", "нужно сопоставить с положением сигареты");
  addClue(clues, body, documentTitle, "правую руку", "сигарета у Мии была в правой руке", "не доказывает постановку без факта леворукости");
  addClue(clues, body, documentTitle, "выставк", "выставка Мии могла быть точкой контакта с Виктором/ProЗрение", "не доказывает, что Виктор был рядом с Мией лично");
  addClue(clues, body, documentTitle, "Кристина", "Кристина появляется в CRM ProЗрение после работы у Анны", "может быть кадровым переходом и архивной рабочей записью");
  addClue(clues, body, documentTitle, "Акунина Анна", "Анна появляется в CRM клиники", "не доказывает встречу с врачом");
  addClue(clues, body, documentTitle, "калит", "калитка была взломанным путем входа", "не доказывает, кто именно воспользовался готовым входом");
  addClue(clues, body, documentTitle, "шарф", "Павел украл личную вещь Анны — шарф с запахом духов", "доказывает одержимость и проникновение, но не убийство");
  addClue(clues, body, documentTitle, "дух", "запах духов делает кражу личной и навязчивой", "не связывает Павла с серийным паттерном");
  addClue(clues, body, documentTitle, "нож", "нож с террасы является вероятным способом убийства Анны", "следы на ноже не доказывают автоматически Сергея");
  addClue(clues, body, documentTitle, "корм", "рыбный корм может быть бытовой связью с аквариумом Виктора", "сам по себе фрагмент упаковки может быть случайным мусором");
  addClue(clues, body, documentTitle, "Расписание", "расписание ProЗрение проверяет рабочее алиби", "не доказывает присутствие Виктора на месте");
  addClue(clues, body, documentTitle, "20:46", "камера ломается в важное окно", "не доказывает намеренный саботаж");
  addClue(clues, body, documentTitle, "белый седан", "рядом стоит белый седан", "не доказывает владельца");
  addClue(clues, body, documentTitle, "сух", "погода может опровергать версию о шторме", "нужна внешняя погодная сводка");
  return clues;
}

function addClue(clues, body, documentTitle, token, text, notProof) {
  if (!body.toLowerCase().includes(token.toLowerCase())) return;
  clues.push({
    document: documentTitle,
    token,
    text,
    proves: text,
    doesNotProve: notProof,
    alternatives: alternativesFor(token),
    difficulty: difficultyFor(token)
  });
}

function alternativesFor(token) {
  const alternatives = {
    Вероника: ["Сергей скрывает роман", "Сергей покрывает Веронику", "Вероника связана с другим конфликтом"],
    "Я не убивал Анну": ["Сергей лжет", "Сергей виновен в другом"],
    "Иванов В.И.": ["обычный врач", "подпись важна только как контакт"],
    Мия: ["новая жертва серии", "газетный фон", "ошибка журналиста"],
    "левой рукой": ["левша", "случайное фото", "важно только вместе с сигаретой"],
    "правую руку": ["постановка", "случайная поза", "ошибка протокола"],
    выставк: ["место встречи", "культурный фон", "маршрут жертвы"],
    Кристина: ["бывшая секретарь Анны", "новая сотрудница ProЗрение", "рабочая архивная операция"],
    калит: ["Павел взломал калитку", "другой человек воспользовался входом", "взлом мог быть отдельным преступлением"],
    шарф: ["одержимость Павла", "сувенир после проникновения", "попытка сохранить запах Анны"],
    дух: ["личная фиксация Павла", "случайная бытовая деталь", "причина кражи шарфа"],
    нож: ["домашний предмет", "следы Сергея могли появиться раньше", "оружие выбрано на месте"],
    корм: ["аквариум Виктора", "обычный мусор", "рекламный фрагмент совпал случайно"],
    Расписание: ["рабочее алиби", "окно возможности", "административная ошибка"],
    "20:46": ["помеха на записи", "плохое качество", "неопознанное движение"],
    "белый седан": ["машина соседа", "машина свидетеля", "машина подозреваемого"]
  };
  return alternatives[token] || ["может быть фоном", "может быть частью другой линии"];
}

function difficultyFor(token) {
  if (["Иванов В.И.", "20:46", "нож", "калит", "шарф", "дух", "Мия", "левой рукой", "правую руку", "Расписание"].includes(token)) return "Вероятный";
  if (["Акунина Анна", "сух", "Т."].includes(token)) return "Сложный";
  if (["белый седан"].includes(token)) return "Сложный";
  return "Очевидный";
}

function factsFrom(clues, body) {
  const facts = clues.map((clue) => clue.proves);
  if (body.includes("Вопрос:") && body.includes("Ответ:")) facts.push("это показания, а не объективное доказательство");
  if (body.includes("ID;")) facts.push("это таблица контактов, в ней могут быть обычные рабочие строки");
  return facts;
}

function questionsFrom(body, clues) {
  const questions = [];
  if (body.includes("Вероника")) questions.push("когда и как погибла Вероника?");
  if (body.includes("Т.")) questions.push("кто такой Т. и зачем отправлял фото?");
  if (body.includes("Иванов В.И.")) questions.push("какую роль играет врач Иванов?");
  if (body.includes("Мия")) questions.push("как Мия связана с Анной и Морозовым?");
  if (body.includes("левой рукой") && body.includes("правую руку")) questions.push("почему сигарета у левши Мии оказалась в правой руке?");
  if (body.includes("выстав")) questions.push("кто был на выставке Мии?");
  if (body.includes("Кристина")) questions.push("Почему бывшая секретарь Анны перешла в ProЗрение?");
  if (body.includes("калит")) questions.push("кто мог знать об уязвимости калитки?");
  if (body.includes("шарф")) questions.push("почему Павел украл именно шарф Анны?");
  if (body.includes("нож")) questions.push("когда Сергей мог оставить следы на ноже?");
  if (body.includes("корм")) questions.push("у кого есть аквариум и такая пачка корма?");
  if (body.includes("Расписание")) questions.push("где был Виктор вне смены?");
  if (body.includes("белый седан")) questions.push("чей белый седан стоит у дома?");
  if (clues.length === 0) questions.push("что именно в этом документе должно помочь дальше?");
  return questions;
}

function surprisingDetails(body, clues) {
  const details = [];
  if (body.includes("не звони мне после полуночи")) details.push("личная фраза в письме выглядит как отдельная тайна");
  if (body.includes("Оплату произвел наличными")) details.push("наличная оплата может быть рутиной или попыткой не оставить след");
  if (body.includes("батарея датчика окна")) details.push("низкий заряд датчика может отвлекать от главного доступа");
  if (body.includes("осадков на кадре не видно")) details.push("сухая погода выглядит как проверка чьих-то слов");
  return details.length > 0 ? details : clues.slice(0, 2).map((clue) => clue.text);
}

function backgroundDetails(document, clues) {
  const tokens = new Set(clues.map((clue) => clue.token.toLowerCase()));
  return document.ordinaryDetails.filter((detail) => !tokens.has(detail.toLowerCase())).slice(0, 4);
}

function buildPlayerVersions(clues, notes, memory, chapterIndex) {
  const texts = clues.map((clue) => clue.text).join(" ");
  let main = memory.currentVersion;
  const alternatives = [];

  if (chapterIndex === 0) {
    main = texts.includes("Сергей") || texts.includes("Вероник")
      ? "Сергей что-то сделал с Вероникой и, возможно, скрывает связь с Анной"
      : "семейный конфликт вокруг Анны";
    alternatives.push("Тихонов или отправитель фото сознательно подставляет Сергея");
    alternatives.push("женщина на фото не Вероника, и линия фото ведет в сторону");
  } else if (chapterIndex === 1) {
    main = texts.includes("Мия") && texts.includes("правой руке")
      ? "Мия, Морозов и Анна выглядят как настоящая серия с постановочной сигаретой"
      : texts.includes("Иванов") && texts.includes("Морозов")
        ? "клиника ProЗрение связывает Морозова, Анну и врача Иванова"
        : memory.currentVersion;
    alternatives.push("Кристина могла быть подозрительным мостом между Анной и ProЗрение");
    alternatives.push("Иванов просто врач, а важна клиентская база клиники");
  } else {
    main = texts.includes("калитка") || texts.includes("нож") || texts.includes("рыбный корм")
      ? "к смерти Анны причастен тот, кто воспользовался уязвимостью калитки, взял нож на месте и оставил бытовую ошибку"
      : memory.currentVersion;
    alternatives.push("Павел мог быть убийцей, потому что взломал калитку и проникал в дом");
    alternatives.push("следы Сергея на ноже могли быть бытовыми, но все еще создают семейную версию");
  }

  return {
    main,
    alternatives: alternatives.slice(0, 2)
  };
}

function rankSuspects(clues, notes, memory) {
  const scores = new Map(memory.suspects);
  const bump = (name, value) => scores.set(name, Math.min(10, (scores.get(name) || 2) + value));

  clues.forEach((clue) => {
    if (clue.text.includes("Сергей") || clue.text.includes("Вероник")) bump("Сергей Андреевич Акунин", 2);
    if (clue.text.includes("Т.") || clue.text.includes("фото")) bump("Тихонов / отправитель фото", 2);
    if (clue.text.includes("Иванов")) bump("Иванов Виктор Ильич", 3);
    if (clue.text.includes("Мия") || clue.text.includes("выставка") || clue.text.includes("сигарета у Мии")) bump("Иванов Виктор Ильич", 2);
    if (clue.text.includes("рыбный корм") || clue.text.includes("расписание ProЗрение")) bump("Иванов Виктор Ильич", 2);
    if (clue.text.includes("Кристина")) bump("Кристина", 2);
    if (clue.text.includes("калитка")) bump("Левин Павел Евгеньевич", 2);
    if (clue.text.includes("шарф") || clue.text.includes("духов")) bump("Левин Павел Евгеньевич", 2);
  });

  notes.forEach((note) => {
    if (note.document.includes("CRM")) bump("Кристина", 1);
    if (note.document.includes("камеры")) bump("неизвестный посетитель", 2);
  });

  return Array.from(scores.entries())
    .map(([name, score]) => ({ name, score: `${score}/10`, rawScore: score, reason: reasonForSuspect(name, clues) }))
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 6);
}

function reasonForSuspect(name, clues) {
  const related = clues.filter((clue) => clue.text.includes(name.split(" ")[0]) || clue.alternatives.join(" ").includes(name));
  if (related.length === 0) return "подозрение косвенное, через общий контекст главы";
  return related.map((clue) => clue.text).join("; ");
}

function checkLogicJumps(clues, notes, chapterIndex) {
  const checks = clues.map((clue) => ({
    conclusion: clue.proves,
    level: clue.difficulty,
    risk: clue.difficulty === "Сложный" ? "можно пропустить без сопоставления с другим документом" : "вывод доступен из текста"
  }));

  if (chapterIndex === 1 && !clues.some((clue) => clue.text.includes("Анна появляется в CRM"))) {
    checks.push({
      conclusion: "связать клинику с Анной",
      level: "Практически невозможный",
      risk: "игрок видит Морозова и Иванова, но не получает достаточно связи с Анной"
    });
  }
  if (chapterIndex === 2 && !clues.some((clue) => clue.text.includes("KAPNOS"))) {
    checks.push({
      conclusion: "назвать настоящую серию убийств",
      level: "Практически невозможный",
      risk: "в доступных документах нет сводки сигаретных следов"
    });
  }
  if (chapterIndex === 2 && !clues.some((clue) => clue.text.includes("нож"))) {
    checks.push({
      conclusion: "объяснить способ убийства Анны",
      level: "Практически невозможный",
      risk: "в доступных документах нет материала о ноже с террасы"
    });
  }

  return checks;
}

function findDeadEnds(versions, suspects, logicChecks, chapterIndex) {
  const deadEnds = [];
  if (suspects.filter((suspect) => suspect.rawScore >= 5).length > 3) {
    deadEnds.push("слишком много подозреваемых выглядят примерно одинаково вероятно");
  }
  if (logicChecks.some((check) => check.level === "Практически невозможный")) {
    deadEnds.push("авторский ожидаемый вывод требует недостающего документа");
  }
  if (chapterIndex === 0 && versions.main.includes("возможно")) {
    deadEnds.push("после первой главы трудно понять, Сергей убийца Анны или отдельный виновный");
  }
  return deadEnds;
}

function findFalseAccents(notes) {
  return notes.flatMap((note) =>
    note.surprising
      .filter((detail) => detail.includes("наличная") || detail.includes("батарея") || detail.includes("полуночи"))
      .map((detail) => `${note.document}: ${detail}`)
  );
}

function findInvisibleClues(clues, logicChecks) {
  return logicChecks
    .filter((check) => check.level === "Сложный" || check.level === "Практически невозможный")
    .map((check) => ({
      clue: check.conclusion,
      noticed: check.level !== "Практически невозможный",
      understood: check.level === "Сложный" ? "частично" : "нет",
      linked: check.level === "Сложный" ? "требуется второй документ" : "не хватает информации"
    }));
}

function missingForChapter(chapterIndex, clues) {
  const missing = [];
  if (chapterIndex === 0) missing.push("нужен документ, который датирует смерть Вероники");
  if (chapterIndex === 1 && !clues.some((clue) => clue.text.includes("KAPNOS"))) {
    missing.push("нужна сводка сигаретных следов или протокол по KAPNOS");
  }
  if (chapterIndex === 2) {
    missing.push("нужен мотив Виктора/KAPNOS; прямой физический мост к дому заменен цепочкой калитка → нож → уголок корма → расписание");
  }
  return missing;
}

function understoodFrom(clues, notes) {
  return [
    ...new Set(
      clues
        .filter((clue) => clue.difficulty !== "Практически невозможный")
        .map((clue) => clue.proves)
        .concat(notes.map((note) => `${note.document}: ${note.clues.length} зацепки`))
    )
  ].slice(0, 8);
}

function scoreChapter(notes, logicChecks, deadEnds, missing) {
  const interest = Math.min(10, 6 + notes.filter((note) => note.clues.length > 1).length);
  const clarity = Math.max(1, 9 - deadEnds.length * 2);
  const fairness = Math.max(1, 9 - logicChecks.filter((check) => check.level === "Практически невозможный").length * 3);
  const overload = notes.length <= 3 ? 4 : 7;
  const hardChecks = logicChecks.filter((check) => check.level === "Сложный" || check.level === "Практически невозможный").length;

  return {
    interest,
    clarity,
    fairness,
    overload,
    difficulty: hardChecks >= 3 ? "сложная" : hardChecks >= 1 ? "средняя" : "легкая",
    unclear: missing,
    tooObvious: logicChecks.filter((check) => check.level === "Очевидный").map((check) => check.conclusion).slice(0, 3),
    tooHidden: logicChecks.filter((check) => check.level === "Практически невозможный").map((check) => check.conclusion),
    mistakes: deadEnds.length > 0 ? deadEnds : ["ошибок игрока на этом пакете не обнаружено"],
    wantedDocuments: missing
  };
}

function confidenceFor(suspects, logicChecks) {
  const top = suspects[0]?.rawScore || 0;
  const impossible = logicChecks.filter((check) => check.level === "Практически невозможный").length;
  if (top >= 8 && impossible === 0) return "высокая";
  if (top >= 6) return "средняя";
  return "низкая";
}
