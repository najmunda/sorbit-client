import { useCallback, useEffect, useRef, useState } from "react"
import { Interweave } from "interweave";
import { CopyX, Pickaxe, Smile, SquareArrowLeft, SquareArrowRight, ThumbsDown, ThumbsUp } from "lucide-react"
import { useLoaderData, useNavigation, useSubmit } from "react-router-dom";
import { getCardsTotal, getTodayCards, updateSRS } from "../db";
import Loading from "../components/Loading";
import CardsCounter from "../components/CardsCounter";

export async function loader() {
  const {topCard, nextReview, cardsLeft} = await getTodayCards();
  const cardsTotal = await getCardsTotal();
  return { topCard, nextReview, cardsLeft, cardsTotal };
}

export async function action({ request }) {
  const { id, rating } = await request.json();
  const result = await updateSRS(id, rating);
  return result;
}

export default function Sorb() {

  const { topCard, nextReview, cardsLeft, cardsTotal } = useLoaderData();
  const [isOpen, setIsOpen] = useState(false);
  const submit = useSubmit();
  const currentCardRef = useRef();
  const navigation = useNavigation()

  // Handlers

  let firstTouchX = null;
  let swiped = false;

  function getTouches(e) {
    return e.touches;
  }

  function handleTouchStart(e) {
    const firstTouch = getTouches(e)[0];
    firstTouchX = firstTouch.clientX;
  }

  function handleTouchMove(e) {
    if (!firstTouchX || swiped) {
      return;
    }

    const secondTouch = getTouches(e)[0];
    const touchXDiff = secondTouch.clientX - firstTouchX;

    if (touchXDiff > 0) {
      swiped = true;
      handleCardRight();
    } else if (touchXDiff < 0) {
      swiped = true;
      handleCardLeft();
    }
  }

  function handleCardRight() {
    if (isOpen) {
      console.log('right');
      setIsOpen(false);
      submit({ id: topCard._id, rating: 1 }, { method: "post", encType: "application/json" });
    }
  }

  function handleCardLeft() {
    if (isOpen) {
      console.log('left');
      setIsOpen(false);
      submit({ id: topCard._id, rating: 0 }, { method: "post", encType: "application/json" });
    }
  }

  function handleCardClick() {
    setIsOpen(true);
  }

  const handleKeyUp = useCallback((e) => {
    if (isOpen) {
      if (e.key == "ArrowLeft") {
        handleCardLeft()
      } else if (e.key == "ArrowRight") {
        handleCardRight()
      }
    }
  }, [isOpen]);

  useEffect(() => {
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyUp]);

  // Loading
  const isLoading = navigation.state == "submitting" || navigation.state == "loading"

  return (
    <main className={`flex-1 flex flex-col justify-center items-center gap-2 p-2`}>
      {cardsLeft.learn.length != 0 || cardsLeft.new.length != 0 || cardsLeft.review.length != 0 ?
        <>
          {isLoading ? (
            <Loading className='flex-1 flex flex-col justify-center items-stretch' /> 
          ) : (
              <div
                ref={currentCardRef}
                onClick={handleCardClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                className="w-full flex-1 md:max-w-sm md:max-h-[35rem] p-2 flex flex-col items-stretch justify-around bg-white text-center rounded-lg border"
              >
                {isOpen &&
                  <>
                    <section className="p-2 flex flex-row-reverse items-center gap-2">
                      <button onClick={handleCardRight} className="p-2 flex items-center gap-2 rounded-lg border">
                        <ThumbsUp />
                        <p className="text-xs">{nextReview.good}</p>
                        <p className="text-xs">Good</p>
                      </button>
                      <hr className="flex-1 border-black" />
                    </section>
                    <section className="flex items-center justify-center gap-1 text-neutral-300">
                      <p className="text-xs">Swipe Right / Click "Good" button / press </p>
                      <SquareArrowRight />
                    </section>
                  </>
                }
                <div className="flex-1 flex flex-col justify-center items-center gap-2">
                  <p><Interweave content={topCard.sentence.replace(topCard.target, `<b>${topCard.target}</b>`)} /></p>
                  <p className="text-2xl font-bold"><mark className={`${isOpen ? "bg-inherit" : 'text-neutral-300 bg-neutral-300 rounded'}`}>{topCard.target}</mark></p>
                  <p className="text-sm"><mark className={`${isOpen ? "bg-inherit" : 'text-neutral-300 bg-neutral-300 rounded'}`}>{topCard.def}</mark></p>
                </div>
                {isOpen &&
                  <>
                    <section className="flex items-center justify-center gap-1 text-neutral-300">
                      <p className="text-xs">Swipe Left / Click "Again" button / press</p>
                      <SquareArrowLeft />
                    </section>
                    <section className="p-2 flex items-center gap-2">
                      <button onClick={handleCardLeft} className="p-2 flex items-center gap-2 rounded-lg border">
                        <ThumbsDown />
                        <p className="text-xs">{nextReview.again}</p>
                        <p className="text-xs">Again</p>
                      </button>
                      <hr className="flex-1 border-1 border-black" />
                    </section>
                  </>
                }
              </div>
          )}
          <CardsCounter newTotal={cardsLeft.new.length} learnTotal={cardsLeft.learn.length} reviewTotal={cardsLeft.review.length} />
        </>
        :
        <div className="flex-1 p-2 flex flex-col items-center justify-center gap-2 text-center text-neutral-400 rounded-lg border-2 border-neutral-300 border-dashed">
          {cardsTotal != 0 ?
            <>
              <Smile size={80} />
              <p className="text-center text-sm">Good Job! All today's card is reviewed. Come back tomorrow!</p>
            </>
            :
            <>
              <CopyX size={80} />
              <p className="text-center text-sm">There is no card added. Go to <Pickaxe size={18} className="inline" /> "Mine" to mining sentence and add some card.</p>
            </>
          }
        </div>
      }
    </main>
  )
}