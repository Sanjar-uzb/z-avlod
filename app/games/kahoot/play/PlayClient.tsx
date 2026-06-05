"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import {
  listenPlayers,
  listenRoom,
  nextQuestion,
  showResult,
  startQuestion,
  submitAnswer,
} from "@/lib/kahootLive";

import { scoreKahoot } from "@/lib/kahootScoring";
import { saveKahootGameResult } from "@/lib/storage";

export default function PlayClient() {

  const sp = useSearchParams()

  const pin = sp.get("pin") || ""
  const role = sp.get("role") || "player"
  const pid = sp.get("pid") || ""
  const name = sp.get("name") || ""

  const [room,setRoom] = useState<any>(null)
  const [players,setPlayers] = useState<any[]>([])

  useEffect(()=>{

    if(!pin) return

    const u1 = listenRoom(pin,setRoom)
    const u2 = listenPlayers(pin,setPlayers)

    return ()=>{u1();u2()}

  },[pin])

  const q = useMemo(()=>{

    if(!room?.questions?.length) return null
    return room.questions[room.qIndex]

  },[room])

  const [secLeft,setSecLeft] = useState(0)

  useEffect(()=>{

    if(!room || room.phase !== "QUESTION" || !room.startedAtMs) return

    const total = room.timePerQuestionSec || 15
    const start = room.startedAtMs

    const t = setInterval(()=>{

      const elapsed = (Date.now() - start)/1000
      const left = Math.max(0,total-elapsed)

      setSecLeft(Math.ceil(left))

    },120)

    return ()=>clearInterval(t)

  },[room?.phase,room?.startedAtMs])



  const autoResultLock = useRef(false)

  useEffect(()=>{

    if(role !== "host") return
    if(!room || room.phase !== "QUESTION") return
    if(secLeft>0) return
    if(autoResultLock.current) return

    autoResultLock.current = true

    showResult(pin)

  },[secLeft,room,role,pin])


  const autoNextLock = useRef(false)

  useEffect(()=>{

    if(role !== "host") return
    if(!room || room.phase !== "RESULT") return
    if(autoNextLock.current) return

    autoNextLock.current = true

    const t = setTimeout(()=>{

      nextQuestion(pin)

    },3000)

    return ()=>clearTimeout(t)

  },[room?.phase])

  // Save game result when finished
  const savedResultsRef = useRef<Set<string>>(new Set())

  useEffect(()=>{

    if(!room || room.phase !== "FINISHED") return
    if(!room.pin) return

    // Avoid saving multiple times
    if(savedResultsRef.current.has(room.pin)) return
    savedResultsRef.current.add(room.pin)

    // Find current player's data
    const currentPlayer = players.find(p => p.id === pid)
    const playerPosition = players.findIndex(p => p.id === pid) + 1

    if(currentPlayer || role === "host") {
      saveKahootGameResult({
        title: room.title,
        student: currentPlayer?.data?.name || name,
        playerCount: players.length,
        playerPosition: playerPosition,
        score: currentPlayer?.data?.score || 0,
        totalQuestions: room.questions?.length || 0,
        correctAnswers: currentPlayer?.data?.correct || 0,
        totalParticipants: players.length,
        results: players.map(p => ({
          name: p.data.name,
          score: p.data.score,
          correct: p.data.correct,
        })),
      })
    }

  },[room?.phase, room?.pin, players, pid, name, role])




  useEffect(()=>{

    autoResultLock.current = false
    autoNextLock.current = false

  },[room?.qIndex])



  const [picked,setPicked] = useState<number|null>(null)
  const [locked,setLocked] = useState(false)
  const [info,setInfo] = useState("")



  useEffect(()=>{

    setPicked(null)
    setLocked(false)
    setInfo("")

  },[room?.qIndex])



  async function answer(choiceId:number){

    if(!q) return
    if(locked) return
    if(room.phase !== "QUESTION") return

    setPicked(choiceId)
    setLocked(true)

    const total = room.timePerQuestionSec || 15
    const startedAt = room.startedAtMs

    const elapsed = (Date.now()-startedAt)/1000
    const left = Math.max(0,total-elapsed)

    const correct = choiceId === q.answerId

    const res = scoreKahoot({
      isCorrect: correct,
      timeLeftSec:left,
      totalTimeSec:total
    })

    await submitAnswer(pin,pid,{
      qid:q.id,
      pickedId:choiceId,
      correct:correct,
      gained:res.gained,
      tLeftSec:left
    })

    if(correct)
      setInfo(`✅ To‘g‘ri +${res.gained}`)
    else
      setInfo("❌ Noto‘g‘ri")

  }



  const top3 = useMemo(()=>players.slice(0,3),[players])



  if(!room)
    return(
      <div className="container">
        <div className="card">Room yuklanmoqda...</div>
      </div>
    )



  return(

    <div className="container">

      <div className="grid" style={{marginTop:14}}>

        <div className="card" style={{gridColumn:"span 8"}}>

          <div className="row" style={{justifyContent:"space-between"}}>

            <div>

              <div className="h2">{room.title}</div>

              <div className="muted">

                PIN <b>{room.pin}</b>

              </div>

            </div>

            {role==="host" && room.phase==="LOBBY" && (

              <button
                className="btn btnLarge"
                onClick={()=>startQuestion(pin)}
              >
                Start
              </button>

            )}

          </div>


          <hr className="hr"/>



          {q && (

            <>

              <div className="row" style={{justifyContent:"space-between"}}>

                <div className="h3">
                  Savol {room.qIndex+1}/{room.questions.length}
                </div>

                {room.phase==="QUESTION" && (

                  <span className="badge">
                    {secLeft}s
                  </span>

                )}

              </div>



              {role==="host" && (

                <div className="card kahootProjector">

                  <div className="kahootProjectorQuestion">

                    {q.text}

                  </div>

                  <div className="grid" style={{marginTop:14}}>

                    {q.choices.map((c:any,i:number)=>(

                      <div
                        key={c.id}
                        className={`kahootColorCard card${i+1}`}
                        style={{gridColumn:"span 6"}}
                      >
                        {c.text}
                      </div>

                    ))}

                  </div>

                </div>

              )}



              {role==="player" && (

                <>

                  <div className="h3" style={{marginTop:10}}>

                    {q.text}

                  </div>


                  <div className="grid" style={{marginTop:12}}>

                    {q.choices.map((c:any,i:number)=>{

                      const pickedClass = picked===c.id ? "picked":""

                      return(

                        <button
                          key={c.id}
                          className={`kahootChoice kahootColorBtn color${i+1} ${pickedClass}`}
                          onClick={()=>answer(c.id)}
                          disabled={locked || room.phase!=="QUESTION"}
                          style={{gridColumn:"span 6"}}
                        >
                          {c.text}
                        </button>

                      )

                    })}

                  </div>

                  {info && (

                    <p className="muted" style={{marginTop:10}}>
                      {info}
                    </p>

                  )}

                </>

              )}

            </>

          )}



          {room.phase==="FINISHED" && (

            <div className="card">

              <div className="h3">Yakuniy natija</div>

              <div className="kahootPodiumWrap">

                <div className="kahootPodium second">

                  <div>{top3[1]?.data?.name}</div>
                  <div>{top3[1]?.data?.score}</div>
                  <div className="kahootPodiumBase">2</div>

                </div>

                <div className="kahootPodium first">

                  <div>{top3[0]?.data?.name}</div>
                  <div>{top3[0]?.data?.score}</div>
                  <div className="kahootPodiumBase">1</div>

                </div>

                <div className="kahootPodium third">

                  <div>{top3[2]?.data?.name}</div>
                  <div>{top3[2]?.data?.score}</div>
                  <div className="kahootPodiumBase">3</div>

                </div>

              </div>

            </div>

          )}

        </div>



        <div className="card" style={{gridColumn:"span 4"}}>

          <div className="h3">Reyting</div>

          {players.map((p,i)=>(
            <div key={p.id} className="module">

              <div className="row" style={{justifyContent:"space-between"}}>

                <div>{i+1}. {p.data.name}</div>

                <div className="badge">{p.data.score}</div>

              </div>

            </div>
          ))}

          <hr className="hr"/>

          <Link className="btn btnGhost" href="/games/kahoot">
            Orqaga
          </Link>

        </div>

      </div>

    </div>

  )

}