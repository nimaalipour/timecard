# Paper Plane Park ✈️

A gentle browser game for a 7-year-old. Your child answers questions about a brave
school day, and every answer launches a paper plane across a sunny green park.
Kind, honest, courageous answers give the plane a bigger push, so the park keeps
scrolling and the total distance keeps growing.

## How to play

Open **`paper-plane-park/index.html`** in any browser — double-click it, no server,
no install, no internet needed.

Want one file to send to a phone or tablet? Run `node paper-plane-park/build-standalone.js`
to produce **`paper-plane-park/paper-plane-park.html`**, which has the CSS and
JavaScript inlined — email it, AirDrop it, or drop it in a cloud folder, and it plays
on its own.

* Tap (or click) an answer, or press `1` `2` `3` `4`.
* Watch the plane fly. The bigger the answer, the farther it goes.
* Tap anywhere to keep flying.
* 8 questions per run, up to **400 m**. The best distance is remembered on that device.
* **🔊 Read it to me** on each question reads the question and the choices out loud —
  handy for a new reader.
* The speaker button in the top right mutes the sounds.

## The idea behind the questions

The questions come from a set of back-to-school conversation starters:
what you're excited about, what you're nervous about, what to do when someone is
unkind, when someone is sitting alone, when you don't understand something,
when you make a mistake, when you get frustrated, and one kind thing for tomorrow.

Two design rules the game sticks to:

1. **No answer is ever called wrong.** Every choice flies, and every choice gets a
   warm one-line reply. The weaker answers simply fly a shorter distance and get a
   nudge toward a braver option ("Worries get quieter when we share them").
2. **The furthest-flying answer is the healthy strategy** — name the feeling, use
   your words, ask for help, include someone — not the cleverest or fastest answer.

That means questions like *"What are you nervous about?"* score the *response*
(telling someone, drawing it out) rather than the worry itself. Being nervous is
never penalised.

## Changing the questions

All the content lives at the top of `paper-plane-park/game.js` in the `QUESTIONS`
array — it's plain text and easy to edit:

```js
{
  q: 'What are you most excited about this year?',
  choices: [
    { t: 'Learning new things — I want to read bigger books!', m: 50,
      f: 'Being excited to learn gives your plane a huge push!' },
    ...
  ]
}
```

* `q` — the question
* `t` — the answer text on the button
* `m` — metres that answer flies (keep the best one at `50`, weakest around `15`)
* `f` — the friendly reply shown after the plane lands

Add or remove whole questions freely; the progress dots, the medals and the maximum
distance all recalculate themselves.

## Files

| File | What it is |
| --- | --- |
| `paper-plane-park/index.html` | The page and all the screens |
| `paper-plane-park/styles.css` | Big, kid-friendly styling |
| `paper-plane-park/game.js` | Questions, the canvas park, the flight, the game flow |
| `paper-plane-park/build-standalone.js` | Bundles the three into one shareable HTML file |

No dependencies, no build step. The only network request is for the Google Fonts
stylesheet; if it can't load, the game falls back to system fonts and still works
completely offline.
