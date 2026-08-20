/*
  Everything the Triangle Sky Race can say or show, in one place.
  Edit here, then run `node make-voicepack.js` to re-record the narrator.
  `{name}` is replaced with the pilot's name at play time; the recorded
  clips use the default pilot, and any other name falls back to the
  device's built-in voice for just those lines.
*/
(function (root) {
  'use strict';

  root.TSR_CONTENT = {

    defaultPilot: 'Grayson',

    rightFt: 50,     // a right answer soars the maximum
    wrongFt: 5,      // a wrong answer only hops forward a little
    finishFt: 350,   // 7 right answers x 50 ft — the finish line
    needRight: 7,
    lives: 3,        // 3 lives = 3 wrong answers are okay; a 4th ends the race

    howLines: [
      'Hello, pilot {name}! Welcome to the Triangle Sky Race.',
      'Listen to each triangle question, then tap your answer. A right answer sends your plane soaring 50 feet. A wrong answer only hops 5.',
      'The finish line is 350 feet away — seven right answers will get you there!',
      'You have 3 lives, so 3 misses are okay. Miss a fourth time, and the race ends early. Good luck!'
    ],
    howIcons: ['👋', '🔺', '🏁', '❤️'],

    // a few different ways to hear you got it right — the name is spoken too
    praises: [
      "You're right, {name}!",
      'Correct, {name}!',
      "That's right, {name}! Great thinking!",
      'You got it, {name}!',
      'Yes! Amazing work, {name}!',
      "Correct! You're a triangle master, {name}!"
    ],

    // gentle openers for a miss; the right answer is always read out after
    misses: [
      'Not quite.',
      'Oops — good try!',
      'Almost!'
    ],

    lastLife: 'Careful, {name} — no lives left. You need every answer now!',

    questions: [
      {
        label: 'Sides',
        story: 'The sun is up over Grace Park, and today is race day! The finish line is ' +
               '350 feet away. You fold your fastest paper plane.',
        q: 'How many sides does a triangle have?',
        choices: [
          { t: '3', ok: true },
          { t: '4' },
          { t: '2' },
          { t: '5' }
        ],
        f: 'A triangle always has exactly 3 sides. That is what "tri" means — three!'
      },
      {
        label: 'Corners',
        story: 'Three pointy kites dance in the wind above Kite Hill. Every one of them is a triangle!',
        q: 'How many corners does a triangle have?',
        choices: [
          { t: '3', ok: true },
          { t: '4' },
          { t: '6' },
          { t: '1' }
        ],
        f: 'Three sides meet at exactly 3 corners. Fancy mathematicians call the corners vertices!'
      },
      {
        label: 'Triangle spotting',
        story: 'You zoom over the picnic blanket. Something on a plate down there looks very triangle-ish...',
        q: 'Which of these is shaped like a triangle?',
        choices: [
          { t: 'A slice of pizza', ok: true },
          { t: 'A bouncy ball' },
          { t: 'A door' },
          { t: 'A shiny coin' }
        ],
        f: 'A pizza slice has 3 straight sides, so it is a triangle. Balls and coins are round, and doors are rectangles.'
      },
      {
        label: 'All the way around',
        story: 'An ant is marching all the way around a triangle drawn in chalk on the path. It takes a while.',
        q: 'A triangle has sides of 2, 3 and 4. How far is it all the way around?',
        choices: [
          { t: '9', ok: true },
          { t: '8' },
          { t: '10' },
          { t: '7' }
        ],
        f: '2 plus 3 makes 5, and 5 plus 4 makes 9. The distance all the way around a shape is called the perimeter.'
      },
      {
        label: 'Same sides',
        story: 'On Chalk Rock someone has drawn a perfect triangle. Every side is exactly the same length.',
        q: 'What do you call a triangle with all 3 sides the same?',
        choices: [
          { t: 'Equilateral', ok: true },
          { t: 'A square' },
          { t: 'Lopsided' },
          { t: 'A trapezoid' }
        ],
        f: 'Equilateral means "all equal sides". It is the neatest, most even triangle there is.'
      },
      {
        label: 'Cut the square',
        story: 'A kid by the pond folds a paper square, then cuts it corner to corner. Snip!',
        q: 'If you cut a square from corner to corner, what do you get?',
        choices: [
          { t: 'Two triangles', ok: true },
          { t: 'Two circles' },
          { t: 'Two smaller squares' },
          { t: 'One big triangle' }
        ],
        f: 'A corner-to-corner cut splits a square into two triangles. Try it with a sandwich sometime!'
      },
      {
        label: 'Count the sides',
        story: 'Two little triangle flags flap on the back of a toy boat crossing the duck pond.',
        q: 'How many sides do 2 triangles have all together?',
        choices: [
          { t: '6', ok: true },
          { t: '5' },
          { t: '3' },
          { t: '8' }
        ],
        f: '3 sides plus 3 sides makes 6 sides all together.'
      },
      {
        label: 'Count the corners',
        story: 'Three paper triangles float down from a tree and land on the lawn beside you.',
        q: '3 triangles land on the lawn. How many corners is that all together?',
        choices: [
          { t: '9', ok: true },
          { t: '6' },
          { t: '3' },
          { t: '12' }
        ],
        f: '3 corners, plus 3, plus 3 — that makes 9. Adding 3 three times is the same as 3 times 3!'
      },
      {
        label: 'The square corner',
        story: 'Your plane glides past the book cart. Every book has a perfectly square corner.',
        q: 'A triangle with one square corner, like the corner of a book, is called a...?',
        choices: [
          { t: 'Right triangle', ok: true },
          { t: 'Left triangle' },
          { t: 'Wrong triangle' },
          { t: 'Round triangle' }
        ],
        f: 'A square corner is called a right angle, so the triangle is a right triangle. There is no such thing as a left triangle — honest!'
      },
      {
        label: 'The angle secret',
        story: 'The finish line is in sight! The wind whispers one last question — the big one.',
        q: 'Add up all 3 angles inside any triangle. What do you always get?',
        choices: [
          { t: '180 degrees', ok: true },
          { t: '100 degrees' },
          { t: '90 degrees' },
          { t: '360 degrees' }
        ],
        f: 'The 3 angles of every triangle always add up to 180 degrees. Every triangle, every time — it is one of math\'s coolest secrets!'
      }
    ],

    // win tiers by how many lives were lost on the way
    wins: {
      perfect: { emoji: '🏆', title: 'Perfect Triangle Champion!',
        msg: '{name} flew the whole race without a single miss. Every triangle in the park is cheering!' },
      star:    { emoji: '🥇', title: 'Triangle Star!',
        msg: 'What a race, {name}! You crossed the finish line like a true triangle expert.' },
      photo:   { emoji: '🏁', title: 'Photo Finish!',
        msg: 'You made it, {name} — right across the line on the very last throw! What a race!' }
    },

    lose: { title: 'The Race Is Over',
      msg: 'The triangles win this round, {name} — but now you know their secrets. ' +
           'Fly again and show them who is boss!' }
  };
})(typeof window !== 'undefined' ? window : globalThis);
