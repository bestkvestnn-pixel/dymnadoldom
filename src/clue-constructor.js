export function createClueConstructor(canon, chapterArchitect) {
  return {
    name: "Конструктор улик",
    buildClueSystem: () => buildClueSystem(canon, chapterArchitect),
    buildSuspectClueMatrix: () => buildSuspectClueMatrix(),
    runQualityCheck: () => runQualityCheck(buildClueSystem(canon, chapterArchitect))
  };
}

export function buildClueSystem(canon, chapterArchitect) {
  const architectures = chapterArchitect.buildArchitectures();
  return architectures.map((chapter) => ({
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    clues: cluesForChapter(chapter.id),
    falseClues: falseCluesForChapter(chapter.id),
    keyClues: keyCluesForChapter(chapter.id),
    revealMap: revealMapForChapter(chapter.id)
  }));
}

export function buildSuspectClueMatrix() {
  return [
    suspect("Сергей Павлович Акунин",
      ["сожженная рубашка", "фото с блондинкой", "два телефона / две SIM"],
      ["позднее выясняется, что Вероника мертва раньше Анны", "KAPNOS и ProЗрение ведут к Виктору"],
      "сильная вина в линии Вероники маскируется под вину в смерти Анны"
    ),
    suspect("Иванов Виктор Иванович",
      ["рецепт Иванов В.И.", "KAPNOS как постановочный знак", "сигарета в правой руке левши Мии", "нож с террасы", "оторванный уголок рыбного корма", "расписание ProЗрение без смен в нужные окна"],
      ["не курит, поэтому сначала не выглядит владельцем сигарет", "нет прямого фото/очевидца у места убийства", "скрывается за профессиональной рутиной ProЗрение"],
      "врач выглядит как источник документов, а не как убийца"
    ),
    suspect("Тихонов",
      ["курит KAPNOS", "почта с фото Сергея и блондинки", "конфликт с Сергеем"],
      ["нет полной связки с Морозовым, Мией и Анной", "KAPNOS объясняет привычку Анны, но не серию"],
      "сигаретный след кажется прямым, но не собирает серию"
    ),
    suspect("Левин Павел Евгеньевич",
      ["взломанная калитка", "проникновение накануне", "кража шарфа Анны с запахом ее духов"],
      ["его след датирован накануне", "взлом объясняет путь входа, но не серийный паттерн"],
      "физический взлом выглядит как путь убийцы, пока не станет ясно, что калиткой мог воспользоваться другой"
    ),
    suspect("Кристина",
      ["архивная CRM-карта Морозова", "переход из «Золотого квадрата» в ProЗрение", "склонность к фантазированию"],
      ["CRM-след объясняется новой работой после смерти Анны", "нет связи с Мией и Анной как серией"],
      "CRM делает ее ложным мостом между Анной и клиникой во второй главе"
    ),
    suspect("Лихачев",
      ["знаком с Морозовым", "знаком с Крыловым", "часы на фото без лица"],
      ["не связан с Мией", "Крылов ложная жертва"],
      "частичная связка выглядит как серия, пока игрок не проверит Мию"
    )
  ];
}

export function runQualityCheck(chapterSystems) {
  return chapterSystems.flatMap((chapter) =>
    chapter.clues.map((clue) => ({
      chapter: chapter.chapterTitle,
      clue: clue.title,
      canSolveWithoutIt: clue.category === "проверочная" ? "да" : "нет",
      hasFunction: Boolean(clue.trueMeaning && clue.document),
      duplicatesAnother: "нет",
      revealsTooEarly: clue.revealsTooEarly ? "да" : "нет",
      logicalInference: Boolean(clue.playerLaterUnderstands),
      linkedToOtherClues: clue.nextDocuments.length > 0,
      status:
        Boolean(clue.trueMeaning && clue.document && clue.playerLaterUnderstands) && !clue.revealsTooEarly
          ? "рабочая"
          : "требует переработки"
    }))
  );
}

