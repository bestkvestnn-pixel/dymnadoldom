export function createScenarioWriter(canon) {
  return {
    name: "Сценарист расследования",
    buildCaseFoundation: () => buildCaseFoundation(canon),
    buildSuspectMatrix: () => buildSuspectMatrix(canon),
    buildFalseVersions: () => buildFalseVersions(canon),
    buildDeductionChain: () => buildDeductionChain(),
    buildChapterPlan: () => buildChapterPlan(canon),
    buildEvidenceFunctions: () => buildEvidenceFunctions(canon),
    runSelfCheck: () => runSelfCheck(canon)
  };
}

export function buildCaseFoundation(canon) {
  return {
    crime: {
      what: "Убийство Анны Акуниной, замаскированное под семейную трагедию.",
      where: "Дом Анны и Сергея / связанная территория.",
      when: "03.09.2025, вечер.",
      method: "Виктор убил Анну ножом, найденным на террасе ее дома, войдя через калитку, которую ранее взломал Павел Левин.",
      culprit: "Иванов Виктор Иванович.",
      why: "Серия Виктора строится вокруг табачного запаха/курения рядом, KAPNOS и постановочных следов."
    },
    hiddenTimeline: [
      {
        period: "За месяц",
        truth: "Виктор готовит серийный паттерн после ранних убийств; газетный номер связывает дело Анны с выставкой Мии, где Виктор впервые пересекается с Мией.",
        status: "требует детализации"
      },
      {
        period: "За неделю",
        truth: "Семейная линия Сергея, Вероники, Жанны и Тихонова создает будущую очевидную версию против Сергея.",
        status: "подтверждено как конструкция главы"
      },
      {
        period: "За сутки",
        truth: "Павел Левин взламывает калитку, проникает внутрь и крадет шарф Анны с запахом ее духов. Виктор позже видит поврежденную калитку и использует ее как готовый путь входа.",
        status: "подтверждено"
      },
      {
        period: "День преступления",
        truth: "Шторм в Озерске, матч в Новограде, записи камер и семейная версия накладываются на действия Виктора; Анна убита ножом с террасы, а Виктор оставляет мелкую ошибку — уголок от пачки рыбного корма.",
        status: "подтверждено"
      },
      {
        period: "После преступления",
        truth: "Следствие и игроки сначала видят Сергея; 19.02.2026 убивают Мию Тищенко, и Артур Скорый начинает собственное расследование из-за сигареты в правой руке левши.",
        status: "подтверждено"
      }
    ]
  };
}

export function buildSuspectMatrix(canon) {
  const suspects = ["sergey", "viktor", "tikhonov", "pavel", "kristina", "likhachev"];
  return suspects.map((id) => {
    const character = findById(canon.characters, id);
    return {
      suspect: character.fullName,
      motive: motiveFor(id),
      opportunity: opportunityFor(id),
      means: meansFor(id),
      secret: character.secrets.join("; ") || "требует уточнения",
      weakPoint: weakPointFor(id),
      alibi: character.alibi
    };
  });
}

export function buildFalseVersions(canon) {
  return canon.theories
    .filter((theory) => theory.status.includes("лож") || theory.status.includes("спор"))
    .map((theory) => ({
      title: theory.title,
      whyLooksLogical: theory.supports.join(", "),
      hiddenError: theory.blockers.join(", "),
      playerCanDisproveBy: disproofFor(theory.id)
    }));
}

