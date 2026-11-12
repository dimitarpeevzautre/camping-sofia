/* Camping Sofia: the coming-soon page is a small driving game.
   An invented campsite seen from above. Guests arrive at the gate one after another; the player drives each to
   the pitch that lights up. A shift lasts until three guests have given up waiting; when the camp fills, the
   longest-staying guests check out.

   Units are metres. The view is a close overhead camera that follows the vehicle and pulls back with speed;
   anything with height (trees, buildings, roofs) is drawn pushed away from the screen centre in proportion to its
   height, which is what gives the scene depth. */
(() => {
  'use strict';

  const cv = document.getElementById('camp');
  const ctx = cv.getContext('2d');
  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- language ----------
  // English or Bulgarian: ?lang=, then the visitor's earlier choice, then the browser's language. The page is
  // written in English; for Bulgarian the elements marked data-t are rewritten once at load.
  const LANG = (() => {
    let l = null;
    try { l = new URLSearchParams(location.search).get('lang') || localStorage.getItem('camp-lang'); } catch (e) { /* private window */ }
    return l === 'bg' || l === 'en' ? l : (navigator.language || '').toLowerCase().startsWith('bg') ? 'bg' : 'en';
  })();
  const BY = '<a href="https://thestable.bg" target="_blank" rel="noopener">thestable.bg</a>';
  const STR = {
    en: {
      other: 'Български', otherCode: 'bg',
      touchKeys: 'Steer with the left buttons. D drives, R reverses. The small buttons are the handbrake and the horn.',
      names: { van: 'a campervan', motorhome: 'a motorhome', combo: 'a car and caravan' },
      labels: {},
      firstCombo: (n) => `A car and caravan for pitch ${n}. Get the caravan onto the pitch`,
      next: (name, n) => `Next: ${name} for pitch ${n}`,
      packed: (n, p) => `Pitch ${n} packed up and left: −${p}`,
      first: (n) => `First guest: pitch ${n}`,
      jackknife: 'Jackknifed. Pull forward to straighten up',
      bump: (c) => `Bump: −${c}`,
      gaveUp: 'That guest got tired of waiting and left. One ♥ gone',
      parked: (p, a, s, m) => `+${p}: accuracy ${a}, speed ${s}${m > 1 ? `, ×${m}` : ''}`,
      badge: (n) => `Badge earned: ${n}`, badgesTitle: 'Badges', nightBonus: 'Night shift +25%',
      mine: (b, r, n, of) => `Your best: ${b} · ${r} · ${n}/${of} badges`,
      badges: {
        first: 'Welcome: park your first guest', perfect: 'Bullseye: a perfect parking', caravan: 'Reverse gear: park a caravan cleanly',
        streak5: 'On a roll: five clean parkings in a row', streak9: 'Unstoppable: reach the ×3 multiplier', night: 'Night owl: a clean parking after dark',
        vip: 'Red carpet: a perfect parking for a VIP', tips: 'Pocket money: ten tips in one shift', gentle: 'Gentle driver: eight guests without a bump or a scare',
        ten: 'Full house: ten guests in one shift', twenty: 'Rush hour hero: twenty guests in one shift',
        gnomes: 'Gnome hunter: find all ten hidden gnomes', driftpark: 'Handbrake parking: slide straight into a clean parking',
        goals: 'To-do list: all three goals in one shift', strike: 'Strike: knock over four cones in one go',
        errand: 'Room service: five errands in one shift', dog: 'Sausage hero: catch the dog that took the sausages', host: 'Camp host: 1500 points in one shift', legend: 'Legend of Vitosha: 8000 points in one shift',
      },
      quick: 'Lightning!', close2: 'Just in time!', wave: (n) => `${n} guests parked. The next ones are in more of a hurry`,
      boosts: {
        speed: 'Speed boost: ten seconds of extra pace', freeze: 'Time freeze: the guest stops counting for twelve seconds',
        double: 'Double points on your next parking', auto: 'Self-parking: get close to the pitch and let go',
        shield: 'Shield: your next bump or scare is forgiven', rush: 'Tip rush: grab all you can in twenty seconds',
      },
      autoOn: 'Self-parking', shielded: 'Shield!', drift: 'Drift!', stBoosts: 'Boosts picked up',
      ouch: ['Hey! Watch it!', 'Are you blind?', 'Slow down!', 'That was close!'],
      honked: ['Alright, alright!', 'Keep your hair on!', 'Coming through, is it?', 'Charming.'],
      nice: ['Nicely parked!', 'Now that is how it is done.', 'Smooth!', 'Dead centre. Respect.', 'Somebody has done this before.'],
      chats: [
        ['Is that Vitosha up there?', 'Cherni Vrah. Two hours on foot.', 'Tomorrow, then.'],
        ['Where are you in from?', 'Rotterdam. Three days on the road.', 'We came from Plovdiv. Forty minutes.'],
        ['Have you tried the banitsa in town?', 'Twice. Today.', 'Sensible.'],
        ['Is the shower hot?', 'If you are quick.', 'And if I am not?', 'Refreshing.'],
        ['Your awning is leaning.', 'It is a feature.', 'It is a sail.'],
        ['The metro takes you straight to the centre.', 'With the dog?', 'The dog rides for free.'],
        ['Did you hear the owl last night?', 'That was my husband.', 'Impressive range.'],
        ['Can I borrow a tin opener?', 'For a coffee, yes.', 'Deal.'],
        ['Who keeps driving round in circles?', 'New chap at the gate.', 'He will learn.'],
        ['Boyana Church is worth the trip.', 'We were going to the mall.', 'Go to the church.'],
        ['How long are you staying?', 'One night. That was a week ago.', 'It does that.'],
        ['Is that rakia home-made?', 'My grandfather says so.', 'Then one small one.', 'There are no small ones.'],
        ['Mum says dinner is ready.', 'Five more minutes!', 'She said you would say that.'],
        ['Your cat is on my roof again.', 'She likes the solar panel.', 'So do I. It was working.'],
        ['Seven Rila Lakes tomorrow?', 'Only if you drive.', 'Only if you park.'],
        ['Lovely evening.', 'Smells like someone is grilling.', 'That is us. Come over.'],
        ['Is the wifi working for you?', 'Only next to the wash house.', 'So that is why there is a queue.'],
        ['We are off to Rila Monastery.', 'Take a jumper. And an empty stomach.', 'For the doughnuts?', 'For the doughnuts.'],
        ['Nice van. What year?', 'Ninety-four. Same as my knees.', 'Both still going.'],
        ['Did the ice-cream van come by?', 'Twice. Slowly.', 'It only has one speed.'],
        ['Who took my folding chair?', 'The wind. It went towards the pond.', 'Again?'],
        ['Is it far to Vitosha Boulevard?', 'Twenty minutes by metro.', 'And back?', 'Depends on the shopska salad.'],
        ['The new gate keeper is quick.', 'Quick, yes. Careful, we will see.', 'I moved my bins.'],
        ['Any plans for tonight?', 'Fire, guitar, three chords.', 'Which three?', 'Whichever turn up.'],
      ],
      lbEmpty: 'Nobody yet. Be the first', lbFail: 'The scoreboard cannot be reached right now', lbNote: 'Only your nickname and score are stored.',
      lbPlace: (n, w, a) => `${n}: #${w} this week, #${a} of all time`, lead: (n, s) => `This week\'s best: ${n} with ${s}`,
      wardenOn: 'The warden has heard about your driving. Keep clear of the cart', fined: (n) => `The warden caught you. Fine: −${n}`,
      bWarden: 'WARDEN!', bFined: 'FINED!', bPerfect: 'PERFECT!', bRoll: 'ON A ROLL!', bMax: '×3!', bOver: 'SHIFT OVER', bBest: 'NEW BEST!',
      items: ['firewood', 'fresh bread', 'a gas bottle', 'clean laundry', 'ice cream', 'a lost ball'],
      spots: { reception: 'the reception gate', wash: 'the wash house', pond: 'the pond', fire: 'the fire pit' },
      jobAsk: (n, item, spot) => `Pitch ${n} would like ${item}. Pick it up at ${spot}`, jobCarry: (item, n) => `Got ${item}. Take it to pitch ${n}`,
      jobLate: 'Too late: they sorted it out themselves', thanks: ['Thank you!', 'You are a star!', 'Just in time!', 'Service with a skid.'],
      radioOff: 'Radio off',
      rainOn: 'Rain! The roads are slippery', rainBonus: 'Rain +20%', bRush: 'TIP RUSH!', bDog: 'GOOD DOG!',
      dogOn: 'A dog has run off with the sausages! Catch up with it for a reward', dogWon: 'Sausages rescued! +200', dogLost: 'The dog got away with the sausages',
      gnome: (n, of) => `You found a garden gnome! ${n} of ${of}`, bGnomes: 'ALL THE GNOMES!', driftPark: 'Handbrake parking',
      boss: {
        start: ['Baba Ginka: The gate is yours. Do not scratch anything.', 'Baba Ginka: Guests are coming. Smile and park.', 'Baba Ginka: Remember, the hedge costs more than you do.'],
        fine: ['Baba Ginka: That fine comes out of your banitsa money.', 'Baba Ginka: The warden is my cousin. No discounts.'],
        roll: ['Baba Ginka: Five clean ones! I knew I hired you for a reason.', 'Baba Ginka: Keep this up and you get the good chair.'],
        gaveUp: ['Baba Ginka: That guest went to a hotel. A HOTEL.', 'Baba Ginka: They left a review. I am not reading it to you.'],
        dog: ['Baba Ginka: You saved the sausages. Dinner is on me.'],
        scare: ['Baba Ginka: We park campers here, not guests.', 'Baba Ginka: The children are not cones.'],
        over: ['Baba Ginka: Tomorrow you start with the wheelbarrow.', 'Baba Ginka: Not bad. Not good. Not bad.', 'Baba Ginka: The guests asked for you by name. Mostly politely.',
          'Baba Ginka: I am putting your photo up at reception.', 'Baba Ginka: Take the big office. I never liked it.', 'Baba Ginka: They will name a pitch after you.'],
      },
      goalNames: { tips: 'Tips', errands: 'Errands', perfect: 'Perfect parkings', dogs: 'Catch the dog', streak: 'Clean streak', parked: 'Guests parked', boosts: 'Boosts', honks: 'Honks' },
      goalDone: (g) => `Goal done: ${g}. +150`, bGoals: 'ALL GOALS!',
      bStrike: 'STRIKE!',
      coins: (n) => `${n} coins`,
      perks: { magnet: 'Magnet: tips jump to you from further away', tyres: 'Rain tyres: no slipping in the wet', banitsa: 'Banitsa for the warden: fines are halved',
        calm: 'Camp brochure: guests wait 15% longer', heart: 'Fourth heart: one more guest may give up' },
      sayRain: ['Rain! Get the washing in!', 'Typical.', 'The awning! The awning!', 'Lovely weather for ducks.'],
      sayDog: ['My sausages!', 'Stop that dog!', 'That was dinner!'],
      sayCone: ['Oi! Those were in a line!', 'Nice shot.', 'Somebody tell the warden.'],
      sayFine: ['Told you so.', 'Saw that coming.', 'He never misses.'],
      sayIce: ['Ice cream!', 'Two scoops, please!', 'Wait for me!'],
      clubs: { van: 'Van lifers', motorhome: 'Motorhome society', combo: 'Caravan club' },
      clubUp: (c) => `${c}: they like you. A quarter more for parking them`, clubDown: (c) => `${c}: word has got round. They will not wait so long`,
      clubBonus: 'Club bonus +25%', trap: 'Flash! Ten an hour past reception. The warden has the photo',
      runGuests: (n) => `${n} guests`, bHour: 'RUSH HOUR!', rushOn: 'Rush hour: the next three guests are in a hurry and pay double',
      shareRank: (n, r) => `I scored ${n} parking campers at Camping Sofia and made ${r}. Can you beat it?`,
      honk: 'Beep beep!', vip: 'A VIP guest: double points, less patience',
      ranks: ['Trainee', 'Gate keeper', 'Camp host', 'Site warden', 'Camp manager', 'Legend of Vitosha'],
      rankNext: (n, r) => `${n} more for ${r}`, short: (n) => `only ${n} short of your best`,
      perfect: 'Perfect!', newBest: 'New best score!', lifeBack: 'Five clean in a row: ♥ back',
      overTitle: 'Shift over', again: 'Play again', cardTitle: 'Your camp so far', close: 'Back to parking',
      careful: (who) => `Careful, that was a ${who}! −60`,
      who: { kid: 'child', cat: 'cat', dog: 'dog', adult: 'guest' },
      share: (n) => `I scored ${n} parking campers at Camping Sofia. Can you beat it?`,
      copy: 'Copy text', copied: 'Copied', copyFailed: 'Could not copy',
      imgPoints: 'points for parking campers', imgParked: 'guests parked', imgAcc: 'accuracy', imgSpd: 'speed', imgBeat: 'Can you beat it?',
    },
    bg: {
      other: 'English', otherCode: 'en',
      touchKeys: 'Завивайте с левите бутони. D е напред, R е назад. Малките бутони са ръчната спирачка и клаксонът.',
      names: { van: 'ван', motorhome: 'кемпер', combo: 'кола с каравана' },
      labels: { Reception: 'Рецепция' },
      firstCombo: (n) => `Кола с каравана за място ${n}. Вкарайте караваната на мястото`,
      next: (name, n) => `Следва: ${name} за място ${n}`,
      packed: (n, p) => `Място ${n} си събра багажа и замина: −${p}`,
      first: (n) => `Първи гост: място ${n}`,
      jackknife: 'Караваната се сгъна. Дръпнете напред, за да се изправи',
      bump: (c) => `Удар: −${c}`,
      gaveUp: 'Гостът се отказа да чака и си тръгна. Минус едно ♥',
      parked: (p, a, s, m) => `+${p}: точност ${a}, бързина ${s}${m > 1 ? `, ×${m}` : ''}`,
      badge: (n) => `Спечелена значка: ${n}`, badgesTitle: 'Значки', nightBonus: 'Нощна смяна +25%',
      mine: (b, r, n, of) => `Вашият рекорд: ${b} · ${r} · ${n}/${of} значки`,
      badges: {
        first: 'Добре дошли: паркирайте първия си гост', perfect: 'В десетката: перфектно паркиране', caravan: 'На заден: паркирайте каравана чисто',
        streak5: 'В серия: пет чисти паркирания поред', streak9: 'Неудържим: стигнете множител ×3', night: 'Нощна птица: чисто паркиране по тъмно',
        vip: 'Червен килим: перфектно паркиране за VIP гост', tips: 'Джобни: десет бакшиша в една смяна', gentle: 'Внимателен шофьор: осем гости без удар и без стреснат човек',
        ten: 'Пълен къмпинг: десет гости в една смяна', twenty: 'Герой на пиковия час: двайсет гости в една смяна',
        gnomes: 'Ловец на джуджета: намерете десетте скрити джуджета', driftpark: 'Паркиране с ръчна: влезте с плъзгане в чисто паркиране',
        goals: 'По списък: и трите цели в една смяна', strike: 'Страйк: съборете четири конуса наведнъж',
        errand: 'Рум сървис: пет поръчки в една смяна', dog: 'Герой на наденичките: хванете кучето крадец', host: 'Домакин на къмпинга: 1500 точки в една смяна', legend: 'Легенда на Витоша: 8000 точки в една смяна',
      },
      quick: 'Светкавично!', close2: 'В последната секунда!', wave: (n) => `${n} паркирани гости. Следващите бързат повече`,
      boosts: {
        speed: 'Ускорение: десет секунди по-бързо', freeze: 'Спряно време: гостът не брои дванайсет секунди',
        double: 'Двойни точки за следващото паркиране', auto: 'Автопаркиране: приближете мястото и пуснете',
        shield: 'Щит: следващият удар или стреснат човек се прощава', rush: 'Дъжд от бакшиши: съберете колкото можете за двайсет секунди',
      },
      autoOn: 'Автопаркиране', shielded: 'Щит!', drift: 'Дрифт!',
      ouch: ['Ей! Внимавай!', 'Сляп ли си?', 'По-бавно!', 'На косъм!'],
      honked: ['Добре де, добре!', 'Спокойно!', 'Път ли искаш?', 'Много мило.'],
      nice: ['Браво, чисто паркиране!', 'Така се прави.', 'Като по конец!', 'Точно в средата. Респект.', 'Личи си опитът.'],
      chats: [
        ['Това горе Витоша ли е?', 'Черни връх. Два часа пеша.', 'Утре тогава.'],
        ['Откъде идвате?', 'От Ротердам. Три дни път.', 'Ние сме от Пловдив. Четирийсет минути.'],
        ['Опитахте ли баницата в града?', 'Два пъти. Днес.', 'Разумно.'],
        ['Топъл ли е душът?', 'Ако си бърз.', 'А ако не съм?', 'Освежаващо.'],
        ['Тентата ви е накриво.', 'Така е по проект.', 'Това е платно.'],
        ['Метрото ви кара право до центъра.', 'С кучето?', 'Кучето пътува без билет.'],
        ['Чухте ли бухала снощи?', 'Това беше мъжът ми.', 'Впечатляващ диапазон.'],
        ['Имате ли отварачка за консерви?', 'Срещу едно кафе.', 'Става.'],
        ['Кой обикаля в кръг с този кемпер?', 'Новият на портала.', 'Ще се научи.'],
        ['Боянската църква си заслужава.', 'Мислехме за мола.', 'Идете на църквата.'],
        ['За колко време сте тук?', 'За една нощ. Това беше преди седмица.', 'Така става тук.'],
        ['Ракията домашна ли е?', 'Дядо така казва.', 'Тогава една малка.', 'Малки няма.'],
        ['Мама каза, че вечерята е готова.', 'Още пет минути!', 'Каза, че така ще кажеш.'],
        ['Котката ви пак е на покрива ми.', 'Харесва ѝ соларният панел.', 'И на мен. Преди работеше.'],
        ['Утре на Седемте рилски езера?', 'Само ако ти караш.', 'Само ако ти паркираш.'],
        ['Хубава вечер.', 'Мирише на скара.', 'Ние сме. Елате.'],
        ['При вас има ли уайфай?', 'Само до банята.', 'Затова значи има опашка.'],
        ['Тръгваме за Рилския манастир.', 'Вземете жилетка. И празен стомах.', 'За мекиците ли?', 'За мекиците.'],
        ['Хубав ван. Коя година е?', 'Деветдесет и четвърта. Като коленете ми.', 'И двете още вървят.'],
        ['Мина ли колата за сладолед?', 'Два пъти. Бавно.', 'Тя има само една скорост.'],
        ['Кой ми взе сгъваемия стол?', 'Вятърът. Замина към езерцето.', 'Пак ли?'],
        ['Далече ли е булевард „Витоша“?', 'Двайсет минути с метрото.', 'А на връщане?', 'Зависи от шопската салата.'],
        ['Новият на портала е бърз.', 'Бърз, да. Внимателен, ще видим.', 'Аз си преместих кофите.'],
        ['Планове за довечера?', 'Огън, китара, три акорда.', 'Кои три?', 'Които дойдат.'],
      ],
      lbEmpty: 'Още няма никого. Бъдете първи', lbFail: 'Класацията е недостъпна в момента', lbNote: 'Пазим само прякора и резултата ви.',
      lbPlace: (n, w, a) => `${n}: №${w} тази седмица, №${a} за всички времена`, lead: (n, s) => `Най-добър тази седмица: ${n} с ${s}`,
      wardenOn: 'Управителят чу как карате. Стойте далеч от количката', fined: (n) => `Управителят ви хвана. Глоба: −${n}`,
      bWarden: 'УПРАВИТЕЛЯТ!', bFined: 'ГЛОБА!', bPerfect: 'ПЕРФЕКТНО!', bRoll: 'В СЕРИЯ!', bMax: '×3!', bOver: 'КРАЙ НА СМЯНАТА', bBest: 'НОВ РЕКОРД!',
      items: ['дърва за огрев', 'топъл хляб', 'газова бутилка', 'чисто пране', 'сладолед', 'изгубена топка'],
      spots: { reception: 'портала на рецепцията', wash: 'банята', pond: 'езерцето', fire: 'огнището' },
      jobAsk: (n, item, spot) => `Място ${n} моли за ${item}. Вземете от ${spot}`, jobCarry: (item, n) => `Взехте ${item}. Закарайте до място ${n}`,
      jobLate: 'Късно: оправиха се сами', thanks: ['Благодаря!', 'Златен сте!', 'Точно навреме!', 'Обслужване с дрифт.'],
      radioOff: 'Радиото е изключено',
      rainOn: 'Дъжд! Пътищата са хлъзгави', rainBonus: 'Дъжд +20%', bRush: 'БАКШИШИ!', bDog: 'ДОБРО КУЧЕ!',
      dogOn: 'Куче избяга с наденичките! Настигнете го за награда', dogWon: 'Наденичките са спасени! +200', dogLost: 'Кучето избяга с наденичките',
      gnome: (n, of) => `Намерихте градинско джудже! ${n} от ${of}`, bGnomes: 'ВСИЧКИ ДЖУДЖЕТА!', driftPark: 'Паркиране с ръчна',
      boss: {
        start: ['Баба Гинка: Порталът е твой. Нищо да не драскаш.', 'Баба Гинка: Гостите идват. Усмивка и паркирай.', 'Баба Гинка: Запомни, живият плет струва повече от теб.'],
        fine: ['Баба Гинка: Глобата е от парите ти за баница.', 'Баба Гинка: Управителят ми е братовчед. Отстъпки няма.'],
        roll: ['Баба Гинка: Пет чисти! Знаех си защо те взех.', 'Баба Гинка: Карай така и столът с облегалката е твой.'],
        gaveUp: ['Баба Гинка: Този гост отиде на хотел. НА ХОТЕЛ.', 'Баба Гинка: Оставиха отзив. Няма да ти го чета.'],
        dog: ['Баба Гинка: Спаси наденичките. Вечерята е от мен.'],
        scare: ['Баба Гинка: Тук паркираме кемпери, не гости.', 'Баба Гинка: Децата не са конуси.'],
        over: ['Баба Гинка: Утре започваш с ръчната количка.', 'Баба Гинка: Не е зле. Не е и добре. Не е зле.', 'Баба Гинка: Гостите питаха за теб по име. Повечето учтиво.',
          'Баба Гинка: Слагам снимката ти на рецепцията.', 'Баба Гинка: Вземи големия кабинет. И без това не го харесвах.', 'Баба Гинка: Ще кръстят място на твое име.'],
      },
      goalNames: { tips: 'Бакшиши', errands: 'Поръчки', perfect: 'Перфектни паркирания', dogs: 'Хванете кучето', streak: 'Чиста серия', parked: 'Паркирани гости', boosts: 'Бонуси', honks: 'Клаксон' },
      goalDone: (g) => `Изпълнена цел: ${g}. +150`, bGoals: 'ВСИЧКИ ЦЕЛИ!',
      bStrike: 'СТРАЙК!',
      coins: (n) => `${n} монети`,
      perks: { magnet: 'Магнит: бакшишите скачат към вас отдалеч', tyres: 'Гуми за дъжд: без хлъзгане на мокро', banitsa: 'Баница за управителя: глобите са наполовина',
        calm: 'Брошура на къмпинга: гостите чакат с 15% повече', heart: 'Четвърто сърце: още един гост може да се откаже' },
      sayRain: ['Дъжд! Прибирайте прането!', 'Как иначе.', 'Тентата! Тентата!', 'Време за патици.'],
      sayDog: ['Наденичките ми!', 'Спрете това куче!', 'Това беше вечерята!'],
      sayCone: ['Ей! Те бяха подредени!', 'Добър удар.', 'Някой да каже на управителя.'],
      sayFine: ['Казах ти.', 'Очакваше се.', 'Той не пропуска.'],
      sayIce: ['Сладолед!', 'Две топки, моля!', 'Чакайте ме!'],
      clubs: { van: 'Ван лайфъри', motorhome: 'Дружество на кемперите', combo: 'Клуб на караванистите' },
      clubUp: (c) => `${c}: харесват ви. Една четвърт повече за паркирането им`, clubDown: (c) => `${c}: разчу се. Няма да чакат толкова`,
      clubBonus: 'Клубен бонус +25%', trap: 'Светкавица! Десет в час покрай рецепцията. Управителят има снимката',
      runGuests: (n) => `${n} гости`, bHour: 'ПИКОВ ЧАС!', rushOn: 'Пиков час: следващите трима гости бързат и плащат двойно',
      shareRank: (n, r) => `Събрах ${n} точки с паркиране на кемпери в Camping Sofia и станах „${r}“. Ще ме биеш ли?`,
      honk: 'Бийп-бийп!', vip: 'VIP гост: двойни точки, по-малко търпение',
      ranks: ['Стажант', 'Пазач на портала', 'Домакин на къмпинга', 'Управител на терена', 'Директор на къмпинга', 'Легенда на Витоша'],
      rankNext: (n, r) => `още ${n} до „${r}“`, short: (n) => `само ${n} до рекорда ви`,
      perfect: 'Перфектно!', newBest: 'Нов рекорд!', lifeBack: 'Пет чисти поред: +♥',
      overTitle: 'Смяната свърши', again: 'Играй пак', cardTitle: 'Вашият къмпинг дотук', close: 'Обратно към паркирането',
      careful: (who) => `Внимавайте, това беше ${who}! −60`,
      who: { kid: 'дете', cat: 'котка', dog: 'куче', adult: 'гост' },
      share: (n) => `Събрах ${n} точки с паркиране на кемпери в Camping Sofia. Ще ме биеш ли?`,
      copy: 'Копирай текста', copied: 'Копирано', copyFailed: 'Копирането не успя',
      imgPoints: 'точки от паркиране на кемпери', imgParked: 'паркирани гости', imgAcc: 'точност', imgSpd: 'бързина', imgBeat: 'Ще ме биеш ли?',
      title: 'Camping Sofia: очаквайте скоро',
      html: {
        tagline: 'Очаквайте скоро. Вашата база за София.',
        pitch: 'Място', score: 'Точки', best: 'Рекорд',
        h2: 'Истинският къмпинг още се строи.',
        intro: 'Дотогава гостите идват в този. Закарайте всеки до мястото, което свети. Паркирайте право и бързо за точки; чистите паркирания поред ги умножават. Ударите струват скъпо и докарват управителя, а трима гости, които се откажат да чакат, слагат край на смяната.',
        play: 'Започнете да паркирате',
        keys: 'Стрелки или WASD за шофиране. Интервал е ръчната спирачка: на скорост завърта задницата. H е клаксон, M спира звука, R сменя радиото, P е пауза. Работи и с геймпад.',
        by: `Camping Sofia е проект на ${BY}`,
        note: `Този къмпинг е измислен. Истинският идва в София, от ${BY}.`,
        cardTitle: 'Вашият къмпинг дотук',
        stParked: 'Паркирани гости', stOnsite: 'В къмпинга сега', stAcc: 'Средна точност', stSpd: 'Средна бързина',
        stTop: 'Най-добро паркиране', stStreak: 'Най-дълга чиста серия', stPerfect: 'Перфектни паркирания', runsTitle: 'Най-добрите ви смени', clubsTitle: 'Какво мислят клубовете', lgClub: 'Трите клуба ви помнят: паркирайте членовете им чисто и плащат повече.', shopTitle: 'Магазинът на къмпинга', shopNote: 'Всяка точка става монета в края на смяната.', stBank: 'Монети за магазина', chill: 'Почивен ден: без часовник', restart: 'Обратно към портала', lgCone: 'Конусите летят, ако ги ударите: по 5 точки, но управителят забелязва.', lgIce: 'Колата за сладолед кара бавно и не бърза за никъде. Заобиколете я.', stGnomes: 'Намерени скрити джуджета', lgGnome: 'Из къмпинга са скрити десет градински джуджета. Струва си да ги намерите.', legendTitle: 'Какво има по пътищата',
        lgTip: 'Жълта монета: 25 точки. Синя: 8 секунди повече.', lgBoost: 'Лилав жетон: бонус. Ускорение, спряно време, двойни точки, автопаркиране, щит или дъжд от бакшиши.',
        lgJob: 'Зелен знак: поръчка. Вземете и закарайте до мястото за 120 точки.', lgDog: 'Кучето с наденичките: настигнете го за 200 точки.',
        lgWarden: 'Червени звезди: управителят ви гони. Глобата боли, чистото паркиране го успокоява.', lgRain: 'В дъжд и по тъмно паркирането носи повече, но пътят се хлъзга.', stErrands: 'Изпълнени поръчки', stFines: 'Глоби от управителя', lbTitle: 'Най-добрите къмпингари', lbWeek: 'Тази седмица', lbAll: 'За всички времена', lbPost: 'Запиши резултата ми', stTips: 'Събрани бакшиши', stBumps: 'Удари', stScares: 'Стреснати хора', stGaveUp: 'Гости, които се отказаха да чакат',
        stTime: 'Време зад волана', shareTitle: 'Споделете резултата', shareNative: 'Сподели', savePic: 'Запази картинката', close: 'Обратно към паркирането',
      },
      aria: {
        camp: 'Къмпинг, гледан отгоре. Закарайте всеки пристигащ гост до мястото му.',
        patience: 'Колко още ще чака този гост', lives: 'Колко гости още може да разочаровате', mute: 'Звук (M)', scoreBtn: 'Вашата статистика и споделяне',
        horn: 'Клаксон', radio: 'Радио (R)', lbName: 'Вашият прякор', brake: 'Ръчна спирачка', left: 'Завий наляво', right: 'Завий надясно', down: 'Назад', up: 'Напред',
      },
    },
  };
  const L = STR[LANG];
  document.documentElement.lang = LANG;
  if (L.html) {
    document.title = L.title;
    document.querySelectorAll('[data-t]').forEach((el) => { const v = L.html[el.dataset.t]; if (v) el.innerHTML = v; });
    document.querySelectorAll('[data-a]').forEach((el) => {
      const v = L.aria[el.dataset.a];
      if (v) el.setAttribute(el.hasAttribute('title') ? 'title' : 'aria-label', v);
    });
  }
  $('lang').textContent = L.other;
  $('lang').addEventListener('click', () => {
    const u = new URL(location.href);
    u.searchParams.delete('lang');
    try { localStorage.setItem('camp-lang', L.otherCode); } catch (e) { u.searchParams.set('lang', L.otherCode); }   // no storage: carry it in the address
    location.replace(u);
  });

  // ---------- world ----------
  const W = 120, H = 94, CAMP_BOTTOM = 86;
  const TAU = Math.PI * 2;
  let seed = 20261111;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wrap = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };

  const roads = [
    { x: 56, y: 20, w: 8, h: 74 },   // main road from the gate
    { x: 8, y: 20, w: 104, h: 8 },   // upper lane
    { x: 8, y: 50, w: 104, h: 8 },   // lower lane
    { x: 8, y: 20, w: 7, h: 38 },    // west link
    { x: 105, y: 20, w: 7, h: 38 },  // east link
  ];

  const PITCH_W = 6, PITCH_D = 9.5;
  const pitches = [];
  [9.5, 28.5, 39.5, 58.5].forEach((y, row) => {
    [17, 67].forEach((x0, block) => {
      for (let i = 0; i < 6; i++) {
        if (row === 0 && block === 0 && i < 2) continue;   // wash house
        if (row === 0 && block === 1 && i > 2) continue;   // pond
        pitches.push({ x: x0 + i * PITCH_W, y, w: PITCH_W, d: PITCH_D, laneBelow: row % 2 === 0, n: 0, guest: null });
      }
    });
  });
  pitches.forEach((p, i) => { p.n = i + 1; });

  const buildings = [
    { x: 17.6, y: 10.4, w: 10.8, h: 8.2, z: 3.4, roof: '#4f6b7a', wall: '#e8dfc8', label: 'WC' },
    { x: 67, y: 71.5, w: 12, h: 8, z: 3.8, roof: '#2f5d49', wall: '#efe6cf', label: 'Reception' },
    { x: 54.6, y: 85.2, w: 1.2, h: 1.2, z: 2.6, roof: '#f4c531', wall: '#3a2f25' },
    { x: 64.2, y: 85.2, w: 1.2, h: 1.2, z: 2.6, roof: '#f4c531', wall: '#3a2f25' },
  ];
  const hedges = [
    { x: 17, y: 38.6, w: 36, h: 0.8 }, { x: 67, y: 38.6, w: 36, h: 0.8 },
    { x: 29, y: 8.6, w: 24, h: 0.8 }, { x: 67, y: 8.6, w: 18, h: 0.8 },
    { x: 17, y: 68.1, w: 36, h: 0.8 }, { x: 67, y: 68.1, w: 36, h: 0.8 },
  ];
  const pond = { x: 94.5, y: 14.2, rx: 8.6, ry: 4.4 };
  const fire = { x: 31, y: 77 };
  const tents = [{ x: 19, y: 75, a: 0.3, c: '#d9a13b' }, { x: 42, y: 79.5, a: -0.5, c: '#3f7fa6' }, { x: 97, y: 77, a: 1.1, c: '#c8553d' }];
  const lamps = [[54.6, 14], [65.4, 34], [54.6, 44], [65.4, 64], [16, 34], [104, 44], [65.4, 82]].map(([x, y]) => ({ x, y }));   // on the verges, clear of the corners people cut

  const trees = [];
  const onRoadOrPitch = (x, y, pad = 0) =>
    roads.some((r) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) ||
    pitches.some((p) => x > p.x - pad && x < p.x + p.w + pad && y > p.y - pad && y < p.y + p.d + pad);
  const addTree = (x, y, r) => {
    if (onRoadOrPitch(x, y, 1.6)) return;
    if (buildings.some((b) => x > b.x - 2 && x < b.x + b.w + 2 && y > b.y - 2 && y < b.y + b.h + 2)) return;
    if (((x - pond.x) / (pond.rx + 1.5)) ** 2 + ((y - pond.y) / (pond.ry + 1.5)) ** 2 < 1) return;
    if (Math.hypot(x - fire.x, y - fire.y) < 5) return;
    if (tents.some((t) => Math.hypot(x - t.x, y - t.y) < 4)) return;
    if (trees.some((t) => Math.hypot(x - t.x, y - t.y) < 3.2)) return;
    trees.push({ x, y, r, z: 4.5 + rnd() * 3, hue: rnd() });
  };
  for (let x = 3; x < W; x += 5.5) { addTree(x + rnd() * 2, 3 + rnd() * 3, 2.4 + rnd() * 1.2); addTree(x + rnd() * 2, 89 + rnd() * 3, 2.4 + rnd() * 1.2); }
  for (let y = 8; y < H; y += 5.5) { addTree(2.5 + rnd() * 3, y + rnd() * 2, 2.4 + rnd() * 1.2); addTree(114.5 + rnd() * 3, y + rnd() * 2, 2.4 + rnd() * 1.2); }
  for (let i = 0; i < 40; i++) addTree(8 + rnd() * 104, 70 + rnd() * 15, 2 + rnd() * 1.4);
  for (let i = 0; i < 12; i++) addTree(82 + rnd() * 30, 4 + rnd() * 14, 2 + rnd() * 1.2);
  [[16, 39], [54, 39], [66, 39], [104, 39], [16, 9], [54, 9], [16, 68.5], [104, 68.5]].forEach(([x, y]) => addTree(x, y, 2.6));

  // Static things a vehicle can hit.
  const solidRects = [...buildings, ...hedges].map((b) => ({ cx: b.x + b.w / 2, cy: b.y + b.h / 2, hl: b.w / 2, hw: b.h / 2, a: 0 }));
  const solidCircles = [
    ...trees.map((t) => ({ x: t.x, y: t.y, r: 0.55 })),
    ...lamps.map((l) => ({ x: l.x, y: l.y, r: 0.3 })),
    ...tents.map((t) => ({ x: t.x, y: t.y, r: 1.7 })),
    { x: fire.x, y: fire.y, r: 1.1 },
    { x: pond.x - 5, y: pond.y, r: 3.6 }, { x: pond.x, y: pond.y, r: 4.2 }, { x: pond.x + 5, y: pond.y, r: 3.6 },
  ];

  // ---------- vehicles ----------
  const TYPES = {
    van: { name: 'campervan', L: 5.6, Wd: 2.1, wb: 3.3, rear: 1.0, vmax: 10, z: 2.3 },
    motorhome: { name: 'motorhome', L: 7.2, Wd: 2.35, wb: 4.0, rear: 1.6, vmax: 8.5, z: 2.9 },
    combo: { name: 'car and caravan', L: 4.5, Wd: 1.85, wb: 2.7, rear: 0.9, vmax: 8.5, z: 1.5, trailer: { hitch: 1.2, bar: 1.3, L: 5.2, Wd: 2.25, axle: 4.2, z: 2.6 } },
    car: { name: 'car', L: 4.5, Wd: 1.85, wb: 2.7, rear: 0.9, vmax: 8.5, z: 1.5 },   // a tow car once it has unhitched
    caravan: { name: 'caravan', L: 5.2, Wd: 2.25, wb: 0, rear: 2.3, vmax: 0, z: 2.6 },   // unhitched, its car away in town
  };
  const PAINT = ['#f2efe6', '#e6dcc4', '#d5503c', '#3f7fa6', '#f0b83a', '#5f9070', '#c9d4da', '#8b6fae'];

  function makeVehicle(kind, x, y, th) {
    const t = TYPES[kind];
    return { kind, t, x, y, th, ph: th, v: 0, steer: 0, paint: PAINT[(rnd() * PAINT.length) | 0], side: rnd() < 0.5 ? 1 : -1, extra: (rnd() * 3) | 0, parked: null, alpha: 1 };
  }
  // Body rectangle: (x, y) is the rear axle.
  function bodyRect(v) {
    const off = v.t.L / 2 - v.t.rear;
    return { cx: v.x + Math.cos(v.th) * off, cy: v.y + Math.sin(v.th) * off, hl: v.t.L / 2, hw: v.t.Wd / 2, a: v.th };
  }
  function hitchPoint(v) { const h = v.t.trailer.hitch; return { x: v.x - Math.cos(v.th) * h, y: v.y - Math.sin(v.th) * h }; }
  function trailerRect(v) {
    const tr = v.t.trailer, hp = hitchPoint(v), off = tr.bar + tr.L / 2;
    return { cx: hp.x - Math.cos(v.ph) * off, cy: hp.y - Math.sin(v.ph) * off, hl: tr.L / 2, hw: tr.Wd / 2, a: v.ph };
  }
  const rectsOf = (v) => (v.t.trailer ? [bodyRect(v), trailerRect(v)] : [bodyRect(v)]);
  // The part that has to end up on the pitch: the caravan for a car-and-caravan, the vehicle itself otherwise.
  const livingRect = (v) => (v.t.trailer ? trailerRect(v) : bodyRect(v));

  function corners(r) {
    const c = Math.cos(r.a), s = Math.sin(r.a), out = [];
    for (const [l, w] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) out.push({ x: r.cx + c * l * r.hl - s * w * r.hw, y: r.cy + s * l * r.hl + c * w * r.hw });
    return out;
  }
  function rectCircle(r, cx, cy, rad) {
    const c = Math.cos(r.a), s = Math.sin(r.a), dx = cx - r.cx, dy = cy - r.cy;
    const lx = dx * c + dy * s, ly = -dx * s + dy * c;
    const qx = clamp(lx, -r.hl, r.hl), qy = clamp(ly, -r.hw, r.hw);
    return (lx - qx) ** 2 + (ly - qy) ** 2 < rad * rad;
  }
  function rectRect(a, b) {
    const ca = corners(a), cb = corners(b);
    for (const r of [a, b]) {
      for (const ang of [r.a, r.a + Math.PI / 2]) {
        const ax = Math.cos(ang), ay = Math.sin(ang);
        let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
        for (const p of ca) { const d = p.x * ax + p.y * ay; a0 = Math.min(a0, d); a1 = Math.max(a1, d); }
        for (const p of cb) { const d = p.x * ax + p.y * ay; b0 = Math.min(b0, d); b1 = Math.max(b1, d); }
        if (a1 < b0 || b1 < a0) return false;
      }
    }
    return true;
  }
  const inBounds = (p) => (p.x > 1 && p.x < W - 1 && p.y > 1 && p.y < CAMP_BOTTOM - 0.4) || (p.x > 56.4 && p.x < 63.6 && p.y >= CAMP_BOTTOM - 0.4 && p.y < H - 0.3);

  function blocked(v) {
    for (const r of rectsOf(v)) {
      for (const p of corners(r)) if (!inBounds(p)) return true;
      const reach = r.hl + r.hw;
      for (const c of solidCircles) if (Math.abs(c.x - r.cx) < reach + c.r && Math.abs(c.y - r.cy) < reach + c.r && rectCircle(r, c.x, c.y, c.r)) return true;
      for (const s of solidRects) if (Math.abs(s.cx - r.cx) < reach + s.hl && Math.abs(s.cy - r.cy) < reach + s.hw && rectRect(r, s)) return true;
      for (const o of guests) {
        if (o === v || o.alpha < 0.5) continue;
        if (Math.hypot(o.x - r.cx, o.y - r.cy) > 16) continue;
        for (const q of rectsOf(o)) if (rectRect(r, q)) return true;
      }
      if (ice && v === car && Math.hypot(ice.x - r.cx, ice.y - r.cy) < 12 && rectRect(r, iceRect())) return true;
    }
    return false;
  }

  // ---------- sound ----------
  // Everything is synthesised with Web Audio, so there are no files to load. The context is made on the first click.
  let muted = false, AC = null, master = null, eng = null, beepT = 0, tickT = 0;
  try { muted = localStorage.getItem('camp-mute') === '1'; } catch (e) { /* private window */ }
  function audioOn() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    try {
      AC = new C(); master = AC.createGain(); master.gain.value = muted ? 0 : 0.5; master.connect(AC.destination);
      const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
      o.type = 'sawtooth'; o.frequency.value = 50; f.type = 'lowpass'; f.frequency.value = 300; g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(master); o.start(); eng = { o, f, g };
    } catch (e) { AC = null; eng = null; }
  }
  function note(freq, at = 0, dur = 0.15, type = 'triangle', vol = 0.25, to = 0) {
    if (!AC) return;
    const t = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  function thud(vol = 0.5) {
    if (!AC) return;
    const n = (AC.sampleRate * 0.25) | 0, buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.5);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(master); s.start();
    note(90, 0, 0.22, 'sine', vol, 40);
  }
  const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  const hz = (semi) => 261.63 * Math.pow(2, semi / 12);
  const sfx = {
    park(run, perfect) {   // the chime climbs with the streak
      const b = SCALE[Math.min(run, 8)];
      [0, 4, 7, 12].forEach((s, i) => note(hz(b + s), i * 0.08, 0.22, 'triangle', 0.22));
      if (perfect) [16, 19, 24].forEach((s, i) => note(hz(b + s), 0.34 + i * 0.07, 0.3, 'sine', 0.2));
    },
    bump(v) { thud(Math.min(0.7, 0.25 + v * 0.07)); },
    startle() { note(880, 0, 0.12, 'square', 0.12); note(660, 0.13, 0.2, 'square', 0.12); },
    lost() { [7, 3, 0].forEach((s, i) => note(hz(s - 12), i * 0.16, 0.3, 'sawtooth', 0.12)); },
    life() { note(hz(12), 0, 0.12, 'sine', 0.25); note(hz(19), 0.1, 0.25, 'sine', 0.25); },
    best() { [0, 4, 7, 12, 16].forEach((s, i) => note(hz(s + 5), i * 0.09, 0.3, 'square', 0.1)); },
    over() { [12, 7, 4, 0, -5].forEach((s, i) => note(hz(s - 12), i * 0.2, 0.4, 'triangle', 0.25)); },
    tick(low) { note(low ? 1400 : 1000, 0, 0.05, 'square', 0.07); },
    beep() { note(1150, 0, 0.14, 'square', 0.05); },
    next() { note(hz(7), 0, 0.08, 'sine', 0.15); note(hz(12), 0.08, 0.12, 'sine', 0.15); },
    coin() { note(hz(19), 0, 0.07, 'square', 0.1); note(hz(24), 0.07, 0.16, 'square', 0.1); },
    horn() { note(415, 0, 0.32, 'sawtooth', 0.16); note(523, 0, 0.32, 'sawtooth', 0.16); },
  };
  function engineSound(dt) {
    if (!eng) return;
    const on = mode === 'play' && car && !paused, v = on ? Math.abs(car.v) : 0, t = AC.currentTime, gas = on && (keys.up || keys.down);
    eng.g.gain.setTargetAtTime(on ? 0.05 + v * 0.006 + (gas ? 0.03 : 0) : 0, t, 0.08);
    eng.o.frequency.setTargetAtTime(48 + v * 11 + (gas ? 8 : 0), t, 0.1);
    eng.f.frequency.setTargetAtTime(260 + v * 70, t, 0.1);
    if (!on) return;
    if (car.reversing && (beepT -= dt) <= 0) { beepT = 0.75; sfx.beep(); }
    if (patience < 10 && (tickT -= dt) <= 0) { tickT = patience < 5 ? 0.5 : 1; sfx.tick(patience < 5); }
  }
  function setMute(m) {
    muted = m;
    try { localStorage.setItem('camp-mute', m ? '1' : '0'); } catch (e) { /* private window */ }
    if (master) master.gain.value = m ? 0 : 0.5;
    $('mute').classList.toggle('off', m); $('mute').setAttribute('aria-pressed', String(m));
  }
  setMute(muted);
  $('mute').addEventListener('click', () => { audioOn(); setMute(!muted); cv.focus(); });
  addEventListener('keydown', (e) => { if (e.code === 'KeyM' && !e.repeat) setMute(!muted); });

  // ---------- pop-ups and confetti ----------
  const pops = [], bits = [];
  const pop = (x, y, text, c = '#f4c531', size = 30, o = 0) => pops.push({ x, y, text, c, size, o, life: 1.5, max: 1.5 });
  function confetti(x, y) {
    if (reduceMotion) return;
    for (let i = 0; i < 44; i++) {
      const a = Math.random() * TAU, s = 2 + Math.random() * 6;
      bits.push({ x, y, z: 1, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vz: 3 + Math.random() * 5, c: ['#f4c531', '#f6f1df', '#e2553d', '#6fb6d9'][i % 4], life: 1.8 });
    }
  }
  function stepFx(dt) {
    for (let i = pops.length - 1; i >= 0; i--) if ((pops[i].life -= dt) <= 0) pops.splice(i, 1);
    for (let i = bits.length - 1; i >= 0; i--) {
      const b = bits[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= 9 * dt;
      if (b.z < 0 || (b.life -= dt) <= 0) bits.splice(i, 1);
    }
  }
  function drawFx() {
    ctx.save();
    drawProps();
    if (mode === 'play') { drawGnomes(); drawTips(); }
    if (car && car.vip) {   // a gold star rides above a VIP
      const [x, y] = P(car.x, car.y, 3.2);
      ctx.font = '900 30px Overpass, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
      ctx.lineWidth = 5; ctx.strokeStyle = '#12211a'; ctx.strokeText('★', x, y); ctx.fillStyle = '#f4c531'; ctx.fillText('★', x, y);
    }
    for (const b of bits) { const [x, y] = P(b.x, b.y, b.z); const h = (b.s || 6) / 2; ctx.fillStyle = b.c; ctx.fillRect(x - h, y - h, h * 2, h * 2); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const p of pops) {
      const [x, y] = P(p.x, p.y), up = (p.max - p.life) * 34, grow = 1 + 0.5 * clamp(1 - (p.max - p.life) / 0.15, 0, 1);
      ctx.globalAlpha = clamp(p.life / 0.4, 0, 1); ctx.font = `900 ${Math.round(p.size * grow)}px Overpass, "Segoe UI", sans-serif`;
      ctx.lineWidth = 6; ctx.strokeStyle = '#12211a'; ctx.strokeText(p.text, x, y - 34 - p.o - up);
      ctx.fillStyle = p.c; ctx.fillText(p.text, x, y - 34 - p.o - up);
    }
    ctx.globalAlpha = 1; drawJob(); drawThief(); if (mode === 'play') drawIce(); drawWarden(); drawRain(); drawFlies(); drawBubbles(); drawMap();
    ctx.restore();
  }

  // ---------- the camp shop ----------
  // Every point of a finished shift becomes a coin. Coins buy small permanent advantages, kept in this browser.
  const PERKS = { magnet: 1500, tyres: 2000, banitsa: 2500, calm: 3500, heart: 5000 };
  const owned = new Set();
  let bank = 0;
  try { bank = +localStorage.getItem('camp-bank') || 0; JSON.parse(localStorage.getItem('camp-perks') || '[]').forEach((k) => owned.add(k)); } catch (e) { /* private window */ }
  const maxLives = () => (owned.has('heart') ? 4 : 3);
  function saveShop() { try { localStorage.setItem('camp-bank', String(bank)); localStorage.setItem('camp-perks', JSON.stringify([...owned])); } catch (e) { /* private window */ } }
  function shop() {
    $('shop-coins').textContent = L.coins(bank);
    const list = $('shop-list');
    list.textContent = '';
    Object.keys(PERKS).forEach((k) => {
      const li = document.createElement('li'), b = document.createElement('button'), has = owned.has(k);
      li.textContent = L.perks[k]; b.type = 'button'; b.textContent = has ? '✓' : PERKS[k]; b.disabled = has || bank < PERKS[k];
      b.addEventListener('click', () => { if (owned.has(k) || bank < PERKS[k]) return; bank -= PERKS[k]; owned.add(k); saveShop(); shop(); });
      li.append(b); list.append(li);
    });
  }
  shop();

  // ---------- game state ----------
  const guests = [];           // parked vehicles, oldest first
  const ghosts = [];           // tow cars fading out as they leave for town; nothing can hit them
  let car = null;              // the vehicle being driven
  let target = null;           // its pitch
  let mode = 'attract';
  let parkedCount = 0, best = 0, damage = 0, night = 0, bumps = 0, holdT = 0, patience = 1, patienceMax = 60, bumpCool = 0, shake = 0;
  let clock = 0, lastNote = 0, metCaravan = false;
  let rushLeft = 0;   // guests still to come in the current rush hour
  let chill = false;   // a day off: no clock, no lives, nothing recorded
  let total = 0, lives = 3, streak = 0, startBest = 0, newBestSaid = false;
  try { best = +localStorage.getItem('camp-best-score') || 0; } catch (e) { /* private window */ }

  const keys = { up: false, down: false, left: false, right: false, brake: false, horn: false };
  const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'brake', KeyH: 'horn' };
  addEventListener('keydown', (e) => {
    const k = KEYMAP[e.code];
    if (!k || paused) return;   // the score card is open: leave the keys to it
    if (mode === 'play' || document.activeElement === document.body) e.preventDefault();
    keys[k] = true;
  });
  addEventListener('keyup', (e) => { const k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.querySelectorAll('.pad button').forEach((b) => {
    const k = b.dataset.k;
    const set = (on) => (e) => { e.preventDefault(); keys[k] = on; b.classList.toggle('on', on); if (on && b.setPointerCapture) { try { b.setPointerCapture(e.pointerId); } catch (x) { /* fine */ } } };
    b.addEventListener('pointerdown', set(true));
    b.addEventListener('pointerup', set(false));
    b.addEventListener('pointercancel', set(false));
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  let toastTimer = 0, toastUntil = 0;
  const toastQ = [];   // remarks from the owner wait here until the screen is clear
  function boss(key) { if (toastQ.length < 2) toastQ.push(pick(L.boss[key])); }
  function stepToasts() { if (toastQ.length && mode === 'play' && performance.now() > toastUntil + 500) toast(toastQ.shift(), 3400); }
  function toast(text, ms = 1800) {
    toastUntil = performance.now() + ms;
    const el = $('toast');
    el.textContent = text; el.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('on'), ms);
  }
  function hud() {
    if (mode === 'play') checkGoals();
    $('hud-pitch').textContent = target ? target.n : '–';
    const now = score();
    if (mode === 'play' && now > best && !chill) {
      best = now; try { localStorage.setItem('camp-best-score', String(best)); } catch (e) { /* private window */ }
      if (startBest > 0 && !newBestSaid) { newBestSaid = true; toast(L.newBest, 2600); sfx.best(); banner(L.bBest); }
    }
    if (mode === 'play') scoreBadges(now);
    $('hud-lives').textContent = '♥'.repeat(Math.max(0, lives)) + '♡'.repeat(maxLives() - Math.max(0, lives));
    const m = 1 + Math.min(streak, 8) * 0.25, combo = $('hud-combo'), was = combo.textContent;   // what the next clean parking is worth
    combo.textContent = streak ? `×${m}` : '';
    if (combo.textContent !== was && streak) { combo.classList.remove('hit'); void combo.offsetWidth; combo.classList.add('hit'); }
    $('hud-score').textContent = now;
    $('hud-best').textContent = best;
  }

  // The score is everything earned by parking this shift, less every bump.
  function score() { return total - damage; }
  function freePitches() { return pitches.filter((p) => !p.guest); }
  function settle(v, p) {   // put a vehicle on a pitch without driving it there (the campers already on site)
    const cx = p.x + p.w / 2, nose = p.laneBelow ? -1 : 1;   // nose-in, away from the lane
    v.th = nose * Math.PI / 2 + (rnd() - 0.5) * 0.08; v.ph = v.th;
    const cy = p.y + p.d / 2;
    v.x = cx; v.y = cy;
    const r = livingRect(v); v.x += cx - r.cx; v.y += cy - r.cy;
    v.parked = { pitch: p, t: clock }; v.points = 0; v.stay = 70 + rnd() * 170; p.guest = v; guests.push(v);
  }
  [3, 12, 20, 27, 34, 40].forEach((i, n) => settle(makeVehicle(['van', 'caravan', 'motorhome'][n % 3], 0, 0, 0), pitches[i]));

  function nextGuest(now) {
    const free = freePitches();
    if (free.length < 8 && !guests.some((g) => g.packing)) checkout();
    const roll = rnd();
    // The second guest always tows a caravan, so everyone meets one early.
    const kind = parkedCount === 0 ? 'van' : parkedCount === 1 && !metCaravan ? 'combo' : roll < 0.4 ? 'van' : roll < 0.65 ? 'motorhome' : 'combo';
    car = makeVehicle(kind, 61.8, 80.5, -Math.PI / 2);   // on the right, clear of guests driving out
    const room = rectsOf(car).map((r) => ({ ...r, hl: r.hl + 1.5, hw: r.hw + 0.8 }));
    if (!now && (guests.some((o) => o.leave && rectsOf(o).some((q) => room.some((r) => rectRect(r, q)))) ||
      people.some((o) => !o.hidden && room.some((r) => rectCircle(r, o.x, o.y, 0.8))))) {   // someone is in the gateway: wait for them
      car = null; setTimeout(() => { if (mode === 'play' && !car) nextGuest(); }, 400); return;
    }
    car.born = clock; car.vip = parkedCount >= 3 && rnd() < 0.14;
    if (!chill && parkedCount > 0 && parkedCount % 8 === 6 && !rushLeft) { rushLeft = 3; banner(L.bHour); toastQ.push(L.rushOn); }
    car.rush = rushLeft > 0; if (car.rush) rushLeft--;
    const options = freePitches();
    target = options[(rnd() * options.length) | 0];
    bumps = 0; holdT = 0;
    // Less time with every guest, more for a long drive and for the awkward vehicles.
    const dist = Math.hypot(target.x + target.w / 2 - car.x, target.y + target.d / 2 - car.y);
    patienceMax = Math.max(18, 50 - parkedCount * 1.6) + dist * 0.35 + (kind === 'combo' ? 22 : kind === 'motorhome' ? 6 : 0);
    if (car.vip) patienceMax *= 0.85;
    if (owned.has('calm')) patienceMax *= 1.15;
    if (respect[kind] <= -3) patienceMax *= 0.85;
    if (car.rush) patienceMax *= 0.75;
    patience = patienceMax;
    hud();
    if (kind === 'combo' && !metCaravan) { metCaravan = true; toast(L.firstCombo(target.n), 3800); }
    else if (car.vip) { toast(L.vip, 2600); sfx.best(); }
    else if (parkedCount > 0 && parkedCount % 5 === 0) { toast(L.wave(parkedCount), 2600); sfx.best(); }
    else if (parkedCount > 0) { toast(L.next(L.names[kind], target.n), 1500); sfx.next(); }
  }
  function packUp(g, delay = 0) {   // roll in the awning, call the family back, then drive off
    g.packing = clock + delay;
    hud();
  }
  function checkout() { guests.filter((g) => !g.packing && !g.leaving).slice(0, 3).forEach((g, i) => packUp(g, i * 5)); }

  function start(off) {
    mode = 'play'; chill = off === true; document.body.classList.toggle('chill', chill);
    document.body.classList.add('playing');
    $('start').hidden = true; $('hud').hidden = false;
    if (matchMedia('(pointer: coarse)').matches) $('pad').hidden = false;
    parkedCount = 0; damage = 0; Object.keys(stats).forEach((k) => { stats[k] = 0; });
    rushLeft = 0; Object.keys(respect).forEach((k) => { respect[k] = 0; }); drawGoals(); playT = clock; posted = false; thief = null; nextThief = clock + 50; raining = false; nextRain = clock + 70; job = null; nextJob = clock + 25; heat = 0; warden = null; heatStars(); tips.length = 0; Object.keys(boost).forEach((k) => { boost[k] = 0; }); nextBoost = clock + 8; boostChips(); total = 0; lives = maxLives(); streak = 0; startBest = best; newBestSaid = false; car = null;
    audioOn();
    nextGuest(true);
    setTimeout(() => document.body.classList.add('sign-away'), 5000);   // the name plate steps aside once the driving starts
    toast(L.first(target.n), 2200); toastQ.length = 0; boss('start');
    cv.focus();
  }
  $('play').addEventListener('click', () => start());
  $('play-chill').addEventListener('click', () => start(true));
  if (matchMedia('(pointer: coarse)').matches) $('keys').textContent = L.touchKeys;

  // ---------- tips, the horn and ranks ----------
  // Tips lie on the roads: drive over one for a few points. A new one turns up elsewhere.
  const tips = [];
  function addTip(kind, until) {
    for (let tries = 0; tries < 30; tries++) {
      const r = roads[(Math.random() * roads.length) | 0], x = r.x + 1.5 + Math.random() * (r.w - 3), y = r.y + 1.5 + Math.random() * (r.h - 3);
      if (y > 70 || tips.some((t) => Math.hypot(t.x - x, t.y - y) < (until ? 5 : 14)) || (car && Math.hypot(car.x - x, car.y - y) < 12)) continue;
      tips.push({ x, y, born: clock, time: !kind && !until && Math.random() < 0.25, boost: kind, until }); return;
    }
  }
  function stepTips() {
    for (let n = tips.filter((t) => !t.boost && !t.until).length; n < 4; n++) addTip();
    if (clock > nextBoost && !tips.some((t) => t.boost)) addTip(pick(['speed', 'freeze', 'double', 'auto', 'shield', 'rush']));
    if (!car) return;
    const rects = rectsOf(car);
    for (let i = tips.length - 1; i >= 0; i--) {
      const t = tips[i];
      if (t.until && clock > t.until) { tips.splice(i, 1); continue; }
      if (!rects.some((r) => rectCircle(r, t.x, t.y, owned.has('magnet') ? 3.2 : 0.9))) continue;
      tips.splice(i, 1);
      if (t.boost) { takeBoost(t.boost); pop(t.x, t.y, BOOST_SIGN[t.boost], '#b98ce0', 30); hud(); continue; }
      stats.tips++; sfx.coin();
      if (t.time) { patience = Math.min(patienceMax, patience + 8); pop(t.x, t.y, '+8 s', '#6fb6d9', 24); }   // a blue one buys time
      else { total += 25; pop(t.x, t.y, '+25', '#f4c531', 24); }
      hud();
    }
  }
  function drawTips() {
    for (const t of tips) {
      const [x, y] = P(t.x, t.y, 0.6 + 0.25 * Math.sin(clock * 3 + t.x)), [sx, sy] = P(t.x, t.y), k = cam.s;
      const w = t.boost ? 1.3 : Math.abs(Math.cos(clock * 2.4 + t.y)) * 0.75 + 0.2, a = clamp((clock - t.born) * 2, 0, 1);
      ctx.globalAlpha = 0.25 * a; ctx.fillStyle = '#12211a'; ctx.beginPath(); ctx.ellipse(sx, sy, 0.7 * k, 0.4 * k, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = a; ctx.fillStyle = t.boost ? '#b98ce0' : t.time ? '#6fb6d9' : '#f4c531'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(x, y, 0.8 * k * w, 0.8 * k, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#12211a';
      if (t.boost) { ctx.font = `900 ${Math.round(0.95 * k)}px Overpass, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(BOOST_SIGN[t.boost], x, y + 1); }
      else { ctx.beginPath(); ctx.ellipse(x, y, 0.3 * k * w, 0.3 * k, 0, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
  // The horn sends anyone ahead of the vehicle to the side of the road.
  let hornCool = 0;
  function honk() {
    hornCool = 1.2; sfx.horn(); stats.honks++;
    pop(car.x, car.y, L.honk, '#f6f1df', 22);
    let said = false;
    for (const o of people) {
      if (o.hidden || o.kind === 'pet' || !o.path) continue;
      const dx = o.x - car.x, dy = o.y - car.y;
      if (Math.hypot(dx, dy) > 16) continue;
      const side = Math.sign(-Math.sin(car.th) * dx + Math.cos(car.th) * dy) || 1, a = car.th + side * Math.PI / 2;
      o.flee = 1.6; o.wait = 0; o.path.unshift([o.x + Math.cos(a) * 4.5, o.y + Math.sin(a) * 4.5]);
      if (!said) { said = true; say(o, pick(L.honked)); }
    }
  }
  const RANKS = [0, 1000, 3000, 6000, 10000, 16000];   // raised once the bonuses piled up
  function rankLine(n, was) {
    let i = 0;
    while (i < RANKS.length - 1 && n >= RANKS[i + 1]) i++;
    const parts = [L.ranks[i]];
    if (i < RANKS.length - 1) parts.push(L.rankNext(RANKS[i + 1] - n, L.ranks[i + 1]));
    if (was > 0 && n > was) parts.push(L.newBest); else if (was > 0 && n < was && was - n <= Math.max(150, was * 0.15)) parts.push(L.short(was - n));
    return parts.join(' · ');
  }

  // ---------- badges ----------
  // Kept in this browser between visits, so there is always one more to go back for.
  const earned = new Set();
  let badgeQ = 0;
  try { JSON.parse(localStorage.getItem('camp-badges') || '[]').forEach((id) => earned.add(id)); } catch (e) { /* private window */ }
  function award(id) {
    if (earned.has(id) || !L.badges[id]) return;
    earned.add(id);
    try { localStorage.setItem('camp-badges', JSON.stringify([...earned])); } catch (e) { /* private window */ }
    badgeQ++;   // several at once take turns
    setTimeout(() => { badgeQ--; toast(L.badge(L.badges[id].split(':')[0]), 2400); sfx.life(); }, 2200 + (badgeQ - 1) * 2500);
  }
  function parkBadges(o) {
    award('first');
    if (o.perfect) award('perfect');
    if (o.clean && o.towing) award('caravan');
    if (o.clean && o.night) award('night');
    if (o.perfect && o.vip) award('vip');
    if (streak >= 5) award('streak5');
    if (streak >= 9) award('streak9');
    if (parkedCount >= 10) award('ten');
    if (parkedCount >= 20) award('twenty');
    if (parkedCount >= 8 && !stats.bumps && !stats.scares) award('gentle');
  }
  function scoreBadges(n) {
    if (n >= 1500) award('host');
    if (n >= 8000) award('legend');
    if (stats.tips >= 10) award('tips');
  }
  function mine() {   // on the start card: what there is to beat
    let i = 0;
    while (i < RANKS.length - 1 && best >= RANKS[i + 1]) i++;
    $('mine').textContent = best > 0 ? L.mine(best, L.ranks[i], earned.size, Object.keys(L.badges).length) : '';
  }
  mine();

  // ---------- boosts ----------
  // One purple token lies on the roads at a time. speed and freeze run for a while; double, auto and shield are
  // kept until they are used.
  const boost = { speed: 0, freeze: 0, double: 0, auto: 0, shield: 0 };
  const BOOST_SIGN = { speed: '»', freeze: '❄', double: '×2', auto: 'P', shield: '♦', rush: '$' };
  let nextBoost = 0, driftCool = 0, lastChips = '';
  function takeBoost(kind) {
    if (kind === 'speed') boost.speed = 10; else if (kind === 'freeze') boost.freeze = 12;
    else if (kind === 'rush') { for (let i = 0; i < 18; i++) addTip('', clock + 20); banner(L.bRush); }
    else boost[kind]++;
    stats.boosts++; nextBoost = clock + 12; sfx.best(); toast(L.boosts[kind], 2600);
  }
  function boostChips() {
    const parts = [];
    if (boost.speed > 0) parts.push(`» ${Math.ceil(boost.speed)}`);
    if (boost.freeze > 0) parts.push(`❄ ${Math.ceil(boost.freeze)}`);
    if (boost.double) parts.push('×2');
    if (boost.auto) parts.push('P');
    if (boost.shield) parts.push('♦');
    if (job && job.carry) parts.push(`▣ ${job.p.n}`);
    const text = parts.join('  ');
    if (text !== lastChips) { lastChips = text; $('hud-boosts').textContent = text; }
  }
  // Self-parking: close to the pitch the vehicle takes over and puts itself down dead centre.
  function autoPark() {
    const p = target, r = livingRect(car);
    if (Math.hypot(r.cx - (p.x + p.w / 2), r.cy - (p.y + p.d / 2)) > 8) return false;
    boost.auto--; sfx.life(); pop(car.x, car.y, L.autoOn, '#b98ce0', 24);
    if (car.t.trailer) { arrived(true); return true; }   // the caravan is pushed onto the pitch anyway
    const th = (p.laneBelow ? -1 : 1) * Math.PI / 2, ghost = { ...car, th, ph: th, x: 0, y: 0 }, g = livingRect(ghost);
    car.auto = { t: 0, x0: car.x, y0: car.y, th0: car.th, x1: p.x + p.w / 2 - g.cx, y1: p.y + p.d / 2 - g.cy, th1: th };
    return true;
  }
  function stepAuto(dt) {
    const a = car.auto, k = Math.min(1, (a.t += dt) / 1.1), e = k * k * (3 - 2 * k);
    car.x = lerp(a.x0, a.x1, e); car.y = lerp(a.y0, a.y1, e); car.th = wrap(a.th0 + wrap(a.th1 - a.th0) * e); car.vh = car.ph = car.th;
    car.v = 0; car.steer = 0;
    if (k >= 1) { car.auto = null; arrived(true); }
  }

  // ---------- campers talking ----------
  // People from different pitches who meet stop for a few words; some also have something to say to the driver.
  const chats = [];
  let chatT = 4;
  function say(o, text, dur = 2.6) { o.say = text; o.sayT = clock + dur; }
  const talker = (o) => !o.hidden && o.kind !== 'pet' && !(o.flee > 0) && !o.chat && !(o.chatCool > clock);
  function stepChats(dt) {
    for (let i = chats.length - 1; i >= 0; i--) {
      const c = chats[i], gone = c.a.hidden || c.b.hidden || c.a.flee > 0 || c.b.flee > 0 || Math.hypot(c.a.x - c.b.x, c.a.y - c.b.y) > 6;
      if (gone || (clock >= c.t && c.i >= c.lines.length)) {
        c.a.chat = c.b.chat = false; c.a.chatCool = c.b.chatCool = clock + 45; chats.splice(i, 1); continue;
      }
      if (clock >= c.t) { say(c.i % 2 ? c.b : c.a, c.lines[c.i], 2.7); c.i++; c.t = clock + 2.9; }
    }
    if ((chatT -= dt) > 0 || chats.length >= 3) return;
    chatT = 1.5;
    for (let i = 0; i < people.length; i++) {
      const a = people[i];
      if (!talker(a)) continue;
      for (let j = i + 1; j < people.length; j++) {
        const b = people[j];
        if (!talker(b) || a.g === b.g || Math.hypot(a.x - b.x, a.y - b.y) > 3.4) continue;
        const lines = pick(L.chats), stand = lines.length * 2.9 + 1;
        a.chat = b.chat = true; a.wait = Math.max(a.wait, stand); b.wait = Math.max(b.wait, stand);
        a.dir = Math.atan2(b.y - a.y, b.x - a.x); b.dir = a.dir + Math.PI;
        chats.push({ a, b, lines, i: 0, t: clock + 0.4 });
        return;
      }
    }
  }
  function chorus(lines, n) {   // a few campers, wherever they are, say something
    people.filter((o) => !o.hidden && o.kind !== 'pet' && !o.chat).sort(() => Math.random() - 0.5).slice(0, n).forEach((o) => say(o, pick(lines), 3));
  }
  function remark(lines, x, y, reach = 12) {   // the nearest camper in earshot says something
    let who = null, best = reach;
    for (const o of people) {
      if (o.hidden || o.kind === 'pet' || o.chat) continue;
      const d = Math.hypot(o.x - x, o.y - y);
      if (d < best) { best = d; who = o; }
    }
    if (who) say(who, pick(lines));
  }
  function drawBubbles() {
    ctx.font = '800 13px Overpass, "Segoe UI", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    for (const o of people) {
      if (o.hidden || !(o.sayT > clock)) continue;
      const [px, py] = P(o.x, o.y, 1.7);
      if (px < -150 || px > vw + 150 || py < -40 || py > vh + 80) continue;
      const w = ctx.measureText(o.say).width + 18, h = 24, x = clamp(px, w / 2 + 6, vw - w / 2 - 6), y = py - 30;
      ctx.globalAlpha = clamp((o.sayT - clock) / 0.3, 0, 1);
      ctx.fillStyle = '#f6f1df'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x - w / 2, y - h / 2, w, h, 9); else ctx.rect(x - w / 2, y - h / 2, w, h);
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 5, y + h / 2 - 1); ctx.lineTo(px, y + h / 2 + 8); ctx.lineTo(px + 5, y + h / 2 - 1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(px - 5, y + h / 2); ctx.lineTo(px, y + h / 2 + 8); ctx.lineTo(px + 5, y + h / 2); ctx.stroke();
      ctx.fillStyle = '#12211a'; ctx.fillText(o.say, x, y + 1);
    }
    ctx.globalAlpha = 1;
  }

  // ---------- the warden ----------
  // Bumps and scares raise the heat (up to three stars). While there is heat the warden's cart comes after the
  // driver along the roads; being caught costs a fine. Heat cools with time and with clean parkings.
  const NODES = { A: [11.5, 24], B: [60, 24], C: [108.5, 24], D: [11.5, 54], E: [60, 54], F: [108.5, 54], G: [60, 84] };
  const LINKS = { A: 'BD', B: 'ACE', C: 'BF', D: 'AE', E: 'BDFG', F: 'CE', G: 'E' };
  let heat = 0, calm = 0, warden = null, sirenT = 0, lastStars = '';
  const nodeGap = (k, x, y) => Math.hypot(NODES[k][0] - x, NODES[k][1] - y);
  const nearNode = (x, y) => Object.keys(NODES).reduce((b, k) => (nodeGap(k, x, y) < nodeGap(b, x, y) ? k : b), 'G');
  function nextNode(from, to) {   // the first step of the shortest way round
    if (from === to) return to;
    const prev = { [from]: null }, q = [from];
    while (q.length) { const n = q.shift(); for (const m of LINKS[n]) if (!(m in prev)) { prev[m] = n; q.push(m); } }
    let n = to;
    while (prev[n] !== from) n = prev[n];
    return n;
  }
  // The banners are read out too, in a deep announcer's voice, when the browser has a voice for the language.
  function shout(text) {
    const synth = window.speechSynthesis;
    if (muted || !synth || !window.SpeechSynthesisUtterance) return;
    try {
      const voice = synth.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith(LANG));
      if (!voice) return;
      const u = new SpeechSynthesisUtterance(text.replace('×', '').toLowerCase());
      u.voice = voice; u.lang = voice.lang; u.pitch = 0.5; u.rate = 1.05; u.volume = 0.7;
      synth.cancel(); synth.speak(u);
    } catch (e) { /* no speech: the banner is enough */ }
  }
  function banner(text) {
    const el = $('banner');
    el.textContent = text; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
    shout(text);
  }
  function heatStars() {
    const s = heat > 0 ? '★'.repeat(Math.ceil(heat)) : '';
    if (s !== lastStars) { lastStars = s; $('hud-heat').textContent = s; }
  }
  function trouble(n) {
    heat = Math.min(3, heat + n); calm = 0; heatStars();
    if (!warden && heat >= 1) { warden = { x: 60, y: 86, th: -Math.PI / 2, at: 'G', to: 'G', direct: false }; toast(L.wardenOn, 2600); banner(L.bWarden); }
  }
  function stepWarden(dt) {
    if (!warden) { if (heat > 0) { heat = Math.max(0, heat - dt / 15); heatStars(); } return; }
    calm += dt;
    if (calm > 10) { heat = Math.max(0, heat - dt / 7); heatStars(); }
    const w = warden, hot = heat > 0 && car, d = car ? Math.hypot(car.x - w.x, car.y - w.y) : 99;
    let goal;
    if (hot && (d < 11 || (w.direct && d < 18) || (w.at === nearNode(car.x, car.y) && nodeGap(w.at, w.x, w.y) < 0.5))) { goal = [car.x, car.y]; w.direct = true; }
    else {
      if (w.direct) { w.direct = false; w.to = nearNode(w.x, w.y); }
      if (nodeGap(w.to, w.x, w.y) < 0.4) {
        w.at = w.to;
        const dest = hot ? nearNode(car.x, car.y) : 'G';
        if (w.at !== dest) w.to = nextNode(w.at, dest); else if (heat <= 0) { warden = null; return; }
      }
      goal = NODES[w.to];
    }
    const gx = goal[0] - w.x, gy = goal[1] - w.y, gd = Math.hypot(gx, gy), sp = (heat > 0 ? 6 + heat * 0.9 : 5) * dt;
    if (gd > 0.05) { w.x += (gx / gd) * Math.min(sp, gd); w.y += (gy / gd) * Math.min(sp, gd); w.th = wrap(w.th + clamp(wrap(Math.atan2(gy, gx) - w.th), -6 * dt, 6 * dt)); }
    if (heat > 0 && (sirenT -= dt) <= 0) { sirenT = 0.45; w.hi = !w.hi; if (d < 45) note(w.hi ? 740 : 587, 0, 0.2, 'square', 0.035); }
    if (hot && d < 2.7 && clock - car.born > 2 && !car.auto) {   // caught
      const fine = Math.round((40 + 30 * Math.ceil(heat)) * (owned.has('banitsa') ? 0.5 : 1));
      damage += fine; streak = 0; heat = 0; heatStars(); stats.fines++; car.v = 0;
      w.direct = false; w.to = nearNode(w.x, w.y);
      sfx.lost(); pop(car.x, car.y, `−${fine}`, '#e2553d', 30); toast(L.fined(fine), 2600); banner(L.bFined); boss('fine'); remark(L.sayFine, car.x, car.y, 20); hud();
    }
  }
  function drawWarden() {
    if (!warden) return;
    const r = { cx: warden.x, cy: warden.y, hl: 1.35, hw: 0.8, a: warden.th };
    drawBox(r, 1.5, '#e8efe6', '#2f5d49');
    const [x, y] = P(warden.x, warden.y, 2), on = heat > 0 && Math.sin(clock * 14) > 0;
    ctx.fillStyle = on ? '#e2553d' : '#f4c531'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, on ? 6 : 4.5, 0, TAU); ctx.fill(); ctx.stroke();
  }

  // ---------- errands ----------
  // Now and then a camper asks for something: pick it up at the green marker, drop it at the lane by their pitch.
  // Errands are optional and run alongside the guest being parked.
  const SPOTS = [[62, 74, 'reception', [0, 1, 2, 4]], [62, 74, 'reception', [1, 2, 4]], [23, 22, 'wash', [3]], [92, 22, 'pond', [5]], [31, 56, 'fire', [0]]];   // where, and which of L.items can be had there
  let job = null, nextJob = 0;
  function stepJobs() {
    if (!job) {
      if (clock < nextJob || thief) return;
      const homes = guests.filter((g) => g.parked && !g.packing && !g.leaving && g.parked.pitch !== target);
      if (!homes.length) { nextJob = clock + 5; return; }
      const g = pick(homes), p = g.parked.pitch, s = pick(SPOTS), item = pick(s[3]);
      job = { g, p, x: s[0], y: s[1], item, carry: false, until: clock + 75, dx: p.x + p.w / 2, dy: p.laneBelow ? p.y + p.d + 2.2 : p.y - 2.2 };
      toast(L.jobAsk(p.n, L.items[item], L.spots[s[2]]), 3600); sfx.next();
      return;
    }
    if (clock > job.until || job.g.packing || job.g.leaving) { toast(L.jobLate, 2000); job = null; nextJob = clock + 20; return; }
    const gx = job.carry ? job.dx : job.x, gy = job.carry ? job.dy : job.y;
    if (!rectsOf(car).some((r) => rectCircle(r, gx, gy, job.carry ? 2.6 : 1.3))) return;
    if (!job.carry) {
      job.carry = true; job.until = clock + 60; sfx.coin(); pop(gx, gy, L.items[job.item], '#8fd18a', 22); toast(L.jobCarry(L.items[job.item], job.p.n), 2600);
    } else {
      total += 120; patience = Math.min(patienceMax, patience + 5); stats.errands++; sfx.park(4, false);
      pop(gx, gy, '+120', '#8fd18a', 30); remark(L.thanks, job.dx, job.dy, 14);
      if (stats.errands >= 5) award('errand');
      job = null; nextJob = clock + 25; hud();
    }
  }
  function drawJob() {
    if (!job || mode !== 'play') return;
    const gx = job.carry ? job.dx : job.x, gy = job.carry ? job.dy : job.y, [x, y] = P(gx, gy, 0.5), k = cam.s;
    ctx.fillStyle = '#8fd18a'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.arc(x, y, 0.95 * k * (1 + 0.12 * Math.sin(clock * 6)), 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#12211a'; ctx.font = `900 ${Math.round(1.1 * k)}px Overpass, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(job.carry ? '↓' : '?', x, y + 1);
    if (x < 30 || x > vw - 30 || y < 90 || y > vh - 30) {   // off screen: a green pointer
      const ax = clamp(x, 34, vw - 34), ay = clamp(y, 150, vh - 110);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(y - ay, x - ax)); ctx.fillStyle = '#8fd18a';
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-9, -12); ctx.lineTo(-3, 0); ctx.lineTo(-9, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- radio ----------
  // Three stations, each a small sequencer: a bass line, a kick and a tune that is made up afresh every two bars.
  // Vitosha FM is in 7/8, as a rachenitsa should be.
  const STATIONS = [
    null,
    { name: 'Vitosha FM', step: 0.17, len: 7, root: 2, scale: [0, 2, 3, 5, 7, 8, 10], bass: [0, -1, 0, -1, 4, -1, 4], kick: [0, 2, 4], wave: 'square' },
    { name: 'Radio Lager', step: 0.26, len: 8, root: 0, scale: [0, 2, 4, 7, 9], bass: [0, -1, 2, -1, 3, -1, 2, -1], kick: [0, 4], wave: 'triangle' },
    { name: 'Night Drive', step: 0.21, len: 8, root: -3, scale: [0, 3, 5, 7, 10], bass: [0, 0, -1, 0, 3, 3, -1, 2], kick: [0, 3, 6], wave: 'sawtooth' },
  ];
  let station = 1, radioT = 0, radioStep = 0, tune = [];
  try { const v = localStorage.getItem('camp-radio'); if (v !== null) station = clamp(+v || 0, 0, STATIONS.length - 1); } catch (e) { /* private window */ }
  function stepRadio(dt) {
    const s = STATIONS[station];
    if (!s || !AC || paused || mode !== 'play' || (radioT -= dt) > 0) return;
    radioT = Math.max(radioT + s.step, 0);
    const i = radioStep % s.len, deg = (n) => s.scale[n % s.scale.length] + 12 * Math.floor(n / s.scale.length);
    if (i === 0 && (radioStep / s.len) % 2 === 0) {
      let k = 2 + ((Math.random() * 3) | 0);
      tune = Array.from({ length: s.len }, () => (Math.random() < 0.3 ? -1 : (k = clamp(k + ((Math.random() * 5) | 0) - 2, 0, 9))));
    }
    if (s.bass[i] >= 0) note(hz(s.root - 24 + deg(s.bass[i])), 0, s.step * 0.9, 'triangle', 0.14);
    if (tune[i] >= 0) note(hz(s.root + deg(tune[i])), 0, s.step * 0.8, s.wave, 0.03);
    if (s.kick.includes(i)) note(120, 0, 0.12, 'sine', 0.18, 45);
    radioStep++;
  }
  function showRadio() { $('radio').classList.toggle('off', !station); $('radio').title = station ? STATIONS[station].name : L.radioOff; }
  function tuneRadio() {
    station = (station + 1) % STATIONS.length; radioStep = 0; radioT = 0.3;
    try { localStorage.setItem('camp-radio', String(station)); } catch (e) { /* private window */ }
    audioOn(); showRadio(); toast(station ? `♪ ${STATIONS[station].name}` : L.radioOff, 1600);
  }
  showRadio();
  $('radio').addEventListener('click', () => { tuneRadio(); cv.focus(); });
  addEventListener('keydown', (e) => { if (e.code === 'KeyR' && !e.repeat && !paused) tuneRadio(); });

  // ---------- rain ----------
  // A shower every couple of minutes: the roads get slippery and a parking in the rain is worth a fifth more.
  let rain = 0, raining = false, nextRain = 70, rainGain = null;
  function stepWeather(dt) {
    if (clock > nextRain) {
      raining = !raining; nextRain = clock + (raining ? 35 + Math.random() * 20 : 90 + Math.random() * 80);
      if (raining) { toast(L.rainOn, 2400); thud(0.5); chorus(L.sayRain, 4); }
    }
    rain = clamp(rain + (raining ? dt : -dt) / 4, 0, 1);
  }
  function rainSound() {
    if (!AC) return;
    if (!rainGain) {
      const n = AC.sampleRate, buf = AC.createBuffer(1, n, n), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      const src = AC.createBufferSource(), f = AC.createBiquadFilter();
      rainGain = AC.createGain(); rainGain.gain.value = 0;
      src.buffer = buf; src.loop = true; f.type = 'highpass'; f.frequency.value = 2400;
      src.connect(f); f.connect(rainGain); rainGain.connect(master); src.start();
    }
    rainGain.gain.setTargetAtTime(mode === 'play' && !paused ? rain * 0.06 : 0, AC.currentTime, 0.3);
  }
  function drawRain() {
    if (rain <= 0.02) return;
    ctx.fillStyle = `rgba(40,60,90,${0.2 * rain})`; ctx.fillRect(0, 0, vw, vh);
    if (reduceMotion) return;
    ctx.strokeStyle = `rgba(210,225,240,${0.45 * rain})`; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 90; i++) { const x = Math.random() * vw, y = Math.random() * vh; ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 16); }
    ctx.stroke();
  }

  // ---------- the sausage dog ----------
  // Now and then a dog makes off with somebody's sausages and runs the roads. Catch up with it for a reward.
  let thief = null, nextThief = 50;
  function stepThief(dt) {
    if (!thief) {
      if (clock < nextThief || job) return;
      const far = Object.keys(NODES).filter((k) => k !== 'G' && nodeGap(k, car.x, car.y) > 30), at = pick(far.length ? far : ['A']);
      thief = { x: NODES[at][0], y: NODES[at][1], at, to: at, until: clock + 50, th: 0 };
      toast(L.dogOn, 3200); remark(L.sayDog, NODES[at][0], NODES[at][1], 60); note(520, 0, 0.09, 'square', 0.1); note(390, 0.12, 0.12, 'square', 0.1);
      return;
    }
    const t = thief;
    if (nodeGap(t.to, t.x, t.y) < 0.4) {   // at a junction: take the way that leads away from the driver, and not straight back
      const from = t.at, ways = [...LINKS[t.to]].filter((k) => k !== 'G');
      t.at = t.to;
      let bestWay = ways[0], bestScore = -1e9;
      for (const k of ways) { const sc = nodeGap(k, car.x, car.y) - (k === from ? 25 : 0) + Math.random() * 10; if (sc > bestScore) { bestScore = sc; bestWay = k; } }
      t.to = bestWay;
    }
    const gx = NODES[t.to][0] - t.x, gy = NODES[t.to][1] - t.y, gd = Math.hypot(gx, gy), sp = Math.min(7.2 * dt, gd);
    if (gd > 0.01) { t.x += (gx / gd) * sp; t.y += (gy / gd) * sp; t.th = Math.atan2(gy, gx); }
    if (Math.hypot(car.x - t.x, car.y - t.y) < 2.8) {
      total += 200; stats.dogs++; award('dog'); sfx.park(6, true); pop(t.x, t.y, '+200', '#f4c531', 34); toast(L.dogWon, 2600); banner(L.bDog); boss('dog');
      thief = null; nextThief = clock + 75; hud();
    } else if (clock > t.until) { toast(L.dogLost, 2200); thief = null; nextThief = clock + 60; }
  }
  function drawThief() {
    if (!thief || mode !== 'play') return;
    const [x, y] = P(thief.x, thief.y, 0.3), k = cam.s * 1.8, c = Math.cos(thief.th), s = Math.sin(thief.th), bob = Math.sin(clock * 18) * 0.1 * k;
    ctx.strokeStyle = '#12211a'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#d9705f';
    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(x - c * k * (0.5 + i * 0.42), y - s * k * (0.5 + i * 0.42) + (i % 2 ? bob : -bob), 0.2 * k, 0, TAU); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#a0673a';
    ctx.beginPath(); ctx.ellipse(x, y, 0.62 * k, 0.36 * k, thief.th, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + c * 0.6 * k, y + s * 0.6 * k, 0.3 * k, 0, TAU); ctx.fill(); ctx.stroke();
    if (x < 30 || x > vw - 30 || y < 90 || y > vh - 30) {   // off screen: a brown pointer
      const ax = clamp(x, 34, vw - 34), ay = clamp(y, 150, vh - 110);
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(Math.atan2(y - ay, x - ax)); ctx.fillStyle = '#c98a55';
      ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-9, -12); ctx.lineTo(-3, 0); ctx.lineTo(-9, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- the little map ----------
  // Top left, once the name plate has stepped aside: roads, the pitch to reach and everything worth chasing.
  let playT = 0;
  function drawMap() {
    if (mode !== 'play' || clock - playT < 5.6) return;
    const k = Math.min(1.15, (vw * 0.34) / W), x0 = 12, y0 = 12, mw = W * k, mh = H * k;
    const dot = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x0 + x * k, y0 + y * k, r, 0, TAU); ctx.fill(); };
    ctx.save();
    ctx.globalAlpha = 0.85; ctx.fillStyle = '#12211a';
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x0 - 4, y0 - 4, mw + 8, mh + 8, 8); else ctx.rect(x0 - 4, y0 - 4, mw + 8, mh + 8); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#4c6b58';
    for (const r of roads) ctx.fillRect(x0 + r.x * k, y0 + r.y * k, r.w * k, r.h * k);
    for (const t of tips) dot(t.x, t.y, t.boost ? 3 : 1.6, t.boost ? '#b98ce0' : t.time ? '#6fb6d9' : '#f4c531');
    if (target) { ctx.fillStyle = Math.sin(clock * 6) > 0 ? '#f4c531' : '#f6f1df'; ctx.fillRect(x0 + target.x * k - 1, y0 + target.y * k - 1, target.w * k + 2, target.d * k + 2); }
    if (job) dot(job.carry ? job.dx : job.x, job.carry ? job.dy : job.y, 3.5, '#8fd18a');
    if (thief) dot(thief.x, thief.y, 3.5, '#c98a55');
    if (ice) dot(ice.x, ice.y, 3, '#f2a7c0');
    if (warden) dot(warden.x, warden.y, 3.5, heat > 0 && Math.sin(clock * 14) > 0 ? '#e2553d' : '#7fa6ff');
    if (car) {
      const cx = x0 + car.x * k, cy = y0 + car.y * k, c = Math.cos(car.th), s = Math.sin(car.th);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx + c * 6, cy + s * 6); ctx.lineTo(cx - c * 4 - s * 4, cy - s * 4 + c * 4); ctx.lineTo(cx - c * 4 + s * 4, cy - s * 4 - c * 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    drawGoalList(x0 - 2, y0 + mh + 10);
    ctx.restore();
  }

  // ---------- hidden gnomes ----------
  // Ten garden gnomes stand in out-of-the-way corners. Each is found once and stays found between visits.
  const GNOMES = [[60, 15.5], [88, 74], [12, 64], [108, 64], [112, 8], [8, 8], [52, 73], [36, 73], [84, 18.5], [100, 84]];
  const found = new Set();
  let lastDrift = -99;
  try { JSON.parse(localStorage.getItem('camp-gnomes') || '[]').forEach((i) => found.add(i)); } catch (e) { /* private window */ }
  function stepGnomes() {
    if (found.size === GNOMES.length) return;
    const rects = rectsOf(car);
    GNOMES.forEach(([x, y], i) => {
      if (found.has(i) || Math.abs(x - car.x) > 12 || Math.abs(y - car.y) > 12 || !rects.some((r) => rectCircle(r, x, y, 2.8))) return;
      found.add(i);
      try { localStorage.setItem('camp-gnomes', JSON.stringify([...found])); } catch (e) { /* private window */ }
      total += 100; sfx.best(); pop(x, y, '+100', '#e2553d', 30); toast(L.gnome(found.size, GNOMES.length), 2800);
      if (found.size === GNOMES.length) { total += 1000; banner(L.bGnomes); award('gnomes'); }
      hud();
    });
  }
  function drawGnomes() {
    const k = cam.s;
    GNOMES.forEach(([x, y], i) => {
      if (found.has(i)) return;
      const [bx, by] = P(x, y), [fx, fy] = P(x, y, 0.6), [tx, ty] = P(x, y, 1.5);
      if (bx < -20 || bx > vw + 20 || by < -20 || by > vh + 20) return;
      ctx.strokeStyle = '#12211a'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
      ctx.fillStyle = '#3f6fb0'; ctx.beginPath(); ctx.arc(bx, by, 0.36 * k, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f6f1df'; ctx.beginPath(); ctx.arc(fx, fy, 0.3 * k, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e2553d'; ctx.beginPath(); ctx.moveTo(fx - 0.3 * k, fy - 0.1 * k); ctx.lineTo(tx, ty - 0.5 * k); ctx.lineTo(fx + 0.3 * k, fy - 0.1 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }

  // ---------- the ice-cream van ----------
  // Slow traffic: it trundles round the lanes playing its tune, and it is very much in the way.
  let ice = null, jingleT = 0;
  const iceRect = () => ({ cx: ice.x, cy: ice.y, hl: 2.4, hw: 1.05, a: ice.th });
  function stepIce(dt) {
    if (!ice) { ice = { x: NODES.C[0], y: NODES.C[1], th: Math.PI, at: 'C', to: 'B' }; return; }
    const t = ice;
    if (nodeGap(t.to, t.x, t.y) < 0.3) {
      const from = t.at, ways = [...LINKS[t.to]].filter((k) => k !== 'G' && k !== from);
      t.at = t.to; t.to = ways.length ? pick(ways) : from;
    }
    const gx = NODES[t.to][0] - t.x, gy = NODES[t.to][1] - t.y, gd = Math.hypot(gx, gy);
    t.th = wrap(t.th + clamp(wrap(Math.atan2(gy, gx) - t.th), -1.6 * dt, 1.6 * dt));
    // it waits for anything in front of it: the driver, guests driving out, people
    const fx = Math.cos(t.th), fy = Math.sin(t.th), ahead = (x, y, far) => { const dx = x - t.x, dy = y - t.y, a = dx * fx + dy * fy; return a > 0 && a < far && Math.abs(dx * fy - dy * fx) < 2.6; };
    const held = (car && (ahead(car.x, car.y, 10) || Math.hypot(car.x - t.x, car.y - t.y) < 5)) || guests.some((g) => g.leave && ahead(g.x, g.y, 10)) || people.some((o) => !o.hidden && ahead(o.x, o.y, 5));
    if (!held && Math.abs(wrap(Math.atan2(gy, gx) - t.th)) < 0.5) { const sp = Math.min(3.2 * dt, gd); t.x += fx * sp; t.y += fy * sp; }
    if (car && (jingleT -= dt) <= 0 && Math.hypot(car.x - t.x, car.y - t.y) < 28) {
      jingleT = 5;
      if (Math.random() < 0.5) { const kid = people.find((o) => !o.hidden && o.kind === 'kid' && !o.chat && Math.hypot(o.x - t.x, o.y - t.y) < 16); if (kid) say(kid, pick(L.sayIce)); }
      [12, 16, 19, 16, 12, 19, 24].forEach((n, i) => note(hz(n), i * 0.16, 0.14, 'sine', 0.05));
    }
  }
  function drawIce() {
    if (!ice) return;
    const r = iceRect();
    drawBox(r, 2.3, '#f6f1df', '#f2a7c0');
    const [x, y] = P(ice.x, ice.y, 3.1), k = cam.s;   // the cone on the roof
    ctx.strokeStyle = '#12211a'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.fillStyle = '#d9a13b'; ctx.beginPath(); ctx.moveTo(x - 0.4 * k, y); ctx.lineTo(x + 0.4 * k, y); ctx.lineTo(x, y + 0.9 * k); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f6f1df'; ctx.beginPath(); ctx.arc(x, y - 0.1 * k, 0.45 * k, 0, TAU); ctx.fill(); ctx.stroke();
  }

  // ---------- gamepad ----------
  // Left stick or d-pad steers, right trigger drives, left trigger reverses, A is the handbrake, X the horn.
  const padState = {};
  function pollPad() {
    const p = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
    if (!p) return;
    const b = (i) => !!(p.buttons[i] && p.buttons[i].pressed), v = (i) => (p.buttons[i] ? p.buttons[i].value : 0), ax = p.axes[0] || 0;
    const st = { left: ax < -0.3 || b(14), right: ax > 0.3 || b(15), up: v(7) > 0.2 || b(12), down: v(6) > 0.2 || b(13), brake: b(0), horn: b(2) };
    for (const k in st) if (st[k] !== padState[k]) { padState[k] = st[k]; if (!paused) keys[k] = st[k]; }
    const go = b(9) || b(0);
    if (go && !padState.go) { if (mode === 'attract') start(); else if (mode === 'over' && card.open) card.close(); }
    padState.go = go;
  }

  // ---------- goals for the shift ----------
  // Three small aims drawn at the start of every shift and listed under the map: 150 points each, 300 more for all three.
  const GOAL_POOL = [['tips', 8], ['errands', 2], ['perfect', 3], ['dogs', 1], ['streak', 5], ['parked', 8], ['boosts', 3], ['honks', 5]];
  let goals = [];
  const goalNow = (g) => Math.min(g.n, g.key === 'parked' ? parkedCount : stats[g.key]);
  function drawGoals() {
    const pool = GOAL_POOL.slice();
    goals = [0, 1, 2].map(() => { const [key, n] = pool.splice((Math.random() * pool.length) | 0, 1)[0]; return { key, n, done: false }; });
  }
  function checkGoals() {
    for (const g of goals) {
      if (g.done || goalNow(g) < g.n) continue;
      g.done = true; total += 150; sfx.life(); toast(L.goalDone(L.goalNames[g.key]), 2400);
      if (goals.every((x) => x.done)) { total += 300; banner(L.bGoals); award('goals'); }
    }
  }
  function drawGoalList(x, y) {
    ctx.font = '800 12px Overpass, "Segoe UI", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.lineJoin = 'round'; ctx.lineWidth = 3.5; ctx.strokeStyle = '#12211a';
    goals.forEach((g, i) => {
      const text = `${g.done ? '✓' : '○'} ${L.goalNames[g.key]} ${goalNow(g)}/${g.n}`;
      ctx.strokeText(text, x, y + i * 16); ctx.fillStyle = g.done ? '#8fd18a' : '#f6f1df'; ctx.fillText(text, x, y + i * 16);
    });
  }

  // ---------- things to knock over ----------
  // Cones, a couple of bins and stray footballs. They fly when hit and wander back to their places after a while.
  // A cone is worth five points and a little of the warden's attention; four in one go is a strike.
  const props = [];
  [[58, 40], [40, 26.5], [85, 52], [12, 45]].forEach(([x, y]) => [[0, 0], [0.9, 0.5], [0.9, -0.5], [1.8, 1], [1.8, 0], [1.8, -1]].forEach(([dx, dy]) => props.push({ kind: 'cone', hx: x + dx, hy: y + dy })));
  [[65.6, 72], [30.5, 21]].forEach(([x, y]) => props.push({ kind: 'bin', hx: x, hy: y }));
  [[30, 53], [95, 25], [61, 66]].forEach(([x, y]) => props.push({ kind: 'ball', hx: x, hy: y }));
  props.forEach((o) => Object.assign(o, { x: o.hx, y: o.hy, vx: 0, vy: 0, z: 0, vz: 0, a: 0, spin: 0, away: 0 }));
  let strikeN = 0, strikeT = 0;
  function stepProps(dt) {
    const rects = car && Math.abs(car.v) > 0.6 ? rectsOf(car) : null;
    for (const o of props) {
      if (rects && Math.abs(o.x - car.x) < 9 && Math.abs(o.y - car.y) < 9 && o.z < 0.8 && rects.some((r) => rectCircle(r, o.x, o.y, 0.45))) {
        const dx = o.x - car.x, dy = o.y - car.y, d = Math.hypot(dx, dy) || 1, sp = Math.abs(car.v) * (o.kind === 'ball' ? 1.9 : 1.2) + 2;
        const fresh = o.away <= 0;
        o.vx = (dx / d) * sp * 0.6 + Math.cos(car.vh === undefined ? car.th : car.vh) * car.v * 0.7; o.vy = (dy / d) * sp * 0.6 + Math.sin(car.vh === undefined ? car.th : car.vh) * car.v * 0.7;
        o.vz = 3 + Math.abs(car.v) * 0.35; o.spin = (Math.random() - 0.5) * 16; o.away = 18;
        note(o.kind === 'ball' ? 240 : 150, 0, 0.08, 'triangle', 0.14, 70);
        if (fresh && o.kind === 'cone' && mode === 'play') {
          total += 5; stats.cones++; trouble(0.12); pop(o.x, o.y, '+5', '#f08a3c', 20);
          strikeN = clock - strikeT < 1.2 ? strikeN + 1 : 1; strikeT = clock;
          if (strikeN === 4) { total += 50; banner(L.bStrike); award('strike'); }
          if (strikeN === 1) remark(L.sayCone, o.x, o.y, 18);
          hud();
        }
      }
      if (o.vx || o.vy || o.z > 0) {
        o.x += o.vx * dt; o.y += o.vy * dt; o.z = Math.max(0, o.z + o.vz * dt); o.vz -= 14 * dt; o.a += o.spin * dt;
        if (o.z === 0) { const f = Math.exp(-dt * (o.kind === 'ball' ? 1.2 : 3.5)); o.vx *= f; o.vy *= f; o.spin *= f; if (o.vz < -2) o.vz = -o.vz * 0.35; else o.vz = 0; }
        if (o.x < 2 || o.x > W - 2) o.vx = -o.vx; if (o.y < 2 || o.y > H - 2) o.vy = -o.vy;
        if (Math.hypot(o.vx, o.vy) < 0.15 && o.z === 0) { o.vx = o.vy = 0; }
      }
      if (o.away > 0 && (o.away -= dt) <= 0 && !(car && Math.hypot(o.hx - car.x, o.hy - car.y) < 8)) { o.x = o.hx; o.y = o.hy; o.vx = o.vy = o.z = o.vz = o.a = 0; } else if (o.away <= 0 && o.away > -1 && (o.x !== o.hx || o.y !== o.hy)) o.away = 2;
    }
  }
  function drawProps() {
    const k = cam.s;
    for (const o of props) {
      const [x, y] = P(o.x, o.y, o.z), [sx, sy] = P(o.x, o.y);
      if (x < -30 || x > vw + 30 || y < -30 || y > vh + 30) continue;
      ctx.fillStyle = 'rgba(15,30,20,0.25)'; ctx.beginPath(); ctx.arc(sx + 2, sy + 2, 0.4 * k, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.a); ctx.strokeStyle = '#12211a'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
      if (o.kind === 'cone') {
        ctx.fillStyle = '#f08a3c'; ctx.beginPath(); ctx.rect(-0.42 * k, -0.42 * k, 0.84 * k, 0.84 * k); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f6f1df'; ctx.beginPath(); ctx.arc(0, 0, 0.27 * k, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f08a3c'; ctx.beginPath(); ctx.arc(0, 0, 0.12 * k, 0, TAU); ctx.fill();
      } else if (o.kind === 'bin') {
        ctx.fillStyle = '#4f6b7a'; ctx.beginPath(); ctx.arc(0, 0, 0.5 * k, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2f4450'; ctx.beginPath(); ctx.arc(0, 0, 0.3 * k, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = '#f6f1df'; ctx.beginPath(); ctx.arc(0, 0, 0.36 * k, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#12211a'; ctx.beginPath(); ctx.arc(0.1 * k, 0, 0.12 * k, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  // ---------- the clubs ----------
  // Van lifers, the motorhome society and the caravan club each keep an opinion of the gate keeper, from -5 to +5.
  // Park their members cleanly and it rises; from +3 they tip a quarter more. Let it sink to -3 and they stop waiting so long.
  const respect = { van: 0, motorhome: 0, combo: 0 };
  function regard(kind, d) {
    if (!(kind in respect)) return;
    const was = respect[kind];
    respect[kind] = clamp(was + d, -5, 5);
    if (respect[kind] !== was && car) pop(car.x, car.y, `${L.clubs[kind]} ${d > 0 ? '+1' : '−1'}`, d > 0 ? '#8fd18a' : '#e2553d', 18, 130);
    if (was < 3 && respect[kind] >= 3) toast(L.clubUp(L.clubs[kind]), 2600);
    if (was > -3 && respect[kind] <= -3) toast(L.clubDown(L.clubs[kind]), 2600);
  }
  function clubRows() {
    const dl = $('st-clubs');
    dl.textContent = '';
    Object.keys(respect).forEach((k) => {
      const row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd'), n = respect[k];
      dt.textContent = L.clubs[k]; dd.textContent = (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n) + ' ' + (n >= 3 ? '★' : n <= -3 ? '☹' : '');
      row.append(dt, dd); dl.append(row);
    });
  }

  // ---------- the speed trap and the fireflies ----------
  let trapCool = 0;
  function stepTrap(dt) {   // ten an hour past reception, please
    trapCool -= dt;
    if (trapCool > 0 || Math.abs(car.v) < 9 || car.y < 58 || car.y > 70 || car.x < 56 || car.x > 64) return;
    trapCool = 8; trouble(0.6); toast(L.trap, 2200); note(1800, 0, 0.05, 'square', 0.08);
    if (!reduceMotion) $('flash').classList.remove('on'), void $('flash').offsetWidth, $('flash').classList.add('on');
  }
  const flies = Array.from({ length: 46 }, () => ({ x: 4 + Math.random() * (W - 8), y: 4 + Math.random() * (H - 8), p: Math.random() * TAU, s: 0.5 + Math.random() }));
  function drawFlies() {
    if (night < 0.5 || reduceMotion) return;
    for (const f of flies) {
      const x0 = f.x + Math.sin(clock * 0.4 * f.s + f.p) * 3, y0 = f.y + Math.cos(clock * 0.3 * f.s + f.p * 2) * 3, [x, y] = P(x0, y0, 1.2);
      if (x < 0 || x > vw || y < 0 || y > vh) continue;
      const a = (night - 0.5) * 2 * (0.5 + 0.5 * Math.sin(clock * 2.2 * f.s + f.p));
      ctx.fillStyle = `rgba(214,255,150,${0.22 * a})`; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(236,255,190,${a})`; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
    }
  }

  // ---------- simulation ----------
  function step(dt) {
    clock += dt;
    night = clamp((Math.cos(((clock % 200) / 200) * TAU + Math.PI) - 0.25) / 0.5, 0, 1);   // 0 by day, 1 at night; a day lasts a little over three minutes
    for (let i = guests.length - 1; i >= 0; i--) {
      const g = guests[i];
      if (!g.family && clock > g.parked.t + 1) spawnFamily(g);
      if (mode === 'play' && !g.packing && night < 0.3 && clock > g.parked.t + g.stay) packUp(g);
      if (g.packing && !g.leaving && g.kind === 'caravan' && clock - g.packing > 3) {   // turn the caravan to face the lane
        const b = bodyRect(g), off = g.t.L / 2 - g.t.rear, e = wrap((g.parked.pitch.laneBelow ? 1 : -1) * Math.PI / 2 - g.th);
        g.slide = null;
        g.th = wrap(g.th + clamp(e, -1.3 * dt, 1.3 * dt));
        g.x = b.cx - Math.cos(g.th) * off; g.y = b.cy - Math.sin(g.th) * off;
      }
      if (g.packing && !g.leaving && clock - g.packing > 6) startLeaving(g);
      if (g.leaving && stepLeaver(g, dt)) { if (g.parked.pitch.guest === g) g.parked.pitch.guest = null; guests.splice(i, 1); continue; }
      if (g.slide) {   // a caravan being pushed the last metre onto its pitch
        const k = 1 - Math.exp(-dt * 3);
        g.x = lerp(g.x, g.slide.x, k); g.y = lerp(g.y, g.slide.y, k); g.th = wrap(g.th + wrap(g.slide.th - g.th) * k);
      }
    }
    for (let i = ghosts.length - 1; i >= 0; i--) { ghosts[i].alpha -= dt / 1.2; if (ghosts[i].alpha <= 0) ghosts.splice(i, 1); }
    stepPeople(dt); stepChats(dt); stepProps(dt);
    if (mode === 'play') { stepWarden(dt); stepWeather(dt); stepIce(dt); }
    if (mode === 'play') stats.time += dt;
    if (mode !== 'play' || !car) return;

    hornCool -= dt;
    if (keys.horn && hornCool <= 0) honk();
    stepTips(); stepJobs(); stepThief(dt); stepGnomes(); stepTrap(dt);
    boost.speed -= dt; boost.freeze -= dt; driftCool -= dt; boostChips();
    if (car.auto) { stepAuto(dt); return; }
    if (boost.auto && autoPark()) return;
    const t = car.t, v0 = car.v;
    const onRoad = onRoadOrPitch(car.x, car.y);
    // The handbrake locks the rear wheels: at speed the back swings round and the vehicle slides. Not with a caravan on.
    const fast = boost.speed > 0 ? 1.5 : 1, vmax = (onRoad ? t.vmax : 4.5) * fast, hb = keys.brake && !t.trailer && Math.abs(car.v) > 2.5;
    if (keys.brake) car.v -= Math.sign(car.v) * Math.min(Math.abs(car.v), (hb ? 5 : rain > 0.3 && !owned.has('tyres') ? 9 : 16) * dt);
    else if (keys.up) car.v += (car.v < 0 ? 14 : 6.5 * fast) * dt;
    else if (keys.down) car.v -= (car.v > 0 ? 14 : 4.5) * dt;
    else car.v -= Math.sign(car.v) * Math.min(Math.abs(car.v), (onRoad ? 2.6 : 5) * dt);
    car.braking = keys.brake || (keys.down && car.v > 0.3) || (keys.up && car.v < -0.3);
    car.reversing = car.v < -0.2;
    car.v = clamp(car.v, -3.6, vmax);
    if (!onRoad && Math.abs(car.v) > 4.5) car.v *= 0.96;

    const steerMax = 0.62 / (1 + (car.v * car.v) / 70);
    const want = ((keys.right ? 1 : 0) - (keys.left ? 1 : 0)) * steerMax;
    car.steer += clamp(want - car.steer, -2.8 * dt, 2.8 * dt);

    const sub = 3, h = dt / sub;
    for (let i = 0; i < sub; i++) {
      const px = car.x, py = car.y, pth = car.th, pph = car.ph, pvh = car.vh === undefined ? car.th : car.vh;
      const dth = (car.v / t.wb) * Math.tan(car.steer) * h * (hb ? 2.6 : 1);
      car.th = wrap(car.th + dth);
      // the direction of travel follows the nose; on the handbrake it lags a long way behind
      car.vh = t.trailer ? car.th : wrap(pvh + wrap(car.th - pvh) * (1 - Math.exp(-h * (hb ? 1.4 : rain > 0.3 && !owned.has('tyres') ? 5 : 22))));
      car.x += Math.cos(car.vh) * car.v * h; car.y += Math.sin(car.vh) * car.v * h;
      if (t.trailer) {
        const d = car.th - car.ph, tr = t.trailer;
        car.ph = wrap(car.ph + (car.v * h / tr.axle) * Math.sin(d) - (tr.hitch / tr.axle) * dth * Math.cos(d));
        if (Math.abs(wrap(car.th - car.ph)) > 1.2) {     // jackknifed: refuse the move
          car.x = px; car.y = py; car.th = pth; car.ph = pph; car.vh = pvh; car.v = 0;
          if (clock - lastNote > 3) { toast(L.jackknife); lastNote = clock; }
          break;
        }
      }
      if (blocked(car)) {
        car.x = px; car.y = py; car.th = pth; car.ph = pph; car.vh = pvh;
        if (Math.abs(v0) > 1.2 && bumpCool <= 0) {
          const cost = Math.round(10 + Math.abs(v0) * 4);
          bumpCool = 0.5; shake = reduceMotion ? 0 : Math.min(1, Math.abs(v0) / 6);
          if (boost.shield) { boost.shield--; sfx.bump(Math.abs(v0)); pop(car.x, car.y, L.shielded, '#b98ce0', 26); }
          else { trouble(0.7); bumps++; damage += cost; stats.bumps++; streak = 0; sfx.bump(Math.abs(v0)); pop(car.x, car.y, `−${cost}`, '#e2553d', 26); toast(L.bump(cost), 1100); hud(); }
        }
        car.v = -car.v * 0.25;
        break;
      }
    }
    if (hb && Math.abs(wrap(car.th - car.vh)) > 0.4) lastDrift = clock;
    if (hb && driftCool <= 0 && Math.abs(wrap(car.th - car.vh)) > 0.55) { driftCool = 2.5; total += 10; pop(car.x, car.y, `${L.drift} +10`, '#f6f1df', 22); hud(); }
    const wp = wheelPoints(car);   // braking hard from speed leaves rubber behind
    if (car._w && car.braking && Math.abs(v0) > 3.5) for (let i = 0; i < wp.length; i++) skids.push({ a: car._w[i], b: wp[i], t: clock });
    if (skids.length > 1500) skids.splice(0, skids.length - 1500);
    car._w = wp;
    if (!reduceMotion && Math.abs(car.v) > 3 && Math.random() < 0.6) {   // gravel dust off the rear wheels
      const w = wp[(Math.random() * 2) | 0], k = -Math.sign(car.v);
      bits.push({ x: w[0], y: w[1], z: 0.2, vx: Math.cos(car.th) * k * 1.5 + (Math.random() - 0.5) * 2, vy: Math.sin(car.th) * k * 1.5 + (Math.random() - 0.5) * 2, vz: 1.2, c: 'rgba(214,198,160,0.55)', life: 0.45, s: 5 });
    }
    bumpCool -= dt; shake = Math.max(0, shake - dt * 3);

    // Parked when the living part sits inside the pitch and has stopped for a moment.
    const p = target, r = livingRect(car);
    // A car and caravan is longer than a pitch is deep and hard to get square, so the caravan only has to have
    // its middle on the pitch: once it stops, the car unhitches and the caravan is pushed the rest of the way.
    const lane = car.t.trailer ? 1.5 : 0.15, top = p.laneBelow ? 0.15 : lane, bottom = p.laneBelow ? lane : 0.15;
    const inside = car.t.trailer
      ? r.cx > p.x + 0.9 && r.cx < p.x + p.w - 0.9 && r.cy > p.y - top && r.cy < p.y + p.d + bottom
      : corners(r).every((c) => c.x > p.x - 0.15 && c.x < p.x + p.w + 0.15 && c.y > p.y - top && c.y < p.y + p.d + bottom);
    holdT = inside && Math.abs(car.v) < 0.3 ? holdT + dt : 0;
    if (holdT > 0.6) return arrived();

    if (boost.freeze <= 0 && !chill) patience -= dt;
    const bar = $('hud-patience');
    bar.style.transform = `scaleX(${clamp(patience / patienceMax, 0, 1)})`;
    bar.classList.toggle('low', patience < 10);
    if (patience <= 0) {   // one guest let down; the third ends the shift
      stats.gaveUp++; lives--; streak = 0; car = null; sfx.lost();
      if (lives <= 0) gameOver(); else { toast(L.gaveUp, 2400); boss('gaveUp'); setTimeout(() => { if (mode === 'play' && !car) nextGuest(); }, 1600); }
      hud();
    }
  }

  function gameOver() {
    mode = 'over'; target = null; sfx.over(); banner(L.bOver);
    if (!chill) { bank += Math.max(0, score()); saveShop(); keepRun(score()); }
    setTimeout(() => openCard(true), 1100);
  }

  function arrived(forced) {
    // Points: up to 100 for accuracy (centred on the pitch and square to it) and up to 100 for speed (patience left).
    const r = livingRect(car), p = target, towing = !!car.t.trailer;
    const dx = Math.abs(r.cx - (p.x + p.w / 2)) / 1.5, dy = Math.abs(r.cy - (p.y + p.d / 2)) / 2.5, skew = Math.abs(Math.cos(r.a)) / 0.3;
    const fit = towing ? 0.55 * (1 - clamp(dx, 0, 1)) + 0.45 * (1 - clamp(skew, 0, 1))   // a caravan is pushed in the last metre, so depth does not count
      : 0.45 * (1 - clamp(dx, 0, 1)) + 0.2 * (1 - clamp(dy, 0, 1)) + 0.35 * (1 - clamp(skew, 0, 1));
    const accuracy = forced === true ? 100 : Math.round(100 * fit), speed = chill ? 50 : Math.round(100 * clamp(patience / patienceMax, 0, 1));
    car.v = 0; car.steer = 0; car.braking = false; car.reversing = false;
    let stay = car;
    if (towing) {   // the caravan stays; its car unhitches and heads into town
      stay = makeVehicle('caravan', 0, 0, car.ph);
      stay.paint = car.paint; stay.side = car.side;
      const off = stay.t.L / 2 - stay.t.rear, th = Math.sin(car.ph) >= 0 ? Math.PI / 2 : -Math.PI / 2;
      stay.x = r.cx - Math.cos(car.ph) * off; stay.y = r.cy - Math.sin(car.ph) * off;
      stay.slide = { x: p.x + p.w / 2 - Math.cos(th) * off, y: p.y + p.d / 2 - Math.sin(th) * off, th };
      const tow = makeVehicle('car', car.x, car.y, car.th);
      tow.paint = car.paint; tow.extra = car.extra;
      ghosts.push(tow);
    }
    stay.parked = { pitch: target, t: clock + (towing ? 1 : 0) };
    // Clean parkings in a row multiply the points: x1, x1.25 ... up to x3. A bump or a crooked parking starts again.
    const clean = bumps === 0 && accuracy >= 60, perfect = clean && accuracy >= 90;
    streak = clean ? streak + 1 : 0;
    const mult = 1 + Math.min(Math.max(streak - 1, 0), 8) * 0.25, dark = night > 0.6, pts = Math.round((accuracy + speed) * mult * (car.vip ? 2 : 1) * (dark ? 1.25 : 1) * (boost.double ? 2 : 1) * (rain > 0.3 ? 1.2 : 1) * (respect[car.kind] >= 3 ? 1.25 : 1) * (car.rush ? 2 : 1)) + (perfect ? 50 : 0);
    if (respect[car.kind] >= 3) pop(r.cx, r.cy, L.clubBonus, '#8fd18a', 20, 152);
    regard(car.kind, clean ? 1 : -1);
    if (boost.double) boost.double--;
    const quick = chill ? '' : speed >= 85 ? L.quick : speed <= 12 ? L.close2 : '';   // very fast, or at the last second: a little extra
    if (quick) { total += 30; pop(r.cx, r.cy, `${quick} +30`, '#f6f1df', 22, dark ? 100 : 74); }
    if (clean && clock - lastDrift < 4) { total += 50; pop(r.cx, r.cy, `${L.driftPark} +50`, '#f6f1df', 22, quick ? 126 : 100); award('driftpark'); }
    total += pts; stats.streak = Math.max(stats.streak, streak); if (perfect) stats.perfect++;
    pop(r.cx, r.cy, `+${pts}`, '#f4c531', 40);
    if (perfect) { pop(r.cx, r.cy, L.perfect, '#f6f1df', 26, 40); confetti(r.cx, r.cy); remark(L.nice, r.cx, r.cy); }
    else if (mult > 1 || car.vip) pop(r.cx, r.cy, `×${mult * (car.vip ? 2 : 1)}`, '#f6f1df', 26, 40);
    if (dark) pop(r.cx, r.cy, L.nightBonus, '#6fb6d9', 22, 74); else if (rain > 0.3) pop(r.cx, r.cy, L.rainBonus, '#6fb6d9', 22, 74);
    sfx.park(streak, perfect);
    if (clean) { heat = Math.max(0, heat - 0.5); heatStars(); }
    if (streak === 9) banner(L.bMax); else if (streak === 5) { banner(L.bRoll); boss('roll'); } else if (perfect) banner(L.bPerfect);
    const vip = car.vip;
    let back = false;
    if (clean && streak % 5 === 0 && lives < maxLives()) { lives++; back = true; setTimeout(() => sfx.life(), 600); }
    stay.points = pts; stay.stay = 150 + Math.random() * 170;
    target.guest = stay; guests.push(stay);
    parkedCount++; stats.acc += accuracy; stats.spd += speed; stats.top = Math.max(stats.top, stay.points);
    parkBadges({ clean, perfect, towing, vip, night: dark });
    toast(back ? L.lifeBack : L.parked(pts, accuracy, speed, mult), back ? 2600 : 2000);
    car = null;
    setTimeout(() => { if (mode === 'play' && !car) nextGuest(); }, 1300);
    hud();
  }

  // ---------- families ----------
  // Every guest brings a family: adults who stroll to the wash house, the pond or the fire, children who run
  // about on the lane in front of their pitch, and sometimes a dog or a cat. They turn in when it gets dark.
  // People keep to the lanes: a walk is a short list of points along the verge, across a road and along again.
  const people = [];
  const SHIRTS = ['#d5503c', '#3f7fa6', '#f0b83a', '#f6f1df', '#8b6fae', '#2f5d49', '#e58a5a', '#5aa9a3'];
  const HAIR = ['#2b2018', '#5a3a22', '#c9a35a', '#8a8a86', '#101010', '#a5532a'];
  const FUR = ['#6e4a2c', '#e9e2d0', '#22201e', '#c98f4a'];
  const LANE_BAND = [[20.6, 27.4], [50.6, 57.4]];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];

  // Where a family sits: beside their vehicle, on the awning side. `ly` is the verge they walk along, `lane`
  // which lane that is (0 upper, 1 lower, 2 the meadow).
  function homeOf(g) {
    const p = g.parked.pitch, a = g.slide ? g.slide.th : livingRect(g).a;
    const sgn = Math.sign(-Math.sin(a) * g.side) || 1;
    return { x: p.x + p.w / 2 + sgn * 2.5, y: p.y + p.d / 2 + rand(-1.5, 1.5), ly: p.laneBelow ? p.y + p.d + 1.2 : p.y - 1.2, lane: p.y < 39 ? 0 : 1 };
  }
  function placeTo(kind) {
    if (kind === 'wc') return { x: rand(20, 26), y: 19.4, ly: 21, lane: 0 };
    if (kind === 'pond') return { x: rand(88, 101), y: 19.7, ly: 21, lane: 0 };
    if (kind === 'fire') { const a = rand(0, TAU); return { x: fire.x + Math.cos(a) * 2.5, y: fire.y + Math.sin(a) * 2.5, ly: 70.6, lane: 2 }; }
    if (kind === 'reception') return { x: 65.6, y: rand(73, 78), ly: 70.6, lane: 2 };
    let x; do { x = rand(10, 110); } while (x > 55 && x < 81);   // somewhere on the meadow, clear of the road and reception
    return { x, y: rand(71.5, 84), ly: 70.6, lane: 2 };
  }
  function routeTo(o, to) {
    const at = o.at, pts = [[at.x, at.ly]];
    if (at.lane !== to.lane) {   // change lanes along one of the three roads that join them
      const cost = (c) => Math.abs(at.x - c) + Math.abs(to.x - c);
      const ways = at.lane === 2 || to.lane === 2 ? [57, 63] : [11.5, 57, 63, 108.5];
      const cx = ways.reduce((b, c) => (cost(c) < cost(b) ? c : b)) + rand(-0.6, 0.6);
      pts.push([cx, at.ly], [cx, to.ly]);
    }
    pts.push([to.x, to.ly], [to.x, to.y]);
    o.path = pts; o.dest = to; o.wait = 0;
  }

  function spawnFamily(g) {
    g.family = true;
    const home = homeOf(g);
    const mk = (kind) => {
      const kid = kind === 'kid';
      const o = {
        kind, g, home, at: home, dest: null, path: [], x: home.x + rand(-0.6, 0.6), y: home.y + rand(-0.6, 0.6), dir: rand(0, TAU),
        wait: rand(0.5, kid ? 3 : 14), hidden: false, cool: 0, flee: 0, phase: rand(0, 6),
        size: kid ? rand(0.6, 0.75) : 1, speed: kid ? rand(2.4, 3.4) : kind === 'adult' ? rand(1.1, 1.5) : 3.2,
        shirt: pick(SHIRTS), hair: pick(kind === 'pet' ? FUR : HAIR), owl: Math.random() < 0.25, cat: false, owner: null, off: [0.8, 0.5],
      };
      people.push(o); return o;
    };
    const adults = [mk('adult')], kids = [];
    if (Math.random() < 0.5) adults.push(mk('adult'));
    const nk = Math.random() < 0.55 ? 0 : Math.random() < 0.8 ? 1 : 2;
    for (let i = 0; i < nk; i++) kids.push(mk('kid'));
    if (Math.random() < 0.25) { const pet = mk('pet'); pet.cat = Math.random() < 0.3; pet.owner = pick(kids.length ? kids : adults); }
  }
  function dismissFamily(g) { for (let i = people.length - 1; i >= 0; i--) if (people[i].g === g) people.splice(i, 1); }

  // Children go in first, most adults a little later, a few night owls last. A family that is leaving is called in too.
  const bedtime = (o) => o.g.packing || night > (o.kind === 'kid' ? 0.3 : o.owl ? 0.85 : 0.55);

  // What someone does next. Children mostly dart about in front of their own pitch and change their mind often.
  function decide(o) {
    const kid = o.kind === 'kid', atHome = o.at === o.home;
    if (bedtime(o)) {
      if (atHome) { o.hidden = true; return; }
      return routeTo(o, o.home);
    }
    const dusk = night > 0.15;
    if (kid) {
      const roll = Math.random();
      if (roll < 0.3) {
        const band = LANE_BAND[o.home.lane], y = rand(band[0], band[1]);
        return routeTo(o, { x: clamp(o.home.x + rand(-10, 10), 9.5, 110.5), y, ly: y, lane: o.home.lane });
      }
      if (roll < 0.45) return routeTo(o, atHome ? placeTo(pick(['pond', 'fire', 'meadow', 'meadow', 'wc'])) : o.home);
      o.wait = rand(2, 9); return;
    }
    if (atHome) {
      if (Math.random() < (dusk ? 0.2 : 0.35)) return routeTo(o, placeTo(dusk && o.owl ? 'fire' : pick(['wc', 'wc', 'pond', 'fire', 'reception', 'meadow'])));
      o.wait = rand(15, 50); return;
    }
    routeTo(o, Math.random() < 0.75 ? o.home : placeTo(pick(['pond', 'fire', 'meadow'])));
  }

  // The car ran into someone, or nearly: it stops dead, they jump clear, and it costs points.
  function startle(o) {
    const safe = boost.shield > 0;
    if (safe) { boost.shield--; pop(o.x, o.y, L.shielded, '#b98ce0', 26); } else { regard(car.kind, -1); trouble(1.2); damage += 60; stats.scares++; streak = 0; pop(o.x, o.y, '−60', '#e2553d', 26); }
    sfx.startle(); say(o, pick(L.ouch)); o.cool = 2.5; o.flee = 1.2; o.wait = 0;
    car.v = 0; shake = reduceMotion ? 0 : 0.6;
    const a = Math.atan2(o.y - car.y, o.x - car.x);
    o.path.unshift([o.x + Math.cos(a) * 2.5, o.y + Math.sin(a) * 2.5]);
    if (!safe && Math.random() < 0.5) boss('scare');
    if (!safe) toast(L.careful(L.who[o.kind === 'pet' ? (o.cat ? 'cat' : 'dog') : o.kind]), 1800);
    hud();
  }

  function stepPeople(dt) {
    const moving = car && Math.abs(car.v) > 0.6, rects = car ? rectsOf(car) : [];
    for (const o of people) {
      o.cool -= dt; o.flee -= dt;
      if (o.kind === 'pet') {   // a dog trots around its owner, a cat prowls around the pitch
        const base = o.cat ? o.home : o.owner;
        o.hidden = o.cat ? false : o.owner.hidden;
        if (o.hidden) { o.x = base.x; o.y = base.y; continue; }
        o.wait -= dt;
        if (o.wait <= 0) { const a = rand(0, TAU), d = rand(0.6, o.cat ? 3 : 2.5); o.off = [Math.cos(a) * d, Math.sin(a) * d]; o.wait = o.cat ? rand(3, 12) : rand(0.8, 4); }
        const dx = base.x + o.off[0] - o.x, dy = base.y + o.off[1] - o.y, d = Math.hypot(dx, dy);
        if (d > 0.15) { const sp = Math.min(o.cat ? 1.2 : o.speed, d * 2.5) * (o.flee > 0 ? 2 : 1); o.x += (dx / d) * sp * dt; o.y += (dy / d) * sp * dt; o.dir = Math.atan2(dy, dx); o.phase += dt * sp * 5; }
      } else if (o.hidden) {
        if (!o.g.packing && night < 0.2 && Math.random() < dt / 6) { o.hidden = false; o.wait = rand(1, 10); }   // morning
        continue;
      } else if (o.wait > 0) {
        o.wait -= dt;
        if (o.wait > 3 && bedtime(o)) o.wait = rand(0.5, 3);   // no lingering once it is time to go in
        if (o.wait <= 0) decide(o);
      } else if (!o.path.length) decide(o);
      else {
        const [tx, ty] = o.path[0], dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy);
        let sp = o.speed * (o.flee > 0 ? 1.8 : 1);
        if (moving && o.kind === 'adult' && o.flee <= 0) {   // grown-ups look before they cross; children do not
          const cx = o.x - car.x, cy = o.y - car.y, cd = Math.hypot(cx, cy), fx = Math.cos(car.th) * Math.sign(car.v), fy = Math.sin(car.th) * Math.sign(car.v);
          const ahead = cx * fx + cy * fy, side = Math.abs(cx * fy - cy * fx);
          if (cd < 11 && ahead > 0) sp = side > 1.8 && side < 4.5 ? 0 : side <= 1.8 ? sp * 1.7 : sp;
        }
        if (sp > 0) {
          if (d < sp * dt + 0.05) {
            o.x = tx; o.y = ty; o.path.shift();
            if (!o.path.length) { if (o.dest) o.at = o.dest; o.wait = o.kind === 'kid' ? rand(1, 6) : o.at === o.home ? rand(12, 40) : rand(5, 18); }
          } else { o.x += (dx / d) * sp * dt; o.y += (dy / d) * sp * dt; o.dir = Math.atan2(dy, dx); o.phase += dt * sp * 4; }
        }
      }
      if (!car || o.hidden || Math.abs(o.x - car.x) > 14 || Math.abs(o.y - car.y) > 14) continue;
      for (const r of rects) {
        if (!rectCircle(r, o.x, o.y, 0.4)) continue;
        const c = Math.cos(r.a), s = Math.sin(r.a), u = (o.x - r.cx) * c + (o.y - r.cy) * s, w = -(o.x - r.cx) * s + (o.y - r.cy) * c;
        // It only counts as running someone over if the end that is leading caught them. Someone who walks into
        // the side, or was already against it when the vehicle set off, just steps clear.
        if (moving && o.cool <= 0 && clock - car.born > 2 && u * Math.sign(car.v) > r.hl - 0.35) { startle(o); break; }
        const push = (w < 0 ? -1 : 1) * (r.hw + 0.45) - w;
        o.x += -s * push; o.y += c * push;
        if (o.path.length && o.kind !== 'pet' && !(o.detour > clock)) {   // and walks round the nearer end instead of leaning on the bodywork
          const tx = o.path[0][0] - r.cx, ty = o.path[0][1] - r.cy, tu = tx * c + ty * s, tw = -tx * s + ty * c, side = w < 0 ? -1 : 1;
          if (tw * side < r.hw + 0.5) {   // where they are going is on the far side
            const U = (u + tu < 0 ? -1 : 1) * (r.hl + 1), W = side * (r.hw + 1), at = (U, W) => [r.cx + c * U - s * W, r.cy + s * U + c * W];
            o.path.unshift(at(U, W), at(U, -W)); o.detour = clock + 4;
          }
        }
      }
    }
  }

  function drawPeople() {
    for (const o of people) {
      if (o.hidden) continue;
      const [gx, gy] = P(o.x, o.y);
      if (gx < -30 || gx > vw + 30 || gy < -30 || gy > vh + 30) continue;
      const u = cam.s * o.size * 1.7, walking   // drawn larger than life, or nobody would see them
      = o.wait <= 0 || o.kind === 'pet', sw = walking ? Math.sin(o.phase) : 0;
      ctx.fillStyle = 'rgba(15,30,20,0.25)'; ctx.beginPath(); ctx.arc(gx + cam.s * 0.18, gy + cam.s * 0.18, u * 0.24, 0, TAU); ctx.fill();
      ctx.save();
      if (o.kind === 'pet') {
        const k = cam.s * (o.cat ? 1.1 : 1.6);
        ctx.translate(...P(o.x, o.y, 0.3)); ctx.rotate(o.dir);
        ctx.strokeStyle = o.hair; ctx.lineWidth = k * 0.07; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-k * 0.3, 0); ctx.lineTo(-k * 0.5, k * 0.12 * sw); ctx.stroke();                      // tail
        ctx.fillStyle = o.hair; ctx.beginPath(); ctx.ellipse(0, 0, k * 0.32, k * 0.13, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = shade(o.hair, 0.8); ctx.beginPath(); ctx.arc(k * 0.34, 0, k * 0.13, 0, TAU); ctx.fill();
      } else {
        ctx.translate(gx, gy); ctx.rotate(o.dir);
        ctx.fillStyle = '#2c2f36';                                                                                          // feet
        ctx.beginPath(); ctx.ellipse(u * 0.14 * sw, -u * 0.1, u * 0.11, u * 0.07, 0, 0, TAU); ctx.ellipse(-u * 0.14 * sw, u * 0.1, u * 0.11, u * 0.07, 0, 0, TAU); ctx.fill();
        ctx.restore(); ctx.save();
        ctx.translate(...P(o.x, o.y, 0.5 * o.size)); ctx.rotate(o.dir);
        ctx.fillStyle = o.shirt; ctx.beginPath(); ctx.ellipse(0, 0, u * 0.15, u * 0.27, 0, 0, TAU); ctx.fill();            // shoulders
        ctx.restore(); ctx.save();
        ctx.translate(...P(o.x, o.y, 0.9 * o.size));
        ctx.fillStyle = o.hair; ctx.beginPath(); ctx.arc(0, 0, u * 0.13, 0, TAU); ctx.fill();                              // head
      }
      ctx.restore();
    }
  }

  // ---------- driving off ----------
  // A guest who has packed up drives out by the gate under its own steam: campervans and motorhomes reverse off
  // the pitch and swing round, a caravan is turned on the spot and its car comes back for it. They keep to the
  // right, stop for the player, for people and for each other, and are not checked against anything else.
  function startLeaving(g) {
    const p = g.parked.pitch, ls = p.laneBelow ? 1 : -1, cx = p.x + p.w / 2, dir = cx < 58 ? 1 : -1;
    const yl = (p.y < 39 ? 20 : 50) + (dir > 0 ? 6 : 2);
    if (g.kind === 'caravan') {
      const b = bodyRect(g), th = ls * Math.PI / 2, reach = b.hl + TYPES.combo.trailer.bar + TYPES.combo.trailer.hitch + TYPES.car.L / 2 - TYPES.car.rear;
      const spot = { cx: b.cx + Math.cos(th) * reach, cy: b.cy + Math.sin(th) * reach, hl: TYPES.car.L / 2 + 1.5, hw: TYPES.car.Wd / 2 + 0.4, a: th };
      if ([...guests.filter((o) => o.leave), ...(car ? [car] : [])].some((o) => rectsOf(o).some((q) => rectRect(spot, q)))) return;   // try again next frame
    }
    g.leaving = true; g.slide = null; g.v = 0; g.steer = 0;
    dismissFamily(g);
    g.leave = {
      phase: 'back', ls, edge: p.laneBelow ? p.y + p.d : p.y, head: dir > 0 ? 0 : Math.PI, start: clock, n: p.n, age: 0, stuck: 0, hold: 0, i: 0,
      pts: [[dir > 0 ? 54.5 : 62.5, yl], [58.1, yl + (dir > 0 ? 4.5 : 5.5)], [58.1, H + 20]],
    };
    if (g.kind === 'caravan') {   // by now it has been turned to face the lane; hitch the car on in front
      const b = bodyRect(g), th = ls * Math.PI / 2, reach = b.hl + TYPES.combo.trailer.bar + TYPES.combo.trailer.hitch;
      g.kind = 'combo'; g.t = TYPES.combo; g.th = th; g.ph = th;
      g.x = b.cx + Math.cos(th) * reach; g.y = b.cy + Math.sin(th) * reach;
      g.hitched = clock; g.leave.hold = 1.4; g.leave.phase = 'go';
    } else if (Math.sin(g.th) * ls > 0.3) g.leave.phase = 'go';   // parked facing the lane already
  }

  function stepLeaver(g, dt) {
    const L = g.leave, t = g.t;
    L.age += dt; L.hold -= dt;
    if (L.age > 90 || L.stuck > 20) {   // hopelessly boxed in: give up and vanish
      g.alpha -= dt / 1.4;
      return g.alpha <= 0;
    }
    const others = guests.filter((o) => o !== g && o.leave);
    let want = 0, steer = 0;
    L.wait = null;
    if (L.phase === 'back') {
      want = -2.2;
      if ((g.y - L.edge) * L.ls > 1.2) {   // rear axle is out on the lane: swing the nose round
        const e = wrap(L.head - g.th);
        if (Math.abs(e) < 0.1) L.phase = 'go'; else steer = -Math.sign(e) * 0.6;
      }
    }
    if (L.phase === 'go') {
      const fx = g.x + Math.cos(g.th) * t.wb, fy = g.y + Math.sin(g.th) * t.wb;
      if (L.i < L.pts.length - 1 && Math.hypot(L.pts[L.i][0] - fx, L.pts[L.i][1] - fy) < 3) L.i++;
      const last = L.i === L.pts.length - 1, tx = L.pts[L.i][0], ty = last ? fy + 5 : L.pts[L.i][1];   // on the way out, hold the right-hand line rather than drift towards the gate
      steer = clamp(wrap(Math.atan2(ty - fy, tx - fx) - g.th) * 1.6, -0.6, 0.6);
      want = 4.6 * (1 - 0.55 * Math.abs(steer) / 0.6);
    }
    if (L.hold > 0) want = 0;
    if (want) {   // look where it is about to go, and wait if someone is there
      const b = bodyRect(g), sg = Math.sign(want), c = Math.cos(g.th) * sg, s = Math.sin(g.th) * sg;
      const probe = { cx: b.cx + c * 2.6, cy: b.cy + s * 2.6, hl: b.hl, hw: b.hw + 0.25, a: b.a };
      const px = b.cx + c * (b.hl + 1.6), py = b.cy + s * (b.hl + 1.6);
      // Give way to any other leaver in front. If two are in each other's way, the one already rolling along
      // the lane goes first, or else the one that set off first (lower pitch number on a tie).
      const first = (a, b) => (a.phase === 'go') !== (b.phase === 'go') ? a.phase === 'go' : a.start !== b.start ? a.start < b.start : a.n < b.n;
      L.wait = others.find((o) => rectsOf(o).some((q) => rectRect(probe, q)) && !(o.leave.wait === g && first(L, o.leave))) || null;
      const inWay = L.wait || (car && rectsOf(car).some((q) => rectRect(probe, q))) ||
        people.some((o) => !o.hidden && Math.hypot(o.x - px, o.y - py) < 2.2);
      if (inWay) { want = 0; L.stuck += dt; } else L.stuck = Math.max(0, L.stuck - dt);
    }
    const dv = want - g.v, rate = Math.abs(want) < Math.abs(g.v) ? 9 : 3;
    g.v += clamp(dv, -rate * dt, rate * dt);
    g.steer += clamp(steer - g.steer, -2.5 * dt, 2.5 * dt);
    const solid = car ? [...others, car] : others, touches = (o) => rectsOf(g).some((r) => rectsOf(o).some((q) => rectRect(r, q)));
    const was = solid.filter(touches), ox = g.x, oy = g.y, oth = g.th, oph = g.ph;
    const dth = (g.v / t.wb) * Math.tan(g.steer) * dt;
    g.th = wrap(g.th + dth);
    g.x += Math.cos(g.th) * g.v * dt; g.y += Math.sin(g.th) * g.v * dt;
    if (t.trailer) { const d = g.th - g.ph, tr = t.trailer; g.ph = wrap(g.ph + (g.v * dt / tr.axle) * Math.sin(d) - (tr.hitch / tr.axle) * dth * Math.cos(d)); }
    if (solid.some((o) => !was.includes(o) && touches(o))) {   // that step would run into someone: stay put
      g.x = ox; g.y = oy; g.th = oth; g.ph = oph; g.v = 0; L.stuck += dt;
    }
    if (g.parked.pitch.guest === g && L.phase === 'go' && L.hold <= 0) g.parked.pitch.guest = null;   // the pitch is free once they are rolling
    return g.y > H + 14;   // out through the gate and gone
  }

  // ---------- skid marks ----------
  const skids = [];
  function wheelPoints(v) {
    const c = Math.cos(v.th), s = Math.sin(v.th), hw = v.t.Wd / 2 - 0.2, out = [];
    for (const l of [0, v.t.wb]) for (const w of [-hw, hw]) out.push([v.x + c * l - s * w, v.y + s * l + c * w]);
    if (v.t.trailer) {
      const tr = v.t.trailer, hp = hitchPoint(v), pc = Math.cos(v.ph), ps = Math.sin(v.ph), tw = tr.Wd / 2 - 0.15;
      for (const w of [-tw, tw]) out.push([hp.x - pc * tr.axle - ps * w, hp.y - ps * tr.axle + pc * w]);
    }
    return out;
  }
  function drawSkids() {
    while (skids.length && clock - skids[0].t > 90) skids.shift();
    ctx.strokeStyle = '#2b251d'; ctx.lineWidth = Math.max(1.5, cam.s * 0.2); ctx.lineCap = 'butt';
    for (const k of skids) {
      ctx.globalAlpha = 0.6 * (1 - (clock - k.t) / 90);
      ctx.beginPath(); ctx.moveTo(...P(k.a[0], k.a[1])); ctx.lineTo(...P(k.b[0], k.b[1])); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- camera and projection ----------
  let vw = 0, vh = 0, dpr = 1;
  const cam = { x: 60, y: 60, s: 14, zoom: 1 };
  const LEAN = 0.028;   // how far a point one metre up is pushed from the centre
  const P = (x, y, z = 0) => { const k = cam.s * (1 + z * LEAN); return [(x - cam.x) * k + vw / 2, (y - cam.y) * k + vh / 2]; };

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  }
  addEventListener('resize', resize); resize();

  function updateCamera(dt) {
    const base = clamp(Math.min(vw, vh) / 38, 9.5, 26);
    let tx, ty, tz;
    if (mode === 'play' && car) {
      const look = clamp(car.v, -3, 10) * 0.75;
      tx = car.x + Math.cos(car.th) * look; ty = car.y + Math.sin(car.th) * look;
      tz = 1 - 0.24 * Math.min(1, Math.abs(car.v) / 10);
    } else if (mode === 'play') {      // between guests: glide back to the gate
      tx = 60; ty = 78; tz = 0.92;
    } else {                           // attract: a slow drift over the camp
      const a = reduceMotion ? 0.6 : clock * 0.06;
      tx = 60 + Math.cos(a) * 26; ty = 44 + Math.sin(a * 1.3) * 16; tz = 0.86;
    }
    const k = 1 - Math.exp(-dt * 3.2);
    cam.x = lerp(cam.x, tx, k); cam.y = lerp(cam.y, ty, k);
    cam.zoom = lerp(cam.zoom, tz, 1 - Math.exp(-dt * 1.6));
    cam.s = base * cam.zoom;
    const hx = vw / 2 / cam.s, hy = vh / 2 / cam.s;
    cam.x = hx * 2 >= W ? W / 2 : clamp(cam.x, hx, W - hx);
    cam.y = hy * 2 >= H ? H / 2 : clamp(cam.y, hy, H - hy);
  }

  // ---------- ground, painted once ----------
  const GPX = 12;
  const ground = document.createElement('canvas');
  ground.width = W * GPX; ground.height = H * GPX;
  function paintGround() {
    const g = ground.getContext('2d');
    let s = 77; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    g.setTransform(GPX, 0, 0, GPX, 0, 0);
    g.fillStyle = '#6a9447'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = r() < 0.5 ? 'rgba(118,160,78,0.35)' : 'rgba(78,118,56,0.3)';
      g.beginPath(); g.ellipse(r() * W, r() * H, 1 + r() * 3.5, 0.8 + r() * 2.5, r() * 3, 0, TAU); g.fill();
    }
    g.fillStyle = '#4c7a3e'; g.fillRect(0, CAMP_BOTTOM, W, H - CAMP_BOTTOM);          // outside the fence
    for (let i = 0; i < 260; i++) {                                                   // meadow flowers
      g.fillStyle = ['#f6e27a', '#ffffff', '#e59ac0'][(r() * 3) | 0];
      g.beginPath(); g.arc(6 + r() * 108, 70 + r() * 15, 0.12, 0, TAU); g.fill();
    }
    // pitches
    for (const p of pitches) {
      g.fillStyle = '#84ad55'; g.fillRect(p.x, p.y, p.w, p.d);
      g.fillStyle = 'rgba(255,255,255,0.07)';
      for (let x = p.x + 0.4; x < p.x + p.w; x += 1.6) g.fillRect(x, p.y, 0.8, p.d);
      g.strokeStyle = 'rgba(246,241,223,0.85)'; g.lineWidth = 0.14; g.setLineDash([0.7, 0.5]);
      g.strokeRect(p.x + 0.07, p.y + 0.07, p.w - 0.14, p.d - 0.14); g.setLineDash([]);
    }
    // roads: a darker shoulder, then gravel
    g.fillStyle = '#9d8f70'; for (const rd of roads) g.fillRect(rd.x - 0.25, rd.y - 0.25, rd.w + 0.5, rd.h + 0.5);
    g.fillStyle = '#cfc19f'; for (const rd of roads) g.fillRect(rd.x, rd.y, rd.w, rd.h);
    for (let i = 0; i < 9000; i++) {
      const rd = roads[(r() * roads.length) | 0];
      g.fillStyle = r() < 0.5 ? 'rgba(120,105,80,0.35)' : 'rgba(255,250,235,0.4)';
      g.fillRect(rd.x + r() * rd.w, rd.y + r() * rd.h, 0.12, 0.12);
    }
    g.fillStyle = 'rgba(90,78,58,0.16)';                                              // wheel tracks
    for (const [x, y, w, h] of [[58.2, 20, 0.7, 74], [61.1, 20, 0.7, 74], [8, 22.2, 104, 0.7], [8, 25.1, 104, 0.7], [8, 52.2, 104, 0.7], [8, 55.1, 104, 0.7]]) g.fillRect(x, y, w, h);
    // pitch number plates, on the lane side
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '800 1.15px Overpass, sans-serif';
    for (const p of pitches) {
      const cx = p.x + p.w / 2, cy = p.laneBelow ? p.y + p.d - 1.1 : p.y + 1.1;
      g.fillStyle = '#f4c531'; g.strokeStyle = '#12211a'; g.lineWidth = 0.14;
      g.beginPath(); g.roundRect(cx - 1.15, cy - 0.75, 2.3, 1.5, 0.3); g.fill(); g.stroke();
      g.fillStyle = '#12211a'; g.fillText(String(p.n), cx, cy + 0.08);
    }
    // pond
    g.fillStyle = '#d8c99a'; g.beginPath(); g.ellipse(pond.x, pond.y, pond.rx + 1, pond.ry + 1, 0, 0, TAU); g.fill();
    g.fillStyle = '#3b8cb0'; g.beginPath(); g.ellipse(pond.x, pond.y, pond.rx, pond.ry, 0, 0, TAU); g.fill();
    g.fillStyle = '#58a8c7'; g.beginPath(); g.ellipse(pond.x - 1.2, pond.y - 0.6, pond.rx * 0.7, pond.ry * 0.6, 0, 0, TAU); g.fill();
    g.fillStyle = '#7a5a3a'; g.fillRect(pond.x - 0.7, pond.y + pond.ry - 2.4, 1.4, 4.2);  // jetty
    // hedges
    for (const hd of hedges) {
      for (let x = hd.x; x < hd.x + hd.w; x += 0.55) {
        g.fillStyle = r() < 0.5 ? '#2f5a34' : '#3b6b3d';
        g.beginPath(); g.arc(x + 0.3, hd.y + hd.h / 2 + (r() - 0.5) * 0.25, 0.55, 0, TAU); g.fill();
      }
    }
    // fence along the bottom, open at the gate
    g.strokeStyle = '#5a452f'; g.lineWidth = 0.22;
    g.beginPath(); g.moveTo(1, CAMP_BOTTOM); g.lineTo(55, CAMP_BOTTOM); g.moveTo(65, CAMP_BOTTOM); g.lineTo(W - 1, CAMP_BOTTOM); g.stroke();
    for (let x = 2; x < W; x += 3) if (x < 55 || x > 65) { g.fillStyle = '#6b5338'; g.fillRect(x - 0.18, CAMP_BOTTOM - 0.3, 0.36, 0.6); }
    // fire circle
    g.fillStyle = '#b7a57e'; g.beginPath(); g.arc(fire.x, fire.y, 3.2, 0, TAU); g.fill();
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; g.fillStyle = '#8e8a82'; g.beginPath(); g.arc(fire.x + Math.cos(a) * 1.05, fire.y + Math.sin(a) * 1.05, 0.3, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.5; g.fillStyle = '#6e5137'; g.save(); g.translate(fire.x + Math.cos(a) * 2.4, fire.y + Math.sin(a) * 2.4); g.rotate(a + 1.57); g.fillRect(-0.9, -0.25, 1.8, 0.5); g.restore(); }
  }
  paintGround();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paintGround);

  // ---------- drawing ----------
  const poly = (pts, fill, stroke) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  const shade = (hex, f) => {
    const c = (v) => clamp(Math.round(v * f), 0, 255);
    if (hex[0] !== '#') { const m = hex.match(/\d+/g); return `rgb(${c(+m[0])},${c(+m[1])},${c(+m[2])})`; }   // already an rgb() string
    const n = parseInt(hex.slice(1), 16);
    return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
  };
  // A point given in a rectangle's own frame (l along its length, w across), at height z.
  const RP = (r, l, w, z) => { const c = Math.cos(r.a), s = Math.sin(r.a); return P(r.cx + c * l - s * w, r.cy + s * l + c * w, z); };
  const quad = (r, l0, l1, w0, w1, z) => [RP(r, l0, w0, z), RP(r, l1, w0, z), RP(r, l1, w1, z), RP(r, l0, w1, z)];

  function drawBox(r, z, wall, roof) {
    const base = quad(r, -r.hl, r.hl, -r.hw, r.hw, 0), top = quad(r, -r.hl, r.hl, -r.hw, r.hw, z);
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; poly([base[i], base[j], top[j], top[i]], shade(wall, 0.72 + 0.09 * i)); }
    poly(top, roof);
    return top;
  }

  // Each vehicle is a stack of extruded shapes drawn in its own frame (l along its length, w across).
  // A shape whose top outline is smaller than its base gets sloping sides, which is how windscreens show from above.
  const GLASS = '#26343d', SKYLIGHT = 'rgba(150,182,200,0.92)', SHELL = '#f3f0e6', SHELL_WALL = '#ddd8c9', TRIM = '#34383b';
  const HEAD = '#fff3c4', TAIL = '#a8281f', TAIL_ON = '#ff5a45', EDGE = 'rgba(18,33,26,0.22)';
  const SUN = [-0.55, -0.83];   // where the light comes from, for shading walls

  // Outline of a rounded rectangle, front-left corner first, going round by the right-hand side.
  function hull(l0, l1, hw, rf, rb = rf) {
    const pts = [];
    for (const [cl, cw, rad, a0] of [[l1 - rf, -hw + rf, rf, -Math.PI / 2], [l1 - rf, hw - rf, rf, 0], [l0 + rb, hw - rb, rb, Math.PI / 2], [l0 + rb, -hw + rb, rb, Math.PI]]) {
      for (let k = 0; k <= 3; k++) { const a = a0 + (k / 3) * Math.PI / 2; pts.push([cl + Math.cos(a) * rad, cw + Math.sin(a) * rad]); }
    }
    return pts;
  }
  const box = (l0, l1, w0, w1) => [[l1, Math.min(w0, w1)], [l1, Math.max(w0, w1)], [l0, Math.max(w0, w1)], [l0, Math.min(w0, w1)]];

  // Outline `lo` at height z0 rising to outline `hi` at z1. `wall` is a colour, or a function of the wall's
  // outward direction (nl forward, nw sideways) returning one. `top` may be left out when something sits on it.
  function solid(r, lo, z0, hi, z1, wall, top) {
    const c = Math.cos(r.a), s = Math.sin(r.a), n = lo.length;
    const A = lo.map(([l, w]) => RP(r, l, w, z0)), B = hi.map(([l, w]) => RP(r, l, w, z1));
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      let nl = lo[j][1] - lo[i][1], nw = lo[i][0] - lo[j][0];
      const len = Math.hypot(nl, nw);
      if (len < 1e-6) continue;
      nl /= len; nw /= len;
      const raw = typeof wall === 'function' ? wall(nl, nw) : wall;
      const col = raw === GLASS ? GLASS : shade(raw, 0.84 + 0.2 * ((c * nl - s * nw) * SUN[0] + (s * nl + c * nw) * SUN[1]));
      poly([A[i], A[j], B[j], B[i]], col, col);
    }
    if (top) poly(B, top, EDGE);
  }
  // A flat panel on the nose (end = 1) or the tail (end = -1), drawn only when that end faces away from the camera.
  function endPanel(r, end, w0, w1, z0, z1, col) {
    const c = Math.cos(r.a) * end, s = Math.sin(r.a) * end;
    if (c * (r.cx + c * r.hl - cam.x) + s * (r.cy + s * r.hl - cam.y) <= 0) return;
    const l = end * (r.hl + 0.01);
    poly([RP(r, l, w0, z0), RP(r, l, w1, z0), RP(r, l, w1, z1), RP(r, l, w0, z1)], col);
  }
  function wheel(r, l, w, turn = 0) {
    const c = Math.cos(r.a), s = Math.sin(r.a);
    const q = { cx: r.cx + c * l - s * w, cy: r.cy + s * l + c * w, hl: 0.36, hw: 0.14, a: r.a + turn };
    const o = box(-0.36, 0.36, -0.14, 0.14);
    solid(q, o, 0, o, 0.7, '#1b1d1f', '#2a2d30');
  }
  const tailOf = (v) => (v === car && car.reversing ? '#f4f4ee' : v === car && car.braking ? TAIL_ON : TAIL);
  const accentOf = (v) => (['#f2efe6', '#e6dcc4', '#c9d4da'].includes(v.paint) ? '#3f7fa6' : v.paint);
  function panel(r, l0, l1, w0, w1, z, lines) {   // a solar panel lying on a roof
    poly(quad(r, l0, l1, w0, w1, z), '#20324c', '#0f1b2c');
    ctx.strokeStyle = 'rgba(160,190,220,0.35)';
    for (let i = 1; i < lines; i++) { const l = lerp(l0, l1, i / lines); ctx.beginPath(); ctx.moveTo(...RP(r, l, w0, z)); ctx.lineTo(...RP(r, l, w1, z)); ctx.stroke(); }
  }
  function awningCase(r, v, l0, l1, z) {   // the rolled-up awning on the side it will open from
    const o = box(l0, l1, v.side * (r.hw - 0.17), v.side * (r.hw - 0.01));
    solid(r, o, z - 0.16, o, z + 0.04, TRIM, '#4a4f54');
  }

  function drawCar(b, v) {
    const hl = b.hl, hw = b.hw, p = v.paint;
    for (const w of [-1, 1]) { wheel(b, hl - 0.9, w * (hw - 0.1), v.steer); wheel(b, -hl + 0.9, w * (hw - 0.1)); }
    solid(b, hull(-hl, hl, hw, 0.5, 0.35), 0.28, hull(-hl + 0.04, hl - 0.06, hw - 0.05, 0.5, 0.35), 0.82, shade(p, 0.84), p);
    for (const w of [-1, 1]) {
      poly(quad(b, hl - 0.36, hl - 0.14, w * (hw - 0.62), w * (hw - 0.22), 0.83), HEAD);
      poly(quad(b, -hl + 0.08, -hl + 0.26, w * (hw - 0.62), w * (hw - 0.18), 0.83), tailOf(v));
      poly(quad(b, hl - 1.62, hl - 1.42, w * (hw - 0.04), w * (hw + 0.16), 0.9), shade(p, 0.6));       // mirrors
    }
    solid(b, hull(-hl + 0.5, hl - 1.3, hw - 0.1, 0.3), 0.82, hull(-hl + 1.0, hl - 2.0, hw - 0.24, 0.25), 1.42, GLASS, shade(p, 1.06));
    if (v.extra === 1) { const o = hull(-hl + 1.1, hl - 2.15, 0.4, 0.2); solid(b, o, 1.46, o, 1.8, '#2b2f33', '#3d4247'); }   // roof box
    const [tx, ty] = RP(b, -hl - 0.15, 0, 0.4);                                                        // tow ball
    ctx.fillStyle = TRIM; ctx.beginPath(); ctx.arc(tx, ty, cam.s * 0.1, 0, TAU); ctx.fill();
  }

  function drawVan(b, v) {
    const hl = b.hl, hw = b.hw, p = v.paint, up = v.extra === 2 ? SHELL : p;   // some are two-tone
    for (const w of [-1, 1]) { wheel(b, hl - 1.3, w * (hw - 0.1), v.steer); wheel(b, -hl + 1.0, w * (hw - 0.1)); }
    const low = hull(-hl, hl, hw, 0.4, 0.22);
    solid(b, low, 0.3, low, 1.15, shade(p, 0.86), p);
    for (const w of [-1, 1]) {
      endPanel(b, 1, w * 0.3, w * 0.62, 0.68, 0.95, HEAD);
      endPanel(b, -1, w * 0.56, w * 0.8, 0.6, 1.1, tailOf(v));
      poly(quad(b, hl - 1.2, hl - 1.0, w * (hw - 0.03), w * (hw + 0.2), 1.2), TRIM);                   // mirrors
    }
    solid(b, hull(-hl + 0.03, hl - 0.9, hw - 0.03, 0.3, 0.2), 1.15, hull(-hl + 0.12, hl - 1.7, hw - 0.14, 0.3, 0.2), 2.05,
      (nl) => (Math.abs(nl) > 0.5 ? GLASS : up), up);
    const pop = hull(-hl + 0.4, hl - 1.95, hw - 0.3, 0.25);                                            // pop-top roof
    solid(b, pop, 2.05, pop, 2.3, shade(up, 0.8), shade(up, 1.05));
    poly(quad(b, 0.0, 0.7, -0.4, 0.4, 2.31), SKYLIGHT, EDGE);
    if (v.extra === 1) panel(b, -hl + 0.7, -0.4, -0.55, 0.55, 2.31, 3);
    awningCase(b, v, -1.7, 1.0, 2.1);
  }

  function drawMotorhome(b, v) {
    const hl = b.hl, hw = b.hw, p = v.paint, acc = accentOf(v);
    for (const w of [-1, 1]) { wheel(b, hl - 1.6, w * (hw - 0.12), v.steer); wheel(b, -hl + 1.6, w * (hw - 0.1)); }
    const cab = hull(hl - 2.4, hl, hw - 0.1, 0.45, 0.1);
    solid(b, cab, 0.3, cab, 1.2, shade(p, 0.86), p);
    for (const w of [-1, 1]) {
      endPanel(b, 1, w * 0.28, w * 0.58, 0.7, 0.98, HEAD);
      poly(quad(b, hl - 1.5, hl - 1.25, w * (hw - 0.12), w * (hw + 0.2), 1.5), TRIM);                  // mirrors
    }
    solid(b, hull(hl - 2.3, hl - 0.8, hw - 0.14, 0.3, 0.1), 1.2, hull(hl - 2.3, hl - 1.5, hw - 0.24, 0.25, 0.1), 1.95, GLASS, p);
    const hab = hull(-hl, hl - 1.9, hw, 0.14);                                                         // the living box, with a coloured band
    solid(b, hab, 0.45, hab, 1.3, SHELL_WALL);
    solid(b, hab, 1.3, hab, 1.62, acc);
    solid(b, hab, 1.62, hab, 2.9, SHELL_WALL);
    solid(b, hull(hl - 2.2, hl - 0.7, hw, 0.5, 0.1), 1.95, hull(hl - 2.2, hl - 0.95, hw - 0.03, 0.5, 0.1), 2.9, SHELL_WALL);   // bed over the cab
    poly(hull(-hl, hl - 0.95, hw - 0.02, 0.5, 0.14).map(([l, w]) => RP(b, l, w, 2.9)), SHELL, EDGE);   // one roof over both
    for (const w of [-1, 1]) endPanel(b, -1, w * 0.68, w * 0.95, 0.7, 1.25, tailOf(v));
    poly(quad(b, hl - 2.0, hl - 1.35, -0.45, 0.45, 2.91), SKYLIGHT, EDGE);
    panel(b, -0.7, 0.9, -0.7, 0.7, 2.91, 4);
    const hatch = box(-2.3, -1.6, -0.35, 0.35);
    solid(b, hatch, 2.9, hatch, 3.06, '#b9c2c4', '#d6dee0');
    const [dx, dy] = RP(b, -hl + 0.7, -v.side * 0.45, 3.0);                                            // satellite dome
    ctx.fillStyle = '#e4e2da'; ctx.strokeStyle = EDGE; ctx.beginPath(); ctx.arc(dx, dy, cam.s * 0.36, 0, TAU); ctx.fill(); ctx.stroke();
    awningCase(b, v, -2.7, 1.3, 2.9);
  }

  // r is the caravan body; its drawbar reaches 1.3 m ahead of it, to the tow ball.
  function drawCaravan(r, v) {
    const hl = r.hl, hw = r.hw, acc = accentOf(v);
    ctx.strokeStyle = TRIM; ctx.lineWidth = Math.max(2, cam.s * 0.14); ctx.lineJoin = 'round';         // A-frame
    ctx.beginPath(); ctx.moveTo(...RP(r, hl, -0.7, 0.45)); ctx.lineTo(...RP(r, hl + 1.3, 0, 0.45)); ctx.lineTo(...RP(r, hl, 0.7, 0.45)); ctx.stroke();
    ctx.lineWidth = 1;
    const [jx, jy] = RP(r, hl + 0.92, 0.2, 0.2);                                                       // jockey wheel
    ctx.fillStyle = '#1b1d1f'; ctx.beginPath(); ctx.arc(jx, jy, cam.s * 0.13, 0, TAU); ctx.fill();
    const gas = hull(hl - 0.05, hl + 0.5, 0.6, 0.15);                                                  // gas locker
    solid(r, gas, 0.5, gas, 1.2, '#b4b7b2', '#cfd1cb');
    for (const w of [-1, 1]) wheel(r, -0.3, w * (hw - 0.08));
    const o = hull(-hl, hl, hw, 0.32, 0.2);
    solid(r, o, 0.45, o, 1.15, SHELL_WALL);
    solid(r, o, 1.15, o, 1.7, (nl) => (nl > 0.5 ? GLASS : acc));                                       // front window, coloured band
    solid(r, o, 1.7, hull(-hl + 0.12, hl - 0.5, hw - 0.06, 0.32, 0.2), 2.6, SHELL_WALL, SHELL);
    for (const w of [-1, 1]) endPanel(r, -1, w * 0.6, w * 0.88, 0.7, 1.08, tailOf(v));
    poly(quad(r, hl - 1.75, hl - 0.95, -0.6, 0.6, 2.61), SKYLIGHT, EDGE);
    const hatch = box(-0.9, -0.3, -0.3, 0.3);
    solid(r, hatch, 2.6, hatch, 2.74, '#b9c2c4', '#d6dee0');
    const [vx, vy] = RP(r, -hl + 0.7, v.side * 0.4, 2.62);                                             // roof vent
    ctx.fillStyle = '#c9cdc8'; ctx.strokeStyle = EDGE; ctx.beginPath(); ctx.arc(vx, vy, cam.s * 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    awningCase(r, v, -1.9, 1.5, 2.6);
  }

  function drawVehicle(v) {
    const b = bodyRect(v);
    const [sx, sy] = P(b.cx, b.cy), far = cam.s * 14;
    if (sx < -far || sx > vw + far || sy < -far || sy > vh + far) return;
    ctx.globalAlpha = clamp(v.alpha, 0, 1);
    ctx.lineWidth = 1; ctx.lineJoin = 'round';
    if (v.kind === 'van') drawVan(b, v);
    else if (v.kind === 'motorhome') drawMotorhome(b, v);
    else if (v.kind === 'caravan') drawCaravan(b, v);
    else {
      if (v.hitched) ctx.globalAlpha *= clamp((clock - v.hitched) / 1.2, 0, 1);   // the tow car, back from town
      drawCar(b, v);
      ctx.globalAlpha = clamp(v.alpha, 0, 1);
      if (v.t.trailer) drawCaravan(trailerRect(v), v);
    }
    if (v.parked && v.alpha > 0.9) drawCampLife(v);
    ctx.globalAlpha = 1;
    if (!v.parked) v._lights = [RP(b, b.hl, -b.hw * 0.6, 0.7), RP(b, b.hl, b.hw * 0.6, 0.7)];
  }

  // Once parked, a guest rolls out an awning and puts two chairs under it.
  function drawCampLife(v) {
    const r = livingRect(v), z = (v.t.trailer ? v.t.trailer.z : v.t.z) - 0.2, side = v.side;
    const w0 = side * r.hw, w1 = side * (r.hw + 2.1);
    const open = clamp((clock - v.parked.t) / 0.8, 0, 1) * (v.packing ? 1 - clamp((clock - v.packing - 2.5) / 1.5, 0, 1) : 1), wm = lerp(w0, w1, open);
    for (let i = 0; i < 6; i++) {
      const l0 = -1.6 + i * 0.55;
      poly([RP(r, l0, w0, z), RP(r, l0 + 0.55, w0, z), RP(r, l0 + 0.55, wm, z - 0.35), RP(r, l0, wm, z - 0.35)], i % 2 ? '#f6f1df' : shade(v.paint === '#f2efe6' ? '#d5503c' : v.paint, 0.95));
    }
    if (open >= 1) for (const l of [-0.7, 0.7]) { const [x, y] = RP(r, l, side * (r.hw + 2.9), 0.3); ctx.fillStyle = '#3a2f25'; ctx.beginPath(); ctx.arc(x, y, cam.s * 0.28, 0, TAU); ctx.fill(); }
  }

  function drawTree(t, fade) {
    const [bx, by] = P(t.x, t.y, 0), [tx, ty] = P(t.x, t.y, t.z * 0.6);
    ctx.strokeStyle = '#5a4330'; ctx.lineWidth = cam.s * 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalAlpha = fade;
    const tones = t.hue < 0.33 ? ['#2f6b3a', '#3c8046', '#57994f'] : t.hue < 0.66 ? ['#2a5f3f', '#35774a', '#4c9058'] : ['#3d6a2c', '#527f33', '#6f9a3f'];
    [[0.62, 1], [0.82, 0.78], [1, 0.5]].forEach(([zf, rf], i) => {
      const [x, y] = P(t.x, t.y, t.z * zf);
      ctx.fillStyle = tones[i]; ctx.beginPath(); ctx.arc(x, y, t.r * rf * cam.s * (1 + t.z * zf * LEAN), 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function frame(night) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1c3327'; ctx.fillRect(0, 0, vw, vh);
    const sx = shake ? (Math.random() - 0.5) * shake * 10 : 0, sy = shake ? (Math.random() - 0.5) * shake * 10 : 0;
    ctx.translate(sx, sy);
    const [gx, gy] = P(0, 0);
    ctx.drawImage(ground, gx, gy, W * cam.s, H * cam.s);
    drawSkids();

    // the pitch to park on
    if (mode === 'play' && target && car) {
      const pulse = 0.5 + 0.5 * Math.sin(clock * 5), p = target;
      const [x0, y0] = P(p.x, p.y), [x1, y1] = P(p.x + p.w, p.y + p.d);
      ctx.fillStyle = `rgba(244,197,49,${0.22 + pulse * 0.2})`; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.strokeStyle = '#f4c531'; ctx.lineWidth = 3 + pulse * 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
      if (holdT > 0) {
        const [cx, cy] = P(p.x + p.w / 2, p.y + p.d / 2);
        ctx.strokeStyle = '#12211a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, cam.s * 1.6, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(holdT / 0.6, 0, 1)); ctx.stroke();
      }
    }

    // soft ground shadows
    ctx.fillStyle = 'rgba(15,30,20,0.22)';
    for (const t of trees) { const [x, y] = P(t.x + 1.6, t.y + 1.6); if (x < -80 || x > vw + 80 || y < -80 || y > vh + 80) continue; ctx.beginPath(); ctx.arc(x, y, t.r * cam.s, 0, TAU); ctx.fill(); }
    for (const b of buildings) { const [x, y] = P(b.x + 1.2, b.y + 1.2); ctx.fillRect(x, y, b.w * cam.s, b.h * cam.s); }
    const all = car ? [...guests, ...ghosts, car] : [...guests, ...ghosts];
    for (const v of all) for (const r of rectsOf(v)) { ctx.globalAlpha = clamp(v.alpha, 0, 1); poly(corners(r).map((c) => P(c.x + 0.5, c.y + 0.5)), 'rgba(15,30,20,0.3)'); }
    ctx.globalAlpha = 1;

    // campfire embers
    { const [x, y] = P(fire.x, fire.y); ctx.fillStyle = '#e8792c'; ctx.beginPath(); ctx.arc(x, y, cam.s * (0.5 + 0.08 * Math.sin(clock * 9)), 0, TAU); ctx.fill(); ctx.fillStyle = '#f9d34c'; ctx.beginPath(); ctx.arc(x, y, cam.s * 0.25, 0, TAU); ctx.fill(); }

    for (const v of all) drawVehicle(v);
    drawPeople();

    // tents
    for (const t of tents) {
      const r = { cx: t.x, cy: t.y, hl: 1.7, hw: 1.3, a: t.a }, base = quad(r, -1.7, 1.7, -1.3, 1.3, 0);
      const r0 = RP(r, -1.7, 0, 1.5), r1 = RP(r, 1.7, 0, 1.5);
      poly([base[0], base[1], r1, r0], shade(t.c, 0.8)); poly([base[3], base[2], r1, r0], t.c);
    }
    // buildings
    for (const b of buildings) {
      const r = { cx: b.x + b.w / 2, cy: b.y + b.h / 2, hl: b.w / 2, hw: b.h / 2, a: 0 };
      const top = drawBox(r, b.z, b.wall, b.roof);
      if (b.label) {
        poly([RP(r, -r.hl, 0, b.z + 0.9), RP(r, r.hl, 0, b.z + 0.9), top[2], top[3]], shade(b.roof, 1.12));     // sunny side of a pitched roof
        poly([RP(r, -r.hl, 0, b.z + 0.9), RP(r, r.hl, 0, b.z + 0.9), top[1], top[0]], shade(b.roof, 0.9));
        const [x, y] = RP(r, 0, r.hw * 0.5, b.z + 0.45);
        ctx.fillStyle = '#f6f1df'; ctx.font = `800 ${Math.round(cam.s * 1.15)}px Overpass, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(L.labels[b.label] || b.label, x, y);
      }
    }
    // lamp posts
    for (const l of lamps) {
      const [x0, y0] = P(l.x, l.y), [x1, y1] = P(l.x, l.y, 4.2);
      ctx.strokeStyle = '#2a2f33'; ctx.lineWidth = Math.max(2, cam.s * 0.14); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      ctx.fillStyle = night > 0.2 ? '#ffe9a8' : '#d8d2bf'; ctx.beginPath(); ctx.arc(x1, y1, cam.s * 0.32, 0, TAU); ctx.fill();
    }
    // trees last: canopies hang over everything, and thin out above the vehicle being driven
    for (const t of trees) {
      const [x, y] = P(t.x, t.y, t.z); if (x < -120 || x > vw + 120 || y < -120 || y > vh + 120) continue;
      drawTree(t, car && Math.hypot(car.x - t.x, car.y - t.y) < t.r + 3.5 ? 0.4 : 1);
    }

    // night: darken, then add light back
    if (night > 0.01) {
      ctx.fillStyle = `rgba(8,14,44,${night * 0.66})`; ctx.fillRect(-20, -20, vw + 40, vh + 40);
      ctx.globalCompositeOperation = 'lighter';
      const glow = (x, y, rad, col, a) => {
        const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
        g.addColorStop(0, col.replace('A', String(a * night))); g.addColorStop(1, col.replace('A', '0'));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      };
      for (const l of lamps) { const [x, y] = P(l.x, l.y, 1); glow(x, y, cam.s * 11, 'rgba(255,214,130,A)', 0.5); }
      { const [x, y] = P(fire.x, fire.y); glow(x, y, cam.s * (8 + Math.sin(clock * 11) * 0.6), 'rgba(255,150,60,A)', 0.7); }
      for (const g of guests) { const r = livingRect(g), [x, y] = P(r.cx, r.cy, 1); glow(x, y, cam.s * 4.5, 'rgba(255,200,120,A)', 0.4 * g.alpha); }
      if (car && car._lights) {
        for (const [x, y] of car._lights) {
          const a = car.th, len = cam.s * 17;
          const g = ctx.createRadialGradient(x, y, 0, x, y, len);
          g.addColorStop(0, `rgba(255,244,205,${0.6 * night})`); g.addColorStop(1, 'rgba(255,244,205,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, len, a - 0.36, a + 0.36); ctx.closePath(); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    // keep the pitch outline readable after dark
    if (night > 0.2 && mode === 'play' && target && car) {
      const p = target, [x0, y0] = P(p.x, p.y), [x1, y1] = P(p.x + p.w, p.y + p.d);
      ctx.strokeStyle = `rgba(244,197,49,${0.55 + 0.35 * Math.sin(clock * 5)})`; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
    }

    drawFx();

    // if the pitch is off screen, point at it
    if (mode === 'play' && target && car) {
      const [tx, ty] = P(target.x + target.w / 2, target.y + target.d / 2), m = 46;
      if (tx < m || tx > vw - m || ty < m + 60 || ty > vh - m) {
        const ax = clamp(tx, m, vw - m), ay = clamp(ty, m + 70, vh - m - 90), a = Math.atan2(ty - ay, tx - ax);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
        ctx.fillStyle = '#f4c531'; ctx.strokeStyle = '#12211a'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(-12, -16); ctx.lineTo(-4, 0); ctx.lineTo(-12, 16); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ---------- score card ----------
  // Pressing the Score plate pauses the game and opens a card with the figures behind the score and ways to share it.
  const stats = { acc: 0, spd: 0, top: 0, bumps: 0, scares: 0, gaveUp: 0, time: 0, streak: 0, perfect: 0, tips: 0, honks: 0, boosts: 0, fines: 0, errands: 0, dogs: 0, cones: 0 };
  const card = $('card'), SITE = 'https://camping-sofia.com/';
  let paused = false, pic = null, picUrl = '';
  // A 1200 x 630 picture of the score for sharing: the camp as it looks right now, behind a plate with the figures.
  function scoreImage(top) {
    const c = document.createElement('canvas'), W = 1200, H = 630, n = parkedCount, INK = '#12211a';
    c.width = W; c.height = H;
    const g = c.getContext('2d'), font = (w, px) => `${w} ${px}px Overpass, "Segoe UI", sans-serif`;
    const k = Math.max(W / cv.width, H / cv.height), dw = cv.width * k, dh = cv.height * k;
    g.fillStyle = '#1c3327'; g.fillRect(0, 0, W, H);
    g.drawImage(cv, (W - dw) / 2, (H - dh) / 2, dw, dh);
    g.fillStyle = 'rgba(18, 33, 26, 0.45)'; g.fillRect(0, 0, W, H);
    const shape = (x, y, w, h, r) => { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); };
    const plate = (x, y, w, h, r, fill) => {
      g.fillStyle = INK; shape(x, y + 10, w, h, r); g.fill();
      g.fillStyle = fill; shape(x, y, w, h, r); g.fill();
      g.lineWidth = 8; g.strokeStyle = INK; g.stroke();
    };
    plate(250, 84, 700, 486, 26, '#f6f1df');
    plate(300, 30, 600, 104, 20, '#f4c531');
    const logo = document.querySelector('.sign img');
    if (logo && logo.complete && logo.naturalWidth) g.drawImage(logo, 318, 46, 72, 72);
    g.fillStyle = INK; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = font(900, 56); g.fillText('Camping Sofia', 412, 86);
    g.textAlign = 'center';
    g.font = font(900, 190); g.fillText(String(top), 600, n ? 262 : 300);
    g.font = font(600, 32); g.fillText(L.imgPoints, 600, n ? 372 : 420);
    if (n) {
      const cols = [[n, L.imgParked], [Math.round(stats.acc / n), L.imgAcc], [Math.round(stats.spd / n), L.imgSpd]];
      cols.forEach(([v, label], i) => {
        const x = 400 + i * 200;
        g.font = font(900, 46); g.fillText(String(v), x, 438);
        g.font = font(600, 22); g.fillText(label, x, 476);
      });
    }
    g.font = font(800, 30); g.fillText(`${L.imgBeat}  camping-sofia.com`, 600, 530);
    return c;
  }

  function openCard(over) {
    if (!card.showModal || card.open) return;
    $('card-title').textContent = over === true ? L.overTitle : L.cardTitle;
    $('card-close').textContent = over === true ? L.again : L.close;
    $('card-again').textContent = L.again; $('card-again').hidden = over !== true;
    $('card-restart').hidden = over === true;
    const now = score(), top = Math.max(best, now), n = parkedCount, enc = encodeURIComponent;
    let ri = 0;
    while (ri < RANKS.length - 1 && top >= RANKS[ri + 1]) ri++;
    const text = ri > 0 ? L.shareRank(top, L.ranks[ri]) : L.share(top);
    const set = (id, v) => { $(id).textContent = v; };
    set('st-score', now); set('st-best', top);
    set('st-parked', n); set('st-onsite', guests.filter((g) => !g.packing && !g.leaving).length);
    set('st-acc', n ? `${Math.round(stats.acc / n)} / 100` : '–'); set('st-spd', n ? `${Math.round(stats.spd / n)} / 100` : '–');
    set('st-top', n ? stats.top : '–'); set('st-streak', stats.streak); set('st-perfect', stats.perfect); set('st-tips', stats.tips); set('st-fines', stats.fines); set('st-errands', stats.errands); set('st-bank', bank); set('st-gnomes', `${found.size}/${GNOMES.length}`);
    set('st-rank', rankLine(now, startBest));
    { let i = 0; while (i < RANKS.length - 1 && now >= RANKS[i + 1]) i++; set('st-boss', over === true ? L.boss.over[i] : ''); }
    boardFor(over); clubRows(); runRows(now);
    const ids = Object.keys(L.badges), list = $('bd-list');
    set('bd-title', `${L.badgesTitle} ${ids.filter((id) => earned.has(id)).length}/${ids.length}`);
    list.textContent = '';
    ids.forEach((id) => { const li = document.createElement('li'); li.textContent = L.badges[id]; if (earned.has(id)) li.className = 'got'; list.append(li); });
    set('st-bumps', stats.bumps); set('st-scares', stats.scares); set('st-gaveup', stats.gaveUp);
    set('st-time', `${Math.floor(stats.time / 60)}:${String(Math.floor(stats.time % 60)).padStart(2, '0')}`);
    $('sh-fb').href = `https://www.facebook.com/sharer/sharer.php?u=${enc(SITE)}`;
    $('sh-x').href = `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(SITE)}`;
    $('sh-wa').href = `https://wa.me/?text=${enc(`${text} ${SITE}`)}`;
    $('sh-tg').href = `https://t.me/share/url?url=${enc(SITE)}&text=${enc(text)}`;
    $('sh-native').hidden = !navigator.share;
    $('sh-native').onclick = () => {
      const data = { title: 'Camping Sofia', text, url: SITE };
      if (pic && navigator.canShare && navigator.canShare({ files: [pic] })) data.files = [pic];   // phones attach the picture
      navigator.share(data).catch(() => { /* closed without sharing */ });
    };
    pic = null; $('sh-pic').hidden = true; $('sh-img').hidden = true;
    try {
      scoreImage(top).toBlob((b) => {
        if (!b) return;
        pic = new File([b], 'camping-sofia-score.png', { type: 'image/png' });
        if (picUrl) URL.revokeObjectURL(picUrl);
        picUrl = URL.createObjectURL(b);
        $('sh-img').src = picUrl; $('sh-img').hidden = false;
        $('sh-pic').href = picUrl; $('sh-pic').hidden = false;
      }, 'image/png');
    } catch (e) { /* no picture: the links still work */ }
    $('sh-copy').textContent = L.copy;
    $('sh-copy').onclick = () => {
      const say = (t) => () => { $('sh-copy').textContent = t; };
      if (navigator.clipboard) navigator.clipboard.writeText(`${text} ${SITE}`).then(say(L.copied), say(L.copyFailed));
      else say(L.copyFailed)();
    };
    paused = true; for (const k in keys) keys[k] = false;
    card.showModal();
    if (over === true) { $('card-again').focus(); card.scrollTop = 0; }
  }
  $('score-btn').addEventListener('click', () => openCard());
  $('card-close').addEventListener('click', () => card.close());
  $('card-again').addEventListener('click', () => card.close());
  $('card-restart').addEventListener('click', () => location.reload());
  addEventListener('keydown', (e) => { if ((e.code === 'KeyP' || e.code === 'Escape') && mode === 'play' && !paused) { e.preventDefault(); openCard(); } });
  card.addEventListener('click', (e) => { if (e.target === card) card.close(); });   // a click on the backdrop
  card.addEventListener('close', () => { paused = false; last = performance.now(); cv.focus(); if (mode === 'over') start(chill); });

  // ---------- leaderboard ----------
  // A small service on Google Cloud keeps the best scores (see the `backend` branch). It stores a nickname and the
  // figures of a shift, nothing else. With no address set here the leaderboard simply does not show.
  const API = (location.search.includes('debug') && new URLSearchParams(location.search).get('api')) || '';
  let myName = '', posted = false, lastPost = null;
  try { myName = localStorage.getItem('camp-name') || ''; } catch (e) { /* private window */ }
  function showTop(data) {
    [['lb-week', data.week], ['lb-all', data.all]].forEach(([id, rows]) => {
      const ol = $(id);
      ol.textContent = '';
      if (!rows.length) { const li = document.createElement('li'); li.className = 'none'; li.textContent = L.lbEmpty; ol.append(li); }
      rows.slice(0, 10).forEach((r) => {
        const li = document.createElement('li'), b = document.createElement('b');
        li.textContent = r.name; b.textContent = r.score; li.append(b);
        if (lastPost && r.name === lastPost.name && r.score === lastPost.score) li.className = 'me';
        ol.append(li);
      });
    });
    if (data.week[0]) $('lead').textContent = L.lead(data.week[0].name, data.week[0].score);
  }
  function loadTop() {
    if (!API) return;
    fetch(`${API}/top`).then((r) => r.json()).then(showTop).catch(() => { /* the game works without it */ });
  }
  function postScore(name) {
    const n = score();
    if (!API || posted || chill || n <= 0 || !name) return;
    posted = true; $('lb-form').hidden = true; $('lb-status').textContent = '…';
    fetch(`${API}/score`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, score: n, parked: parkedCount, time: Math.round(stats.time) }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        myName = name; try { localStorage.setItem('camp-name', name); } catch (e) { /* private window */ }
        lastPost = { name: d.week.concat(d.all).map((r) => r.name).find((x) => x === name) || name, score: n };
        $('lb-status').textContent = L.lbPlace(name, d.placeWeek, d.placeAll);
        showTop(d);
      })
      .catch(() => { posted = false; $('lb-form').hidden = false; $('lb-status').textContent = L.lbFail; });
  }
  function boardFor(over) {   // called when the score card opens
    if (!API) return;
    $('lb').hidden = false;
    const can = over === true && !posted && !chill && score() > 0;
    $('lb-form').hidden = !can; $('lb-name').value = myName;
    if (!posted) $('lb-status').textContent = can ? L.lbNote : '';
    if (can && myName) postScore(myName); else loadTop();
  }
  $('lb-form').addEventListener('submit', (e) => { e.preventDefault(); postScore($('lb-name').value.trim().slice(0, 16)); });
  $('lb-name').addEventListener('keydown', (e) => e.stopPropagation());   // typing a name is not driving
  loadTop();

  // ---------- your best shifts ----------
  // The five best shifts played in this browser, with their dates: something to beat even with no leaderboard.
  let runs = [];
  try { runs = JSON.parse(localStorage.getItem('camp-runs') || '[]'); } catch (e) { /* private window */ }
  function keepRun(n) {
    if (n <= 0) return;
    runs.push({ s: n, p: parkedCount, d: new Date().toISOString().slice(0, 10) });
    runs.sort((a, b) => b.s - a.s); runs = runs.slice(0, 5);
    try { localStorage.setItem('camp-runs', JSON.stringify(runs)); } catch (e) { /* private window */ }
  }
  function runRows(now) {
    const ol = $('runs');
    ol.textContent = ''; $('runs-title').hidden = !runs.length;
    let marked = false;
    runs.forEach((r) => {
      const li = document.createElement('li'), b = document.createElement('b');
      li.textContent = `${r.d} · ${L.runGuests(r.p)}`; b.textContent = r.s; li.append(b);
      if (!marked && mode === 'over' && r.s === now) { li.className = 'me'; marked = true; }
      ol.append(li);
    });
  }

  // ---------- loop ----------
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    pollPad();
    if (!paused) { step(dt); stepFx(dt); stepToasts(); }
    engineSound(dt); stepRadio(dt); rainSound();
    updateCamera(dt);
    frame(night);
    requestAnimationFrame(tick);
  }
  hud();
  requestAnimationFrame(tick);

  // For automated checks only: /?debug exposes the state.
  if (location.search.includes('debug')) window.camp = { get car() { return car; }, get target() { return target; }, get parked() { return parkedCount; }, get score() { return score(); }, get night() { return night; }, people, skids, packUp, guests, pitches, stats, rectsOf, rectRect, keys, blocked, livingRect, corners, setClock: (t) => { clock = t; }, setPatience: (t) => { patience = t; }, get lives() { return lives; }, respect, owned, get bank() { return bank; }, setBank: (n) => { bank = n; saveShop(); shop(); }, props, get goals() { return goals; }, get ice() { return ice; }, found, GNOMES, get thief() { return thief; }, get rain() { return rain; }, setNext: (o) => { if (o.rain !== undefined) nextRain = o.rain; if (o.thief !== undefined) nextThief = o.thief; }, get job() { return job; }, setNextJob: (t) => { nextJob = t; }, tuneRadio, get station() { return station; }, get heat() { return heat; }, get warden() { return warden; }, trouble, boost, chats, takeBoost, say, addTip, earned, award, tips, honk, rankLine, get streak() { return streak; }, get mode() { return mode; }, get patienceMax() { return patienceMax; }, pops, bits, give: (kind) => { car = makeVehicle(kind, 61.8, 80.5, -Math.PI / 2); car.born = -9; }, next: () => { car = null; nextGuest(); } };
})();