function cluesForChapter(chapterId) {
  const byChapter = {
    "chapter-1": [
      clue({
        title: "Сожженная счастливая рубашка",
        type: "физическая",
        foundAt: "протокол осмотра сожженных остатков",
        possibleOwner: "Сергей Акунин",
        trueMeaning: "Сергей скрывает убийство Вероники, а не убийство Анны.",
        firstThought: "Сергей уничтожал одежду после убийства Анны или после совместной истории с Вероникой.",
        playerLaterUnderstands: "Рубашка относится к линии Вероники и не закрывает смерть Анны.",
        document: "протокол осмотра + опознание Игорем Волковым",
        category: "явная",
        opens: "Сергей виновен, но нужно локализовать его вину.",
        confirms: "Признание по Веронике.",
        disproves: "Полную невиновность Сергея.",
        nextDocuments: ["1-й допрос Сергея", "3-й допрос Сергея"]
      }),
      clue({
        title: "Фото Сергея с блондинкой",
        type: "документальная",
        foundAt: "почта Тихонова",
        possibleOwner: "Тихонов / Сергей / Жанна",
        trueMeaning: "Фото создает мотив ревности, но блондинка не обязана быть Вероникой.",
        firstThought: "Сергей изменял Анне с Вероникой.",
        playerLaterUnderstands: "Жанна и Вероника могут быть спутаны со спины.",
        document: "распечатка письма с вложением",
        category: "скрытая",
        opens: "Путаница Жанны и Вероники.",
        confirms: "Тихонов связан с передачей фото.",
        disproves: "Веронику как единственную блондинку в версии.",
        nextDocuments: ["допрос соседа о Жанне", "3-й допрос Сергея"]
      }),
      clue({
        title: "Медицинские документы Анны",
        type: "документальная",
        foundAt: "пакет документов главы 1",
        possibleOwner: "Анна Акунина",
        trueMeaning: "Вывих левого плеча указывает, что Анна была за рулем.",
        firstThought: "Медицинский фон о прошлом Анны и Сергее.",
        playerLaterUnderstands: "Физическая деталь меняет реконструкцию события.",
        document: "старая и свежая медицинская карта",
        category: "ключевая",
        opens: "Механика смерти Анны требует физической реконструкции.",
        confirms: "Скрытый телесный факт Анны.",
        disproves: "Простую семейную версию без физической проверки.",
        nextDocuments: ["камера 20:45–20:48", "финальная медицинская реконструкция"]
      })
    ],
    "chapter-2": [
      clue({
        title: "Рецепт на очки с подписью Иванов В.И.",
        type: "документальная",
        foundAt: "материалы Морозова",
        possibleOwner: "Виктор Иванов",
        trueMeaning: "Морозов связан с врачом-офтальмологом Виктором и ProЗрение.",
        firstThought: "Обычный медицинский документ.",
        playerLaterUnderstands: "Подпись врача связывает жертву №1 с будущим финальным убийцей.",
        document: "бланк рецепта ProЗрение",
        category: "ключевая",
        opens: "Клиника становится центром второй главы.",
        confirms: "Связь Морозова с ProЗрение.",
        disproves: "Семейную версию как единственный слой.",
        nextDocuments: ["CRM ProЗрение", "общий снимок персонала"]
      }),
      clue({
        title: "Архивный CRM-след Кристины по Морозову",
        type: "цифровая",
        foundAt: "выгрузка CRM клиники",
        possibleOwner: "Кристина",
        trueMeaning: "Кристина работала с архивной картой Морозова после перехода в ProЗрение и создает ложный мост к клинике.",
        firstThought: "Кристина лично связана с жертвой и клиникой подозрительно тесно.",
        playerLaterUnderstands: "След рабочий и поздний, а не контакт с живым Морозовым.",
        document: "таблица CRM / служебная выгрузка",
        category: "проверочная",
        opens: "Ложная версия Кристины.",
        confirms: "Кристина действительно появилась в материалах Морозова уже как сотрудница ProЗрение.",
        disproves: "Отсутствие связи клиники с Морозовым.",
        nextDocuments: ["рецепт на очки", "допрос Кристины"]
      }),
      clue({
        title: "Сигарета в правой руке Мии",
        type: "физическая",
        foundAt: "место смерти Мии / заметки Артура Скорого",
        possibleOwner: "Мия Тищенко / Виктор Иванов",
        trueMeaning: "Мия была левшой, поэтому сигарета в правой руке выглядит вложенной после смерти.",
        firstThought: "Еще одна сигарета подтверждает серию.",
        playerLaterUnderstands: "Постановка сигареты у Мии честно показывает руку убийцы: это не привычка жертвы, а знак, оставленный снаружи.",
        document: "материал Артура Скорого о Мии",
        category: "ключевая",
        opens: "Мия входит в настоящую постановочную серию.",
        confirms: "KAPNOS как маркер, который оставляет убийца.",
        disproves: "сигарету у Мии как естественную привычку курильщика.",
        nextDocuments: ["газетный номер об Анне и выставке Мии", "сводка KAPNOS"]
      }),
      clue({
        title: "Статья о выставке Мии",
        type: "документальная",
        foundAt: "газетный номер с материалом об убийстве Анны",
        possibleOwner: "Мия Тищенко / Артур Скорый / Виктор Иванов",
        trueMeaning: "На выставке Виктор впервые пересекся с Мией.",
        firstThought: "Обычный культурный материал рядом с криминальной статьей.",
        playerLaterUnderstands: "Газетный фон становится маршрутом выбора жертвы.",
        document: "газета 20.02.2026",
        category: "скрытая",
        opens: "Путь знакомства Виктора и Мии.",
        confirms: "Связь Мии с публичным событием.",
        disproves: "Мию как случайную внешнюю жертву без точки контакта.",
        nextDocuments: ["материал Артура Скорого о Мии", "расписание ProЗрение"]
      }),
      clue({
        title: "Сигарета другой марки у Крылова",
        type: "физическая",
        foundAt: "материалы убийства Крылова",
        possibleOwner: "Денис Крылов / неизвестный",
        trueMeaning: "Крылов не входит в настоящую серию Виктора.",
        firstThought: "Еще одна сигарета подтверждает серию.",
        playerLaterUnderstands: "Другая марка ломает принадлежность к серии.",
        document: "протокол осмотра места Крылова",
        category: "ключевая",
        opens: "Ложная жертва / ложная связка.",
        confirms: "Крылов похож на серию только поверхностно.",
        disproves: "Крылова как настоящую жертву Виктора.",
        nextDocuments: ["сводка KAPNOS", "материалы Морозова и Мии"]
      }),
      clue({
        title: "Оторванный уголок рыбного корма",
        type: "косвенная",
        foundAt: "материалы осмотра после смерти Анны",
        possibleOwner: "Виктор Иванов",
        trueMeaning: "Услышав приезд Сергея, Виктор торопливо доставал пачку KAPNOS, чтобы вложить сигарету в руку Анны; из его кармана выпал уголок пачки корма, которого он не заметил.",
        firstThought: "Слабая бытовая мелочь.",
        playerLaterUnderstands: "Газетная реклама и фото кабинета Виктора с такой пачкой превращают мусор в персональную ошибку.",
        document: "фото мусора / служебная заметка",
        category: "скрытая",
        opens: "Аквариум Виктора и конкретная пачка корма.",
        confirms: "Неброский персональный след.",
        disproves: "Виктора как случайного врача без бытового следа.",
        nextDocuments: ["газетная реклама рыбного корма", "фото кабинета Виктора"]
      })
    ],
    "chapter-3": [
      clue({
        title: "Взломанная калитка",
        type: "физическая",
        foundAt: "калитка дома Анны и Сергея",
        possibleOwner: "Павел Левин / неизвестный, кто воспользовался взломанной калиткой",
        trueMeaning: "Павел взломал калитку, которой позже воспользовался Виктор.",
        firstThought: "Павел мог убить Анну.",
        playerLaterUnderstands: "Павел объясняет путь входа, но не мотив и не серийный паттерн.",
        document: "акт осмотра взломанной калитки",
        category: "финальная",
        opens: "Разведение взлома Павла и убийства Анны.",
        confirms: "Павел взломал калитку.",
        disproves: "Павла как автоматического убийцу.",
        nextDocuments: ["протокол ножа с террасы", "расписание ProЗрение"]
      }),
      clue({
        title: "Нож с террасы",
        type: "физическая",
        foundAt: "терраса / дом Анны",
        possibleOwner: "Анна / Сергей / Виктор",
        trueMeaning: "Виктор использовал найденный на террасе нож как оружие убийства.",
        firstThought: "Следы Сергея на домашнем/террасном ноже усиливают семейную версию.",
        playerLaterUnderstands: "Следы Сергея могли появиться раньше при бытовом контакте; нож доказывает способ, но не Сергея как убийцу.",
        document: "протокол осмотра ножа с террасы",
        category: "финальная",
        opens: "Способ убийства Анны.",
        confirms: "Оружие не принесено извне.",
        disproves: "версию о заранее принесенном оружии или прямом следе Сергея как достаточном доказательстве.",
        nextDocuments: ["уголок рыбного корма", "сводка ложных следов Сергея"]
      }),
      clue({
        title: "Расписание ProЗрение",
        type: "документальная",
        foundAt: "клиника ProЗрение",
        possibleOwner: "Виктор Иванов / администраторская система",
        trueMeaning: "Виктор не работал в клинике в окна убийств; кадровые записи вместе с рассказом Натальи также раскрывают его отпуск.",
        firstThought: "Обычный рабочий график.",
        playerLaterUnderstands: "Это не доказывает присутствие на местах, но разрушает профессиональное алиби и объясняет начало серии весной 2025 года и разный темп подготовки к Анне и Мие.",
        document: "табель смен / расписание приема ProЗрение",
        category: "финальная",
        opens: "Окна возможностей Виктора.",
        confirms: "Виктор не был на приеме в нужное время; отпуск подтверждается вторым источником через Наталью.",
        disproves: "утверждение, что рабочий график исключал возможность действий Виктора.",
        nextDocuments: ["сводка KAPNOS", "фото кабинета Виктора"]
      }),
      clue({
        title: "Газетная реклама корма и фото кабинета Виктора",
        type: "перекрестная",
        foundAt: "газета / фото кабинета ProЗрение",
        possibleOwner: "Виктор Иванов",
        trueMeaning: "Оторванный уголок совпадает с пачкой корма в кабинете Виктора.",
        firstThought: "Реклама и фото выглядят фоном.",
        playerLaterUnderstands: "Два фоновых документа расшифровывают почти бесполезный фрагмент.",
        document: "газетная полоса + фото кабинета Виктора",
        category: "финальная",
        opens: "Ошибка Виктора.",
        confirms: "Связь уголка с конкретной пачкой корма.",
        disproves: "случайный мусор как незначимую деталь.",
        nextDocuments: ["финальная форма ответа", "сводка ложных версий"]
      }),
      clue({
        title: "Сводка KAPNOS",
        type: "документальная",
        foundAt: "финальная аналитическая таблица",
        possibleOwner: "следствие / игрок",
        trueMeaning: "KAPNOS связывает настоящие смерти, а другая марка отделяет Крылова.",
        firstThought: "Сводная повторялка уже известных сигарет.",
        playerLaterUnderstands: "Это карта настоящей и ложной серии.",
        document: "сводка сигаретных следов",
        category: "финальная",
        opens: "Серия Виктора.",
        confirms: "Морозов, Мия, Анна — настоящая серия.",
        disproves: "Крылова как часть настоящей серии.",
        nextDocuments: ["финальный допрос", "карточка ответа"]
      })
    ]
  };

  return byChapter[chapterId];
}