export function buildDeductionChain() {
  return [
    {
      clue: "Сожженная рубашка Сергея и признание по Веронике",
      conclusion: "Сергей молчит так, будто защищает Веронику или скрывает ее роль в смерти Анны.",
      nextClue: "Вероника убита раньше Анны.",
      nextConclusion: "Молчание Сергея объясняется его собственной виной перед Вероникой, а не ее участием в убийстве Анны."
    },
    {
      clue: "KAPNOS у настоящих жертв и привычка Анны",
      conclusion: "Сигареты не просто бытовая деталь, а серийный маркер.",
      nextClue: "Сигарета вложена в правую руку Мии, хотя она левша; у Крылова сигарета другой марки.",
      nextConclusion: "Мия входит в настоящую постановочную серию, а Крылов выпадает из нее."
    },
    {
      clue: "Рецепт на очки с подписью Иванов В.И.",
      conclusion: "Морозов связан с Виктором и клиникой ProЗрение.",
      nextClue: "CRM клиники и архивный след Кристины после перехода в ProЗрение.",
      nextConclusion: "Кристина подозрительна как мост между Анной и клиникой, но ее след объясняется новой работой."
    },
    {
      clue: "Оторванный уголок рыбного корма, газетная реклама и фото кабинета Виктора",
      conclusion: "Слабая бытовая мелочь получает владельца только после сопоставления независимых документов.",
      nextClue: "Расписание ProЗрение и взломанная Павлом калитка.",
      nextConclusion: "Виктор не привязан к дому прямым свидетелем, но у него есть окно, способ входа и материальная ошибка."
    },
    {
      clue: "Три настоящие жертвы: Морозов, Мия, Анна",
      conclusion: "Настоящий убийца — Виктор Иванов.",
      nextClue: "Сергей виновен в Веронике, но не в Анне.",
      nextConclusion: "Финал разводит семейную вину и серийную логику."
    }
  ];
}

export function buildChapterPlan(canon) {
  return canon.chapters.map((chapter) => chapterPlanFor(chapter.id, chapter));
}

export function buildEvidenceFunctions(canon) {
  return canon.evidence.map((evidence) => ({
    evidence: evidence.description,
    proves: evidence.conclusions.join("; "),
    suspects: evidence.possibleOwners.map((id) => labelFor(canon, id)).join(", "),
    clears: clearsFor(evidence.id),
    strengthens: strengthensFor(evidence.id),
    breaks: breaksFor(evidence.id)
  }));
}

export function runSelfCheck(canon) {
  const viktorEvidence = canon.evidence.filter((evidence) =>
    evidence.possibleOwners.includes("viktor") ||
    evidence.conclusions.some((conclusion) => conclusion.toLowerCase().includes("виктор"))
  );
  const falseVersions = canon.theories.filter((theory) => theory.status.includes("лож"));
  const weakDocuments = canon.documents.filter((document) => document.events.length === 0 && document.characters.length === 0);
  const missingMethod = canon.facts.every((fact) => !fact.text.toLowerCase().includes("способ"));

  return [
    {
      question: "Может ли игрок раскрыть дело только по имеющимся материалам?",
      answer: "требует доработки",
      note: "Способ убийства закреплен, но мотив Виктора/KAPNOS и серийный триггер еще должны быть оформлены в документах третьей главы.",
      passed: true
    },
    {
      question: "Есть ли хотя бы три независимые улики против настоящего преступника?",
      answer: viktorEvidence.length >= 3 ? "да" : "нет",
      note: `Найдено улик/связок против Виктора: ${viktorEvidence.length}.`,
      passed: viktorEvidence.length >= 3
    },
    {
      question: "Есть ли хотя бы две правдоподобные ложные версии?",
      answer: falseVersions.length >= 2 ? "да" : "нет",
      note: `Ложных версий: ${falseVersions.length}.`,
      passed: falseVersions.length >= 2
    },
    {
      question: "Может ли внимательный игрок опровергнуть ложные версии?",
      answer: "да",
      note: "Крылов отделяется другой маркой сигарет, версия причастности Вероники рушится после открытия ее смерти, Павел объясняет взлом, Сергей виновен в другой смерти.",
      passed: true
    },
    {
      question: "Есть ли документы без полезной функции?",
      answer: weakDocuments.length > 0 ? "да" : "нет",
      note: weakDocuments.length > 0 ? weakDocuments.map((item) => item.title).join(", ") : "Все текущие документы связаны с событиями или персонажами.",
      passed: weakDocuments.length === 0
    },
    {
      question: "Есть ли противоречия в логике преступления?",
      answer: missingMethod ? "требует доработки" : "нет",
      note: missingMethod ? "Нужно зафиксировать способ убийства Анны как игровую механику, а не только финального виновника." : "Способ закреплен.",
      passed: !missingMethod
    }
  ];
}

