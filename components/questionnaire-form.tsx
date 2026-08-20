'use client'

import { useMemo, useState } from 'react'
import { Fraunces, Inter, IBM_Plex_Mono } from 'next/font/google'
import styles from './questionnaire-form.module.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--qf-fraunces',
})
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--qf-inter',
})
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--qf-mono',
})

const SUS_ITEMS = [
  'I think that I would like to use this system frequently.',
  'I found the system unnecessarily complex.',
  'I thought the system was easy to use.',
  'I think that I would need the support of a technical person to be able to use this system.',
  'I found the various functions in this system were well integrated.',
  'I thought there was too much inconsistency in this system.',
  'I would imagine that most people would learn to use this system very quickly.',
  'I found the system very cumbersome to use.',
  'I felt very confident using the system.',
  'I needed to learn a lot of things before I could get going with this system.',
]

const TRUST_ITEMS: { text: string; tag: string }[] = [
  { text: 'TrustLock seems capable of doing what it claims to do.', tag: 'competence' },
  {
    text: 'I believe TrustLock would act in my best interest if something went wrong with a transaction.',
    tag: 'benevolence',
  },
  {
    text: "TrustLock's stated fees, payout timing, and dispute process seem honestly represented.",
    tag: 'integrity',
  },
  {
    text: 'I would be willing to use TrustLock for a real transaction of meaningful value to me.',
    tag: 'trusting intention',
  },
  {
    text: 'I trust that funds held in TrustLock’s escrow are actually safe until released.',
    tag: 'security perception',
  },
  {
    text: 'Seeing another user’s rating and verification badges increased my confidence in transacting with them.',
    tag: 'reputation signal',
  },
  {
    text: 'I would feel comfortable buying from a marketplace listing posted by someone I don’t already know, because the transaction is protected by escrow.',
    tag: 'marketplace trust',
  },
]

const QUAL_ITEMS: { id: 'q1' | 'q2' | 'q3' | 'q4'; text: string }[] = [
  { id: 'q1', text: 'What, if anything, made you hesitate or feel unsure during any task?' },
  { id: 'q2', text: "Was there any point where you weren't sure what to do next?" },
  { id: 'q3', text: 'What would make you trust this platform more?' },
  { id: 'q4', text: "Anything else you'd want to tell the people building this?" },
]

const SCALE_LABELS = ['Strongly\ndisagree', 'Disagree', 'Neutral', 'Agree', 'Strongly\nagree']

type QualAnswers = Record<'q1' | 'q2' | 'q3' | 'q4', string>

type SubmitPayload = {
  study: string
  submitted_at: string
  participant_id: string | null
  sus_responses: number[]
  sus_score: number
  trust_responses: number[]
  trust_mean: number
  qualitative: QualAnswers
}

function Likert({
  name,
  value,
  onChange,
}: {
  name: string
  value: number | null
  onChange: (v: number) => void
}) {
  return (
    <>
      <div className={styles.likert}>
        {[1, 2, 3, 4, 5].map((v) => (
          <div className={styles.likertOpt} key={v}>
            <input
              type="radio"
              name={name}
              id={`${name}_${v}`}
              checked={value === v}
              onChange={() => onChange(v)}
            />
            <label htmlFor={`${name}_${v}`}>
              <span className={styles.dot} />
              <span className={styles.loText}>{SCALE_LABELS[v - 1]}</span>
            </label>
          </div>
        ))}
      </div>
      <div className={styles.likertLegend}>
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>
    </>
  )
}