function falseCluesForChapter(chapterId) {
  const byChapter = {
    "chapter-1": [
      falseClue("Молчание Сергея о Веронике", "Вероника была соучастницей убийства Анны, и Сергей ее покрывает", "когда игрок обнаруживает, что Вероника уже мертва"),
      falseClue("Фото Сергея с блондинкой", "Сергей убил Анну из ревности", "когда игрок разводит Жанну и Веронику"),
      falseClue("Сожженная рубашка", "Сергей убил Анну", "когда признание по Веронике локализует вину Сергея")
    ],
    "chapter-2": [
      falseClue("Архивный CRM-след Кристины", "Кристина — маньяк", "когда след объясняется поздней архивной работой в ProЗрение"),
      falseClue("Сигарета у Крылова", "Крылов — настоящая жертва серии", "когда игрок сравнивает марку с KAPNOS")
    ],
    "chapter-3": [
      falseClue("Взломанная калитка", "Павел убил Анну", "когда выясняется, что Павел создал путь входа, но не объясняет серию и ошибку с рыбным кормом"),
      falseClue("KAPNOS у Тихонова", "Тихонов организовал убийство", "когда KAPNOS объясняет привычку Анны, но не серию")
    ]
  };

  return byChapter[chapterId];
}

function keyCluesForChapter(chapterId) {
  return cluesForChapter(chapterId)
    .filter((clue) => clue.category === "ключевая" || clue.category === "финальная")
    .map((clue) => clue.title);
}

