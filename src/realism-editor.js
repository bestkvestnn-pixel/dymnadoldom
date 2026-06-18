export function createRealismEditor(documentGenerator) {
  return {
    name: "Редактор достоверности",
    auditDocuments: () => auditDocuments(documentGenerator.generateDocuments()),
    auditChapters: () => auditChapters(documentGenerator.generateDocuments()),
    findArtificiality: () => findArtificiality(documentGenerator.generateDocuments())
  };
}

export function auditDocuments(generatedPackages) {
  return generatedPackages.flatMap((pkg) =>
    pkg.documents.map((document) => auditDocument(document, pkg.chapterTitle))
  );
}

export function auditChapters(generatedPackages) {
  return generatedPackages.map((pkg) => {
    const reports = pkg.documents.map((document) => auditDocument(document, pkg.chapterTitle));
    const averageScore = Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length);
    const weakDocuments = reports.filter((report) => report.score < 8);

    return {
      chapter: pkg.chapterTitle,
      averageScore,
      verdict: verdictForScore(averageScore),
      documentRealism: averageScore >= 8,
      characterRealism: reports.every((report) => report.characterVoice !== "одинаковая"),
      clueRealism: reports.every((report) => report.artificialProblems.length <= 2),
      investigationRealism: reports.every((report) => report.processProblems.length <= 1),
      dialogueRealism: reports.some((report) => report.document.includes("допроса"))
        ? reports.some((report) => report.realisticStrengths.includes("у допрашиваемого есть нервозность и уход от прямого ответа"))
        : true,
      weakDocuments: weakDocuments.map((report) => report.document)
    };
  });
}

export function findArtificiality(generatedPackages) {
  return auditDocuments(generatedPackages).flatMap((report) =>
    report.artificialProblems.map((problem) => ({
      chapter: report.chapter,
      document: report.document,
      problem,
      alternative: alternativeFor(problem, report.type)
    }))
  );
}

function auditDocument(document, chapter) {
  const form = checkForm(document);
  const language = checkLanguage(document);
  const content = checkContent(document);
  const excess = checkExcess(document);
  const process = checkProcess(document);
  const authorHints = findAuthorHints(document);
  const cliches = findCliches(document);
  const score = Math.max(
    2,
    10 -
      form.problems.length -
      language.problems.length -
      content.problems.length -
      excess.problems.length -
      process.problems.length -
      authorHints.length -
      cliches.length
  );

  return {
    chapter,
    document: document.title,
    type: document.type,
    score,
    verdict: verdictForScore(score),
    formRealism: form.passed,
    languageRealism: language.passed,
    contentRealism: content.passed,
    excessRealism: excess.passed,
    processRealism: process.passed,
    characterVoice: language.characterVoice,
    realisticStrengths: [
      ...form.strengths,
      ...language.strengths,
      ...content.strengths,
      ...excess.strengths,
      ...process.strengths
    ],
    artificialProblems: [
      ...form.problems,
      ...language.problems,
      ...content.problems,
      ...excess.problems,
      ...authorHints,
      ...cliches
    ],
    processProblems: process.problems,
    playerMayNotice: playerMayNotice(document, [...form.problems, ...language.problems, ...content.problems, ...excess.problems]),
    improvements: improvementsFor(document, [...form.problems, ...language.problems, ...content.problems, ...excess.problems, ...process.problems])
  };
}