export function QuestionnaireForm() {
  const [agreed, setAgreed] = useState(false)
  const [participantId, setParticipantId] = useState('')
  const [started, setStarted] = useState(false)

  const [susAnswers, setSusAnswers] = useState<(number | null)[]>(Array(10).fill(null))
  const [trustAnswers, setTrustAnswers] = useState<(number | null)[]>(Array(7).fill(null))
  const [qualAnswers, setQualAnswers] = useState<QualAnswers>({ q1: '', q2: '', q3: '', q4: '' })

  const [validationMsg, setValidationMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [payload, setPayload] = useState<SubmitPayload | null>(null)

  const susDoneFrac = useMemo(() => susAnswers.filter((a) => a !== null).length / 10, [susAnswers])
  const trustDoneFrac = useMemo(
    () => trustAnswers.filter((a) => a !== null).length / 7,
    [trustAnswers],
  )
  const qualDoneFrac = useMemo(
    () => Object.values(qualAnswers).filter((v) => v.trim().length > 0).length / 4,
    [qualAnswers],
  )
  const overallFrac = (susDoneFrac + trustDoneFrac + qualDoneFrac) / 3
  const sectionsComplete =
    (susDoneFrac === 1 ? 1 : 0) + (trustDoneFrac === 1 ? 1 : 0) + (qualDoneFrac === 1 ? 1 : 0)

  function begin() {
    setStarted(true)
    setTimeout(() => {
      document.getElementById('susItems')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)
  }

  function buildPayload(): SubmitPayload {
    const sus = susAnswers as number[]
    let susSum = 0
    sus.forEach((rating, idx) => {
      const itemNum = idx + 1
      susSum += itemNum % 2 === 1 ? rating - 1 : 5 - rating
    })
    const susScore = susSum * 2.5

    const trust = trustAnswers as number[]
    const trustMean = trust.reduce((a, b) => a + b, 0) / trust.length

    return {
      study: 'TrustLock User Study',
      submitted_at: new Date().toISOString(),
      participant_id: participantId.trim() || null,
      sus_responses: sus,
      sus_score: susScore,
      trust_responses: trust,
      trust_mean: Number(trustMean.toFixed(2)),
      qualitative: qualAnswers,
    }
  }

  async function handleSubmit() {
    const missingSus = susAnswers.findIndex((a) => a === null)
    const missingTrust = trustAnswers.findIndex((a) => a === null)

    if (missingSus !== -1) {
      setValidationMsg('Please answer all rating questions before submitting.')
      document
        .getElementById(`item-sus-${missingSus + 1}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (missingTrust !== -1) {
      setValidationMsg('Please answer all rating questions before submitting.')
      document
        .getElementById(`item-trust-${missingTrust + 1}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setValidationMsg('')

    const body = buildPayload()
    setPayload(body)
    setSubmitting(true)
    setSubmitError(null)

    try {
      const res = await fetch('/api/questionnaire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setSubmitted(true)
    } catch {
      setSubmitError(
        "Couldn't reach the server — your connection may have dropped. You can retry, or download a backup copy so your answers aren't lost.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  function downloadBackup() {
    if (!payload) return
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const idPart = payload.participant_id ?? 'anonymous'
    a.href = url
    a.download = `trustlock-response-${idPart}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shieldHeight = 26 * Math.min(1, Math.max(0, overallFrac))

  return (
    <div className={`${styles.qfRoot} ${fraunces.variable} ${inter.variable} ${plexMono.variable}`}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <ShieldMark />
            <span className={styles.brandName}>TrustLock</span>
          </div>
          <div className={styles.progressShield}>
            <span className={styles.progressLabel}>{sectionsComplete} / 3 sections</span>
            <svg viewBox="0 0 24 26" width="22" height="24">
              <path
                d="M12 1 L22 5 V12.5 C22 18.5 17.8 22.7 12 25 C6.2 22.7 2 18.5 2 12.5 V5 L12 1Z"
                stroke="#316248"
                strokeWidth="1.6"
                fill="#161f1b"
              />
              <clipPath id="fillClip">
                <rect x="0" y={26 - shieldHeight} width="24" height={shieldHeight} />
              </clipPath>
              <path
                d="M12 1 L22 5 V12.5 C22 18.5 17.8 22.7 12 25 C6.2 22.7 2 18.5 2 12.5 V5 L12 1Z"
                fill="#5ab482"
                clipPath="url(#fillClip)"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className={styles.wrap}>
        {!submitted && (
          <>
            <section className={styles.hero}>
              <div className={styles.eyebrow}>User Research · TrustLock</div>
              <h1>Help shape how TrustLock earns your trust.</h1>
              <p className={styles.lede}>
                This short questionnaire follows the tasks your facilitator just walked you
                through. It takes about 5–8 minutes. There are no right answers — we&apos;re
                testing the app, not you.
              </p>
            </section>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Before you start</h3>
              <p className={styles.cardSub}>
                This is a test session for TrustLock, an escrow platform for online buying and
                selling — whether you were invited directly into a transaction or found one by
                browsing the marketplace. Please confirm you understand the following:
              </p>
              <ul className={styles.consentList}>
                <li>
                  <Check /> No real money or real personal financial data is used anywhere in
                  this session — all card, PIN, and ID numbers are test values.
                </li>
                <li>
                  <Check /> Your answers are recorded for research purposes only, kept anonymous
                  or under a participant code, and reported in aggregate.
                </li>
                <li>
                  <Check /> You can skip any question or stop at any time, with no effect on you
                  personally.
                </li>
                <li>
                  <Check /> You are 18 or older.
                </li>
              </ul>

              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel} htmlFor="participantId">
                  Participant code (given by your facilitator — or leave blank)
                </label>
                <input
                  type="text"
                  id="participantId"
                  placeholder="e.g. P07"
                  value={participantId}
                  onChange={(e) => setParticipantId(e.target.value)}
                  disabled={started}
                />
              </div>

              <label className={styles.agreeRow} htmlFor="agreeBox">
                <input
                  type="checkbox"
                  id="agreeBox"
                  checked={agreed}
                  disabled={started}
                  onChange={(e) => setAgreed(e.target.checked)}
                />
                <span>I&apos;ve read the above and I&apos;m happy to continue.</span>
              </label>

              {!started && (
                <div className={styles.ctaRow}>
                  <button
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    disabled={!agreed}
                    onClick={begin}
                  >
                    Begin questionnaire
                  </button>
                  <span className={styles.hint}>Takes about 5–8 minutes</span>
                </div>
              )}
            </div>
          </>
        )}

        {started && !submitted && (
          <div>
            <div className={styles.sectionHead}>
              <div className={styles.sectionTag}>Part A</div>
              <h2>How the app felt to use</h2>
              <p className={styles.sectionDesc}>
                Rate how much you agree with each statement, based on the tasks you just
                completed. 1 = strongly disagree, 5 = strongly agree.
              </p>
            </div>
            <div id="susItems">
              {SUS_ITEMS.map((text, i) => (
                <div className={styles.item} id={`item-sus-${i + 1}`} key={i}>
                  <div className={styles.itemNum}>{i + 1} / 10</div>
                  <div className={styles.itemText}>{text}</div>
                  <Likert
                    name={`sus_${i + 1}`}
                    value={susAnswers[i]}
                    onChange={(v) =>
                      setSusAnswers((prev) => prev.map((p, idx) => (idx === i ? v : p)))
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.sectionHead}>
              <div className={styles.sectionTag}>Part B</div>
              <h2>How much you trust TrustLock</h2>
              <p className={styles.sectionDesc}>
                Same scale — 1 = strongly disagree, 5 = strongly agree.
              </p>
            </div>
            <div>
              {TRUST_ITEMS.map((item, i) => (
                <div className={styles.item} id={`item-trust-${i + 1}`} key={i}>
                  <div className={styles.itemNum}>{i + 1} / 7</div>
                  <div className={styles.itemText}>
                    {item.text}
                    {item.tag && <span className={styles.dimTag}>{item.tag}</span>}
                  </div>
                  <Likert
                    name={`trust_${i + 1}`}
                    value={trustAnswers[i]}
                    onChange={(v) =>
                      setTrustAnswers((prev) => prev.map((p, idx) => (idx === i ? v : p)))
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.sectionHead}>
              <div className={styles.sectionTag}>Part C</div>
              <h2>In your own words</h2>
              <p className={styles.sectionDesc}>Optional, but genuinely the most useful part for us.</p>
            </div>
            <div>
              {QUAL_ITEMS.map((item) => (
                <div className={styles.qualBlock} key={item.id}>
                  <label htmlFor={item.id}>{item.text}</label>
                  <textarea
                    id={item.id}
                    placeholder="Type as much or as little as you like..."
                    value={qualAnswers[item.id]}
                    onChange={(e) =>
                      setQualAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className={styles.submitArea}>
              <button
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting…' : 'Submit responses'}
              </button>
              {validationMsg && <span className={styles.validationMsg}>{validationMsg}</span>}
              <p className={styles.submitNote}>
                Submitting sends your responses to TrustLock&apos;s research team. Nothing is
                shared outside the study.
              </p>
              {submitError && (
                <div className={styles.errorBox}>
                  <p>{submitError}</p>
                  <div className={styles.errorActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit}>
                      Retry
                    </button>
                    <button className={`${styles.btn} ${styles.btnGhost}`} onClick={downloadBackup}>
                      Download backup copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {submitted && (
          <div className={styles.thankyou}>
            <svg width="64" height="70" viewBox="0 0 24 26">
              <path
                d="M12 1 L22 5 V12.5 C22 18.5 17.8 22.7 12 25 C6.2 22.7 2 18.5 2 12.5 V5 L12 1Z"
                fill="#5ab482"
              />
              <path
                d="M8 12.7 L11 15.8 L16.3 9.6"
                stroke="#06120c"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2>Thanks — that&apos;s everything.</h2>
            <p>Your responses have been recorded. You&apos;re free to close this page.</p>
            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={downloadBackup}>
              Download a copy for yourself
            </button>
          </div>
        )}

        <footer className={styles.footer}>
          <span>TrustLock research · trustlock.site/questionnaire</span>
          <span>Formative usability &amp; trust study</span>
        </footer>
      </div>
    </div>
  )
}

function Check() {
  return (
    <span className={styles.checkMark}>
      <svg viewBox="0 0 12 12" width="11" height="11">
        <path
          d="M2 6.5L4.7 9L10 3"
          stroke="#5ab482"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function ShieldMark() {
  return (
    <svg viewBox="0 0 24 26" width="20" height="22">
      <path
        d="M12 1 L22 5 V12.5 C22 18.5 17.8 22.7 12 25 C6.2 22.7 2 18.5 2 12.5 V5 L12 1Z"
        fill="#5ab482"
      />
      <path
        d="M8 12.7 L11 15.8 L16.3 9.6"
        stroke="#06120c"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
