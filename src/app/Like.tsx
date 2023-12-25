'use client';
import { useState } from 'react';

export default function Like() {
  const [like, setLike] = useState(0);

  return (
    <button onClick={() => setLike((prevLike) => prevLike + 1)}>
      Like {like}
    </button>
  );
}
