const clueVocabulary = {
  alibi: ["где", "были", "алиби", "время", "момент", "отключение"],
  motive: ["мотив", "зачем", "причина", "контракт", "деньги", "долг", "увольнение"],
  evidence: [
    "улика",
    "термокружка",
    "лекарство",
    "камера",
    "ключ",
    "договор",
    "дым",
    "мята",
    "kapnos",
    "рецепт",
    "сигарет",
    "crm",
    "калитка",
    "рубашка"
  ],
  pressure: ["лжете", "ложь", "признайтесь", "обвиняю", "убили", "убийца"]
};

export function createAgentRuntime(agent, caseFile) {
  let suspicion = 20;
  let stress = 0;
  const memory = [];

  function answer(rawQuestion) {
    const question = rawQuestion.trim();
    const intent = detectIntent(question);
    const triggerHits = agent.stressTriggers.filter((trigger) =>
      question.toLowerCase().includes(trigger.toLowerCase())
    );

    stress = clamp(stress + triggerHits.length * 14 + (intent === "pressure" ? 18 : 4), 0, 100);
    suspicion = clamp(suspicion + triggerHits.length * 5 + (intent === "evidence" ? 4 : 1), 0, 100);

    const reply = buildReply(agent, caseFile, intent, triggerHits, stress);
    memory.push({ question, reply, stress, suspicion });

    return {
      agentId: agent.id,
      reply,
      stress,
      suspicion,
      tell: stress > 55 ? agent.tells : null,
      memory: [...memory]
    };
  }

  return {
    getState: () => ({ stress, suspicion, memory: [...memory] }),
    answer
  };
}

export function detectIntent(question) {
  const text = question.toLowerCase();
  const scores = Object.entries(clueVocabulary).map(([intent, words]) => [
    intent,
    words.filter((word) => text.includes(word)).length
  ]);
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0][1] > 0 ? scores[0][0] : "general";
}

function buildReply(agent, caseFile, intent, triggerHits, stress) {
  const nervousPrefix =
    stress > 70
      ? "Вы давите не туда, детектив. "
      : stress > 45
        ? "Я уже отвечал, но ладно. "
        : "";

  if (intent === "alibi") {
    return `${nervousPrefix}${agent.alibi} Это можно проверить по людям вокруг катка.`;
  }

  if (intent === "motive") {
    return `${nervousPrefix}${softDeny(agent)} Виктор многим портил жизнь, но это еще не делает нас убийцами.`;
  }

  if (intent === "evidence") {
    const fragment = chooseFragment(agent.truthFragments, triggerHits.length + stress);
    const lie = chooseFragment(agent.liePatterns, stress);
    return `${nervousPrefix}${fragment}. Но ${lie}; я не обязан помнить каждую мелочь этой ночи.`;
  }

  if (intent === "pressure") {
    if (agent.id === caseFile.culpritId && stress > 65) {
      return "Нет. Я не признаюсь только потому, что вы красиво складываете случайности. Докажите, что я была у кружки.";
    }

    return `${nervousPrefix}Если хотите обвинять, несите доказательства. Я видел достаточно хаоса, чтобы любой выглядел виновным.`;
  }

  return `${nervousPrefix}${agent.name} смотрит на вас и взвешивает слова: "${chooseFragment(
    agent.truthFragments,
    stress + agent.name.length
  )}. Остальное вы додумываете сами."`;
}

function softDeny(agent) {
  return agent.motive
    ? `Да, у меня была причина злиться: ${agent.motive.toLowerCase()}`
    : "У меня не было причины убивать Виктора.";
}

function chooseFragment(items, seed) {
  return items[Math.abs(seed) % items.length];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