function revealMapForChapter(chapterId) {
  return cluesForChapter(chapterId).map((clue) => ({
    clue: clue.title,
    conclusion: clue.opens,
    nextClue: clue.nextDocuments[0] || "следующая глава",
    newConclusion: clue.playerLaterUnderstands
  }));
}

function clue({
  title,
  type,
  foundAt,
  possibleOwner,
  trueMeaning,
  firstThought,
  playerLaterUnderstands,
  document,
  category,
  opens,
  confirms,
  disproves,
  nextDocuments,
  revealsTooEarly = false
}) {
  return {
    title,
    type,
    foundAt,
    possibleOwner,
    trueMeaning,
    firstThought,
    playerLaterUnderstands,
    document,
    category,
    status: category === "ключевая" || category === "финальная" ? "ключевая" : "рабочая",
    opens,
    confirms,
    disproves,
    nextDocuments,
    revealsTooEarly
  };
}

function falseClue(title, leadsTo, exposedWhen) {
  return {
    title,
    leadsTo,
    whyImportant: "Кажется важной, потому что подтверждает видимую версию игрока.",
    disprovedBy: exposedWhen,
    playerCanKnowWhen: exposedWhen
  };
}

function suspect(name, against, inFavor, falseSuspicion) {
  return { name, against, inFavor, falseSuspicion };
}
