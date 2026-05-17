import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const titles = [
  {
    slug: 'solo-leveling-season-2',
    name: 'Один в поле воин: Пробуждение тени',
    description:
      'Продолжение истории Сон Джин-у — охотника, однажды вставшего перед лицом смерти в двойном подземелье. Теперь, освоив способности системы «Воскрешения мёртвых», он набирает армию теней и готовится к схватке с силами иного мира, угрожающими всей планете.',
    genres: ['Экшен', 'Фэнтези', 'Приключения'],
    tags: ['ранобэ', 'манхва', 'RPG-система', 'тёмное фэнтези'],
    ageRating: '16+',
    originalReleaseDate: new Date('2025-01-04'),
    episodes: [
      { number: 1, name: 'Тень', durationMinutes: 24 },
      { number: 2, name: 'Пробуждение', durationMinutes: 24 },
      { number: 3, name: 'Армия мёртвых', durationMinutes: 24 },
      { number: 4, name: 'Монарх', durationMinutes: 24 },
    ],
  },
  {
    slug: 'sakamoto-days',
    name: 'Дни Сакамото',
    description:
      'Тару Сакамото — легендарный киллер, решивший завязать с прошлым ради семьи. Он открыл небольшой магазин у дома, растолстел и превратился в обычного папашу. Но прошлое не забывает о нём — и ему снова придётся вспомнить, как держать оружие.',
    genres: ['Экшен', 'Комедия', 'Сёнен'],
    tags: ['манга', 'боевые искусства', 'бывший профессионал', 'ситком'],
    ageRating: '16+',
    originalReleaseDate: new Date('2025-01-11'),
    episodes: [
      { number: 1, name: 'Лучший день', durationMinutes: 24 },
      { number: 2, name: 'Охота', durationMinutes: 24 },
      { number: 3, name: 'Старый друг', durationMinutes: 24 },
      { number: 4, name: 'Операция «Магазин»', durationMinutes: 24 },
      { number: 5, name: 'Пятеро против одного', durationMinutes: 24 },
    ],
  },
  {
    slug: 'kaiju-no-8-season-2',
    name: 'Кайдзю №8 — 2 сезон',
    description:
      'Кафка Хибино мечтал стать бойцом Сил обороны, но теперь он сам является кайдзю №8 — угрозой, которую обязаны уничтожить его же сослуживцы. Второй сезон разворачивается вокруг масштабного вторжения Главных монстров и финальной проверки для Кафки.',
    genres: ['Экшен', 'Фэнтези', 'Сёнен'],
    tags: ['манга', 'монстры', 'трансформация', 'военная организация'],
    ageRating: '16+',
    originalReleaseDate: new Date('2025-07-05'),
    episodes: [
      { number: 1, name: 'Час икс', durationMinutes: 24 },
      { number: 2, name: 'Главные монстры', durationMinutes: 24 },
      { number: 3, name: 'Разоблачение', durationMinutes: 24 },
    ],
  },
  {
    slug: 'lazarus',
    name: 'Лазарь',
    description:
      'В недалёком будущем учёный разрабатывает препарат «Амаrita», способный победить любую болезнь. Но у него есть одна страшная цена: спустя несколько лет принявшие его неизбежно погибнут. Агент Скай получает задание разыскать создателя, пока время не истекло.',
    genres: ['Экшен', 'Триллер', 'Научная фантастика'],
    tags: ['оригинальное аниме', 'MAPPA', 'антиутопия', 'детектив'],
    ageRating: '18+',
    originalReleaseDate: new Date('2025-07-05'),
    episodes: [
      { number: 1, name: 'Сделка', durationMinutes: 25 },
      { number: 2, name: 'Охотник', durationMinutes: 25 },
      { number: 3, name: 'Следы', durationMinutes: 25 },
      { number: 4, name: 'Побочные эффекты', durationMinutes: 25 },
    ],
  },
  {
    slug: 'blue-lock-season-2',
    name: 'Синяя тюрьма — 2 сезон',
    description:
      'После завершения отбора лучшие игроки «Синей тюрьмы» выходят на международную арену. Юичи Исаги сталкивается с мировыми звёздами футбола и понимает: эго и стремление к голу — единственное, что даст ему шанс стать лучшим бомбардиром планеты.',
    genres: ['Спорт', 'Сёнен', 'Драма'],
    tags: ['манга', 'футбол', 'конкуренция', 'психология победы'],
    ageRating: '12+',
    originalReleaseDate: new Date('2025-04-05'),
    episodes: [
      { number: 1, name: 'Новый мир', durationMinutes: 24 },
      { number: 2, name: 'Столкновение эго', durationMinutes: 24 },
      { number: 3, name: 'Химия', durationMinutes: 24 },
      { number: 4, name: 'Мировой уровень', durationMinutes: 24 },
      { number: 5, name: 'Инстинкт', durationMinutes: 24 },
      { number: 6, name: 'Нападение', durationMinutes: 24 },
    ],
  },
  {
    slug: 'apothecary-diaries-season-2',
    name: 'Дневник аптекаря — 2 сезон',
    description:
      'Маомао продолжает раскрывать тайны императорского двора. Теперь она сталкивается с интригами внешнего гарема и политическими манипуляциями, которые угрожают не только жизни отдельных людей, но и стабильности целой империи.',
    genres: ['Драма', 'Детектив', 'Исторический', 'Романтика'],
    tags: ['ранобэ', 'императорский двор', 'медицина', 'сильная героиня'],
    ageRating: '12+',
    originalReleaseDate: new Date('2025-01-04'),
    episodes: [
      { number: 1, name: 'Возвращение', durationMinutes: 24 },
      { number: 2, name: 'Новый яд', durationMinutes: 24 },
      { number: 3, name: 'Внешний гарем', durationMinutes: 24 },
      { number: 4, name: 'Союзница', durationMinutes: 24 },
      { number: 5, name: 'Западня', durationMinutes: 24 },
    ],
  },
  {
    slug: 'dandadan',
    name: 'Дандадан',
    description:
      'Момо Аясэ верит в призраков, но не верит в пришельцев. Кэн Окарун — наоборот. После спора они оба оказываются в эпицентре паранормальных событий: пришельцы крадут кое-что важное у Окаруна, а призраки атакуют Момо. Так рождается невероятный дуэт.',
    genres: ['Экшен', 'Комедия', 'Сверхъестественное', 'Романтика'],
    tags: ['манга', 'паранормальное', 'пришельцы', 'призраки', 'Science SARU'],
    ageRating: '16+',
    originalReleaseDate: new Date('2024-10-03'),
    episodes: [
      { number: 1, name: 'Вот так началась история любви Момо Аясэ', durationMinutes: 26 },
      { number: 2, name: 'Окарун', durationMinutes: 26 },
      { number: 3, name: 'Серёзно!?', durationMinutes: 26 },
      { number: 4, name: 'Огненная ведьма', durationMinutes: 26 },
    ],
  },
  {
    slug: 'dragon-ball-daima',
    name: 'Драконий жемчуг: Дайма',
    description:
      'Из-за козней злодея всесильный Гоку и его друзья превращаются в детей. Чтобы вернуть нормальный облик, им предстоит отправиться в Тёмное царство демонов и разыскать особые сферы дракона. Новый проект, созданный при участии самого Акиры Торияма.',
    genres: ['Экшен', 'Приключения', 'Фэнтези', 'Сёнен'],
    tags: ['классика', 'Торияма', 'приключение', 'дети'],
    ageRating: '6+',
    originalReleaseDate: new Date('2024-10-11'),
    episodes: [
      { number: 1, name: 'Потусторонний мир', durationMinutes: 24 },
      { number: 2, name: 'Маленький Гоку', durationMinutes: 24 },
      { number: 3, name: 'Демонический мир', durationMinutes: 24 },
      { number: 4, name: 'Новый путь', durationMinutes: 24 },
    ],
  },
  {
    slug: 're-zero-season-3',
    name: 'Re:Жизнь в альтернативном мире с нуля — 3 сезон',
    description:
      'Субару Нацуки продолжает свой путь в другом мире. После событий в Святилище ему предстоит столкнуться с Консилиумом Мудрецов и силами Архиепископов Греха, которые замышляют уничтожить само понятие «возвращения по смерти».',
    genres: ['Фэнтези', 'Драма', 'Приключения', 'Тёмное фэнтези'],
    tags: ['ранобэ', 'исекай', 'возврат к смерти', 'психологическое'],
    ageRating: '16+',
    originalReleaseDate: new Date('2024-10-03'),
    episodes: [
      { number: 1, name: 'После шторма', durationMinutes: 24 },
      { number: 2, name: 'Консилиум', durationMinutes: 24 },
      { number: 3, name: 'Архиепископ', durationMinutes: 24 },
      { number: 4, name: 'Петля', durationMinutes: 24 },
      { number: 5, name: 'Без возврата', durationMinutes: 24 },
    ],
  },
  {
    slug: 'ranma-1-2-2024',
    name: 'Ранма ½ (2024)',
    description:
      'Обновлённая экранизация классической манги Румико Такахаси. Ранма Саотоме — боец боевых искусств, проклятый превращаться в девушку при контакте с холодной водой. Жизнь в доме невесты-Акане Тэндо превращается в нескончаемый хаос.',
    genres: ['Комедия', 'Романтика', 'Экшен', 'Боевые искусства'],
    tags: ['классика', 'Такахаси', 'гендерная инверсия', 'ремейк'],
    ageRating: '12+',
    originalReleaseDate: new Date('2024-10-05'),
    episodes: [
      { number: 1, name: 'Девушка-боец', durationMinutes: 24 },
      { number: 2, name: 'Акане', durationMinutes: 24 },
      { number: 3, name: 'Горячий источник', durationMinutes: 24 },
      { number: 4, name: 'Соперник', durationMinutes: 24 },
    ],
  },
];

