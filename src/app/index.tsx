import { Fragment, Suspense } from "react";
import { getAll } from "../data/db";

function Page() {
  return (
    <Fragment>
      <h1>Heloo from RSC</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <ListData />
      </Suspense>
    </Fragment>
  )
}

async function ListData() {
  const getAllData = await getAll()

  return (
    <ul>
      {getAllData.map(data => (
        <li key={data.id}>{data.title}</li>
      ))}
    </ul>
  )
}

export default Page
