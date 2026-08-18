# Paper Plane Park ✈️

A gentle browser game made for **Grayson Alipour** (7). One evening in Grace Park,
one paper plane, and ten questions about a brave school day. Kind, honest,
courageous answers give the plane a bigger push — and every answer decides where
in the park it lands next, so the story takes a different route each time.

> Inspiration for game: Mama (Grace Alipour) · Creator: Dada (Nima Alipour)

## How to play

Open **`paper-plane-park/index.html`** in any browser — double-click it, no server,
no install, no internet needed.

Want one file to send to a phone or tablet? Run `node paper-plane-park/build-standalone.js`
to produce **`paper-plane-park/paper-plane-park.html`**, which has the CSS and
JavaScript inlined — email it, AirDrop it, or drop it in a cloud folder, and it plays
on its own.

* A short **How to Fly** card opens the game — the narrator tells the pilot that
  braver, kinder answers push the plane farther, and that there are three do-overs.
  It appears from the title screen; "Fly Again" jumps straight back into the park.
* Tap (or click) an answer, or press `1` `2` `3` `4` for whatever is listed at that
  spot — the answers appear in a different order every time, so the best one is never
  just "always press 1".
* Watch the plane fly. The bigger the answer, the farther it goes.
* After each landing, the reply doesn't just score the answer — on questions with a
  real better-and-worse (worries, unkindness, mistakes, peer pressure...) it explains
  *why* that choice flies farther or shorter than the others. Purely subjective
  questions (what excites you, what you want to be remembered for) keep simple warm
  replies with no ranking lecture.
* **3 do-overs per flight**: every landing card offers "Do-over — fly that one again".
  The plane loops back to that stop, the feet roll back, and the question opens
  again for a different answer. The journey map only records the final answer.
* Tap anywhere to keep flying.
* 11 stops on the brave route, up to **550 ft**. A wobbly answer sends the plane to a
  gentler place first, so a run can be up to 15 stops. The best distance is remembered
  on that device.
* The ending screen maps the whole journey — every place the plane landed and what it
  earned there.
* Every stop is **read out loud automatically** by a warm recorded voice — the story,
  the question and all the choices, with each choice lighting up as it is spoken. The
  🗣️ button turns read-aloud off and on, and **🔊 Read it to me** on the card reads it
  again. Every line ships as a pre-recorded neural-voice clip (13.9 minutes of audio in
  `paper-plane-park/voice/`); the device's built-in voice is only the offline fallback.
* The park has sound: a launch whoosh, wind that follows the plane, a landing thump
  and chime that climb with better answers, birdsong and a soft breeze. The speaker
  button silences everything at once.

## The story

The run is a walk across Grace Park at sunset, told as a map of places rather than a
list of questions. The plane always starts on the Take-Off Lawn and always finishes in
the Star Meadow; what happens in between depends on the answers.

**The main route** — Take-Off Lawn → Whispering Willow → Friendship Bench → Duck Pond →
Kite Hill → Chalk Rock → Windy Field → Climbing Tree → Little Bridge → Lantern Path →
Star Meadow.

**Four detours** open up after a wobbly answer, and each one is a second chance rather
than a punishment:

| Answer that leads there | Detour | What it asks |
| --- | --- | --- |
| Hiding a worry at the Willow | The Quiet Hollow | It's bedtime and the worry is still there — now what? |
| Hitting back at the Duck Pond | The Mud Puddle | It happened again at recess — now what? |
| Hiding a mistake at the Climbing Tree | The Bramble Patch | They ask what happened — what do you say? |
| Going along with it at the Little Bridge | The Crossroads | What do you do with the wobbly feeling? |

Detours are worth fewer feet than the main route, so they never turn a shaky run into
a winning one — but finding the way out of one is called out by name on the ending
screen, because it should be.

The questions come from a set of back-to-school conversation starters: what you're
excited about, what you're nervous about, when someone is unkind, when someone is
sitting alone, when you don't understand something, when you make a mistake, when you
get frustrated, what a good friend looks like, what to do when someone asks you to do
something wrong, what you want people to remember about you, and the one thing you'll
always know.

Two design rules the game sticks to:

1. **No answer is ever called wrong.** Every choice flies, and every choice gets a
   warm one-line reply. The weaker answers simply fly a shorter distance and get a
   nudge toward a braver option ("Worries get quieter when we share them").
2. **The furthest-flying answer is the healthy strategy** — name the feeling, use
   your words, ask for help, include someone — not the cleverest or fastest answer.

That means questions like *"What are you nervous about?"* score the *response*
(telling someone, drawing it out) rather than the worry itself. Being nervous is
never penalised.

## Changing the story

All the content lives at the top of `paper-plane-park/game.js` in the `SCENES` object —
plain text, one entry per place:

```js
lawn: {
  place: 'The Take-Off Lawn',
  story: 'The sun is going down over Grace Park...',
  q: 'What are you most excited about this year?',
  choices: [
    { t: 'Learning new things — I want to read bigger books!', m: 50, next: 'willow',
      f: 'Being excited to learn gives your plane a huge push!' },
    ...
  ]
}
```

* `place` — the landmark name, shown on the card and during the flight
* `story` — the line of story above the question
* `q` — the question
* `t` — the answer text on the button
* `m` — feet that answer flies (best answers `50`, wobbly ones around `15`)
* `next` — the id of the place that answer flies to, or `null` to end the story
* `f` — the friendly reply shown after the plane lands

Point two answers at different `next` ids and you've made a new fork. List any new
recovery stop in `DETOURS` so the ending screen marks it in amber and mentions it.
The longest possible flight is walked out of the graph automatically, so the medals and
the size of the park keep up on their own.

## Files

| File | What it is |
| --- | --- |
| `paper-plane-park/index.html` | The page and all the screens |
| `paper-plane-park/styles.css` | Big, kid-friendly styling |
| `paper-plane-park/game.js` | Questions, the canvas park, the flight, the game flow |
| `paper-plane-park/build-standalone.js` | Bundles everything (voice clips included) into one shareable HTML file |
| `paper-plane-park/make-voicepack.js` | Re-records the narrator (needs `pip install edge-tts`); run after editing any text |
| `paper-plane-park/voice/` + `voicepack.js` | The recorded lines and the text→clip map |

No dependencies, no build step. The game loads its voice clips and the Google Fonts
stylesheet from its own folder/CDN; offline it falls back to system fonts and the
device's built-in voice, and still plays completely.

After editing any question or story text, run `node paper-plane-park/make-voicepack.js`
to record the new lines (unchanged lines are skipped), then redeploy.