type AnimeListStatus = 'WATCHING' | 'WATCHED' | 'DROPPED' | 'PLANNED';

const userProfiles: Record<string, { bio: string; list: { slug: string; status: AnimeListStatus; daysAgo: number }[] }> = {
  admin: {
    bio: 'Администратор DreamyVoice. Слежу за качеством озвучки и новинками сезона.',
    list: [
      { slug: 'lazarus',                   status: 'WATCHING', daysAgo: 1  },
      { slug: 'kaiju-no-8-season-2',       status: 'WATCHING', daysAgo: 2  },
      { slug: 'sakamoto-days',             status: 'WATCHING', daysAgo: 3  },
      { slug: 'blue-lock-season-2',        status: 'WATCHING', daysAgo: 5  },
      { slug: 'solo-leveling-season-2',    status: 'WATCHED',  daysAgo: 10 },
      { slug: 'apothecary-diaries-season-2', status: 'WATCHED', daysAgo: 12 },
      { slug: 'dandadan',                  status: 'WATCHED',  daysAgo: 20 },
      { slug: 're-zero-season-3',          status: 'WATCHED',  daysAgo: 25 },
      { slug: 'ranma-1-2-2024',            status: 'PLANNED',  daysAgo: 30 },
      { slug: 'dragon-ball-daima',         status: 'DROPPED',  daysAgo: 40 },
    ],
  },
  testuser99: {
    bio: 'Люблю исекай и боевые аниме. Смотрю всё что выходит в этом сезоне.',
    list: [
      { slug: 'solo-leveling-season-2',      status: 'WATCHING', daysAgo: 0  },
      { slug: 'lazarus',                     status: 'WATCHING', daysAgo: 1  },
      { slug: 're-zero-season-3',            status: 'WATCHED',  daysAgo: 5  },
      { slug: 'dandadan',                    status: 'WATCHED',  daysAgo: 8  },
      { slug: 'dragon-ball-daima',           status: 'WATCHED',  daysAgo: 12 },
      { slug: 'ranma-1-2-2024',             status: 'WATCHED',  daysAgo: 16 },
      { slug: 'apothecary-diaries-season-2', status: 'WATCHED',  daysAgo: 20 },
      { slug: 'sakamoto-days',               status: 'WATCHED',  daysAgo: 25 },
      { slug: 'blue-lock-season-2',          status: 'WATCHED',  daysAgo: 30 },
      { slug: 'kaiju-no-8-season-2',         status: 'PLANNED',  daysAgo: 35 },
    ],
  },
  ragrag: {
    bio: 'Новенький здесь. Только начинаю смотреть аниме.',
    list: [
      { slug: 'dandadan',                  status: 'WATCHING', daysAgo: 0  },
      { slug: 'solo-leveling-season-2',    status: 'PLANNED',  daysAgo: 1  },
      { slug: 'sakamoto-days',             status: 'PLANNED',  daysAgo: 2  },
      { slug: 'ranma-1-2-2024',            status: 'WATCHED',  daysAgo: 5  },
    ],
  },
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86400000);
}