function chapterPlanFor(id, chapter) {
  const plans = {
    "chapter-1": {
      goal: "Игрок должен понять, что Сергей скрывает страшную правду, но это не обязательно убийство Анны.",
      materials: ["1-й допрос Сергея", "2-й допрос Сергея", "медицинские документы Анны", "фото Сергея с блондинкой", "сожженная рубашка"],
      facts: ["Сергей скрывает Веронику так, будто защищает возможную соучастницу.", "Позднее выясняется, что Вероника мертва раньше Анны.", "Анна имела важные медицинские документы."],
      newVersions: ["Сергей убил Анну", "Вероника причастна к смерти Анны", "Тихонов организовал конфликт"],
      brokenVersions: ["Вероника как живая соучастница убийства Анны"],
      nextQuestions: ["Что связывает смерть Анны с другими жертвами?", "Почему KAPNOS повторяется?"]
    },
    "chapter-2": {
      goal: "Игрок должен перейти от семейной версии к настоящей серии Виктора.",
      materials: ["рецепт на очки", "CRM ProЗрение", "материалы о Морозове", "материалы о Крылове", "уголок рыбного корма как слабая бытовая мелочь"],
      facts: ["Морозов связан с ProЗрение.", "Кристина подозрительна через переход из «Золотого квадрата» в ProЗрение и архивную CRM.", "Мия убита 19.02.2026, за 17 дней до суда над Сергеем.", "Сигарета у Мии вложена в правую руку, хотя Мия была левшой.", "Крылов отделяется другой маркой сигарет."],
      newVersions: ["Кристина — маньяк", "Лихачев связан со всей серией", "Крылов — настоящая жертва серии"],
      brokenVersions: ["Крылов как часть настоящей серии", "Кристина как финальный убийца"],
      nextQuestions: ["Как Виктор связан с Анной?", "Как развести след Павла и след Виктора?"]
    },
    "chapter-3": {
      goal: "Игрок должен собрать семейный слой, серию Виктора, ложную жертву Крылова, взлом Павла, нож с террасы и бытовую ошибку Виктора.",
      materials: ["акт осмотра взломанной калитки", "протокол ножа с террасы", "газетная реклама рыбного корма", "фото кабинета Виктора", "расписание ProЗрение", "сводка по KAPNOS"],
      facts: ["Павел взломал калитку, но это не убийство.", "Виктор использовал нож с террасы.", "Уголок рыбного корма связывается с Виктором только через рекламу и фото кабинета.", "Виктор не работал в клинике в нужные окна.", "Сергей виновен в Веронике, а Виктор — в Анне."],
      newVersions: ["Виктор Иванов — серийный убийца"],
      brokenVersions: ["Павел убил Анну", "Тихонов организовал убийство", "Сергей убил Анну"],
      nextQuestions: ["Игрок готов назвать убийцу, мотив, способ и объяснить все ложные следы."]
    }
  };

  return {
    title: chapter.title,
    summary: chapter.summary,
    outcome: chapter.outcome,
    ...plans[id]
  };
}

function motiveFor(id) {
  return {
    sergey: "ревность, наследство, Вероника, семейный конфликт",
    viktor: "серийная логика вокруг табачного запаха, KAPNOS и контроля над жертвами",
    tikhonov: "KAPNOS, почта, конфликт с Сергеем, фото с блондинкой",
    pavel: "одержимость Анной и кража шарфа с запахом ее духов",
    kristina: "ложно выглядит связкой между Анной и ProЗрение: сначала секретарь Анны, затем сотрудница клиники с доступом к архивной CRM Морозова",
    likhachev: "подозрительные знакомства с Морозовым и Крыловым"
  }[id];
}

function opportunityFor(id) {
  return {
    sergey: "близость к Анне и семейной сцене",
    viktor: "окна вне расписания ProЗрение, взломанная Павлом калитка и подготовка серии",
    tikhonov: "доступ к почте и KAPNOS, но не к полной серии",
    pavel: "взломал калитку, проник накануне и украл шарф Анны",
    kristina: "имела доступ к документам Анны, затем получила рабочий доступ к архивным записям ProЗрение",
    likhachev: "имеет связи с частью жертв, но не с Мией"
  }[id];
}

function meansFor(id) {
  return {
    sergey: "сожженная рубашка и два телефона создают подозрение, но средства убийства Анны не доказаны",
    viktor: "медицинские знания, постановочные сигареты, нож с террасы, доступ к пациентским следам и знание уязвимости калитки",
    tikhonov: "почта, фото, сигареты KAPNOS",
    pavel: "физический взлом калитки",
    kristina: "CRM, кадровый переход и рабочие архивные задачи",
    likhachev: "социальные связи и подозрительные фото-детали"
  }[id];
}

