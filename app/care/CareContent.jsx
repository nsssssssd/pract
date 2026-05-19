'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';

const tips = [
  { icon: '✂️', title: 'Подрезайте стебли', text: 'Сразу после получения срежьте 2–3 см стебля под углом 45° острым ножом или секатором. Косой срез увеличивает площадь всасывания воды. Повторяйте каждые 2 дня.' },
  { icon: '💧', title: 'Правильная вода', text: 'Используйте чистую холодную воду — тюльпаны любят прохладу. Меняйте воду каждые 1–2 дня. Уровень воды в вазе — 10–12 см, не больше: длинный контакт стебля с водой ускоряет гниение.' },
  { icon: '🌡️', title: 'Температура', text: 'Оптимальная температура в комнате — 15–18 °C. Чем прохладнее, тем дольше простоят цветы. Избегайте сквозняков, батарей и прямых солнечных лучей — они иссушают лепестки.' },
  { icon: '🏺', title: 'Выбор вазы', text: 'Выбирайте высокую вазу — она поддерживает стебли и не даёт им гнуться. Перед использованием тщательно вымойте вазу с содой: бактерии в грязной посуде сокращают жизнь цветов вдвое.' },
  { icon: '🌿', title: 'Уберите листья', text: 'Удалите все листья, которые окажутся ниже уровня воды. Листья в воде гниют и создают бактериальную среду, которая закупоривает стебель и мешает цветку пить.' },
  { icon: '🍬', title: 'Подкормка', text: 'Добавьте в воду специальную подкормку для срезанных цветов или 1 чайную ложку сахара + несколько капель лимонного сока. Это питает цветок и замедляет размножение бактерий.' },
  { icon: '🌙', title: 'Ночью — в прохладу', text: 'На ночь переставляйте вазу в прохладное место — на подоконник (не на сквозняк) или в прохладную комнату. Тюльпаны «отдыхают» при низкой температуре и дольше сохраняют свежесть.' },
  { icon: '🚫', title: 'Опасные соседи', text: 'Не ставьте тюльпаны рядом с нарциссами — те выделяют вещества, ускоряющие увядание. Также держите цветы подальше от фруктов: этилен, который выделяют яблоки и бананы, губителен для лепестков.' },
];

const faq = [
  { q: 'Сколько стоят тюльпаны в вазе?', a: 'При правильном уходе свежесрезанные тюльпаны стоят в вазе 7–10 дней. В прохладном помещении срок может достигать 2 недель.' },
  { q: 'Почему тюльпаны гнутся и опускают голову?', a: 'Чаще всего это признак нехватки воды. Попробуйте: заверните цветы в газету плотным конусом, поставьте в холодную воду по самые бутоны на 2–3 часа — стебли восстановятся.' },
  { q: 'Можно ли реанимировать завядшие тюльпаны?', a: 'Да. Обновите срез, заверните в бумагу и поставьте в ведро с холодной водой на несколько часов. Добавьте в воду таблетку аспирина — это поможет цветку «прийти в себя».' },
  { q: 'Нужно ли прокалывать стебель иголкой?', a: 'Это народный метод: прокол под бутоном иголкой помогает выпустить воздушную пробку из стебля. Работает не всегда, но при сильном поникании попробовать стоит.' },
];

export default function CareContent() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
        <div className="text-5xl">🌷</div>
        <h1 className="text-3xl font-bold">Уход за тюльпанами</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Простые правила, которые помогут вашим цветам оставаться свежими и красивыми как можно дольше
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tips.map((t, i) => (
          <motion.div key={t.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="h-full">
              <CardContent className="p-5 space-y-2">
                <div className="text-2xl">{t.icon}</div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.text}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Частые вопросы</h2>
        <div className="space-y-3">
          {faq.map((f, i) => (
            <motion.div key={f.q} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}>
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="font-medium">{f.q}</div>
                  <div className="text-sm text-muted-foreground">{f.a}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="rounded-2xl bg-muted p-6 flex items-start gap-4">
        <div className="text-3xl">🌿</div>
        <div>
          <div className="font-semibold">Наши тюльпаны срезаются в день доставки</div>
          <p className="text-sm text-muted-foreground mt-1">
            Мы гарантируем свежесть — при соблюдении этих советов цветы простоят не менее 7 дней
          </p>
        </div>
      </motion.div>
    </div>
  );
}
