import Header from "../components/Header"
import { adapter } from "../db"

export default function Home() {
  return (
    <>
      <Header>

      </Header>
      <main className="flex-1 p-2 flex flex-col gap-2">
        <p>{adapter}</p>
      </main>
    </>
  )
}