const requiredCharacterFields = [
  "fullName",
  "dateOfBirth",
  "appearance",
  "profession",
  "connections",
  "character",
  "biography",
  "secrets",
  "alibi",
  "crimes"
];

export function createCanonKeeper(canon) {
  return {
    name: "Хранитель канона",
    audit: () => auditCanon(canon),
    buildBoard: () => buildInvestigationBoard(canon),
    impactMap: (change) => buildImpactMap(canon, change),
    answerQuestion: (question) => answerCanonQuestion(canon, question)
  };
}

export function auditCanon(canon) {
  const issues = {
    critical: [],
    medium: [],
    minor: [],
    potential: []
  };

  for (const character of canon.characters) {
    for (const field of requiredCharacterFields) {
      if (character[field] === null || character[field] === undefined || character[field] === "") {
        issues.medium.push(issue("Неполная карточка персонажа", character.fullName, `Не заполнено поле: ${field}.`));
      }
    }

    if (character.age === null && !character.ageNote) {
      issues.potential.push(issue("Возраст требует уточнения", character.fullName, "Проверка биографии и возраста пока невозможна."));
    }
  }

  for (const event of canon.events) {
    if (!event.date) {
      issues.potential.push(issue("Дата события не задана", event.id, "Хронология держится только на времени, без календарной даты."));
    }

    for (const participantId of event.participants) {
      if (!findById(canon.characters, participantId)) {
        issues.critical.push(issue("Участник события отсутствует в персонажах", event.id, `Не найден персонаж: ${participantId}.`));
      }
    }
  }

  for (const evidence of canon.evidence) {
    for (const ownerId of evidence.possibleOwners) {
      if (!findById(canon.characters, ownerId)) {
        issues.medium.push(issue("Улика ссылается на неизвестного персонажа", evidence.id, `Не найден персонаж: ${ownerId}.`));
      }
    }
  }

  const eventCollisions = findEventCollisions(canon.events);
  issues.critical.push(...eventCollisions);

  if (issues.critical.length === 0 && issues.medium.length === 0) {
    issues.minor.push(issue("Критичных противоречий не найдено", "аудит", "Текущий канон логически собирается, но часть дат и возрастов требует уточнения."));
  }

  return issues;
}

export function buildInvestigationBoard(canon) {
  const nodes = [
    ...canon.characters.map((character) => ({
      id: character.id,
      label: character.fullName,
      type: "персонаж",
      status: character.status,
      description: character.profession,
      portrait: character.portrait || null
    })),
    ...canon.evidence.map((evidence) => ({
      id: evidence.id,
      label: evidence.description,
      type: "улика",
      status: evidence.truthStatus,
      description: evidence.conclusions.join("; ")
    })),
    ...canon.documents.map((document) => ({
      id: document.id,
      label: document.title,
      type: "документ",
      status: "подтверждено",
      description: document.type
    })),
    ...canon.locations.map((location) => ({
      id: location.id,
      label: location.title,
      type: "локация",
      status: "важная",
      description: location.description
    }))
  ];

  const links = [
    ...canon.characters.flatMap((character) =>
      character.connections.map((connection) => ({
        from: character.fullName,
        type: connection.type,
        to: labelFor(canon, connection.targetId),
        status: connection.status,
        comment: "Связь зафиксирована в карточке персонажа."
      }))
    ),
    ...canon.evidence.flatMap((evidence) =>
      evidence.conclusions.map((conclusion) => ({
        from: evidence.description,
        type: "указывает на вывод",
        to: conclusion,
        status: evidence.truthStatus,
        comment: evidence.source
      }))
    )
  ];

  return {
    nodes,
    links,
    theories: canon.theories,
    redHerrings: canon.redHerrings
  };
}

export function buildImpactMap(canon, changeText = "") {
  const text = changeText.toLowerCase();
  const touchedCharacters = canon.characters.filter((item) => text.includes(item.fullName.toLowerCase().split(" ")[0]));
  const touchedEvidence = canon.evidence.filter((item) =>
    [item.id, item.description, item.source].some((value) => value.toLowerCase().split(" ").some((part) => part && text.includes(part)))
  );

  return {
    characters: touchedCharacters.map((item) => item.fullName),
    events: canon.events.filter((event) => event.participants.some((id) => touchedCharacters.some((character) => character.id === id))).map((event) => event.id),
    evidence: touchedEvidence.map((item) => item.id),
    documents: canon.documents.filter((document) => document.characters.some((id) => touchedCharacters.some((character) => character.id === id))).map((item) => item.title),
    theoriesStrengthened: canon.theories.filter((theory) => text.includes(theory.title.toLowerCase().split(" ")[0])).map((item) => item.title),
    theoriesWeakened: [],
    theoriesBroken: []
  };
}

export function answerCanonQuestion(canon, question) {
  const text = question.toLowerCase();
  if (text.includes("серге")) {
    return canon.evidence
      .filter((evidence) => evidence.possibleOwners.includes("sergey") || evidence.conclusions.some((item) => item.toLowerCase().includes("серге")))
      .map((evidence) => `${evidence.id}: ${evidence.description}`);
  }

  if (text.includes("ложн")) {
    return canon.redHerrings.map((item) => `${item.title}: ведет к ${labelFor(canon, item.leadsTo)}; опровергается: ${item.disprovedBy}`);
  }

  if (text.includes("документ")) {
    return canon.documents.map((item) => `${item.title}: ${item.type}; персонажи: ${item.characters.map((id) => labelFor(canon, id)).join(", ")}`);
  }

  return ["Недостаточно данных для структурного ответа. Факт нужно пометить как неподтвержденный или уточнить запрос."];
}

function findEventCollisions(events) {
  const issues = [];
  for (let i = 0; i < events.length; i += 1) {
    for (let j = i + 1; j < events.length; j += 1) {
      const first = events[i];
      const second = events[j];
      const sameTime = first.date && second.date && first.date === second.date && first.time === second.time;
      const differentPlaces = first.placeId !== second.placeId;
      const sharedParticipants = first.participants.filter((id) => second.participants.includes(id));
      if (sameTime && differentPlaces && sharedParticipants.length > 0) {
        issues.push(
          issue(
            "Персонаж одновременно в двух местах",
            `${first.id} / ${second.id}`,
            `Участники: ${sharedParticipants.join(", ")}.`
          )
        );
      }
    }
  }
  return issues;
}

function issue(title, source, detail) {
  return { title, source, detail };
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function labelFor(canon, id) {
  return (
    findById(canon.characters, id)?.fullName ||
    findById(canon.evidence, id)?.description ||
    findById(canon.documents, id)?.title ||
    findById(canon.locations, id)?.title ||
    id
  );
}
