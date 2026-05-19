'use client';

export default function GlobalError({ error, unstable_retry }) {
  return (
    <html lang="ru">
      <body>
        <h2>Критическая ошибка</h2>
        <button onClick={() => unstable_retry()}>Обновить страницу</button>
      </body>
    </html>
  );
}