function checkForm(document) {
  const body = document.body;
  const rules = [
    typeRule("Выгрузка CRM", ["ID;", "Дата;", "Клиент;", "Комментарий"], "похоже на служебную табличную выгрузку"),
    typeRule("Журнал подключений", ["ЖУРНАЛ СОБЫТИЙ", "Период:", "результат:", "источник:"], "системный лог содержит события, источники и результаты"),
    typeRule("Протокол просмотра камеры", ["ПРОТОКОЛ", "Камера:", "Фрагмент:", "20:"], "протокол видео фиксирует источник и временные отметки"),
    typeRule("допроса", ["ПРОТОКОЛ", "Вопрос:", "Ответ:", "Дата"], "есть процессуальная структура допроса"),
    typeRule("медицинский", ["Пациент:", "Жалобы:", "Рекомендации", "Врач:"], "есть медицинский бланк и назначение"),
    typeRule("Письмо", ["Date:", "From:", "To:"], "сохранены поля электронного сообщения")
  ];
  const matchingRule = rules.find((rule) => document.type.includes(rule.type) || document.title.includes(rule.type));

  if (!matchingRule) {
    return {
      passed: body.length > 250,
      strengths: body.length > 250 ? ["документ имеет рабочий объем"] : [],
      problems: body.length > 250 ? [] : ["форма слишком короткая для рабочего документа"]
    };
  }

  const missing = matchingRule.tokens.filter((token) => !body.includes(token));
  return {
    passed: missing.length === 0,
    strengths: missing.length === 0 ? [matchingRule.strength] : [],
    problems: missing.map((token) => `для типа документа не хватает элемента «${token}»`)
  };
}

function checkLanguage(document) {
  const body = document.body;
  const lower = body.toLowerCase();
  const writerlyWords = ["зловеще", "таинственно", "роковой", "кошмар", "судьбоносный"];
  const hasWriterlyLanguage = writerlyWords.some((word) => lower.includes(word));
  const isInterrogation = document.title.includes("допроса");
  const isPoliceProtocol = document.type.includes("полицейский") || document.title.includes("Протокол просмотра");
  const isMedical = document.type.includes("медицинский");
  const isDigital = document.type.includes("цифровой");
  const strengths = [];

  if (isInterrogation && body.includes("Вопрос:") && body.includes("Ответ:")) {
    strengths.push("полицейский документ не превращен в рассказ");
  }
  if (isInterrogation && (body.includes("не знаю") || body.includes("не надо записывать"))) {
    strengths.push("у допрашиваемого есть нервозность и уход от прямого ответа");
  }
  if (!isInterrogation && isPoliceProtocol && /\d{2}:\d{2}:\d{2}/.test(body)) {
    strengths.push("полицейский протокол фиксирует наблюдаемые события по времени");
  }
  if (isMedical && /OD:|OS:|sph|cyl/.test(body)) {
    strengths.push("врач использует профессиональные параметры обследования");
  }
  if (isDigital && (/From:|ID;|ЖУРНАЛ СОБЫТИЙ/.test(body))) {
    strengths.push("цифровой материал выглядит как экспорт или системная запись");
  }

  return {
    passed: !hasWriterlyLanguage && strengths.length > 0,
    characterVoice: strengths.length > 0 ? "отличимая" : "одинаковая",
    strengths,
    problems: hasWriterlyLanguage ? ["в документ попала художественная лексика"] : strengths.length === 0 ? ["язык автора недостаточно отличим от авторского пересказа"] : []
  };
}

function checkContent(document) {
  const strengths = [];
  const problems = [];

  if (document.hiddenFacts.length > 0 && document.body.length > 300) {
    strengths.push("важный факт можно извлечь из обычного содержания");
  }
  if (document.ordinaryDetails.length >= 2) {
    strengths.push("есть бытовой или служебный шум");
  } else {
    problems.push("слишком мало обычных лишних сведений");
  }
  if (document.body.includes(document.gameFunction)) {
    problems.push("игровая функция просочилась в текст документа");
  }

  return {
    passed: problems.length === 0,
    strengths,
    problems
  };
}

function checkExcess(document) {
  const lineCount = document.body.split("\n").filter(Boolean).length;
  const hasNoise = document.ordinaryDetails.length >= 2 && lineCount >= 8;
  return {
    passed: hasNoise,
    strengths: hasNoise ? ["информация не сведена только к сюжетной улике"] : [],
    problems: hasNoise ? [] : ["документ слишком экономен и выглядит как реквизит"]
  };
}

