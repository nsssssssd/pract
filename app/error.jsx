'use client';

import { useEffect } from 'react';

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Что-то пошло не так</h2>
      <button onClick={() => unstable_retry()}>Попробовать снова</button>
    </div>
  );
}