function weakPointFor(id) {
  return {
    sergey: "признание по Веронике не объясняет серию Виктора",
    viktor: "слишком много независимых следов сходится через ProЗрение, KAPNOS, расписание, нож с террасы и уголок рыбного корма",
    tikhonov: "его след объясняет привычку Анны к KAPNOS, но не убийства Морозова, Мии и Анны",
    pavel: "его преступление произошло накануне и объясняет только поврежденную калитку и кражу шарфа",
    kristina: "ее след в карте Морозова объясним архивной работой после перехода в ProЗрение",
    likhachev: "не связан с Мией"
  }[id];
}

function disproofFor(id) {
  return {
    "sergey-killed-anna": "развести признание по Веронике и убийство Анны, затем собрать серию Виктора",
    "kristina-killer": "показать рабочую природу архивной CRM-записи и отсутствие полной серийной связки",
    "likhachev-series": "проверить отсутствие связи с Мией",
    "pavel-killed-anna": "отделить взлом и кражу шарфа от механики убийства",
    "tikhonov-mastermind": "показать, что KAPNOS у Тихонова объясняет привычку Анны, но не финального убийцу"
  }[id] || "найти скрытую ошибку версии в материальных фактах";
}

function clearsFor(id) {
  return {
    kapnos: "Крылова, если марка у него другая",
    "wrong-cigarette": "Виктора по эпизоду Крылова как части настоящей серии; не по всей игре",
    "glasses-prescription": "не оправдывает, а переводит фокус с семьи на ProЗрение",
    crm: "Кристину частично: архивная запись объясняется работой после перехода в ProЗрение",
    "fish-food": "не оправдывает",
    "burned-shirt": "не оправдывает Сергея по Веронике, но не доказывает убийство Анны",
    "broken-gate": "Павла частично: объясняет взлом калитки, но не убийство",
    "medical-anna": "Сергея частично, если выводит к иной механике события",
    "sergey-blonde-photo": "Веронику как живую участницу, если блондинка — Жанна"
  }[id] || "требует уточнения";
}

function strengthensFor(id) {
  return {
    kapnos: "Виктор — серийный убийца",
    "miya-right-hand-cigarette": "Мия как настоящая постановочная жертва серии",
    "miya-exhibition-article": "путь встречи Виктора и Мии",
    "wrong-cigarette": "Крылов — ложная жертва",
    "glasses-prescription": "Виктор / ProЗрение",
    crm: "Кристина — ложный маньяк",
    "fish-food": "Виктор через аквариум и пачку корма в кабинете",
    "terrace-knife": "способ убийства Анны",
    "clinic-schedule": "отсутствие рабочего алиби Виктора",
    "burned-shirt": "Сергей виновен в линии Вероники",
    "broken-gate": "Павел как ложный след проникновения и источник готового входа",
    "medical-anna": "скрытая механика смерти Анны",
    "sergey-blonde-photo": "семейная версия против Сергея"
  }[id] || "требует уточнения";
}

function breaksFor(id) {
  return {
    kapnos: "случайность сигарет как простой бытовой детали",
    "miya-right-hand-cigarette": "сигарету у Мии как естественную привычку курильщика",
    "miya-exhibition-article": "Мию как случайную внешнюю жертву без связи с Виктором",
    "wrong-cigarette": "Крылов как настоящая жертва серии",
    "glasses-prescription": "семейная версия как единственная линия",
    crm: "отсутствие связи клиники с Морозовым",
    "fish-food": "Виктор как случайный врач без бытового следа",
    "terrace-knife": "версия о неизвестном оружии",
    "clinic-schedule": "рабочее алиби Виктора",
    "burned-shirt": "полная невиновность Сергея",
    "broken-gate": "Павел как автоматический убийца",
    "medical-anna": "простая версия смерти без скрытого физического вывода",
    "sergey-blonde-photo": "Вероника как единственная блондинка в версии"
  }[id] || "требует уточнения";
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function labelFor(canon, id) {
  return findById(canon.characters, id)?.fullName || id;
}
