import { Fragment, Suspense } from 'react';
import { getAll } from '../data/db';
import Like from './Like.tsx';

function Page() {
  return (
    <Fragment>
      <h1>Heloo from RSC</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <Albums />
      </Suspense>
    </Fragment>
  );
}

async function Albums() {
  const getAllData = await getAll();

  return (
    <ul>
      {getAllData.map((data) => (
        <li key={data.id}>
          <p>{data.title}</p>
          <p>{data.artist}</p>
          <img src={data.cover} />
          <Like />
        </li>
      ))}
    </ul>
  );
}

export default Page;