function checkProcess(document) {
  const problems = [];
  const strengths = [];
  const type = document.type;

  if (type.includes("полицейский") && (document.body.includes("Дата") || document.body.includes("Допрос"))) {
    strengths.push("следователь фиксирует действие, а не объясняет выводы");
  }
  if (type.includes("медицинский") && document.body.includes("Оплату произвел")) {
    strengths.push("медицинский документ связан с реальным документооборотом клиники");
  }
  if (type.includes("цифровой") && (document.body.includes("Экспорт") || document.body.includes("Вложение") || document.body.includes("ID;"))) {
    strengths.push("понятно, почему материал мог сохраниться");
  }
  if (document.body.includes("финальный пакет игрока")) {
    problems.push("в документе есть не внутриигровой получатель");
  }

  return {
    passed: problems.length === 0 && strengths.length > 0,
    strengths,
    problems: strengths.length === 0 ? [...problems, "неясно, как документ возник и сохранился"] : problems
  };
}

function findAuthorHints(document) {
  const lower = document.body.toLowerCase();
  const hints = [];
  if (lower.includes("игрок")) hints.push("документ обращается к игроку");
  if (lower.includes("убийца")) hints.push("в документе слишком прямое слово «убийца»");
  if (lower.includes("важно") || lower.includes("ключевой")) hints.push("текст выделяет значимость факта авторским способом");
  if (document.hiddenFacts.some((item) => lower.includes(item.fact.toLowerCase()))) {
    hints.push("скрытый факт сформулирован слишком прямо");
  }
  return hints;
}

function findCliches(document) {
  const lower = document.body.toLowerCase();
  const cliches = [];
  if (lower.includes("случайно найден")) cliches.push("штамп случайно найденного документа");
  if (lower.includes("помню абсолютно точно")) cliches.push("свидетель помнит все слишком идеально");
  if (lower.includes("признаюсь во всем")) cliches.push("слишком идеальное признание");
  return cliches;
}

function playerMayNotice(document, problems) {
  if (problems.length > 0) return problems;
  if (document.type.includes("медицинский")) return ["игрок может проверить, похож ли бланк на рабочий медицинский документ"];
  if (document.type.includes("полицейский")) return ["игрок может заметить степень официальности и естественные паузы показаний"];
  if (document.type.includes("цифровой")) return ["игрок может сопоставить технический формат с причиной сохранения файла"];
  return ["явных слабых мест нет"];
}

function improvementsFor(document, problems) {
  if (problems.length === 0) {
    return ["оставить документ как рабочий материал; при верстке не выделять важные строки"];
  }
  return problems.map((problem) => alternativeFor(problem, document.type));
}

function alternativeFor(problem, type) {
  if (problem.includes("лишних сведений") || problem.includes("экономен")) {
    return "добавить 2-3 обычные строки, не связанные с разгадкой: номера, служебные пометки, рутинные операции";
  }
  if (problem.includes("художественная")) {
    return "заменить эмоциональные формулировки на сухие действия, время, должности и наблюдаемые факты";
  }
  if (problem.includes("игрок") || problem.includes("получатель")) {
    return "заменить внешний игровой адресат на внутренний: следователь, архив, бухгалтерия, техподдержка";
  }
  if (type.includes("медицинский")) {
    return "усилить медицинскую форму: жалобы, объективные показатели, назначение, подпись, номер бланка";
  }
  if (type.includes("полицейский")) {
    return "усилить процессуальную форму: дата, место, участники, вопрос-ответ, подписи, замечания к протоколу";
  }
  return "переписать как рабочий документ автора внутри мира, без объяснения расследования";
}

function typeRule(type, tokens, strength) {
  return { type, tokens, strength };
}

function verdictForScore(score) {
  if (score >= 9) return "Отлично";
  if (score >= 8) return "Хорошо";
  if (score >= 6) return "Средне";
  return "Плохо";
}