async function main() {
  console.log('Seeding titles...');

  const titleIdBySlug: Record<string, string> = {};

  for (const data of titles) {
    const { episodes, genres, tags, ...titleData } = data;

    const genreRecords = await Promise.all(
      genres.map((name) =>
        prisma.genre.upsert({ where: { name }, create: { name }, update: {} }),
      ),
    );

    const tagRecords = await Promise.all(
      tags.map((name) =>
        prisma.tag.upsert({ where: { name }, create: { name }, update: {} }),
      ),
    );

    const title = await prisma.title.upsert({
      where: { slug: titleData.slug },
      create: {
        ...titleData,
        published: true,
        genres: { connect: genreRecords.map((g) => ({ id: g.id })) },
        tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
      },
      update: {
        ...titleData,
        published: true,
        genres: { set: genreRecords.map((g) => ({ id: g.id })) },
        tags: { set: tagRecords.map((t) => ({ id: t.id })) },
      },
    });

    titleIdBySlug[title.slug] = title.id;

    for (const ep of episodes) {
      await prisma.episode.upsert({
        where: { titleId_number: { titleId: title.id, number: ep.number } },
        create: {
          titleId: title.id,
          number: ep.number,
          durationMinutes: ep.durationMinutes,
          playerSrc: `https://example.com/watch/${titleData.slug}/ep${ep.number}`,
          published: true,
        },
        update: {
          durationMinutes: ep.durationMinutes,
          published: true,
        },
      });
    }

    console.log(`  + ${title.name} (${episodes.length} эп.)`);
  }

  console.log('\nSeeding user profiles and anime lists...');

  for (const [username, profile] of Object.entries(userProfiles)) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log(`  ! Пользователь ${username} не найден, пропускаю`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { bio: profile.bio },
    });

    for (const entry of profile.list) {
      const titleId = titleIdBySlug[entry.slug];
      if (!titleId) continue;
      const updatedAt = daysAgo(entry.daysAgo);
      await prisma.animeListEntry.upsert({
        where: { userId_titleId: { userId: user.id, titleId } },
        create: { userId: user.id, titleId, status: entry.status, updatedAt },
        update: { status: entry.status, updatedAt },
      });
    }

    console.log(`  + ${username}: bio + ${profile.list.length} записей`);
  }

  console.log(`\nГотово.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
